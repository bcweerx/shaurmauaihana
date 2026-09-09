import { ArrowUpRight, ArrowDown, MapPin } from 'lucide-react';
import { business } from '../config/business';
import { Button } from '../components/ui/button';
export function Hero({ onOrder }: { onOrder: () => void }) {
  return (
    <>
      <section className="hero wrap" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> ТВОЯ ЗУПИНКА НА ШАВЕРМУ
          </div>
          <h1 id="hero-title">
            ГОЛОДНИЙ?
            <br />
            ТОБІ <span>ДО АЙХАНА.</span>
          </h1>
          <p>
            Шаверма, прогулянка, Одеса.
            <br />
            Зустрінемось біля парку Марка Твена.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#menu">
              Подивитися меню <ArrowUpRight />
            </a>
            <Button className="secondary-cta" onClick={onOrder}>
              Замовити <ArrowUpRight size={18} />
            </Button>
          </div>
          <a className="hero-location" href="#place">
            <MapPin size={18} />
            <span>
              {business.address}
              <small>біля колишнього парку Горького</small>
            </span>
          </a>
        </div>
        <div className="hero-visual">
          <img
            src="/shawarma-hero.webp"
            srcSet="/shawarma-hero-small.webp 768w, /shawarma-hero.webp 1536w"
            sizes="(max-width:720px) 100vw, 65vw"
            alt="Шаверма з підсмаженим лавашем, м’ясом та овочами — авторська AI-ілюстрація"
            width="1536"
            height="1024"
            fetchPriority="high"
          />
          <div className="food-sticker" aria-hidden="true">
            <span>ОДЕСЬКИЙ</span>
            <strong>
              STREET
              <br />
              FOOD
            </strong>
            <span>НАСТРІЙ</span>
          </div>
          <span className="photo-note">
            Авторська AI-ілюстрація · не фото закладу
          </span>
        </div>
        <div className="hero-bottom">
          <span>ЗАХОДЬ ПО ДОРОЗІ</span>
          <span>
            ЗАЛИШАЙ ЧАС НА ПРОГУЛЯНКУ <ArrowDown size={16} />
          </span>
        </div>
      </section>
      <div className="ticker" aria-hidden="true">
        <span>ЗАГОРНУТО З НАСТРОЄМ</span>
        <span>✳</span>
        <span>ШАВЕРМА АЙХАНА</span>
        <span>✳</span>
        <span>ОДЕСА, ЦЕ ДЛЯ ТЕБЕ</span>
        <span>✳</span>
      </div>
    </>
  );
}
