import { Badge } from '@/components/ui/badge';
import type { ProductLine } from '@/types';
import { PRODUCT_LINE_LABELS, PRODUCT_LINE_COLORS } from '@/lib/constants/productLines';

interface Props {
  productLine: ProductLine;
  size?: 'sm' | 'md';
}

export function ProductBadge({ productLine, size = 'md' }: Props) {
  const label = PRODUCT_LINE_LABELS[productLine];
  const color = PRODUCT_LINE_COLORS[productLine];

  return (
    <Badge
      style={{ backgroundColor: color, color: '#fff', fontSize: size === 'sm' ? '10px' : '11px' }}
      className="font-medium whitespace-nowrap border-0"
    >
      {label}
    </Badge>
  );
}
