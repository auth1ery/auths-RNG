(function (root) {
	const M64 = 0xffffffffffffffffn;

	function mix64(a, b) {
		let x = (a ^ b) & M64;
		x = (x * 0xff51afd7ed558ccdn) & M64;
		x ^= x >> 33n;
		x = (x * 0xc4ceb9fe1a85ec53n) & M64;
		x ^= x >> 33n;
		return x & M64;
	}

	class EntropyPool {
		constructor() {
			this._samples = [];
			this._drift = 0n;
			this._touches = 0;
		}

		touch(label) {
			this._touches++;
			const now = BigInt(Date.now());
			const perf = BigInt(
				Math.floor((typeof performance !== 'undefined' ? performance.now() : this._touches) * 1e6)
			);
			const salt = BigInt(this._touches) * 0x9e3779b97f4a7c15n;
			const sample = mix64(mix64(now, perf), salt);
			this._samples.push(sample);
			if (this._samples.length > 32) this._samples.shift();
			this._drift = mix64(this._drift, sample);
			return sample;
		}

		seed() {
			this.touch('seed');
			let acc = this._drift;
			for (const s of this._samples) acc = mix64(acc, s);
			if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
				const buf = new Uint32Array(2);
				crypto.getRandomValues(buf);
				acc = mix64(acc, (BigInt(buf[0]) << 32n) | BigInt(buf[1]));
			}
			return acc & M64;
		}

		driftReseed(currentSeedHex) {
			const current = BigInt('0x' + currentSeedHex);
			return mix64(current, this.touch('drift')) & M64;
		}
	}

	root.PlushEntropyPool = EntropyPool;
})(typeof window !== 'undefined' ? window : this);
