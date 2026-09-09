import { business } from '../config/business';
export function Brand() {
  return (
    <a className="brand" href="#top" aria-label={`${business.name} — головна`}>
      <span className="brand-symbol" aria-hidden="true">
        А<span>•</span>
      </span>
      <span>
        ШАВЕРМА
        <br />
        <b>АЙХАНА</b>
      </span>
    </a>
  );
}
