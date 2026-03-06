import type { SourceCitation, ParseError } from '@/types';
import { parseCsvString, readFileAsText, parseNumber } from './csvUtils';

export async function parseSemrushSourcesFile(file: File): Promise<{ citations: SourceCitation[]; errors: ParseError[] }> {
  const text = await readFileAsText(file);
  return parseSemrushSourcesCsv(text);
}

export function parseSemrushSourcesCsv(csvText: string): { citations: SourceCitation[]; errors: ParseError[] } {
  const { rows: rawRows, errors: csvErrors } = parseCsvString(csvText);
  const errors: ParseError[] = csvErrors.map((e, i) => ({ rowIndex: i, field: 'csv', message: e, rawValue: '' }));
  const now = new Date().toISOString();

  const citations: SourceCitation[] = [];

  rawRows.forEach((raw, idx) => {
    const url = raw['url']?.trim() ?? '';
    if (!url) {
      errors.push({ rowIndex: idx, field: 'url', message: 'Missing URL', rawValue: '' });
      return;
    }
    const promptsCount = parseNumber(raw['prompts_count'] ?? '') ?? 0;
    citations.push({
      url,
      country: raw['country']?.trim() ?? '',
      promptsCount,
      uploadedAt: now,
    });
  });

  // Sort by promptsCount descending
  citations.sort((a, b) => b.promptsCount - a.promptsCount);

  return { citations, errors };
}
