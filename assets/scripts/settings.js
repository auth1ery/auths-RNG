// settings.js — auth's RNG settings system
// extracted from index.html inline scripts for maintainability
// depends on: main.js (window.backgroundMusic, window.lunarMusic, points, etc.)

(function () {
  'use strict';

  // ── DOM refs (grabbed lazily so this file can load before DOMContentLoaded) ──
  function el(id) {
    return document.getElementById(id);
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let particles = [];
  let particleInterval = null;
  let devInterval = null;
  let rgbInterval = null;
  let wackyInterval = null;
  let visibilitySeasonListenerAdded = false;

  const musicLinks = {
    default: 'assets/audio/welcomecity.mp3',
    wavelocity: 'assets/audio/wavelocity.mp3',
    nocturne: 'assets/audio/nocturne.mp3',
    moonlight: 'assets/audio/moonlight.mp3',
  };

  // ── Background pattern ────────────────────────────────────────────────────
  function applyBackgroundPattern(pattern) {
    const body = document.body;
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.backgroundRepeat = '';
    if (pattern === 'none') return;

    const isLight = body.getAttribute('data-theme') === 'white';
    const c = isLight ? '0,0,0' : '220,220,220';

    const patterns = {
      dots: [
        `radial-gradient(circle,rgba(${c},0.1) 1px,transparent 1px)`,
        '20px 20px',
      ],
      grid: [
        `linear-gradient(rgba(${c},0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(${c},0.05) 1px,transparent 1px)`,
        '20px 20px',
      ],
      waves: [
        `repeating-linear-gradient(45deg,transparent,transparent 10px,rgba(${c},0.03) 10px,rgba(${c},0.03) 20px)`,
        '',
      ],
      diagonal: [
        `repeating-linear-gradient(45deg,transparent,transparent 15px,rgba(${c},0.05) 15px,rgba(${c},0.05) 16px)`,
        '',
      ],
    };
    if (patterns[pattern]) {
      body.style.backgroundImage = patterns[pattern][0];
      if (patterns[pattern][1])
        body.style.backgroundSize = patterns[pattern][1];
    }
  }

  // ── Custom roll button text ───────────────────────────────────────────────
  function applyCustomRollText(text) {
    const btn = el('rollBtn');
    if (btn) btn.textContent = text.trim() || 'roll';
  }

  // ── Seasonal particles ────────────────────────────────────────────────────
  function startSeasonalParticles(season, density) {
    if (particleInterval) {
      clearInterval(particleInterval);
      particleInterval = null;
    }
    particles = [];
    const canvas = el('seasonCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const valid = ['winter', 'spring', 'summer', 'fall'];
    if (!valid.includes(season)) return;

    const emojiMap = { winter: '❄️', spring: '🌸', summer: '☀️', fall: '🍁' };
    const emoji = emojiMap[season];
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);
    const maxP = { low: 50, medium: 200, high: 400 }[density] || 200;

    function addParticle() {
      if (particles.length >= maxP) return;
      particles.push({
        x: Math.random() * w,
        y: -20,
        speed: 1 + Math.random() * 2,
        drift: (Math.random() - 0.5) * 1.2,
        size: 14,
        char: emoji,
        alpha: 0.4 + Math.random() * 0.3,
      });
    }

    function startInterval() {
      if (particleInterval) clearInterval(particleInterval);
      particleInterval = setInterval(addParticle, 120);
    }
    startInterval();

    if (!visibilitySeasonListenerAdded) {
      document.addEventListener('visibilitychange', () => {
        const seasonSel = el('seasonSelect');
        if (document.hidden) {
          if (particleInterval) {
            clearInterval(particleInterval);
            particleInterval = null;
          }
        } else if (seasonSel && seasonSel.value !== 'none') {
          startInterval();
        }
      });
      visibilitySeasonListenerAdded = true;
    }

    function loop() {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.y += p.speed;
        p.x += p.drift;
        ctx.globalAlpha = p.alpha;
        ctx.font = p.size + 'px sans-serif';
        ctx.fillText(p.char, p.x, p.y);
      });
      particles = particles.filter((p) => p.y < h + 30);
      requestAnimationFrame(loop);
    }
    loop();
  }

  // ── Dev overlay ───────────────────────────────────────────────────────────
  // Create toggle button once
  let devToggleBtn = el('devOverlayToggle');
  if (!devToggleBtn) {
    devToggleBtn = document.createElement('button');
    devToggleBtn.id = 'devOverlayToggle';
    devToggleBtn.textContent = 'hide dev';
    document.body.appendChild(devToggleBtn);
  }

  let devCollapsed = false;
  devToggleBtn.addEventListener('click', () => {
    const panel = el('devOverlayPanel');
    if (!panel) return;
    devCollapsed = !devCollapsed;
    panel.classList.toggle('collapsed', devCollapsed);
    devToggleBtn.textContent = devCollapsed ? 'show dev' : 'hide dev';
  });

  let frameCount = 0,
    lastFPSUpdate = performance.now(),
    currentFPS = 0;

  function startDevOverlay(settings) {
    const panel = el('devOverlayPanel');
    if (!panel) return;

    clearInterval(devInterval);
    devInterval = null;

    if (!settings.dev) {
      panel.style.display = 'none';
      devToggleBtn.style.display = 'none';
      return;
    }

    panel.style.display = 'block';
    devToggleBtn.style.display = 'block';

    // Count FPS via rAF
    (function countFrame() {
      frameCount++;
      const now = performance.now();
      if (now - lastFPSUpdate >= 1000) {
        currentFPS = Math.round((frameCount * 1000) / (now - lastFPSUpdate));
        frameCount = 0;
        lastFPSUpdate = now;
      }
      requestAnimationFrame(countFrame);
    })();

    devInterval = setInterval(() => {
      const memInfo = performance.memory
        ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024),
          }
        : null;

      const totalEl = document.getElementsByTagName('*').length;
      const clickable = document.querySelectorAll(
        'button,a,[onclick],input,select',
      ).length;
      const navT = performance.getEntriesByType('navigation')[0];
      const loadTime = navT
        ? Math.round(navT.loadEventEnd - navT.fetchStart)
        : 0;

      let lsSize = 0,
        lsKeys = [];
      try {
        for (const key in localStorage) {
          if (!Object.prototype.hasOwnProperty.call(localStorage, key))
            continue;
          const s = localStorage[key].length + key.length;
          lsSize += s;
          lsKeys.push({ key, size: s });
        }
        lsKeys.sort((a, b) => b.size - a.size);
      } catch (_) {}

      const lsKB = (lsSize / 1024).toFixed(2);
      const lsPct = ((lsSize / (5 * 1024 * 1024)) * 100).toFixed(1);

      // Build output as text nodes to avoid innerHTML thrash
      const fps = currentFPS;
      const lines = [
        `── PERFORMANCE ──`,
        `FPS: ${fps}  FrameTime: ${fps ? (1000 / fps).toFixed(1) : '?'}ms  Load: ${loadTime}ms`,
        memInfo
          ? `Memory: ${memInfo.used}MB / ${memInfo.limit}MB  (${((memInfo.used / memInfo.limit) * 100).toFixed(1)}%)`
          : '',
        `Particles: ${particles.length}  ActiveIntervals: ${[particleInterval, devInterval, rgbInterval, wackyInterval].filter(Boolean).length}`,
        ``,
        `── DOM ──`,
        `Elements: ${totalEl}  Interactive: ${clickable}`,
        ``,
        `── STORAGE ──`,
        `LocalStorage: ${lsKB}KB (${lsPct}%)  Keys: ${lsKeys.length}`,
        lsKeys
          .slice(0, 3)
          .map((i) => `  ${i.key}: ${(i.size / 1024).toFixed(2)}KB`)
          .join('  '),
        ``,
        `── SYSTEM ──`,
        `${window.innerWidth}x${window.innerHeight}  DPR:${window.devicePixelRatio}  Online:${navigator.onLine ? 'yes' : 'NO'}`,
        `Theme:${settings.theme || 'black'}  Season:${settings.season || 'none'}`,
      ].filter((l) => l !== undefined);

      panel.textContent = lines.join('\n');
    }, 500);
  }

  // ── applySettings ─────────────────────────────────────────────────────────
  function applySettings(settings) {
    // Legacy mode
    document.body.classList.toggle('legacy-mode', !!settings.legacyMode);

    // Theme
    if (settings.theme === 'white') {
      document.body.setAttribute('data-theme', 'white');
      document.body.style.removeProperty('--bg-color');
    } else if (settings.theme === 'custom') {
      document.body.removeAttribute('data-theme');
      document.body.style.setProperty(
        '--bg-color',
        settings.customHex || '#0e0e0e',
      );
      document.body.style.setProperty('--text-color', '#dcdcdc');
    } else {
      document.body.removeAttribute('data-theme');
      document.body.style.removeProperty('--bg-color');
    }

    // Font size
    document.body.style.fontSize = (settings.textSize || 16) + 'px';

    // Font family
    const fontMap = {
      serif: 'serif',
      mono: 'monospace',
      dyslexic: "'OpenDyslexic', sans-serif",
    };
    document.body.style.fontFamily = fontMap[settings.font] || 'monospace';

    // RGB / chaos background
    clearInterval(rgbInterval);
    rgbInterval = null;
    if (settings.rgb || settings.chaos) {
      rgbInterval = setInterval(() => {
        const h = Math.floor(Math.random() * 360);
        const l = settings.theme === 'white' ? 90 : 15;
        document.body.style.backgroundColor = `hsl(${h},70%,${l}%)`;
        applyBackgroundPattern(settings.bgPattern || 'none');
      }, 150);
    } else {
      document.body.style.backgroundColor = '';
    }

    // Wacky text
    clearInterval(wackyInterval);
    wackyInterval = null;
    if (settings.wacky || settings.chaos) {
      wackyInterval = setInterval(() => {
        document.body.style.fontSize =
          Math.floor(Math.random() * 10) + 16 + 'px';
      }, 200);
    }

    // Background pattern
    applyBackgroundPattern(settings.bgPattern || 'none');

    // Custom roll text
    applyCustomRollText(settings.customRollText || '');

    // Music
    const isMuted = !!settings.muted;
    if (isMuted) {
      if (window.backgroundMusic) {
        window.backgroundMusic.pause();
        window.backgroundMusic.volume = 0;
      }
      if (window.lunarMusic) {
        window.lunarMusic.pause();
        window.lunarMusic.volume = 0;
      }
      if (window.stopCustomAudio) window.stopCustomAudio();
    } else {
      if (window.lunarMusic) window.lunarMusic.volume = 0.6;

      if (settings.music && settings.music.startsWith('custom_')) {
        // Stop regular music first
        if (window.backgroundMusic) {
          window.backgroundMusic.pause();
          window.backgroundMusic.src = '';
          window.backgroundMusic.load();
        }
        try {
          const customTracks = JSON.parse(
            localStorage.getItem('customMusic') || '[]',
          );
          const idx = parseInt(settings.music.replace('custom_', ''), 10);
          if (customTracks[idx] && window.playCustomAudio) {
            window
              .playCustomAudio(customTracks[idx].data, 0.3, true)
              .catch(() => {
                if (window.stopCustomAudio) window.stopCustomAudio();
                if (window.backgroundMusic) {
                  window.backgroundMusic.src = musicLinks.default;
                  window.backgroundMusic.volume = 0.3;
                  window.backgroundMusic.loop = true;
                  window.backgroundMusic.play().catch(() => {});
                }
              });
          }
        } catch (e) {
          console.error('Custom music load error:', e);
        }
      } else {
        if (window.stopCustomAudio) window.stopCustomAudio();
        if (window.backgroundMusic) {
          window.backgroundMusic.src =
            musicLinks[settings.music] || musicLinks.default;
          window.backgroundMusic.volume = 0.3;
          window.backgroundMusic.loop = true;
          window.backgroundMusic.play().catch(() => {});
        }
      }
    }

    // Dev overlay
    startDevOverlay(settings);

    // Seasonal particlessssssssssssssssssssssssssss no one uses this feature i bet lmao
    startSeasonalParticles(
      settings.season || 'none',
      settings.particleDensity || 'medium',
    );

    // Sync UI controls
    const selectors = {
      themeSelect: settings.theme || 'black',
      musicSelect: settings.music || 'default',
      fontSelect: settings.font || 'default',
      seasonSelect: settings.season || 'none',
      particleDensity: settings.particleDensity || 'medium',
      bgPattern: settings.bgPattern || 'none',
    };
    for (const [id, val] of Object.entries(selectors)) {
      const node = el(id);
      if (node) node.value = val;
    }

    const checkboxes = {
      rgbBg: !!settings.rgb,
      wackyText: !!settings.wacky,
      chaosMode: !!settings.chaos,
      muteMusic: !!settings.muted,
      devOverlay: !!settings.dev,
      legacyMode: !!settings.legacyMode,
    };
    for (const [id, checked] of Object.entries(checkboxes)) {
      const node = el(id);
      if (node) node.checked = checked;
    }

    const ccNode = el('customColor');
    if (ccNode) {
      ccNode.value = settings.customHex || '#0e0e0e';
      ccNode.style.display = settings.theme === 'custom' ? 'block' : 'none';
    }
    const tsNode = el('textSize');
    if (tsNode) tsNode.value = settings.textSize || 16;
    const crtNode = el('customRollText');
    if (crtNode) crtNode.value = settings.customRollText || '';

    // bleh
    document.body.dataset.invStyle = settings.inventoryStyle || 'compact';
    document.body.classList.toggle('blur-panels', !!settings.blurPanels);
    document.body.classList.toggle('compact-mode', !!settings.compactMode);
    document.body.classList.toggle('reduce-motion', !!settings.reduceMotion);
    document.body.classList.toggle('high-contrast', !!settings.highContrast);
    document.body.classList.toggle('large-targets', !!settings.largeTargets);
    document.body.classList.toggle('hide-cursor', !!settings.hideCursor);

    const rollBtnEl = el('rollBtn');
    if (rollBtnEl) {
      const sizeMap = {
        small: '0.85em',
        normal: '1.1em',
        large: '1.4em',
        huge: '1.8em',
      };
      rollBtnEl.style.fontSize = sizeMap[settings.rollBtnSize] || '1.1em';
    }

    document.body.style.setProperty(
      '--accent-color',
      settings.accentColor || '#dcdcdc',
    );

    const breakdownEl = el('luckBreakdown');
    if (breakdownEl)
      breakdownEl.style.display = settings.hideLuckBreakdown ? 'none' : '';

    // expose thresholds + sound globally for main.js
    window.rollSoundSetting = settings.rollSound || 'none';
    window.rareThreshold = settings.rareThreshold || 1000;
    window.confettiThreshold = settings.confettiThreshold || 0;
    window.autoSellThreshold = settings.autoSellThreshold || 0;
    window.cutsceneThreshold = settings.cutsceneThreshold || 0;
    window.spinnerStyleSetting = settings.spinnerStyle || 'slot';

    // rolls since rare display
    const rsrEl = el('rollsSinceRare');
    if (rsrEl) rsrEl.style.display = settings.rareThreshold > 0 ? '' : 'none';

    // sync new UI controls
    const newSelectors = {
      inventoryStyle: settings.inventoryStyle || 'compact',
      spinnerStyle: settings.spinnerStyle || 'slot',
      rollBtnSize: settings.rollBtnSize || 'normal',
      rollSound: settings.rollSound || 'none',
    };
    for (const [id, val] of Object.entries(newSelectors)) {
      const node = el(id);
      if (node) node.value = val;
    }
    const newCheckboxes = {
      blurPanels: !!settings.blurPanels,
      hideCursor: !!settings.hideCursor,
      hideLuckBreakdown: !!settings.hideLuckBreakdown,
      compactMode: !!settings.compactMode,
      reduceMotion: !!settings.reduceMotion,
      highContrast: !!settings.highContrast,
      largeTargets: !!settings.largeTargets,
    };
    for (const [id, checked] of Object.entries(newCheckboxes)) {
      const node = el(id);
      if (node) node.checked = checked;
    }
    const newNumbers = {
      accentColor: settings.accentColor || '#dcdcdc',
      rareThreshold: settings.rareThreshold || 1000,
      confettiThreshold: settings.confettiThreshold || 0,
      autoSellThreshold: settings.autoSellThreshold || 0,
      cutsceneThreshold: settings.cutsceneThreshold || 0,
    };
    for (const [id, val] of Object.entries(newNumbers)) {
      const node = el(id);
      if (node) node.value = val;
    }

    // Persist
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (_) {}
  }

  // ── getCurrentSettings i sorry i decided to add so many comments Ahh ────────────────────────────────────────────────────
  function getCurrentSettings() {
    return {
      theme: (el('themeSelect') || {}).value || 'black',
      customHex: (el('customColor') || {}).value || '#0e0e0e',
      textSize: parseInt((el('textSize') || {}).value || 16, 10),
      rgb: !!(el('rgbBg') || {}).checked,
      wacky: !!(el('wackyText') || {}).checked,
      chaos: !!(el('chaosMode') || {}).checked,
      music: (el('musicSelect') || {}).value || 'default',
      font: (el('fontSelect') || {}).value || 'default',
      season: (el('seasonSelect') || {}).value || 'none',
      dev: !!(el('devOverlay') || {}).checked,
      muted: !!(el('muteMusic') || {}).checked,
      particleDensity: (el('particleDensity') || {}).value || 'medium',
      bgPattern: (el('bgPattern') || {}).value || 'none',
      customRollText: (el('customRollText') || {}).value || '',
      legacyMode: !!(el('legacyMode') || {}).checked,
      inventoryStyle: (el('inventoryStyle') || {}).value || 'compact',
      spinnerStyle: (el('spinnerStyle') || {}).value || 'slot',
      rollBtnSize: (el('rollBtnSize') || {}).value || 'normal',
      accentColor: (el('accentColor') || {}).value || '#dcdcdc',
      blurPanels: !!(el('blurPanels') || {}).checked,
      hideCursor: !!(el('hideCursor') || {}).checked,
      hideLuckBreakdown: !!(el('hideLuckBreakdown') || {}).checked,
      compactMode: !!(el('compactMode') || {}).checked,
      reduceMotion: !!(el('reduceMotion') || {}).checked,
      highContrast: !!(el('highContrast') || {}).checked,
      largeTargets: !!(el('largeTargets') || {}).checked,
      rollSound: (el('rollSound') || {}).value || 'none',
      rareThreshold: parseInt((el('rareThreshold') || {}).value || 1000, 10),
      confettiThreshold: parseInt(
        (el('confettiThreshold') || {}).value || 0,
        10,
      ),
      autoSellThreshold: parseInt(
        (el('autoSellThreshold') || {}).value || 0,
        10,
      ),
      cutsceneThreshold: parseInt(
        (el('cutsceneThreshold') || {}).value || 0,
        10,
      ),
    };
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  function onChange() {
    applySettings(getCurrentSettings());
  }

  const watchIds = [
    'themeSelect',
    'musicSelect',
    'fontSelect',
    'seasonSelect',
    'particleDensity',
    'bgPattern',
    'devOverlay',
    'muteMusic',
    'legacyMode',
    'inventoryStyle',
    'spinnerStyle',
    'rollBtnSize',
    'rollSound'
  ];
  const watchCheckboxIds = [
    'rgbBg',
    'wackyText',
    'chaosMode',
    'blurPanels',
    'hideCursor',
    'hideLuckBreakdown',
    'compactMode',
    'reduceMotion',
    'highContrast',
    'largeTargets'
  ];
  const watchInputIds = [
    'textSize',
    'customColor',
    'customRollText',
    'accentColor',
    'rareThreshold',
    'confettiThreshold',
    'autoSellThreshold',
    'cutsceneThreshold'
  ];

  function bindSettings() {
    watchIds.forEach((id) => {
      const node = el(id);
      if (node) node.addEventListener('change', onChange);
    });
    watchCheckboxIds.forEach((id) => {
      const node = el(id);
      if (node) node.addEventListener('change', onChange);
    });
    watchInputIds.forEach((id) => {
      const node = el(id);
      if (node) node.addEventListener('input', onChange);
    });

    // Theme select also toggles custom color picker visibility
    const themeNode = el('themeSelect');
    if (themeNode) {
      themeNode.addEventListener('change', () => {
        const cc = el('customColor');
        if (cc)
          cc.style.display = themeNode.value === 'custom' ? 'block' : 'none';
      });
    }

    // Eruda
    const erudaBtn = el('erudaBtn');
    if (erudaBtn) {
      let loaded = false;
      erudaBtn.addEventListener('click', () => {
        if (loaded) {
          alert('eruda is already loaded!');
          return;
        }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/eruda';
        s.onload = () => {
          eruda.init();
          loaded = true;
          erudaBtn.textContent = 'eruda loaded!';
          erudaBtn.disabled = true;
        };
        s.onerror = () => alert('failed to load eruda...');
        document.body.appendChild(s);
      });
    }
  }

  // ── Custom music upload ───────────────────────────────────────────────────
  // Web Audio API state
  window.audioContext = null;
  window.customAudioSource = null;
  window.customAudioGain = null;

  window.playCustomAudio = function (base64Data, volume, loop) {
    return new Promise((resolve, reject) => {
      try {
        if (window.customAudioSource) {
          try {
            window.customAudioSource.stop();
          } catch (_) {}
          window.customAudioSource = null;
        }
        if (!window.audioContext) {
          window.audioContext = new (
            window.AudioContext || window.webkitAudioContext
          )();
        }
        const b64 = base64Data.split(',')[1];
        const bin = atob(b64);
        const buf = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);

        window.audioContext.decodeAudioData(
          buf.buffer,
          (buffer) => {
            const src = window.audioContext.createBufferSource();
            src.buffer = buffer;
            src.loop = loop;
            if (!window.customAudioGain) {
              window.customAudioGain = window.audioContext.createGain();
              window.customAudioGain.connect(window.audioContext.destination);
            }
            window.customAudioGain.gain.value = volume;
            src.connect(window.customAudioGain);
            src.start(0);
            window.customAudioSource = src;
            resolve();
          },
          reject,
        );
      } catch (e) {
        reject(e);
      }
    });
  };

  window.stopCustomAudio = function () {
    if (window.customAudioSource) {
      try {
        window.customAudioSource.stop();
      } catch (_) {}
      window.customAudioSource = null;
    }
  };

  function loadCustomMusicUI() {
    const musicSel = el('musicSelect');
    const customMusicList = el('customMusicList');
    const customTracks = el('customTracksList');
    if (!musicSel) return;

    try {
      const saved = JSON.parse(localStorage.getItem('customMusic') || '[]');

      // Remove old custom options
      Array.from(musicSel.options).forEach((o) => {
        if (o.value.startsWith('custom_')) o.remove();
      });

      saved.forEach((track, i) => {
        const opt = document.createElement('option');
        opt.value = 'custom_' + i;
        opt.textContent = track.name + ' (custom)';
        musicSel.appendChild(opt);
      });

      if (customMusicList)
        customMusicList.style.display = saved.length ? 'block' : 'none';
      if (customTracks) renderCustomTracksList(saved, customTracks, musicSel);
    } catch (e) {
      console.error('Custom music UI error:', e);
    }
  }

  function renderCustomTracksList(tracks, container, musicSel) {
    container.innerHTML = '';
    tracks.forEach((track, i) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;justify-content:space-between;align-items:center;padding:6px 8px;margin-bottom:4px;background:var(--overlay-bg);border:1px solid var(--border-color);border-radius:2px;';
      const name = document.createElement('span');
      name.textContent = track.name;
      name.style.fontSize = '0.85em';
      const del = document.createElement('button');
      del.textContent = 'delete';
      del.className = 'small';
      del.onclick = () => {
        const saved = JSON.parse(localStorage.getItem('customMusic') || '[]');
        const deletedId = 'custom_' + i;
        saved.splice(i, 1);
        localStorage.setItem('customMusic', JSON.stringify(saved));
        loadCustomMusicUI();
        if (musicSel && musicSel.value === deletedId) {
          musicSel.value = 'default';
          onChange();
        }
      };
      row.appendChild(name);
      row.appendChild(del);
      container.appendChild(row);
    });
  }

  function bindCustomMusicUpload() {
    const upload = el('customMusicUpload');
    if (!upload) return;
    upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert('file too large! max 10MB');
        upload.value = '';
        return;
      }
      if (!file.type.startsWith('audio/')) {
        alert('please upload an audio file');
        upload.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const saved = JSON.parse(localStorage.getItem('customMusic') || '[]');
          saved.push({
            name: file.name.replace(/\.[^/.]+$/, ''),
            data: ev.target.result,
          });
          localStorage.setItem('customMusic', JSON.stringify(saved));
          loadCustomMusicUI();
          upload.value = '';
          alert('track uploaded!');
        } catch (err) {
          alert(
            err.name === 'QuotaExceededError'
              ? 'storage full! delete some tracks first.'
              : 'error saving: ' + err.message,
          );
          upload.value = '';
        }
      };
      reader.onerror = () => {
        alert('error reading file');
        upload.value = '';
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Save / settings transfer ──────────────────────────────────────────────
  const SAVE_KEYS = [
    'rarityInventory',
    'totalRolls',
    'achievementsUnlocked',
    'anomalies',
    'anomaliesUsed',
    'shopPoints',
    'shopUpgrades',
    'soldOutRarities',
    'playerPotions',
    'activePotions',
    'wishingWell',
    'luckBoostState',
    'totalPlaytime',
    'daily_lastClaim',
    'daily_streak',
    'weekly_lastClaim',
    'weekly_streak',
  ];

  function simpleHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return (h >>> 0).toString(16).padStart(8, '0');
  }

  function bundleSaveKeys() {
    const obj = {};
    SAVE_KEYS.forEach((k) => {
      const v = localStorage.getItem(k);
      if (v !== null) obj[k] = v;
    });
    return obj;
  }

  function encode(bundle, tag) {
    const payload = JSON.stringify(bundle);
    const envelope = JSON.stringify({
      p: payload,
      h: simpleHash(payload),
      t: tag,
    });
    return btoa(unescape(encodeURIComponent(envelope)));
  }

  function decode(input, expectedTag) {
    let envelope;
    try {
      envelope = JSON.parse(decodeURIComponent(escape(atob(input.trim()))));
    } catch (_) {
      return { error: 'invalid or corrupted data...' };
    }
    if (!envelope || !envelope.p || !envelope.h || !envelope.t)
      return { error: 'invalid format' };
    if (envelope.t !== expectedTag)
      return { error: 'wrong type! expected ' + expectedTag };
    if (simpleHash(envelope.p) !== envelope.h)
      return { error: 'tampered or corrupted! thats blocked' };
    try {
      return { bundle: JSON.parse(envelope.p) };
    } catch (_) {
      return { error: 'payload not valid json' };
    }
  }

  function getCodeText(elId) {
    return (el(elId) || {}).textContent || '';
  }

  function copyText(text, label) {
    navigator.clipboard
      .writeText(text)
      .then(() => alert(label + ' copied!'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert(label + ' copied!');
      });
  }

  /*
  … Slow down, slow down to the feeling
Wait up, wait there if you see me
Come back, come back to the moment (whoa)
The moment
… Did I tell you that I miss you? (Oh, oh, oh-oh, oh)
Did I tell you that I miss you? (Oh-oh)
… Hold on, hold on, we could stay here (oh, whoa)
Once more, once lost, it was so clear (oh)
I'm here, I'm yours for a moment (oh-oh)
A moment
… Did I tell you that I miss you? (Oh, oh, oh-oh, oh)
Did I tell you that I miss you? (Oh-oh)
Ooh (oh-oh)
(Oh-oh)
… Did I tell you that I-
Did I tell you that I miss you?
Did I tell you that I- (oh-oh)
Did I tell you that I miss you? (Oh)
(Oh-oh)
  */
  function downloadText(text, filename) {
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([text], { type: 'text/plain' })),
      download: filename,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  function adjustHeight(codeEl) {
    const page = codeEl && codeEl.closest('.page');
    const cont = codeEl && codeEl.closest('.page-container');
    if (page && cont) cont.style.height = page.scrollHeight + 'px';
  }

  function refreshCode(codeElId, getBundle, tag) {
    const codeEl = el(codeElId);
    if (!codeEl) return;
    const bundle = getBundle();
    codeEl.textContent = Object.keys(bundle).length
      ? encode(bundle, tag)
      : '(no data)';
    adjustHeight(codeEl);
  }

  function setupShowMore(codeElId, btnElId) {
    const codeEl = el(codeElId);
    const btn = el(btnElId);
    if (!codeEl || !btn) return;
    let expanded = false;
    const check = () => {
      btn.style.display =
        codeEl.scrollHeight > codeEl.clientHeight + 4 ? 'inline-block' : 'none';
    };
    btn.addEventListener('click', () => {
      expanded = !expanded;
      codeEl.style.maxHeight = expanded ? 'none' : '3.5em';
      btn.textContent = expanded ? 'show less' : 'show more';
      check();
    });
    return check;
  }

  function bindTransfer() {
    const checkSave = setupShowMore('saveTransferCode', 'showMoreSaveBtn');
    const checkSettings = setupShowMore(
      'settingsTransferCode',
      'showMoreSettingsBtn',
    );

    function refreshSave() {
      refreshCode('saveTransferCode', bundleSaveKeys, 'save');
      if (checkSave) checkSave();
    }
    function refreshSettings() {
      refreshCode(
        'settingsTransferCode',
        () => {
          const r = localStorage.getItem('userSettings');
          return r ? { userSettings: r } : {};
        },
        'settings',
      );
      if (checkSettings) checkSettings();
    }

    const saveActions = [
      [
        'exportSaveBtn',
        () => copyText(getCodeText('saveTransferCode'), 'save data'),
      ],
      [
        'downloadSaveBtn',
        () =>
          downloadText(getCodeText('saveTransferCode'), 'authsrng_save.txt'),
      ],
      ['refreshSaveBtn', refreshSave],
      [
        'importSaveBtn',
        () => {
          const input = prompt('paste your save data export:');
          if (!input?.trim()) return;
          const result = decode(input, 'save');
          if (result.error) {
            alert(result.error);
            return;
          }
          Object.keys(result.bundle).forEach((k) =>
            localStorage.setItem(k, result.bundle[k]),
          );
          alert('save imported! reloading...');
          setTimeout(() => location.reload(), 500);
        },
      ],
    ];
    const settingsActions = [
      [
        'exportSettingsBtn',
        () => copyText(getCodeText('settingsTransferCode'), 'settings'),
      ],
      [
        'downloadSettingsBtn',
        () =>
          downloadText(
            getCodeText('settingsTransferCode'),
            'authsrng_settings.txt',
          ),
      ],
      ['refreshSettingsBtn', refreshSettings],
      [
        'importSettingsBtn',
        () => {
          const input = prompt('paste your settings export:');
          if (!input?.trim()) return;
          const result = decode(input, 'settings');
          if (result.error) {
            alert(result.error);
            return;
          }
          if (result.bundle.userSettings)
            localStorage.setItem('userSettings', result.bundle.userSettings);
          try {
            applySettings(JSON.parse(result.bundle.userSettings));
          } catch (_) {}
          alert('settings imported! reloading...');
          setTimeout(() => location.reload(), 500);
        },
      ],
    ];

    [...saveActions, ...settingsActions].forEach(([id, fn]) => {
      const node = el(id);
      if (node)
        node.addEventListener('click', () => {
          // Refresh before copy/download actions (but not on the refresh button itself)
          if (id.startsWith('export') || id.startsWith('download')) {
            if (id.includes('Save')) refreshSave();
            if (id.includes('Settings')) refreshSettings();
          }
          const codeElId = id.includes('Save')
            ? 'saveTransferCode'
            : 'settingsTransferCode';
          const text = getCodeText(codeElId);
          if (text.startsWith('(no')) {
            alert('no data to export');
            return;
          }
          fn();
        });
      // For refresh/import buttons, no pre-refresh needed
      if (id.startsWith('refresh') || id.startsWith('import')) {
        // Re-bind without the guard — remove the above and re-bind clean
      }
    });

    // Cleaner bind for refresh + import (no guard needed)
    [
      'refreshSaveBtn',
      'importSaveBtn',
      'refreshSettingsBtn',
      'importSettingsBtn',
    ].forEach((id) => {
      const node = el(id);
      if (!node) return;
      // Clone to wipe the previous listener
      const clone = node.cloneNode(true);
      node.parentNode.replaceChild(clone, node);
      const action = [...saveActions, ...settingsActions].find(
        ([aid]) => aid === id,
      );
      if (action) clone.addEventListener('click', action[1]);
    });

    refreshSave();
    refreshSettings();
  }

  // ── Legacy mode content mover ─────────────────────────────────────────────
  // Moves shop (#page-2) and settings (#page-5) into popups in legacy mode
  function bindLegacyMode() {
    const legacyShopBtn = el('legacyShopBtn');
    const legacySettingsBtn = el('legacySettingsBtn');
    const legacyShopPopup = el('legacyShopPopup');
    const legacySettingsPopup = el('legacySettingsPopup');
    const shopPage = document.querySelector('#page-2');
    const settingsPage = document.querySelector('#page-5'); // ← FIXED: was #page-4

    if (
      !legacyShopBtn ||
      !legacySettingsBtn ||
      !legacyShopPopup ||
      !legacySettingsPopup
    )
      return;

    // Store original parent refs so we can restore
    let shopMoved = false,
      settingsMoved = false;

    function moveToPopup(page, popup, flag) {
      if (!page || !popup || flag) return true;
      while (page.firstChild) popup.appendChild(page.firstChild);
      return true;
    }
    function restoreFromPopup(page, popup, flag) {
      if (!page || !popup || !flag) return false;
      while (popup.firstChild) page.appendChild(popup.firstChild);
      return false;
    }

    function syncLegacyState() {
      const isLegacy = document.body.classList.contains('legacy-mode');
      if (isLegacy) {
        shopMoved = moveToPopup(shopPage, legacyShopPopup, shopMoved);
        settingsMoved = moveToPopup(
          settingsPage,
          legacySettingsPopup,
          settingsMoved,
        );
      } else {
        shopMoved = restoreFromPopup(shopPage, legacyShopPopup, shopMoved);
        settingsMoved = restoreFromPopup(
          settingsPage,
          legacySettingsPopup,
          settingsMoved,
        );
        legacyShopPopup.classList.remove('open');
        legacySettingsPopup.classList.remove('open');
      }
    }

    // Watch for class changes on body
    const bodyObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.attributeName === 'class') syncLegacyState();
      });
    });
    bodyObserver.observe(document.body, { attributes: true });

    // Sync on load if already in legacy mode
    if (document.body.classList.contains('legacy-mode')) syncLegacyState();

    // Toggle popups
    legacyShopBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      legacyShopPopup.classList.toggle('open');
      legacySettingsPopup.classList.remove('open');
    });
    legacySettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      legacySettingsPopup.classList.toggle('open');
      legacyShopPopup.classList.remove('open');
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!legacyShopPopup.contains(e.target) && e.target !== legacyShopBtn) {
        legacyShopPopup.classList.remove('open');
      }
      if (
        !legacySettingsPopup.contains(e.target) &&
        e.target !== legacySettingsBtn
      ) {
        legacySettingsPopup.classList.remove('open');
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    bindSettings();
    bindCustomMusicUpload();
    loadCustomMusicUI();
    bindTransfer();
    bindLegacyMode();

    const saved = localStorage.getItem('userSettings');
    if (saved) {
      try {
        applySettings(JSON.parse(saved));
        return;
      } catch (_) {}
    }
    applySettings({
      theme: 'black',
      customHex: '#0e0e0e',
      textSize: 16,
      rgb: false,
      wacky: false,
      chaos: false,
      music: 'default',
      font: 'default',
      season: 'none',
      dev: false,
      muted: false,
      particleDensity: 'medium',
      bgPattern: 'none',
      customRollText: '',
      legacyMode: false,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // expose globals needed by other scripts because scripts are needy
  window.applySettings = applySettings;
  window.getCurrentSettings = getCurrentSettings;
})();
