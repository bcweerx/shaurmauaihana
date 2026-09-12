import { useState } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { type Product } from '../data/menu';
import { useCart } from './cart-context';
import { Quantity } from './quantity';
import { Button } from './ui/button';
import { formatMoney } from '../lib/format';
import { ordering } from '../config/ordering';
export function ProductCard({
  product,
  onAdded,
}: {
  product: Product;
  onAdded: (name: string) => void;
}) {
  const { cart, change } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const quantity = cart[product.id] || 0;
  return (
    <article className="dish-card">
      <div className="dish-image">
        <span className="dish-tag">{product.categories[0]}</span>
        {product.image && !imageFailed ? (
          <img
            src={product.image}
            alt={product.name}
            width="320"
            height="320"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="category-art">
            <UtensilsCrossed strokeWidth={1} />
            <span>{product.categories[0]}</span>
          </div>
        )}
      </div>
      <div className="dish-info">
        <h3>{product.name}</h3>
        <p
          id={`description-${product.id}`}
          className={
            expanded ? 'product-description expanded' : 'product-description'
          }
        >
          {product.description}
        </p>
        {product.description.length > 110 && (
          <Button
            className="description-toggle"
            aria-expanded={expanded}
            aria-controls={`description-${product.id}`}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Згорнути опис' : 'Повний склад'}
          </Button>
        )}
        {product.notice && (
          <details className="product-notice">
            <summary>Уточнення до позиції</summary>
            <p>{product.notice}</p>
          </details>
        )}
        <div className="dish-bottom">
          <div>
            {!ordering.menuVerified && <span
              className="old-price"
              aria-label={`Ціна без акції Glovo: ${formatMoney(product.regularPrice)}`}
            >
              {formatMoney(product.regularPrice)}
            </span>}
            <span className="price">{formatMoney(product.price)}</span>
            <span className="price-source">{ordering.menuVerified ? 'ціна закладу' : 'ціна Glovo'}</span>
          </div>
          {quantity ? (
            <Quantity
              name={product.name}
              quantity={quantity}
              onChange={(delta) => change(product.id, delta)}
            />
          ) : (
            <Button
              className="add-button"
              disabled={product.available === false}
              aria-label={`Додати: ${product.name}`}
              onClick={() => {
                change(product.id, 1);
                onAdded(product.name);
              }}
            >
              <Plus size={22} />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
