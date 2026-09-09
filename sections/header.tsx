import { useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { Brand } from '../components/brand';
import { Button } from '../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from '../components/ui/sheet';
import { useCart } from '../components/cart-context';
const links = [
  { href: '#menu', label: 'Меню' },
  { href: '#about', label: 'Про нас' },
  { href: '#place', label: 'Контакти' },
];
export function Header({ onOrder }: { onOrder: () => void }) {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  return (
    <>
      <div className="topline">
        <span>ОДЕСА · БІЛЯ ПАРКУ МАРКА ТВЕНА</span>
        <span>СМАК МІСТА. ТВОЯ ЗУПИНКА.</span>
      </div>
      <header className="site-header">
        <div className="header wrap">
          <Brand />
          <nav aria-label="Головна навігація">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <Button
              className="bag-button"
              onClick={onOrder}
              aria-label={`Замовити. У кошику ${count} страв`}
            >
              <ShoppingBag size={18} />
              <span>Замовити</span>
              <b>{count}</b>
            </Button>
            <Button
              className="mobile-menu-button"
              aria-label="Відкрити навігацію"
              onClick={() => setOpen(true)}
            >
              <Menu />
            </Button>
          </div>
        </div>
      </header>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          className="selection-sheet mobile-nav"
          showCloseButton={false}
        >
          <div className="sheet-top">
            <SheetTitle>Куди йдемо?</SheetTitle>
            <SheetClose
              render={
                <Button
                  className="close-button"
                  aria-label="Закрити навігацію"
                />
              }
            >
              <X />
            </SheetClose>
          </div>
          <SheetDescription>Шаверма Айхана · Одеса</SheetDescription>
          <nav aria-label="Мобільна навігація">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
          <Button
            className="primary-link"
            onClick={() => {
              setOpen(false);
              onOrder();
            }}
          >
            Замовити <ShoppingBag />
          </Button>
        </SheetContent>
      </Sheet>
    </>
  );
}
