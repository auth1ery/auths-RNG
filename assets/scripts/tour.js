(function () {
	'use strict';

	const API_BASE = 'https://nosave.authsrng.xyz';

	const START_TIME = new Date('2026-08-28T20:00:00Z').getTime();

	const NAME_KEY = 'tour_player_name_v1';
	const TOKEN_KEY = 'tour_player_token_v1';

	const TIERS = [
		{
			id: 1,
			name: 'warm-up',
			basePoints: 10,
			tasks: [
				{ id: 't1a', label: 'hit "Roller" (100 rolls) as fast as possible' },
				{ id: 't1b', label: 'claim daily reward, reach a 3-day streak' },
			],
		},
		{
			id: 2,
			name: 'getting serious',
			basePoints: 25,
			tasks: [
				{ id: 't2a', label: 'pull a rarity above 1/300 ("Spammin") with no potions used' },
				{ id: 't2b', label: 'max roll speed (lv 3/3) using only roll-earned points' },
			],
		},
		{
			id: 3,
			name: 'grinding',
			basePoints: 50,
			tasks: [
				{ id: 't3a', label: 'get 1 anomaly and consume it for the permanent luck boost' },
				{ id: 't3b', label: 'complete one full gauntlet tier' },
			],
		},
		{
			id: 4,
			name: 'real commitment',
			basePoints: 100,
			tasks: [
				{ id: 't4a', label: 'pull a rarity above 1/15,000 ("Antimatter"), potions allowed' },
				{ id: 't4b', label: 'max duplicate chance (lv 10/10) and land a dupe proc on a rare' },
			],
		},
		{
			id: 5,
			name: 'endgame bragging rights',
			basePoints: 200,
			bonus: true,
			tasks: [
				{ id: 't5a', label: 'pull "oh my god" (1/50,000+) with no potions, no anomaly boosts' },
				{ id: 't5b', label: 'crystallize a run on the starmap, spend shards in the void market' },
			],
		},
		{
			id: 6,
			name: 'absolute madness',
			basePoints: 400,
			bonus: true,
			tasks: [
				{ id: 't6a', label: 'hit "Genuinely Insane" (25,000 total rolls) in one sitting' },
				{ id: 't6b', label: 'land a rarity above 1/1,000,000,000 ("ok bro")' },
			],
		},
	];

	const TIER4_WIN_THROUGH = 4;

	let playerName = localStorage.getItem(NAME_KEY) || '';
	let playerToken = localStorage.getItem(TOKEN_KEY) || '';
	let completed = {};
	let leaderboard = [];
	let serverOpen = hasStarted();
	let panelOpen = false;
	let activeTab = 'tasks';

	function hasStarted() {
		return Date.now() >= START_TIME;
	}

	function timeUntilStart() {
		return Math.max(0, START_TIME - Date.now());
	}

	function formatCountdown(ms) {
		const s = Math.floor(ms / 1000);
		const d = Math.floor(s / 86400);
		const h = Math.floor((s % 86400) / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		if (d > 0) return `${d}d ${h}h ${m}m`;
		if (h > 0) return `${h}h ${m}m ${sec}s`;
		if (m > 0) return `${m}m ${sec}s`;
		return `${sec}s`;
	}

	async function apiRegister(name) {
		const res = await fetch(`${API_BASE}/api/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name, token: playerToken }),
		});
		if (!res.ok) throw new Error('register failed: ' + res.status);
		return res.json();
	}

	async function apiComplete(taskId, snapshot) {
		const res = await fetch(`${API_BASE}/api/complete`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: playerName, token: playerToken, taskId, ...snapshot }),
		});
		if (!res.ok) throw new Error('complete failed: ' + res.status);
		return res.json();
	}

	async function apiUncomplete(taskId) {
		const res = await fetch(`${API_BASE}/api/uncomplete`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: playerName, token: playerToken, taskId }),
		});
		if (!res.ok) throw new Error('uncomplete failed: ' + res.status);
		return res.json();
	}

	async function apiLeaderboard() {
		const res = await fetch(`${API_BASE}/api/leaderboard`);
		if (!res.ok) throw new Error('leaderboard failed: ' + res.status);
		return res.json();
	}

	function snapshotGameState() {
		return {
			points: typeof window.points === 'number' ? window.points : null,
			totalRolls: typeof window.totalRolls === 'number' ? window.totalRolls : null,
			luck: typeof window.globalLuckMultiplier === 'number' ? window.globalLuckMultiplier : null,
		};
	}

	function isTaskDone(taskId) {
		return !!completed[taskId];
	}

	function tierTasksDone(tier) {
		return tier.tasks.every((t) => isTaskDone(t.id));
	}

	function computeScore() {
		let score = 0;
		TIERS.forEach((tier) => {
			tier.tasks.forEach((task) => {
				if (isTaskDone(task.id)) {
					score += tier.basePoints;
					if (tier.bonus) score += Math.floor(tier.basePoints * 0.5);
				}
			});
		});
		return score;
	}

	function reachedTier4Timestamp() {
		let latest = null;
		for (let i = 0; i < TIERS.length; i++) {
			const tier = TIERS[i];
			if (tier.id > TIER4_WIN_THROUGH) break;
			if (!tierTasksDone(tier)) return null;
			tier.tasks.forEach((t) => {
				const c = completed[t.id];
				if (c && (!latest || c.ts > latest)) latest = c.ts;
			});
		}
		return latest;
	}

	function injectStyles() {
		const style = document.createElement('style');
		style.textContent = `
			#tourBtn {
				position: fixed;
				bottom: 16px;
				right: 66px;
				width: 42px;
				height: 42px;
				background: var(--panel-bg, #131313);
				border: 1px solid var(--border-color, #303030);
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 1.05em;
				z-index: 9998;
				padding: 0;
				opacity: 0.55;
				cursor: pointer;
				color: var(--text-color, #dcdcdc);
				transition: opacity 0.2s, border-color 0.2s;
			}
			#tourBtn:hover { opacity: 1; }
			#tourPanel {
				position: fixed;
				bottom: 68px;
				right: 16px;
				width: 400px;
				max-width: calc(100vw - 32px);
				max-height: 72vh;
				background: var(--panel-bg, #131313);
				border: 1px solid var(--border-color, #303030);
				border-radius: 6px;
				z-index: 9997;
				display: flex;
				flex-direction: column;
				box-shadow: 0 8px 32px rgba(0,0,0,0.45);
				transform: translateY(8px) scale(0.97);
				opacity: 0;
				pointer-events: none;
				transition: transform 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
				overflow: hidden;
				font-family: monospace;
				color: var(--text-color, #dcdcdc);
			}
			#tourPanel.open {
				transform: translateY(0) scale(1);
				opacity: 1;
				pointer-events: auto;
			}
			#tourHeader {
				padding: 12px 14px;
				border-bottom: 1px solid var(--border-color, #303030);
				display: flex;
				flex-direction: column;
				gap: 6px;
				flex-shrink: 0;
			}
			#tourHeaderTop {
				display: flex;
				justify-content: space-between;
				align-items: center;
			}
			#tourTitle {
				font-size: 0.85em;
				opacity: 0.6;
				letter-spacing: 0.06em;
				text-transform: lowercase;
			}
			#tourClose {
				background: none;
				border: none;
				color: var(--text-color, #dcdcdc);
				font-size: 1.2em;
				cursor: pointer;
				opacity: 0.6;
				padding: 0 4px;
			}
			#tourClose:hover { opacity: 1; }
			#tourCountdown {
				font-size: 0.75em;
				opacity: 0.55;
			}
			#tourCountdown.locked { color: #fa6; opacity: 0.85; }
			#tourNameRow {
				display: flex;
				gap: 6px;
				align-items: center;
			}
			#tourNameInput {
				flex: 1;
				background: var(--input-bg, #1a1a1a);
				border: 1px solid var(--border-color, #303030);
				color: var(--text-color, #dcdcdc);
				font-family: monospace;
				font-size: 0.8em;
				padding: 4px 7px;
				border-radius: 2px;
			}
			#tourNameBtn {
				font-size: 0.72em;
				padding: 4px 8px;
			}
			#tourStatus {
				font-size: 0.7em;
				opacity: 0.4;
				min-height: 1.2em;
			}
			#tourScoreRow {
				display: flex;
				justify-content: space-between;
				font-size: 0.8em;
				opacity: 0.75;
			}
			#tourScoreRow span.val { color: #ffb86b; }
			#tourWinFlag {
				font-size: 0.72em;
				padding: 4px 8px;
				border-radius: 3px;
				border: 1px solid #3a5a3a;
				color: #8c8;
				background: rgba(40,90,40,0.12);
				display: none;
			}
			#tourWinFlag.show { display: block; }
			#tourTabs {
				display: flex;
				border-bottom: 1px solid var(--border-color, #303030);
				flex-shrink: 0;
			}
			.tour-tab {
				flex: 1;
				background: none;
				border: none;
				border-bottom: 2px solid transparent;
				color: var(--text-color, #dcdcdc);
				font-family: monospace;
				font-size: 0.78em;
				padding: 8px;
				cursor: pointer;
				opacity: 0.5;
			}
			.tour-tab.active {
				opacity: 1;
				border-bottom-color: var(--text-color, #dcdcdc);
			}
			#tourBody {
				overflow-y: auto;
				flex: 1;
				min-height: 0;
				padding: 6px 0;
			}
			.tour-tier {
				padding: 8px 14px;
				border-bottom: 1px solid var(--border-color, #303030);
			}
			.tour-tier:last-child { border-bottom: none; }
			.tour-tier-head {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 6px;
			}
			.tour-tier-name { font-size: 0.85em; text-transform: lowercase; }
			.tour-tier-name .bonus-tag { font-size: 0.75em; opacity: 0.5; margin-left: 4px; }
			.tour-tier-pts { font-size: 0.72em; opacity: 0.4; }
			.tour-task {
				display: flex;
				align-items: flex-start;
				gap: 8px;
				padding: 6px 0;
				font-size: 0.8em;
				line-height: 1.4;
				cursor: pointer;
			}
			.tour-task input { margin-top: 3px; flex-shrink: 0; cursor: pointer; }
			.tour-task.done { opacity: 0.55; text-decoration: line-through; }
			.tour-task-meta {
				display: block;
				font-size: 0.85em;
				opacity: 0.4;
				text-decoration: none;
				margin-top: 2px;
			}
			#tourLbList { padding: 4px 14px; }
			.tour-lb-row {
				display: grid;
				grid-template-columns: 24px 1fr auto auto;
				gap: 8px;
				align-items: center;
				padding: 7px 0;
				border-bottom: 1px solid var(--border-color, #303030);
				font-size: 0.78em;
			}
			.tour-lb-row:last-child { border-bottom: none; }
			.tour-lb-rank { opacity: 0.4; }
			.tour-lb-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
			.tour-lb-name.me { color: #8dd; }
			.tour-lb-score { color: #ffb86b; }
			.tour-lb-t4 { font-size: 0.85em; opacity: 0.4; }
			#tourFooter {
				padding: 10px 14px;
				border-top: 1px solid var(--border-color, #303030);
				display: flex;
				gap: 6px;
				flex-shrink: 0;
			}
			#tourFooter button { flex: 1; font-size: 0.78em; padding: 6px; }
			#tourRefreshBtn { opacity: 0.7; }
		`;
		document.head.appendChild(style);
	}

	function buildUI() {
		const btn = document.createElement('button');
		btn.id = 'tourBtn';
		btn.title = 'tournament tracker';
		btn.textContent = '\u{1F3C6}';
		document.body.appendChild(btn);

		const panel = document.createElement('div');
		panel.id = 'tourPanel';
		panel.innerHTML = `
			<div id="tourHeader">
				<div id="tourHeaderTop">
					<span id="tourTitle">tournament tracker</span>
					<button id="tourClose">&times;</button>
				</div>
				<div id="tourCountdown"></div>
				<div id="tourNameRow">
					<input id="tourNameInput" type="text" maxlength="40" placeholder="your name..." />
					<button id="tourNameBtn" class="small">join</button>
				</div>
				<div id="tourStatus"></div>
				<div id="tourScoreRow">
					<span>score: <span class="val" id="tourScoreVal">0</span></span>
					<span id="tourTier4Ts"></span>
				</div>
				<div id="tourWinFlag"></div>
			</div>
			<div id="tourTabs">
				<button class="tour-tab active" data-tab="tasks">tasks</button>
				<button class="tour-tab" data-tab="leaderboard">leaderboard</button>
			</div>
			<div id="tourBody"></div>
			<div id="tourFooter">
				<button id="tourRefreshBtn" class="small">refresh</button>
			</div>
		`;
		document.body.appendChild(panel);

		btn.addEventListener('click', () => {
			panelOpen = !panelOpen;
			panel.classList.toggle('open', panelOpen);
			if (panelOpen) {
				renderBody();
				if (activeTab === 'leaderboard') refreshLeaderboard();
			}
		});

		document.getElementById('tourClose').addEventListener('click', () => {
			panelOpen = false;
			panel.classList.remove('open');
		});

		document.addEventListener('pointerdown', (e) => {
			if (!panelOpen) return;
			if (!panel.contains(e.target) && !btn.contains(e.target)) {
				panelOpen = false;
				panel.classList.remove('open');
			}
		});

		document.querySelectorAll('.tour-tab').forEach((tab) => {
			tab.addEventListener('click', () => {
				activeTab = tab.dataset.tab;
				document
					.querySelectorAll('.tour-tab')
					.forEach((t) => t.classList.toggle('active', t === tab));
				if (activeTab === 'leaderboard') refreshLeaderboard();
				renderBody();
			});
		});

		const nameInput = document.getElementById('tourNameInput');
		nameInput.value = playerName;

		document
			.getElementById('tourNameBtn')
			.addEventListener('click', () => joinTournament(nameInput.value));
		nameInput.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') joinTournament(nameInput.value);
		});

		document.getElementById('tourRefreshBtn').addEventListener('click', async () => {
			setStatus('refreshing...');
			try {
				if (playerName && playerToken) await refreshState();
				await refreshLeaderboard();
				setStatus('synced');
			} catch (e) {
				setStatus('sync failed, check connection');
			}
			renderBody();
			updateHeader();
		});

		renderBody();
		updateHeader();
		setInterval(updateHeader, 1000);

		if (playerName && playerToken) {
			refreshState()
				.then(() => {
					updateHeader();
					renderBody();
				})
				.catch(() => setStatus('could not reach server, showing cached state'));
		}
	}

	function setStatus(text) {
		const el = document.getElementById('tourStatus');
		if (el) el.textContent = text;
	}

	async function joinTournament(name) {
		name = (name || '').trim().slice(0, 40);
		if (!name) return setStatus('enter a name first');
		setStatus('joining...');
		try {
			const res = await apiRegister(name);
			playerName = res.name;
			playerToken = res.token;
			completed = res.completed || {};
			localStorage.setItem(NAME_KEY, playerName);
			localStorage.setItem(TOKEN_KEY, playerToken);
			setStatus(res.isNew ? 'joined!' : 'welcome back');
			renderBody();
			updateHeader();
			await refreshLeaderboard();
		} catch (e) {
			setStatus('could not join, name may be taken or server unreachable');
		}
	}

	async function refreshState() {
		const res = await fetch(`${API_BASE}/api/state?name=${encodeURIComponent(playerName)}`);
		if (!res.ok) throw new Error('state fetch failed');
		const data = await res.json();
		completed = data.completed || {};
	}

	async function refreshLeaderboard() {
		try {
			const data = await apiLeaderboard();
			leaderboard = data.rows || [];
			serverOpen = !!data.open;
			renderBody();
		} catch (e) {
			// leave stale leaderboard in place
		}
	}

	function updateHeader() {
		const cdEl = document.getElementById('tourCountdown');
		const scoreEl = document.getElementById('tourScoreVal');
		const t4El = document.getElementById('tourTier4Ts');
		const winFlag = document.getElementById('tourWinFlag');
		if (!cdEl) return;

		const open = serverOpen || hasStarted();
		if (!open) {
			cdEl.textContent = `starts in: ${formatCountdown(timeUntilStart())}`;
			cdEl.classList.add('locked');
		} else {
			cdEl.textContent = 'tournament is live';
			cdEl.classList.remove('locked');
		}

		scoreEl.textContent = computeScore();

		const t4ts = reachedTier4Timestamp();
		if (t4ts) {
			const d = new Date(t4ts);
			t4El.textContent = `tier 4: ${d.toLocaleString()}`;
			winFlag.textContent = 'qualified for tier 4 win condition';
			winFlag.classList.add('show');
		} else {
			t4El.textContent = '';
			winFlag.classList.remove('show');
		}

		document.querySelectorAll('.tour-task input').forEach((cb) => {
			cb.disabled = !open || !playerName;
		});
	}

	function renderBody() {
		const body = document.getElementById('tourBody');
		if (!body) return;
		body.innerHTML = '';

		if (activeTab === 'leaderboard') {
			renderLeaderboard(body);
			return;
		}

		if (!playerName) {
			const note = document.createElement('div');
			note.style.cssText =
				'padding: 20px 14px; font-size: 0.8em; opacity: 0.5; text-align: center;';
			note.textContent = 'enter a name above and hit join to start tracking your progress.';
			body.appendChild(note);
			return;
		}

		const open = serverOpen || hasStarted();

		TIERS.forEach((tier) => {
			const tierEl = document.createElement('div');
			tierEl.className = 'tour-tier';

			const head = document.createElement('div');
			head.className = 'tour-tier-head';
			head.innerHTML = `
				<span class="tour-tier-name">tier ${tier.id}: ${tier.name}${tier.bonus ? '<span class="bonus-tag">(bonus)</span>' : ''}</span>
				<span class="tour-tier-pts">${tier.basePoints}pt${tier.bonus ? ' +50% bonus' : ''}</span>
			`;
			tierEl.appendChild(head);

			tier.tasks.forEach((task) => {
				const done = isTaskDone(task.id);
				const row = document.createElement('label');
				row.className = 'tour-task' + (done ? ' done' : '');

				const cb = document.createElement('input');
				cb.type = 'checkbox';
				cb.checked = done;
				cb.disabled = !open;

				const textWrap = document.createElement('span');
				textWrap.textContent = task.label;

				if (done) {
					const c = completed[task.id];
					const meta = document.createElement('span');
					meta.className = 'tour-task-meta';
					const parts = [];
					if (c.ts) parts.push(new Date(c.ts).toLocaleString());
					if (c.points != null) parts.push(`pts: ${c.points}`);
					if (c.totalRolls != null) parts.push(`rolls: ${c.totalRolls}`);
					if (c.luck != null) parts.push(`luck: ${c.luck.toFixed(1)}x`);
					meta.textContent = parts.join(' \u00b7 ');
					textWrap.appendChild(document.createElement('br'));
					textWrap.appendChild(meta);
				}

				cb.addEventListener('change', async () => {
					const wantsChecked = cb.checked;
					cb.disabled = true;
					try {
						if (wantsChecked) {
							const snap = snapshotGameState();
							const res = await apiComplete(task.id, snap);
							completed = res.completed;
							setStatus('recorded');
						} else {
							const res = await apiUncomplete(task.id);
							completed = res.completed;
							setStatus('updated');
						}
						renderBody();
						updateHeader();
					} catch (e) {
						cb.checked = !wantsChecked;
						setStatus('could not sync, try again');
						cb.disabled = !(serverOpen || hasStarted());
					}
				});

				row.appendChild(cb);
				row.appendChild(textWrap);
				tierEl.appendChild(row);
			});

			body.appendChild(tierEl);
		});
	}

	function renderLeaderboard(body) {
		const wrap = document.createElement('div');
		wrap.id = 'tourLbList';

		if (leaderboard.length === 0) {
			const note = document.createElement('div');
			note.style.cssText = 'padding: 20px 0; font-size: 0.8em; opacity: 0.4; text-align: center;';
			note.textContent = 'no entries yet, or leaderboard has not loaded.';
			wrap.appendChild(note);
		}

		leaderboard.forEach((row, i) => {
			const rowEl = document.createElement('div');
			rowEl.className = 'tour-lb-row';
			const isMe = row.name === playerName;
			rowEl.innerHTML = `
				<span class="tour-lb-rank">${i + 1}</span>
				<span class="tour-lb-name${isMe ? ' me' : ''}">${escapeHtml(row.name)}</span>
				<span class="tour-lb-score">${row.score}</span>
				<span class="tour-lb-t4">${row.tier4Ts ? new Date(row.tier4Ts).toLocaleDateString() : ''}</span>
			`;
			wrap.appendChild(rowEl);
		});

		body.appendChild(wrap);
	}

	function escapeHtml(s) {
		const div = document.createElement('div');
		div.textContent = s;
		return div.innerHTML;
	}

	function init() {
		injectStyles();
		buildUI();
		refreshLeaderboard();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
