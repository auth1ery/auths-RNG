export interface Rarity {
  name: string;
  chance: number;
  tier?: number;
  pityLimit?: number;
}

export interface ShopUpgrades {
  magnet: number;
  [key: string]: number;
}

export interface RollResult {
  rarity: Rarity;
  index: number;
  totalWeight: bigint;
  wasPity: boolean;
  pityCurrent: number;
  isHotPulse: boolean;
}

export interface BeaconDebugInfo {
  state: [string, string, string, string];
  calls: number;
  sessionSeed: string | null;
}

export interface PitySnapshot {
  [name: string]: number;
}

export interface StreakSnapshot {
  recentTiers: number[];
  hotPulseRolls: number;
  dryRuns: Record<string, number>;
}

export interface BeaconSaveData {
  rngState: [string, string, string, string];
  pity: PitySnapshot;
  streak: StreakSnapshot;
}
