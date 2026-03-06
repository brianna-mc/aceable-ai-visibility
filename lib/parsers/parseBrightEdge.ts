import { v4 as uuid } from 'uuid';
import type { NormalizedRow, ParseError } from '@/types';
import { classifyProductLine, classifyQueryIntent } from '@/lib/constants/productLines';
import { parseCsvString, readFileAsText, extractDomains, parseUrlList, parseNumber } from './csvUtils';

const FIELD_ALIASES: Record<string, string> = {
  // Query
  query: 'query',
  keyword: 'query',
  'search query': 'query',
  'search term': 'query',
  // Search volume
  'monthly search volume': 'searchVolume',
  'search volume': 'searchVolume',
  volume: 'searchVolume',
  // AI platform
  'ai platform': 'aiPlatform',
  platform: 'aiPlatform',
  'ai source': 'aiPlatform',
  // AI response text
  'ai response text': 'aiResponseText',
  'ai response': 'aiResponseText',
  'ai answer': 'aiResponseText',
  'ai generated answer': 'aiResponseText',
  'response text': 'aiResponseText',
  // Cited URLs
  'cited urls': 'citedUrlsRaw',
  'cited url': 'citedUrlsRaw',
  'citation urls': 'citedUrlsRaw',
  citations: 'citedUrlsRaw',
  // Citation count
  'citation count': 'citationCount',
  'number of citations': 'citationCount',
  'ai citation count': 'citationCount',
  // Your domain cited
  'your domain cited': 'yourDomainCited',
  'aceable cited': 'yourDomainCited',
  'brand cited': 'yourDomainCited',
  // Date tracked
  'date tracked': 'trackingDate',
  date: 'trackingDate',
  'tracking date': 'trackingDate',
};

function normalizeHeaders(headers: string[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const h of headers) {
    const key = h.toLowerCase().trim();
    const mapped = FIELD_ALIASES[key];
    if (mapped) map.set(mapped, h);
  }
  return map;
}

export async function parseBrightEdgeFile(file: File): Promise<{ rows: NormalizedRow[]; errors: ParseError[] }> {
  const text = await readFileAsText(file);
  return parseBrightEdgeCsv(text);
}

export function parseBrightEdgeCsv(csvText: string): { rows: NormalizedRow[]; errors: ParseError[] } {
  const { headers, rows: rawRows, errors: csvErrors } = parseCsvString(csvText);
  const fieldMap = normalizeHeaders(headers);
  const errors: ParseError[] = csvErrors.map((e, i) => ({
    rowIndex: i,
    field: 'csv',
    message: e,
    rawValue: '',
  }));

  const now = new Date().toISOString();
  const normalizedRows: NormalizedRow[] = [];

  rawRows.forEach((raw, idx) => {
    const queryField = fieldMap.get('query');
    const query = queryField ? raw[queryField] : '';

    if (!query) {
      errors.push({ rowIndex: idx, field: 'query', message: 'Missing query/keyword', rawValue: '' });
      return;
    }

    const aiTextField = fieldMap.get('aiResponseText');
    const aiResponseText = aiTextField ? raw[aiTextField] : '';

    const citedField = fieldMap.get('citedUrlsRaw');
    const citedUrlsRaw = citedField ? raw[citedField] : '';
    const citedUrls = parseUrlList(citedUrlsRaw);

    const volField = fieldMap.get('searchVolume');
    const searchVolume = volField ? parseNumber(raw[volField]) : undefined;

    const platformField = fieldMap.get('aiPlatform');
    const brightedgeAiPlatform = platformField ? raw[platformField] : undefined;

    const countField = fieldMap.get('citationCount');
    const brightedgeCitationCount = countField ? parseNumber(raw[countField]) : undefined;

    const dateField = fieldMap.get('trackingDate');
    const brightedgeTrackingDate = dateField ? raw[dateField] : undefined;

    const hasAiOverview = aiResponseText.length > 0;
    const productLine = classifyProductLine(query);
    const queryIntent = classifyQueryIntent(query);

    normalizedRows.push({
      id: uuid(),
      source: 'brightedge',
      uploadedAt: now,
      query,
      searchVolume,
      aiResponseText,
      citedUrls,
      citedDomains: extractDomains(citedUrls),
      hasAiOverview,
      productLine,
      queryIntent,
      brightedgeAiPlatform,
      brightedgeCitationCount,
      brightedgeTrackingDate,
    });
  });

  return { rows: normalizedRows, errors };
}
