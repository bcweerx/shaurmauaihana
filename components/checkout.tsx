import { useRef, useState, type SubmitEvent } from 'react';
import { ordering } from '../config/ordering';
import { business } from '../config/business';
import { useCart } from './cart-context';
import { Button } from './ui/button';
import { formatMoney } from '../lib/format';

const pendingKey = 'aykhan-pending-order';
export function Checkout({
  onSuccess,
  onBusyChange,
}: {
  onSuccess: (message: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const { lines, total, clear } = useCart();
  const [fulfillment, setFulfillment] = useState('pickup');
  const [zoneId, setZoneId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [unresolved, setUnresolved] = useState(() => {
    try {
      return sessionStorage.getItem(pendingKey) || '';
    } catch {
      return '';
    }
  });
  const sending = useRef(false);
  const zones = ordering.zones.filter(
    (z) => z.enabled && z.feeMinor !== null && z.minimumMinor !== null,
  );
  const zone = zones.find((z) => z.id === zoneId);
  const subtotalMinor = Math.round(total * 100);
  const fee =
    fulfillment === 'delivery' && zone
      ? zone.freeFromMinor !== null && subtotalMinor >= zone.freeFromMinor
        ? 0
        : zone.feeMinor || 0
      : 0;
  const enabled =
    ordering.enabled && ordering.menuVerified && business.ownerVerified;
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current || unresolved || !enabled) return;
    const form = new FormData(event.currentTarget);
    const id = crypto.randomUUID();
    sending.current = true;
    setBusy(true);
    onBusyChange(true);
    setError('');
    try {
      try {
        sessionStorage.setItem(pendingKey, id);
      } catch {
        /* Retain ID in component when storage is unavailable. */
      }
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(25000),
        body: JSON.stringify({
          id,
          name: form.get('name'),
          phone: form.get('phone'),
          comment: form.get('comment'),
          payment: form.get('payment'),
          website: form.get('website'),
          fulfillment,
          zoneId,
          address: form.get('address') || '',
          expectedTotalMinor: subtotalMinor + fee,
          items: lines.map(({ product, quantity }) => ({
            id: product.id,
            quantity,
          })),
        }),
      });
      const result = (await response.json()) as {
        id?: string;
        code?: string;
        message?: string;
      };
      if (!response.ok) {
        if (
          result.code === 'DELIVERY_UNKNOWN' ||
          result.code === 'ID_CONFLICT' ||
          (response.status >= 500 && result.code !== 'UNAVAILABLE')
        ) {
          setUnresolved(id);
        } else {
          try {
            sessionStorage.removeItem(pendingKey);
          } catch {
            /* Storage is optional. */
          }
        }
        setError(result.message || 'Не вдалося надіслати замовлення.');
        return;
      }
      if (result.id !== id) throw Error('Invalid receipt');
      try {
        sessionStorage.removeItem(pendingKey);
      } catch {
        /* Storage is optional. */
      }
      onSuccess(
        `Замовлення №${id} надіслано. Очікуйте дзвінка закладу для підтвердження та уточнення часу.`,
      );
      clear();
    } catch {
      setUnresolved(id);
      setError('Зв’язок перервався. Замовлення могло бути надіслано.');
    } finally {
      sending.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }
  if (unresolved)
    return (
      <div className="checkout-options" role="alert">
        <p>{error}</p>
        <p>
          Уточніть у закладу замовлення №{unresolved} перед повторним
          оформленням.
        </p>
        {business.phone && (
          <a className="order-link" href={`tel:${business.phone}`}>
            Зателефонувати
          </a>
        )}
        <Button
          className="clear-cart"
          onClick={() => {
            try {
              sessionStorage.removeItem(pendingKey);
            } catch {
              /* Storage is optional. */
            }
            setUnresolved('');
            setError('');
          }}
        >
          Я уточнив результат у закладу
        </Button>
      </div>
    );
  return (
    <form className="checkout-form" onSubmit={submit}>
      <h3>Оформлення замовлення</h3>
      {!enabled && (
        <output>
          Онлайн-замовлення готуються до запуску. Надсилання поки недоступне.
        </output>
      )}
      <fieldset disabled={busy}>
        <legend>Отримання</legend>
        <label>
          <input
            type="radio"
            name="fulfillment"
            value="pickup"
            checked={fulfillment === 'pickup'}
            disabled={!ordering.pickupEnabled}
            onChange={() => setFulfillment('pickup')}
          />{' '}
          Самовивіз
        </label>
        <label>
          <input
            type="radio"
            name="fulfillment"
            value="delivery"
            checked={fulfillment === 'delivery'}
            disabled={!ordering.deliveryEnabled || !zones.length}
            onChange={() => setFulfillment('delivery')}
          />{' '}
          Доставка закладом
        </label>
        {!ordering.deliveryEnabled && (
          <p>Райони, вартість і час доставки уточнюються.</p>
        )}
        <label>
          Ім’я
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
          />
        </label>
        <label>
          Телефон
          <input
            name="phone"
            type="tel"
            required
            minLength={9}
            maxLength={30}
            placeholder="+380…"
            autoComplete="tel"
          />
        </label>
        {fulfillment === 'delivery' && (
          <>
            <label>
              Район
              <select
                required
                value={zoneId}
                onChange={(event) => setZoneId(event.target.value)}
              >
                <option value="">Оберіть район</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Повна адреса
              <input
                name="address"
                required
                minLength={5}
                maxLength={200}
                autoComplete="street-address"
                placeholder="Вулиця, будинок, квартира"
              />
            </label>
            {zone && (
              <p>
                Доставка: {formatMoney(fee / 100)}. Мінімальне замовлення:{' '}
                {formatMoney((zone.minimumMinor || 0) / 100)}.
                {zone.estimate && ` Орієнтовно: ${zone.estimate}`}
              </p>
            )}
          </>
        )}
        <label>
          Оплата
          <select name="payment">
            <option value="cash">Готівкою при отриманні</option>
            <option value="transfer">Переказ на картку при отриманні</option>
          </select>
        </label>
        <label>
          Коментар (необов’язково)
          <input name="comment" maxLength={500} />
        </label>
        <label className="checkout-trap" aria-hidden="true">
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
        <p>
          Контактні дані передаємо закладу для обробки замовлення. Оплата — при
          отриманні.
        </p>
        <strong>Разом: {formatMoney((subtotalMinor + fee) / 100)}</strong>
        <Button
          type="submit"
          className="primary-link"
          disabled={
            !enabled ||
            !lines.length ||
            (fulfillment === 'pickup' && !ordering.pickupEnabled) ||
            (fulfillment === 'delivery' &&
              (!zone || subtotalMinor < (zone.minimumMinor || 0)))
          }
        >
          {busy ? 'Надсилаємо…' : 'Надіслати замовлення'}
        </Button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
