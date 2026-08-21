(function () {
	'use strict';

	// Why not make a seperate file for this
	// because every file is getting more and
	// more bloated

	type IconKey =
		| 'notifBell'
		| 'friendsBtn'
		| 'messagesBtn'
		| 'wellVisual'
		| 'seasonWinter'
		| 'seasonSpring'
		| 'seasonSummer'
		| 'seasonFall';

	type IconPack = Record<IconKey, string>;

	type IconSettings = {
		iconPack?: string;
		iconOverrides?: Partial<Record<IconKey, string>>;
	};

	type IconElementMode = 'prepend' | 'text';

	type IconElementConfig = {
		selector: string;
		mode: IconElementMode;
	};

	const ICON_KEYS: IconKey[] = [
		'notifBell',
		'friendsBtn',
		'messagesBtn',
		'wellVisual',
		'seasonWinter',
		'seasonSpring',
		'seasonSummer',
		'seasonFall',
	];

	const ICON_PACKS: { default: IconPack; [pack: string]: IconPack } = {
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

	const ICON_ELEMENT_MAP: Partial<Record<IconKey, IconElementConfig>> = {
		notifBell: { selector: '#notifBell', mode: 'prepend' },
		friendsBtn: { selector: '#friendsBtn', mode: 'prepend' },
		messagesBtn: { selector: '#messagesBtn', mode: 'prepend' },
		wellVisual: { selector: '#wellVisual', mode: 'text' },
	};

	function resolveIcon(key: IconKey, settings?: IconSettings): string {
		const pack = settings?.iconPack || 'default';
		const overrides = settings?.iconOverrides || {};
		if (overrides[key]) return overrides[key] as string;
		const packMap = ICON_PACKS[pack] || ICON_PACKS.default;
		return packMap[key];
	}

	function applyIconSettings(settings?: IconSettings): void {
		const resolved = {} as Record<IconKey, string>;
		ICON_KEYS.forEach((key) => {
			resolved[key] = resolveIcon(key, settings);
		});
		(window as any).ICONS = resolved;

		(Object.entries(ICON_ELEMENT_MAP) as [IconKey, IconElementConfig][]).forEach(([key, cfg]) => {
			const node = document.querySelector(cfg.selector);
			if (!node) return;
			if (cfg.mode === 'text') {
				node.textContent = resolved[key];
			} else if (cfg.mode === 'prepend') {
				const existing = node.childNodes[0];
				if (existing && existing.nodeType === Node.TEXT_NODE) {
					existing.textContent = resolved[key] + '\n\t\t\t';
				} else {
					node.insertBefore(document.createTextNode(resolved[key] + '\n\t\t\t'), node.firstChild);
				}
			}
		});

		document.dispatchEvent(new CustomEvent('authsrng:iconsUpdated', { detail: resolved }));
	}

	(window as any).ICON_KEYS = ICON_KEYS;
	(window as any).ICON_PACKS = ICON_PACKS;
	(window as any).applyIconSettings = applyIconSettings;
	(window as any).getIcon = function (key: IconKey): string {
		return ((window as any).ICONS && (window as any).ICONS[key]) || ICON_PACKS.default[key];
	};

	applyIconSettings({});
})();