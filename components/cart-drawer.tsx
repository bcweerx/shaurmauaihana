import { useState } from 'react';
import { ShoppingBag, X, Check, ArrowUpRight, Trash2 } from 'lucide-react';
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
import { business } from '../config/business';
import { formatMoney } from '../lib/format';
import { orderDestination, orderText } from '../lib/order';
export function CartDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lines, total, count, change, remove, clear } = useCart();
  const [review, setReview] = useState(false);
  const [copiedText, setCopiedText] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const text = orderText(lines, total, business.name);
  const destination = orderDestination(business, text);
  const copied = copiedText === text;
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  }
  function close(next: boolean) {
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
        {!count ? (
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
                      onChange={(delta) => change(product.id, delta)}
                    />
                    <Button
                      className="remove-item"
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
                Розрахунок за цінами Glovo, без доставки. Остаточну суму та
                наявність підтверджує заклад.
              </p>
              {!review ? (
                <Button
                  className="primary-link"
                  onClick={() => setReview(true)}
                >
                  {destination ? 'Перейти до замовлення' : 'Сформувати список'}{' '}
                  <ArrowUpRight />
                </Button>
              ) : (
                <div className="checkout-options">
                  <h3>
                    {destination
                      ? 'Залишився один крок'
                      : 'Список до замовлення готовий'}
                  </h3>
                  <p>
                    {destination
                      ? destination.autoFill
                        ? 'Відкриється чат із вашим списком. Надішліть повідомлення та дочекайтеся підтвердження.'
                        : 'Скопіюйте список і передайте його закладу. Замовлення підтверджується у розмові.'
                      : 'Канал зв’язку ще не підтверджений. Скопіюйте список або завітайте за адресою. Нічого не надіслано.'}
                  </p>
                  <Button className="primary-link" onClick={copy}>
                    {copied ? 'Список скопійовано' : 'Скопіювати список'}
                    {copied ? <Check /> : <ArrowUpRight />}
                  </Button>
                  {destination && (
                    <a
                      className="order-link"
                      href={destination.url}
                      target={
                        destination.url.startsWith('tel:')
                          ? undefined
                          : '_blank'
                      }
                      rel="noreferrer"
                    >
                      {destination.label} <ArrowUpRight size={18} />
                    </a>
                  )}
                  {!destination && (
                    <a
                      className="order-link"
                      href="#place"
                      onClick={() => close(false)}
                    >
                      Адреса закладу <ArrowUpRight size={18} />
                    </a>
                  )}
                  {copyFailed && (
                    <label className="manual-copy">
                      Скопіюйте текст вручну
                      <textarea
                        readOnly
                        value={text}
                        onFocus={(event) => event.target.select()}
                      />
                    </label>
                  )}
                  <output aria-live="polite" className="sr-only">
                    {copied ? 'Список скопійовано' : ''}
                  </output>
                </div>
              )}
              <Button
                className="clear-cart"
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
