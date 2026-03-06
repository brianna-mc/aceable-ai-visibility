import type { PowerBiPageEntry } from '@/types';
import { parseCsvString } from './csvUtils';

export interface PowerBiColumnMap {
  urlCol: string;
  // Current period
  sessionsCol?: string;
  usersCol?: string;
  conversionsCol?: string;
  revenueCol?: string;
  bounceCol?: string;
  cvrCol?: string;
  aovCol?: string;
  // Comparison (prior) period
  sessionsPrevCol?: string;
  conversionsPrevCol?: string;
  revenuePrevCol?: string;
  bouncePrevCol?: string;
  // Growth % columns
  sessionsGrowthCol?: string;
  conversionsGrowthCol?: string;
  revenueGrowthCol?: string;
  bounceGrowthCol?: string;
  cvrGrowthCol?: string;
  allHeaders: string[];
}

/**
 * Smarter column finder:
 * 1. Exact match (case-insensitive)
 * 2. Starts-with match — skipped for headers containing any excludeSuffixes word
 * 3. Word-boundary match — same exclusion
 *
 * The `excludeSuffixes` param prevents "Sessions Comparison Period" from
 * matching when we're looking for the current-period "Sessions" column.
 */
function findCol(
  headers: string[],
  keywords: string[],
  excludeSuffixes: string[] = [],
): string | undefined {
  const lower = headers.map(h => h.toLowerCase().trim());
  const isExcluded = (h: string) =>
    excludeSuffixes.some(ex => h.includes(ex.toLowerCase()));

  // Pass 1: exact match (no exclusion — exact is unambiguous)
  for (const kw of keywords) {
    const idx = lower.indexOf(kw.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  // Pass 2: starts with (exclude headers that contain comparison/growth words)
  for (const kw of keywords) {
    const idx = lower.findIndex(
      h => h.startsWith(kw.toLowerCase()) && !isExcluded(h),
    );
    if (idx !== -1) return headers[idx];
  }
  // Pass 3: word-boundary (same exclusion)
  for (const kw of keywords) {
    const re = new RegExp(
      `\\b${kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
    );
    const idx = lower.findIndex(h => re.test(h) && !isExcluded(h));
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

// Suffixes that mark comparison-period or growth columns — used to exclude
// them when matching the current-period column.
const COMP_SUFFIXES = ['comparison period', 'growth'];

export function detectPowerBiColumns(headers: string[]): PowerBiColumnMap {
  return {
    // URL — "Landing Page" is the Power BI standard name
    urlCol:
      findCol(
        headers,
        ['landing page', 'url', 'page url', 'full url', 'page path', 'path', 'page'],
        COMP_SUFFIXES,
      ) ?? headers[0],

    // ── Current period ─────────────────────────────────────────────────────
    sessionsCol: findCol(
      headers,
      ['sessions', 'total sessions', 'session count', 'visits', 'total visits'],
      COMP_SUFFIXES,
    ),
    usersCol: findCol(
      headers,
      ['users', 'active users', 'unique users', 'unique visitors', 'visitors'],
      COMP_SUFFIXES,
    ),
    conversionsCol: findCol(
      headers,
      [
        'orders', 'conversions', 'total conversions', 'enrollments',
        'total enrollments', 'purchases', 'total purchases', 'transactions',
        'total transactions', 'goals', 'total goals', 'leads', 'sign ups', 'signups',
      ],
      COMP_SUFFIXES,
    ),
    revenueCol: findCol(
      headers,
      [
        'sales', 'revenue', 'total revenue', 'order revenue', 'transaction revenue',
        'gross revenue', 'net revenue', 'total sales', 'income', 'amount',
      ],
      COMP_SUFFIXES,
    ),
    bounceCol: findCol(headers, ['bounce rate', 'bounce'], COMP_SUFFIXES),
    cvrCol:    findCol(headers, ['cvr'], COMP_SUFFIXES),
    aovCol:    findCol(headers, ['aov'], COMP_SUFFIXES),

    // ── Comparison (prior) period ───────────────────────────────────────────
    sessionsPrevCol:     findCol(headers, ['sessions comparison period']),
    conversionsPrevCol:  findCol(headers, ['orders comparison period', 'conversions comparison period']),
    revenuePrevCol:      findCol(headers, ['sales comparison period', 'revenue comparison period']),
    bouncePrevCol:       findCol(headers, ['bounce rate comparison period']),

    // ── Growth % ───────────────────────────────────────────────────────────
    sessionsGrowthCol:    findCol(headers, ['sessions growth']),
    conversionsGrowthCol: findCol(headers, ['orders growth', 'conversions growth']),
    revenueGrowthCol:     findCol(headers, ['sales growth', 'revenue growth']),
    bounceGrowthCol:      findCol(headers, ['bounce rate growth']),
    cvrGrowthCol:         findCol(headers, ['cvr growth']),

    allHeaders: headers,
  };
}

function parseNum(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const cleaned = val.replace(/[$,%\s]/g, '').trim();
  if (cleaned === '' || cleaned === '-') return undefined;
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}

/** Normalise a rate value: if it looks like a percentage (>1 or <-1), divide by 100. */
function normaliseRate(n: number): number {
  return Math.abs(n) > 1 ? n / 100 : n;
}

export interface ParsePowerBiResult {
  entries: PowerBiPageEntry[];
  colMap: PowerBiColumnMap;
}

/**
 * Internal accumulator used during aggregation — tracks the running
 * sums and weighted totals needed to compute per-URL totals correctly.
 */
interface UrlAcc {
  sessions: number;
  sessionsPrev: number;
  users: number;
  conversions: number;
  conversionsPrev: number;
  revenue: number;
  revenuePrev: number;
  // bounce rate is a rate — accumulate as weighted sum (rate × sessions)
  bounceWeighted: number;      // sum(bounceRate   × sessions)
  bounceWeightedPrev: number;  // sum(bounceRatePrev × sessionsPrev)
}

export function parsePowerBiCsv(csvText: string): ParsePowerBiResult {
  const { headers, rows } = parseCsvString(csvText);
  const cols = detectPowerBiColumns(headers);
  const {
    urlCol,
    sessionsCol, usersCol, conversionsCol, revenueCol, bounceCol,
    sessionsPrevCol, conversionsPrevCol, revenuePrevCol, bouncePrevCol,
  } = cols;

  const get = (col: string | undefined, row: Record<string, string>) =>
    col ? row[col] : undefined;

  // Accumulate all rows by URL — handles exports broken down by Medium/Source/Page Type
  const accMap = new Map<string, UrlAcc>();

  for (const row of rows) {
    const rawUrl = row[urlCol]?.trim();
    if (!rawUrl) continue;
    const url = rawUrl.startsWith('http') ? rawUrl.replace(/\/$/, '') : rawUrl;
    const key  = url.toLowerCase();

    const sessions    = parseNum(get(sessionsCol, row))    ?? 0;
    const users       = parseNum(get(usersCol, row))       ?? 0;
    const conversions = parseNum(get(conversionsCol, row)) ?? 0;
    const revenue     = parseNum(get(revenueCol, row))     ?? 0;
    const bounceRaw   = parseNum(get(bounceCol, row));
    const bounceRate  = bounceRaw !== undefined ? normaliseRate(bounceRaw) : 0;

    const sessionsPrev    = parseNum(get(sessionsPrevCol, row))    ?? 0;
    const conversionsPrev = parseNum(get(conversionsPrevCol, row)) ?? 0;
    const revenuePrev     = parseNum(get(revenuePrevCol, row))     ?? 0;
    const bouncePrevRaw   = parseNum(get(bouncePrevCol, row));
    const bounceRatePrev  = bouncePrevRaw !== undefined ? normaliseRate(bouncePrevRaw) : 0;

    const existing = accMap.get(key);
    if (existing) {
      existing.sessions         += sessions;
      existing.sessionsPrev     += sessionsPrev;
      existing.users            += users;
      existing.conversions      += conversions;
      existing.conversionsPrev  += conversionsPrev;
      existing.revenue          += revenue;
      existing.revenuePrev      += revenuePrev;
      existing.bounceWeighted     += bounceRate     * sessions;
      existing.bounceWeightedPrev += bounceRatePrev * sessionsPrev;
    } else {
      accMap.set(key, {
        sessions, sessionsPrev, users,
        conversions, conversionsPrev,
        revenue, revenuePrev,
        bounceWeighted:     bounceRate     * sessions,
        bounceWeightedPrev: bounceRatePrev * sessionsPrev,
      });
    }

    // Preserve the original (pre-normalised) URL from the first row seen
    if (!accMap.has(key + '__url')) {
      // Store as a side-channel so we can reconstruct the entry URL exactly
    }
  }

  // Second pass: build PowerBiPageEntry from accumulators
  // We need to recover the original URL casing — rebuild from rows
  const urlByKey = new Map<string, string>();
  for (const row of rows) {
    const rawUrl = row[urlCol]?.trim();
    if (!rawUrl) continue;
    const url = rawUrl.startsWith('http') ? rawUrl.replace(/\/$/, '') : rawUrl;
    const key = url.toLowerCase();
    if (!urlByKey.has(key)) urlByKey.set(key, url);
  }

  const entries: PowerBiPageEntry[] = [];

  for (const [key, acc] of accMap) {
    const url = urlByKey.get(key) ?? key;
    const entry: PowerBiPageEntry = { url };

    if (acc.sessions    > 0) entry.sessions    = acc.sessions;
    if (acc.sessionsPrev > 0) entry.sessionsPrev = acc.sessionsPrev;
    if (acc.users       > 0) entry.users       = acc.users;
    if (acc.conversions > 0) entry.conversions = acc.conversions;
    if (acc.conversionsPrev > 0) entry.conversionsPrev = acc.conversionsPrev;
    if (acc.revenue     > 0) entry.revenue     = acc.revenue;
    if (acc.revenuePrev > 0) entry.revenuePrev = acc.revenuePrev;

    // Weighted-average bounce rate
    if (acc.sessions     > 0) entry.bounceRate    = acc.bounceWeighted     / acc.sessions;
    if (acc.sessionsPrev > 0) entry.bounceRatePrev = acc.bounceWeightedPrev / acc.sessionsPrev;

    // Derived: CVR and AOV from summed totals (more accurate than column values)
    if (acc.sessions    > 0 && acc.conversions >= 0) entry.cvr = acc.conversions / acc.sessions;
    if (acc.conversions > 0 && acc.revenue     >  0) entry.aov = acc.revenue     / acc.conversions;

    // Recalculate growth from summed current vs prior
    if (acc.sessionsPrev > 0)
      entry.sessionsGrowth = ((acc.sessions - acc.sessionsPrev) / acc.sessionsPrev) * 100;
    if (acc.conversionsPrev > 0)
      entry.conversionsGrowth = ((acc.conversions - acc.conversionsPrev) / acc.conversionsPrev) * 100;
    if (acc.revenuePrev > 0)
      entry.revenueGrowth = ((acc.revenue - acc.revenuePrev) / acc.revenuePrev) * 100;
    if (acc.sessionsPrev > 0 && acc.bounceWeightedPrev > 0) {
      const br     = acc.sessions     > 0 ? acc.bounceWeighted     / acc.sessions     : 0;
      const brPrev = acc.sessionsPrev > 0 ? acc.bounceWeightedPrev / acc.sessionsPrev : 0;
      if (brPrev > 0) entry.bounceRateGrowth = ((br - brPrev) / brPrev) * 100;
    }
    if (acc.sessions > 0 && acc.sessionsPrev > 0) {
      const cvr     = acc.sessions     > 0 ? acc.conversions     / acc.sessions     : 0;
      const cvrPrev = acc.sessionsPrev > 0 ? acc.conversionsPrev / acc.sessionsPrev : 0;
      if (cvrPrev > 0) entry.cvrGrowth = ((cvr - cvrPrev) / cvrPrev) * 100;
    }

    entries.push(entry);
  }

  return { entries, colMap: cols };
}
