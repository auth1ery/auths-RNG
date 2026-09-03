!(function () {
	'use strict';
	function t() {
		const t = new Date();
		return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
	}
	function e(t) {
		if ('function' == typeof window[t])
			try {
				window[t]();
			} catch (e) {
				console.warn(`[mobile-features] ${t} failed:`, e);
			}
	}
	function n(t) {
		return 'function' == typeof window.formatNum ? window.formatNum(t) : String(Math.round(t));
	}
	const o = document.createElement('style');
	((o.textContent =
		'\n#mfFab {\n\tposition: fixed;\n\tbottom: 16px;\n\tright: 16px;\n\tz-index: 9998;\n\tdisplay: none;\n\talign-items: center;\n\tjustify-content: center;\n\tgap: 6px;\n\tpadding: 12px 16px;\n\tborder-radius: 24px;\n\tbackground: var(--panel-bg, #131313);\n\tborder: 1px solid var(--border-color, #303030);\n\tcolor: var(--text-color, #dcdcdc);\n\tfont-family: monospace;\n\tfont-size: 0.85em;\n\tcursor: pointer;\n\tbox-shadow: 0 4px 16px rgb(0 0 0 / 40%);\n\ttransition: transform 0.15s ease, opacity 0.15s ease;\n}\n#mfFab:active { transform: scale(0.94); }\n#mfFab.mf-pulse { animation: mfFabPulse 1.6s ease-in-out infinite; }\n@keyframes mfFabPulse {\n\t0%, 100% { box-shadow: 0 0 0 0 rgb(220 220 220 / 25%); }\n\t50% { box-shadow: 0 0 0 8px rgb(220 220 220 / 0%); }\n}\n#mfCalendarBtn { margin-top: 10px; width: 100%; }\n#mfCalendarModal, #mfOfflineModal {\n\tdisplay: none;\n\tposition: fixed;\n\tinset: 0;\n\tbackground: rgb(0 0 0 / 85%);\n\tz-index: 10004;\n\talign-items: center;\n\tjustify-content: center;\n}\n#mfCalendarModal.show, #mfOfflineModal.show { display: flex; }\n.mf-modal-inner {\n\tbackground: var(--panel-bg, #131313);\n\tborder: 1px solid var(--border-color, #303030);\n\tborder-radius: 4px;\n\tpadding: 24px;\n\tmax-width: 360px;\n\twidth: 90%;\n\ttext-align: center;\n\tcolor: var(--text-color, #dcdcdc);\n}\n.mf-cal-grid {\n\tdisplay: grid;\n\tgrid-template-columns: repeat(7, 1fr);\n\tgap: 6px;\n\tmargin: 16px 0;\n}\n.mf-cal-cell {\n\taspect-ratio: 1;\n\tdisplay: flex;\n\tflex-direction: column;\n\talign-items: center;\n\tjustify-content: center;\n\tborder: 1px solid var(--border-color, #303030);\n\tborder-radius: 3px;\n\tfont-size: 0.68em;\n\tbackground: var(--overlay-bg, #0c0c0c);\n\topacity: 0.5;\n\tgap: 2px;\n}\n.mf-cal-cell.mf-done { opacity: 1; border-color: #3a5a3a; background: rgb(40 90 40 / 12%); color: #8c8; }\n.mf-cal-cell.mf-today { opacity: 1; border-color: var(--text-color, #dcdcdc); }\n.mf-cal-cell .mf-cal-pts { opacity: 0.6; }\n.mf-modal-close { width: 100%; padding: 10px; margin-top: 8px; }\n'),
		document.head.appendChild(o),
		(function () {
			if (!('vibrate' in navigator)) return;
			if ('function' != typeof window.addToInventory) return;
			const t = window.addToInventory;
			window.addToInventory = function (e, n) {
				(t(e, n),
					n ||
						(function (t) {
							if (!t || !t.chance) return;
							const e = window.rareThreshold || 1e3,
								n = Math.round(1 / t.chance);
							let o;
							o =
								n >= 1e5
									? [100, 50, 100, 50, 100, 50, 150]
									: n >= 1e4
										? [60, 40, 60, 40, 80]
										: n >= e
											? [40, 30, 40]
											: n >= 100
												? [25]
												: [10];
							try {
								navigator.vibrate(o);
							} catch (t) {}
						})(e));
			};
		})(),
		(function () {
			const o = [25, 40, 60, 90, 130, 180, 300];
			function a() {
				const t = Number(localStorage.getItem('daily_streak') || 0);
				return t <= 0 ? 0 : (t - 1) % 7;
			}
			function d() {
				const d = t();
				if (localStorage.getItem('mfCalRewardDate') === d) return;
				if (localStorage.getItem('daily_lastClaim') !== d) return;
				const l = a(),
					r = o[l];
				var c;
				'undefined' != typeof points &&
					((points += r),
					e('updatePointsDisplay'),
					e('updateShopUI'),
					e('saveAllData'),
					localStorage.setItem('mfCalRewardDate', d),
					(c = `calendar bonus: +${n(r)} pts (day ${l + 1}/7)`),
					'function' == typeof window.showAnomalyPopup && window.showAnomalyPopup(c),
					i());
			}
			function i() {
				const e = document.getElementById('mfCalGrid');
				if (!e) return;
				e.innerHTML = '';
				const d = localStorage.getItem('daily_lastClaim') === t(),
					i = a();
				for (let t = 0; t < 7; t++) {
					const a = document.createElement('div');
					((a.className = 'mf-cal-cell'),
						t < i || (t === i && d)
							? a.classList.add('mf-done')
							: t === i && a.classList.add('mf-today'),
						(a.innerHTML = `<div>day ${t + 1}</div><div class="mf-cal-pts">${n(o[t])}</div>`),
						e.appendChild(a));
				}
			}
			function l() {
				const t = document.getElementById('dailyContainer');
				if (!t || document.getElementById('mfCalendarBtn')) return;
				const e = document.createElement('button');
				((e.id = 'mfCalendarBtn'),
					(e.className = 'small'),
					(e.textContent = 'view streak calendar'),
					t.appendChild(e));
				const n = document.createElement('div');
				((n.id = 'mfCalendarModal'),
					(n.innerHTML =
						'\n\t\t\t\t<div class="mf-modal-inner">\n\t\t\t\t\t<div style="font-size:1.1em;margin-bottom:4px;">7-day streak calendar</div>\n\t\t\t\t\t<div style="font-size:0.75em;opacity:0.5;">claim your daily to fill in today\'s slot</div>\n\t\t\t\t\t<div class="mf-cal-grid" id="mfCalGrid"></div>\n\t\t\t\t\t<button class="mf-modal-close small">close</button>\n\t\t\t\t</div>'),
					document.body.appendChild(n),
					e.addEventListener('click', () => {
						(i(), n.classList.add('show'));
					}),
					n
						.querySelector('.mf-modal-close')
						.addEventListener('click', () => n.classList.remove('show')),
					n.addEventListener('click', (t) => {
						t.target === n && n.classList.remove('show');
					}));
				const o = document.getElementById('dailyBtn');
				o && o.addEventListener('click', () => setTimeout(d, 0));
			}
			'loading' === document.readyState ? document.addEventListener('DOMContentLoaded', l) : l();
		})(),
		(function () {
			function n() {
				const n = (function () {
						if (document.getElementById('mfFab')) return document.getElementById('mfFab');
						const t = document.createElement('button');
						return ((t.id = 'mfFab'), document.body.appendChild(t), t);
					})(),
					o = localStorage.getItem('daily_lastClaim') !== t(),
					a = Number(localStorage.getItem('anomalies') || 0);
				(n.classList.remove('mf-pulse'),
					o
						? ((n.textContent = 'claim daily!'),
							(n.style.display = 'flex'),
							n.classList.add('mf-pulse'),
							(n.onclick = () => {
								const t = document.getElementById('dailyBtn');
								t && t.click();
							}))
						: !(function () {
									const t = localStorage.getItem('weekly_lastClaim');
									return !t || Date.now() - Number(t) >= 6048e5;
							  })()
							? a > 0
								? ((n.textContent = `consume ${a} anomalies!`),
									(n.style.display = 'flex'),
									(n.onclick = () => e('consumeAllAnomalies')))
								: (n.style.display = 'none')
							: ((n.textContent = 'claim weekly!'),
								(n.style.display = 'flex'),
								n.classList.add('mf-pulse'),
								(n.onclick = () => {
									const t = document.getElementById('weeklyBtn');
									t && t.click();
								})));
			}
			('loading' === document.readyState ? document.addEventListener('DOMContentLoaded', n) : n(),
				setInterval(n, 4e3),
				document.addEventListener('visibilitychange', () => {
					document.hidden || n();
				}));
		})(),
		(function () {
			const t = 'mfLastSeen';
			function o() {
				try {
					localStorage.setItem(t, String(Date.now()));
				} catch (t) {}
			}
			function a() {
				const a = localStorage.getItem(t);
				if ((o(), !a)) return;
				const d = Date.now() - Number(a);
				if (d < 6e4) return;
				if ('undefined' == typeof shopUpgrades || !shopUpgrades.printer) return;
				const i = Math.min(d, 72e5),
					l = Math.floor((i / 1e3) * shopUpgrades.printer);
				l <= 0 ||
					('undefined' != typeof points &&
						((points += l),
						e('updatePointsDisplay'),
						e('updateShopUI'),
						e('saveAllData'),
						(function (t, e) {
							let o = document.getElementById('mfOfflineModal');
							o ||
								((o = document.createElement('div')),
								(o.id = 'mfOfflineModal'),
								document.body.appendChild(o));
							const a = Math.floor(e / 60);
							((o.innerHTML = `\n\t\t\t\t<div class="mf-modal-inner">\n\t\t\t\t\t<div style="font-size:2em;margin-bottom:10px;">💤</div>\n\t\t\t\t\t<div style="font-size:1.05em;margin-bottom:6px;">welcome back!</div>\n\t\t\t\t\t<div style="font-size:0.85em;opacity:0.7;margin-bottom:10px;">your printer kept working while you were away (${a}m)</div>\n\t\t\t\t\t<div style="font-size:1.4em;color:#ffb86b;">+${n(t)} points</div>\n\t\t\t\t\t<button class="mf-modal-close small">nice!</button>\n\t\t\t\t</div>`),
								o.classList.add('show'),
								o
									.querySelector('.mf-modal-close')
									.addEventListener('click', () => o.classList.remove('show')),
								o.addEventListener('click', (t) => {
									t.target === o && o.classList.remove('show');
								}));
						})(l, i / 1e3)));
			}
			('loading' === document.readyState ? document.addEventListener('DOMContentLoaded', a) : a(),
				document.addEventListener('visibilitychange', () => {
					document.hidden && o();
				}),
				window.addEventListener('pagehide', o),
				window.addEventListener('beforeunload', o));
		})());
})();
