import type { Business } from '../config/business';
import type { CartLine } from './cart';
import { formatMoney } from './format';
export function orderText(lines: CartLine[], total: number, name: string) {
  return `${name}\nХочу замовити:\n${lines.map(({ product, quantity }) => `${product.name} × ${quantity} — ${formatMoney(product.price * quantity)}`).join('\n')}\nОрієнтовно: ${formatMoney(total)}\nЦіни з Glovo. Будь ласка, підтвердьте наявність, суму та спосіб отримання.`;
}
export function orderDestination(
  config: Business,
  text: string,
): { url: string; label: string; autoFill: boolean } | null {
  const digits = (value: string | null) => value?.replace(/[^\d+]/g, '') || '';
  if (
    config.orderChannel === 'whatsapp' &&
    /^\+?\d{8,15}$/.test(digits(config.whatsapp))
  )
    return {
      url: `https://wa.me/${digits(config.whatsapp).replace('+', '')}?text=${encodeURIComponent(text)}`,
      label: 'Продовжити у WhatsApp',
      autoFill: true,
    };
  if (
    config.orderChannel === 'telegram' &&
    /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(config.telegram || '')
  )
    return {
      url: `https://t.me/${config.telegram}`,
      label: 'Відкрити Telegram',
      autoFill: false,
    };
  if (
    config.orderChannel === 'phone' &&
    /^\+?\d{8,15}$/.test(digits(config.phone))
  )
    return {
      url: `tel:${digits(config.phone)}`,
      label: 'Зателефонувати',
      autoFill: false,
    };
  return null;
}
