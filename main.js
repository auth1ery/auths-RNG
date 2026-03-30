(function () {
  var s = document.createElement('script');
  s.src = 'legacy-polyfills.js';
  s.async = false;
  document.head.appendChild(s);
})();

const rollBtn = document.getElementById('rollBtn'),
  spinner = document.getElementById('spinner'),
  inventoryList = document.getElementById('inventoryList'),
  resetBtn = document.getElementById('resetBtn'),
  totalRollsEl = document.getElementById('totalRolls'),
  achievementsContainer = document.getElementById('achievementsContainer');

const POINTS_KEY = 'shopPoints';
const SHOP_UPGRADES_KEY = 'shopUpgrades';
const SOLD_OUT_KEY = 'soldOutRarities';

let points = 0;
let shopUpgrades = {
  luck: 0,
  speed: 0,
  pointMult: 0,
  magnet: 0,
  printer: 0,
  duplicate: 0,
};
let soldOutRarities = new Map();
let rollSpeed = 1.0;
let shopLuckMultiplier = 1.0;
let pointDivisor = 3.0;

const STORAGE_KEY = 'rarityInventory',
  TOTAL_ROLLS_KEY = 'totalRolls',
  ACHIEVEMENTS_KEY = 'achievementsUnlocked';

const ANOMALIES_KEY = 'anomalies';
const ANOMALIES_USED_KEY = 'anomaliesUsed';
let anomalies = 0;
let anomaliesUsed = 0;

const POTIONS_KEY = 'playerPotions';
const ACTIVE_POTIONS_KEY = 'activePotions';

let playerPotions = {
  luck2x: 0,
  luck4x: 0,
  luck10x: 0,
  luck50x: 0,
  luck100x: 0,
  luck150x: 0,
  luck250x: 0,
  luck300x: 0,
  duplicate: 0,
};

let activePotions = [];
let potionLuckMultiplier = 1;
let duplicateRollsLeft = 0;

const potionData = {
  luck2x: {
    name: '2x luck',
    mult: 2,
    duration: 30000,
    cost: 2000,
    emoji: '✨',
  },
  luck4x: {
    name: '4x luck',
    mult: 4,
    duration: 30000,
    cost: 5000,
    emoji: '💫',
  },
  luck10x: {
    name: '10x luck',
    mult: 10,
    duration: 30000,
    cost: 15000,
    emoji: '🌟',
  },
  luck50x: {
    name: '50x luck',
    mult: 50,
    duration: 30000,
    cost: 30000,
    emoji: '⭐',
  },
  luck100x: {
    name: '100x luck',
    mult: 100,
    duration: 30000,
    cost: 45000,
    emoji: '🔥',
  },
  luck150x: {
    name: '150x luck',
    mult: 150,
    duration: 30000,
    cost: 60000,
    emoji: '💥',
  },
  luck250x: {
    name: '250x luck',
    mult: 250,
    duration: 30000,
    cost: 80000,
    emoji: '⚡',
  },
  luck300x: {
    name: 'OMEGA LUCK',
    mult: 300,
    duration: 30000,
    cost: 150000,
    emoji: '💎',
  },
  duplicate: { name: 'duplicate', rolls: 10, cost: 5000, emoji: '🎭' },
};

function calculateRarityPoints(rarity) {
  const denom = Math.round(1 / rarity.chance);
  return Math.ceil(denom / pointDivisor);
}

function updatePointsDisplay() {
  document.getElementById('pointsValue').textContent = points;
}

function updateShopUI() {
  document.getElementById('luckLevel').textContent = shopUpgrades.luck;
  document.getElementById('speedLevel').textContent = shopUpgrades.speed;
  document.getElementById('pointLevel').textContent = shopUpgrades.pointMult;

  const luckCost = Math.floor(25 + shopUpgrades.luck * shopUpgrades.luck * 15);
  const speedCost = Math.floor(
    50 + shopUpgrades.speed * shopUpgrades.speed * 55,
  );
  const pointCost = Math.floor(
    100 + shopUpgrades.pointMult * shopUpgrades.pointMult * 35,
  );

  // Update button text to show costs
  const luckBtn = document.getElementById('buyLuckBtn');
  const speedBtn = document.getElementById('buySpeedBtn');
  const pointBtn = document.getElementById('buyPointBtn');

  if (luckBtn) luckBtn.textContent = `buy luck upgrade (${luckCost} pts)`;
  if (speedBtn) speedBtn.textContent = `buy speed upgrade (${speedCost} pts)`;
  if (pointBtn) pointBtn.textContent = `buy points upgrade (${pointCost} pts)`;

  // Disable buttons if can't afford or maxed out
  if (luckBtn) luckBtn.disabled = points < luckCost || shopUpgrades.luck >= 100;
  if (speedBtn)
    speedBtn.disabled = points < speedCost || shopUpgrades.speed >= 3;
  if (pointBtn)
    pointBtn.disabled = points < pointCost || shopUpgrades.pointMult >= 10;

  const magnetLevelEl = document.getElementById('magnetLevel');
  const printerLevelEl = document.getElementById('printerLevel');
  const dupeLevelEl = document.getElementById('dupeLevel');

  if (magnetLevelEl) magnetLevelEl.textContent = shopUpgrades.magnet || 0;
  if (printerLevelEl) printerLevelEl.textContent = shopUpgrades.printer || 0;
  if (dupeLevelEl) dupeLevelEl.textContent = shopUpgrades.duplicate || 0;

  const magnetCost = 500 + (shopUpgrades.magnet || 0) * 1000;
  const printerCost =
    1000 + (shopUpgrades.printer || 0) * (shopUpgrades.printer || 0) * 500;
  const dupeCost =
    800 + (shopUpgrades.duplicate || 0) * (shopUpgrades.duplicate || 0) * 400;

  const magnetBtn = document.getElementById('buyMagnetBtn');
  const printerBtn = document.getElementById('buyPrinterBtn');
  const dupeBtn = document.getElementById('buyDupeBtn');

  if (magnetBtn) {
    magnetBtn.textContent = `upgrade (${magnetCost} pts)`;
    magnetBtn.disabled = points < magnetCost || (shopUpgrades.magnet || 0) >= 5;
  }
  if (printerBtn) {
    printerBtn.textContent = `upgrade (${printerCost} pts)`;
    printerBtn.disabled = points < printerCost;
  }
  if (dupeBtn) {
    dupeBtn.textContent = `upgrade (${dupeCost} pts)`;
    dupeBtn.disabled = points < dupeCost || (shopUpgrades.duplicate || 0) >= 10;
  }
}

function updatePotionUI() {
  for (const [key, count] of Object.entries(playerPotions)) {
    const countEl = document.getElementById(`potion-${key}-count`);
    if (countEl) countEl.textContent = count;
  }
}

function buyPotion(potionType) {
  const data = potionData[potionType];
  if (!data) return;

  if (points >= data.cost) {
    points -= data.cost;
    playerPotions[potionType]++;
    updatePointsDisplay();
    updatePotionUI();
    saveAllData();
    showAnomalyPopup(`bought ${data.emoji} ${data.name}!`);
  } else {
    alert(`need ${data.cost} points!`);
  }
}

function usePotion(potionType) {
  if (playerPotions[potionType] <= 0) {
    alert(`you don't have any ${potionData[potionType].name} potions!`);
    return;
  }

  const data = potionData[potionType];

  if (potionType === 'duplicate') {
    duplicateRollsLeft = data.rolls;
    playerPotions[potionType]--;
    updatePotionUI();
    saveAllData();
    showAnomalyPopup(`${data.emoji} next ${data.rolls} rolls will be x2!`);
    return;
  }

  // Luck potions
  const endTime = Date.now() + data.duration;
  activePotions.push({
    type: potionType,
    endTime: endTime,
    multiplier: data.mult,
  });

  playerPotions[potionType]--;
  recalcPotionLuck();
  updatePotionUI();
  updateActivePotionsDisplay();
  saveAllData();
  showAnomalyPopup(`${data.emoji} ${data.name} activated!`);
}

function recalcPotionLuck() {
  potionLuckMultiplier = 1;
  activePotions = activePotions.filter((p) => p.endTime > Date.now());

  activePotions.forEach((p) => {
    potionLuckMultiplier *= p.multiplier;
  });

  updateLuckDisplay();
}

function updateActivePotionsDisplay() {
  const display = document.getElementById('activePotionsDisplay');
  const list = document.getElementById('activePotionsList');

  if (!display || !list) return;

  if (activePotions.length === 0 && duplicateRollsLeft === 0) {
    display.style.display = 'none';
    return;
  }

  display.style.display = 'block';
  list.innerHTML = '';

  activePotions.forEach((p) => {
    const data = potionData[p.type];
    const timeLeft = Math.ceil((p.endTime - Date.now()) / 1000);

    const div = document.createElement('div');
    div.className = 'active-potion';
    div.innerHTML = `
      <div class="active-potion-name">${data.emoji} ${data.mult}x luck</div>
      <div class="active-potion-timer">${timeLeft}s remaining</div>
    `;
    list.appendChild(div);
  });

  if (duplicateRollsLeft > 0) {
    const div = document.createElement('div');
    div.className = 'active-potion';
    div.innerHTML = `
      <div class="active-potion-name">🎭 duplicate</div>
      <div class="active-potion-timer">${duplicateRollsLeft} rolls left</div>
    `;
    list.appendChild(div);
  }
}

// Update potion timers
setInterval(() => {
  if (activePotions.length > 0) {
    recalcPotionLuck();
    updateActivePotionsDisplay();
  }
}, 1000);

// Make functions global
window.buyPotion = buyPotion;
window.usePotion = usePotion;

function showConfirmModal(title, text, onConfirm) {
  const modal = document.getElementById('confirmModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalText = document.getElementById('modalText');
  const confirmBtn = document.getElementById('modalConfirm');
  const cancelBtn = document.getElementById('modalCancel');

  if (!modal || !modalTitle || !modalText || !confirmBtn || !cancelBtn) return;

  modalTitle.textContent = title;
  modalText.textContent = text;
  modal.style.display = 'flex';

  // Remove old listeners by cloning buttons
  const newConfirmBtn = confirmBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

  // Add new listeners
  newConfirmBtn.addEventListener('click', () => {
    onConfirm();
    modal.style.display = 'none';
  });

  newCancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close on background click
  const bgClickHandler = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      modal.removeEventListener('click', bgClickHandler);
    }
  };
  modal.addEventListener('click', bgClickHandler);
}

let globalLuckMultiplier = 1;
function recalcLuckMultiplier() {
  globalLuckMultiplier = 1 + shopUpgrades.luck * 0.1 + anomaliesUsed * 0.5;

  globalLuckMultiplier *= potionLuckMultiplier;

  updateLuckDisplay();
}

function updateLuckDisplay() {
  const luckEl = document.getElementById('luckMultiplier');
  const breakdownEl = document.getElementById('luckBreakdown');

  if (!luckEl || !breakdownEl) return;

  luckEl.textContent = `luck multiplier: ${globalLuckMultiplier.toFixed(1)}x`;

  const parts = [];

  if (anomaliesUsed > 0) {
    const anomalyMult = 1 + anomaliesUsed * 0.5;
    parts.push(
      `anomalies: ${anomalyMult.toFixed(1)}x (${anomaliesUsed} consumed)`,
    );
  }

  if (shopUpgrades.luck > 0) {
    parts.push(
      `shop upgrade: ${shopLuckMultiplier.toFixed(1)}x (level ${shopUpgrades.luck})`,
    );
  }

  if (luckBoostActive) {
    parts.push(`temporary boost: 4.0x (active)`);
  }

  if (potionLuckMultiplier > 1) {
    parts.push(`potions: ${potionLuckMultiplier.toFixed(1)}x`);
  }

  if (duplicateRollsLeft > 0) {
    parts.push(`duplicate: ${duplicateRollsLeft} rolls left`);
  }

  if (parts.length === 0) {
    breakdownEl.textContent = 'base luck (no modifiers active)';
  } else {
    breakdownEl.textContent = parts.join(' • ');
  }
}

let luckBoostActive = false;
let luckBoostEndTime = 0;
let luckInterval = null;

const LUCK_KEY = 'luckBoostState';

let totalRolls = 0;
const inventoryData = new Map();
const achievementsUnlocked = new Set();

const backgroundMusic = new Audio('https://files.catbox.moe/y2mn5w.mp3');
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

const lunarMusic = new Audio(' ');
lunarMusic.volume = 0.6;

const runId = Math.floor(Math.random() * 1e10);

const playtimeKey = 'totalPlaytime';
let totalSeconds = parseInt(localStorage.getItem(playtimeKey)) || 0;

function formatTimeDisplay(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h > 0 ? `${h}h` : '', m > 0 ? `${m}m` : '', `${s}s`]
    .filter(Boolean)
    .join(' ');
}

function updatePlaytimeDisplay() {
  const display = document.getElementById('playtimeDisplay');
  if (display) {
    display.textContent = 'total playtime: ' + formatTimeDisplay(totalSeconds);
  }
}

updatePlaytimeDisplay();

setInterval(() => {
  totalSeconds++;
  localStorage.setItem(playtimeKey, totalSeconds);
  updatePlaytimeDisplay();
}, 1000);

const rarities = [
  { name: 'SUMMER', chance: 1 / 1000000000000000 },
  { name: 'finished.', chance: 1 / 100000000000000 },
  { name: 'pseudopseudohypoparathyroidism', chance: 1 / 10000000000000 },
  { name: '...', chance: 1 / 10000000000 },
  { name: 'the world', chance: 1 / 8200000000 },
  { name: 'Antimatter', chance: 1 / 5000000000 },
  { name: 'Dissociation', chance: 1 / 2000000000 },
  { name: 'Void', chance: 1 / 1000000000 },
  { name: 'brother what', chance: 1 / 400000000 },
  { name: 'Schizophrenia', chance: 1 / 300000000 },
  { name: 'Multiverse', chance: 1 / 200000000 },
  { name: 'CHARGED', chance: 1 / 100000000 },
  { name: 'Psychosis', chance: 1 / 50000000 },
  { name: 'Extinction', chance: 1 / 30000000 },
  { name: 'STOP PLAYING', chance: 1 / 10000000 },
  { name: 'Paranoia', chance: 1 / 8000000 },
  { name: 'Supermassive', chance: 1 / 5000000 },
  { name: 'Delusion', chance: 1 / 3000000 },
  { name: 'Kyawthuite', chance: 1 / 1500000 },
  { name: 'Globular but better', chance: 1 / 1300000 },
  { name: 'Obsession', chance: 1 / 1200000 },
  { name: 'you shouldnt have', chance: 1 / 1156852 },
  { name: 'francium', chance: 1 / 1100000 },
  { name: 'Impossible...', chance: 1 / 1000000 },
  { name: 'Trauma', chance: 1 / 900000 },
  { name: 'Interstellar', chance: 1 / 800000 },
  { name: 'Dissociative', chance: 1 / 700000 },
  { name: 'Superluminal', chance: 1 / 600000 },
  { name: 'Mania', chance: 1 / 500000 },
  { name: 'Gravitational', chance: 1 / 400000 },
  { name: 'Anxiety', chance: 1 / 300000 },
  { name: 'Cosmic', chance: 1 / 250000 },
  { name: 'Neurosis', chance: 1 / 200000 },
  { name: 'Event Horizon', chance: 1 / 101234 },
  { name: 'kill me', chance: 1 / 100000 },
  { name: 'Breakdown', chance: 1 / 95000 },
  { name: 'you suck bro', chance: 1 / 90000 },
  { name: 'Supergalaxy', chance: 1 / 88000 },
  { name: 'trust your luck', chance: 1 / 85000 },
  { name: 'astatine', chance: 1 / 80000 },
  { name: 'Depression', chance: 1 / 75000 },
  { name: 'Obfuscate', chance: 1 / 70000 },
  { name: 'Pulsar', chance: 1 / 65000 },
  { name: 'enuresis', chance: 1 / 60000 },
  { name: 'Panic', chance: 1 / 55000 },
  { name: 'Intel', chance: 1 / 50000 },
  { name: 'Nebulous', chance: 1 / 45000 },
  { name: 'anorexia', chance: 1 / 40000 },
  { name: 'Starborn', chance: 1 / 38000 },
  { name: '...whaat', chance: 1 / 35000 },
  { name: 'Disorder', chance: 1 / 33000 },
  { name: 'uh...', chance: 1 / 30000 },
  { name: 'rare rarity :3', chance: 1 / 30000 },
  { name: 'Galactic', chance: 1 / 28000 },
  { name: 'Eventide', chance: 1 / 25000 },
  { name: 'Phobia', chance: 1 / 23000 },
  { name: 'Catatonia', chance: 1 / 20000 },
  { name: 'Astroid', chance: 1 / 19000 },
  { name: 'Quantic', chance: 1 / 18000 },
  { name: 'Bipolar', chance: 1 / 17000 },
  { name: 'Photon', chance: 1 / 16000 },
  { name: 'Redshifted', chance: 1 / 15000 },
  { name: 'cyclothymic', chance: 1 / 14000 },
  { name: 'oh my-', chance: 1 / 13500 },
  { name: 'depressive', chance: 1 / 12900 },
  { name: 'im gonna cry', chance: 1 / 12800 },
  { name: 'dude why', chance: 1 / 12700 },
  { name: 'Kuiper', chance: 1 / 12600 },
  { name: 'Globular', chance: 1 / 12500 },
  { name: 'Elliptical', chance: 1 / 12400 },
  { name: 'Irregular', chance: 1 / 12300 },
  { name: 'Supercluster', chance: 1 / 12200 },
  { name: 'Hyperstar', chance: 1 / 12100 },
  { name: 'Hypernova', chance: 1 / 12000 },
  { name: 'youre him', chance: 1 / 11950 },
  { name: 'Supergiant', chance: 1 / 11900 },
  { name: 'Supervoid', chance: 1 / 11800 },
  { name: 'Superflare but better', chance: 1 / 11700 },
  { name: 'Supercloud but better', chance: 1 / 11600 },
  { name: 'Singularity', chance: 1 / 11500 },
  { name: 'Wormhole', chance: 1 / 11400 },
  { name: 'Blackhole', chance: 1 / 11300 },
  { name: 'Quasar', chance: 1 / 11200 },
  { name: 'Neutron', chance: 1 / 11100 },
  { name: 'Vortex', chance: 1 / 11050 },
  { name: 'Protogalaxy', chance: 1 / 11000 },
  { name: 'Hypervelocity', chance: 1 / 10900 },
  { name: 'Exoplanet', chance: 1 / 10800 },
  { name: 'Planetary', chance: 1 / 10700 },
  { name: 'Perplex', chance: 1 / 10600 },
  { name: 'Protostar', chance: 1 / 10500 },
  { name: 'Circumstellar', chance: 1 / 10400 },
  { name: 'microscopic', chance: 1 / 10350 },
  { name: 'Protoplanetary', chance: 1 / 10300 },
  { name: 'Magnetar', chance: 1 / 10200 },
  { name: 'Stellar', chance: 1 / 10100 },
  { name: 'cat', chance: 1 / 10000 },
  { name: 'Chromosphere', chance: 1 / 9975 },
  { name: 'Rogue', chance: 1 / 9950 },
  { name: 'Lagrange', chance: 1 / 9850 },
  { name: 'erm what', chance: 1 / 9825 },
  { name: 'Perigee', chance: 1 / 9800 },
  { name: 'Apogee', chance: 1 / 9775 },
  { name: 'Ecliptic', chance: 1 / 9750 },
  { name: 'Parsec', chance: 1 / 9725 },
  { name: 'Lightyear', chance: 1 / 9700 },
  { name: 'Astronomical', chance: 1 / 9675 },
  { name: 'Coronal', chance: 1 / 9650 },
  { name: 'Cepheid', chance: 1 / 9625 },
  { name: 'stop', chance: 1 / 9590 },
  { name: 'Luminosity', chance: 1 / 9575 },
  { name: 'Accretion', chance: 1 / 9550 },
  { name: '...?!!', chance: 1 / 9540 },
  { name: 'Bolometric', chance: 1 / 9525 },
  { name: 'Innovation', chance: 1 / 9520 },
  { name: 'Spectroscopy', chance: 1 / 9500 },
  { name: 'Parallax', chance: 1 / 9475 },
  { name: 'Supernova', chance: 1 / 9450 },
  { name: 'Precession', chance: 1 / 9425 },
  { name: 'Nutation', chance: 1 / 9400 },
  { name: 'Libration', chance: 1 / 9375 },
  { name: 'uhmmmm how', chance: 1 / 9350 },
  { name: 'Occultation', chance: 1 / 9325 },
  { name: 'Coronagraph', chance: 1 / 9300 },
  { name: 'Spectrograph', chance: 1 / 9275 },
  { name: 'Neutrino', chance: 1 / 9250 },
  { name: 'Interferometer', chance: 1 / 9225 },
  { name: 'Astrometry', chance: 1 / 9200 },
  { name: 'Photometry', chance: 1 / 9175 },
  { name: 'Meteorite', chance: 1 / 9150 },
  { name: 'Radiometry', chance: 1 / 9125 },
  { name: 'rarity names suck', chance: 1 / 9100 },
  { name: 'Thermodynamic', chance: 1 / 9075 },
  { name: 'Supercloud', chance: 1 / 9050 },
  { name: 'Entropy', chance: 1 / 9025 },
  { name: '// !strict', chance: 1 / 9000 },
  { name: 'Isentropic', chance: 1 / 8975 },
  { name: 'Superflare', chance: 1 / 8950 },
  { name: 'Adiabatic', chance: 1 / 8925 },
  { name: 'Isothermal', chance: 1 / 8900 },
  { name: 'Barotropic', chance: 1 / 8875 },
  { name: 'Planetesimal', chance: 1 / 8850 },
  { name: 'Polytropic', chance: 1 / 8825 },
  { name: 'Euphoria', chance: 1 / 8800 },
  { name: 'Relativistic', chance: 1 / 8775 },
  { name: 'Gamma', chance: 1 / 8750 },
  { name: 'Lorentz', chance: 1 / 8725 },
  { name: 'Minkowski', chance: 1 / 8700 },
  { name: 'Schwarzschild', chance: 1 / 8675 },
  { name: 'Kerr', chance: 1 / 8650 },
  { name: 'Ergosphere', chance: 1 / 8625 },
  { name: 'Dwarf', chance: 1 / 8600 },
  { name: 'Penrose', chance: 1 / 8575 },
  { name: 'Hawking', chance: 1 / 8550 },
  { name: 'Arcane', chance: 1 / 8500 },
  { name: 'Cascade', chance: 1 / 8400 },
  { name: 'Hubble', chance: 1 / 8375 },
  { name: 'Cosmological', chance: 1 / 8350 },
  { name: 'Redshift', chance: 1 / 8325 },
  { name: 'rah?', chance: 1 / 8300 },
  { name: 'Blueshift', chance: 1 / 8275 },
  { name: 'Aberration', chance: 1 / 8225 },
  { name: 'Lucent', chance: 1 / 8200 },
  { name: 'Refraction', chance: 1 / 8175 },
  { name: 'central', chance: 1 / 8170 },
  { name: 'STOP GAMBLING', chance: 1 / 8150 },
  { name: 'Diffraction', chance: 1 / 8125 },
  { name: 'Celestia', chance: 1 / 8100 },
  { name: 'Polarization', chance: 1 / 8075 },
  { name: 'Synchrotron', chance: 1 / 8050 },
  { name: 'Bremsstrahlung', chance: 1 / 8025 },
  { name: 'Seraphic', chance: 1 / 8000 },
  { name: 'Compton', chance: 1 / 7975 },
  { name: 'Photoelectric', chance: 1 / 7950 },
  { name: 'Nucleosynthesis', chance: 1 / 7925 },
  { name: 'Aetherial', chance: 1 / 7900 },
  { name: 'Fusion', chance: 1 / 7875 },
  { name: 'Fission', chance: 1 / 7850 },
  { name: 'Isotope', chance: 1 / 7825 },
  { name: 'Aether', chance: 1 / 7800 },
  { name: 'Deuterium', chance: 1 / 7775 },
  { name: 'Tritium', chance: 1 / 7750 },
  { name: 'Iridial', chance: 1 / 7700 },
  { name: 'Lithium', chance: 1 / 7675 },
  { name: 'Beryllium', chance: 1 / 7650 },
  { name: 'Boron', chance: 1 / 7625 },
  { name: 'Halcyon', chance: 1 / 7600 },
  { name: 'Nitrogen', chance: 1 / 7550 },
  { name: 'Stardrift', chance: 1 / 7500 },
  { name: 'hell', chance: 1 / 7450 },
  { name: 'Sodium', chance: 1 / 7425 },
  { name: 'Moonlit', chance: 1 / 7400 },
  { name: 'Magnesium', chance: 1 / 7375 },
  { name: 'cotton', chance: 1 / 7350 },
  { name: 'Aluminum', chance: 1 / 7325 },
  { name: 'Frame', chance: 1 / 7300 },
  { name: 'Silicon', chance: 1 / 7275 },
  { name: 'Phosphorus', chance: 1 / 7250 },
  { name: 'Sulfur', chance: 1 / 7225 },
  { name: 'Chemical', chance: 1 / 7200 },
  { name: 'Chlorine', chance: 1 / 7175 },
  { name: 'Argon', chance: 1 / 7150 },
  { name: 'Potassium', chance: 1 / 7125 },
  { name: 'Script', chance: 1 / 7100 },
  { name: 'Calcium', chance: 1 / 7075 },
  { name: 'Scandium', chance: 1 / 7050 },
  { name: 'Titanium', chance: 1 / 7025 },
  { name: 'go outside lil bro', chance: 1 / 7000 },
  { name: 'Vanadium', chance: 1 / 6975 },
  { name: 'Chromium', chance: 1 / 6950 },
  { name: 'Ruby', chance: 1 / 6935 },
  { name: 'Manganese', chance: 1 / 6925 },
  { name: 'Entertain', chance: 1 / 6900 },
  { name: 'Iron-56', chance: 1 / 6875 },
  { name: 'Nickel', chance: 1 / 6825 },
  { name: 'Prospect', chance: 1 / 6800 },
  { name: 'Copper', chance: 1 / 6775 },
  { name: 'Zinc', chance: 1 / 6750 },
  { name: 'Gallium', chance: 1 / 6725 },
  { name: 'Infamy', chance: 1 / 6700 },
  { name: 'Germanium', chance: 1 / 6675 },
  { name: 'Arsenic', chance: 1 / 6650 },
  { name: 'Selenium', chance: 1 / 6625 },
  { name: 'Rust', chance: 1 / 6600 },
  { name: 'Bromine', chance: 1 / 6575 },
  { name: 'Krypton', chance: 1 / 6550 },
  { name: 'Rubidium', chance: 1 / 6525 },
  { name: 'Low', chance: 1 / 6500 },
  { name: 'Strontium', chance: 1 / 6475 },
  { name: 'Yttrium', chance: 1 / 6450 },
  { name: 'Zirconium', chance: 1 / 6425 },
  { name: 'Toggle', chance: 1 / 6400 },
  { name: 'Niobium', chance: 1 / 6375 },
  { name: 'Molybdenum', chance: 1 / 6350 },
  { name: 'Technetium', chance: 1 / 6325 },
  { name: 'Doppler', chance: 1 / 6300 },
  { name: 'Ruthenium', chance: 1 / 6275 },
  { name: 'Rhodium', chance: 1 / 6250 },
  { name: 'Palladium', chance: 1 / 6225 },
  { name: 'Carpal', chance: 1 / 6200 },
  { name: 'Silver', chance: 1 / 6175 },
  { name: 'Cadmium', chance: 1 / 6150 },
  { name: 'Indium', chance: 1 / 6125 },
  { name: 'Interfere', chance: 1 / 6100 },
  { name: 'Tin', chance: 1 / 6075 },
  { name: 'cloudy', chance: 1 / 6050 },
  { name: 'Antimony', chance: 1 / 6025 },
  { name: 'Intermission', chance: 1 / 6000 },
  { name: 'Tellurium', chance: 1 / 5975 },
  { name: 'Iodine', chance: 1 / 5950 },
  { name: 'Xenon', chance: 1 / 5925 },
  { name: 'Alternate', chance: 1 / 5900 },
  { name: 'Cesium', chance: 1 / 5875 },
  { name: 'SyntaxError', chance: 1 / 5850 },
  { name: 'Barium', chance: 1 / 5825 },
  { name: 'Subzero', chance: 1 / 5800 },
  { name: 'Lanthanum', chance: 1 / 5775 },
  { name: 'Cerium', chance: 1 / 5750 },
  { name: 'Praseodymium', chance: 1 / 5725 },
  { name: 'Automatic', chance: 1 / 5700 },
  { name: 'Neodymium', chance: 1 / 5675 },
  { name: 'Promethium', chance: 1 / 5650 },
  { name: 'Samarium', chance: 1 / 5625 },
  { name: 'Encount', chance: 1 / 5600 },
  { name: 'Europium', chance: 1 / 5575 },
  { name: '🦶', chance: 1 / 5550 },
  { name: 'Gadolinium', chance: 1 / 5525 },
  { name: 'Telepath', chance: 1 / 5500 },
  { name: 'Terbium', chance: 1 / 5475 },
  { name: 'Dysprosium', chance: 1 / 5450 },
  { name: 'Holmium', chance: 1 / 5425 },
  { name: 'Airborne', chance: 1 / 5400 },
  { name: 'Erbium', chance: 1 / 5375 },
  { name: 'Thulium', chance: 1 / 5350 },
  { name: 'Ytterbium', chance: 1 / 5325 },
  { name: 'Viking', chance: 1 / 5300 },
  { name: 'Lutetium', chance: 1 / 5275 },
  { name: 'Hafnium', chance: 1 / 5250 },
  { name: 'Tantalum', chance: 1 / 5225 },
  { name: 'Wraith', chance: 1 / 5200 },
  { name: 'Tungsten', chance: 1 / 5175 },
  { name: 'Rhenium', chance: 1 / 5150 },
  { name: 'Osmium', chance: 1 / 5125 },
  { name: 'Spectral', chance: 1 / 5100 },
  { name: 'Iridium', chance: 1 / 5075 },
  { name: 'Platinum', chance: 1 / 5050 },
  { name: 'Polonium', chance: 1 / 5025 },
  { name: 'Nebula', chance: 1 / 5000 },
  { name: 'Radon', chance: 1 / 4975 },
  { name: 'Radium', chance: 1 / 4950 },
  { name: 'Actinium', chance: 1 / 4925 },
  { name: 'Vesper', chance: 1 / 4900 },
  { name: 'Thorium', chance: 1 / 4875 },
  { name: 'Protactinium', chance: 1 / 4850 },
  { name: 'Uranium', chance: 1 / 4825 },
  { name: 'Command', chance: 1 / 4800 },
  { name: 'Neptunium', chance: 1 / 4775 },
  { name: 'Plutonium', chance: 1 / 4750 },
  { name: 'Americium', chance: 1 / 4725 },
  { name: 'Quell', chance: 1 / 4700 },
  { name: 'Curium', chance: 1 / 4675 },
  { name: 'Berkelium', chance: 1 / 4650 },
  { name: 'Californium', chance: 1 / 4625 },
  { name: 'Unravel', chance: 1 / 4600 },
  { name: 'Einsteinium', chance: 1 / 4575 },
  { name: 'Fermium', chance: 1 / 4550 },
  { name: 'Mendelevium', chance: 1 / 4525 },
  { name: 'Decimate', chance: 1 / 4500 },
  { name: 'Nobelium', chance: 1 / 4475 },
  { name: 'Lawrencium', chance: 1 / 4450 },
  { name: 'Rutherfordium', chance: 1 / 4425 },
  { name: 'Comet', chance: 1 / 4400 },
  { name: 'Dubnium', chance: 1 / 4375 },
  { name: 'Seaborgium', chance: 1 / 4350 },
  { name: 'Bohrium', chance: 1 / 4325 },
  { name: 'Melancholy', chance: 1 / 4300 },
  { name: 'Hassium', chance: 1 / 4275 },
  { name: 'Meitnerium', chance: 1 / 4250 },
  { name: 'Darmstadtium', chance: 1 / 4225 },
  { name: 'Asteroid', chance: 1 / 4200 },
  { name: 'Roentgenium', chance: 1 / 4175 },
  { name: 'Copernicium', chance: 1 / 4150 },
  { name: 'Nihonium', chance: 1 / 4125 },
  { name: 'Radiation', chance: 1 / 4100 },
  { name: 'Flerovium', chance: 1 / 4075 },
  { name: 'Moscovium', chance: 1 / 4050 },
  { name: 'Livermorium', chance: 1 / 4025 },
  { name: 'Escensia', chance: 1 / 4000 },
  { name: 'Tennessine', chance: 1 / 3975 },
  { name: 'Oganesson', chance: 1 / 3950 },
  { name: 'Ionosphere', chance: 1 / 3925 },
  { name: 'Supermoon', chance: 1 / 3900 },
  { name: 'Mesosphere', chance: 1 / 3875 },
  { name: 'Stratosphere', chance: 1 / 3850 },
  { name: 'Troposphere', chance: 1 / 3825 },
  { name: 'Anxious', chance: 1 / 3800 },
  { name: 'Exosphere', chance: 1 / 3775 },
  { name: 'Thermosphere', chance: 1 / 3750 },
  { name: 'Magnetosphere', chance: 1 / 3725 },
  { name: 'Dreamless', chance: 1 / 3700 },
  { name: 'Heliosphere', chance: 1 / 3675 },
  { name: 'Plasmasphere', chance: 1 / 3650 },
  { name: 'Photosphere', chance: 1 / 3625 },
  { name: 'Wanderer', chance: 1 / 3600 },
  { name: 'Radiative', chance: 1 / 3575 },
  { name: 'Convective', chance: 1 / 3550 },
  { name: 'Tachocline', chance: 1 / 3525 },
  { name: 'Corpulence', chance: 1 / 3500 },
  { name: 'Nucleon', chance: 1 / 3475 },
  { name: 'Solutions', chance: 1 / 3450 },
  { name: 'Proton', chance: 1 / 3425 },
  { name: 'ok bro', chance: 1 / 3410 },
  { name: 'Points', chance: 1 / 3400 },
  { name: 'Electron', chance: 1 / 3375 },
  { name: 'just stop', chance: 1 / 3350 },
  { name: 'Positron', chance: 1 / 3325 },
  { name: 'Abandoned', chance: 1 / 3300 },
  { name: 'Antiproton', chance: 1 / 3275 },
  { name: 'Vertical', chance: 1 / 3250 },
  { name: 'Antineutron', chance: 1 / 3225 },
  { name: 'touch grass bro', chance: 1 / 3200 },
  { name: 'Muon', chance: 1 / 3175 },
  { name: 'Null', chance: 1 / 3170 },
  { name: 'Spectrum', chance: 1 / 3150 },
  { name: 'Tau', chance: 1 / 3145 },
  { name: 'deja vu', chance: 1 / 3128 },
  { name: 'Pioneer', chance: 1 / 3115 },
  { name: 'Perplexed', chance: 1 / 3100 },
  { name: 'Kaon', chance: 1 / 3085 },
  { name: 'Meson', chance: 1 / 3070 },
  { name: 'Zenith', chance: 1 / 3050 },
  { name: 'The End?', chance: 1 / 3000 },
  { name: 'Fermion', chance: 1 / 2990 },
  { name: 'Spectra', chance: 1 / 2978 },
  { name: 'Boson', chance: 1 / 2965 },
  { name: 'Poltergeist', chance: 1 / 2950 },
  { name: 'Gluon', chance: 1 / 2940 },
  { name: 'Graviton', chance: 1 / 2925 },
  { name: 'MURDER', chance: 1 / 2900 },
  { name: 'Quark', chance: 1 / 2875 },
  { name: 'Pixelated', chance: 1 / 2850 },
  { name: 'Charm', chance: 1 / 2840 },
  { name: 'Strange', chance: 1 / 2825 },
  { name: 'Nightmare', chance: 1 / 2800 },
  { name: 'Bottom', chance: 1 / 2790 },
  { name: 'Top', chance: 1 / 2775 },
  { name: 'Prophetic', chance: 1 / 2750 },
  { name: 'Upsilon', chance: 1 / 2740 },
  { name: 'Omega', chance: 1 / 2725 },
  { name: 'Lambda', chance: 1 / 2710 },
  { name: 'Delta', chance: 1 / 2665 },
  { name: 'Desire', chance: 1 / 2650 },
  { name: 'Experience', chance: 1 / 2637 },
  { name: 'Daydream', chance: 1 / 2600 },
  { name: 'Alpha', chance: 1 / 2560 },
  { name: 'bridged', chance: 1 / 2550 },
  { name: 'Peripherals', chance: 1 / 2500 },
  { name: 'kappa', chance: 1 / 2490 },
  { name: 'Micro', chance: 1 / 2450 },
  { name: 'Terminal', chance: 1 / 2400 },
  { name: 'pale', chance: 1 / 2390 },
  { name: 'Overload', chance: 1 / 2360 },
  { name: 'Equinox', chance: 1 / 2300 },
  { name: 'Thoughts', chance: 1 / 2250 },
  { name: 'Coherence', chance: 1 / 2200 },
  { name: 'Verbose', chance: 1 / 2150 },
  { name: 'Pillars', chance: 1 / 2140 },
  { name: 'horsehead hahahaha', chance: 1 / 2125 },
  { name: 'Solstice', chance: 1 / 2100 },
  { name: 'Orion', chance: 1 / 2090 },
  { name: 'Crab', chance: 1 / 2075 },
  { name: 'Paralysis', chance: 1 / 2050 },
  { name: 'Veil', chance: 1 / 2040 },
  { name: 'Ring', chance: 1 / 2025 },
  { name: 'Paradox', chance: 1 / 2000 },
  { name: 'Helix', chance: 1 / 1990 },
  { name: 'Dumbbell', chance: 1 / 1975 },
  { name: 'Duration', chance: 1 / 1950 },
  { name: 'Owl', chance: 1 / 1940 },
  { name: 'Butterfly', chance: 1 / 1925 },
  { name: 'Despair', chance: 1 / 1900 },
  { name: 'Eskimo', chance: 1 / 1890 },
  { name: 'Lagoon', chance: 1 / 1875 },
  { name: 'funny haha', chance: 1 / 1870 },
  { name: 'Wildfire', chance: 1 / 1854 },
  { name: 'Trifid', chance: 1 / 1840 },
  { name: 'Eagle', chance: 1 / 1825 },
  { name: 'Insanity', chance: 1 / 1800 },
  { name: 'Rosette', chance: 1 / 1790 },
  { name: 'Purpose', chance: 1 / 1750 },
  { name: 'Pelican', chance: 1 / 1725 },
  { name: 'Lunarity', chance: 1 / 1700 },
  { name: 'Swan', chance: 1 / 1690 },
  { name: 'California', chance: 1 / 1675 },
  { name: 'Twilight', chance: 1 / 1650 },
  { name: 'Cone', chance: 1 / 1640 },
  { name: 'Iris', chance: 1 / 1625 },
  { name: 'Constellation', chance: 1 / 1600 },
  { name: 'still playing?', chance: 1 / 1590 },
  { name: 'Jellyfish', chance: 1 / 1575 },
  { name: 'Gold', chance: 1 / 1570 },
  { name: 'wowie', chance: 1 / 1570 },
  { name: 'Heart', chance: 1 / 1560 },
  { name: 'Soul', chance: 1 / 1555 },
  { name: 'Aperture', chance: 1 / 1550 },
  { name: 'Eclipse', chance: 1 / 1500 },
  { name: 'Flame', chance: 1 / 1490 },
  { name: 'Tarantula', chance: 1 / 1475 },
  { name: '<>', chance: 1 / 1466 },
  { name: 'Keyhole', chance: 1 / 1455 },
  { name: 'Inferno', chance: 1 / 1444 },
  { name: 'Carina', chance: 1 / 1430 },
  { name: 'Tempered', chance: 1 / 1425 },
  { name: 'Documented', chance: 1 / 1410 },
  { name: 'Matrix', chance: 1 / 1405 },
  { name: 'Grayscale', chance: 1 / 1400 },
  { name: 'Homunculus', chance: 1 / 1390 },
  { name: 'Garden', chance: 1 / 1380 },
  { name: 'Constant', chance: 1 / 1350 },
  { name: 'Trapezium', chance: 1 / 1335 },
  { name: 'Access', chance: 1 / 1320 },
  { name: 'Betelgeuse', chance: 1 / 1310 },
  { name: 'Gladiator', chance: 1 / 1300 },
  { name: 'Rigel', chance: 1 / 1285 },
  { name: 'Sirius', chance: 1 / 1270 },
  { name: 'Amethyst', chance: 1 / 1260 },
  { name: 'Blink', chance: 1 / 1245 },
  { name: 'Cobalt', chance: 1 / 1230 },
  { name: 'Procyon', chance: 1 / 1215 },
  { name: 'Terrifying', chance: 1 / 1200 },
  { name: 'Aldebaran', chance: 1 / 1190 },
  { name: 'Heliocentric', chance: 1 / 1175 },
  { name: 'Antares', chance: 1 / 1160 },
  { name: 'Comet', chance: 1 / 1150 },
  { name: 'Arcturus', chance: 1 / 1140 },
  { name: 'Vega', chance: 1 / 1125 },
  { name: 'anyone there?', chance: 1 / 1100 },
  { name: 'Capella', chance: 1 / 1090 },
  { name: 'Stressed', chance: 1 / 1075 },
  { name: 'Pollux', chance: 1 / 1060 },
  { name: 'Divine', chance: 1 / 1050 },
  { name: 'Fomalhaut', chance: 1 / 1035 },
  { name: 'Meteor', chance: 1 / 1025 },
  { name: 'Deneb', chance: 1 / 1010 },
  { name: 'Lunar', chance: 1 / 1000 },
  { name: 'Regulus', chance: 1 / 990 },
  { name: 'Hopeless', chance: 1 / 975 },
  { name: 'Altair', chance: 1 / 960 },
  { name: 'Appalled', chance: 1 / 950 },
  { name: 'Spica', chance: 1 / 935 },
  { name: 'Dreamy', chance: 1 / 930 },
  { name: 'Index', chance: 1 / 915 },
  { name: 'Catastropic', chance: 1 / 900 },
  { name: 'Achernar', chance: 1 / 885 },
  { name: 'Gravity', chance: 1 / 865 },
  { name: 'Hadar', chance: 1 / 850 },
  { name: 'Equations', chance: 1 / 830 },
  { name: 'Canopus', chance: 1 / 815 },
  { name: 'Tidal', chance: 1 / 800 },
  { name: 'Lucky', chance: 1 / 777 },
  { name: 'Starlight', chance: 1 / 750 },
  { name: 'Proxima', chance: 1 / 735 },
  { name: 'IO', chance: 1 / 720 },
  { name: 'Merciful', chance: 1 / 700 },
  { name: 'Worried', chance: 1 / 675 },
  { name: 'the spooky', chance: 1 / 666 },
  { name: 'Process', chance: 1 / 650 },
  { name: 'Celestial', chance: 1 / 625 },
  { name: 'Divinity', chance: 1 / 600 },
  { name: 'Lonely', chance: 1 / 575 },
  { name: 'Storm', chance: 1 / 550 },
  { name: 'Cosmos', chance: 1 / 535 },
  { name: 'Glass', chance: 1 / 520 },
  { name: 'Lazer', chance: 1 / 500 },
  { name: 'Jetdroid', chance: 1 / 475 },
  { name: 'Prism', chance: 1 / 450 },
  { name: 'Ultra', chance: 1 / 430 },
  { name: 'Astral', chance: 1 / 400 },
  { name: 'Fearful', chance: 1 / 375 },
  { name: 'Orbit', chance: 1 / 350 },
  { name: 'Solar', chance: 1 / 325 },
  { name: 'Chroma', chance: 1 / 300 },
  { name: 'Guilty', chance: 1 / 275 },
  { name: 'Theory', chance: 1 / 250 },
  { name: 'heartstruck', chance: 1 / 230 },
  { name: 'Crazy', chance: 1 / 200 },
  { name: 'Saturn', chance: 1 / 185 },
  { name: 'Lapis', chance: 1 / 170 },
  { name: 'Fabled', chance: 1 / 150 },
  { name: 'Troubled', chance: 1 / 135 },
  { name: 'Superior', chance: 1 / 120 },
  { name: 'Jupiter', chance: 1 / 110 },
  { name: 'Rainbow', chance: 1 / 100 },
  { name: 'meh', chance: 1 / 95 },
  { name: 'Distorted', chance: 1 / 90 },
  { name: 'windy', chance: 1 / 86 },
  { name: 'sandy', chance: 1 / 82 },
  { name: 'Hardcore', chance: 1 / 80 },
  { name: 'Berry', chance: 1 / 75 },
  { name: 'Lucid', chance: 1 / 72 },
  { name: 'Legendary', chance: 1 / 70 },
  { name: 'Mars', chance: 1 / 65 },
  { name: 'Neon', chance: 1 / 60 },
  { name: 'Comfort', chance: 1 / 55 },
  { name: 'Amazing', chance: 1 / 50 },
  { name: 'Voltage', chance: 1 / 47 },
  { name: 'skill issue', chance: 1 / 46 },
  { name: 'Epic', chance: 1 / 45 },
  { name: 'Venus', chance: 1 / 40 },
  { name: 'Formula', chance: 1 / 37 },
  { name: 'Rare', chance: 1 / 35 },
  { name: 'Apple', chance: 1 / 33 },
  { name: 'Good', chance: 1 / 30 },
  { name: 'Mercury', chance: 1 / 26 },
  { name: 'Cherry', chance: 1 / 23 },
  { name: 'Decent', chance: 1 / 20 },
  { name: 'Tired', chance: 1 / 15 },
  { name: 'Cool', chance: 1 / 10 },
  { name: 'roll more CMON', chance: 1 / 9 },
  { name: 'Blown', chance: 1 / 7 },
  { name: 'Garbage', chance: 1 / 5 },
  { name: 'Uncommon', chance: 1 / 4 },
  { name: 'Common', chance: 1 / 2 },
];

// Cutscene mapping
const cutsceneMap = {
  cat: 'https://file.garden/aOU9Jj7oTh45Xi6u/videoplayback.mp4',
  SUMMER: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260109145920.mp4',
  'finished.': 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260110120227.mp4',
  Points: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Electron: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  'just stop': 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Positron: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Promethium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Neodymium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Automatic: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Praseodymium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Cerium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Lanthanum: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Subzero: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Barium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  SyntaxError: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Cesium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Alternate: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Titanium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Scandium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Calcium: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
  Script: 'https://file.garden/aOU9Jj7oTh45Xi6u/lv_0_20260203173113.mp4',
};
let isCutscenePlaying = false;

function playCutscene(rarityName, callback) {
  const videoUrl = cutsceneMap[rarityName];
  if (!videoUrl) {
    callback();
    return;
  }

  isCutscenePlaying = true;
  rollBtn.disabled = true;

  // STOP ALL MUSIC BEFORE CUTSCENE BECAUSE YES OF COURSE
  const wasBackgroundMusicPlaying = !backgroundMusic.paused;
  const wasLunarMusicPlaying = !lunarMusic.paused;
  backgroundMusic.pause();
  lunarMusic.pause();

  const overlay = document.getElementById('cutsceneOverlay');
  const video = document.getElementById('cutsceneVideo');

  video.src = videoUrl;
  overlay.classList.add('active');

  // fade in
  setTimeout(() => {
    video.play().catch((err) => {
      console.error('Video playback failed:', err);
      endCutscene(
        overlay,
        callback,
        wasBackgroundMusicPlaying,
        wasLunarMusicPlaying,
      );
    });
  }, 100);

  // when video ends
  video.onended = () => {
    endCutscene(
      overlay,
      callback,
      wasBackgroundMusicPlaying,
      wasLunarMusicPlaying,
    );
  };

  // Error handling
  video.onerror = () => {
    console.error('video failed to load');
    endCutscene(
      overlay,
      callback,
      wasBackgroundMusicPlaying,
      wasLunarMusicPlaying,
    );
  };
}

function endCutscene(
  overlay,
  callback,
  wasBackgroundMusicPlaying,
  wasLunarMusicPlaying,
) {
  // fade out
  overlay.classList.add('fadeout');

  setTimeout(() => {
    overlay.classList.remove('active', 'fadeout');
    const video = document.getElementById('cutsceneVideo');
    video.pause();
    video.src = '';

    callback();

    // RESUME MUSIC AFTER CUTSCENE (if it was playing before)
    const isMuted = checkMuteSettings();
    if (!isMuted) {
      if (wasBackgroundMusicPlaying) {
        backgroundMusic.play().catch(() => {});
      }
      if (wasLunarMusicPlaying) {
        lunarMusic.play().catch(() => {});
      }
    }

    // Re-enable rolling after 5 seconds
    setTimeout(() => {
      isCutscenePlaying = false;
      rollBtn.disabled = false;
    }, 5000);
  }, 500);
}

const achievementsList = [
  {
    id: 'roller',
    name: 'Roller',
    subtitle: 'Get 100 Rolls',
    check: () => totalRolls >= 100,
  },
  {
    id: 'gambler',
    name: 'Gambler',
    subtitle: 'Get 200 Rolls',
    check: () => totalRolls >= 200,
  },
  {
    id: 'discordMod',
    name: 'Discord Mod',
    subtitle: 'Get 300 Rolls',
    check: () => totalRolls >= 300,
  },
  {
    id: 'touchGrass',
    name: 'Touch Grass Please',
    subtitle: 'Get 400 Rolls',
    check: () => totalRolls >= 400,
  },
  {
    id: 'addicted',
    name: 'Addicted',
    subtitle: 'Get 500 Rolls',
    check: () => totalRolls >= 500,
  },
  {
    id: 'insane',
    name: 'Insane',
    subtitle: 'Get 600 Rolls',
    check: () => totalRolls >= 600,
  },
  {
    id: 'joel',
    name: 'Joel',
    subtitle: 'Get 700 Rolls',
    check: () => totalRolls >= 700,
  },
  {
    id: 'crazyAddicted',
    name: 'Crazy Addicted',
    subtitle: 'Get 800 Rolls',
    check: () => totalRolls >= 800,
  },
  {
    id: 'funkyTown',
    name: 'Funky Town',
    subtitle: 'Get 900 Rolls',
    check: () => totalRolls >= 900,
  },
  {
    id: 'outsideTime',
    name: "It's Outside Time Now",
    subtitle: 'Get 1000 Rolls',
    check: () => totalRolls >= 1000,
  },
  {
    id: 'actually-addicted',
    name: 'Actually Addicted',
    subtitle: 'Get 5000 Rolls',
    check: () => totalRolls >= 5000,
  },
  {
    id: 'what',
    name: '..what',
    subtitle: 'Get 7000 Rolls',
    check: () => totalRolls >= 7000,
  },
  {
    id: 'devoted',
    name: 'Devoted',
    subtitle: 'Get 10000 Rolls',
    check: () => totalRolls >= 10000,
  },
  {
    id: 'get-a-job',
    name: 'get a job',
    subtitle: 'Get 15000 Rolls',
    check: () => totalRolls >= 15000,
  },
  {
    id: 'genuinely-insane',
    name: 'Genuinely Insane',
    subtitle: 'Get 25000 Rolls',
    check: () => totalRolls >= 25000,
  },
  {
    id: 'roll-factory',
    name: 'Roll Factory',
    subtitle: 'Get 30000 Rolls',
    check: () => totalRolls >= 30000,
  },
  {
    id: 'just-one-more-roll',
    name: 'Just One More Roll',
    subtitle: 'Get 50000 Rolls',
    check: () => totalRolls >= 50000,
  },
  {
    id: 'got-no-life',
    name: 'Got No LIfe',
    subtitle: 'Get 70000 Rolls',
    check: () => totalRolls >= 70000,
  },
  {
    id: 'introverted',
    name: 'Introverted',
    subtitle: 'Get 150000 Rolls',
    check: () => totalRolls >= 150000,
  },
  {
    id: 'holy-hell',
    name: 'HOLY HELL',
    subtitle: 'Get 500000 Rolls',
    check: () => totalRolls >= 500000,
  },
  {
    id: 'dude',
    name: 'dude',
    subtitle: 'Get 1000000 Rolls',
    check: () => totalRolls >= 1000000,
  },
  {
    id: 'please-just-stop',
    name: 'PLEASE JUST STOP',
    subtitle: 'Get 5000000 Rolls',
    check: () => totalRolls >= 5000000,
  },
  {
    id: 'you-will-pay',
    name: 'you will pay',
    subtitle: 'Get 10000000 Rolls',
    check: () => totalRolls >= 10000000,
  },
  {
    id: 'startingOut',
    name: 'Starting Out',
    subtitle: 'Get A Rarity Under 1/70',
    check: (rarity) => rarity && 1 / rarity.chance < 70,
  },
  {
    id: 'lucky',
    name: 'Lucky',
    subtitle: 'Get A Rarity Above 1/70',
    check: (rarity) => rarity && 1 / rarity.chance > 70,
  },
  {
    id: 'spammin',
    name: 'Spammin',
    subtitle: 'Get A Rarity Above 1/300',
    check: (rarity) => rarity && 1 / rarity.chance > 300,
  },
  {
    id: 'leftHanded',
    name: 'Left Handed',
    subtitle: 'Get A Rarity Above 1/600',
    check: (rarity) => rarity && 1 / rarity.chance > 600,
  },
  {
    id: 'insanelyLucky',
    name: 'Insanely Lucky',
    subtitle: 'Get A Rarity Above 1/800',
    check: (rarity) => rarity && 1 / rarity.chance > 800,
  },
  {
    id: 'lunar',
    name: 'Lunar',
    subtitle: 'Get Lunar',
    check: (rarity) => rarity && rarity.name === 'Lunar',
  },
  {
    id: 'jackpot',
    name: 'Jackpot',
    subtitle: 'Get A Rarity Above 5000',
    check: (rarity) => rarity && 1 / rarity.chance > 5000,
  },
  {
    id: 'antimatter',
    name: 'Antimatter',
    subtitle: 'Get A Rarity Above 15000',
    check: (rarity) => rarity && 1 / rarity.chance > 15000,
  },
  {
    id: 'oh-my-god',
    name: 'oh my god',
    subtitle: 'Get A Rarity Above 50000',
    check: (rarity) => rarity && 1 / rarity.chance > 50000,
  },
  {
    id: 'market-crash',
    name: 'Market Crash',
    subtitle: 'Get A Rarity Above 100000',
    check: (rarity) => rarity && 1 / rarity.chance > 100000,
  },
  {
    id: 'phenomenon',
    name: 'Phenomenon',
    subtitle: 'Get A Rarity Above 10000000',
    check: (rarity) => rarity && 1 / rarity.chance > 10000000,
  },
  {
    id: 'ok-bro',
    name: 'ok bro',
    subtitle: 'Get A Rarity Above 1000000000',
    check: (rarity) => rarity && 1 / rarity.chance > 1000000000,
  },
  {
    id: 'summer',
    name: 'SUMMER',
    subtitle: 'Get SUMMER',
    check: (rarity) => rarity && rarity.name === 'SUMMER',
  },
];

function updateAchievementsUI() {
  achievementsContainer.innerHTML = '';
  achievementsList.forEach((ach) => {
    const unlocked = achievementsUnlocked.has(ach.id);
    const div = document.createElement('div');
    div.className = 'achievement' + (unlocked ? ' unlocked' : '');
    const nameEl = document.createElement('div');
    nameEl.className = 'achievement-name';
    nameEl.textContent = ach.name;
    const subEl = document.createElement('div');
    subEl.className = 'achievement-subtitle';
    subEl.textContent = ach.subtitle;
    div.appendChild(nameEl);
    div.appendChild(subEl);
    achievementsContainer.appendChild(div);
  });
}

function saveAllData() {
  const arr = Array.from(inventoryData.values()).map(
    ({ rarityObj, count }) => ({
      name: rarityObj.name,
      chance: rarityObj.chance,
      count,
    }),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  localStorage.setItem(TOTAL_ROLLS_KEY, totalRolls);
  localStorage.setItem(
    ACHIEVEMENTS_KEY,
    JSON.stringify(Array.from(achievementsUnlocked)),
  );
  localStorage.setItem(ANOMALIES_KEY, String(anomalies));
  localStorage.setItem(ANOMALIES_USED_KEY, String(anomaliesUsed));
  localStorage.setItem(POINTS_KEY, points);
  localStorage.setItem(SHOP_UPGRADES_KEY, JSON.stringify(shopUpgrades));
  localStorage.setItem(
    SOLD_OUT_KEY,
    JSON.stringify(Array.from(soldOutRarities.entries())),
  );
  localStorage.setItem(POTIONS_KEY, JSON.stringify(playerPotions));
  localStorage.setItem(
    ACTIVE_POTIONS_KEY,
    JSON.stringify({
      active: activePotions,
      duplicateLeft: duplicateRollsLeft,
    }),
  );
}

function loadAllData() {
  const sr = localStorage.getItem(TOTAL_ROLLS_KEY);
  if (sr !== null) {
    totalRolls = parseInt(sr, 10);
    updateTotalRolls();
  }

  const sv = localStorage.getItem(STORAGE_KEY);
  if (sv) {
    try {
      JSON.parse(sv).forEach((item) => {
        const o = rarities.find((r) => r.name === item.name);
        if (o) {
          const li = document.createElement('li');
          inventoryData.set(o.name, {
            rarityObj: o,
            count: item.count,
            liElement: li,
          });
          updateItem(inventoryData.get(o.name));
          inventoryList.appendChild(li);
        }
      });
    } catch {}
  }

  const sa = localStorage.getItem(ACHIEVEMENTS_KEY);
  if (sa) {
    try {
      const arr = JSON.parse(sa);
      arr.forEach((id) => achievementsUnlocked.add(id));
    } catch {}
  }
  updateAchievementsUI();

  const saAnom = localStorage.getItem(ANOMALIES_KEY);
  if (saAnom !== null) anomalies = parseInt(saAnom, 10) || 0;
  const saAnomUsed = localStorage.getItem(ANOMALIES_USED_KEY);
  if (saAnomUsed !== null) anomaliesUsed = parseInt(saAnomUsed, 10) || 0;
  recalcLuckMultiplier();
}

function updateTotalRolls() {
  totalRollsEl.textContent = `total rolls: ${totalRolls}`;
}

function addToInventory(o) {
  if (inventoryData.has(o.name)) {
    const d = inventoryData.get(o.name);
    d.count++;
    updateItem(d);
  } else {
    const li = document.createElement('li');
    inventoryData.set(o.name, { rarityObj: o, count: 1, liElement: li });
    updateItem(inventoryData.get(o.name));
    inventoryList.appendChild(li);
  }
  inventoryList.scrollTop = inventoryList.scrollHeight;
  updateCollectedCounter();

  if (shopUpgrades.duplicate > 0) {
    const dupeChance = shopUpgrades.duplicate / 100;
    if (Math.random() < dupeChance) {
      // Add another copy!
      if (inventoryData.has(o.name)) {
        const d = inventoryData.get(o.name);
        d.count++;
        updateItem(d);
      }
      showAnomalyPopup('duplicate proc!');
    }
  }

  // Handle duplicate potion
  if (duplicateRollsLeft > 0) {
    if (inventoryData.has(o.name)) {
      const d = inventoryData.get(o.name);
      d.count++;
      updateItem(d);
    }
    duplicateRollsLeft--;
    updateActivePotionsDisplay();
    saveAllData();
  }
}

document.getElementById('buyMagnetBtn').addEventListener('click', () => {
  const cost = 500 + shopUpgrades.magnet * 1000;
  if (points >= cost && shopUpgrades.magnet < 5) {
    points -= cost;
    shopUpgrades.magnet++;
    updatePointsDisplay();
    updateShopUI();
    saveAllData();
  }
});

document.getElementById('buyPrinterBtn').addEventListener('click', () => {
  const cost = 1000 + shopUpgrades.printer * shopUpgrades.printer * 500;
  if (points >= cost) {
    points -= cost;
    shopUpgrades.printer++;
    updatePointsDisplay();
    updateShopUI();
    saveAllData();
  }
});

document.getElementById('buyDupeBtn').addEventListener('click', () => {
  const cost = 800 + shopUpgrades.duplicate * shopUpgrades.duplicate * 400;
  if (points >= cost && shopUpgrades.duplicate < 10) {
    points -= cost;
    shopUpgrades.duplicate++;
    updatePointsDisplay();
    updateShopUI();
    saveAllData();
  }
});

// Point printer passive generation
setInterval(() => {
  if (shopUpgrades.printer > 0) {
    points += shopUpgrades.printer;
    updatePointsDisplay();
  }
}, 1000);

function updateItem(d) {
  const { rarityObj, count, liElement } = d;
  const denom = Math.round(1 / rarityObj.chance);

  liElement.textContent =
    count > 1
      ? `${rarityObj.name} (1/${denom}) x${count}`
      : `${rarityObj.name} (1/${denom})`;

  liElement.classList.add('new-roll');
  setTimeout(() => liElement.classList.remove('new-roll'), 2000);

  const key = rarityObj.name;
  const soldData = soldOutRarities.get(key);
  if (soldData && soldData.count >= count) {
    liElement.classList.add('sold-out');
  } else {
    liElement.classList.remove('sold-out');
  }

  // Remove old handler by replacing element (prevents memory leaks)
  liElement.ondblclick = null;

  // Add new handler
  liElement.addEventListener(
    'dblclick',
    function sellHandler() {
      const currentData = inventoryData.get(rarityObj.name);
      if (!currentData) return;

      const soldData = soldOutRarities.get(key);
      const alreadySold = soldData ? soldData.count : 0;
      const availableToSell = currentData.count - alreadySold;

      if (availableToSell <= 0) {
        alert('all copies already sold out!');
        return;
      }

      const pointsEarned = calculateRarityPoints(rarityObj) * availableToSell;

      showConfirmModal(
        'sell rarity?',
        `sell ${availableToSell}x ${rarityObj.name} for ${pointsEarned} points? (you keep the rarity)`,
        () => {
          points += pointsEarned;
          soldOutRarities.set(key, { count: currentData.count });
          updatePointsDisplay();
          updateShopUI();
          saveAllData();
          updateItem(currentData);
          recalcLuckMultiplier();
          updateLuckDisplay();
        },
      );
    },
    { once: false },
  );
}

function getRandomRarity() {
  let totalWeight = 0;
  rarities.forEach((r) => {
    const denom = Math.round(1 / r.chance);
    const isNoticeable = denom >= 100;

    let mult = 1;
    if (luckBoostActive && isNoticeable) mult *= 4;
    if (isNoticeable) mult *= globalLuckMultiplier;

    // Rarity magnet - boost uncollected rarities
    if (shopUpgrades.magnet > 0 && !inventoryData.has(r.name) && isNoticeable) {
      mult *= 1 + shopUpgrades.magnet * 0.1;
    }

    totalWeight += r.chance * mult;
  });

  let rand = Math.random() * totalWeight;

  for (const o of rarities) {
    const denom = Math.round(1 / o.chance);
    const isNoticeable = denom >= 100;
    let mult = 1;
    if (luckBoostActive && isNoticeable) mult *= 4;
    if (isNoticeable) mult *= globalLuckMultiplier;

    // Rarity magnet
    if (shopUpgrades.magnet > 0 && !inventoryData.has(o.name) && isNoticeable) {
      mult *= 1 + shopUpgrades.magnet * 0.1;
    }

    const effectiveChance = o.chance * mult;
    rand -= effectiveChance;
    if (rand <= 0) return o;
  }

  return rarities[rarities.length - 1];
}

function checkAchievements(currentRarity) {
  let newlyUnlocked = false;
  achievementsList.forEach((ach) => {
    if (!achievementsUnlocked.has(ach.id)) {
      if (ach.check(currentRarity)) {
        achievementsUnlocked.add(ach.id);
        newlyUnlocked = true;
      }
    }
  });
  if (newlyUnlocked) {
    updateAchievementsUI();
    saveAllData();
  }
}

function updateAnomalyUI() {
  const el = document.getElementById('anomalyCount');
  if (!el) return;
  el.textContent = `Anomalies: ${anomalies}`;

  const btn = document.getElementById('consumeAnomalyBtn');
  if (btn) btn.disabled = anomalies <= 0;

  const allBtn = document.getElementById('consumeAllAnomaliesBtn');
  if (allBtn) allBtn.disabled = anomalies <= 0;
}

function awardAnomalyIfEligible(rarityObj) {
  if (!rarityObj) return false;
  const denom = Math.round(1 / rarityObj.chance);
  if (denom > 10000) {
    anomalies++;
    try {
      localStorage.setItem(ANOMALIES_KEY, String(anomalies));
    } catch {}
    showAnomalyPopup('+1 anomaly');
    updateAnomalyUI();
    saveAllData();
    return true;
  }
  return false;
}

function showAnomalyPopup(text) {
  let p = document.getElementById('anomalyPopup');
  if (!p) {
    p = document.createElement('div');
    p.id = 'anomalyPopup';
    document.body.appendChild(p);
  }
  p.textContent = text;
  p.classList.add('show');
  setTimeout(() => p.classList.remove('show'), 1500);
}

function consumeAnomaly() {
  if (anomalies <= 0) {
    alert('no anomalies to consume :(');
    return;
  }
  anomalies--;
  anomaliesUsed++;
  recalcLuckMultiplier();
  updateAnomalyUI();
  updateLuckDisplay();
  saveAllData();
  showAnomalyPopup('ANOMALY CONSUMED! permanent boost');
}

function consumeAllAnomalies() {
  if (anomalies <= 0) {
    alert('no anomalies to consume :(');
    return;
  }

  const count = anomalies;
  anomaliesUsed += count;
  anomalies = 0;

  recalcLuckMultiplier();
  updateAnomalyUI();
  updateLuckDisplay();
  saveAllData();
  showAnomalyPopup(
    `CONSUMED ${count} ANOMALIES! +${(count * 0.5).toFixed(1)}x permanent luck!`,
  );
}

function renderSortedInventory(mode) {
  inventoryList.innerHTML = '';

  let items = Array.from(inventoryData.values());

  if (mode === 'rare') {
    items.sort((a, b) => a.rarityObj.chance - b.rarityObj.chance);
  }

  if (mode === 'common') {
    items.sort((a, b) => b.rarityObj.chance - a.rarityObj.chance);
  }

  if (mode === 'alpha') {
    items.sort((a, b) => a.rarityObj.name.localeCompare(b.rarityObj.name));
  }

  items.forEach((d) => inventoryList.appendChild(d.liElement));
}

const savedPoints = localStorage.getItem(POINTS_KEY);
if (savedPoints !== null) points = parseInt(savedPoints, 10) || 0;

const savedUpgrades = localStorage.getItem(SHOP_UPGRADES_KEY);
if (savedUpgrades) {
  try {
    shopUpgrades = JSON.parse(savedUpgrades);
  } catch {}
}

const savedSoldOut = localStorage.getItem(SOLD_OUT_KEY);
if (savedSoldOut) {
  try {
    soldOutRarities = new Map(JSON.parse(savedSoldOut));
  } catch {}
}

shopLuckMultiplier = 1 + shopUpgrades.luck * 0.1;
rollSpeed = Math.max(0.25, 1.0 - shopUpgrades.speed * 0.2);
pointDivisor = Math.max(1.0, 3.0 - shopUpgrades.pointMult * 0.2);

const savedPotions = localStorage.getItem(POTIONS_KEY);
if (savedPotions) {
  try {
    playerPotions = JSON.parse(savedPotions);
  } catch {}
}

const savedActive = localStorage.getItem(ACTIVE_POTIONS_KEY);
if (savedActive) {
  try {
    const data = JSON.parse(savedActive);
    activePotions = data.active || [];
    duplicateRollsLeft = data.duplicateLeft || 0;
    recalcPotionLuck();
    updateActivePotionsDisplay();
  } catch {}
}

updatePotionUI();
recalcLuckMultiplier();
updatePointsDisplay();
updateShopUI();

function resetInventory() {
  if (
    confirm(
      'are you comfortably sure that you will delete your sweet sweet data???',
    )
  ) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOTAL_ROLLS_KEY);
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    localStorage.removeItem(ANOMALIES_KEY);
    localStorage.removeItem(ANOMALIES_USED_KEY);
    localStorage.removeItem(POINTS_KEY);
    localStorage.removeItem(SHOP_UPGRADES_KEY);
    localStorage.removeItem(SOLD_OUT_KEY);
    localStorage.removeItem(LUCK_KEY);
    localStorage.removeItem('daily_lastClaim');
    localStorage.removeItem('daily_streak');
    localStorage.removeItem('weekly_lastClaim');
    localStorage.removeItem('weekly_streak');
    localStorage.removeItem(playtimeKey);

    inventoryData.clear();
    inventoryList.innerHTML = '';
    achievementsUnlocked.clear();
    updateAchievementsUI();
    totalRolls = 0;
    updateTotalRolls();
    points = 0;
    anomalies = 0;
    anomaliesUsed = 0;
    shopUpgrades = { luck: 0, speed: 0, pointMult: 0 };
    soldOutRarities.clear();
    shopLuckMultiplier = 1.0;
    rollSpeed = 1.0;
    pointDivisor = 3.0;
    totalSeconds = 0;

    recalcLuckMultiplier();
    updatePointsDisplay();
    updateShopUI();
    updateAnomalyUI();
    updatePlaytimeDisplay();
    updateLuckDisplay();

    alert('all data reset! it was your choice btw');
    location.reload();
  }
}

function startLuckBoost() {
  luckBoostActive = true;
  luckBoostEndTime = Date.now() + 60000;
  updateLuckDisplay();

  document.getElementById('luckBoostOverlay').style.display = 'flex';

  localStorage.setItem(
    LUCK_KEY,
    JSON.stringify({
      active: luckBoostActive,
      endTime: luckBoostEndTime,
    }),
  );

  if (luckInterval) clearInterval(luckInterval);
  luckInterval = setInterval(updateLuckTimer, 200);
}

function updateLuckTimer() {
  const timerEl = document.getElementById('luckTimer');

  const msLeft = luckBoostEndTime - Date.now();

  if (msLeft <= 0) {
    endLuckBoost();
    return;
  }

  timerEl.textContent = Math.ceil(msLeft / 1000);
}

function endLuckBoost() {
  luckBoostActive = false;
  luckBoostEndTime = 0;
  updateLuckDisplay();

  document.getElementById('luckBoostOverlay').style.display = 'none';

  if (luckInterval) clearInterval(luckInterval);

  localStorage.removeItem(LUCK_KEY);
}

function checkMuteSettings() {
  try {
    const settingsStr = localStorage.getItem('userSettings');
    if (settingsStr) {
      const settings = JSON.parse(settingsStr);
      if (settings.muted) {
        backgroundMusic.pause();
        backgroundMusic.volume = 0;
        lunarMusic.pause();
        lunarMusic.volume = 0;
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function spinAndReveal(res) {
  spinner.innerHTML = '';
  const items = [];
  for (let i = 0; i < 50; i++) {
    items.push(rarities[Math.floor(Math.random() * rarities.length)]);
  }
  items.push(res);
  items.forEach((o) => {
    const d = document.createElement('div');
    d.className = 'spin-item';
    d.textContent = o.name;
    spinner.appendChild(d);
  });

  if (totalRolls % 100 === 0) {
    startLuckBoost();
  }

  const h = 48,
    total = items.length,
    scroll = h * (total - 1);
  const duration = rollSpeed;
  spinner.style.transition = `transform ${duration}s ease-out`;
  spinner.style.transform = `translateY(-${scroll}px)`;

  setTimeout(
    () => {
      totalRolls++;
      updateTotalRolls();
      addToInventory(res);
      awardAnomalyIfEligible(res);
      checkAchievements(res);

      // Check if this rarity has a cutscene edeedded
      if (cutsceneMap[res.name]) {
        playCutscene(res.name, () => {
          // after cutscene ends, handle music
          const isMuted = checkMuteSettings();

          if (res.name === 'Lunar') {
            if (!isMuted) {
              lunarMusic.currentTime = 0;
              lunarMusic.play();
            }
            backgroundMusic.pause();
          } else {
            lunarMusic.pause();
            if (!isMuted) {
              backgroundMusic.play();
            }
          }

          saveAllData();
        });
      } else {
        // no cutscene, proceed normally
        const isMuted = checkMuteSettings();

        if (res.name === 'Lunar') {
          if (!isMuted) {
            lunarMusic.currentTime = 0;
            lunarMusic.play();
          }
          backgroundMusic.pause();
        } else {
          lunarMusic.pause();
          if (!isMuted) {
            backgroundMusic.play();
          }
        }

        rollBtn.disabled = false;
        saveAllData();
      }
    },
    duration * 1000 + 1000,
  );
}

const sortSelect = document.getElementById('sortSelect');

rollBtn.addEventListener('click', () => {
  if (isCutscenePlaying) return;
  rollBtn.disabled = true;
  spinner.style.transition = 'none';
  spinner.style.transform = 'translateY(0)';
  const res = getRandomRarity();

  const isMuted = checkMuteSettings();
  if (!isMuted && backgroundMusic.paused && res.name !== 'Lunar') {
    backgroundMusic.play().catch(() => {});
  }

  setTimeout(() => spinAndReveal(res), 100);
});

if (sortSelect) {
  sortSelect.addEventListener('change', () => {
    renderSortedInventory(sortSelect.value);
  });
}

resetBtn.addEventListener('click', resetInventory);

loadAllData();
updateTotalRolls();
const ls = localStorage.getItem(LUCK_KEY);
if (ls) {
  try {
    const obj = JSON.parse(ls);
    if (obj.active && obj.endTime > Date.now()) {
      luckBoostActive = true;
      luckBoostEndTime = obj.endTime;
      document.getElementById('luckBoostOverlay').style.display = 'flex';
      luckInterval = setInterval(updateLuckTimer, 200);
    } else {
      localStorage.removeItem(LUCK_KEY);
    }
  } catch {}
}

function updateCollectedCounter() {
  const collected = inventoryData.size;
  const total = rarities.length;
  document.getElementById('collectedCounter').textContent =
    `${collected}/${total} collected`;
}

updateAchievementsUI();
updateCollectedCounter();

const consumeBtn = document.getElementById('consumeAnomalyBtn');
if (consumeBtn) {
  consumeBtn.addEventListener('click', () => {
    consumeAnomaly();
  });
}

const consumeAllBtn = document.getElementById('consumeAllAnomaliesBtn');
if (consumeAllBtn) {
  consumeAllBtn.addEventListener('click', () => {
    consumeAllAnomalies();
  });
}

updateAnomalyUI();
renderSortedInventory(sortSelect.value);

setInterval(saveAllData, 10000);

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('rollBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      btn.classList.remove('scale-up');
      void btn.offsetWidth;
      btn.classList.add('scale-up');
    });
  } else {
    console.warn('rollBtn not found');
  }
});

function formatPlaytime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

const weeklyBtn = document.getElementById('weeklyBtn');
const weeklyStatus = document.getElementById('weeklyStatus');

function loadWeeklyData() {
  return {
    lastClaim: localStorage.getItem('weekly_lastClaim'),
    streak: Number(localStorage.getItem('weekly_streak') || 0),
  };
}

function saveWeeklyData(lastClaim, streak) {
  localStorage.setItem('weekly_lastClaim', lastClaim);
  localStorage.setItem('weekly_streak', streak);
}

function updateWeeklyUI() {
  const { lastClaim, streak } = loadWeeklyData();
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  if (!lastClaim || now - Number(lastClaim) >= oneWeek) {
    weeklyBtn.disabled = false;
    weeklyStatus.textContent = `weekly reward available · streak: ${streak}`;
  } else {
    weeklyBtn.disabled = true;
    weeklyStatus.textContent = `weekly claimed · streak: ${streak}`;
  }
}

weeklyBtn.addEventListener('click', () => {
  const { lastClaim, streak } = loadWeeklyData();
  const now = Date.now();
  let newStreak = streak;

  if (!lastClaim) {
    newStreak = 1;
  } else {
    const diffWeeks = Math.floor(
      (now - Number(lastClaim)) / (7 * 24 * 60 * 60 * 1000),
    );
    newStreak = diffWeeks === 1 ? streak + 1 : 1;
  }

  saveWeeklyData(now.toString(), newStreak);
  updateWeeklyUI();
  alert(`weekly claimed!\nstreak: ${newStreak}`);
});

updateWeeklyUI();

const dailyBtn = document.getElementById('dailyBtn');
const dailyStatus = document.getElementById('dailyStatus');

function getToday() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function loadDailyData() {
  return {
    lastClaim: localStorage.getItem('daily_lastClaim'),
    streak: Number(localStorage.getItem('daily_streak') || 0),
  };
}

function saveDailyData(lastClaim, streak) {
  localStorage.setItem('daily_lastClaim', lastClaim);
  localStorage.setItem('daily_streak', streak);
}

function updateDailyUI() {
  const { lastClaim, streak } = loadDailyData();
  const today = getToday();

  if (lastClaim === today) {
    dailyBtn.disabled = true;
    dailyStatus.textContent = `daily claimed · streak: ${streak}`;
  } else {
    dailyBtn.disabled = false;
    dailyStatus.textContent = `daily available · current streak: ${streak}`;
  }
}

dailyBtn.addEventListener('click', () => {
  const today = getToday();
  const { lastClaim, streak } = loadDailyData();

  let newStreak = streak;

  if (!lastClaim) {
    newStreak = 1;
  } else {
    const last = new Date(lastClaim);
    const now = new Date(today);

    const diffDays = Math.round((now - last) / (1000 * 60 * 60 * 24)); // fuh theres an error here that doesnt do ANYTHING... nastyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy

    if (diffDays === 1) {
      newStreak += 1;
    } else if (diffDays > 1) {
      newStreak = 1;
    }
  }

  saveDailyData(today, newStreak);
  updateDailyUI();

  alert(`daily claimed!\nstreak: ${newStreak}`);
});

updateDailyUI();

const genBtn = document.getElementById('generateRunCard');
if (genBtn) genBtn.addEventListener('click', generateRunCard);
else
  console.warn(
    'generateRunCard button not found in DOM, maybe consider... adding it in the DOM????',
  );

function generateRunCard() {
  const rarityCounts = {};
  for (const [name, { rarityObj, count }] of inventoryData.entries()) {
    rarityCounts[rarityObj.name] = (rarityCounts[rarityObj.name] || 0) + count;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0e0e0e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#dcdcdc';
  ctx.font = '18px monospace';
  ctx.fillText("auth's RNG ::: run summary", 40, 38);
  ctx.font = '12px monospace';
  ctx.fillText('────────────────────────', 40, 58);

  ctx.font = '14px monospace';
  let y = 90;
  const line = (t, indent = 0) => {
    ctx.fillText(t, 40 + indent, y);
    y += 22;
  };

  line(`total rolls        ${totalRolls}`);
  line(`playtime           ${formatPlaytime(totalSeconds)}`);
  line(`run id             ${runId}`);
  line('');
  line('rarities collected:');

  if (Object.keys(rarityCounts).length === 0) {
    line('  (none yet)');
  } else {
    const entries = Object.entries(rarityCounts).sort((a, b) => b[1] - a[1]);
    const MAX_LINES = 18;
    let i = 0;
    for (const [name, cnt] of entries) {
      if (i >= MAX_LINES) break;
      const short = name.length > 24 ? name.slice(0, 21) + '...' : name;
      line(`${short.padEnd(24)} x${cnt}`, 12);
      i++;
    }
    if (entries.length > MAX_LINES) {
      line(`...and ${entries.length - MAX_LINES} more`, 9);
    }
  }

  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'authsrng_run.png';

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  console.log('loaded!');
  console.log('all assets are loaded');
}

window.backgroundMusic = backgroundMusic;
window.lunarMusic = lunarMusic;

document.getElementById('buyLuckBtn').addEventListener('click', () => {
  const cost = 50 + shopUpgrades.luck * 25;
  if (points >= cost && shopUpgrades.luck < 100) {
    points -= cost;
    shopUpgrades.luck++;
    shopLuckMultiplier = 1 + shopUpgrades.luck * 0.1;
    recalcLuckMultiplier();
    updatePointsDisplay();
    updateShopUI();
    saveAllData();
  }
});

document.getElementById('buySpeedBtn').addEventListener('click', () => {
  const cost = 100 + shopUpgrades.speed * 50;
  if (points >= cost && shopUpgrades.speed < 3) {
    points -= cost;
    shopUpgrades.speed++;
    rollSpeed = Math.max(0.25, 1.0 - shopUpgrades.speed * 0.2);
    updatePointsDisplay();
    updateShopUI();
    saveAllData();
  }
});

document.getElementById('buyPointBtn').addEventListener('click', () => {
  const cost = 150 + shopUpgrades.pointMult * 75;
  if (points >= cost && shopUpgrades.pointMult < 10) {
    points -= cost;
    shopUpgrades.pointMult++;
    pointDivisor = Math.max(1.0, 3.0 - shopUpgrades.pointMult * 0.2);
    updatePointsDisplay();
    updateShopUI();
    saveAllData();
  }
});

const buyMagnetBtn = document.getElementById('buyMagnetBtn');
if (buyMagnetBtn) {
  buyMagnetBtn.addEventListener('click', () => {
    const cost = 500 + (shopUpgrades.magnet || 0) * 1000;
    if (points >= cost && (shopUpgrades.magnet || 0) < 5) {
      points -= cost;
      shopUpgrades.magnet = (shopUpgrades.magnet || 0) + 1;
      updatePointsDisplay();
      updateShopUI();
      saveAllData();
    }
  });
}

const buyPrinterBtn = document.getElementById('buyPrinterBtn');
if (buyPrinterBtn) {
  buyPrinterBtn.addEventListener('click', () => {
    const level = shopUpgrades.printer || 0;
    const cost = 1000 + level * level * 500;
    if (points >= cost) {
      points -= cost;
      shopUpgrades.printer = level + 1;
      updatePointsDisplay();
      updateShopUI();
      saveAllData();
    }
  });
}

const buyDupeBtn = document.getElementById('buyDupeBtn');
if (buyDupeBtn) {
  buyDupeBtn.addEventListener('click', () => {
    const level = shopUpgrades.duplicate || 0;
    const cost = 800 + level * level * 400;
    if (points >= cost && level < 10) {
      points -= cost;
      shopUpgrades.duplicate = level + 1;
      updatePointsDisplay();
      updateShopUI();
      saveAllData();
    }
  });
}

// Point printer passive generation
setInterval(() => {
  if (shopUpgrades.printer && shopUpgrades.printer > 0) {
    points += shopUpgrades.printer;
    updatePointsDisplay();
  }
}, 1000);
updatePointsDisplay();
updateShopUI();

document.addEventListener('DOMContentLoaded', function () {
  const indexBtn = document.getElementById('indexBtn');
  const indexModal = document.getElementById('indexModal');
  const indexClose = document.getElementById('indexClose');
  const indexList = document.getElementById('indexList');
  const indexStats = document.getElementById('indexStats');
  const indexSearch = document.getElementById('indexSearch');

  // Safety check
  if (!indexBtn || !indexModal || !indexClose || !indexList || !indexStats) {
    console.warn(
      'Index elements not found. Make sure modal HTML is in the page.',
    );
    return;
  }

  function openIndex() {
    updateIndexDisplay();
    indexModal.classList.add('show');
    if (indexSearch) {
      indexSearch.value = '';
      indexSearch.focus();
    }
  }

  function closeIndex() {
    indexModal.classList.remove('show');
  }

  function updateIndexDisplay(searchTerm = '') {
    // Update stats
    const collected = inventoryData.size;
    const total = rarities.length;
    indexStats.textContent = `${collected}/${total} collected`;

    // Clear and rebuild list
    indexList.innerHTML = '';

    // Sort rarities by chance (RAREST FIRST - smallest chance value = rarest)
    const sortedRarities = [...rarities].sort((a, b) => a.chance - b.chance);

    // Filter by search term
    const filteredRarities = searchTerm
      ? sortedRarities.filter((rarity) => {
          const isUnlocked = inventoryData.has(rarity.name);
          // Only search unlocked rarities by name
          return (
            isUnlocked &&
            rarity.name.toLowerCase().includes(searchTerm.toLowerCase())
          );
        })
      : sortedRarities;

    // Show message if no results
    if (filteredRarities.length === 0 && searchTerm) {
      const noResults = document.createElement('div');
      noResults.style.textAlign = 'center';
      noResults.style.opacity = '0.5';
      noResults.style.padding = '20px';
      noResults.textContent = 'no rarities found';
      indexList.appendChild(noResults);
      return;
    }

    filteredRarities.forEach((rarity) => {
      const isUnlocked = inventoryData.has(rarity.name);
      const count = isUnlocked ? inventoryData.get(rarity.name).count : 0;

      const item = document.createElement('div');
      item.className = `index-item ${isUnlocked ? 'unlocked' : 'locked'}`;

      const leftSide = document.createElement('div');
      leftSide.style.display = 'flex';
      leftSide.style.alignItems = 'center';

      const name = document.createElement('div');
      name.className = 'index-item-name';
      name.textContent = isUnlocked ? rarity.name : '???';

      const chance = document.createElement('div');
      chance.className = 'index-item-chance';
      const denom = Math.round(1 / rarity.chance);
      chance.textContent = isUnlocked ? `1/${denom}` : '1/???';
      chance.style.marginLeft = '12px';

      leftSide.appendChild(name);
      leftSide.appendChild(chance);

      const rightSide = document.createElement('div');
      if (isUnlocked && count > 0) {
        const countEl = document.createElement('div');
        countEl.className = 'index-item-count';
        countEl.textContent = `x${count}`;
        rightSide.appendChild(countEl);
      }

      item.appendChild(leftSide);
      item.appendChild(rightSide);
      indexList.appendChild(item);
    });
  }

  // Event listeners
  indexBtn.addEventListener('click', openIndex);
  indexClose.addEventListener('click', closeIndex);

  // Search functionality
  if (indexSearch) {
    indexSearch.addEventListener('input', (e) => {
      updateIndexDisplay(e.target.value);
    });
  }

  // Close on background click
  indexModal.addEventListener('click', (e) => {
    if (e.target === indexModal) {
      closeIndex();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && indexModal.classList.contains('show')) {
      closeIndex();
    }
  });
});

document.addEventListener('keydown', (e) => {
  // Ignore if typing in input fields
  if (
    e.target.tagName === 'INPUT' ||
    e.target.tagName === 'TEXTAREA' ||
    e.target.tagName === 'SELECT'
  ) {
    return;
  }

  const key = e.key.toLowerCase();

  // Space = Roll (+ for start anim)
  if (key === ' ' || key === '+') {
    e.preventDefault();
    const rollBtn = document.getElementById('rollBtn');
    if (rollBtn && !rollBtn.disabled) {
      rollBtn.click();
    }
  }

  // A = Previous page, D = Next page
  if (key === 'a') {
    e.preventDefault();
    const prevBtn = document.getElementById('prevPage');
    if (prevBtn && !prevBtn.disabled) {
      prevBtn.click();
    }
  }

  if (key === 'd') {
    e.preventDefault();
    const nextBtn = document.getElementById('nextPage');
    if (nextBtn && !nextBtn.disabled) {
      nextBtn.click();
    }
  }

  // W = Click (simulates mouse click at cursor position)
  if (key === 'w') {
    e.preventDefault();
    const elementUnderCursor = document.elementFromPoint(
      window.lastMouseX || window.innerWidth / 2,
      window.lastMouseY || window.innerHeight / 2,
    );
    if (elementUnderCursor) {
      elementUnderCursor.click();
    }
  }
});

// Track mouse position for W key
window.lastMouseX = window.innerWidth / 2;
window.lastMouseY = window.innerHeight / 2;

document.addEventListener('mousemove', (e) => {
  window.lastMouseX = e.clientX;
  window.lastMouseY = e.clientY;
});

const WELL_KEY = 'wishingWell';
const WELL_COOLDOWN = 2 * 60 * 60 * 1000;

let wellData = {
  lastThrow: 0,
  totalThrown: 0,
  totalReceived: 0,
  timesThrown: 0,
  successes: 0,
};

// Load well data
function loadWellData() {
  const saved = localStorage.getItem(WELL_KEY);
  if (saved) {
    try {
      wellData = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load well data:', e);
    }
  }
  updateWellUI();
}

// Save well data
function saveWellData() {
  localStorage.setItem(WELL_KEY, JSON.stringify(wellData));
}

// Set well amount from quick buttons
function setWellAmount(amount) {
  const input = document.getElementById('wellInput');
  if (input) input.value = amount;
}

// Check if well is on cooldown
function isWellOnCooldown() {
  const now = Date.now();
  const timeSinceLastThrow = now - wellData.lastThrow;
  return timeSinceLastThrow < WELL_COOLDOWN;
}

// Get remaining cooldown time
function getRemainingCooldown() {
  const now = Date.now();
  const elapsed = now - wellData.lastThrow;
  const remaining = WELL_COOLDOWN - elapsed;
  return Math.max(0, remaining);
}

// Format time for display
function formatWellTime(ms) {
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((ms % (60 * 1000)) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

// Update well UI
function updateWellUI() {
  const status = document.getElementById('wellStatus');
  const timer = document.getElementById('wellTimer');
  const throwBtn = document.getElementById('throwWellBtn');
  const totalThrown = document.getElementById('wellTotalThrown');
  const totalReceived = document.getElementById('wellTotalReceived');
  const timesThrown = document.getElementById('wellTimesThrown');
  const successRate = document.getElementById('wellSuccessRate');

  if (!status || !timer || !throwBtn) return;

  if (isWellOnCooldown()) {
    const remaining = getRemainingCooldown();
    throwBtn.disabled = true;
    status.textContent = 'the well is recovering its magic...';
    timer.textContent = `available in: ${formatWellTime(remaining)}`;
  } else {
    throwBtn.disabled = false;
    status.textContent = 'ready to accept your offering';
    timer.textContent = '';
  }

  // Update stats
  if (totalThrown) totalThrown.textContent = wellData.totalThrown;
  if (totalReceived) totalReceived.textContent = wellData.totalReceived;
  if (timesThrown) timesThrown.textContent = wellData.timesThrown;
  if (successRate) {
    const rate =
      wellData.timesThrown > 0
        ? Math.round((wellData.successes / wellData.timesThrown) * 100)
        : 0;
    successRate.textContent = `${rate}%`;
  }
}

// Throw points into well
function throwIntoWell() {
  const input = document.getElementById('wellInput');
  const amount = parseInt(input.value) || 0;

  // Validation
  if (amount <= 0) {
    alert('you must throw at least 1 point!');
    return;
  }

  if (amount > points) {
    alert(`you only have ${points} points!`);
    return;
  }

  if (isWellOnCooldown()) {
    alert('the well is still recovering its magic!');
    return;
  }

  // Deduct points
  points -= amount;
  updatePointsDisplay();

  // Ripple animation
  createWellRipple();

  // 40% chance to win
  const won = Math.random() < 0.4;

  // Update stats
  wellData.lastThrow = Date.now();
  wellData.totalThrown += amount;
  wellData.timesThrown++;

  let reward = 0;

  if (won) {
    reward = amount * 2;
    points += reward;
    wellData.totalReceived += reward;
    wellData.successes++;
    updatePointsDisplay();
    showWellResult(true, reward);
  } else {
    showWellResult(false, amount);
  }

  // Save everything
  saveWellData();
  saveAllData();
  updateWellUI();

  // Clear input
  input.value = '';

  // Start cooldown timer
  startWellCooldownTimer();
}

// Create ripple animation
function createWellRipple() {
  const visual = document.getElementById('wellVisual');
  if (!visual) return;

  const ripple = document.createElement('div');
  ripple.className = 'well-ripple';
  visual.appendChild(ripple);

  setTimeout(() => {
    ripple.remove();
  }, 1500);
}

// Show result modal
function showWellResult(won, amount) {
  const modal = document.getElementById('wellResultModal');
  const icon = document.getElementById('wellResultIcon');
  const text = document.getElementById('wellResultText');
  const amountEl = document.getElementById('wellResultAmount');

  if (!modal || !icon || !text || !amountEl) return;

  if (won) {
    icon.textContent = '✨';
    text.textContent = 'the well grants your wish!';
    amountEl.textContent = `+${amount} points`;
    amountEl.style.color = '#4a4';
  } else {
    icon.textContent = '🌊';
    text.textContent = 'the well accepts your offering...';
    amountEl.textContent = 'but nothing happens';
    amountEl.style.color = '#888';
  }

  modal.classList.add('show');
}

// Close result modal
function closeWellResult() {
  const modal = document.getElementById('wellResultModal');
  if (modal) modal.classList.remove('show');
}

// Start cooldown timer that updates every second
let wellTimerInterval = null;

function startWellCooldownTimer() {
  if (wellTimerInterval) clearInterval(wellTimerInterval);

  wellTimerInterval = setInterval(() => {
    if (!isWellOnCooldown()) {
      clearInterval(wellTimerInterval);
      wellTimerInterval = null;
    }
    updateWellUI();
  }, 1000);
}

// Initialize welling well
loadWellData();

// add da tee event listener to throw button
const throwWellBtn = document.getElementById('throwWellBtn');
if (throwWellBtn) {
  throwWellBtn.addEventListener('click', throwIntoWell);
}

// CFGVHHSUGDCSVHBDJOKVHBHFDSJDOJFBH VSBJNSUHNKXJBHVGCTFDFGHIJNKJBHVGCFXRDTFYGUHINKMTDFGKN ,MNDWBGVFYGHEK;F,NKRG
if (isWellOnCooldown()) {
  startWellCooldownTimer();
}

// FINISH THIS SCRIPT A;READY
window.setWellAmount = setWellAmount;
window.closeWellResult = closeWellResult;
