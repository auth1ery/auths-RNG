(function (root) {
  'use strict';

  if (!root.GameRNG) {
    throw new Error('[GameRoller] rng.js must be loaded first');
  }

  const SCALE = 1000000000n;
  const MULT_PRECISION = 1000000n;
  const MIN_WEIGHT = 1n;

  function buildWeightTable(rarities, luckMultiplier, inventoryData, shopUpgrades, luckBoostActive) {
    const weights = new Array(rarities.length);
    let totalWeight = 0n;

    for (let i = 0; i < rarities.length; i++) {
      const r = rarities[i];
      const denom = Math.round(1 / r.chance);
      const noticeable = denom >= 100;

      let mult = 1.0;
      if (luckBoostActive && noticeable) mult *= 4;
      if (noticeable) mult *= luckMultiplier;

      if (shopUpgrades.magnet > 0 && !inventoryData.has(r.name) && noticeable) {
        mult *= 1 + shopUpgrades.magnet * 0.1;
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

  function roll(rarities, luckMultiplier, inventoryData, shopUpgrades, luckBoostActive) {
    const { weights, totalWeight } = buildWeightTable(rarities, luckMultiplier, inventoryData, shopUpgrades, luckBoostActive);
    let rand = root.GameRNG.intBelow(totalWeight);

    for (let i = 0; i < rarities.length; i++) {
      if (rand < weights[i]) return rarities[i];
      rand -= weights[i];
    }

    return rarities[rarities.length - 1];
  }

  function rollWithIndex(rarities, luckMultiplier, inventoryData, shopUpgrades, luckBoostActive) {
    const { weights, totalWeight } = buildWeightTable(rarities, luckMultiplier, inventoryData, shopUpgrades, luckBoostActive);
    let rand = root.GameRNG.intBelow(totalWeight);

    for (let i = 0; i < rarities.length; i++) {
      if (rand < weights[i]) return { rarity: rarities[i], index: i, totalWeight };
      rand -= weights[i];
    }

    return { rarity: rarities[rarities.length - 1], index: rarities.length - 1, totalWeight };
  }

  function probabilityOf(rarity, rarities, luckMultiplier, inventoryData, shopUpgrades, luckBoostActive) {
    const { weights, totalWeight } = buildWeightTable(rarities, luckMultiplier, inventoryData, shopUpgrades, luckBoostActive);
    const idx = rarities.findIndex(function (r) { return r.name === rarity.name; });
    if (idx === -1) return 0;
    return Number(weights[idx]) / Number(totalWeight);
  }

  root.GameRoller = {
    roll: roll,
    rollWithIndex: rollWithIndex,
    probabilityOf: probabilityOf
  };

})(typeof window !== 'undefined' ? window : this);
