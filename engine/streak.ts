import type { StreakSnapshot } from './types';

const HISTORY_WINDOW = 14;
const HOT_PULSE_DURATION = 4;
const DRY_THRESHOLD = 5;
const DRY_MULT_PER_STEP = 0.04;
const DRY_MULT_CAP = 0.55;
const COLD_WINDOW = 5;
const COLD_TIER_RATIO = 0.55;
const HOT_TIER_RATIO = 1.5;
const DAILY_VARIANCE = 0.06;

function dailyLuckOffset(): number {
  const day = Math.floor(Date.now() / 86400000);
  const h = Math.imul(day, 2654435761) >>> 0;
  return 1.0 + ((h & 0xff) / 255 - 0.5) * DAILY_VARIANCE;
}

export class StreakTracker {
  private recentTiers: number[] = [];
  private hotPulseRolls = 0;
  private dryRuns = new Map<string, number>();

  record(tier: number, name: string, isSignificantWin: boolean): void {
    this.recentTiers.push(tier);
    if (this.recentTiers.length > HISTORY_WINDOW) this.recentTiers.shift();

    if (isSignificantWin) {
      this.hotPulseRolls = HOT_PULSE_DURATION;
      this.dryRuns.set(name, 0);
    } else {
      if (this.hotPulseRolls > 0) this.hotPulseRolls--;
      this.dryRuns.set(name, (this.dryRuns.get(name) ?? 0) + 1);
    }
  }

  getLuckMultiplier(): number {
    const daily = dailyLuckOffset();

    if (this.hotPulseRolls > 0) {
      return daily * 1.18;
    }

    if (this.recentTiers.length >= COLD_WINDOW) {
      const slice = this.recentTiers.slice(-COLD_WINDOW);
      const avg = this.recentTiers.reduce((a, b) => a + b, 0) / this.recentTiers.length;
      const recentAvg = slice.reduce((a, b) => a + b, 0) / COLD_WINDOW;

      if (avg > 0 && recentAvg < avg * COLD_TIER_RATIO) return daily * 1.10;
      if (avg > 0 && recentAvg > avg * HOT_TIER_RATIO) return daily * 0.94;
    }

    return daily;
  }

  getDryRunMultiplier(name: string): number {
    const count = this.dryRuns.get(name) ?? 0;
    if (count <= DRY_THRESHOLD) return 1.0;
    return 1.0 + Math.min((count - DRY_THRESHOLD) * DRY_MULT_PER_STEP, DRY_MULT_CAP);
  }

  isInHotPulse(): boolean {
    return this.hotPulseRolls > 0;
  }

  serialize(): StreakSnapshot {
    return {
      recentTiers: [...this.recentTiers],
      hotPulseRolls: this.hotPulseRolls,
      dryRuns: Object.fromEntries(this.dryRuns),
    };
  }

  deserialize(snap: StreakSnapshot): void {
    this.recentTiers = snap.recentTiers ?? [];
    this.hotPulseRolls = snap.hotPulseRolls ?? 0;
    this.dryRuns = new Map(Object.entries(snap.dryRuns ?? {}));
  }
}
