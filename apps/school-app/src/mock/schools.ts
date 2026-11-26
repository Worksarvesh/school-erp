/**
 * MOCK school directory for "Select Your School": state, then city, then district, then the
 * schools in that district. The real list comes from the school directory (open decision).
 */
export const SCHOOL_DIRECTORY: Record<string, Record<string, Record<string, string[]>>> = {
  Maharashtra: {
    Nagpur: {
      Nagpur: [
        'Radhakrishnan High School',
        'Saraswati Vidya Mandir',
        "St. Joseph's Convent School",
      ],
    },
    Pune: {
      Pune: ['Bright Future English School', 'Modern Public School'],
    },
    Mumbai: {
      'Mumbai City': ['Green Valley Public School', 'Lakeview High School'],
      'Mumbai Suburban': ['Sunrise International School', 'Holy Cross High School'],
    },
  },
  Karnataka: {
    Bengaluru: {
      'Bengaluru Urban': ['Cambridge Public School', 'National Hill View School'],
    },
    Mysuru: {
      Mysuru: ['Vidya Vikas School', 'Maharaja Public School'],
    },
  },
  Delhi: {
    'New Delhi': {
      'New Delhi': ['Delhi Public School', 'Modern Convent School'],
      'South Delhi': ['Sanskriti Vidyalaya', 'Springdale Senior School'],
    },
  },
};

export const stateOptions = (): string[] => Object.keys(SCHOOL_DIRECTORY);
export const cityOptions = (state: string): string[] => Object.keys(SCHOOL_DIRECTORY[state] ?? {});
export const districtOptions = (state: string, city: string): string[] =>
  Object.keys(SCHOOL_DIRECTORY[state]?.[city] ?? {});
export const schoolOptions = (state: string, city: string, district: string): string[] =>
  SCHOOL_DIRECTORY[state]?.[city]?.[district] ?? [];
