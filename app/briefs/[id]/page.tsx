'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { localStore } from '@/lib/storage/localStore';
import type { ContentBrief } from '@/types';
import { ProductBadge } from '@/components/shared/ProductBadge';
import { Button } from '@/components/ui/button';

export default function BriefViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const b = localStore.getBriefById(id);
    if (!b) { router.push('/briefs'); return; }
    setBrief(b);
  }, [id, router]);

  if (!brief) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(brief.briefMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([brief.briefMarkdown], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `brief-${brief.query.slice(0, 40).replace(/\s+/g, '-').toLowerCase()}.md`;
    a.click();
  };

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link href="/briefs" className="text-xs text-[#DB306A] hover:underline mb-2 block">← Back to Briefs</Link>
          <div className="flex items-center gap-2 mb-1">
            <ProductBadge productLine={brief.productLine} />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{brief.query}</h1>
          <p className="text-xs text-gray-400 mt-1">
            <a href={brief.targetUrl} target="_blank" rel="noreferrer" className="hover:underline text-[#DB306A]">
              {brief.targetUrl.replace('https://www.', '')}
            </a>
            {' · '}{new Date(brief.createdAt).toLocaleDateString()}
            {brief.tokenCount ? ` · ${brief.tokenCount.toLocaleString()} tokens` : ''}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Copy Markdown'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            Download .md
          </Button>
        </div>
      </div>

      {/* Brief content */}
      {brief.status === 'error' ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-medium">Brief generation failed.</p>
          <p className="text-sm text-red-600 mt-1">Check that your ANTHROPIC_API_KEY is configured and try again from the Gaps page.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg p-8 prose prose-sm max-w-none prose-headings:text-gray-900 prose-h1:text-xl prose-h2:text-base prose-h3:text-sm prose-p:text-gray-700 prose-li:text-gray-700">
          <MarkdownRenderer content={brief.briefMarkdown} />
        </div>
      )}
    </div>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  // Simple markdown renderer — converts to basic HTML without a library dependency
  const html = content
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="text-base font-semibold mt-5 mb-2 text-gray-800">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-semibold mt-4 mb-1 text-gray-700">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#DB306A] pl-4 py-1 my-2 text-gray-600 italic text-sm">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-gray-700 text-sm">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-gray-700 text-sm">$2</li>')
    .replace(/\n\n/g, '</p><p class="my-2 text-sm text-gray-700">')
    .replace(/^([^<\n].+)$/gm, '<p class="my-2 text-sm text-gray-700">$1</p>');

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
