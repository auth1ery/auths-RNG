(function (root) {
	const M64 = 0xffffffffffffffffn; // all bits set

	/* M64

	Bin: 60 56 52 48 44 40 36 32
	---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
	1111 1111 1111 1111 1111 1111 1111 1111
	1111 1111 1111 1111 1111 1111 1111 1111
	---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
	28 24 20 16 12 8 4 0

	Hex: FFFF FFFF FFFF FFFF (64-bit)
	Str: . . . . . . . .
	(255, 255, 255, 255, 255, 255, 255, 255)
	Dec: 18,446,744,073,709,551,615 (16.000 EiB) / -1

	*/

	function mix64(a, b) {
		let x = (a ^ b) & M64;
		x = (x * 0xff51afd7ed558ccdn) & M64; // MurmurHash3 fmix64 constants for this and the next hex after, see https://github.com/aappleby/smhasher
		/*
		Bin: 60 56 52 48 44 40 36 32
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		1111 1111 .1.1 ...1 1.1. 1111 11.1 .111
		111. 11.1 .1.1 .1.1 1... 11.. 11.. 11.1
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		28 24 20 16 12 8 4 0

		Hex: FF51 AFD7 ED55 8CCD (64-bit)
		Str: . Q . . . U . .
		(255, 81, 175, 215, 237, 85, 140, 205)
		Dec: 18,397,679,294,719,823,053 (15.957 EiB) / -49,064,778,989,728,563
		*/
		x ^= x >> 33n;
		x = (x * 0xc4ceb9fe1a85ec53n) & M64;
		/*
		Bin: 60 56 52 48 44 40 36 32
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		11.. .1.. 11.. 111. 1.11 1..1 1111 111.
		...1 1.1. 1... .1.1 111. 11.. .1.1 ..11
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		28 24 20 16 12 8 4 0

		Hex: C4CE B9FE 1A85 EC53 (64-bit)
		Str: . . . . . . . S
		(196, 206, 185, 254, 26, 133, 236, 83)
		Dec: 14,181,476,777,654,086,739 (12.300 EiB) / -4,265,267,296,055,464,877
		*/
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
			/*
			Bin: 60 56 52 48 44 40 36 32
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			1..1 111. ..11 .111 .111 1..1 1.11 1..1
			.111 1111 .1.. 1.1. .111 11.. ...1 .1.1
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			28 24 20 16 12 8 4 0

			Hex: 9E37 79B9 7F4A 7C15 (64-bit)
			Str: . 7 y . . J | .
			(158, 55, 121, 185, 127, 74, 124, 21)
			Dec: 11,400,714,819,323,198,485 (9.889 EiB) / -7,046,029,254,386,353,131
			*/
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
