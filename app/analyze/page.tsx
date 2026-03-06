'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import type { RawPageSignals, ScoredItem, TradeoffAction, ImpactLevel, PageSpeedSignals, GscPageEntry, PowerBiPageEntry, DataPeriodMeta } from '@/types';
import { scorePageSEO, scoreLLMVisibility, getScoreLabel } from '@/lib/analysis/pageAnalyzer';
import { getRelevantActions, getTradeoffWarnings } from '@/lib/analysis/tradeoffMatrix';
import { parseGscCsv } from '@/lib/parsers/parseGsc';
import { parsePowerBiCsv, type PowerBiColumnMap } from '@/lib/parsers/parsePowerBi';
import { xlsxToCsv } from '@/lib/parsers/xlsxUtils';
import { localStore } from '@/lib/storage/localStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const IMPACT_CONFIG: Record<ImpactLevel, { label: string; color: string; bg: string }> = {
  strong_positive: { label: '✅ Strong', color: 'text-green-700', bg: 'bg-green-50' },
  positive:        { label: '✅ Positive', color: 'text-teal-700', bg: 'bg-teal-50' },
  neutral:         { label: '⚪ Neutral', color: 'text-gray-500', bg: 'bg-gray-50' },
  caution:         { label: '⚠️ Caution', color: 'text-amber-700', bg: 'bg-amber-50' },
  negative:        { label: '❌ Negative', color: 'text-red-700', bg: 'bg-red-50' },
};

const STATUS_ICON: Record<ScoredItem['status'], string> = {
  pass: '✅',
  warn: '⚠️',
  fail: '❌',
};

// Core Web Vitals thresholds
const CWV = {
  lcp:  { good: 2500, poor: 4000, unit: 'ms', label: 'LCP' },
  cls:  { good: 0.1,  poor: 0.25, unit: '',   label: 'CLS' },
  inp:  { good: 200,  poor: 500,  unit: 'ms', label: 'INP' },
  ttfb: { good: 800,  poor: 1800, unit: 'ms', label: 'TTFB' },
};

function cwvStatus(key: keyof typeof CWV, val: number | null): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (val === null) return 'unknown';
  const t = CWV[key];
  if (val <= t.good) return 'good';
  if (val <= t.poor) return 'needs-improvement';
  return 'poor';
}

function cwvColor(status: ReturnType<typeof cwvStatus>) {
  return status === 'good' ? 'text-green-600' : status === 'needs-improvement' ? 'text-amber-600' : status === 'poor' ? 'text-red-600' : 'text-gray-400';
}

function formatCwv(key: keyof typeof CWV, val: number | null): string {
  if (val === null) return '—';
  if (key === 'cls') return val.toFixed(3);
  return `${Math.round(val)}ms`;
}

export default function AnalyzePage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    signals: RawPageSignals;
    plainText: string;
    pageSpeed: PageSpeedSignals | null;
    pageSpeedError: string | null;
    seoScore: number;
    llmScore: number;
    seoItems: ScoredItem[];
    llmItems: ScoredItem[];
    actions: TradeoffAction[];
    warnings: string[];
    gscEntry: GscPageEntry | null;
    pbiEntry: PowerBiPageEntry | null;
  } | null>(null);

  // GSC upload
  const gscInputRef = useRef<HTMLInputElement>(null);
  const [gscCount, setGscCount] = useState(0);
  const [gscMeta, setGscMeta] = useState<DataPeriodMeta | null>(null);
  const [gscPeriodInput, setGscPeriodInput] = useState('');

  // Power BI upload
  const pbiInputRef = useRef<HTMLInputElement>(null);
  const [pbiCount, setPbiCount] = useState(0);
  const [pbiColMap, setPbiColMap] = useState<PowerBiColumnMap | null>(null);
  const [pbiLastParsedCount, setPbiLastParsedCount] = useState<number | null>(null);
  const [pbiMeta, setPbiMeta] = useState<DataPeriodMeta | null>(null);
  const [pbiPeriodInput, setPbiPeriodInput] = useState('');

  // Claude deep-dive
  const [deepLoading, setDeepLoading] = useState(false);
  const [deepMarkdown, setDeepMarkdown] = useState('');
  const [deepError, setDeepError] = useState('');

  // Load upload status on mount
  useEffect(() => {
    setGscCount(localStore.getGscData().length);
    setPbiCount(localStore.getPowerBiData().length);
    const gm = localStore.getGscMeta();
    if (gm) { setGscMeta(gm); setGscPeriodInput(gm.label); }
    const pm = localStore.getPbiMeta();
    if (pm) { setPbiMeta(pm); setPbiPeriodInput(pm.label); }
  }, []);

  async function handleAnalyze() {
    const trimmed = url.trim();
    if (!trimmed.startsWith('http')) {
      setError('Please enter a full URL starting with https://');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    setDeepMarkdown('');
    setDeepError('');

    try {
      const res = await fetch('/api/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json() as { signals: RawPageSignals; pageSpeed: PageSpeedSignals | null; pageSpeedError: string | null; plainText: string; error?: string };

      if (data.signals.fetchError) {
        setError(`Could not fetch page: ${data.signals.fetchError}`);
        setLoading(false);
        return;
      }

      const { score: seoScore, items: seoItems } = scorePageSEO(data.signals);
      const { score: llmScore, items: llmItems } = scoreLLMVisibility(data.signals);
      const actions = getRelevantActions(data.signals, seoItems, llmItems);
      const warnings = getTradeoffWarnings(actions);
      const gscEntry = localStore.getGscEntry(trimmed);
      const pbiEntry = localStore.getPowerBiEntry(trimmed);

      setResult({
        signals: data.signals,
        plainText: data.plainText ?? '',
        pageSpeed: data.pageSpeed ?? null,
        pageSpeedError: data.pageSpeedError ?? null,
        seoScore, llmScore, seoItems, llmItems, actions, warnings,
        gscEntry, pbiEntry,
      });
    } catch {
      setError('Unexpected error — please try again');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeepDive() {
    if (!result) return;
    setDeepLoading(true);
    setDeepMarkdown('');
    setDeepError('');
    try {
      const res = await fetch('/api/deep-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.signals.url,
          pageText: result.plainText,
          seoScore: result.seoScore,
          llmScore: result.llmScore,
          title: result.signals.title,
          gscEntry: result.gscEntry,
          gscMeta,
          powerBiEntry: result.pbiEntry,
          pbiMeta,
        }),
      });
      const data = await res.json() as { markdown?: string; error?: string };
      if (data.error) throw new Error(data.error);
      setDeepMarkdown(data.markdown ?? '');
    } catch (e) {
      setDeepError(e instanceof Error ? e.message : 'Deep analysis failed');
    } finally {
      setDeepLoading(false);
    }
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  async function fileToCsv(file: File): Promise<string> {
    const isXlsx = /\.(xlsx|xls|xlsm)$/i.test(file.name);
    if (isXlsx) {
      const buf = await readFileAsArrayBuffer(file);
      return xlsxToCsv(buf);
    }
    return readFileAsText(file);
  }

  const handleGscUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    let failed = 0;
    for (const file of files) {
      try {
        const csv = await fileToCsv(file);
        const entries = parseGscCsv(csv);
        localStore.mergeGscData(entries);
      } catch {
        failed++;
      }
    }
    const total = localStore.getGscData().length;
    setGscCount(total);
    if (failed > 0) alert(`${failed} file(s) could not be parsed. Make sure they are GSC Performance report exports.`);
    if (result) {
      const gscEntry = localStore.getGscEntry(result.signals.url);
      setResult(prev => prev ? { ...prev, gscEntry } : prev);
    }
    e.target.value = '';
  }, [result]);

  const handlePbiUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    let failed = 0;
    let lastColMap: PowerBiColumnMap | null = null;
    for (const file of files) {
      try {
        const csv = await fileToCsv(file);
        const { entries, colMap } = parsePowerBiCsv(csv);
        lastColMap = colMap;
        localStore.mergePowerBiData(entries);
        setPbiLastParsedCount(entries.length);
      } catch {
        failed++;
      }
    }
    const total = localStore.getPowerBiData().length;
    setPbiCount(total);
    if (lastColMap) setPbiColMap(lastColMap);
    if (failed > 0) alert(`${failed} file(s) could not be parsed.`);
    if (result) {
      const pbiEntry = localStore.getPowerBiEntry(result.signals.url);
      setResult(prev => prev ? { ...prev, pbiEntry } : prev);
    }
    e.target.value = '';
  }, [result]);

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Page Analyzer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Audit any page for SEO health, LLM visibility, and Core Web Vitals — with trade-off warnings and optional AI deep-dive.
        </p>
      </div>

      {/* Data enrichment strip */}
      <div className="space-y-2 mb-4">
        {/* GSC row */}
        <div className="flex flex-wrap gap-2 items-center">
          <input ref={gscInputRef} type="file" accept=".csv,.xlsx,.xls,.xlsm" multiple className="hidden" onChange={handleGscUpload} />
          <button
            onClick={() => gscInputRef.current?.click()}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${gscCount > 0 ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
          >
            {gscCount > 0 ? '✅' : '↑'} GSC Data {gscCount > 0 ? `(${gscCount.toLocaleString()} pages)` : '(CSV or XLSX)'}
          </button>
          {gscCount > 0 && (
            <>
              <input
                type="text"
                value={gscPeriodInput}
                onChange={e => setGscPeriodInput(e.target.value)}
                onBlur={() => {
                  const label = gscPeriodInput.trim();
                  if (label) {
                    const isComparison = /vs|versus|compared/i.test(label);
                    const meta: DataPeriodMeta = { label, type: isComparison ? 'comparison' : 'date_range' };
                    localStore.saveGscMeta(meta);
                    setGscMeta(meta);
                  } else {
                    localStore.clearGscMeta();
                    setGscMeta(null);
                  }
                }}
                placeholder="Period, e.g. Jan–Mar 2025 or Q1 vs Q4 2024"
                className="text-xs border border-gray-200 rounded-full px-3 py-1.5 flex-1 min-w-[220px] max-w-xs focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-600 placeholder-gray-300"
              />
              <button
                onClick={() => { localStore.clearGscData(); localStore.clearGscMeta(); setGscCount(0); setGscMeta(null); setGscPeriodInput(''); setResult(prev => prev ? { ...prev, gscEntry: null } : prev); }}
                className="text-xs text-gray-400 hover:text-red-500 px-1"
              >
                Clear
              </button>
            </>
          )}
        </div>

        {/* Power BI row */}
        <div className="flex flex-wrap gap-2 items-center">
          <input ref={pbiInputRef} type="file" accept=".csv,.xlsx,.xls,.xlsm" multiple className="hidden" onChange={handlePbiUpload} />
          <button
            onClick={() => pbiInputRef.current?.click()}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors shrink-0 ${pbiCount > 0 ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'}`}
          >
            {pbiCount > 0 ? '✅' : '↑'} Power BI Data {pbiCount > 0 ? `(${pbiCount.toLocaleString()} pages)` : '(CSV or XLSX)'}
          </button>
          {pbiCount > 0 && (
            <>
              <input
                type="text"
                value={pbiPeriodInput}
                onChange={e => setPbiPeriodInput(e.target.value)}
                onBlur={() => {
                  const label = pbiPeriodInput.trim();
                  if (label) {
                    const isComparison = /vs|versus|compared/i.test(label);
                    const meta: DataPeriodMeta = { label, type: isComparison ? 'comparison' : 'date_range' };
                    localStore.savePbiMeta(meta);
                    setPbiMeta(meta);
                  } else {
                    localStore.clearPbiMeta();
                    setPbiMeta(null);
                  }
                }}
                placeholder="Period, e.g. Jan–Mar 2025 or Q1 vs Q4 2024"
                className="text-xs border border-gray-200 rounded-full px-3 py-1.5 flex-1 min-w-[220px] max-w-xs focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-600 placeholder-gray-300"
              />
              <button
                onClick={() => { localStore.clearPowerBiData(); localStore.clearPbiMeta(); setPbiCount(0); setPbiMeta(null); setPbiPeriodInput(''); setResult(prev => prev ? { ...prev, pbiEntry: null } : prev); }}
                className="text-xs text-gray-400 hover:text-red-500 px-1"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Power BI column diagnostic */}
      {pbiColMap && (
        <details className="mb-4 text-xs">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-600">
            Power BI column mapping — {pbiColMap.allHeaders.length} columns · {pbiLastParsedCount ?? '?'} rows parsed
          </summary>
          <div className="mt-2 bg-gray-50 border rounded-lg p-3 text-gray-600 space-y-2">
            {/* Current period */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Current period</span>
              <DiagCol label="URL col" val={pbiColMap.urlCol} />
              <DiagCol label="Sessions" val={pbiColMap.sessionsCol} />
              <DiagCol label="Orders" val={pbiColMap.conversionsCol} />
              <DiagCol label="Sales" val={pbiColMap.revenueCol} />
              <DiagCol label="Bounce Rate" val={pbiColMap.bounceCol} />
              <DiagCol label="CVR" val={pbiColMap.cvrCol} />
              <DiagCol label="AOV" val={pbiColMap.aovCol} />
            </div>
            {/* Comparison period */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-t pt-2">
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Comparison period</span>
              <DiagCol label="Sessions prev" val={pbiColMap.sessionsPrevCol} />
              <DiagCol label="Orders prev" val={pbiColMap.conversionsPrevCol} />
              <DiagCol label="Sales prev" val={pbiColMap.revenuePrevCol} />
              <DiagCol label="Bounce Rate prev" val={pbiColMap.bouncePrevCol} />
            </div>
            {/* Growth */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 border-t pt-2">
              <span className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">Growth %</span>
              <DiagCol label="Sessions growth" val={pbiColMap.sessionsGrowthCol} />
              <DiagCol label="Orders growth" val={pbiColMap.conversionsGrowthCol} />
              <DiagCol label="Sales growth" val={pbiColMap.revenueGrowthCol} />
              <DiagCol label="Bounce growth" val={pbiColMap.bounceGrowthCol} />
              <DiagCol label="CVR growth" val={pbiColMap.cvrGrowthCol} />
            </div>
            {pbiLastParsedCount === 0 && (
              <div className="text-red-600 font-medium border-t pt-2">
                ⚠️ 0 rows parsed — the URL column above may not contain page paths.
              </div>
            )}
            <div className="text-gray-400 break-all border-t pt-2">
              All headers: {pbiColMap.allHeaders.join(' · ')}
            </div>
          </div>
        </details>
      )}

      {/* URL Input */}
      <div className="flex gap-2 mb-8">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleAnalyze()}
          placeholder="https://www.aceableagent.com/real-estate-license/texas/"
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#DB306A]"
        />
        <button
          onClick={handleAnalyze}
          disabled={loading || !url.trim()}
          className="px-5 py-2.5 bg-[#DB306A] text-white text-sm font-medium rounded-lg hover:bg-[#C22660] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-20 text-gray-400 text-sm">
          <div className="text-3xl mb-3 animate-pulse">◉</div>
          Fetching page and running PageSpeed audit…
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Score Cards */}
          <div className="grid grid-cols-3 gap-4">
            <ScoreCard label="SEO Health" score={result.seoScore} />
            <ScoreCard label="LLM Visibility" score={result.llmScore} />
            <PageSpeedCard pageSpeed={result.pageSpeed} error={result.pageSpeedError} />
          </div>

          {/* GSC + PBI enrichment panels */}
          {(result.gscEntry || result.pbiEntry) && (
            <div className="grid grid-cols-2 gap-4">
              {result.gscEntry && <GscPanel entry={result.gscEntry} meta={gscMeta} />}
              {result.pbiEntry && <PbiPanel entry={result.pbiEntry} meta={pbiMeta} />}
            </div>
          )}

          {/* No-match hints — data uploaded but URL not found */}
          {(gscCount > 0 && !result.gscEntry) || (pbiCount > 0 && !result.pbiEntry) ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 space-y-1">
              {gscCount > 0 && !result.gscEntry && (
                <p>⚠️ <strong>GSC:</strong> {gscCount.toLocaleString()} pages loaded but none matched this URL. Check that you exported the "Pages" performance report and that the URL exists in your GSC data.</p>
              )}
              {pbiCount > 0 && !result.pbiEntry && (
                <p>⚠️ <strong>Power BI:</strong> {pbiCount.toLocaleString()} pages loaded but none matched this URL. Make sure the URL or page path in your report matches the URL above exactly.</p>
              )}
            </div>
          ) : null}

          {/* Core Web Vitals */}
          {result.pageSpeed && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Core Web Vitals (Mobile)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  {(Object.keys(CWV) as (keyof typeof CWV)[]).map(key => {
                    const val = result.pageSpeed![key as keyof PageSpeedSignals] as number | null;
                    const status = cwvStatus(key, val);
                    return (
                      <div key={key} className="text-center">
                        <div className={`text-xl font-bold ${cwvColor(status)}`}>
                          {formatCwv(key, val)}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{CWV[key].label}</div>
                        <div className={`text-xs mt-0.5 capitalize ${cwvColor(status)}`}>
                          {status === 'needs-improvement' ? 'Needs work' : status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signal Breakdown — side by side */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Signal Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">SEO Signals</p>
                  {result.seoItems.map((item, i) => (
                    <SignalRow key={i} item={item} />
                  ))}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">LLM Visibility Signals</p>
                  {result.llmItems.map((item, i) => (
                    <SignalRow key={i} item={item} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade-off Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              {result.warnings.map((w, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex gap-3">
                  <span className="text-amber-500 text-base shrink-0">⚠️</span>
                  <p className="text-sm text-amber-800">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Business context banner */}
          {result.pbiEntry && (
            <div className="flex flex-wrap gap-4 bg-[#213351]/5 border border-[#213351]/20 rounded-lg px-4 py-3 text-xs">
              <span className="font-semibold text-[#213351] uppercase tracking-wide">
                Business Context
                {pbiMeta && <span className="ml-1.5 font-normal text-[#213351]/60 normal-case">({pbiMeta.label})</span>}
              </span>
                  {result.pbiEntry.sessions !== undefined && (
                <span className="text-gray-700">
                  <span className="font-medium">{result.pbiEntry.sessions.toLocaleString()}</span> sessions
                  <GrowthBadge value={result.pbiEntry.sessionsGrowth} />
                </span>
              )}
              {result.pbiEntry.conversions !== undefined && (
                <span className="text-gray-700">
                  <span className="font-medium">{result.pbiEntry.conversions.toLocaleString()}</span> orders
                  <GrowthBadge value={result.pbiEntry.conversionsGrowth} />
                </span>
              )}
              {result.pbiEntry.revenue !== undefined && result.pbiEntry.revenue > 0 && (
                <span className="text-[#DB306A] font-semibold">
                  ${result.pbiEntry.revenue.toLocaleString()} sales
                  <GrowthBadge value={result.pbiEntry.revenueGrowth} />
                </span>
              )}
              {result.pbiEntry.cvr !== undefined && (
                <span className="text-gray-500">
                  {(result.pbiEntry.cvr * 100).toFixed(2)}% CVR
                  <GrowthBadge value={result.pbiEntry.cvrGrowth} />
                </span>
              )}
              {result.pbiEntry.bounceRate !== undefined && (
                <span className={result.pbiEntry.bounceRate > 0.6 ? 'text-red-600' : 'text-gray-700'}>
                  {(result.pbiEntry.bounceRate * 100).toFixed(1)}% bounce
                  <GrowthBadge value={result.pbiEntry.bounceRateGrowth} inverse />
                </span>
              )}
              {result.pbiEntry.revenue !== undefined && result.pbiEntry.revenue > 0 && (
                <span className="ml-auto text-amber-700 font-medium">High-revenue page — prioritize fixes</span>
              )}
            </div>
          )}

          {/* Recommendations Table */}
          {result.actions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Recommendations — Dual Impact ({result.actions.length} actions)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-1/2">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-1/4">SEO Impact</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 w-1/4">LLM Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.actions.map(action => (
                      <tr key={action.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-medium text-gray-800">{action.title}</p>
                            {action.riskNote && (
                              <span className="text-amber-500 text-xs shrink-0">⚠️</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{action.description}</p>
                        </td>
                        <td className="px-4 py-3">
                          <ImpactBadge level={action.seoImpact} />
                        </td>
                        <td className="px-4 py-3">
                          <ImpactBadge level={action.llmImpact} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {result.actions.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-700 font-medium">This page is well-optimized for both SEO and LLM visibility.</p>
              <p className="text-green-600 text-sm mt-1">No major actions required based on on-page signals.</p>
            </div>
          )}

          {/* Claude AI Deep-Dive */}
          <Card>
            <CardHeader className="pb-2 flex-row flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">AI Deep-Dive Analysis</CardTitle>
              <button
                onClick={handleDeepDive}
                disabled={deepLoading}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#213351] text-white rounded-lg hover:bg-[#1A2B43] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deepLoading ? (
                  <>
                    <span className="animate-spin inline-block">◉</span>
                    Analyzing with Claude…
                  </>
                ) : (
                  <>◆ Get AI Deep-Dive</>
                )}
              </button>
            </CardHeader>
            <CardContent>
              {!deepMarkdown && !deepLoading && !deepError && (
                <p className="text-xs text-gray-400">
                  Click &quot;Get AI Deep-Dive&quot; to get qualitative analysis from Claude — content quality assessment, brand clarity, answer completeness, and prioritized recommendations.
                  {result.gscEntry && ' GSC data will be included for context.'}
                  {result.pbiEntry && ' Power BI revenue data will be included.'}
                </p>
              )}
              {deepError && (
                <p className="text-xs text-red-600">{deepError}</p>
              )}
              {deepMarkdown && (
                <div className="prose prose-sm max-w-none text-gray-700">
                  <MarkdownRenderer content={deepMarkdown} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw signals snapshot */}
          <details className="text-xs text-gray-400">
            <summary className="cursor-pointer hover:text-gray-600">Raw signals snapshot</summary>
            <div className="mt-2 bg-gray-50 border rounded-lg p-4 grid grid-cols-3 gap-2 text-gray-500">
              <span>Title: {result.signals.titleLength} chars</span>
              <span>Meta: {result.signals.metaDescriptionLength} chars</span>
              <span>Words: {result.signals.wordCount.toLocaleString()}</span>
              <span>H1: {result.signals.h1Count}</span>
              <span>H2/H3: {result.signals.h2Count}/{result.signals.h3Count}</span>
              <span>Internal links: {result.signals.internalLinkCount}</span>
              <span>Lists: {result.signals.listCount}</span>
              <span>Stats: {result.signals.statsCount}</span>
              <span>Schema: {result.signals.schemaTypes.join(', ') || 'none'}</span>
              <span>Brand early: {result.signals.brandMentionsFirst200Words}×</span>
              <span>Brand total: {result.signals.brandMentionsTotal}×</span>
              <span>Canonical: {result.signals.hasCanonical ? 'yes' : 'no'}</span>
            </div>
          </details>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="text-center py-20 text-gray-300">
          <div className="text-5xl mb-4">◎</div>
          <p className="text-sm">Enter a URL above to audit SEO + LLM signals</p>
          <p className="text-xs mt-1">Works on any Aceable page or competitor URL</p>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  const { label: scoreLabel, color } = getScoreLabel(score);
  const barColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-[#DB306A]' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <p className="text-xs text-gray-500 mb-2">{label}</p>
        <div className="flex items-end gap-3 mb-3">
          <span className={`text-4xl font-bold ${color}`}>{score}</span>
          <span className="text-gray-400 text-sm mb-1">/ 100</span>
          <span className={`text-sm font-medium mb-1 ${color}`}>{scoreLabel}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PageSpeedCard({ pageSpeed, error }: { pageSpeed: PageSpeedSignals | null; error?: string | null }) {
  if (!pageSpeed) {
    const isRateLimited = error?.includes('429') || error?.includes('quota');
    return (
      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-gray-500 mb-2">Technical Performance (Mobile)</p>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-gray-300">—</span>
            <span className="text-gray-400 text-sm mb-1">/ 100</span>
          </div>
          {isRateLimited ? (
            <p className="text-xs text-amber-600">
              API quota exceeded. Add <code className="bg-amber-50 px-1 rounded">PAGESPEED_API_KEY</code> to <code className="bg-amber-50 px-1 rounded">.env.local</code> for unlimited requests.
            </p>
          ) : (
            <p className="text-xs text-gray-400">{error ?? 'PageSpeed data unavailable'}</p>
          )}
        </CardContent>
      </Card>
    );
  }
  const score = pageSpeed.mobileScore ?? 0;
  const { label: scoreLabel, color } = getScoreLabel(score);
  const barColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-[#DB306A]' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <p className="text-xs text-gray-500 mb-2">Technical Performance (Mobile)</p>
        <div className="flex items-end gap-3 mb-3">
          <span className={`text-4xl font-bold ${color}`}>{score}</span>
          <span className="text-gray-400 text-sm mb-1">/ 100</span>
          <span className={`text-sm font-medium mb-1 ${color}`}>{scoreLabel}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${score}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function GscPanel({ entry, meta }: { entry: GscPageEntry; meta: DataPeriodMeta | null }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
          Search Console Data
          {meta && (
            <span className={`normal-case font-normal px-2 py-0.5 rounded-full text-xs ${meta.type === 'comparison' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {meta.label}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Clicks" value={entry.clicks.toLocaleString()} />
          <Metric label="Impressions" value={entry.impressions.toLocaleString()} />
          <Metric label="Avg Position" value={`#${entry.position.toFixed(1)}`} highlight={entry.position <= 10} />
          <Metric label="CTR" value={`${(entry.ctr * 100).toFixed(1)}%`} />
        </div>
        {meta?.type === 'comparison' && (
          <p className="text-xs text-blue-500 mt-2">Period-over-period comparison — metrics show change vs prior period.</p>
        )}
      </CardContent>
    </Card>
  );
}

function GrowthBadge({ value, inverse = false }: { value: number | undefined; inverse?: boolean }) {
  if (value === undefined) return null;
  const isPositive = value > 0;
  const isGood = inverse ? !isPositive : isPositive;
  const color = isGood ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-400';
  const arrow = isPositive ? '▲' : value < 0 ? '▼' : '—';
  return (
    <span className={`text-xs font-medium ${color} ml-1`}>
      {arrow} {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function PbiPanel({ entry, meta }: { entry: PowerBiPageEntry; meta: DataPeriodMeta | null }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-2">
          Power BI Business Data
          {meta && (
            <span className={`normal-case font-normal px-2 py-0.5 rounded-full text-xs ${meta.type === 'comparison' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {meta.label}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {entry.sessions !== undefined && (
            <Metric
              label="Sessions"
              value={entry.sessions.toLocaleString()}
              badge={<GrowthBadge value={entry.sessionsGrowth} />}
              sub={entry.sessionsPrev !== undefined ? `prev: ${entry.sessionsPrev.toLocaleString()}` : undefined}
            />
          )}
          {entry.conversions !== undefined && (
            <Metric
              label="Orders"
              value={entry.conversions.toLocaleString()}
              badge={<GrowthBadge value={entry.conversionsGrowth} />}
              sub={entry.conversionsPrev !== undefined ? `prev: ${entry.conversionsPrev.toLocaleString()}` : undefined}
            />
          )}
          {entry.revenue !== undefined && (
            <Metric
              label="Sales"
              value={`$${entry.revenue.toLocaleString()}`}
              highlight={entry.revenue > 0}
              badge={<GrowthBadge value={entry.revenueGrowth} />}
              sub={entry.revenuePrev !== undefined ? `prev: $${entry.revenuePrev.toLocaleString()}` : undefined}
            />
          )}
          {entry.bounceRate !== undefined && (
            <Metric
              label="Bounce Rate"
              value={`${(entry.bounceRate * 100).toFixed(1)}%`}
              badge={<GrowthBadge value={entry.bounceRateGrowth} inverse />}
              sub={entry.bounceRatePrev !== undefined ? `prev: ${(entry.bounceRatePrev * 100).toFixed(1)}%` : undefined}
            />
          )}
          {entry.cvr !== undefined && (
            <Metric
              label="CVR"
              value={`${(entry.cvr * 100).toFixed(2)}%`}
              badge={<GrowthBadge value={entry.cvrGrowth} />}
            />
          )}
          {entry.aov !== undefined && (
            <Metric label="AOV" value={`$${entry.aov.toLocaleString()}`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label, value, highlight, badge, sub,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: React.ReactNode;
  sub?: string;
}) {
  return (
    <div>
      <div className={`font-semibold ${highlight ? 'text-[#DB306A]' : 'text-gray-800'}`}>
        {value}{badge}
      </div>
      <div className="text-xs text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-300">{sub}</div>}
    </div>
  );
}

function DiagCol({ label, val }: { label: string; val: string | undefined }) {
  return (
    <span>
      <strong>{label}:</strong>{' '}
      {val
        ? <code className="bg-white border rounded px-1 text-gray-700">{val}</code>
        : <em className="text-amber-600">not found</em>}
    </span>
  );
}

function SignalRow({ item }: { item: ScoredItem }) {
  return (
    <div className="flex items-start gap-2 py-1.5 border-b last:border-0">
      <span className="text-sm shrink-0 mt-0.5">{STATUS_ICON[item.status]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-800">{item.label}</p>
        <p className="text-xs text-gray-400 truncate">{item.detail}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{item.points}/{item.maxPoints}</span>
    </div>
  );
}

function ImpactBadge({ level }: { level: ImpactLevel }) {
  const cfg = IMPACT_CONFIG[level];
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
}

// Minimal markdown renderer — handles headers, bold, bullet lists, numbered lists
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-sm font-bold text-gray-800 mt-4 mb-1">{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="text-base font-bold text-gray-900 mt-4 mb-1">{line.slice(2)}</h2>);
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(<p key={i} className="text-xs text-gray-700 pl-4 my-0.5">{formatInline(line)}</p>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<p key={i} className="text-xs text-gray-700 pl-4 my-0.5">• {formatInline(line.slice(2))}</p>);
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1" />);
    } else {
      elements.push(<p key={i} className="text-xs text-gray-700 my-0.5">{formatInline(line)}</p>);
    }
    i++;
  }
  return <>{elements}</>;
}

function formatInline(text: string): React.ReactNode {
  // Bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i}>{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}
