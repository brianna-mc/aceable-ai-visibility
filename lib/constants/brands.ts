import type { ProductLine } from '@/types';

export const BRAND_VARIANTS: Record<ProductLine, string[]> = {
  aceableagent: [
    'AceableAgent',
    'Aceable Agent',
    'aceableagent.com',
    'Aceable real estate',
    'Aceable realty',
    'Aceable RE school',
    'Aceable pre-license',
  ],
  drivers_ed: [
    'Aceable',
    'aceable.com',
    'Aceable drivers ed',
    'Aceable driver education',
    "Aceable driver's ed",
    'Aceable teen driving',
    'Aceable driving course',
  ],
  defensive_driving: [
    'Aceable',
    'aceable.com',
    'Aceable defensive driving',
    'Aceable traffic school',
    'Aceable ticket dismissal',
    'Aceable driving course',
  ],
  unknown: [
    'Aceable',
    'AceableAgent',
    'aceable.com',
    'aceableagent.com',
  ],
};

export const COMPETITOR_VARIANTS: Record<ProductLine, Record<string, string[]>> = {
  aceableagent: {
    'The CE Shop': ['The CE Shop', 'CEShop', 'ceshop.com', 'ce shop'],
    'Colibri Real Estate': ['Colibri', 'colibri.com', 'Colibri Real Estate', 'colibri real estate'],
    'Real Estate Express': ['Real Estate Express', 'realestatexpress.com', 'RealEstateExpress'],
    'Champions School': ['Champions School', 'Champions School of Real Estate', 'champions.edu', 'champions school'],
    'VanEd': ['VanEd', 'vaned.com'],
    'Kaplan Real Estate': ['Kaplan Real Estate', 'kaplanrealestate.com', 'Kaplan'],
    'OnCourse Learning': ['OnCourse Learning', 'oncourseleaning.com'],
  },
  drivers_ed: {
    'DriversEd.com': ['DriversEd.com', 'driversed.com', 'Drivers Ed.com'],
    'iDriveSafely': ['iDriveSafely', 'idrivesafely.com', 'I Drive Safely'],
    'Virtual Drive of Texas': ['Virtual Drive', 'virtualdrive.com', 'VDOT', 'Virtual Drive of Texas'],
    'Improv Traffic School': ['Improv', 'improv.com', 'Improv Traffic School'],
    'Zendrive': ['Zendrive', 'zendrive.com'],
    'Driving-Tests.org': ['Driving-Tests.org', 'driving-tests.org'],
  },
  defensive_driving: {
    'iDriveSafely': ['iDriveSafely', 'idrivesafely.com', 'I Drive Safely'],
    'Defensive Driving': ['defensivedriving.com', 'Defensive Driving.com'],
    'Improv Traffic School': ['Improv', 'improv.com', 'Improv Traffic School', 'Improv Comedy'],
    'Comedy Driving': ['Comedy Driving', 'comedydriving.com'],
    'TicketToothFairy': ['TicketToothFairy', 'tickettoothfairy.com', 'Ticket Tooth Fairy'],
    'National Safety Council': ['National Safety Council', 'nsc.org', 'NSC'],
    'DriversEd.com': ['DriversEd.com', 'driversed.com'],
  },
  unknown: {},
};

export function getCompetitorDomain(competitorName: string, productLine: ProductLine): string {
  const variants = COMPETITOR_VARIANTS[productLine];
  for (const [, variantList] of Object.entries(variants)) {
    if (variantList.some(v => v.toLowerCase() === competitorName.toLowerCase())) {
      const domainVariant = variantList.find(v => v.includes('.'));
      return domainVariant ?? competitorName.toLowerCase().replace(/\s+/g, '') + '.com';
    }
  }
  return competitorName.toLowerCase().replace(/\s+/g, '') + '.com';
}
