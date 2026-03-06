import { v4 as uuid } from 'uuid';
import type { ContentGap, PageRecommendation, RecommendedAction, ProductLine, BrightEdgeCitation } from '@/types';
import { getPageTitle, PRODUCT_ROOT_URLS } from '@/lib/constants/pageMap';

function buildActionsForGap(gap: ContentGap): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // Weak presence: Aceable matched fuzzy-only — highest priority fix
  if (gap.gapType === 'weak_presence') {
    actions.push({
      type: 'strengthen_brand_presence',
      description: `Aceable is mentioned ambiguously for "${gap.query}". Add the exact brand name (Aceable / AceableAgent) prominently in the first paragraph so AI systems can attribute it clearly.`,
      targetQueries: [gap.query],
    });
  }

  if (gap.queryIntent === 'informational') {
    actions.push({
      type: 'add_schema_faq',
      description: `Add an FAQ section that directly answers "${gap.query}" and explicitly names Aceable as a solution.`,
      targetQueries: [gap.query],
    });
    actions.push({
      type: 'expand_content_depth',
      description: `Expand the page with a dedicated section answering informational queries like "${gap.query}" — AI systems reward comprehensive, well-structured answers.`,
      targetQueries: [gap.query],
    });
  }

  if (gap.queryIntent === 'commercial' || gap.competitorsPresent.length >= 2) {
    actions.push({
      type: 'add_comparison_section',
      description: `Add a comparison table or section positioning Aceable against ${gap.competitorsPresent.slice(0, 3).join(', ')}.`,
      targetQueries: [gap.query],
    });
  }

  if (!gap.aceable.mentioned) {
    actions.push({
      type: 'add_brand_mention',
      description: `Ensure the page clearly states the brand name (Aceable / AceableAgent) in an early paragraph with context matching the query intent.`,
      targetQueries: [gap.query],
    });
  }

  actions.push({
    type: 'add_citation_worthy_stat',
    description: `Add a compelling, citable statistic or claim relevant to "${gap.query}" that AI systems can quote in their responses.`,
    targetQueries: [gap.query],
  });

  if (gap.queryIntent === 'transactional' || gap.queryIntent === 'commercial') {
    actions.push({
      type: 'update_meta_description',
      description: `Update the meta description to include the brand name and a value proposition specifically addressing "${gap.query}".`,
      targetQueries: [gap.query],
    });
  }

  // Always recommend structured data + LLM summary for any gap
  actions.push({
    type: 'add_structured_data',
    description: `Add structured data markup (HowTo, FAQPage, or Course schema) that signals page authority for queries like "${gap.query}".`,
    targetQueries: [gap.query],
  });

  actions.push({
    type: 'add_llm_friendly_summary',
    description: `Add a concise, scannable "quick answer" block near the top of the page that AI systems can lift verbatim when responding to "${gap.query}".`,
    targetQueries: [gap.query],
  });

  if (gap.queryIntent === 'navigational' || gap.queryIntent === 'transactional') {
    actions.push({
      type: 'add_internal_links',
      description: `Add internal links from high-authority Aceable pages to this page to pass link equity and signal topical relevance for "${gap.query}".`,
      targetQueries: [gap.query],
    });
  }

  return actions;
}

function mergeActions(actionArrays: RecommendedAction[][]): RecommendedAction[] {
  const merged = new Map<string, RecommendedAction>();

  for (const actions of actionArrays) {
    for (const action of actions) {
      const existing = merged.get(action.type);
      if (existing) {
        existing.targetQueries = [...new Set([...existing.targetQueries, ...action.targetQueries])];
      } else {
        merged.set(action.type, { ...action, targetQueries: [...action.targetQueries] });
      }
    }
  }

  return Array.from(merged.values());
}

export function buildRecommendations(gaps: ContentGap[]): PageRecommendation[] {
  // Group gaps by suggested Aceable URL
  const byUrl = new Map<string, ContentGap[]>();

  for (const gap of gaps) {
    const url = gap.suggestedAceableUrl ?? 'https://www.aceable.com/';
    if (!byUrl.has(url)) byUrl.set(url, []);
    byUrl.get(url)!.push(gap);
  }

  const recommendations: PageRecommendation[] = [];

  for (const [url, urlGaps] of byUrl) {
    const productLine = urlGaps[0]?.productLine ?? ('unknown' as ProductLine);
    const domain = url.includes('aceableagent.com') ? 'aceableagent.com' : 'aceable.com';

    const totalMissedVolume = urlGaps.reduce((sum, g) => sum + (g.searchVolume ?? 0), 0);

    const competitorFrequency = new Map<string, number>();
    for (const gap of urlGaps) {
      for (const comp of gap.competitorsPresent) {
        competitorFrequency.set(comp, (competitorFrequency.get(comp) ?? 0) + 1);
      }
    }
    const topCompetitors = [...competitorFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    const allActions = urlGaps.map(g => buildActionsForGap(g));
    const recommendedActions = mergeActions(allActions);

    const maxPriorityScore = Math.max(...urlGaps.map(g => g.priorityScore));

    recommendations.push({
      id: uuid(),
      aceableUrl: url,
      aceableDomain: domain as 'aceableagent.com' | 'aceable.com',
      productLine,
      pageTitle: getPageTitle(url),
      gapIds: urlGaps.map(g => g.id),
      gaps: urlGaps.sort((a, b) => b.priorityScore - a.priorityScore),
      totalMissedVolume,
      topCompetitors,
      recommendedActions,
      priorityScore: maxPriorityScore,
    });
  }

  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Generates additional PageRecommendation entries derived from BrightEdge
 * Share of Citations data: pages with declining share, low absolute share
 * while competitors dominate, or un-tracked pages worth optimizing.
 */
export function buildBrightEdgeRecommendations(
  beCitations: BrightEdgeCitation[],
): PageRecommendation[] {
  const recs: PageRecommendation[] = [];

  const yourPages = beCitations.filter(c => c.brandCategory === 'yours');
  const competitorPages = beCitations.filter(c => c.brandCategory === 'competitors');

  // Build a set of competitor domains that dominate (top 5 by share)
  const topCompetitorDomains = competitorPages
    .sort((a, b) => b.shareOfCitations - a.shareOfCitations)
    .slice(0, 5)
    .map(c => c.url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]);

  for (const page of yourPages) {
    const actions: RecommendedAction[] = [];
    let priorityScore = 35; // base medium

    // Declining share: negative change
    if (page.change < -1) {
      priorityScore += Math.min(20, Math.abs(page.change));
      actions.push({
        type: 'improve_soc_ranking',
        description: `This page's share of AI citations dropped ${Math.abs(page.change).toFixed(1)}% — audit recent content changes and strengthen brand signals to recover visibility.`,
        targetQueries: [page.url],
      });
    }

    // Low absolute share but has citations — room to grow
    if (page.shareOfCitations < 5 && page.citationsCount > 0) {
      actions.push({
        type: 'improve_citation_signal',
        description: `Share of citations is only ${page.shareOfCitations.toFixed(1)}% despite ${page.citationsCount} total citations. Add a direct answer block and clearer brand attribution to increase AI pickup rate.`,
        targetQueries: [page.url],
      });
      actions.push({
        type: 'add_llm_friendly_summary',
        description: `Add a scannable "quick answer" section near the top so AI systems can confidently cite this page over competitor pages that currently hold ${topCompetitorDomains.slice(0,2).join(', ')}.`,
        targetQueries: [page.url],
      });
    }

    // High avg rank (worse position) — cited but buried
    if (page.avgRank > 3) {
      priorityScore += 10;
      actions.push({
        type: 'add_structured_data',
        description: `Average citation rank is ${page.avgRank.toFixed(1)} (lower is better). Structured data markup can help AI systems elevate this page's position in responses.`,
        targetQueries: [page.url],
      });
      actions.push({
        type: 'add_citation_worthy_stat',
        description: `Pages ranked lower in AI citations often lack authoritative, quotable data. Add a specific statistic or original research point to increase citation rank.`,
        targetQueries: [page.url],
      });
    }

    // Not tracked but we see it — flag for internal linking
    if (!page.tracked) {
      actions.push({
        type: 'add_internal_links',
        description: `This page is not tracked in BrightEdge — add it to your tracking and build internal links from high-authority Aceable pages to boost its visibility.`,
        targetQueries: [page.url],
      });
    }

    if (actions.length === 0) continue; // no issues — skip

    const domain = page.url.includes('aceableagent.com') ? 'aceableagent.com' : 'aceable.com';
    const productLine: ProductLine = page.url.includes('aceableagent.com')
      ? 'aceableagent'
      : page.url.includes('defensive-driving')
      ? 'defensive_driving'
      : page.url.includes('drivers-ed')
      ? 'drivers_ed'
      : 'unknown';

    recs.push({
      id: uuid(),
      aceableUrl: page.url,
      aceableDomain: domain as 'aceableagent.com' | 'aceable.com',
      productLine,
      pageTitle: getPageTitle(page.url),
      gapIds: [],
      gaps: [],
      totalMissedVolume: 0,
      topCompetitors: topCompetitorDomains.slice(0, 3),
      recommendedActions: actions,
      priorityScore: Math.min(100, priorityScore),
    });
  }

  return recs.sort((a, b) => b.priorityScore - a.priorityScore);
}
