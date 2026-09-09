import { products, type Product } from '../data/menu';
export type Cart = Record<string, number>;
export type CartLine = { product: Product; quantity: number };
export const MAX_QUANTITY = 20;
export function sanitizeCart(input: unknown): Cart {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const output: Cart = {};
  for (const product of products) {
    const quantity = (input as Record<string, unknown>)[product.id];
    if (
      typeof quantity === 'number' &&
      Number.isInteger(quantity) &&
      quantity > 0 &&
      quantity <= MAX_QUANTITY &&
      product.available !== false
    )
      output[product.id] = quantity;
  }
  return output;
}
export function updateQuantity(cart: Cart, id: string, delta: number): Cart {
  if (
    !Number.isInteger(delta) ||
    !products.some((p) => p.id === id && p.available !== false)
  )
    return cart;
  const next = { ...cart };
  const quantity = Math.max(0, Math.min(MAX_QUANTITY, (next[id] || 0) + delta));
  if (quantity) next[id] = quantity;
  else delete next[id];
  return next;
}
export function cartLines(cart: Cart): CartLine[] {
  return products
    .filter((p) => cart[p.id])
    .map((product) => ({ product, quantity: cart[product.id] }));
}
export function cartTotal(cart: Cart): number {
  return (
    cartLines(cart).reduce(
      (sum, { product, quantity }) =>
        sum + Math.round(product.price * 100) * quantity,
      0,
    ) / 100
  );
}
