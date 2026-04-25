(function (root) {
  'use strict';

  if (!root.Xoshiro256SS) {
    throw new Error('[GameRNG] xoshiro256ss.js must be loaded first');
  }

  const STATE_KEY = '_grng_state';
  const FLOAT_DIV = 9007199254740992;

  function GameRNGCore() {
    this._gen = new root.Xoshiro256SS();
    this._callCount = 0;
    this._sessionSeed = null;
    this._load();
  }

  GameRNGCore.prototype._load = function () {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 4) {
          this._gen.setState(parsed);
          return;
        }
      }
    } catch (_) {}
    const seed = BigInt(Date.now()) ^ BigInt(Math.floor((typeof performance !== 'undefined' ? performance.now() : 1) * 1e8));
    this._gen.reseed(seed);
    this._sessionSeed = seed.toString(16);
  };

  GameRNGCore.prototype.save = function () {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(this._gen.getState()));
    } catch (_) {}
  };

  GameRNGCore.prototype.reseed = function (value) {
    const s = BigInt(value);
    this._gen.reseed(s);
    this._sessionSeed = s.toString(16);
    this._callCount = 0;
    this.save();
  };

  GameRNGCore.prototype.float = function () {
    this._callCount++;
    return Number(this._gen.next() >> 11n) / FLOAT_DIV;
  };

  GameRNGCore.prototype.uint64 = function () {
    this._callCount++;
    return this._gen.next();
  };

  GameRNGCore.prototype.intBelow = function (n) {
    const bn = BigInt(n);
    const range = 1n << 128n;
    const limit = (range / bn) * bn;
    let r;
    do {
      r = (this._gen.next() << 64n) | this._gen.next();
      this._callCount += 2;
    } while (r >= limit);
    return r % bn;
  };

  GameRNGCore.prototype.intRange = function (lo, hi) {
    const range = BigInt(hi) - BigInt(lo);
    return BigInt(lo) + this.intBelow(range);
  };

  GameRNGCore.prototype.bool = function (probability) {
    return this.float() < probability;
  };

  GameRNGCore.prototype.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Number(this.intBelow(i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  };

  GameRNGCore.prototype.pick = function (arr) {
    return arr[Number(this.intBelow(arr.length))];
  };

  GameRNGCore.prototype.advance = function (steps) {
    for (let i = 0; i < steps; i++) this._gen.next();
    this._callCount += steps;
  };

  GameRNGCore.prototype.jump = function () {
    this._gen.jump();
  };

  GameRNGCore.prototype.debugInfo = function () {
    return {
      state: this._gen.getState(),
      calls: this._callCount,
      sessionSeed: this._sessionSeed
    };
  };

  root.GameRNG = new GameRNGCore();

  setInterval(function () {
    root.GameRNG.save();
  }, 30000);

})(typeof window !== 'undefined' ? window : this);
