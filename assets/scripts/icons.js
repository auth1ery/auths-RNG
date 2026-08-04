(function () {
	'use strict';

	// Why not make a seperate file for this
	// because every file is getting more and
	// more bloated

	const ICON_KEYS = [
		'notifBell',
		'friendsBtn',
		'messagesBtn',
		'wellVisual',
		'seasonWinter',
		'seasonSpring',
		'seasonSummer',
		'seasonFall',
	];

	const ICON_PACKS = {
		default: {
			notifBell: '🔔',
			friendsBtn: '👥',
			messagesBtn: '✉️',
			wellVisual: '🌊',
			seasonWinter: '❄️',
			seasonSpring: '🌸',
			seasonSummer: '☀️',
			seasonFall: '🍁',
		},
		retro: {
			notifBell: '📯',
			friendsBtn: '🧑‍🤝‍🧑',
			messagesBtn: '📨',
			wellVisual: '⛲',
			seasonWinter: '🌨️',
			seasonSpring: '🌷',
			seasonSummer: '🌞',
			seasonFall: '🎃',
		},
		minimal: {
			notifBell: '!',
			friendsBtn: '@',
			messagesBtn: '>',
			wellVisual: '~',
			seasonWinter: '*',
			seasonSpring: '.',
			seasonSummer: 'o',
			seasonFall: "'",
		},
	};

	const ICON_ELEMENT_MAP = {
		notifBell: { selector: '#notifBell', mode: 'prepend' },
		friendsBtn: { selector: '#friendsBtn', mode: 'prepend' },
		messagesBtn: { selector: '#messagesBtn', mode: 'prepend' },
		wellVisual: { selector: '#wellVisual', mode: 'text' },
	};

	function resolveIcon(key, settings) {
		const pack = (settings && settings.iconPack) || 'default';
		const overrides = (settings && settings.iconOverrides) || {};
		if (overrides[key]) return overrides[key];
		const packMap = ICON_PACKS[pack] || ICON_PACKS.default;
		return packMap[key] || ICON_PACKS.default[key];
	}

	function applyIconSettings(settings) {
		const resolved = {};
		ICON_KEYS.forEach((key) => {
			resolved[key] = resolveIcon(key, settings);
		});
		window.ICONS = resolved;

		Object.entries(ICON_ELEMENT_MAP).forEach(([key, cfg]) => {
			const node = document.querySelector(cfg.selector);
			if (!node) return;
			if (cfg.mode === 'text') {
				node.textContent = resolved[key];
			} else if (cfg.mode === 'prepend') {
				let existing = node.childNodes[0];
				if (existing && existing.nodeType === Node.TEXT_NODE) {
					existing.textContent = resolved[key] + '\n\t\t\t';
				} else {
					node.insertBefore(document.createTextNode(resolved[key] + '\n\t\t\t'), node.firstChild);
				}
			}
		});

		document.dispatchEvent(new CustomEvent('authsrng:iconsUpdated', { detail: resolved }));
	}

	window.ICON_KEYS = ICON_KEYS;
	window.ICON_PACKS = ICON_PACKS;
	window.applyIconSettings = applyIconSettings;
	window.getIcon = function (key) {
		return (window.ICONS && window.ICONS[key]) || ICON_PACKS.default[key];
	};

	applyIconSettings({});
})();
