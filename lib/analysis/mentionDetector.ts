import Fuse from 'fuse.js';
import { v4 as uuid } from 'uuid';
import type { NormalizedRow, BrandMention, CompetitorMention, MentionStatus, ProductLine } from '@/types';
import { BRAND_VARIANTS, COMPETITOR_VARIANTS } from '@/lib/constants/brands';
import { classifyQueryIntent } from '@/lib/constants/productLines';

const SNIPPET_RADIUS = 75;
const FUZZY_THRESHOLD = 0.15;
const FUZZY_MIN_CONFIDENCE = 0.75;

interface MentionDetectionResult {
  mentioned: boolean;
  matchedVariant: string | null;
  matchType: 'exact' | 'fuzzy' | null;
  matchScore: number | null;
  contextSnippet: string | null;
}

function extractSnippet(text: string, matchStart: number, matchLen: number): string {
  const start = Math.max(0, matchStart - SNIPPET_RADIUS);
  const end = Math.min(text.length, matchStart + matchLen + SNIPPET_RADIUS);
  const snippet = text.slice(start, end);
  return (start > 0 ? '...' : '') + snippet + (end < text.length ? '...' : '');
}

function detectMention(text: string, variants: string[]): MentionDetectionResult {
  if (!text || variants.length === 0) {
    return { mentioned: false, matchedVariant: null, matchType: null, matchScore: null, contextSnippet: null };
  }

  // Step 1: Exact match (case-insensitive)
  const lowerText = text.toLowerCase();
  for (const variant of variants) {
    const idx = lowerText.indexOf(variant.toLowerCase());
    if (idx !== -1) {
      return {
        mentioned: true,
        matchedVariant: variant,
        matchType: 'exact',
        matchScore: 1.0,
        contextSnippet: extractSnippet(text, idx, variant.length),
      };
    }
  }

  // Step 2: Fuzzy match on individual sentences
  const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) ?? [text];

  const fuse = new Fuse(variants, {
    threshold: FUZZY_THRESHOLD,
    includeScore: true,
    minMatchCharLength: 4,
  });

  for (const sentence of sentences) {
    const results = fuse.search(sentence.trim());
    if (results.length > 0 && results[0].score !== undefined) {
      const confidence = 1 - results[0].score;
      if (confidence >= FUZZY_MIN_CONFIDENCE) {
        return {
          mentioned: true,
          matchedVariant: results[0].item,
          matchType: 'fuzzy',
          matchScore: confidence,
          contextSnippet: sentence.trim().slice(0, 150),
        };
      }
    }
  }

  return { mentioned: false, matchedVariant: null, matchType: null, matchScore: null, contextSnippet: null };
}

function detectCompetitorMentions(text: string, productLine: ProductLine): CompetitorMention[] {
  const competitorMap = COMPETITOR_VARIANTS[productLine];
  return Object.entries(competitorMap).map(([name, variants]) => {
    const result = detectMention(text, variants);
    // Also check cited URLs/domains for competitor domain matches
    const domainMatch = variants.find(v => v.includes('.') && text.toLowerCase().includes(v.toLowerCase()));
    const domain = variants.find(v => v.includes('.')) ?? name.toLowerCase().replace(/\s+/g, '') + '.com';

    return {
      competitorName: name,
      domain,
      mentioned: result.mentioned || !!domainMatch,
      contextSnippet: result.contextSnippet,
    };
  });
}

function determineMentionStatus(
  aceableMentioned: boolean,
  competitors: CompetitorMention[]
): MentionStatus {
  const anyCompetitor = competitors.some(c => c.mentioned);
  if (aceableMentioned) return 'mentioned';
  if (anyCompetitor) return 'competitor_only';
  return 'not_mentioned';
}

export function analyzeRow(row: NormalizedRow): BrandMention {
  const brandVariants = [
    ...(BRAND_VARIANTS[row.productLine] ?? []),
    ...BRAND_VARIANTS.unknown,
  ];
  // Deduplicate
  const uniqueVariants = [...new Set(brandVariants)];

  const aceableResult = detectMention(row.aiResponseText, uniqueVariants);

  // Also check cited domains for aceable.com / aceableagent.com
  const aceableDomainInCited = row.citedDomains.some(d =>
    d.includes('aceable.com') || d.includes('aceableagent.com')
  );
  const aceableMentioned = aceableResult.mentioned || aceableDomainInCited;

  const competitors = detectCompetitorMentions(row.aiResponseText, row.productLine);

  return {
    id: uuid(),
    rowId: row.id,
    query: row.query,
    productLine: row.productLine,
    source: row.source,
    mentionStatus: determineMentionStatus(aceableMentioned, competitors),
    aceable: {
      mentioned: aceableMentioned,
      matchedVariant: aceableResult.matchedVariant,
      matchType: aceableResult.matchType,
      matchScore: aceableResult.matchScore,
      contextSnippet: aceableResult.contextSnippet,
    },
    competitors,
    aiResponseText: row.aiResponseText,
    searchVolume: row.searchVolume,
    uploadedAt: row.uploadedAt,
  };
}

export function analyzeRows(rows: NormalizedRow[]): BrandMention[] {
  return rows
    .filter(r => r.hasAiOverview && r.aiResponseText.length > 0)
    .map(analyzeRow);
}
