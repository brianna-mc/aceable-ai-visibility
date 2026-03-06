'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { sessionStore } from '@/lib/storage/sessionStore';
import type { BrandMention, ContentGap, PageRecommendation } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PriorityScoreBadge } from '@/components/shared/PriorityScoreBadge';
import { ProductBadge } from '@/components/shared/ProductBadge';
import { MentionStatusBadge } from '@/components/shared/MentionStatusBadge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { PRODUCT_LINE_LABELS, PRODUCT_LINE_COLORS } from '@/lib/constants/productLines';
import type { ProductLine, BrightEdgeCitation } from '@/types';

const PRODUCT_LINES: ProductLine[] = ['aceableagent', 'drivers_ed', 'defensive_driving'];

export default function DashboardPage() {
  const router = useRouter();
  const [mentions, setMentions] = useState<BrandMention[]>([]);
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [recs, setRecs] = useState<PageRecommendation[]>([]);
  const [meta, setMeta] = useState(sessionStore.getMeta());
  const [beCitations, setBeCitations] = useState<BrightEdgeCitation[]>([]);

  useEffect(() => {
    if (!sessionStore.hasData()) {
      router.push('/upload');
      return;
    }
    setMentions(sessionStore.getMentions());
    setGaps(sessionStore.getGaps());
    setRecs(sessionStore.getRecommendations());
    setMeta(sessionStore.getMeta());
    setBeCitations(sessionStore.getBrightEdgeCitations());
  }, [router]);

  const mentionRate = mentions.length > 0
    ? Math.round((mentions.filter(m => m.aceable.mentioned).length / mentions.length) * 100)
    : 0;

  const chartData = PRODUCT_LINES.map(pl => {
    const plMentions = mentions.filter(m => m.productLine === pl);
    const mentioned = plMentions.filter(m => m.aceable.mentioned).length;
    const gapCount = gaps.filter(g => g.productLine === pl).length;
    return {
      name: PRODUCT_LINE_LABELS[pl],
      Mentioned: mentioned,
      Gaps: gapCount,
      color: PRODUCT_LINE_COLORS[pl],
    };
  });

  const topGaps = gaps.slice(0, 5);

  // BrightEdge SOC derived data
  const beYours = beCitations.filter(c => c.brandCategory === 'yours');
  const beCompetitors = beCitations.filter(c => c.brandCategory === 'competitors');
  const beOthers = beCitations.filter(c => c.brandCategory === 'others');
  const yourShare = beYours.reduce((s, c) => s + c.shareOfCitations, 0);
  const competitorShare = beCompetitors.reduce((s, c) => s + c.shareOfCitations, 0);
  const othersShare = beOthers.reduce((s, c) => s + c.shareOfCitations, 0);
  const bePieData = [
    { name: 'Your Brand', value: parseFloat(yourShare.toFixed(1)), fill: '#DB306A' },
    { name: 'Competitors', value: parseFloat(competitorShare.toFixed(1)), fill: '#EF4444' },
    { name: 'Others', value: parseFloat(othersShare.toFixed(1)), fill: '#9CA3AF' },
  ];
  const topBeUrls = beCitations.slice(0, 10).map(c => ({
    url: c.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').slice(0, 40),
    share: parseFloat(c.shareOfCitations.toFixed(1)),
    fill: c.brandCategory === 'yours' ? '#DB306A' : c.brandCategory === 'competitors' ? '#EF4444' : '#9CA3AF',
  }));

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LLM Visibility Dashboard</h1>
          {meta && (
            <p className="text-sm text-gray-400 mt-0.5">
              Last upload: {meta.fileName} · {meta.rowCount} rows · {new Date(meta.uploadedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/upload">Upload New Data</Link>
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Queries Tracked" value={mentions.length} />
        <KpiCard label="Aceable Mention Rate" value={`${mentionRate}%`} variant={mentionRate > 30 ? 'success' : 'warning'} />
        <KpiCard label="Content Gaps" value={gaps.length} variant={gaps.length > 0 ? 'warning' : 'success'} />
        <KpiCard label="Pages to Optimize" value={recs.length} />
      </div>

      {/* Charts + Top Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Mention vs Gap chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Mentions vs Gaps by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barGap={4}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Mentioned" fill="#DB306A" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Gaps" fill="#EF4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 5 Gaps */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Top Priority Gaps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topGaps.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No gaps found — great work!</p>
            )}
            {topGaps.map(gap => (
              <div key={gap.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-xs font-medium text-gray-800 truncate">{gap.query}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ProductBadge productLine={gap.productLine} size="sm" />
                    <span className="text-xs text-gray-400">{gap.competitorsPresent.slice(0,2).join(', ')}</span>
                  </div>
                </div>
                <PriorityScoreBadge score={gap.priorityScore} tier={gap.priorityTier} />
              </div>
            ))}
            {gaps.length > 5 && (
              <Link href="/gaps" className="text-xs text-[#DB306A] hover:underline block pt-1">
                View all {gaps.length} gaps →
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BrightEdge Share of Citations */}
      {beCitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            BrightEdge — Share of Citations
          </h2>
          {/* Summary tiles */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Your Brand</p>
                <p className="text-2xl font-bold text-[#DB306A]">{yourShare.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">{beYours.length} URLs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Competitors</p>
                <p className="text-2xl font-bold text-red-500">{competitorShare.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">{beCompetitors.length} URLs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-xs text-gray-500 mb-1">Others</p>
                <p className="text-2xl font-bold text-gray-400">{othersShare.toFixed(1)}%</p>
                <p className="text-xs text-gray-400">{beOthers.length} URLs</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Citation Share Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={bePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={false}
                    >
                      {bePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `${v}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top URLs bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Top Cited URLs</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={topBeUrls} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 'dataMax']} />
                    <YAxis type="category" dataKey="url" tick={{ fontSize: 9 }} width={140} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="share" radius={[0, 3, 3, 0]}>
                      {topBeUrls.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recent Mentions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Recent Mention Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mentions.slice(0, 8).map(m => (
              <div key={m.id} className="flex items-center gap-3 py-1.5 border-b last:border-0">
                <MentionStatusBadge status={m.mentionStatus} />
                <p className="text-xs text-gray-700 flex-1 truncate">{m.query}</p>
                <ProductBadge productLine={m.productLine} size="sm" />
              </div>
            ))}
          </div>
          {mentions.length > 8 && (
            <Link href="/mentions" className="text-xs text-[#DB306A] hover:underline block mt-3">
              View all {mentions.length} mentions →
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, variant = 'default' }: { label: string; value: string | number; variant?: 'default' | 'success' | 'warning' }) {
  const valueColor = variant === 'success' ? 'text-green-600' : variant === 'warning' ? 'text-amber-600' : 'text-gray-900';
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
