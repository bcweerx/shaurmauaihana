import { useState } from 'react';
import { ShoppingBag, X, ArrowUpRight, Trash2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from './ui/sheet';
import { Button } from './ui/button';
import { useCart } from './cart-context';
import { Quantity } from './quantity';
import { Checkout } from './checkout';
import { ordering } from '../config/ordering';
import { formatMoney } from '../lib/format';

export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lines, total, count, change, remove, clear } = useCart();
  const [review, setReview] = useState(false);
  const [receipt, setReceipt] = useState('');
  const [busy, setBusy] = useState(false);
  function close(next: boolean) {
    if (busy) return;
    onOpenChange(next);
    if (!next) setReview(false);
  }
  return (
    <Sheet open={open} onOpenChange={close}>
      <SheetContent className="selection-sheet" showCloseButton={false}>
        <div className="sheet-top">
          <p className="eyebrow">ТВОЯ СМАЧНА ПАУЗА</p>
          <SheetClose
            render={
              <Button className="close-button" aria-label="Закрити кошик" />
            }
          >
            <X />
          </SheetClose>
        </div>
        <SheetTitle className="sheet-title">
          ТВІЙ КОШИК <span>({count})</span>
        </SheetTitle>
        <SheetDescription className="sheet-description">
          Перевір вибір перед замовленням.
        </SheetDescription>
        {receipt ? (
          <div className="checkout-options" aria-live="polite">
            <p>{receipt}</p>
            <Button
              className="primary-link"
              onClick={() => {
                setReceipt('');
                close(false);
              }}
            >
              До меню
            </Button>
          </div>
        ) : !count ? (
          <div className="empty-cart">
            <ShoppingBag size={54} strokeWidth={1} />
            <h3>Поки що порожньо</h3>
            <p>
              Знайди свою страву в меню.
              <br />
              Ми збережемо вибір у цьому браузері.
            </p>
            <a
              className="primary-link"
              href="#menu"
              onClick={() => close(false)}
            >
              До меню <ArrowUpRight />
            </a>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {lines.map(({ product, quantity }) => (
                <div className="cart-item" key={product.id}>
                  <div className="cart-item-details">
                    <h3>{product.name}</h3>
                    <span>{formatMoney(product.price)} за порцію</span>
                    <strong>{formatMoney(product.price * quantity)}</strong>
                  </div>
                  <div className="cart-item-controls">
                    <Quantity
                      name={product.name}
                      quantity={quantity}
                      onChange={(delta) => { if (!busy) change(product.id, delta); }}
                    />
                    <Button
                      className="remove-item"
                      disabled={busy}
                      aria-label={`Видалити: ${product.name}`}
                      onClick={() => remove(product.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div>
                <span>Орієнтовно</span>
                <strong>{formatMoney(total)}</strong>
              </div>
              <p>
                {ordering.menuVerified
                  ? 'Сума страв без доставки.'
                  : 'Попередні ціни Glovo. Меню та ціни очікують підтвердження закладу.'}
              </p>
              {!review ? (
                <Button
                  className="primary-link"
                  onClick={() => setReview(true)}
                >
                  {'Перейти до замовлення'} <ArrowUpRight />
                </Button>
              ) : (
                <Checkout onSuccess={setReceipt} onBusyChange={setBusy} />
              )}
              <Button
                className="clear-cart"
                disabled={busy}
                onClick={() => {
                  clear();
                  setReview(false);
                }}
              >
                Очистити кошик
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
