'use strict';

const fs = require('fs');
const path = require('path');

const EXCLUDE_DIRS = new Set(['node_modules', '.git', 'archive']);

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (EXCLUDE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) out.push(full);
	}
	return out;
}

const root = path.resolve(process.argv[2] || '.');
const files = walk(root);

console.log('== tab-out guard check ==\n');
console.log(
	'files with setInterval/requestAnimationFrame but no visibilitychange handling in the same file.'
);
console.log(
	'not all of these need a guard (e.g. one-shot fades, short timeouts), read before fixing.\n'
);

let flagged = 0;

for (const file of files) {
	const content = fs.readFileSync(file, 'utf8');

	const hasTimer =
		/\bsetInterval\s*\(/.test(content) || /\brequestAnimationFrame\s*\(/.test(content);
	if (!hasTimer) continue;

	const hasVisibilityGuard = /visibilitychange/.test(content);
	if (hasVisibilityGuard) continue;

	const intervalCount = (content.match(/\bsetInterval\s*\(/g) || []).length;
	const rafCount = (content.match(/\brequestAnimationFrame\s*\(/g) || []).length;

	flagged++;
	console.log(`${path.relative(root, file)}  (setInterval: ${intervalCount}, rAF: ${rafCount})`);
}

if (!flagged) console.log('nothing flagged.');
