import type { DataSource } from '@/types';

export type SemrushSubFormat = 'prompt_report' | 'gap_prompts' | 'prompts_general' | 'sources';

// Format 1: Semrush AI Toolkit — Prompt Report
// Headers: Prompt, LLM Summary, Is Presence Available, Mentions - Your Brand, Cited Brands
const SEMRUSH_PROMPT_REPORT = ['llm summary', 'is presence available', 'mentions - your brand'];

// Format 2: Semrush AI Toolkit — Gap Prompts export
// Headers: prompt, brief_response, gap_mentions, topic_volume
const SEMRUSH_GAP_PROMPTS = ['gap_mentions', 'brief_response', 'prompt'];

// Format 3: Semrush AI Toolkit — Prompts export (general)
// Headers: prompt, brief_response, topic_intents, topic_volume
const SEMRUSH_PROMPTS_GENERAL = ['brief_response', 'topic_intents', 'prompt'];

// Format 4: Semrush AI Toolkit — Sources export
// Headers: url, country, prompts_count
const SEMRUSH_SOURCES = ['url', 'country', 'prompts_count'];

// BrightEdge AI Catalyst — Share of Citations
const BRIGHTEDGE_SOC = ['page url', 'brand category', 'share of citations', 'citations count'];

// BrightEdge AI (query-level, for future use)
const BRIGHTEDGE_REQUIRED = ['query', 'ai platform', 'ai response text', 'cited urls'];

export function detectBrightEdgeSOC(headers: string[]): boolean {
  const n = headers.map(h => h.toLowerCase().trim());
  return BRIGHTEDGE_SOC.every(sig => n.some(h => h.includes(sig)));
}

export function detectSemrushSubFormat(headers: string[]): SemrushSubFormat | null {
  const n = headers.map(h => h.toLowerCase().trim());
  if (SEMRUSH_PROMPT_REPORT.every(sig => n.some(h => h.includes(sig)))) return 'prompt_report';
  if (SEMRUSH_GAP_PROMPTS.every(sig => n.some(h => h.includes(sig)))) return 'gap_prompts';
  if (SEMRUSH_PROMPTS_GENERAL.every(sig => n.some(h => h.includes(sig)))) return 'prompts_general';
  if (SEMRUSH_SOURCES.every(sig => n.some(h => h === sig))) return 'sources';
  return null;
}

export function detectFormat(headers: string[]): DataSource | null {
  const n = headers.map(h => h.toLowerCase().trim());

  const isSemrush = detectSemrushSubFormat(headers) !== null;
  const isBrightEdge =
    detectBrightEdgeSOC(headers) ||
    BRIGHTEDGE_REQUIRED.every(sig => n.some(h => h.includes(sig)));

  if (isSemrush) return 'semrush';
  if (isBrightEdge) return 'brightedge';
  return null;
}
