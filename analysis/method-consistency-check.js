'use strict';

const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.name.endsWith('.js')) out.push(full);
	}
	return out;
}

function levenshtein(a, b) {
	const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
	for (let j = 0; j <= b.length; j++) dp[0][j] = j;
	for (let i = 1; i <= a.length; i++) {
		for (let j = 1; j <= b.length; j++) {
			dp[i][j] =
				a[i - 1] === b[j - 1]
					? dp[i - 1][j - 1]
					: 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
		}
	}
	return dp[a.length][b.length];
}

const target = process.argv[2] || '.';
const files = walk(target);

// namespace.methodName( pattern, only for capitalized or known globals since
// lowercase-leading is more likely a local var and too noisy to check
// im trying to make this not detect a million false positives im sorry
const callPattern = /\b([A-Z][A-Za-z0-9_]*)\.([a-zA-Z_][A-Za-z0-9_]*)\s*\(/g;

const usage = new Map(); // namespace -> methodName -> [{file, line}]

for (const file of files) {
	const content = fs.readFileSync(file, 'utf8');
	const lines = content.split('\n');
	lines.forEach((line, idx) => {
		callPattern.lastIndex = 0;
		let m;
		while ((m = callPattern.exec(line))) {
			const [, ns, method] = m;
			if (!usage.has(ns)) usage.set(ns, new Map());
			const methods = usage.get(ns);
			if (!methods.has(method)) methods.set(method, []);
			methods.get(method).push({ file, line: idx + 1 });
		}
	});
}

console.log('== namespace method-name consistency check ==\n');

let flaggedAny = false;

for (const [ns, methods] of usage) {
	if (methods.size < 2) continue;

	const entries = [...methods.entries()]; // [methodName, callsites][]

	for (const [method, sites] of entries) {
		if (sites.length > 2) continue; // only suspect rarely-used names

		for (const [otherMethod, otherSites] of entries) {
			if (otherMethod === method) continue;
			if (otherSites.length < sites.length * 3) continue; // other must be clearly dominant

			const dist = levenshtein(method, otherMethod);
			const isPrefixVariant = method.startsWith(otherMethod) || otherMethod.startsWith(method);
			const closeEdit = dist > 0 && dist <= 3;

			if (closeEdit || isPrefixVariant) {
				flaggedAny = true;
				const reason = isPrefixVariant ? 'prefix variant' : `edit distance ${dist}`;
				console.log(
					`${ns}.${method}() used ${sites.length}x, looks close to ${ns}.${otherMethod}() used ${otherSites.length}x (${reason})`
				);
				sites.forEach((s) => console.log(`  ${s.file}:${s.line}`));
				console.log('');
			}
		}
	}
}

if (!flaggedAny) console.log('nothing flagged.');
