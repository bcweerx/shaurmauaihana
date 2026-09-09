import { useState } from 'react';
import { ShoppingBag, ArrowRight, Check } from 'lucide-react';
import { CartProvider, useCart } from '../components/cart-context';
import { CartDrawer } from '../components/cart-drawer';
import { Button } from '../components/ui/button';
import { formatMoney } from '../lib/format';
import { Header } from '../sections/header';
import { Hero } from '../sections/hero';
import { MenuSection } from '../sections/menu-section';
import { About } from '../sections/about';
import { Contacts } from '../sections/contacts';
import { Faq } from '../sections/faq';
import { Footer } from '../sections/footer';
function Site() {
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const { count, total } = useCart();
  return (
    <div id="top">
      <a className="skip-link" href="#menu">
        Перейти до меню
      </a>
      <Header onOrder={() => setCartOpen(true)} />
      <main>
        <Hero onOrder={() => setCartOpen(true)} />
        <MenuSection onAdded={(name) => setNotice(`Додано: ${name}`)} />
        <About />
        <Contacts />
        <Faq />
      </main>
      <Footer />
      {count > 0 && (
        <Button className="floating-bag" onClick={() => setCartOpen(true)}>
          <ShoppingBag size={18} />
          <span>
            Кошик <b>{count}</b>
          </span>
          <strong>{formatMoney(total)}</strong>
          <ArrowRight size={18} />
        </Button>
      )}
      <output className="sr-only" aria-live="polite">
        {notice && (
          <>
            <Check size={17} />
            {notice}
          </>
        )}
      </output>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}
export default function Home() {
  return (
    <CartProvider>
      <Site />
    </CartProvider>
  );
}
