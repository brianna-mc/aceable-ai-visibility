import type { GscPageEntry } from '@/types';
import { parseCsvString } from './csvUtils';

/**
 * Parses a Google Search Console Performance report CSV export.
 *
 * GSC exports the "Pages" table with columns:
 *   Top pages | Clicks | Impressions | CTR | Position
 * (exact header name varies slightly by region/UI version)
 */
export function parseGscCsv(csvText: string): GscPageEntry[] {
  const { headers, rows } = parseCsvString(csvText);

  // Find URL column — GSC uses "Top pages", "Page", "Landing page" depending on version
  const urlCol = headers.find(h => {
    const l = h.toLowerCase();
    return l === 'top pages' || l === 'page' || l === 'landing page' || l === 'pages';
  }) ?? headers[0];

  const clicksCol = headers.find(h => h.toLowerCase() === 'clicks') ?? 'Clicks';
  const impressionsCol = headers.find(h => h.toLowerCase() === 'impressions') ?? 'Impressions';
  const ctrCol = headers.find(h => h.toLowerCase() === 'ctr') ?? 'CTR';
  const positionCol = headers.find(h => h.toLowerCase() === 'position') ?? 'Position';

  const entries: GscPageEntry[] = [];

  for (const row of rows) {
    const rawUrl = row[urlCol]?.trim();
    if (!rawUrl || !rawUrl.startsWith('http')) continue;

    const rawCtr = row[ctrCol] ?? '';
    // GSC exports CTR as "12%" or "0.12"
    const ctrNum = rawCtr.includes('%')
      ? parseFloat(rawCtr) / 100
      : parseFloat(rawCtr);

    entries.push({
      url: rawUrl.replace(/\/$/, ''), // normalize trailing slash
      clicks: parseInt(row[clicksCol] ?? '0', 10) || 0,
      impressions: parseInt(row[impressionsCol] ?? '0', 10) || 0,
      ctr: isNaN(ctrNum) ? 0 : ctrNum,
      position: parseFloat(row[positionCol] ?? '0') || 0,
    });
  }

  return entries;
}
