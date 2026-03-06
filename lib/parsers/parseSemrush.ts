import { v4 as uuid } from 'uuid';
import type { NormalizedRow, ParseError, QueryIntent } from '@/types';
import { classifyProductLine, classifyQueryIntent } from '@/lib/constants/productLines';
import { parseCsvString, readFileAsText, parseNumber } from './csvUtils';
import { detectSemrushSubFormat } from './detectFormat';

export async function parseSemrushFile(file: File): Promise<{ rows: NormalizedRow[]; errors: ParseError[] }> {
  const text = await readFileAsText(file);
  return parseSemrushCsv(text);
}

export function parseSemrushCsv(csvText: string): { rows: NormalizedRow[]; errors: ParseError[] } {
  const { headers, rows: rawRows, errors: csvErrors } = parseCsvString(csvText);
  const subFormat = detectSemrushSubFormat(headers);
  const errors: ParseError[] = csvErrors.map((e, i) => ({ rowIndex: i, field: 'csv', message: e, rawValue: '' }));

  if (!subFormat) {
    errors.push({ rowIndex: 0, field: 'headers', message: 'Unrecognized Semrush format', rawValue: headers.join(', ') });
    return { rows: [], errors };
  }

  const now = new Date().toISOString();

  if (subFormat === 'prompt_report') return parsePromptReport(rawRows, headers, errors, now);
  if (subFormat === 'gap_prompts') return parseGapPrompts(rawRows, errors, now);
  return parsePromptsGeneral(rawRows, errors, now);
}

// ─── Format 1: Prompt Report ──────────────────────────────────────────────────
// Headers: Prompt, LLM Summary, Is Presence Available, Mentions - Your Brand,
//          Cited Brands, Mentioned Brands, Intents, LLM Engines

function parseLlmSummary(raw: string): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.values(parsed).join('\n\n');
  } catch {
    return raw;
  }
}

function parseMentionYourBrand(raw: string): boolean {
  if (!raw) return false;
  return raw.toLowerCase().includes("'yes'") || raw.toLowerCase().includes('"yes"');
}

function parseIntentFromSemrush(raw: string): QueryIntent {
  if (!raw) return 'unknown';
  const lower = raw.toLowerCase();
  if (lower.includes('transactional')) return 'transactional';
  if (lower.includes('commercial')) return 'commercial';
  if (lower.includes('navigational')) return 'navigational';
  if (lower.includes('informational')) return 'informational';
  return 'unknown';
}

function parseBrandList(raw: string): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function parsePromptReport(
  rawRows: Record<string, string>[],
  headers: string[],
  errors: ParseError[],
  now: string
): { rows: NormalizedRow[]; errors: ParseError[] } {
  const h = (name: string) => headers.find(hd => hd.toLowerCase().includes(name.toLowerCase())) ?? name;

  const rows: NormalizedRow[] = [];

  rawRows.forEach((raw, idx) => {
    const query = raw[h('Prompt')]?.trim() ?? '';
    if (!query) { errors.push({ rowIndex: idx, field: 'Prompt', message: 'Empty query', rawValue: '' }); return; }

    const aiResponseText = parseLlmSummary(raw[h('LLM Summary')] ?? '');
    const mentionedBrands = parseBrandList(raw[h('Mentioned Brands')] ?? '');
    const citedBrands = parseBrandList(raw[h('Cited Brands')] ?? '');
    const allDomains = [...new Set([...mentionedBrands, ...citedBrands])];

    const aceableMentioned = parseMentionYourBrand(raw[h('Mentions - Your Brand')] ?? '');
    const citedDomains = aceableMentioned
      ? [...allDomains, 'aceable.com', 'aceableagent.com']
      : allDomains;

    const hasAiOverview = (raw[h('Is Presence Available')] ?? '').toLowerCase() === 'yes';

    rows.push({
      id: uuid(),
      source: 'semrush',
      uploadedAt: now,
      query,
      searchVolume: undefined,
      aiResponseText,
      citedUrls: citedDomains,
      citedDomains,
      hasAiOverview,
      productLine: classifyProductLine(query),
      queryIntent: parseIntentFromSemrush(raw[h('Intents')] ?? ''),
      semrushAiOverviewPresent: hasAiOverview,
    });
  });

  return { rows, errors };
}

// ─── Format 2: Gap Prompts ────────────────────────────────────────────────────
// Headers: prompt, country, llm, topic_name, topic_volume, brief_response,
//          mentioned_brands_count, sources_count, gap_mentions
// gap_mentions: "aceableagent.com:0;theceshop.com:0;colibrirealestate.com:1"
// 1 = mentioned in AI response, 0 = not mentioned

function parseGapMentions(raw: string): string[] {
  if (!raw) return [];
  return raw.split(';')
    .map(e => e.trim())
    .filter(e => e.endsWith(':1'))
    .map(e => e.replace(/:1$/, '').trim());
}

function parseGapPrompts(
  rawRows: Record<string, string>[],
  errors: ParseError[],
  now: string
): { rows: NormalizedRow[]; errors: ParseError[] } {
  const rows: NormalizedRow[] = [];

  rawRows.forEach((raw, idx) => {
    const query = raw['prompt']?.trim() ?? '';
    if (!query) { errors.push({ rowIndex: idx, field: 'prompt', message: 'Empty query', rawValue: '' }); return; }

    const aiResponseText = raw['brief_response']?.trim() ?? '';
    const searchVolume = parseNumber(raw['topic_volume'] ?? '');
    const mentionedDomains = parseGapMentions(raw['gap_mentions'] ?? '');

    rows.push({
      id: uuid(),
      source: 'semrush',
      uploadedAt: now,
      query,
      searchVolume,
      aiResponseText,
      citedUrls: mentionedDomains,
      citedDomains: mentionedDomains,
      hasAiOverview: aiResponseText.length > 0,
      productLine: classifyProductLine(query),
      queryIntent: classifyQueryIntent(query),
      semrushAiOverviewPresent: aiResponseText.length > 0,
    });
  });

  return { rows, errors };
}

// ─── Format 3: Prompts General ────────────────────────────────────────────────
// Headers: prompt, country, llm, category, topic_name, topic_volume,
//          topic_intents, brief_response, mentioned_brands_count, sources_count

function parseDominantIntent(raw: string): QueryIntent {
  if (!raw) return 'unknown';
  // Format: "informational:64;navigational:4;commercial:30;transactional:2"
  const entries = raw.split(';').map(e => {
    const [intent, score] = e.split(':');
    return { intent: intent?.trim() ?? '', score: parseInt(score ?? '0', 10) };
  });
  const top = entries.sort((a, b) => b.score - a.score)[0];
  return top ? parseIntentFromSemrush(top.intent) : 'unknown';
}

function parsePromptsGeneral(
  rawRows: Record<string, string>[],
  errors: ParseError[],
  now: string
): { rows: NormalizedRow[]; errors: ParseError[] } {
  const rows: NormalizedRow[] = [];

  rawRows.forEach((raw, idx) => {
    const query = raw['prompt']?.trim() ?? '';
    if (!query) { errors.push({ rowIndex: idx, field: 'prompt', message: 'Empty query', rawValue: '' }); return; }

    const aiResponseText = raw['brief_response']?.trim() ?? '';
    const searchVolume = parseNumber(raw['topic_volume'] ?? '');

    rows.push({
      id: uuid(),
      source: 'semrush',
      uploadedAt: now,
      query,
      searchVolume,
      aiResponseText,
      citedUrls: [],
      citedDomains: [],
      hasAiOverview: aiResponseText.length > 0,
      productLine: classifyProductLine(query),
      queryIntent: parseDominantIntent(raw['topic_intents'] ?? ''),
      semrushAiOverviewPresent: aiResponseText.length > 0,
    });
  });

  return { rows, errors };
}
