const US_STATES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export type PadPlace = {
  /** The recognizable place, such as "California, USA" or "Japan". */
  place: string;
  /** The spaceport name before the first comma, when the feed includes one. */
  site: string | null;
};

/**
 * The feed stores "Vandenberg SFB, CA, USA" as one string.
 * The place is everything after the first comma. A US state abbreviation
 * expands only when that tail is "ST, USA".
 */
export function formatPadPlace(location: string): PadPlace {
  const comma = location.indexOf(",");
  if (comma <= 0) return { place: location, site: null };
  const site = location.slice(0, comma).trim();
  const region = location.slice(comma + 1).trim();
  if (!site || !region) return { place: location, site: null };
  return { place: expandUsRegion(region), site };
}

function expandUsRegion(region: string): string {
  const match = region.match(/^([A-Za-z]{2}),\s*USA$/i);
  if (!match) return region;
  const name = US_STATES[match[1].toUpperCase()];
  if (!name) return region;
  return `${name}, USA`;
}
