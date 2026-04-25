import type { Rarity, ShopUpgrades, RollResult } from './types';
import type { BeaconRNG } from './rng';
import { PityTracker } from './pity';
import { StreakTracker } from './streak';

const SCALE = 1_000_000_000n;
const MULT_PRECISION = 1_000_000n;
const MIN_WEIGHT = 1n;

function rarityTier(r: Rarity): number {
  if (r.tier !== undefined) return r.tier;
  if (r.chance >= 0.5) return 0;
  if (r.chance >= 0.1) return 1;
  if (r.chance >= 0.01) return 2;
  if (r.chance >= 0.001) return 3;
  return 4;
}

export class BeaconRoller {
  private _rng: BeaconRNG;
  readonly pity: PityTracker;
  readonly streak: StreakTracker;

  constructor(rng: BeaconRNG) {
    this._rng = rng;
    this.pity = new PityTracker();
    this.streak = new StreakTracker();
  }

  private buildWeightTable(
    rarities: Rarity[],
    luckMultiplier: number,
    inventoryData: Set<string>,
    shopUpgrades: ShopUpgrades,
    luckBoostActive: boolean
  ): { weights: bigint[]; totalWeight: bigint } {
    const weights = new Array<bigint>(rarities.length);
    let totalWeight = 0n;
    const streakMult = this.streak.getLuckMultiplier();

    for (let i = 0; i < rarities.length; i++) {
      const r = rarities[i];
      const denom = Math.round(1 / r.chance);
      const noticeable = denom >= 100;

      let mult = streakMult;
      if (luckBoostActive && noticeable) mult *= 4;
      if (noticeable) mult *= luckMultiplier;

      if (shopUpgrades.magnet > 0 && !inventoryData.has(r.name) && noticeable) {
        mult *= 1 + shopUpgrades.magnet * 0.1;
      }

      if (noticeable) {
        mult *= this.pity.getMultiplier(r);
        mult *= this.streak.getDryRunMultiplier(r.name);
      }

      const multBig = BigInt(Math.round(mult * Number(MULT_PRECISION)));
      const denomBig = BigInt(denom);
      let w = (SCALE * multBig) / (denomBig * MULT_PRECISION);
      if (w < MIN_WEIGHT) w = MIN_WEIGHT;

      weights[i] = w;
      totalWeight += w;
    }

    return { weights, totalWeight };
  }

  roll(
    rarities: Rarity[],
    luckMultiplier: number,
    inventoryData: Set<string>,
    shopUpgrades: ShopUpgrades,
    luckBoostActive: boolean
  ): RollResult {
    const { weights, totalWeight } = this.buildWeightTable(
      rarities,
      luckMultiplier,
      inventoryData,
      shopUpgrades,
      luckBoostActive
    );

    let rand = this._rng.intBelow(totalWeight);
    let chosenIndex = rarities.length - 1;

    for (let i = 0; i < rarities.length; i++) {
      if (rand < weights[i]) {
        chosenIndex = i;
        break;
      }
      rand -= weights[i];
    }

    const result = rarities[chosenIndex];
    const wasPity = this.pity.isHardPity(result);
    const isHotPulse = this.streak.isInHotPulse();

    for (const r of rarities) {
      if (!this.pity.isEligible(r)) continue;
      if (r.name === result.name) {
        this.pity.reset(r.name);
      } else {
        this.pity.increment(r.name);
      }
    }

    const tier = rarityTier(result);
    this.streak.record(tier, result.name, tier >= 3);

    return {
      rarity: result,
      index: chosenIndex,
      totalWeight,
      wasPity,
      pityCurrent: this.pity.get(result.name),
      isHotPulse,
    };
  }

  probabilityOf(
    rarity: Rarity,
    rarities: Rarity[],
    luckMultiplier: number,
    inventoryData: Set<string>,
    shopUpgrades: ShopUpgrades,
    luckBoostActive: boolean
  ): number {
    const { weights, totalWeight } = this.buildWeightTable(
      rarities,
      luckMultiplier,
      inventoryData,
      shopUpgrades,
      luckBoostActive
    );
    const idx = rarities.findIndex((r) => r.name === rarity.name);
    if (idx === -1) return 0;
    return Number(weights[idx]) / Number(totalWeight);
  }
}
