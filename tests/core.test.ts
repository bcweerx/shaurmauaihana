import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { products, categories } from '../data/menu';
import { business } from '../config/business';
import { sanitizeCart, updateQuantity, cartTotal, cartLines, MAX_QUANTITY } from '../lib/cart';
import { orderDestination, orderText } from '../lib/order';

await test('saved carts reject unknown products and corrupted quantities', () => {
  const id = products[0].id;
  for (const invalid of [null, [], 'invalid', { unknown: 2 }, { [id]: -1 }, { [id]: 1.5 }, { [id]: 21 }, { [id]: '2' }]) {
    assert.deepEqual(sanitizeCart(invalid), {});
  }
  assert.deepEqual(sanitizeCart({ [id]: 2, unknown: 4 }), { [id]: 2 });
});

await test('quantity changes preserve other lines, cap at 20 and remove at zero', () => {
  const [a, b] = products;
  let cart = { [a.id]: 1, [b.id]: 2 };
  cart = updateQuantity(cart, a.id, 100);
  assert.equal(cart[a.id], MAX_QUANTITY);
  cart = updateQuantity(cart, a.id, -MAX_QUANTITY);
  assert.deepEqual(cart, { [b.id]: 2 });
  assert.deepEqual(updateQuantity(cart, 'unknown', 1), cart);
  assert.deepEqual(updateQuantity(cart, b.id, 0.5), cart);
});

await test('total uses exact minor units and order summary includes every line', () => {
  const [a, b] = products;
  const cart = { [a.id]: 3, [b.id]: 2 };
  const expected = (Math.round(a.price * 100) * 3 + Math.round(b.price * 100) * 2) / 100;
  assert.equal(cartTotal(cart), expected);
  const text = orderText(cartLines(cart), expected, business.name);
  assert.ok(text.includes(`${a.name} × 3`));
  assert.ok(text.includes(`${b.name} × 2`));
  assert.ok(text.includes('підтвердьте'));
  assert.equal(cartTotal({}), 0);
});

await test('unconfigured and malformed order channels never create fake links', () => {
  assert.equal(orderDestination({ ...business, orderChannel: 'none' }, ''), null);
  assert.equal(orderDestination({ ...business, orderChannel: 'telegram', telegram: 'https://bad' }, ''), null);
  assert.equal(orderDestination({ ...business, orderChannel: 'phone', phone: '123' }, ''), null);
  assert.equal(orderDestination({ ...business, orderChannel: 'whatsapp', whatsapp: null }, ''), null);
});

await test('configured channels produce safe URLs without sending an order', () => {
  const text = 'Тест & текст / +';
  const wa = orderDestination({ ...business, orderChannel: 'whatsapp', whatsapp: '+380 (00) 000-00-00' }, text);
  assert.equal(new URL(wa!.url).searchParams.get('text'), text);
  assert.equal(wa!.autoFill, true);
  assert.equal(orderDestination({ ...business, orderChannel: 'telegram', telegram: 'test_shop' }, text)?.url, 'https://t.me/test_shop');
  assert.equal(orderDestination({ ...business, orderChannel: 'phone', phone: '+380000000000' }, text)?.url, 'tel:+380000000000');
});

await test('menu has unique IDs, usable prices, known categories and existing local assets', () => {
  assert.equal(new Set(products.map(p => p.id)).size, products.length);
  assert.ok(products.length > 100);
  for (const product of products) {
    assert.ok(product.name.trim());
    assert.ok(Number.isFinite(product.price) && product.price > 0);
    assert.ok(product.regularPrice >= product.price);
    assert.ok(product.categories.length && product.categories.every(c => categories.includes(c)));
    if (product.image) assert.ok(existsSync(`public${product.image}`), product.image);
  }
});

await test('production HTML is prerendered and protects unverified presentation from indexing', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  assert.ok(html.includes('id="menu-title"'));
  assert.ok(html.includes('application/ld+json'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  if (!business.ownerVerified || !business.indexable) {
    assert.ok(html.includes('content="noindex,nofollow"'));
    assert.ok(readFileSync('dist/robots.txt', 'utf8').includes('Disallow: /'));
  }
});
