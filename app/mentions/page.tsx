'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { sessionStore } from '@/lib/storage/sessionStore';
import type { BrandMention, MentionStatus, ProductLine } from '@/types';
import { ProductBadge } from '@/components/shared/ProductBadge';
import { MentionStatusBadge } from '@/components/shared/MentionStatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';

export default function MentionsPage() {
  const router = useRouter();
  const [mentions, setMentions] = useState<BrandMention[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<MentionStatus | 'all'>('all');
  const [productFilter, setProductFilter] = useState<ProductLine | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionStore.hasData()) { router.push('/upload'); return; }
    setMentions(sessionStore.getMentions());
  }, [router]);

  const filtered = useMemo(() => mentions.filter(m => {
    if (statusFilter !== 'all' && m.mentionStatus !== statusFilter) return false;
    if (productFilter !== 'all' && m.productLine !== productFilter) return false;
    if (search && !m.query.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [mentions, statusFilter, productFilter, search]);

  if (mentions.length === 0) {
    return <EmptyState title="No mention data yet" description="Upload a CSV to start tracking brand mentions." ctaLabel="Upload Data" ctaHref="/upload" icon="🔍" />;
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Brand Mention Tracker</h1>
        <p className="text-sm text-gray-500 mt-1">{mentions.length} queries analyzed · {mentions.filter(m => m.aceable.mentioned).length} Aceable mentions</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <Input
          placeholder="Search queries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-56 text-sm"
        />
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as MentionStatus | 'all')}>
          <SelectTrigger className="w-44 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="mentioned">Mentioned</SelectItem>
            <SelectItem value="competitor_only">Gap (Competitor Only)</SelectItem>
            <SelectItem value="not_mentioned">Not Mentioned</SelectItem>
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
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Competitors Found</TableHead>
              <TableHead className="text-xs">Volume</TableHead>
              <TableHead className="text-xs">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(m => (
              <>
                <TableRow
                  key={m.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                >
                  <TableCell className="text-xs font-medium max-w-[280px]">
                    <span className="truncate block">{m.query}</span>
                  </TableCell>
                  <TableCell><ProductBadge productLine={m.productLine} size="sm" /></TableCell>
                  <TableCell><MentionStatusBadge status={m.mentionStatus} /></TableCell>
                  <TableCell className="text-xs text-gray-600">
                    {m.competitors.filter(c => c.mentioned).map(c => c.competitorName).join(', ') || '—'}
                  </TableCell>
                  <TableCell className="text-xs">{m.searchVolume?.toLocaleString() ?? '—'}</TableCell>
                  <TableCell className="text-xs text-gray-400 capitalize">{m.source}</TableCell>
                </TableRow>
                {expanded === m.id && (
                  <TableRow key={`${m.id}-exp`} className="bg-gray-50">
                    <TableCell colSpan={6} className="text-xs text-gray-700 py-3 px-4">
                      {m.aceable.contextSnippet ? (
                        <div className="mb-2">
                          <span className="font-medium text-green-700">Aceable match: </span>
                          {m.aceable.contextSnippet}
                        </div>
                      ) : null}
                      <div className="text-gray-500 line-clamp-4">{m.aiResponseText || 'No AI response text available.'}</div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
