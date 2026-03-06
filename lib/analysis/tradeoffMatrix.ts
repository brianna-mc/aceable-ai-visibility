import type { TradeoffAction, RawPageSignals, ScoredItem } from '@/types';

const ALL_ACTIONS: (TradeoffAction & {
  triggeredWhen: (signals: RawPageSignals, seoItems: ScoredItem[], llmItems: ScoredItem[]) => boolean;
})[] = [
  {
    id: 'add_faq_schema',
    title: 'Add FAQPage Schema Markup',
    description: 'Implement JSON-LD FAQPage schema with at least 3 Q&A pairs covering common user questions. This makes your page eligible for Google FAQ rich results AND provides structured context that AI systems reference directly when answering queries.',
    seoImpact: 'positive',
    llmImpact: 'strong_positive',
    triggeredWhen: (s) => !s.schemaTypes.includes('FAQPage') || !s.hasFaqSection,
  },
  {
    id: 'add_quick_answer_block',
    title: 'Add a Quick-Answer Block Near the Top',
    description: 'Place a concise (2–4 sentence) direct answer to your primary query at the very top of the page body, before any navigation or setup content. AI systems preferentially quote pages that lead with a clear answer.',
    seoImpact: 'neutral',
    llmImpact: 'strong_positive',
    riskNote: 'A prominent quick-answer block can reduce time-on-page and scroll depth if users find what they need immediately. Monitor organic CTR and engagement metrics for 4–6 weeks after adding it. If CTR drops, test moving it below the fold.',
    triggeredWhen: (s) => !s.hasQuickAnswerBlock,
  },
  {
    id: 'add_brand_early',
    title: 'Add Brand Name in Opening Paragraph',
    description: 'Ensure the exact brand name (Aceable or AceableAgent) appears clearly within the first 200 words of body content. AI systems match brand citations to specific entities — ambiguous references ("we", "the company") don\'t count.',
    seoImpact: 'neutral',
    llmImpact: 'strong_positive',
    triggeredWhen: (s) => s.brandMentionsFirst200Words === 0,
  },
  {
    id: 'increase_brand_frequency',
    title: 'Increase Brand Name Frequency',
    description: 'The brand name should appear naturally at least 3–5 times throughout the page. AI systems use term frequency as a confidence signal for attribution. Use full brand name variants (e.g., "AceableAgent real estate school") not just pronouns.',
    seoImpact: 'neutral',
    llmImpact: 'positive',
    triggeredWhen: (s) => s.brandMentionsTotal < 3,
  },
  {
    id: 'add_faq_section',
    title: 'Add an FAQ Section',
    description: 'Add a dedicated FAQ section with a clear "Frequently Asked Questions" or "Common Questions" heading, followed by 4–8 question/answer pairs in H3 + paragraph format. This helps both Google (FAQ rich results) and LLMs (structured Q&A is a preferred citation format).',
    seoImpact: 'positive',
    llmImpact: 'strong_positive',
    triggeredWhen: (s) => !s.hasFaqSection,
  },
  {
    id: 'expand_content_depth',
    title: 'Expand Content Depth to 1,500+ Words',
    description: 'Pages with fewer than 800 words are rarely cited by AI systems for competitive queries. Aim for 1,500+ words of substantive content — not padding, but real depth: step-by-step processes, state-specific requirements, comparison tables, expert insights.',
    seoImpact: 'strong_positive',
    llmImpact: 'positive',
    triggeredWhen: (s) => s.wordCount < 1000,
  },
  {
    id: 'add_schema_markup',
    title: 'Add Structured Data (JSON-LD)',
    description: 'Add JSON-LD schema appropriate to the page type: Course (for course pages), HowTo (for step-by-step guides), LocalBusiness (for location pages). Structured data helps Google understand page purpose and gives AI systems structured facts to cite.',
    seoImpact: 'positive',
    llmImpact: 'strong_positive',
    triggeredWhen: (s) => s.schemaTypes.length === 0,
  },
  {
    id: 'add_howto_schema',
    title: 'Add HowTo Schema for Step-by-Step Content',
    description: 'If this page explains a process (how to get a license, how to complete a course), wrap the steps in HowTo JSON-LD schema. AI systems frequently quote numbered step sequences and HowTo schema amplifies this behavior.',
    seoImpact: 'positive',
    llmImpact: 'strong_positive',
    triggeredWhen: (s, _, llmItems) =>
      !s.schemaTypes.includes('HowTo') &&
      llmItems.some(i => i.label.includes('List') && i.status !== 'pass'),
  },
  {
    id: 'add_statistics',
    title: 'Add Authoritative Statistics and Data Points',
    description: 'Include specific, verifiable statistics (pass rates, course completion times, cost comparisons, industry figures with sources). AI systems strongly prefer citing pages that contain specific numerical claims they can quote directly.',
    seoImpact: 'positive',
    llmImpact: 'strong_positive',
    triggeredWhen: (s) => s.statsCount < 3,
  },
  {
    id: 'add_lists',
    title: 'Add Structured Lists (Bullets or Numbered)',
    description: 'Use bulleted or numbered lists for requirements, steps, features, or comparisons. AI systems overwhelmingly prefer to cite list-formatted content because it\'s easy to quote accurately. SEO also benefits from list-rich content in featured snippets.',
    seoImpact: 'positive',
    llmImpact: 'strong_positive',
    triggeredWhen: (s) => s.listCount < 2,
  },
  {
    id: 'add_comparison_content',
    title: 'Add Competitor Comparison Content',
    description: 'Add a section or table comparing Aceable to competitors on key dimensions (price, mobile app, pass rate, state availability). AI systems often surface comparison content when users ask "best X" or "X vs Y" queries where competitors are dominating.',
    seoImpact: 'positive',
    llmImpact: 'strong_positive',
    triggeredWhen: (_s, seoItems, llmItems) =>
      llmItems.some(i => i.status === 'fail') && seoItems.some(i => i.status === 'fail'),
  },
  {
    id: 'add_internal_links',
    title: 'Add Internal Links from High-Authority Pages',
    description: 'Ensure at least 3–5 internal links point from high-traffic Aceable pages to this page. Internal linking passes authority, signals topical depth, and helps AI systems follow the content graph to cite the right page.',
    seoImpact: 'strong_positive',
    llmImpact: 'neutral',
    triggeredWhen: (s) => s.internalLinkCount < 3,
  },
  {
    id: 'optimize_title',
    title: 'Optimize Title Tag',
    description: 'Title should be 50–65 characters, contain the primary keyword near the start, and include the brand name. For state pages: "[State] Real Estate License | AceableAgent". Avoid keyword stuffing — one clear topic phrase only.',
    seoImpact: 'strong_positive',
    llmImpact: 'neutral',
    triggeredWhen: (s, seoItems) =>
      seoItems.some(i => (i.label.includes('Title') || i.label.includes('title')) && i.status !== 'pass'),
  },
  {
    id: 'optimize_meta',
    title: 'Optimize Meta Description',
    description: 'Meta description should be 130–165 characters, include the primary keyword and brand name, and contain a clear value proposition. A strong meta improves organic CTR which Google uses as a relevance signal.',
    seoImpact: 'strong_positive',
    llmImpact: 'neutral',
    triggeredWhen: (s, seoItems) =>
      seoItems.some(i => i.label.includes('Meta') && i.status !== 'pass'),
  },
];

export function getRelevantActions(
  signals: RawPageSignals,
  seoItems: ScoredItem[],
  llmItems: ScoredItem[],
): TradeoffAction[] {
  return ALL_ACTIONS
    .filter(a => a.triggeredWhen(signals, seoItems, llmItems))
    .map(({ triggeredWhen: _t, ...action }) => action);
}

export function getTradeoffWarnings(actions: TradeoffAction[]): string[] {
  return actions
    .filter(a => a.riskNote)
    .map(a => a.riskNote as string);
}
