import Papa from 'papaparse';

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  errors: string[];
}

export function parseCsvString(csvText: string): CsvParseResult {
  // Strip UTF-8 BOM (\uFEFF) that some Power BI / Excel exports prepend
  const text = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText;
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,          // keep all values as strings — we do our own number parsing
    transformHeader: (h: string) => h.trim(),
    transform: (v: string) => v.trim(),
  });

  const headers = result.meta.fields ?? [];
  const errors = result.errors.map(e => `Row ${e.row ?? '?'}: ${e.message}`);

  return {
    headers,
    rows: result.data,
    errors,
  };
}

export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function extractDomains(urls: string[]): string[] {
  const domains = urls
    .map(url => {
      try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        return u.hostname.replace(/^www\./, '');
      } catch {
        return null;
      }
    })
    .filter((d): d is string => d !== null);
  return [...new Set(domains)];
}

export function parseUrlList(raw: string): string[] {
  if (!raw) return [];
  // Handle pipe-separated, comma-separated, or newline-separated URL lists
  return raw
    .split(/[|,\n]+/)
    .map(u => u.trim())
    .filter(u => u.length > 0 && (u.startsWith('http') || u.includes('.')));
}

export function parseNumber(raw: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[,\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? undefined : n;
}
