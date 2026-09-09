import { business } from '../config/business';
export const formatMoney = (amount: number) =>
  new Intl.NumberFormat(business.locale, {
    style: 'currency',
    currency: business.currency,
    maximumFractionDigits: 2,
  }).format(amount);
