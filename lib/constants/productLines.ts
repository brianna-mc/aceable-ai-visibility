import type { ProductLine, QueryIntent } from '@/types';

export interface ProductLineDefinition {
  id: ProductLine;
  label: string;
  domain: string;
  color: string;
  urlPrefixes: string[];
  queryKeywords: string[];
  stateKeywords: string[];
}

export const PRODUCT_LINE_DEFINITIONS: ProductLineDefinition[] = [
  {
    id: 'aceableagent',
    label: 'AceableAgent',
    domain: 'aceableagent.com',
    color: '#DB306A',
    urlPrefixes: ['aceableagent.com'],
    queryKeywords: [
      'real estate', 'realtor', 'realty', 'real estate license',
      'real estate school', 'real estate exam', 'real estate course',
      'real estate agent', 'broker', 'pre-license', 'prelicense',
      'pre license', 'real estate class', 'real estate education',
      'real estate certification', 'real estate training',
    ],
    stateKeywords: [
      'texas real estate', 'florida real estate', 'georgia real estate',
      'michigan real estate', 'new york real estate', 'california real estate',
      'north carolina real estate', 'south carolina real estate',
    ],
  },
  {
    id: 'drivers_ed',
    label: 'Aceable Drivers Ed',
    domain: 'aceable.com',
    color: '#213351',
    urlPrefixes: [
      'aceable.com/drivers-ed',
      'aceable.com/driving',
      'aceable.com/teen',
    ],
    queryKeywords: [
      "drivers ed", "driver education", "driver's education", "learner permit",
      "teen driving", "driving school", "behind the wheel", "drivers license",
      "driving course", "driver ed", "driving lessons", "learner's permit",
      "driving permit", "teen driver", "new driver",
    ],
    stateKeywords: [
      'texas drivers ed', 'california drivers ed', 'florida drivers ed',
      'texas driver education', 'california driver education',
    ],
  },
  {
    id: 'defensive_driving',
    label: 'Aceable Defensive Driving',
    domain: 'aceable.com',
    color: '#D35400',
    urlPrefixes: [
      'aceable.com/defensive-driving',
      'aceable.com/traffic-school',
    ],
    queryKeywords: [
      'defensive driving', 'traffic school', 'ticket dismissal', 'ticket deferral',
      'dismiss ticket', 'driving record', 'insurance discount', 'court ordered',
      'point reduction', 'speeding ticket', 'traffic ticket', 'driving violation',
    ],
    stateKeywords: [
      'texas defensive driving', 'california traffic school',
      'florida defensive driving', 'texas traffic school',
    ],
  },
];

export function classifyProductLine(query: string): ProductLine {
  const q = query.toLowerCase();

  // Check in priority order: most specific first
  for (const def of PRODUCT_LINE_DEFINITIONS) {
    const keywordMatch = def.queryKeywords.some(kw => q.includes(kw.toLowerCase()));
    const stateMatch = def.stateKeywords.some(kw => q.includes(kw.toLowerCase()));
    if (keywordMatch || stateMatch) return def.id;
  }
  return 'unknown';
}

export function classifyQueryIntent(query: string): QueryIntent {
  const q = query.toLowerCase();
  if (/^(aceable|aceableagent)\b/.test(q)) return 'navigational';
  if (/\b(buy|enroll|sign up|register|cost|price|cheap|discount|purchase|get started)\b/.test(q)) return 'transactional';
  if (/\b(best|top|vs|versus|compare|comparison|review|reviews|recommended|alternative|alternatives)\b/.test(q)) return 'commercial';
  if (/\b(how|what|when|why|can|does|do|is|are|which|where|who)\b/.test(q)) return 'informational';
  return 'unknown';
}

export const PRODUCT_LINE_LABELS: Record<ProductLine, string> = {
  aceableagent: 'AceableAgent',
  drivers_ed: 'Drivers Ed',
  defensive_driving: 'Defensive Driving',
  unknown: 'Unknown',
};

export const PRODUCT_LINE_COLORS: Record<ProductLine, string> = {
  aceableagent: '#DB306A',
  drivers_ed: '#213351',
  defensive_driving: '#D35400',
  unknown: '#9CA3AF',
};
