import { BeaconRNG } from './rng';
import { BeaconRoller } from './roller';
import type { Rarity, ShopUpgrades, RollResult, BeaconSaveData } from './types';

export * from './types';
export { BeaconRNG } from './rng';
export { BeaconRoller } from './roller';
export { PityTracker } from './pity';
export { StreakTracker } from './streak';
export { Xoshiro256SS } from './xoshiro256ss';

const VERSION = '2.0.0';
const STORAGE_KEY = '_beacon_v2';
const AUTOSAVE_INTERVAL_MS = 30_000;

const _rng = new BeaconRNG();
const _roller = new BeaconRoller(_rng);

function _load(): void {
  try {
    const raw =
      typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed: BeaconSaveData = JSON.parse(raw);
      if (Array.isArray(parsed.rngState) && parsed.rngState.length === 4) {
        _rng.loadState(parsed.rngState as [string, string, string, string]);
        if (parsed.pity) _roller.pity.deserialize(parsed.pity);
        if (parsed.streak) _roller.streak.deserialize(parsed.streak);
        return;
      }
    }
  } catch (_) {}
  _rng.init();
}

function _save(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const data: BeaconSaveData = {
      rngState: _rng.getState(),
      pity: _roller.pity.serialize(),
      streak: _roller.streak.serialize(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {}
}

_load();

if (typeof setInterval !== 'undefined') {
  setInterval(_save, AUTOSAVE_INTERVAL_MS);
}

export const Beacon = {
  version: VERSION,

  reseed(seed: bigint | number | string): void {
    _rng.reseed(seed);
    _save();
  },

  float(): number {
    return _rng.float();
  },

  uint64(): bigint {
    return _rng.uint64();
  },

  intBelow(n: bigint): bigint {
    return _rng.intBelow(n);
  },

  intRange(lo: number | bigint, hi: number | bigint): bigint {
    return _rng.intRange(lo, hi);
  },

  bool(p: number): boolean {
    return _rng.bool(p);
  },

  shuffle<T>(arr: T[]): T[] {
    return _rng.shuffle(arr);
  },

  pick<T>(arr: T[]): T {
    return _rng.pick(arr);
  },

  roll(
    rarities: Rarity[],
    luckMult: number,
    inventory: Set<string>,
    upgrades: ShopUpgrades,
    boostActive: boolean
  ): RollResult {
    return _roller.roll(rarities, luckMult, inventory, upgrades, boostActive);
  },

  probabilityOf(
    rarity: Rarity,
    rarities: Rarity[],
    luckMult: number,
    inventory: Set<string>,
    upgrades: ShopUpgrades,
    boostActive: boolean
  ): number {
    return _roller.probabilityOf(rarity, rarities, luckMult, inventory, upgrades, boostActive);
  },

  save(): void {
    _save();
  },

  debug() {
    return {
      ...(_rng.debugInfo()),
      pity: _roller.pity.serialize(),
      streak: _roller.streak.serialize(),
    };
  },

  pity: _roller.pity,
  streak: _roller.streak,
} as const;
