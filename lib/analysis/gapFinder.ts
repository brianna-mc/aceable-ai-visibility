import { v4 as uuid } from 'uuid';
import type { BrandMention, ContentGap } from '@/types';
import { classifyQueryIntent } from '@/lib/constants/productLines';
import { mapToAceablePage } from './pageMapper';

function scorePriority(m: BrandMention): number {
  // Search volume: 40 pts max
  const volumeScore = Math.min(40, ((m.searchVolume ?? 0) / 10000) * 40);

  // Competitor count: 10 pts each, 30 pts max
  const competitorCount = m.competitors.filter(c => c.mentioned).length;
  const competitorScore = Math.min(30, competitorCount * 10);

  // Query intent: 30 pts max
  const intentScoreMap: Record<string, number> = {
    transactional: 30,
    commercial: 25,
    navigational: 20,
    informational: 15,
    unknown: 10,
  };
  const intent = classifyQueryIntent(m.query);
  const intentScore = intentScoreMap[intent] ?? 10;

  return Math.round(volumeScore + competitorScore + intentScore);
}

function getTier(score: number): 'high' | 'medium' | 'low' {
  if (score >= 65) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

export function findGaps(mentions: BrandMention[]): ContentGap[] {
  const gaps: ContentGap[] = [];

  for (const m of mentions) {
    const hasCompetitor = m.competitors.some(c => c.mentioned);
    const aceableAbsent = !m.aceable.mentioned;
    const aceableWeak = m.aceable.mentioned && m.aceable.matchType === 'fuzzy';

    // Hard gap: competitor present AND Aceable entirely absent
    if (hasCompetitor && aceableAbsent) {
      const priorityScore = scorePriority(m);
      gaps.push({
        id: uuid(),
        query: m.query,
        productLine: m.productLine,
        source: m.source,
        searchVolume: m.searchVolume,
        queryIntent: classifyQueryIntent(m.query),
        competitorsPresent: m.competitors.filter(c => c.mentioned).map(c => c.competitorName),
        competitorDomains: m.competitors.filter(c => c.mentioned).map(c => c.domain),
        aceable: { mentioned: false, citedUrl: null },
        priorityScore,
        priorityTier: getTier(priorityScore),
        suggestedAceableUrl: mapToAceablePage(m.query, m.productLine),
        uploadedAt: m.uploadedAt,
        rowId: m.rowId,
        gapType: 'gap',
      });
      continue;
    }

    // Weak presence: Aceable matched via fuzzy only AND competitor also present
    // Lower priority score since Aceable is technically present
    if (aceableWeak && hasCompetitor) {
      const rawScore = scorePriority(m);
      // Discount weak-presence gaps so they sort below hard gaps
      const priorityScore = Math.max(10, Math.round(rawScore * 0.65));
      gaps.push({
        id: uuid(),
        query: m.query,
        productLine: m.productLine,
        source: m.source,
        searchVolume: m.searchVolume,
        queryIntent: classifyQueryIntent(m.query),
        competitorsPresent: m.competitors.filter(c => c.mentioned).map(c => c.competitorName),
        competitorDomains: m.competitors.filter(c => c.mentioned).map(c => c.domain),
        aceable: { mentioned: true, citedUrl: null },
        priorityScore,
        priorityTier: getTier(priorityScore),
        suggestedAceableUrl: mapToAceablePage(m.query, m.productLine),
        uploadedAt: m.uploadedAt,
        rowId: m.rowId,
        gapType: 'weak_presence',
      });
    }
  }

  return gaps.sort((a, b) => b.priorityScore - a.priorityScore);
}
