(function (root) {
	const LEVELS = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, silent: 5 };
	const RING_CAPACITY = 300;
	const DEFAULT_SAMPLE = {
		trace: 20,
		debug: 5,
		info: 1,
		warn: 1,
		error: 1,
	};

	class PlushLogger {
		constructor(opts) {
			opts = opts || {};
			this._level = LEVELS[opts.level || 'info'];
			this._sample = Object.assign({}, DEFAULT_SAMPLE, opts.sample || {});
			this._counters = new Map();
			this._ring = new Array(RING_CAPACITY);
			this._ringHead = 0;
			this._ringSize = 0;
			this._groupCounts = new Map();
		}

		setLevel(level) {
			if (LEVELS[level] === undefined) return;
			this._level = LEVELS[level];
		}

		_shouldSample(tag) {
			const every = this._sample[tag] || 1;
			if (every <= 1) return true;
			const n = (this._counters.get(tag) || 0) + 1;
			this._counters.set(tag, n);
			return n % every === 0;
		}

		_pushRing(entry) {
			this._ring[this._ringHead] = entry;
			this._ringHead = (this._ringHead + 1) % RING_CAPACITY;
			if (this._ringSize < RING_CAPACITY) this._ringSize++;
		}

		_record(levelName, tag, msg, data) {
			const entry = { t: Date.now(), level: levelName, tag: tag, msg: msg, data: data };
			this._pushRing(entry);
			return entry;
		}

		log(levelName, tag, msg, data) {
			const levelNum = LEVELS[levelName];
			const entry = this._record(levelName, tag, msg, data);
			if (levelNum < this._level) return;
			if (levelNum <= LEVELS.debug && !this._shouldSample(tag)) return;
			const prefix = '[Plush:' + tag + ']';
			const fn =
				levelName === 'error' ? console.error : levelName === 'warn' ? console.warn : console.log;
			if (data !== undefined) fn(prefix, msg, data);
			else fn(prefix, msg);
			return entry;
		}

		trace(tag, msg, data) {
			return this.log('trace', tag, msg, data);
		}
		debug(tag, msg, data) {
			return this.log('debug', tag, msg, data);
		}
		info(tag, msg, data) {
			return this.log('info', tag, msg, data);
		}
		warn(tag, msg, data) {
			return this.log('warn', tag, msg, data);
		}
		error(tag, msg, data) {
			return this.log('error', tag, msg, data);
		}

		milestone(tag, msg, data) {
			const entry = this._record('milestone', tag, msg, data);
			console.log('%c[Plush:' + tag + '] ' + msg, 'color:#c792ea;font-weight:bold', data || '');
			return entry;
		}

		recent(n) {
			n = n || RING_CAPACITY;
			const out = [];
			const count = Math.min(n, this._ringSize);
			for (let i = 0; i < count; i++) {
				const idx = (this._ringHead - 1 - i + RING_CAPACITY) % RING_CAPACITY;
				out.push(this._ring[idx]);
			}
			return out;
		}

		stats() {
			const byLevel = {};
			for (let i = 0; i < this._ringSize; i++) {
				const e = this._ring[i];
				if (!e) continue;
				byLevel[e.level] = (byLevel[e.level] || 0) + 1;
			}
			return { bufferSize: this._ringSize, byLevel: byLevel, sampleRates: this._sample };
		}
	}

	root.PlushLogger = PlushLogger;
})(typeof window !== 'undefined' ? window : this);
