'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sessionStore } from '@/lib/storage/sessionStore';
import type { ContentGap, ProductLine } from '@/types';
import { ProductBadge } from '@/components/shared/ProductBadge';
import { PriorityScoreBadge } from '@/components/shared/PriorityScoreBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { BriefGeneratorModal } from '@/components/briefs/BriefGeneratorModal';
import { useSavedBriefs } from '@/hooks/useSavedBriefs';

export default function GapsPage() {
  const router = useRouter();
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [productFilter, setProductFilter] = useState<ProductLine | 'all'>('all');
  const [briefTarget, setBriefTarget] = useState<ContentGap | null>(null);
  const { generateBrief, generating } = useSavedBriefs();

  useEffect(() => {
    if (!sessionStore.hasData()) { router.push('/upload'); return; }
    setGaps(sessionStore.getGaps());
  }, [router]);

  const filtered = useMemo(() => gaps.filter(g => {
    if (tierFilter !== 'all' && g.priorityTier !== tierFilter) return false;
    if (productFilter !== 'all' && g.productLine !== productFilter) return false;
    if (search && !g.query.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [gaps, tierFilter, productFilter, search]);

  const handleBriefGenerated = useCallback(async (config: Parameters<typeof generateBrief>[1]) => {
    if (!briefTarget) return;
    const brief = await generateBrief(briefTarget, config);
    setBriefTarget(null);
    router.push(`/briefs/${brief.id}`);
  }, [briefTarget, generateBrief, router]);

  if (gaps.length === 0) {
    return <EmptyState title="No gaps found" description="Upload AI search data to find content gap opportunities." ctaLabel="Upload Data" ctaHref="/upload" icon="◈" />;
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Gap Finder</h1>
        <p className="text-sm text-gray-500 mt-1">
          {gaps.length} gaps · queries where competitors are cited in AI but Aceable is not
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          placeholder="Search queries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-56 text-sm"
        />
        <Select value={tierFilter} onValueChange={v => setTierFilter(v as typeof tierFilter)}>
          <SelectTrigger className="w-36 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={productFilter} onValueChange={v => setProductFilter(v as ProductLine | 'all')}>
          <SelectTrigger className="w-48 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="aceableagent">AceableAgent</SelectItem>
            <SelectItem value="drivers_ed">Drivers Ed</SelectItem>
            <SelectItem value="defensive_driving">Defensive Driving</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-400 self-center">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-white overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Query</TableHead>
              <TableHead className="text-xs">Product</TableHead>
              <TableHead className="text-xs">Priority</TableHead>
              <TableHead className="text-xs">Competitors Cited</TableHead>
              <TableHead className="text-xs">Volume</TableHead>
              <TableHead className="text-xs">Intent</TableHead>
              <TableHead className="text-xs">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(gap => (
              <TableRow key={gap.id}>
                <TableCell className="text-xs font-medium max-w-[240px]">
                  <div className="truncate">{gap.query}</div>
                  {gap.suggestedAceableUrl && (
                    <a href={gap.suggestedAceableUrl} target="_blank" rel="noreferrer" className="text-[10px] text-[#DB306A] hover:underline truncate block">
                      {gap.suggestedAceableUrl.replace('https://www.', '')}
                    </a>
                  )}
                </TableCell>
                <TableCell><ProductBadge productLine={gap.productLine} size="sm" /></TableCell>
                <TableCell><PriorityScoreBadge score={gap.priorityScore} tier={gap.priorityTier} /></TableCell>
                <TableCell className="text-xs text-gray-600 max-w-[180px]">
                  <span className="truncate block">{gap.competitorsPresent.join(', ')}</span>
                </TableCell>
                <TableCell className="text-xs">{gap.searchVolume?.toLocaleString() ?? '—'}</TableCell>
                <TableCell className="text-xs capitalize">{gap.queryIntent}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    className="text-xs h-7 bg-[#DB306A] hover:bg-[#C22660] text-white"
                    onClick={() => setBriefTarget(gap)}
                    disabled={!!generating}
                  >
                    Brief
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {briefTarget && (
        <BriefGeneratorModal
          gap={briefTarget}
          isOpen={!!briefTarget}
          isGenerating={!!generating}
          onClose={() => setBriefTarget(null)}
          onGenerate={handleBriefGenerated}
        />
      )}
    </div>
  );
}
