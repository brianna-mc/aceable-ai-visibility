'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSavedBriefs } from '@/hooks/useSavedBriefs';
import { ProductBadge } from '@/components/shared/ProductBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function BriefsPage() {
  const { briefs, deleteBrief } = useSavedBriefs();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (briefs.length === 0) {
    return (
      <EmptyState
        title="No content briefs yet"
        description="Generate briefs from the Content Gaps page by clicking 'Brief' on any high-priority gap."
        ctaLabel="Find Gaps"
        ctaHref="/gaps"
        icon="◇"
      />
    );
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Briefs</h1>
        <p className="text-sm text-gray-500 mt-1">{briefs.length} saved brief{briefs.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="space-y-3">
        {briefs.map(brief => (
          <div key={brief.id} className="bg-white border rounded-lg px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ProductBadge productLine={brief.productLine} size="sm" />
                <Badge
                  variant="outline"
                  className={
                    brief.status === 'complete' ? 'text-green-700 border-green-200 bg-green-50 text-xs' :
                    brief.status === 'error' ? 'text-red-700 border-red-200 bg-red-50 text-xs' :
                    'text-amber-700 border-amber-200 bg-amber-50 text-xs'
                  }
                >
                  {brief.status === 'generating' ? 'Generating...' : brief.status === 'error' ? 'Error' : 'Complete'}
                </Badge>
              </div>
              <p className="text-sm font-medium text-gray-800 truncate">{brief.query}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {brief.targetUrl.replace('https://www.', '')} · {new Date(brief.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {brief.status === 'complete' && (
                <Button asChild size="sm" variant="outline" className="text-xs">
                  <Link href={`/briefs/${brief.id}`}>View Brief</Link>
                </Button>
              )}
              {confirmDelete === brief.id ? (
                <>
                  <Button size="sm" variant="destructive" className="text-xs" onClick={() => { deleteBrief(brief.id); setConfirmDelete(null); }}>Delete</Button>
                  <Button size="sm" variant="ghost" className="text-xs" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                </>
              ) : (
                <Button size="sm" variant="ghost" className="text-xs text-gray-400" onClick={() => setConfirmDelete(brief.id)}>✕</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
