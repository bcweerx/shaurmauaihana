import { products, type Product } from '../data/menu';
import { ordering, type OrderingConfig } from '../config/ordering';

export class OrderError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
function invalid(message = 'Перевірте дані замовлення.'): never {
  throw new OrderError(400, 'INVALID_ORDER', message);
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string') return invalid();
  const normalized = value.trim();
  if (
    normalized.length < min ||
    normalized.length > max ||
    Array.from(normalized).some(char => {
      const code = char.codePointAt(0)!;
      return code < 32 || (code >= 127 && code <= 159) || (code >= 0x202a && code <= 0x202e) || (code >= 0x2066 && code <= 0x2069);
    })
  )
    return invalid();
  return normalized;
}
export function validateOrder(
  input: unknown,
  config: OrderingConfig = ordering,
  menu: Product[] = products,
) {
  const body = record(input);
  if (body.website !== '') invalid();
  const id = text(body.id, 36, 36);
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id,
    )
  )
    invalid();
  const name = text(body.name, 2, 80);
  const phone = text(body.phone, 9, 30).replace(/[ ()-]/g, '');
  if (!/^\+[1-9]\d{8,14}$/.test(phone))
    invalid('Вкажіть телефон у міжнародному форматі, наприклад +380…');
  const comment = text(body.comment, 0, 500);
  const fulfillment = body.fulfillment;
  if (fulfillment !== 'pickup' && fulfillment !== 'delivery') invalid();
  const payment = body.payment;
  if (payment !== 'cash' && payment !== 'transfer') invalid();
  if (
    !Array.isArray(body.items) ||
    body.items.length < 1 ||
    body.items.length > 20
  )
    invalid('Оберіть від 1 до 20 різних страв.');
  const seen = new Set<string>();
  const items = body.items.map((value: unknown) => {
    const item = record(value);
    const product = menu.find((p) => p.id === item.id && p.available !== false);
    if (
      !product ||
      seen.has(product.id) ||
      typeof item.quantity !== 'number' ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    )
      return invalid(
        'Склад кошика змінився або містить недоступну страву. Оновіть сторінку.',
      );
    seen.add(product.id);
    const priceMinor = Math.round(product.price * 100);
    if (!Number.isSafeInteger(priceMinor) || priceMinor <= 0) return invalid();
    return {
      id: product.id,
      name: product.name,
      quantity: item.quantity,
      priceMinor,
    };
  });
  const subtotalMinor = items.reduce(
    (sum, item) => sum + item.priceMinor * item.quantity,
    0,
  );
  let feeMinor = 0;
  let address = '';
  let district = '';
  if (fulfillment === 'pickup' && !config.pickupEnabled)
    invalid('Самовивіз зараз недоступний.');
  if (fulfillment === 'delivery') {
    const zone = config.zones.find((z) => z.id === body.zoneId && z.enabled);
    if (
      !config.deliveryEnabled ||
      !zone ||
      zone.feeMinor === null ||
      zone.minimumMinor === null ||
      !Number.isSafeInteger(zone.feeMinor) ||
      zone.feeMinor < 0 ||
      !Number.isSafeInteger(zone.minimumMinor) ||
      zone.minimumMinor < 0 ||
      (zone.freeFromMinor !== null &&
        (!Number.isSafeInteger(zone.freeFromMinor) || zone.freeFromMinor < 0))
    )
      invalid('Доставка в цей район поки недоступна.');
    if (subtotalMinor < zone.minimumMinor)
      invalid(
        `Мінімальне замовлення для цього району: ${zone.minimumMinor / 100} грн.`,
      );
    feeMinor =
      zone.freeFromMinor !== null && subtotalMinor >= zone.freeFromMinor
        ? 0
        : zone.feeMinor;
    address = text(body.address, 5, 200);
    district = zone.name;
  }
  const totalMinor = subtotalMinor + feeMinor;
  if (body.expectedTotalMinor !== totalMinor)
    throw new OrderError(
      409,
      'PRICE_CHANGED',
      'Ціни змінилися. Оновіть сторінку та перевірте кошик.',
    );
  return {
    id,
    name,
    phone,
    comment,
    fulfillment,
    payment,
    items,
    subtotalMinor,
    feeMinor,
    totalMinor,
    address,
    district,
  };
}
export type Order = ReturnType<typeof validateOrder>;
export function telegramText(order: Order): string {
  const money = (n: number) => `${(n / 100).toFixed(2)} грн`;
  const message = [
    `Нове замовлення №${order.id}`,
    `Отримання: ${order.fulfillment === 'delivery' ? 'Доставка закладом' : 'Самовивіз'}`,
    `Ім’я: ${order.name}`,
    `Телефон: ${order.phone}`,
    ...(order.fulfillment === 'delivery'
      ? [`Район: ${order.district}`, `Адреса: ${order.address}`]
      : []),
    `Оплата при отриманні: ${order.payment === 'cash' ? 'готівкою' : 'переказ на картку'}`,
    '',
    ...order.items.map(
      (i) => `${i.quantity} × ${i.name} — ${money(i.priceMinor * i.quantity)}`,
    ),
    '',
    `Страви: ${money(order.subtotalMinor)}`,
    `Доставка: ${money(order.feeMinor)}`,
    `Разом: ${money(order.totalMinor)}`,
    ...(order.comment ? [`Коментар: ${order.comment}`] : []),
    'Зателефонуйте клієнту для підтвердження та уточнення часу.',
  ].join('\n');
  if (message.length > 4096)
    invalid(
      'Замовлення завелике. Скоротіть коментар або кількість різних страв.',
    );
  return message;
}
