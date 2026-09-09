import { Minus, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { MAX_QUANTITY } from '../lib/cart';
export function Quantity({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="quantity">
      <Button
        aria-label={`Зменшити кількість: ${name}`}
        onClick={() => onChange(-1)}
      >
        <Minus size={18} />
      </Button>
      <span aria-label={`Кількість: ${quantity}`}>{quantity}</span>
      <Button
        disabled={quantity >= MAX_QUANTITY}
        aria-label={`Збільшити кількість: ${name}`}
        onClick={() => onChange(1)}
      >
        <Plus size={18} />
      </Button>
    </div>
  );
}
