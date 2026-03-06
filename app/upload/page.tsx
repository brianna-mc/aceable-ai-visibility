'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { NormalizedRow, DataSource, ParseError, SourceCitation, BrightEdgeCitation } from '@/types';
import { detectFormat, detectSemrushSubFormat, detectBrightEdgeSOC } from '@/lib/parsers/detectFormat';
import { parseCsvString, readFileAsText } from '@/lib/parsers/csvUtils';
import { parseSemrushCsv } from '@/lib/parsers/parseSemrush';
import { parseSemrushSourcesCsv } from '@/lib/parsers/parseSemrushSources';
import { parseBrightEdgeSOCCsv } from '@/lib/parsers/parseBrightEdgeSOC';
import { parseBrightEdgeCsv } from '@/lib/parsers/parseBrightEdge';
import { useDataStore } from '@/hooks/useDataStore';
import { sessionStore } from '@/lib/storage/sessionStore';
import { localStore } from '@/lib/storage/localStore';
import { DropZone } from '@/components/upload/DropZone';
import { FormatBanner } from '@/components/upload/FormatBanner';
import { ParsePreviewTable } from '@/components/upload/ParsePreviewTable';
import { Button } from '@/components/ui/button';
import { v4 as uuid } from 'uuid';

type Step = 'idle' | 'detecting' | 'preview' | 'sources_preview' | 'brightedge_preview' | 'processing';

export default function UploadPage() {
  const router = useRouter();
  const { loadUploadedData } = useDataStore();
  const [step, setStep] = useState<Step>('idle');
  const [fileName, setFileName] = useState('');
  const [detectedSource, setDetectedSource] = useState<DataSource | null>(null);
  const [pendingRows, setPendingRows] = useState<NormalizedRow[]>([]);
  const [pendingErrors, setPendingErrors] = useState<ParseError[]>([]);
  const [pendingCitations, setPendingCitations] = useState<SourceCitation[]>([]);
  const [pendingBECitations, setPendingBECitations] = useState<BrightEdgeCitation[]>([]);
  const [rawCsv, setRawCsv] = useState('');
  const [uploadHistory, setUploadHistory] = useState<ReturnType<typeof localStore.getUploadHistory>>([]);

  useEffect(() => {
    setUploadHistory(localStore.getUploadHistory());
  }, [step]); // refresh after each upload

  const processFile = useCallback(async (csvText: string, source: DataSource) => {
    const parser = source === 'semrush' ? parseSemrushCsv : parseBrightEdgeCsv;
    const { rows, errors } = parser(csvText);
    setPendingRows(rows);
    setPendingErrors(errors);
    setDetectedSource(source);
    setStep('preview');
  }, []);

  const handleFileAccepted = useCallback(async (file: File) => {
    setFileName(file.name);
    setStep('detecting');

    const text = await readFileAsText(file);
    setRawCsv(text);

    const { headers } = parseCsvString(text);

    // BrightEdge AI Catalyst SOC
    if (detectBrightEdgeSOC(headers)) {
      const { citations, errors } = parseBrightEdgeSOCCsv(text);
      setPendingBECitations(citations);
      setPendingErrors(errors);
      setDetectedSource('brightedge');
      setStep('brightedge_preview');
      return;
    }

    const subFormat = detectSemrushSubFormat(headers);

    // Semrush Sources: citation counts only
    if (subFormat === 'sources') {
      const { citations, errors } = parseSemrushSourcesCsv(text);
      setPendingCitations(citations);
      setPendingErrors(errors);
      setDetectedSource('semrush');
      setStep('sources_preview');
      return;
    }

    const source = detectFormat(headers);
    if (source) {
      await processFile(text, source);
    } else {
      setDetectedSource(null);
      setStep('preview');
    }
  }, [processFile]);

  const handleFormatOverride = useCallback(async (source: DataSource) => {
    await processFile(rawCsv, source);
  }, [rawCsv, processFile]);

  const handleConfirmImport = useCallback(() => {
    setStep('processing');
    loadUploadedData(pendingRows, pendingErrors, fileName, detectedSource ?? 'semrush');
    router.push('/dashboard');
  }, [loadUploadedData, pendingRows, pendingErrors, fileName, detectedSource, router]);

  const handleConfirmSources = useCallback(() => {
    // Merge with any existing citations (keep all, deduplicate by url+country)
    const existing = sessionStore.getSourceCitations();
    const merged = [...pendingCitations];
    for (const e of existing) {
      if (!merged.some(c => c.url === e.url && c.country === e.country)) {
        merged.push(e);
      }
    }
    sessionStore.saveSourceCitations(merged);
    localStore.addUploadHistoryEntry({
      id: uuid(),
      fileName,
      source: 'semrush',
      uploadedAt: new Date().toISOString(),
      rowCount: pendingCitations.length,
    });
    router.push('/recommendations');
  }, [pendingCitations, fileName, router]);

  const handleConfirmBrightEdge = useCallback(() => {
    const existing = sessionStore.getBrightEdgeCitations();
    const merged = [...pendingBECitations];
    for (const e of existing) {
      if (!merged.some(c => c.url === e.url && c.brandCategory === e.brandCategory)) {
        merged.push(e);
      }
    }
    sessionStore.saveBrightEdgeCitations(merged);
    localStore.addUploadHistoryEntry({
      id: uuid(),
      fileName,
      source: 'brightedge',
      uploadedAt: new Date().toISOString(),
      rowCount: pendingBECitations.length,
    });
    router.push('/dashboard');
  }, [pendingBECitations, fileName, router]);

  const handleCancel = useCallback(() => {
    setStep('idle');
    setFileName('');
    setPendingRows([]);
    setPendingErrors([]);
    setPendingCitations([]);
    setPendingBECitations([]);
    setRawCsv('');
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload AI Search Data</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Drop any Semrush AI Toolkit export below — Prompt Report, Gap Prompts, Prompts, or Sources.
        </p>
      </div>

      <div className="space-y-4">
        {step === 'idle' || step === 'detecting' ? (
          <DropZone onFileAccepted={handleFileAccepted} isProcessing={step === 'detecting'} />
        ) : null}

        {/* Sources preview */}
        {step === 'sources_preview' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">Detected: Semrush Sources Export</p>
              <p className="text-xs text-green-700">{fileName} · {pendingCitations.length} cited URLs</p>
            </div>
            <div className="bg-white border rounded-lg overflow-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">URL</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Country</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Times Cited</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCitations.slice(0, 10).map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-2 text-gray-700 max-w-[300px] truncate">{c.url.replace('https://www.', '')}</td>
                      <td className="px-4 py-2 text-gray-500 uppercase">{c.country}</td>
                      <td className="px-4 py-2 font-medium text-[#DB306A]">{c.promptsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingCitations.length > 10 && (
                <p className="text-xs text-gray-400 text-center py-2">Showing 10 of {pendingCitations.length} URLs</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" onClick={handleConfirmSources} className="bg-[#DB306A] hover:bg-[#C22660] text-white">
                Import {pendingCitations.length} Sources
              </Button>
            </div>
          </div>
        )}

        {/* BrightEdge SOC preview */}
        {step === 'brightedge_preview' && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-800">Detected: BrightEdge AI Catalyst — Share of Citations</p>
              <p className="text-xs text-green-700">{fileName} · {pendingBECitations.length} URLs</p>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {(['yours', 'competitors', 'others'] as const).map(cat => {
                const items = pendingBECitations.filter(c => c.brandCategory === cat);
                const totalShare = items.reduce((s, c) => s + c.shareOfCitations, 0);
                const labels = { yours: 'Your Brand', competitors: 'Competitors', others: 'Others' };
                const colors = { yours: 'text-[#DB306A]', competitors: 'text-red-500', others: 'text-gray-500' };
                return (
                  <div key={cat} className="bg-white border rounded-lg p-3 text-center">
                    <p className={`text-lg font-bold ${colors[cat]}`}>{totalShare.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">{labels[cat]}</p>
                    <p className="text-xs text-gray-400">{items.length} URLs</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border rounded-lg overflow-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">URL</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Category</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Share %</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Change</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Citations</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-600">Avg Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingBECitations.slice(0, 12).map((c, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-2 text-gray-700 max-w-[220px] truncate">{c.url}</td>
                      <td className="px-4 py-2">
                        <span className={`capitalize font-medium ${c.brandCategory === 'yours' ? 'text-[#DB306A]' : c.brandCategory === 'competitors' ? 'text-red-500' : 'text-gray-400'}`}>
                          {c.brandCategory}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-medium">{c.shareOfCitations.toFixed(1)}%</td>
                      <td className={`px-4 py-2 ${c.change > 0 ? 'text-green-600' : c.change < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {c.change > 0 ? '+' : ''}{c.change.toFixed(1)}%
                      </td>
                      <td className="px-4 py-2">{c.citationsCount}</td>
                      <td className="px-4 py-2">{c.avgRank.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {pendingBECitations.length > 12 && (
                <p className="text-xs text-gray-400 text-center py-2">Showing 12 of {pendingBECitations.length} URLs</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button size="sm" onClick={handleConfirmBrightEdge} className="bg-[#DB306A] hover:bg-[#C22660] text-white">
                Import {pendingBECitations.length} Citations
              </Button>
            </div>
          </div>
        )}

        {/* Query-based file preview */}
        {(step === 'preview' || step === 'processing') && (
          <div className="space-y-4">
            <FormatBanner
              detected={detectedSource}
              fileName={fileName}
              onOverride={handleFormatOverride}
            />
            {pendingRows.length > 0 && (
              <ParsePreviewTable
                rows={pendingRows}
                parseErrors={pendingErrors}
                onConfirm={handleConfirmImport}
                onCancel={handleCancel}
              />
            )}
            {pendingRows.length === 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium">No valid rows found.</p>
                <p className="text-xs text-red-600 mt-1">
                  Make sure your CSV has the required fields and isn&apos;t empty.
                </p>
                <button onClick={handleCancel} className="mt-3 text-xs text-red-700 underline">Try another file</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload history */}
      {uploadHistory.length > 0 && step === 'idle' && (
        <div className="mt-10">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Recent Uploads</h2>
          <div className="divide-y border rounded-lg bg-white">
            {uploadHistory.slice(0, 5).map(entry => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{entry.fileName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.uploadedAt).toLocaleDateString()} · {entry.rowCount} rows · {entry.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Format guide */}
      <div className="mt-10 grid grid-cols-2 gap-4">
        {[
          { label: 'Prompt Report', desc: 'AI Toolkit → Prompts → Export', fields: 'Prompt, LLM Summary, Mentions - Your Brand' },
          { label: 'Gap Prompts', desc: 'AI Toolkit → Gaps → Export', fields: 'prompt, brief_response, gap_mentions' },
          { label: 'Prompts General', desc: 'AI Toolkit → Prompts → Export', fields: 'prompt, brief_response, topic_intents' },
          { label: 'Sources', desc: 'AI Toolkit → Sources → Export', fields: 'url, country, prompts_count' },
          { label: 'BrightEdge AI Catalyst', desc: 'AI Catalyst → Share of Citations → Export', fields: 'Page URL, Brand Category, Share of Citations, Citations Count' },
        ].map(f => (
          <div key={f.label} className="bg-white border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">{f.label}</h3>
            <p className="text-xs text-gray-500 mb-1">{f.desc}</p>
            <p className="text-xs text-gray-400">{f.fields}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
