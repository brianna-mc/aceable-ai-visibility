import type { ProductLine } from '@/types';
import { ACEABLE_URL_MAP, PRODUCT_ROOT_URLS } from '@/lib/constants/pageMap';

export function mapToAceablePage(query: string, productLine: ProductLine): string {
  const q = query.toLowerCase();

  const candidates = ACEABLE_URL_MAP.filter(e => e.productLine === productLine);

  const scored = candidates.map(entry => ({
    entry,
    score: entry.keywords.filter(kw => q.includes(kw.toLowerCase())).length,
  }));

  const best = scored.sort((a, b) => b.score - a.score)[0];

  if (best && best.score > 0) return best.entry.url;
  return PRODUCT_ROOT_URLS[productLine];
}
