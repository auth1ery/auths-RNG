(function (root) {
  'use strict';

  const VERSION = '1.0.0';
  const REQUIRED = ['Xoshiro256SS', 'GameRNG', 'GameRoller'];

  const missing = REQUIRED.filter(function (k) { return !root[k]; });
  if (missing.length > 0) {
    console.warn('[GameRNGEngine] missing globals:', missing.join(', '));
  }

  root.GameRNGEngine = {
    version: VERSION,
    ready: missing.length === 0,
    reseed: function (seed) { root.GameRNG.reseed(seed); },
    float: function () { return root.GameRNG.float(); },
    uint64: function () { return root.GameRNG.uint64(); },
    intBelow: function (n) { return root.GameRNG.intBelow(n); },
    intRange: function (lo, hi) { return root.GameRNG.intRange(lo, hi); },
    bool: function (p) { return root.GameRNG.bool(p); },
    shuffle: function (arr) { return root.GameRNG.shuffle(arr); },
    pick: function (arr) { return root.GameRNG.pick(arr); },
    roll: function (rarities, luckMult, inventory, upgrades, boostActive) {
      return root.GameRoller.roll(rarities, luckMult, inventory, upgrades, boostActive);
    },
    probabilityOf: function (rarity, rarities, luckMult, inventory, upgrades, boostActive) {
      return root.GameRoller.probabilityOf(rarity, rarities, luckMult, inventory, upgrades, boostActive);
    },
    save: function () { root.GameRNG.save(); },
    debug: function () { return root.GameRNG.debugInfo(); }
  };

  if (typeof console !== 'undefined') {
    console.log('[GameRNGEngine] v' + VERSION + ' loaded. ready=' + root.GameRNGEngine.ready);
  }

})(typeof window !== 'undefined' ? window : this);
