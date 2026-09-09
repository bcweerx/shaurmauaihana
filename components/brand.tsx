import { business } from '../config/business';
export function Brand() {
  return (
    <a className="brand" href="#top" aria-label={`${business.name} — головна`}>
      <span className="brand-symbol" aria-hidden="true">
        А<span>•</span>
      </span>
      <span>
        Шаурма <br />
        <b>у Айхана</b>
      </span>
    </a>
  );
}
