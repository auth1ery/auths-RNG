import { Xoshiro256SS } from './xoshiro256ss';
import type { BeaconDebugInfo } from './types';

const FLOAT_DIV = 9007199254740992;

export class BeaconRNG {
  private _gen: Xoshiro256SS;
  private _callCount = 0;
  private _sessionSeed: string | null = null;

  constructor() {
    this._gen = new Xoshiro256SS();
  }

  init(): void {
    const seed =
      BigInt(Date.now()) ^
      BigInt(
        Math.floor(
          (typeof performance !== 'undefined' ? performance.now() : 1) * 1e8
        )
      );
    this._gen.reseed(seed);
    this._sessionSeed = seed.toString(16);
  }

  loadState(state: [string, string, string, string]): void {
    this._gen.setState(state);
  }

  getState(): [string, string, string, string] {
    return this._gen.getState();
  }

  reseed(value: bigint | number | string): void {
    const s = BigInt(value);
    this._gen.reseed(s);
    this._sessionSeed = s.toString(16);
    this._callCount = 0;
  }

  float(): number {
    this._callCount++;
    return Number(this._gen.next() >> 11n) / FLOAT_DIV;
  }

  uint64(): bigint {
    this._callCount++;
    return this._gen.next();
  }

  intBelow(n: bigint): bigint {
    const range = 1n << 128n;
    const limit = (range / n) * n;
    let r: bigint;
    do {
      r = (this._gen.next() << 64n) | this._gen.next();
      this._callCount += 2;
    } while (r >= limit);
    return r % n;
  }

  intRange(lo: number | bigint, hi: number | bigint): bigint {
    const range = BigInt(hi) - BigInt(lo);
    return BigInt(lo) + this.intBelow(range);
  }

  bool(probability: number): boolean {
    return this.float() < probability;
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Number(this.intBelow(BigInt(i + 1)));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  pick<T>(arr: T[]): T {
    return arr[Number(this.intBelow(BigInt(arr.length)))];
  }

  advance(steps: number): void {
    for (let i = 0; i < steps; i++) this._gen.next();
    this._callCount += steps;
  }

  jump(): void {
    this._gen.jump();
  }

  debugInfo(): BeaconDebugInfo {
    return {
      state: this._gen.getState(),
      calls: this._callCount,
      sessionSeed: this._sessionSeed,
    };
  }
}
