import type { Rarity, PitySnapshot } from './types';

const SOFT_PITY_RATIO = 0.65;
const SOFT_PITY_MAX_MULTIPLIER = 10.0;
const PITY_CHANCE_THRESHOLD = 0.05;

interface PityConfig {
  hardPity: number;
  softPityStart: number;
}

function derivePityConfig(chance: number): PityConfig | null {
  if (chance >= PITY_CHANCE_THRESHOLD) return null;
  const expected = Math.ceil(1 / chance);
  const hard = Math.min(Math.ceil(expected * 3), 1500);
  const soft = Math.ceil(hard * SOFT_PITY_RATIO);
  return { hardPity: hard, softPityStart: soft };
}

function resolveConfig(rarity: Rarity): PityConfig | null {
  if (rarity.pityLimit != null) {
    return {
      hardPity: rarity.pityLimit,
      softPityStart: Math.ceil(rarity.pityLimit * SOFT_PITY_RATIO),
    };
  }
  return derivePityConfig(rarity.chance);
}

export class PityTracker {
  private counters = new Map<string, number>();

  increment(name: string): void {
    this.counters.set(name, (this.counters.get(name) ?? 0) + 1);
  }

  reset(name: string): void {
    this.counters.set(name, 0);
  }

  get(name: string): number {
    return this.counters.get(name) ?? 0;
  }

  getMultiplier(rarity: Rarity): number {
    const config = resolveConfig(rarity);
    if (!config) return 1.0;

    const count = this.get(rarity.name);

    if (count >= config.hardPity) return 9999.0;
    if (count < config.softPityStart) return 1.0;

    const softRange = config.hardPity - config.softPityStart;
    const progress = (count - config.softPityStart) / softRange;
    return 1.0 + progress * (SOFT_PITY_MAX_MULTIPLIER - 1.0);
  }

  isHardPity(rarity: Rarity): boolean {
    const config = resolveConfig(rarity);
    if (!config) return false;
    return this.get(rarity.name) >= config.hardPity;
  }

  isEligible(rarity: Rarity): boolean {
    return resolveConfig(rarity) !== null;
  }

  serialize(): PitySnapshot {
    return Object.fromEntries(this.counters);
  }

  deserialize(data: PitySnapshot): void {
    this.counters = new Map(Object.entries(data));
  }
}
