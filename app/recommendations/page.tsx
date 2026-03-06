'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { sessionStore } from '@/lib/storage/sessionStore';
import type { PageRecommendation, ProductLine, SourceCitation, ContentGap } from '@/types';
import { buildBrightEdgeRecommendations } from '@/lib/analysis/recommendationBuilder';
import { ProductBadge } from '@/components/shared/ProductBadge';
import { PriorityScoreBadge } from '@/components/shared/PriorityScoreBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const ACTION_LABELS: Record<string, string> = {
  add_brand_mention: 'Add brand mention',
  add_comparison_section: 'Add comparison section',
  add_schema_faq: 'Add FAQ schema',
  create_new_section: 'Create new section',
  update_meta_description: 'Update meta description',
  add_citation_worthy_stat: 'Add citation-worthy stat',
  strengthen_brand_presence: 'Strengthen brand presence',
  add_structured_data: 'Add structured data',
  expand_content_depth: 'Expand content depth',
  add_internal_links: 'Add internal links',
  add_llm_friendly_summary: 'Add LLM-friendly summary',
  improve_citation_signal: 'Improve citation signal',
  improve_soc_ranking: 'Improve SOC ranking',
};

export default function RecommendationsPage() {
  const router = useRouter();
  const [recs, setRecs] = useState<PageRecommendation[]>([]);
  const [citations, setCitations] = useState<SourceCitation[]>([]);
  const [productFilter, setProductFilter] = useState<ProductLine | 'all'>('all');

  useEffect(() => {
    if (!sessionStore.hasData() && sessionStore.getSourceCitations().length === 0) {
      router.push('/upload'); return;
    }
    const baseRecs = sessionStore.getRecommendations();
    const beCitations = sessionStore.getBrightEdgeCitations();
    const beRecs = buildBrightEdgeRecommendations(beCitations);

    // Merge: prefer base recs for URLs already covered, append unique BE recs
    const coveredUrls = new Set(baseRecs.map(r => r.aceableUrl));
    const mergedRecs = [
      ...baseRecs,
      ...beRecs.filter(r => !coveredUrls.has(r.aceableUrl)),
    ].sort((a, b) => b.priorityScore - a.priorityScore);

    setRecs(mergedRecs);
    setCitations(sessionStore.getSourceCitations());
  }, [router]);

  function getCitationCount(url: string): number {
    return citations
      .filter(c => c.url === url || c.url.replace(/\/$/, '') === url.replace(/\/$/, ''))
      .reduce((sum, c) => sum + c.promptsCount, 0);
  }

  const filtered = useMemo(() =>
    recs.filter(r => productFilter === 'all' || r.productLine === productFilter),
    [recs, productFilter]
  );

  if (recs.length === 0) {
    return <EmptyState title="No recommendations yet" description="Upload AI search data and we'll map gaps to specific pages." ctaLabel="Upload Data" ctaHref="/upload" icon="◆" />;
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page-Level Recommendations</h1>
          <p className="text-sm text-gray-500 mt-1">
            {recs.length} pages with AI visibility gaps, sorted by priority
          </p>
        </div>
        <Select value={productFilter} onValueChange={v => setProductFilter(v as ProductLine | 'all')}>
          <SelectTrigger className="w-48 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="aceableagent">AceableAgent</SelectItem>
            <SelectItem value="drivers_ed">Drivers Ed</SelectItem>
            <SelectItem value="defensive_driving">Defensive Driving</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filtered.map(rec => (
          <Card key={rec.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <ProductBadge productLine={rec.productLine} size="sm" />
                    <PriorityScoreBadge score={rec.priorityScore} tier={rec.priorityScore >= 65 ? 'high' : rec.priorityScore >= 35 ? 'medium' : 'low'} />
                  </div>
                  <p className="text-sm font-semibold text-gray-900">{rec.pageTitle}</p>
                  <a href={rec.aceableUrl} target="_blank" rel="noreferrer" className="text-xs text-[#DB306A] hover:underline">
                    {rec.aceableUrl.replace('https://www.', '')}
                  </a>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{rec.gaps.length} gaps</p>
                  <p className="text-xs text-gray-400">{rec.totalMissedVolume.toLocaleString()} missed vol/mo</p>
                  {getCitationCount(rec.aceableUrl) > 0 && (
                    <p className="text-xs text-[#DB306A] mt-0.5">
                      ✓ Cited {getCitationCount(rec.aceableUrl)}× in AI
                    </p>
                  )}
                  {citations.length > 0 && getCitationCount(rec.aceableUrl) === 0 && (
                    <p className="text-xs text-red-400 mt-0.5">✗ Not yet cited in AI</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Competitors */}
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">Top competitors cited instead:</p>
                <div className="flex flex-wrap gap-1">
                  {rec.topCompetitors.map(c => (
                    <Badge key={c} variant="outline" className="text-xs text-gray-600">{c}</Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1">Recommended actions:</p>
                <div className="flex flex-wrap gap-1">
                  {rec.recommendedActions.map(a => (
                    <Badge key={a.type} variant="secondary" className="text-xs">
                      {ACTION_LABELS[a.type] ?? a.type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Gap queries */}
              {rec.gaps.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Gap queries:</p>
                  <div className="space-y-1">
                    {rec.gaps.slice(0, 4).map((g: ContentGap) => (
                      <div key={g.id} className="text-xs text-gray-700 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${g.gapType === 'weak_presence' ? 'bg-amber-400' : 'bg-red-400'}`} />
                        <span className="truncate">{g.query}</span>
                        {g.gapType === 'weak_presence' && (
                          <span className="text-amber-500 shrink-0 text-[10px]">weak</span>
                        )}
                        <span className="text-gray-400 shrink-0">{g.searchVolume?.toLocaleString()}</span>
                      </div>
                    ))}
                    {rec.gaps.length > 4 && (
                      <p className="text-xs text-gray-400">+{rec.gaps.length - 4} more gaps</p>
                    )}
                  </div>
                </div>
              )}
              {/* BrightEdge-only rec (no query gaps) */}
              {rec.gaps.length === 0 && (
                <p className="text-xs text-gray-400 italic">Source: BrightEdge Share of Citations data</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
