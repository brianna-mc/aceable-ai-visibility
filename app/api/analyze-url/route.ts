import { NextRequest, NextResponse } from 'next/server';
import type { RawPageSignals, PageSpeedSignals } from '@/types';
import { BRAND_VARIANTS } from '@/lib/constants/brands';

// All known brand name variants flattened
const ALL_BRAND_VARIANTS = Object.values(BRAND_VARIANTS).flat();

function extractText(tag: string, html: string): string | null {
  const m = html.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : null;
}

function extractAttr(pattern: RegExp, html: string): string | null {
  const m = html.match(pattern);
  return m ? m[1].trim() : null;
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countMatches(html: string, pattern: RegExp): number {
  return (html.match(pattern) ?? []).length;
}

function getBrandMentionCount(text: string): number {
  const lower = text.toLowerCase();
  return ALL_BRAND_VARIANTS.filter(v => lower.includes(v.toLowerCase())).length;
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPageSpeed(url: string): Promise<PageSpeedSignals> {
  const apiKey = process.env.PAGESPEED_API_KEY ?? '';
  const keyParam = apiKey ? `&key=${apiKey}` : '';
  const psUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${keyParam}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  let res: Response;
  try {
    res = await fetch(psUrl, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) throw new Error(`PageSpeed HTTP ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  const cats = data?.lighthouseResult?.categories;
  const audits = data?.lighthouseResult?.audits;
  if (!cats || !audits) throw new Error('PageSpeed: unexpected response shape');
  return {
    mobileScore: Math.round((cats?.performance?.score ?? 0) * 100),
    desktopScore: null,
    lcp: audits?.['largest-contentful-paint']?.numericValue ?? null,
    cls: audits?.['cumulative-layout-shift']?.numericValue ?? null,
    inp: audits?.['interaction-to-next-paint']?.numericValue ?? null,
    ttfb: audits?.['server-response-time']?.numericValue ?? null,
  };
}

export async function POST(req: NextRequest) {
  const { url } = await req.json() as { url: string };

  if (!url || !url.startsWith('http')) {
    return NextResponse.json({ error: 'Valid URL required' }, { status: 400 });
  }

  const [htmlResult, pageSpeedResult] = await Promise.allSettled([
    fetchHtml(url),
    fetchPageSpeed(url),
  ]);

  if (htmlResult.status === 'rejected') {
    const msg = htmlResult.reason instanceof Error ? htmlResult.reason.message : 'Fetch failed';
    return NextResponse.json({ signals: blankSignals(url, msg) });
  }

  const html = htmlResult.value;
  const pageSpeed: PageSpeedSignals | null =
    pageSpeedResult.status === 'fulfilled'
      ? pageSpeedResult.value
      : null;
  const pageSpeedError: string | null =
    pageSpeedResult.status === 'rejected'
      ? (pageSpeedResult.reason instanceof Error ? pageSpeedResult.reason.message : 'PageSpeed failed')
      : null;

  // ── Extract signals ──────────────────────────────────────────────────────────

  const title = extractText('title', html);
  const titleLength = title?.length ?? 0;

  const metaDescription =
    extractAttr(/meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i, html) ??
    extractAttr(/meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i, html);
  const metaDescriptionLength = metaDescription?.length ?? 0;

  // H tags
  const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
  const h1Count = h1Matches.length;
  const h1Text = h1Count > 0 ? h1Matches[0][1].replace(/<[^>]+>/g, '').trim() : null;
  const h2Count = countMatches(html, /<h2[^>]*>/gi);
  const h3Count = countMatches(html, /<h3[^>]*>/gi);

  // Word count from body text
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;
  const plainText = stripTags(bodyHtml);
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // Schema markup
  const schemaBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  const schemaTypes: string[] = [];
  for (const block of schemaBlocks) {
    try {
      const parsed = JSON.parse(block[1]);
      const types = Array.isArray(parsed)
        ? parsed.map((o: Record<string, unknown>) => o['@type']).filter(Boolean)
        : parsed['@type']
        ? [parsed['@type']]
        : [];
      schemaTypes.push(...types.flat().map(String));
    } catch {
      // ignore malformed JSON
    }
  }

  // Internal links
  const domain = new URL(url).hostname.replace('www.', '');
  const linkMatches = [...html.matchAll(/href=["']([^"']+)["']/gi)];
  const internalLinkCount = linkMatches.filter(m => {
    const href = m[1];
    return href.includes(domain) || (href.startsWith('/') && !href.startsWith('//'));
  }).length;

  // Lists
  const listCount = countMatches(html, /<(ul|ol)[^>]*>/gi);

  // FAQ section detection
  const headingTexts = [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').toLowerCase());
  const hasFaqSection = headingTexts.some(t =>
    t.includes('faq') || t.includes('frequently asked') || t.includes('common question') || t.includes('questions about')
  );

  // Quick-answer block: first non-empty <p> that is concise (≤120 words)
  const firstParas = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].slice(0, 5);
  const hasQuickAnswerBlock = firstParas.some(m => {
    const text = m[1].replace(/<[^>]+>/g, '').trim();
    const wc = text.split(/\s+/).filter(Boolean).length;
    return wc >= 20 && wc <= 120;
  });

  // Brand mentions
  const first200Words = words.slice(0, 200).join(' ');
  const brandMentionsFirst200Words = getBrandMentionCount(first200Words);
  const brandMentionsTotal = getBrandMentionCount(plainText);

  // Stats: count occurrences of percentages or standalone numbers in context
  const statsMatches = plainText.match(/\b\d[\d,]*\.?\d*\s*(%|percent|students?|hours?|days?|weeks?|months?|years?|courses?|states?|pass|exam|license)/gi);
  const statsCount = statsMatches?.length ?? 0;

  // Canonical
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);

  // Image alts
  const imgTags = [...html.matchAll(/<img[^>]+>/gi)];
  const hasImageAlts = imgTags.length === 0 || imgTags.some(m => /alt=["'][^"']+["']/i.test(m[0]));

  // Raw text snippet
  const rawTextSnippet = plainText.slice(0, 500);

  const signals: RawPageSignals = {
    url,
    title,
    titleLength,
    metaDescription,
    metaDescriptionLength,
    h1Text,
    h1Count,
    h2Count,
    h3Count,
    wordCount,
    schemaTypes,
    internalLinkCount,
    listCount,
    hasFaqSection,
    hasQuickAnswerBlock,
    brandMentionsFirst200Words,
    brandMentionsTotal,
    statsCount,
    hasCanonical,
    hasImageAlts,
    rawTextSnippet,
  };

  return NextResponse.json({ signals, pageSpeed, pageSpeedError, plainText: plainText.slice(0, 4000) });
}

function blankSignals(url: string, fetchError: string): RawPageSignals {
  return {
    url, title: null, titleLength: 0, metaDescription: null, metaDescriptionLength: 0,
    h1Text: null, h1Count: 0, h2Count: 0, h3Count: 0, wordCount: 0,
    schemaTypes: [], internalLinkCount: 0, listCount: 0,
    hasFaqSection: false, hasQuickAnswerBlock: false,
    brandMentionsFirst200Words: 0, brandMentionsTotal: 0,
    statsCount: 0, hasCanonical: false, hasImageAlts: false,
    rawTextSnippet: '', fetchError,
  };
}
