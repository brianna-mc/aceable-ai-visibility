import type { BrightEdgeCitation, BrightEdgeBrandCategory, ParseError } from '@/types';
import { parseCsvString, readFileAsText, parseNumber } from './csvUtils';

export async function parseBrightEdgeSOCFile(file: File): Promise<{ citations: BrightEdgeCitation[]; errors: ParseError[] }> {
  const text = await readFileAsText(file);
  return parseBrightEdgeSOCCsv(text);
}

export function parseBrightEdgeSOCCsv(csvText: string): { citations: BrightEdgeCitation[]; errors: ParseError[] } {
  const { headers, rows: rawRows, errors: csvErrors } = parseCsvString(csvText);
  const errors: ParseError[] = csvErrors.map((e, i) => ({ rowIndex: i, field: 'csv', message: e, rawValue: '' }));

  // Find actual column names (case-insensitive)
  const h = (name: string) => headers.find(hd => hd.toLowerCase().includes(name.toLowerCase())) ?? name;

  const now = new Date().toISOString();
  const citations: BrightEdgeCitation[] = [];

  rawRows.forEach((raw, idx) => {
    const url = raw[h('Page URL')]?.trim() ?? raw['Page URL']?.trim() ?? '';
    if (!url) {
      errors.push({ rowIndex: idx, field: 'Page URL', message: 'Missing URL', rawValue: '' });
      return;
    }

    const brandCategoryRaw = (raw[h('Brand Category')] ?? '').toLowerCase().trim();
    const brandCategory: BrightEdgeBrandCategory =
      brandCategoryRaw === 'yours' ? 'yours' :
      brandCategoryRaw === 'competitors' ? 'competitors' :
      'others';

    citations.push({
      url,
      brandCategory,
      tracked: (raw[h('Tracked')] ?? '').toUpperCase() === 'TRUE',
      prompts: parseNumber(raw[h('Prompts')] ?? '') ?? 0,
      shareOfCitations: parseNumber(raw[h('Share of Citations')] ?? '') ?? 0,
      change: parseNumber(raw[h('Change')] ?? '') ?? 0,
      citationsCount: parseNumber(raw[h('Citations Count')] ?? '') ?? 0,
      avgRank: parseNumber(raw[h('Avg Rank')] ?? '') ?? 0,
      uploadedAt: now,
    });
  });

  // Sort by share of citations descending
  citations.sort((a, b) => b.shareOfCitations - a.shareOfCitations);

  return { citations, errors };
}
