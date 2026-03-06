import type { NormalizedRow, BrandMention, ContentGap, PageRecommendation, SourceCitation, BrightEdgeCitation } from '@/types';

const KEYS = {
  rows: 'aceable_rows',
  mentions: 'aceable_mentions',
  gaps: 'aceable_gaps',
  recommendations: 'aceable_recommendations',
  sessionMeta: 'aceable_session_meta',
  sourceCitations: 'aceable_source_citations',
  brightedgeCitations: 'aceable_brightedge_citations',
} as const;

export interface SessionMeta {
  fileName: string;
  source: string;
  rowCount: number;
  uploadedAt: string;
}

function safeWrite(key: string, data: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    console.error(`sessionStorage write failed for key: ${key}`);
  }
}

function safeRead<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : null;
  } catch {
    return null;
  }
}

export const sessionStore = {
  saveRows: (rows: NormalizedRow[]) => safeWrite(KEYS.rows, rows),
  getRows: (): NormalizedRow[] => safeRead<NormalizedRow[]>(KEYS.rows) ?? [],

  saveMentions: (mentions: BrandMention[]) => safeWrite(KEYS.mentions, mentions),
  getMentions: (): BrandMention[] => safeRead<BrandMention[]>(KEYS.mentions) ?? [],

  saveGaps: (gaps: ContentGap[]) => safeWrite(KEYS.gaps, gaps),
  getGaps: (): ContentGap[] => safeRead<ContentGap[]>(KEYS.gaps) ?? [],

  saveRecommendations: (recs: PageRecommendation[]) => safeWrite(KEYS.recommendations, recs),
  getRecommendations: (): PageRecommendation[] => safeRead<PageRecommendation[]>(KEYS.recommendations) ?? [],

  saveMeta: (meta: SessionMeta) => safeWrite(KEYS.sessionMeta, meta),
  getMeta: (): SessionMeta | null => safeRead<SessionMeta>(KEYS.sessionMeta),

  saveSourceCitations: (citations: SourceCitation[]) => safeWrite(KEYS.sourceCitations, citations),
  getSourceCitations: (): SourceCitation[] => safeRead<SourceCitation[]>(KEYS.sourceCitations) ?? [],

  saveBrightEdgeCitations: (citations: BrightEdgeCitation[]) => safeWrite(KEYS.brightedgeCitations, citations),
  getBrightEdgeCitations: (): BrightEdgeCitation[] => safeRead<BrightEdgeCitation[]>(KEYS.brightedgeCitations) ?? [],

  hasData: (): boolean => {
    try {
      return (
        sessionStorage.getItem(KEYS.rows) !== null ||
        sessionStorage.getItem(KEYS.brightedgeCitations) !== null
      );
    } catch {
      return false;
    }
  },

  clear: () => {
    try {
      Object.values(KEYS).forEach(k => sessionStorage.removeItem(k));
    } catch {
      // ignore
    }
  },
};
