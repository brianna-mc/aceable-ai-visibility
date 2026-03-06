import type { ProductLine } from '@/types';

export interface AceablePageEntry {
  url: string;
  productLine: ProductLine;
  pageTitle: string;
  keywords: string[];
}

export const ACEABLE_URL_MAP: AceablePageEntry[] = [
  // ── AceableAgent — Homepage & National ────────────────────────────────────────
  {
    url: 'https://www.aceableagent.com/',
    productLine: 'aceableagent',
    pageTitle: 'AceableAgent — Online Real Estate School',
    keywords: ['real estate school', 'real estate license', 'real estate course', 'real estate education', 'online real estate', 'real estate certification', 'real estate training'],
  },

  // ── AceableAgent — State Pages ────────────────────────────────────────────────
  {
    url: 'https://www.aceableagent.com/real-estate-license/texas/',
    productLine: 'aceableagent',
    pageTitle: 'Texas Real Estate License — AceableAgent',
    keywords: ['texas real estate', 'texas real estate license', 'texas realtor', 'texas real estate exam', 'texas real estate school', 'trec', 'texas real estate agent', 'texas pre-license'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/florida/',
    productLine: 'aceableagent',
    pageTitle: 'Florida Real Estate License — AceableAgent',
    keywords: ['florida real estate', 'florida real estate license', 'florida realtor', 'florida real estate exam', 'frec', 'florida real estate agent', 'florida pre-license'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/california/',
    productLine: 'aceableagent',
    pageTitle: 'California Real Estate License — AceableAgent',
    keywords: ['california real estate', 'california real estate license', 'ca real estate license', 'california realtor', 'california dre', 'california real estate exam', 'california real estate agent'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/georgia/',
    productLine: 'aceableagent',
    pageTitle: 'Georgia Real Estate License — AceableAgent',
    keywords: ['georgia real estate', 'georgia real estate license', 'georgia realtor', 'ga real estate license'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/michigan/',
    productLine: 'aceableagent',
    pageTitle: 'Michigan Real Estate License — AceableAgent',
    keywords: ['michigan real estate', 'michigan real estate license', 'michigan realtor', 'mi real estate license'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/north-carolina/',
    productLine: 'aceableagent',
    pageTitle: 'North Carolina Real Estate License — AceableAgent',
    keywords: ['north carolina real estate', 'nc real estate', 'north carolina real estate license', 'nc realtor'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/new-york/',
    productLine: 'aceableagent',
    pageTitle: 'New York Real Estate License — AceableAgent',
    keywords: ['new york real estate', 'ny real estate license', 'new york real estate license', 'nyc real estate license', 'new york realtor', 'ny dos real estate'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/virginia/',
    productLine: 'aceableagent',
    pageTitle: 'Virginia Real Estate License — AceableAgent',
    keywords: ['virginia real estate', 'va real estate license', 'virginia real estate license', 'virginia realtor'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/colorado/',
    productLine: 'aceableagent',
    pageTitle: 'Colorado Real Estate License — AceableAgent',
    keywords: ['colorado real estate', 'co real estate license', 'colorado real estate license', 'colorado realtor', 'dora real estate colorado'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/arizona/',
    productLine: 'aceableagent',
    pageTitle: 'Arizona Real Estate License — AceableAgent',
    keywords: ['arizona real estate', 'az real estate license', 'arizona real estate license', 'arizona realtor', 'adre real estate'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/pennsylvania/',
    productLine: 'aceableagent',
    pageTitle: 'Pennsylvania Real Estate License — AceableAgent',
    keywords: ['pennsylvania real estate', 'pa real estate license', 'pennsylvania real estate license', 'pa realtor'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/washington/',
    productLine: 'aceableagent',
    pageTitle: 'Washington Real Estate License — AceableAgent',
    keywords: ['washington real estate', 'wa real estate license', 'washington state real estate license', 'washington realtor'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/south-carolina/',
    productLine: 'aceableagent',
    pageTitle: 'South Carolina Real Estate License — AceableAgent',
    keywords: ['south carolina real estate', 'sc real estate license', 'south carolina real estate license', 'sc realtor'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/tennessee/',
    productLine: 'aceableagent',
    pageTitle: 'Tennessee Real Estate License — AceableAgent',
    keywords: ['tennessee real estate', 'tn real estate license', 'tennessee real estate license', 'tennessee realtor'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/ohio/',
    productLine: 'aceableagent',
    pageTitle: 'Ohio Real Estate License — AceableAgent',
    keywords: ['ohio real estate', 'oh real estate license', 'ohio real estate license', 'ohio realtor'],
  },
  {
    url: 'https://www.aceableagent.com/real-estate-license/new-jersey/',
    productLine: 'aceableagent',
    pageTitle: 'New Jersey Real Estate License — AceableAgent',
    keywords: ['new jersey real estate', 'nj real estate license', 'new jersey real estate license', 'nj realtor'],
  },

  // ── AceableAgent — Blog / Resource Pages ─────────────────────────────────────
  {
    url: 'https://www.aceableagent.com/blog/best-real-estate-schools/',
    productLine: 'aceableagent',
    pageTitle: 'Best Real Estate Schools — AceableAgent Blog',
    keywords: ['best real estate school', 'top real estate course', 'real estate school review', 'real estate school comparison', 'real estate school vs', 'best online real estate school', 'real estate school ranking'],
  },
  {
    url: 'https://www.aceableagent.com/blog/how-to-get-real-estate-license/',
    productLine: 'aceableagent',
    pageTitle: 'How to Get a Real Estate License',
    keywords: ['how to get real estate license', 'how to become a realtor', 'real estate license steps', 'how to get licensed real estate', 'steps to become real estate agent', 'how to start in real estate'],
  },
  {
    url: 'https://www.aceableagent.com/blog/real-estate-exam/',
    productLine: 'aceableagent',
    pageTitle: 'Real Estate Exam Prep — AceableAgent',
    keywords: ['real estate exam', 'real estate exam prep', 'real estate license exam', 'pass real estate exam', 'real estate exam practice', 'real estate exam questions', 'real estate test prep'],
  },
  {
    url: 'https://www.aceableagent.com/blog/real-estate-license-cost/',
    productLine: 'aceableagent',
    pageTitle: 'How Much Does a Real Estate License Cost?',
    keywords: ['real estate license cost', 'how much real estate license', 'cost of real estate school', 'real estate course price', 'real estate license fee', 'real estate license expensive', 'affordable real estate school'],
  },
  {
    url: 'https://www.aceableagent.com/blog/how-long-to-get-real-estate-license/',
    productLine: 'aceableagent',
    pageTitle: 'How Long Does It Take to Get a Real Estate License?',
    keywords: ['how long real estate license', 'real estate license time', 'how fast real estate license', 'real estate license weeks', 'real estate license months', 'time to become realtor', 'real estate license duration'],
  },
  {
    url: 'https://www.aceableagent.com/continuing-education/',
    productLine: 'aceableagent',
    pageTitle: 'Real Estate Continuing Education — AceableAgent',
    keywords: ['real estate continuing education', 'real estate CE', 'realtor CE courses', 'real estate license renewal', 'continuing education real estate', 'CE credits real estate', 'realtor continuing education'],
  },
  {
    url: 'https://www.aceableagent.com/blog/online-vs-in-person-real-estate-school/',
    productLine: 'aceableagent',
    pageTitle: 'Online vs In-Person Real Estate School',
    keywords: ['online real estate school vs in person', 'online vs classroom real estate', 'self-paced real estate course', 'flexible real estate school', 'online real estate school pros cons', 'mobile real estate course'],
  },
  {
    url: 'https://www.aceableagent.com/blog/real-estate-career/',
    productLine: 'aceableagent',
    pageTitle: 'Real Estate Career Guide — AceableAgent',
    keywords: ['real estate career', 'become a real estate agent', 'real estate agent career', 'career in real estate', 'is real estate a good career', 'real estate agent income', 'real estate agent salary'],
  },

  // ── Drivers Ed — Homepage & National ─────────────────────────────────────────
  {
    url: 'https://www.aceable.com/drivers-ed/',
    productLine: 'drivers_ed',
    pageTitle: 'Online Drivers Ed — Aceable',
    keywords: ['drivers ed online', 'online drivers education', 'driver ed course', 'online driver education', 'online driving school', 'drivers education', 'teen driver course', 'drivers ed class'],
  },

  // ── Drivers Ed — State Pages ──────────────────────────────────────────────────
  {
    url: 'https://www.aceable.com/drivers-ed/texas/',
    productLine: 'drivers_ed',
    pageTitle: 'Texas Drivers Ed — Aceable',
    keywords: ['texas drivers ed', 'texas teen driving', 'texas learner permit', 'texas driver education', 'tdlr approved drivers ed', 'texas de-964', 'texas online drivers ed', 'texas parent taught', 'texas 6-hour'],
  },
  {
    url: 'https://www.aceable.com/drivers-ed/california/',
    productLine: 'drivers_ed',
    pageTitle: 'California Drivers Ed — Aceable',
    keywords: ['california drivers ed', 'california teen driving', 'california driver education', 'ca drivers ed', 'dmv approved drivers ed california', 'california permit test', 'california online drivers ed'],
  },
  {
    url: 'https://www.aceable.com/drivers-ed/florida/',
    productLine: 'drivers_ed',
    pageTitle: 'Florida Drivers Ed — Aceable',
    keywords: ['florida drivers ed', 'florida teen driving', 'florida driver education', 'florida online drivers ed', 'florida learner permit', 'florida tlsae', 'florida drug alcohol test'],
  },
  {
    url: 'https://www.aceable.com/drivers-ed/new-york/',
    productLine: 'drivers_ed',
    pageTitle: 'New York Drivers Ed — Aceable',
    keywords: ['new york drivers ed', 'ny drivers education', 'new york teen driving', 'ny online drivers ed', 'new york learner permit'],
  },
  {
    url: 'https://www.aceable.com/drivers-ed/georgia/',
    productLine: 'drivers_ed',
    pageTitle: 'Georgia Drivers Ed — Aceable',
    keywords: ['georgia drivers ed', 'ga drivers education', 'georgia teen driving', 'georgia online drivers ed', 'georgia learner permit'],
  },
  {
    url: 'https://www.aceable.com/drivers-ed/illinois/',
    productLine: 'drivers_ed',
    pageTitle: 'Illinois Drivers Ed — Aceable',
    keywords: ['illinois drivers ed', 'il drivers education', 'illinois teen driving', 'illinois online drivers ed'],
  },
  {
    url: 'https://www.aceable.com/drivers-ed/arizona/',
    productLine: 'drivers_ed',
    pageTitle: 'Arizona Drivers Ed — Aceable',
    keywords: ['arizona drivers ed', 'az drivers education', 'arizona teen driving', 'arizona online drivers ed', 'mvd approved drivers ed'],
  },
  {
    url: 'https://www.aceable.com/drivers-ed/north-carolina/',
    productLine: 'drivers_ed',
    pageTitle: 'North Carolina Drivers Ed — Aceable',
    keywords: ['north carolina drivers ed', 'nc drivers education', 'nc teen driving', 'nc online drivers ed'],
  },
  {
    url: 'https://www.aceable.com/blog/best-online-drivers-ed/',
    productLine: 'drivers_ed',
    pageTitle: 'Best Online Drivers Ed Courses — Aceable',
    keywords: ['best online drivers ed', 'top online drivers education', 'drivers ed review', 'best drivers ed course', 'cheapest online drivers ed', 'affordable drivers ed', 'drivers ed comparison'],
  },
  {
    url: 'https://www.aceable.com/blog/how-to-get-drivers-license/',
    productLine: 'drivers_ed',
    pageTitle: 'How to Get Your Drivers License',
    keywords: ['how to get drivers license', 'how to get license', 'first time driver license', 'teen drivers license steps', 'how to get learner permit', 'learner permit requirements', 'how to get permit'],
  },

  // ── Defensive Driving — Homepage & National ───────────────────────────────────
  {
    url: 'https://www.aceable.com/defensive-driving/',
    productLine: 'defensive_driving',
    pageTitle: 'Online Defensive Driving Course — Aceable',
    keywords: ['defensive driving course', 'online defensive driving', 'traffic school', 'online traffic school', 'ticket dismissal course', 'defensive driving class', 'court ordered driving course', 'safe driving course'],
  },

  // ── Defensive Driving — State Pages ──────────────────────────────────────────
  {
    url: 'https://www.aceable.com/defensive-driving/texas/',
    productLine: 'defensive_driving',
    pageTitle: 'Texas Defensive Driving — Aceable',
    keywords: ['texas defensive driving', 'texas ticket dismissal', 'texas traffic school', 'texas defensive driving course', 'dismiss ticket texas', 'texas court ordered driving', 'tdlr defensive driving', 'texas 6-hour defensive driving'],
  },
  {
    url: 'https://www.aceable.com/defensive-driving/california/',
    productLine: 'defensive_driving',
    pageTitle: 'California Traffic School — Aceable',
    keywords: ['california traffic school', 'california defensive driving', 'ca traffic school', 'dismiss ticket california', 'california online traffic school', 'california ticket dismissal'],
  },
  {
    url: 'https://www.aceable.com/defensive-driving/florida/',
    productLine: 'defensive_driving',
    pageTitle: 'Florida Defensive Driving — Aceable',
    keywords: ['florida defensive driving', 'florida traffic school', 'florida ticket dismissal', 'florida basic driver improvement', 'bdi course florida', 'florida online traffic school'],
  },
  {
    url: 'https://www.aceable.com/defensive-driving/new-york/',
    productLine: 'defensive_driving',
    pageTitle: 'New York Defensive Driving — Aceable',
    keywords: ['new york defensive driving', 'ny traffic school', 'new york ticket dismissal', 'ny point reduction', 'new york online defensive driving', 'pirp new york'],
  },
  {
    url: 'https://www.aceable.com/defensive-driving/new-jersey/',
    productLine: 'defensive_driving',
    pageTitle: 'New Jersey Defensive Driving — Aceable',
    keywords: ['new jersey defensive driving', 'nj traffic school', 'new jersey ticket dismissal', 'nj online defensive driving'],
  },
  {
    url: 'https://www.aceable.com/defensive-driving/illinois/',
    productLine: 'defensive_driving',
    pageTitle: 'Illinois Defensive Driving — Aceable',
    keywords: ['illinois defensive driving', 'il traffic school', 'illinois ticket dismissal', 'illinois online defensive driving'],
  },
  {
    url: 'https://www.aceable.com/defensive-driving/georgia/',
    productLine: 'defensive_driving',
    pageTitle: 'Georgia Defensive Driving — Aceable',
    keywords: ['georgia defensive driving', 'ga traffic school', 'georgia ticket dismissal', 'georgia online defensive driving'],
  },
  {
    url: 'https://www.aceable.com/blog/best-online-traffic-school/',
    productLine: 'defensive_driving',
    pageTitle: 'Best Online Traffic School — Aceable',
    keywords: ['best online traffic school', 'top traffic school', 'traffic school review', 'traffic school comparison', 'best defensive driving course', 'cheapest traffic school', 'affordable defensive driving'],
  },
  {
    url: 'https://www.aceable.com/blog/how-to-dismiss-a-ticket/',
    productLine: 'defensive_driving',
    pageTitle: 'How to Dismiss a Traffic Ticket',
    keywords: ['how to dismiss ticket', 'traffic ticket dismissal', 'dismiss speeding ticket', 'how to clear traffic ticket', 'ticket dismissal process', 'defensive driving ticket', 'reduce insurance points'],
  },
];

export const PRODUCT_ROOT_URLS: Record<ProductLine, string> = {
  aceableagent: 'https://www.aceableagent.com/',
  drivers_ed: 'https://www.aceable.com/drivers-ed/',
  defensive_driving: 'https://www.aceable.com/defensive-driving/',
  unknown: 'https://www.aceable.com/',
};

export function getPageTitle(url: string): string {
  const entry = ACEABLE_URL_MAP.find(e => e.url === url);
  if (entry) return entry.pageTitle;

  // Derive from URL
  const path = url.replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '');
  if (!path) return 'Homepage';
  return path.split('/').filter(Boolean).map(s =>
    s.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  ).join(' — ');
}
