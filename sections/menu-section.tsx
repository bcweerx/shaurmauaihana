import { useState } from 'react';
import { Search, X, ArrowDown } from 'lucide-react';
import { categories, products, menuSource, menuCapturedAt } from '../data/menu';
import { Button } from '../components/ui/button';
import { ProductCard } from '../components/product-card';
import { ordering } from '../config/ordering';
export function MenuSection({ onAdded }: { onAdded: (name: string) => void }) {
  const [category, setCategory] = useState('Шаурма');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(12);
  const needle = query.toLocaleLowerCase('uk').trim();
  const matches = products.filter(
    (p) =>
      (category === 'Усе меню' || p.categories.includes(category)) &&
      `${p.name} ${p.description}`.toLocaleLowerCase('uk').includes(needle),
  );
  function choose(next: string) {
    setCategory(next);
    setLimit(12);
  }
  return (
    <section
      className="menu-section wrap"
      id="menu"
      aria-labelledby="menu-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">ЩО ОБЕРЕШ СЬОГОДНІ?</p>
          <h2 id="menu-title">
            Є НАСТРІЙ.
            <br />
            <span>Є ШАУРМА.</span>
          </h2>
        </div>
        <p className="section-aside">
          Від класики до тандиру.
          <br />
          {products.length} позицій для твоєї смачної паузи.
        </p>
      </div>
      <div className="menu-notice">
        <span className="status-pill">{ordering.menuVerified ? 'МЕНЮ ЗАКЛАДУ' : 'МЕНЮ GLOVO'}</span>
        <p>
          {ordering.menuVerified ? 'Меню та ціни підтверджені закладом.' : <>Ціни з Glovo від {menuCapturedAt.split('-').reverse().join('.')}. У
          закладі сума може відрізнятися.{' '}
          <a href={menuSource} target="_blank" rel="noreferrer">
            Джерело меню ↗
          </a></>}
        </p>
      </div>
      <div className="menu-tools">
        <label className="search-box">
          <Search size={19} />
          <span className="sr-only">Пошук страви або інгредієнта</span>
          <input
            value={query}
            placeholder="Що шукаєш?"
            onChange={(event) => {
              setQuery(event.target.value);
              setLimit(12);
            }}
          />
          {query && (
            <Button aria-label="Очистити пошук" onClick={() => setQuery('')}>
              <X size={18} />
            </Button>
          )}
        </label>
        <label className="category-select">
          <span className="sr-only">Оберіть категорію</span>
          <select
            value={category}
            onChange={(event) => choose(event.target.value)}
          >
            {['Усе меню', ...categories].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="menu-toolbar">
        <div className="categories" aria-label="Категорії меню">
          {['Усе меню', ...categories].map((c) => (
            <Button
              key={c}
              className={`category ${category === c ? 'active' : ''}`}
              aria-pressed={category === c}
              onClick={() => choose(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>
      <div className="results-heading">
        <h3>{category}</h3>
        <output aria-live="polite">Знайдено: {matches.length}</output>
      </div>
      {matches.length ? (
        <div className="dish-grid">
          {matches.slice(0, limit).map((product) => (
            <ProductCard key={product.id} product={product} onAdded={onAdded} />
          ))}
        </div>
      ) : (
        <div className="empty-results">
          <Search size={32} />
          <h3>Такої страви не знайшли</h3>
          <p>Спробуй іншу назву або пошукай в усьому меню.</p>
          <Button
            className="primary-link"
            onClick={() => {
              setQuery('');
              choose('Усе меню');
            }}
          >
            Показати все меню
          </Button>
        </div>
      )}
      {matches.length > limit && (
        <Button
          className="load-more"
          onClick={() => setLimit((value) => value + 12)}
        >
          Ще {Math.min(12, matches.length - limit)} страв{' '}
          <ArrowDown size={18} />
        </Button>
      )}
      <p className="menu-footnote">
        Фото карток — із меню Glovo. Наявність, склад та алергени уточнюйте
        перед замовленням. Позиції з розбіжностями у джерелі мають окрему
        примітку.
      </p>
    </section>
  );
}
