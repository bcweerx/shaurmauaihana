import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  sanitizeCart,
  updateQuantity,
  cartLines,
  cartTotal,
  type Cart,
} from '../lib/cart';
const key = 'aykhan-cart-v2';
const empty: Cart = {};
let snapshot: Cart = empty;
let loaded = false;
const listeners = new Set<() => void>();
function read() {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    try {
      snapshot = sanitizeCart(JSON.parse(localStorage.getItem(key) || '{}'));
    } catch {
      snapshot = empty;
    }
  }
  return snapshot;
}
function emit() {
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) {
      loaded = false;
      read();
      emit();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
function save(next: Cart) {
  snapshot = next;
  loaded = true;
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    /* Cart remains usable without storage. */
  }
  emit();
}
function useCartState() {
  const cart = useSyncExternalStore(subscribe, read, () => empty);
  return {
    cart,
    lines: cartLines(cart),
    total: cartTotal(cart),
    count: Object.values(cart).reduce((sum, n) => sum + n, 0),
    change: (id: string, delta: number) =>
      save(updateQuantity(read(), id, delta)),
    remove: (id: string) => {
      const next = { ...read() };
      delete next[id];
      save(next);
    },
    clear: () => save({}),
  };
}
const CartContext = createContext<ReturnType<typeof useCartState> | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const value = useCartState();
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw Error('CartProvider is required');
  return context;
}
