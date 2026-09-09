import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import business from '../config/business.json' with { type: 'json' };

const html = readFileSync('dist/index.html', 'utf8');
assert.ok(html.includes('id="menu-title"'), 'Missing prerendered menu');
assert.ok(html.includes('application/ld+json'), 'Missing structured data');
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'Expected a single h1');
if (!business.ownerVerified || !business.indexable) {
  assert.ok(
    html.includes('content="noindex,nofollow"'),
    'Unverified site must remain noindex',
  );
  assert.ok(readFileSync('dist/robots.txt', 'utf8').includes('Disallow: /'));
}
for (const match of html.matchAll(/(?:src|href)="(\/[^"#?]*)"/g)) {
  assert.ok(existsSync(`dist${match[1]}`), `Missing asset: ${match[1]}`);
}
for (const folder of ['work', '.git', 'node_modules', '.prerender', '.env']) {
  assert.equal(
    existsSync(`dist/${folder}`),
    false,
    `Private build input leaked: ${folder}`,
  );
}
console.log(
  'Build verified: prerender, metadata, indexing guard, local assets and output isolation.',
);
