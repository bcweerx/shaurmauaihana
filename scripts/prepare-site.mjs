import fs from 'node:fs/promises';
import { loadEnv } from 'vite';
import business from '../config/business.json' with { type: 'json' };
import { render } from '../.prerender/prerender.js';
const rawUrl =
  process.env.SITE_URL ||
  loadEnv('production', process.cwd(), 'SITE_URL').SITE_URL ||
  business.siteUrl;
let siteUrl = null;
if (rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password)
    throw Error('SITE_URL must be a public HTTPS URL');
  siteUrl = parsed.origin;
}
const indexable = Boolean(
  siteUrl && business.ownerVerified && business.indexable,
);
const escape = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
const title = `${business.name} — меню, ціни та адреса в Одесі`;
const image = siteUrl
  ? siteUrl + (business.socialImage || '/shawarma-hero.webp')
  : null;
const schema = {
  '@context': 'https://schema.org',
  '@type': 'Restaurant',
  name: business.name,
  description: business.description,
  address: {
    '@type': 'PostalAddress',
    streetAddress: business.address,
    addressLocality: business.city,
    addressCountry: business.country,
    ...(business.postalCode ? { postalCode: business.postalCode } : {}),
  },
  ...(siteUrl ? { url: siteUrl } : {}),
  ...(business.phone ? { telephone: business.phone } : {}),
  ...(business.openingHours ? { openingHours: business.openingHours } : {}),
  ...(business.coordinates
    ? { geo: { '@type': 'GeoCoordinates', ...business.coordinates } }
    : {}),
};
const metadata = [
  `<title>${escape(title)}</title>`,
  `<meta name="description" content="${escape(business.description)}">`,
  `<meta name="robots" content="${indexable ? 'index,follow' : 'noindex,nofollow'}">`,
  `<meta property="og:type" content="website">`,
  `<meta property="og:title" content="${escape(title)}">`,
  `<meta property="og:description" content="${escape(business.description)}">`,
  `<meta property="og:locale" content="uk_UA">`,
  `<meta property="og:site_name" content="${escape(business.name)}">`,
  `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
  `<meta name="twitter:title" content="${escape(title)}">`,
  `<meta name="twitter:description" content="${escape(business.description)}">`,
  ...(siteUrl
    ? [
        `<link rel="canonical" href="${siteUrl}/">`,
        `<meta property="og:url" content="${siteUrl}/">`,
      ]
    : []),
  ...(image
    ? [
        `<meta property="og:image" content="${escape(image)}">`,
        `<meta property="og:image:alt" content="Шаурма з м’ясом та овочами">`,
        `<meta name="twitter:image" content="${escape(image)}">`,
      ]
    : []),
  `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`,
].join('\n');
let html = await fs.readFile('dist/index.html', 'utf8');
html = html
  .replace(/<title>.*?<\/title>/, '')
  .replace(/<meta\s+name="(?:description|robots)"[^>]*>/g, '')
  .replace('</head>', metadata + '\n</head>')
  .replace('<div id="root"></div>', `<div id="root">${render()}</div>`);
await fs.writeFile('dist/index.html', html);
await fs.writeFile(
  'dist/robots.txt',
  `User-agent: *\n${indexable ? 'Allow: /' : 'Disallow: /'}\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`,
);
if (siteUrl)
  await fs.writeFile(
    'dist/sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/</loc></url></urlset>`,
  );
await fs.writeFile(
  'dist/404.html',
  '<!doctype html><html lang="uk"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Сторінку не знайдено</title><body style="background:#171a17;color:#eef5e5;font:20px Arial;padding:10vw"><h1>Тут поки порожньо.</h1><p>А меню — за один крок.</p><a href="/" style="color:#c3f85c">До головної сторінки →</a></body></html>',
);
console.log(
  `Prerendered HTML; indexing ${indexable ? 'enabled' : 'blocked'}; canonical ${siteUrl || 'pending real domain'}.`,
);
