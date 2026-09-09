import { ArrowUpRight } from 'lucide-react';
import { Brand } from '../components/brand';
import { business } from '../config/business';
export function Footer() {
  return (
    <footer className="wrap footer">
      <Brand />
      <span>
        {business.city} · {business.address}
      </span>
      <a href="#top">
        Нагору <ArrowUpRight size={16} />
      </a>
      {business.instagram && (
        <a href={business.instagram} target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
      )}
      <p>
        © {new Date().getFullYear()} {business.name}.{' '}
        {business.ownerVerified
          ? ''
          : 'Презентаційна версія для погодження із закладом. '}
        Обкладинка — AI-ілюстрація.
      </p>
    </footer>
  );
}
