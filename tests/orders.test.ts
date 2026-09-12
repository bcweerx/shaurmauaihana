import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { products } from '../data/menu';
import { validateOrder, telegramText } from '../server/order';
import { createOrdersHandler } from '../server/orders-handler';
import { ordering, type OrderingConfig } from '../config/ordering';

const config: OrderingConfig = {
  enabled: true,
  menuVerified: true,
  pickupEnabled: true,
  deliveryEnabled: true,
  zones: [
    {
      id: 'test',
      name: 'TEST ONLY',
      enabled: true,
      feeMinor: 5000,
      minimumMinor: 100,
      freeFromMinor: 100000,
      estimate: null,
    },
  ],
};
const payload = () => ({
  id: randomUUID(),
  name: 'Тестовий клієнт',
  phone: '+380 (50) 123-45-67',
  comment: '',
  fulfillment: 'pickup',
  payment: 'cash',
  website: '',
  items: [{ id: products[0].id, quantity: 1 }],
  expectedTotalMinor: Math.round(products[0].price * 100),
});
function fixture(
  options: {
    telegram?: 'timeout' | 'reject';
    redisDown?: boolean;
    finishDown?: boolean;
    enabled?: boolean;
  } = {},
) {
  const values = new Map<string, string>();
  let rate = 0;
  const sent: Record<string, unknown>[] = [];
  const fetchMock: typeof fetch = async (url, init) => {
    assert.equal(typeof url, 'string');
    assert.equal(typeof init?.body, 'string');
    if ((url as string).includes('api.telegram.org')) {
      sent.push(JSON.parse(init!.body as string) as Record<string, unknown>);
      if (options.telegram === 'timeout') throw Error('SECRET must never leak');
      return Response.json(
        options.telegram === 'reject'
          ? { ok: false }
          : { ok: true, result: { message_id: 1 } },
      );
    }
    if (options.redisDown) throw Error('Redis secret');
    const command = JSON.parse(init!.body as string) as (string | number)[];
    if (command[0] === 'EVAL' && command[2] === 1)
      return Response.json({ result: ++rate });
    if (command[0] === 'SET') {
      if (options.finishDown) throw Error('Redis failed after delivery');
      values.set(String(command[1]), String(command[2]));
      return Response.json({ result: 'OK' });
    }
    const key = String(command[3]);
    const duplicate = String(command[4]);
    let result = values.get(key);
    if (!result && values.has(duplicate))
      result = `duplicate:${values.get(duplicate)}`;
    if (!result) {
      values.set(key, String(command[5]));
      values.set(duplicate, String(command[6]));
      result = 'claimed';
    }
    return Response.json({ result });
  };
  const handler = createOrdersHandler({
    env: {
      ORDERS_ENABLED: options.enabled === false ? 'false' : 'true',
      ORDER_ALLOWED_ORIGINS: 'https://test.example',
      TELEGRAM_BOT_TOKEN: 'SECRET',
      TELEGRAM_CHAT_ID: '12345',
      UPSTASH_REDIS_REST_URL: 'https://redis.example',
      UPSTASH_REDIS_REST_TOKEN: 'REDIS_SECRET',
      ORDER_HASH_SECRET: 'x'.repeat(32),
      VERCEL: '1',
    },
    fetch: fetchMock,
    config,
    ownerVerified: true,
  });
  const request = (
    body: unknown = payload(),
    headers: Record<string, string> = {},
  ) =>
    handler(
      new Request('https://test.example/api/orders', {
        method: 'POST',
        headers: {
          Origin: 'https://test.example',
          'Content-Type': 'application/json',
          'x-vercel-forwarded-for': '192.0.2.1',
          ...headers,
        },
        body: JSON.stringify(body),
      }),
    );
  return { request, handler, sent };
}
await test('pickup: normalized phone and server prices; client price/chat ignored', () => {
  const order = validateOrder(
    { ...payload(), total: 1, chat_id: 'attacker' },
    config,
  );
  assert.equal(order.phone, '+380501234567');
  assert.equal(order.totalMinor, Math.round(products[0].price * 100));
  assert.equal(order.feeMinor, 0);
  assert.match(telegramText(order), /Готів|готів/);
});
await test('delivery: configured tariff, minimum, free threshold, address and transfer', () => {
  const input = {
    ...payload(),
    fulfillment: 'delivery',
    zoneId: 'test',
    address: 'TEST address 1',
    payment: 'transfer',
  };
  const order = validateOrder(
    { ...input, expectedTotalMinor: input.expectedTotalMinor + 5000 },
    config,
  );
  assert.equal(order.feeMinor, 5000);
  assert.match(telegramText(order), /переказ на картку/);
  const free = { ...config, zones: [{ ...config.zones[0], freeFromMinor: 0 }] };
  assert.equal(validateOrder(input, free).feeMinor, 0);
  assert.throws(() =>
    validateOrder(input, {
      ...config,
      zones: [{ ...config.zones[0], minimumMinor: 999999 }],
    }),
  );
  assert.throws(() => validateOrder({ ...input, address: '' }, config));
  assert.throws(() => validateOrder(input, ordering));
});
await test('validation rejects malformed data, invalid products, quantities, spam and stale prices', () => {
  for (const patch of [
    { name: '' },
    { name: 'a\nb' },
    { phone: '123' },
    { comment: 'x'.repeat(501) },
    { fulfillment: 'courier' },
    { payment: 'online' },
    { website: 'spam' },
    { items: [] },
    { items: [{ id: 'unknown', quantity: 1 }] },
    { items: [{ id: products[0].id, quantity: 21 }] },
    { items: [{ id: products[0].id, quantity: 1.5 }] },
    { items: [...payload().items, ...payload().items] },
    { expectedTotalMinor: 1 },
    { id: 'invalid' },
  ])
    assert.throws(() => validateOrder({ ...payload(), ...patch }, config));
  assert.throws(() =>
    validateOrder(payload(), config, [{ ...products[0], available: false }]),
  );
  for (const body of [null, [], 'bad', {}])
    assert.throws(() => validateOrder(body, config));
});
await test('successful delivery to fixed chat without formatting or CRM buttons', async () => {
  const f = fixture();
  const response = await f.request();
  assert.equal(response.status, 200);
  assert.equal(f.sent.length, 1);
  assert.equal(f.sent[0].chat_id, '12345');
  assert.equal(f.sent[0].parse_mode, undefined);
  assert.equal(f.sent[0].reply_markup, undefined);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
await test('same id replay is acknowledged without sending twice', async () => {
  const f = fixture();
  const input = payload();
  assert.equal((await f.request(input)).status, 200);
  assert.equal((await f.request(input)).status, 200);
  assert.equal(f.sent.length, 1);
  assert.equal(
    (await f.request({ ...input, comment: 'different' })).status,
    409,
  );
});
await test('concurrent requests and new IDs for same content cannot duplicate Telegram', async () => {
  const f = fixture();
  const input = payload();
  const results = await Promise.all([
    f.request(input),
    f.request(input),
    f.request({ ...input, id: randomUUID() }),
  ]);
  assert.equal(results.filter((r) => r.status === 200).length, 1);
  assert.equal(f.sent.length, 1);
});
await test('timeout, Telegram rejection and Redis failure after send remain uncertain, no resend', async () => {
  for (const options of [
    { telegram: 'timeout' as const },
    { telegram: 'reject' as const },
    { finishDown: true },
  ]) {
    const f = fixture(options);
    const input = payload();
    const response = await f.request(input);
    assert.equal(response.status, 409);
    assert.equal((await response.json()).code, 'DELIVERY_UNKNOWN');
    assert.equal((await f.request(input)).status, 409);
    assert.equal(f.sent.length, 1);
  }
});
await test('rate limiting and outages fail closed', async () => {
  const f = fixture();
  for (let i = 0; i < 5; i++) await f.request();
  const response = await f.request();
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('retry-after'), '600');
  for (const options of [{ redisDown: true }, { enabled: false }]) {
    const blocked = fixture(options);
    const result = await blocked.request();
    assert.equal(result.status, 503);
    assert.equal(blocked.sent.length, 0);
    assert.ok(!(await result.text()).includes('SECRET'));
  }
});
await test('method, origin, content type, trusted IP and body size are enforced', async () => {
  const f = fixture();
  assert.equal(
    (await f.handler(new Request('https://test.example/api/orders'))).status,
    405,
  );
  assert.equal(
    (await f.request(payload(), { Origin: 'https://evil.example' })).status,
    403,
  );
  assert.equal(
    (await f.request(payload(), { 'Content-Type': 'text/plain' })).status,
    415,
  );
  assert.equal(
    (await f.request(payload(), { 'x-vercel-forwarded-for': 'invalid' }))
      .status,
    503,
  );
  assert.equal(
    (await f.request({ ...payload(), comment: 'x'.repeat(17000) })).status,
    413,
  );
  assert.equal(f.sent.length, 0);
});
