(function () {
	'use strict';

	/* ---------- shared helpers ---------- */
	function todayStr() {
		const d = new Date();
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}
	function safeCall(fnName) {
		if (typeof window[fnName] === 'function') {
			try {
				window[fnName]();
			} catch (e) {
				console.warn(`[mobile-features] ${fnName} failed:`, e);
			}
		}
	}
	function fmt(n) {
		return typeof window.formatNum === 'function' ? window.formatNum(n) : String(Math.round(n));
	}
	function toast(msg) {
		if (typeof window.showAnomalyPopup === 'function') window.showAnomalyPopup(msg);
	}

	/* ---------- injected styles ---------- */
	const style = document.createElement('style');
	style.textContent = `
#mfFab {
	position: fixed;
	bottom: 16px;
	right: 16px;
	z-index: 9998;
	display: none;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: 12px 16px;
	border-radius: 24px;
	background: var(--panel-bg, #131313);
	border: 1px solid var(--border-color, #303030);
	color: var(--text-color, #dcdcdc);
	font-family: monospace;
	font-size: 0.85em;
	cursor: pointer;
	box-shadow: 0 4px 16px rgb(0 0 0 / 40%);
	transition: transform 0.15s ease, opacity 0.15s ease;
}
#mfFab:active { transform: scale(0.94); }
#mfFab.mf-pulse { animation: mfFabPulse 1.6s ease-in-out infinite; }
@keyframes mfFabPulse {
	0%, 100% { box-shadow: 0 0 0 0 rgb(220 220 220 / 25%); }
	50% { box-shadow: 0 0 0 8px rgb(220 220 220 / 0%); }
}
#mfCalendarBtn { margin-top: 10px; width: 100%; }
#mfCalendarModal, #mfOfflineModal {
	display: none;
	position: fixed;
	inset: 0;
	background: rgb(0 0 0 / 85%);
	z-index: 10004;
	align-items: center;
	justify-content: center;
}
#mfCalendarModal.show, #mfOfflineModal.show { display: flex; }
.mf-modal-inner {
	background: var(--panel-bg, #131313);
	border: 1px solid var(--border-color, #303030);
	border-radius: 4px;
	padding: 24px;
	max-width: 360px;
	width: 90%;
	text-align: center;
	color: var(--text-color, #dcdcdc);
}
.mf-cal-grid {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 6px;
	margin: 16px 0;
}
.mf-cal-cell {
	aspect-ratio: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	border: 1px solid var(--border-color, #303030);
	border-radius: 3px;
	font-size: 0.68em;
	background: var(--overlay-bg, #0c0c0c);
	opacity: 0.5;
	gap: 2px;
}
.mf-cal-cell.mf-done { opacity: 1; border-color: #3a5a3a; background: rgb(40 90 40 / 12%); color: #8c8; }
.mf-cal-cell.mf-today { opacity: 1; border-color: var(--text-color, #dcdcdc); }
.mf-cal-cell .mf-cal-pts { opacity: 0.6; }
.mf-modal-close { width: 100%; padding: 10px; margin-top: 8px; }
`;
	document.head.appendChild(style);

	(function initHaptics() {
		if (!('vibrate' in navigator)) return;
		if (typeof window.addToInventory !== 'function') return;

		function hapticFor(rarityObj) {
			if (!rarityObj || !rarityObj.chance) return;
			const threshold = window.rareThreshold || 1000;
			const oneIn = Math.round(1 / rarityObj.chance);
			let pattern;
			if (oneIn >= 100000) pattern = [100, 50, 100, 50, 100, 50, 150];
			else if (oneIn >= 10000) pattern = [60, 40, 60, 40, 80];
			else if (oneIn >= threshold) pattern = [40, 30, 40];
			else if (oneIn >= 100) pattern = [25];
			else pattern = [10];
			try {
				navigator.vibrate(pattern);
			} catch (e) {}
		}

		const _origAddToInventory = window.addToInventory;
		window.addToInventory = function (rarityObj, skipEffects) {
			_origAddToInventory(rarityObj, skipEffects);
			if (!skipEffects) hapticFor(rarityObj);
		};
	})();

	(function initCalendar() {
		const REWARDS = [25, 40, 60, 90, 130, 180, 300];

		function cycleDay() {
			const streak = Number(localStorage.getItem('daily_streak') || 0);
			if (streak <= 0) return 0;
			return (streak - 1) % 7;
		}

		function grantIfDue() {
			const today = todayStr();
			if (localStorage.getItem('mfCalRewardDate') === today) return;
			if (localStorage.getItem('daily_lastClaim') !== today) return; // only after the real daily claim lands
			const day = cycleDay();
			const reward = REWARDS[day];
			if (typeof points === 'undefined') return;
			points += reward;
			safeCall('updatePointsDisplay');
			safeCall('updateShopUI');
			safeCall('saveAllData');
			localStorage.setItem('mfCalRewardDate', today);
			toast(`calendar bonus: +${fmt(reward)} pts (day ${day + 1}/7)`);
			renderCalendar();
		}

		function renderCalendar() {
			const grid = document.getElementById('mfCalGrid');
			if (!grid) return;
			grid.innerHTML = '';
			const claimedToday = localStorage.getItem('daily_lastClaim') === todayStr();
			const day = cycleDay();
			for (let i = 0; i < 7; i++) {
				const cell = document.createElement('div');
				cell.className = 'mf-cal-cell';
				if (i < day || (i === day && claimedToday)) cell.classList.add('mf-done');
				else if (i === day) cell.classList.add('mf-today');
				cell.innerHTML = `<div>day ${i + 1}</div><div class="mf-cal-pts">${fmt(REWARDS[i])}</div>`;
				grid.appendChild(cell);
			}
		}

		function buildUI() {
			const container = document.getElementById('dailyContainer');
			if (!container || document.getElementById('mfCalendarBtn')) return;

			const btn = document.createElement('button');
			btn.id = 'mfCalendarBtn';
			btn.className = 'small';
			btn.textContent = 'view streak calendar';
			container.appendChild(btn);

			const modal = document.createElement('div');
			modal.id = 'mfCalendarModal';
			modal.innerHTML = `
				<div class="mf-modal-inner">
					<div style="font-size:1.1em;margin-bottom:4px;">7-day streak calendar</div>
					<div style="font-size:0.75em;opacity:0.5;">claim your daily to fill in today's slot</div>
					<div class="mf-cal-grid" id="mfCalGrid"></div>
					<button class="mf-modal-close small">close</button>
				</div>`;
			document.body.appendChild(modal);

			btn.addEventListener('click', () => {
				renderCalendar();
				modal.classList.add('show');
			});
			modal.querySelector('.mf-modal-close').addEventListener('click', () => modal.classList.remove('show'));
			modal.addEventListener('click', (e) => {
				if (e.target === modal) modal.classList.remove('show');
			});

			const dailyBtn = document.getElementById('dailyBtn');
			// runs AFTER main.js's own click handler. listeners on the
			// same element fire in registration order, and main.js's
			// handler already writes daily_lastClaim synchronously
			// before its first `await`.
			if (dailyBtn) dailyBtn.addEventListener('click', () => setTimeout(grantIfDue, 0));
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', buildUI);
		} else {
			buildUI();
		}
	})();

	(function initFab() {
		function buildFab() {
			if (document.getElementById('mfFab')) return document.getElementById('mfFab');
			const fab = document.createElement('button');
			fab.id = 'mfFab';
			document.body.appendChild(fab);
			return fab;
		}

		function weeklyReady() {
			const lc = localStorage.getItem('weekly_lastClaim');
			return !lc || Date.now() - Number(lc) >= 6048e5;
		}

		function update() {
			const fab = buildFab();
			const dailyReady = localStorage.getItem('daily_lastClaim') !== todayStr();
			const anomCount = Number(localStorage.getItem('anomalies') || 0);

			fab.classList.remove('mf-pulse');
			if (dailyReady) {
				fab.textContent = '🎁 claim daily';
				fab.style.display = 'flex';
				fab.classList.add('mf-pulse');
				fab.onclick = () => {
					const b = document.getElementById('dailyBtn');
					if (b) b.click();
				};
			} else if (weeklyReady()) {
				fab.textContent = '📅 claim weekly';
				fab.style.display = 'flex';
				fab.classList.add('mf-pulse');
				fab.onclick = () => {
					const b = document.getElementById('weeklyBtn');
					if (b) b.click();
				};
			} else if (anomCount > 0) {
				fab.textContent = `⚡ consume ${anomCount}`;
				fab.style.display = 'flex';
				fab.onclick = () => safeCall('consumeAllAnomalies');
			} else {
				fab.style.display = 'none';
			}
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', update);
		} else {
			update();
		}
		setInterval(update, 4000);
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) update();
		});
	})();

	(function initOfflineEarnings() {
		const LAST_SEEN_KEY = 'mfLastSeen';
		const CAP_MS = 2 * 60 * 60 * 1000; // 2 hours
		const MIN_AWAY_MS = 60 * 1000; // don't bother for <1 min gaps

		function markSeen() {
			try {
				localStorage.setItem(LAST_SEEN_KEY, String(Date.now()));
			} catch (e) {}
		}

		function showOfflineModal(earned, awaySeconds) {
			let modal = document.getElementById('mfOfflineModal');
			if (!modal) {
				modal = document.createElement('div');
				modal.id = 'mfOfflineModal';
				document.body.appendChild(modal);
			}
			const mins = Math.floor(awaySeconds / 60);
			modal.innerHTML = `
				<div class="mf-modal-inner">
					<div style="font-size:2em;margin-bottom:10px;">💤</div>
					<div style="font-size:1.05em;margin-bottom:6px;">welcome back!</div>
					<div style="font-size:0.85em;opacity:0.7;margin-bottom:10px;">your printer kept working while you were away (${mins}m)</div>
					<div style="font-size:1.4em;color:#ffb86b;">+${fmt(earned)} points</div>
					<button class="mf-modal-close small">nice!</button>
				</div>`;
			modal.classList.add('show');
			modal.querySelector('.mf-modal-close').addEventListener('click', () => modal.classList.remove('show'));
			modal.addEventListener('click', (e) => {
				if (e.target === modal) modal.classList.remove('show');
			});
		}

		function checkOfflineEarnings() {
			const lastSeenRaw = localStorage.getItem(LAST_SEEN_KEY);
			markSeen();
			if (!lastSeenRaw) return;

			const away = Date.now() - Number(lastSeenRaw);
			if (away < MIN_AWAY_MS) return;
			if (typeof shopUpgrades === 'undefined' || !shopUpgrades.printer) return;

			const cappedMs = Math.min(away, CAP_MS);
			const earned = Math.floor((cappedMs / 1000) * shopUpgrades.printer);
			if (earned <= 0) return;
			if (typeof points === 'undefined') return;

			points += earned;
			safeCall('updatePointsDisplay');
			safeCall('updateShopUI');
			safeCall('saveAllData');
			showOfflineModal(earned, cappedMs / 1000);
		}

		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', checkOfflineEarnings);
		} else {
			checkOfflineEarnings();
		}
		document.addEventListener('visibilitychange', () => {
			if (document.hidden) markSeen();
		});
		window.addEventListener('pagehide', markSeen);
		window.addEventListener('beforeunload', markSeen);
	})();
})();