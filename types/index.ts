// ─── Source / Product ─────────────────────────────────────────────────────────

export type DataSource = 'semrush' | 'brightedge';

export type ProductLine =
  | 'aceableagent'
  | 'drivers_ed'
  | 'defensive_driving'
  | 'unknown';

export type QueryIntent =
  | 'navigational'
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'unknown';

// ─── Raw Normalized Row (post-parse, pre-analysis) ────────────────────────────

export interface NormalizedRow {
  id: string;
  source: DataSource;
  uploadedAt: string;
  query: string;
  searchVolume?: number;
  aiResponseText: string;
  citedUrls: string[];
  citedDomains: string[];
  hasAiOverview: boolean;
  productLine: ProductLine;
  queryIntent: QueryIntent;
  // Semrush-specific
  semrushPosition?: number;
  semrushAiOverviewPresent?: boolean;
  // BrightEdge-specific
  brightedgeAiPlatform?: string;
  brightedgeCitationCount?: number;
  brightedgeTrackingDate?: string;
}

// ─── Brand Mention ─────────────────────────────────────────────────────────────

export type MentionStatus =
  | 'mentioned'
  | 'not_mentioned'
  | 'competitor_only';

export interface CompetitorMention {
  competitorName: string;
  domain: string;
  mentioned: boolean;
  contextSnippet: string | null;
}

export interface BrandMention {
  id: string;
  rowId: string;
  query: string;
  productLine: ProductLine;
  source: DataSource;
  mentionStatus: MentionStatus;
  aceable: {
    mentioned: boolean;
    matchedVariant: string | null;
    matchType: 'exact' | 'fuzzy' | null;
    matchScore: number | null;
    contextSnippet: string | null;
  };
  competitors: CompetitorMention[];
  aiResponseText: string;
  searchVolume?: number;
  uploadedAt: string;
}

// ─── Content Gap ──────────────────────────────────────────────────────────────

export type GapType = 'gap' | 'weak_presence' | 'brightedge_soc';

export interface ContentGap {
  id: string;
  query: string;
  productLine: ProductLine;
  source: DataSource;
  searchVolume?: number;
  queryIntent: QueryIntent;
  competitorsPresent: string[];
  competitorDomains: string[];
  aceable: {
    mentioned: boolean;
    citedUrl: string | null;
  };
  priorityScore: number;
  priorityTier: 'high' | 'medium' | 'low';
  suggestedAceableUrl: string | null;
  uploadedAt: string;
  rowId: string;
  gapType?: GapType;
}

// ─── Recommended Action ───────────────────────────────────────────────────────

export type RecommendedActionType =
  | 'add_brand_mention'
  | 'add_comparison_section'
  | 'add_schema_faq'
  | 'create_new_section'
  | 'update_meta_description'
  | 'add_citation_worthy_stat'
  | 'strengthen_brand_presence'
  | 'add_structured_data'
  | 'expand_content_depth'
  | 'add_internal_links'
  | 'add_llm_friendly_summary'
  | 'improve_citation_signal'
  | 'improve_soc_ranking';

export interface RecommendedAction {
  type: RecommendedActionType;
  description: string;
  targetQueries: string[];
}

// ─── Page Recommendation ──────────────────────────────────────────────────────

export interface PageRecommendation {
  id: string;
  aceableUrl: string;
  aceableDomain: 'aceableagent.com' | 'aceable.com';
  productLine: ProductLine;
  pageTitle: string;
  gapIds: string[];
  gaps: ContentGap[];
  totalMissedVolume: number;
  topCompetitors: string[];
  recommendedActions: RecommendedAction[];
  priorityScore: number;
}

// ─── Content Brief ────────────────────────────────────────────────────────────

export interface ContentBrief {
  id: string;
  createdAt: string;
  query: string;
  productLine: ProductLine;
  targetUrl: string;
  gap: ContentGap;
  competitors: string[];
  claudeModel: string;
  promptVersion: string;
  briefMarkdown: string;
  status: 'generating' | 'complete' | 'error';
  tokenCount?: number;
}

// ─── Upload Session ───────────────────────────────────────────────────────────

export interface ParseError {
  rowIndex: number;
  field: string;
  message: string;
  rawValue: string;
}

export interface UploadSession {
  id: string;
  uploadedAt: string;
  fileName: string;
  source: DataSource;
  rowCount: number;
  productLineBreakdown: Record<ProductLine, number>;
  parseErrors: ParseError[];
  rows: NormalizedRow[];
}

// ─── User Preferences ─────────────────────────────────────────────────────────

export interface UserPreferences {
  defaultProductFilter: ProductLine | 'all';
  briefTone: 'professional' | 'conversational' | 'technical';
  briefLength: 'concise' | 'standard' | 'comprehensive';
  dismissedOnboarding: boolean;
}

// ─── Brief Generation Config ──────────────────────────────────────────────────

export interface BriefGenerationConfig {
  tone: UserPreferences['briefTone'];
  length: UserPreferences['briefLength'];
  targetUrl: string;
  additionalContext: string;
}

// ─── Upload History Entry (lightweight, saved to localStorage) ────────────────

export interface UploadHistoryEntry {
  id: string;
  fileName: string;
  source: DataSource;
  uploadedAt: string;
  rowCount: number;
}

// ─── Semrush Source Citation ──────────────────────────────────────────────────
// From "sources_*.csv" export: which Aceable URLs are cited in AI responses

export interface SourceCitation {
  url: string;
  country: string;
  promptsCount: number;
  uploadedAt: string;
}

// ─── Page Analyzer — SEO + LLM Dual-Signal Audit ─────────────────────────────

export interface RawPageSignals {
  url: string;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Text: string | null;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  schemaTypes: string[];
  internalLinkCount: number;
  listCount: number;
  hasFaqSection: boolean;
  hasQuickAnswerBlock: boolean;
  brandMentionsFirst200Words: number;
  brandMentionsTotal: number;
  statsCount: number;
  hasCanonical: boolean;
  hasImageAlts: boolean;
  rawTextSnippet: string;
  fetchError?: string;
}

export interface ScoredItem {
  label: string;
  status: 'pass' | 'warn' | 'fail';
  points: number;
  maxPoints: number;
  detail: string;
}

export type ImpactLevel = 'strong_positive' | 'positive' | 'neutral' | 'caution' | 'negative';

export interface TradeoffAction {
  id: string;
  title: string;
  description: string;
  seoImpact: ImpactLevel;
  llmImpact: ImpactLevel;
  riskNote?: string;
}

export interface PageSpeedSignals {
  mobileScore: number | null;
  desktopScore: number | null;
  lcp: number | null;   // ms — Largest Contentful Paint
  cls: number | null;   // score — Cumulative Layout Shift
  inp: number | null;   // ms — Interaction to Next Paint
  ttfb: number | null;  // ms — Time to First Byte
  error?: string;
}

export interface GscPageEntry {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;      // 0–1
  position: number; // avg ranking position
}

export interface PowerBiPageEntry {
  url: string;
  // Current period
  sessions?: number;
  users?: number;
  conversions?: number;   // Orders
  revenue?: number;       // Sales
  bounceRate?: number;
  cvr?: number;           // CVR (conversion rate, 0–1)
  aov?: number;           // Average order value
  // Prior period (comparison)
  sessionsPrev?: number;
  conversionsPrev?: number;
  revenuePrev?: number;
  bounceRatePrev?: number;
  // Growth % as raw number, e.g. 15 = +15%, -5.2 = -5.2%
  sessionsGrowth?: number;
  conversionsGrowth?: number;
  revenueGrowth?: number;
  bounceRateGrowth?: number;
  cvrGrowth?: number;
}

export interface DataPeriodMeta {
  /** Human-readable label, e.g. "Jan–Mar 2025" or "Q1 2025 vs Q4 2024" */
  label: string;
  /** Whether this is a period-over-period comparison or an absolute date range */
  type: 'date_range' | 'comparison';
}

export interface DeepAnalysisResult {
  markdown: string;
  generatedAt: string;
}

export interface PageAnalysisResult {
  url: string;
  seoScore: number;
  llmScore: number;
  seoItems: ScoredItem[];
  llmItems: ScoredItem[];
  recommendations: TradeoffAction[];
  tradeoffWarnings: string[];
  signals: RawPageSignals;
  pageSpeed?: PageSpeedSignals;
}

// ─── BrightEdge AI Catalyst Share of Citations ────────────────────────────────

export type BrightEdgeBrandCategory = 'yours' | 'competitors' | 'others';

export interface BrightEdgeCitation {
  url: string;
  brandCategory: BrightEdgeBrandCategory;
  tracked: boolean;
  prompts: number;
  shareOfCitations: number;
  change: number;
  citationsCount: number;
  avgRank: number;
  uploadedAt: string;
}
