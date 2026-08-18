(function (root) {
	if (
		!root.PityTracker ||
		!root.StreakTracker ||
		!root.PlushRNG ||
		!root.PlushRoller ||
		!root.MomentumTracker ||
		!root.FortuneBank ||
		!root.ResistanceTracker ||
		!root.PlushLogger ||
		!root.Epic
	) {
		throw new Error('Plush dependencies not loaded correctly');
	}

	const VERSION = '3.0.0';
	const STORAGE_KEY = '_plush_v3';
	const LEGACY_STORAGE_KEY = '_beacon_v2';
	const AUTOSAVE_MS = 30000;

	root.PlushLog = new root.PlushLogger({ level: 'info' });

	const _rng = new root.PlushRNG();
	const _roller = new root.PlushRoller(_rng);

	function _loadLegacy() {
		try {
			const raw =
				typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_STORAGE_KEY) : null;
			if (!raw) return false;
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed.rngState) || parsed.rngState.length !== 4) return false;
			_rng.loadState(parsed.rngState);
			if (parsed.pity) _roller.pity.deserialize(parsed.pity);
			if (parsed.streak) _roller.streak.deserialize(parsed.streak);
			root.PlushLog.milestone('save', 'migrated legacy Beacon save into Plush');
			return true;
		} catch (err) {
			root.PlushLog.warn('save', 'legacy migration failed', err);
			return false;
		}
	}

	function _load() {
		try {
			const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed.rngState) && parsed.rngState.length === 4) {
					_rng.loadState(parsed.rngState);
					if (parsed.pity) _roller.pity.deserialize(parsed.pity);
					if (parsed.streak) _roller.streak.deserialize(parsed.streak);
					if (parsed.momentum) _roller.momentum.deserialize(parsed.momentum);
					if (parsed.fortune) _roller.fortune.deserialize(parsed.fortune);
					if (parsed.resistance) _roller.resistance.deserialize(parsed.resistance);
					root.PlushLog.info('save', 'state restored');
					return;
				}
			}
		} catch (err) {
			root.PlushLog.warn('save', 'failed to load save', err);
		}

		if (_loadLegacy()) {
			_save();
			return;
		}

		root.PlushLog.info('save', 'creating fresh state');
		_rng.init();
	}

	function _save() {
		// No-op
	}

	_load();
	setInterval(_save, AUTOSAVE_MS);

	root.Plush = {
		version: VERSION,

		reseed: function (seed) {
			_rng.reseed(seed);
			_save();
		},
		float: function () {
			return _rng.float();
		},
		uint64: function () {
			return _rng.uint64();
		},
		intBelow: function (n) {
			return _rng.intBelow(n);
		},
		intRange: function (lo, hi) {
			return _rng.intRange(lo, hi);
		},
		bool: function (p) {
			return _rng.bool(p);
		},
		shuffle: function (arr) {
			return _rng.shuffle(arr);
		},
		pick: function (arr) {
			return _rng.pick(arr);
		},

		roll: function (rarities, luckMult, inventory, upgrades, boostActive) {
			return _roller.roll(rarities, luckMult, inventory, upgrades, boostActive);
		},

		probabilityOf: function (rarity, rarities, luckMult, inventory, upgrades, boostActive) {
			return _roller.probabilityOf(rarity, rarities, luckMult, inventory, upgrades, boostActive);
		},

		spendFortune: function () {
			return _roller.spendFortune();
		},
		fortuneStatus: function () {
			return {
				balance: _roller.fortune.balance(),
				canSpend: _roller.fortune.canSpend(),
			};
		},

		momentumStatus: function () {
			return {
				combo: _roller.momentum.combo(),
				multiplier: _roller.momentum.getMultiplier(),
			};
		},

		resistanceRemaining: function (name) {
			return _roller.resistance.remaining(name);
		},

		pityProgress: function (rarity) {
			return _roller.pity.progress(rarity);
		},

		denomOf: function (rarity) {
			return _roller.denomOf(rarity);
		},
		denomOfString: function (rarity) {
			return _roller.denomOfString(rarity);
		},

		save: function () {
			_save();
		},

		log: root.PlushLog,

		debug: function () {
			return Object.assign({}, _rng.debugInfo(), {
				pity: _roller.pity.serialize(),
				streak: _roller.streak.serialize(),
				momentum: _roller.momentum.serialize(),
				fortune: _roller.fortune.serialize(),
				resistance: _roller.resistance.serialize(),
				epicCache: root.Epic.cacheStats(),
				recentLogs: root.PlushLog.recent(25),
				logStats: root.PlushLog.stats(),
			});
		},

		pity: _roller.pity,
		streak: _roller.streak,
		momentum: _roller.momentum,
		fortune: _roller.fortune,
		resistance: _roller.resistance,
	};

	root.PlushLog.milestone('boot', 'Plush v' + VERSION + ' loaded');
})(typeof window !== 'undefined' ? window : this);
