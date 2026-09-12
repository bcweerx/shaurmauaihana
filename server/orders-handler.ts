import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { business } from '../config/business';
import { ordering, type OrderingConfig } from '../config/ordering';
import { OrderError, validateOrder, telegramText } from './order';

type Env = Record<string, string | undefined>;
export type Dependencies = {
  env: Env;
  fetch: typeof fetch;
  config: OrderingConfig;
  ownerVerified: boolean;
};
const unavailable = () =>
  new OrderError(
    503,
    'UNAVAILABLE',
    'Онлайн-замовлення тимчасово недоступні. Спробуйте пізніше.',
  );
const uncertain = (id: string) =>
  new OrderError(
    409,
    'DELIVERY_UNKNOWN',
    `Не вдалося підтвердити надсилання №${id}. Не оформлюйте повторно: зв’яжіться із закладом і назвіть номер.`,
  );
export function createOrdersHandler(deps: Dependencies) {
  const { env, config, ownerVerified } = deps;
  const redisUrl = env.UPSTASH_REDIS_REST_URL || env.UPSTASH_REDIS_REST_KV_REST_API_URL || env.KV_REST_API_URL;
  const redisToken = env.UPSTASH_REDIS_REST_TOKEN || env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || env.KV_REST_API_TOKEN;
  async function redis(command: (string | number)[]) {
    const response = await deps.fetch(redisUrl!, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw unavailable();
    const data = (await response.json()) as {
      result?: unknown;
      error?: unknown;
    };
    if (data.error || !('result' in data)) throw unavailable();
    return data.result;
  }
  return async (request: Request): Promise<Response> => {
    const reply = (status: number, body: unknown) =>
      Response.json(body, {
        status,
        headers: {
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow',
          ...(status === 429 ? { 'Retry-After': '600' } : {}),
          ...(status === 405 ? { Allow: 'POST' } : {}),
        },
      });
    let dispatchId: string | undefined;
    try {
      if (request.method !== 'POST')
        return reply(405, {
          code: 'METHOD',
          message: 'Використайте форму замовлення.',
        });
      const origins = (env.ORDER_ALLOWED_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (
        !request.headers.get('origin') ||
        !origins.includes(request.headers.get('origin')!)
      )
        throw new OrderError(
          403,
          'ORIGIN',
          'Відкрийте форму на сайті закладу.',
        );
      if (
        !request.headers
          .get('content-type')
          ?.match(/^application\/json(?:;|$)/i)
      )
        throw new OrderError(
          415,
          'CONTENT_TYPE',
          'Непідтримуваний формат запиту.',
        );
      if (
        env.ORDERS_ENABLED !== 'true' ||
        !config.enabled ||
        !config.menuVerified ||
        !ownerVerified ||
        !env.TELEGRAM_BOT_TOKEN ||
        !/^-?\d+$/.test(env.TELEGRAM_CHAT_ID || '') ||
        !redisUrl?.startsWith('https://') ||
        !redisToken ||
        (env.ORDER_HASH_SECRET?.length || 0) < 32
      )
        throw unavailable();
      // Vercel overwrites this header. Never deploy behind a proxy that accepts it from clients.
      const ip =
        env.VERCEL === '1'
          ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim()
          : '127.0.0.1';
      if (!ip || !isIP(ip)) throw unavailable();
      const hash = (value: string) =>
        createHmac('sha256', env.ORDER_HASH_SECRET!)
          .update(value)
          .digest('hex');
      const rateScript =
        "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],600) end; return n";
      const count = await redis([
        'EVAL',
        rateScript,
        1,
        `orders:rate:${hash(ip)}`,
      ]);
      if (typeof count !== 'number') throw unavailable();
      if (count > 5)
        throw new OrderError(
          429,
          'RATE_LIMIT',
          'Забагато спроб. Спробуйте через 10 хвилин.',
        );
      const reader = request.body?.getReader();
      if (!reader) throw new OrderError(400, 'BODY', 'Заповніть форму.');
      let size = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const next = await reader.read();
        if (next.done) break;
        size += next.value.length;
        if (size > 16384) {
          await reader.cancel();
          throw new OrderError(413, 'BODY_SIZE', 'Замовлення завелике.');
        }
        chunks.push(next.value);
      }
      let input: unknown;
      try {
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        throw new OrderError(400, 'JSON', 'Некоректні дані форми.');
      }
      const order = validateOrder(input, config);
      const message = telegramText(order);
      const { id, ...content } = order;
      const fingerprint = hash(JSON.stringify(content));
      const key = `orders:id:${id}`;
      const duplicateKey = `orders:duplicate:${fingerprint}`;
      // Atomic claim across serverless instances. Only hashed payload and ID enter Redis.
      const claimScript =
        "local old=redis.call('GET',KEYS[1]); if old then return old end; local dupe=redis.call('GET',KEYS[2]); if dupe then return 'duplicate:'..dupe end; redis.call('SET',KEYS[1],ARGV[1],'EX',86400); redis.call('SET',KEYS[2],ARGV[2],'EX',600); return 'claimed'";
      const claim = await redis([
        'EVAL',
        claimScript,
        2,
        key,
        duplicateKey,
        `pending:${fingerprint}`,
        id,
      ]);
      if (claim === `sent:${fingerprint}`)
        return reply(200, {
          id,
          message: 'Замовлення надіслано. Очікуйте дзвінка закладу.',
        });
      if (claim !== 'claimed') {
        if (typeof claim === 'string' && claim.startsWith('duplicate:'))
          throw uncertain(claim.slice(10));
        if (claim === `pending:${fingerprint}`) throw uncertain(id);
        throw new OrderError(
          409,
          'ID_CONFLICT',
          'Цей номер уже використано. Перевірте попереднє замовлення.',
        );
      }
      dispatchId = id;
      // No automatic retry: Telegram has no idempotency key. A timeout may mean it was delivered.
      const response = await deps.fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: env.TELEGRAM_CHAT_ID,
            text: message,
            link_preview_options: { is_disabled: true },
          }),
          signal: AbortSignal.timeout(8000),
        },
      );
      const result = (await response.json()) as {
        ok?: boolean;
        result?: { message_id?: number };
      };
      if (
        !response.ok ||
        result.ok !== true ||
        !Number.isInteger(result.result?.message_id)
      )
        throw uncertain(id);
      await redis(['SET', key, `sent:${fingerprint}`, 'EX', 86400]);
      return reply(200, {
        id,
        message:
          'Замовлення надіслано. Очікуйте дзвінка закладу для підтвердження та уточнення часу.',
      });
    } catch (error) {
      const safe = dispatchId
        ? uncertain(dispatchId)
        : error instanceof OrderError
          ? error
          : unavailable();
      return reply(safe.status, { code: safe.code, message: safe.message });
    }
  };
}
export const handleOrders = createOrdersHandler({
  env: process.env,
  fetch: globalThis.fetch,
  config: ordering,
  ownerVerified: business.ownerVerified,
});
