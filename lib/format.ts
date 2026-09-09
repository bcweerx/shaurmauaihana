import { business } from '../config/business';
const numberFormat = new Intl.NumberFormat(business.locale, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
// Node and browser ICU versions may disagree on the UAH symbol (₴ / грн).
// A stable label keeps prerendered text identical during React hydration.
const currencyLabel = business.currency === 'UAH' ? 'грн' : business.currency;
export const formatMoney = (amount: number) =>
  `${numberFormat.format(amount)}\u00a0${currencyLabel}`;
