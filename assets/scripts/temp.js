(function () {
	'use strict';

	// hardcoded on purpose, this is not meant to be real auth
	const PASSWORD = '12pE*sDG08)6';
	const UNLOCK_KEY = 'nosave_unlocked_v1';

	if (localStorage.getItem(UNLOCK_KEY) === '1') return; // already unlocked, skip gate entirely

	function injectStyles() {
		const style = document.createElement('style');
		style.textContent = `
			#gateOverlay {
				position: fixed;
				inset: 0;
				background: #0e0e0e;
				z-index: 2147483647;
				display: flex;
				align-items: center;
				justify-content: center;
				font-family: monospace;
				color: #dcdcdc;
			}
			#gateBox {
				width: 320px;
				max-width: calc(100vw - 40px);
				text-align: center;
			}
			#gateTitle {
				font-size: 1.1em;
				letter-spacing: 0.06em;
				opacity: 0.9;
				margin-bottom: 6px;
			}
			#gateSubtitle {
				font-size: 0.8em;
				opacity: 0.4;
				margin-bottom: 24px;
				line-height: 1.5;
			}
			#gateInput {
				width: 100%;
				padding: 10px 12px;
				background: #1a1a1a;
				border: 1px solid #303030;
				border-radius: 2px;
				color: #dcdcdc;
				font-family: monospace;
				font-size: 0.95em;
				box-sizing: border-box;
				margin-bottom: 10px;
				text-align: center;
			}
			#gateInput:focus {
				outline: none;
				border-color: #666;
			}
			#gateBtn {
				width: 100%;
				padding: 10px;
				background: #1a1a1a;
				border: 1px solid #303030;
				border-radius: 2px;
				color: #dcdcdc;
				font-family: monospace;
				font-size: 0.9em;
				cursor: pointer;
				transition: background 0.2s;
			}
			#gateBtn:hover {
				background: #242424;
			}
			#gateError {
				font-size: 0.78em;
				color: #f66;
				margin-top: 10px;
				min-height: 1.2em;
				opacity: 0;
				transition: opacity 0.2s;
			}
			#gateError.show {
				opacity: 1;
			}
			#gateBox.shake {
				animation: gateShake 0.4s ease;
			}
			@keyframes gateShake {
				0%, 100% { transform: translateX(0); }
				20% { transform: translateX(-8px); }
				40% { transform: translateX(8px); }
				60% { transform: translateX(-5px); }
				80% { transform: translateX(5px); }
			}
		`;
		document.head.appendChild(style);
	}

	function buildGate() {
		const overlay = document.createElement('div');
		overlay.id = 'gateOverlay';
		overlay.innerHTML = `
			<div id="gateBox">
				<div id="gateTitle">tournament access</div>
				<div id="gateSubtitle">this page is locked. enter the password given to you to continue.</div>
				<input id="gateInput" type="password" placeholder="password..." autocomplete="off" />
				<button id="gateBtn">enter</button>
				<div id="gateError"></div>
			</div>
		`;

		document.documentElement.appendChild(overlay);
		document.documentElement.style.overflow = 'hidden';

		const input = overlay.querySelector('#gateInput');
		const btn = overlay.querySelector('#gateBtn');
		const box = overlay.querySelector('#gateBox');
		const errorEl = overlay.querySelector('#gateError');

		function attempt() {
			if (input.value === PASSWORD) {
				localStorage.setItem(UNLOCK_KEY, '1');
				document.documentElement.style.overflow = '';
				overlay.remove();
			} else {
				errorEl.textContent = 'wrong password, try again.';
				errorEl.classList.add('show');
				box.classList.remove('shake');
				void box.offsetWidth;
				box.classList.add('shake');
				input.value = '';
				input.focus();
			}
		}

		btn.addEventListener('click', attempt);
		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') attempt();
		});

		setTimeout(() => input.focus(), 50);
	}

	function init() {
		injectStyles();
		buildGate();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();
