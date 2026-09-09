import { MapPin, ArrowUpRight, Phone, Clock } from 'lucide-react';
import { business } from '../config/business';
export function Contacts() {
  return (
    <section className="place-section" id="place" aria-labelledby="place-title">
      <div className="wrap place-grid">
        <div>
          <p className="eyebrow">ПОБАЧИМОСЬ В ОДЕСІ</p>
          <h2 id="place-title">
            ПАРК ПОРУЧ.
            <br />
            <span>АЙХАН ТУТ.</span>
          </h2>
          <p className="place-copy">
            Завітай перед прогулянкою чи після.
            <br />
            Наша точка — на Космонавтів, біля парку.
          </p>
          <div className="contact-lines">
            <p>
              <Clock size={19} />
              {business.openingHours || 'Графік роботи уточнюється'}
            </p>
            {business.phone ? (
              <a href={`tel:${business.phone}`}>
                <Phone size={19} />
                {business.phone}
              </a>
            ) : (
              <p>Контактний номер буде додано після підтвердження закладом.</p>
            )}
          </div>
          <div className="contact-actions">
            {business.googleMapsUrl && (
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="primary-link"
              >
                Побудувати маршрут <ArrowUpRight />
              </a>
            )}
            {business.phone && (
              <a href={`tel:${business.phone}`} className="secondary-cta">
                Зателефонувати <Phone size={18} />
              </a>
            )}
          </div>
        </div>
        <address className="address-card">
          <MapPin size={32} />
          <p>{business.city.toUpperCase()} · УКРАЇНА</p>
          <h3>{business.address}</h3>
          <div className="address-divider" />
          <span>ОРІЄНТИР</span>
          <strong>{business.landmark}</strong>
          <p className="address-note">
            Колишній парк Горького.
            <br />
            Зручно знайти на мапі.
          </p>
          {business.googleMapsUrl && (
            <a
              href={business.googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Знайти адресу на Google Maps"
            >
              <ArrowUpRight />
            </a>
          )}
        </address>
      </div>
      {business.mapEmbedUrl && (
        <div className="wrap embedded-map">
          <iframe
            src={business.mapEmbedUrl}
            title={`Розташування — ${business.name}`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </section>
  );
}
