import rawMenu from './menu.json';
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  regularPrice: number;
  categories: string[];
  image: string;
  available: boolean | null;
  popular: boolean;
  notice: string | null;
};
export const products: Product[] = rawMenu;
export const menuSource =
  'https://glovoapp.com/ru/ua/odesa/stores/shaurma-u-ayhana-ods';
export const menuCapturedAt = '2026-09-09';
export const categories = [
  'Шаурма',
  'Популярне',
  'Новинки',
  'Тандир',
  'Комбо',
  'Бургери',
  'Сендвічі',
  'Хот-доги',
  'Гарніри',
  'Картопля фрі',
  'Без м’яса',
  'Основні страви',
  'Напої',
];
