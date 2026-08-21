(function (root) {
	const M64 = 0xffffffffffffffffn; // (1n << 64n) - 1n

	// SplitMix64, standard PRNG, see https://xoshiro.di.unimi.it/splitmix64.c

	/*
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

	function rotl64(x, k) {
		return ((x << k) | (x >> (64n - k))) & M64;
	}

	function splitmix64(s) {
		s = (s + 0x9e3779b97f4a7c15n) & M64; // golden ratio constant
		s = ((s ^ (s >> 30n)) * 0xbf58476d1ce4e5b9n) & M64;
		s = ((s ^ (s >> 27n)) * 0x94d049bb133111ebn) & M64;
		return (s ^ (s >> 31n)) & M64;
	}

	/*
  	For s (1), the binary data is:
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

		for s (2), the binary data is:
		Bin: 60 56 52 48 44 40 36 32
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		1.11 1111 .1.1 1... .1.. .111 .11. 11.1
		...1 11.. 111. .1.. 111. .1.1 1.11 1..1
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		28 24 20 16 12 8 4 0

		Hex: BF58 476D 1CE4 E5B9 (64-bit)
		Str: . X G m . . . .
		(191, 88, 71, 109, 28, 228, 229, 185)
		Dec: 13,787,848,793,156,543,929 (11.959 EiB) / -4,658,895,280,553,007,687

		For s (3), the binary data is:
		Bin: 60 56 52 48 44 40 36 32
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		1..1 .1.. 11.1 .... .1.. 1..1 1.11 1.11
		...1 ..11 ..11 ...1 ...1 ...1 111. 1.11
		---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
		28 24 20 16 12 8 4 0

		Hex: 94D0 49BB 1331 11EB (64-bit)
		Str: . . I . . 1 . .
		(148, 208, 73, 187, 19, 49, 17, 235)
		Dec: 10,723,151,780,598,845,931 (9.301 EiB) / -7,723,592,293,110,705,685
	*/

	class Xoshiro256SS {
		constructor(seed) {
			this._s = [0n, 0n, 0n, 0n];
			this.reseed(
				seed !== undefined
					? seed
					: BigInt(Date.now()) ^
							BigInt(Math.floor((typeof performance !== 'undefined' ? performance.now() : 0) * 1e6))
			);
		}
		reseed(raw) {
			let s = BigInt(raw) & M64;

			for (let i = 0; i < 4; i++) {
				s = splitmix64(s);
				this._s[i] = s;
			}

			if (this._s.every((v) => v === 0n)) this._s[0] = 1n;

			if (root.PlushLog) root.PlushLog.trace('xoshiro', 'stream reseeded');
		}
		next() {
			const s = this._s;
			const result = (rotl64((s[1] * 5n) & M64, 7n) * 9n) & M64;
			const t = (s[1] << 17n) & M64;
			s[2] ^= s[0];
			s[3] ^= s[1];
			s[1] ^= s[2];
			s[0] ^= s[3];
			s[2] ^= t;
			s[3] = rotl64(s[3], 45n);
			return result;
		}
		nextFloat() {
			return Number(this.next() >> 11n) / 0x1fffffffffffff; // 2^53 - 1
			/*
			Bin: 60 56 52 48 44 40 36 32
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			.... .... ...1 1111 1111 1111 1111 1111
			1111 1111 1111 1111 1111 1111 1111 1111
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			28 24 20 16 12 8 4 0

			Hex: 001F FFFF FFFF FFFF (64-bit)
			Str: . . . . . . . .
			(0, 31, 255, 255, 255, 255, 255, 255)
			Dec: 9,007,199,254,740,991 (8.000 PiB)
			*/
		}
		nextInt(min, max) {
			if (min >= max) throw new RangeError('min must be less than max');
			return min + Number(this.next() % BigInt(max - min));
		}
		getState() {
			return this._s.map(function (v) {
				return v.toString(16).padStart(16, '0');
			});
		}
		setState(arr) {
			if (arr.length !== 4) throw new RangeError('state must have exactly 4 elements');
			this._s = arr.map(function (v) {
				return BigInt('0x' + v) & M64;
			});
			if (
				this._s.every(function (v) {
					return v === 0n;
				})
			)
				this._s[0] = 1n;
		}
		jump() {
			const JUMP = [
				0x180ec6d33cfd0aban,
				0xd5a61266f0c9392cn,
				0xa9582618e03fc9aan,
				0x39abdc4529b1661cn,
			];
			/*
			n1 =
			Bin: 60 56 52 48 44 40 36 32
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			...1 1... .... 111. 11.. .11. 11.1 ..11
			..11 11.. 1111 11.1 .... 1.1. 1.11 1.1.
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			28 24 20 16 12 8 4 0

			Hex: 180E C6D3 3CFD 0ABA (64-bit)
			Str: . . . . < . . .
			(24, 14, 198, 211, 60, 253, 10, 186)
			Dec: 1,733,541,517,147,835,066 (1.504 EiB)

			n2 =
			Bin: 60 56 52 48 44 40 36 32
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			11.1 .1.1 1.1. .11. ...1 ..1. .11. .11.
			1111 .... 11.. 1..1 ..11 1..1 ..1. 11..
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			28 24 20 16 12 8 4 0

			Hex: D5A6 1266 F0C9 392C (64-bit)
			Str: . . . f . . 9 ,
			(213, 166, 18, 102, 240, 201, 57, 44)
			Dec: 15,395,012,609,548,302,636 (13.353 EiB) / -3,051,731,464,161,248,980

			n3 =
			Bin: 60 56 52 48 44 40 36 32
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			1.1. 1..1 .1.1 1... ..1. .11. ...1 1...
			111. .... ..11 1111 11.. 1..1 1.1. 1.1.
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			28 24 20 16 12 8 4 0

			Hex: A958 2618 E03F C9AA (64-bit)
			Str: . X & . . ? . .
			(169, 88, 38, 24, 224, 63, 201, 170)
			Dec: 12,202,545,078,643,706,282 (10.584 EiB) / -6,244,198,995,065,845,334

			n4 =
			Bin: 60 56 52 48 44 40 36 32
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			..11 1..1 1.1. 1.11 11.1 11.. .1.. .1.1
			..1. 1..1 1.11 ...1 .11. .11. ...1 11..
			---+ ---+ ---+ ---+ ---+ ---+ ---+ ---+
			28 24 20 16 12 8 4 0

			Hex: 39AB DC45 29B1 661C (64-bit)
			Str: 9 . . E ) . f .
			(57, 171, 220, 69, 41, 177, 102, 28)
			Dec: 4,155,657,270,789,760,540 (3.604 EiB)
			*/
			let s0 = 0n,
				s1 = 0n,
				s2 = 0n,
				s3 = 0n;
			/* all
				Bin: .... ....
				---+ ---+
				4 0

				Hex: 00 (8-bit)
				Str: . (0)
				Dec: 0 (0 B)

				As they are all 0n;
				*/
			for (let i = 0; i < 4; i++) {
				for (let b = 0; b < 64; b++) {
					if ((JUMP[i] >> BigInt(b)) & 1n) {
						s0 ^= this._s[0];
						s1 ^= this._s[1];
						s2 ^= this._s[2];
						s3 ^= this._s[3];
					}
					this.next();
				}
			}
			this._s[0] = s0 & M64; // const M64: 18446744073709551615n
			this._s[1] = s1 & M64;
			this._s[2] = s2 & M64;
			this._s[3] = s3 & M64;
		}
	}

	root.Xoshiro256SS = Xoshiro256SS;
})(typeof window !== 'undefined' ? window : this); // oh this was confusing to make
