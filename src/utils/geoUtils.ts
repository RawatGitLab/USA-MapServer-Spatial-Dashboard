// Utility helpers for numbers, labels, color scales, and spatial lookups

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US');
}

export function formatCompactNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}

export const SUB_REGION_NAMES: Record<string, string> = {
  'Pacific': 'Pacific',
  'Mtn': 'Mountain',
  'W N Cen': 'West North Central',
  'E N Cen': 'East North Central',
  'Mid Atl': 'Middle Atlantic',
  'N Eng': 'New England',
  'S Atl': 'South Atlantic',
  'E S Cen': 'East South Central',
  'W S Cen': 'West South Central',
};

// Population choropleth color thresholds (for 2000 state population)
export function getPopulationColor(pop: number): string {
  return pop > 25000000 ? '#7c2d12' : // > 25M
         pop > 15000000 ? '#ea580c' : // 15M - 25M
         pop > 10000000 ? '#f97316' : // 10M - 15M
         pop > 6000000  ? '#fb923c' : // 6M - 10M
         pop > 3000000  ? '#fdba74' : // 3M - 6M
         pop > 1000000  ? '#fed7aa' : // 1M - 3M
                          '#ffedd5';  // < 1M
}

// Density choropleth color thresholds (people per sq mile)
export function getDensityColor(density: number): string {
  return density > 500 ? '#4c1d95' : // > 500 (NJ, RI, MA, DC, etc.)
         density > 250 ? '#6d28d9' : // 250 - 500
         density > 150 ? '#8b5cf6' : // 150 - 250
         density > 75  ? '#a78bfa' : // 75 - 150
         density > 35  ? '#c4b5fd' : // 35 - 75
         density > 15  ? '#ddd6fe' : // 15 - 35
                         '#ede9fe';  // < 15 (AK, WY, MT, etc.)
}

export const POPULATION_LEGEND_GRADES = [
  { label: '> 25M', color: '#7c2d12' },
  { label: '15M – 25M', color: '#ea580c' },
  { label: '10M – 15M', color: '#f97316' },
  { label: '6M – 10M', color: '#fb923c' },
  { label: '3M – 6M', color: '#fdba74' },
  { label: '1M – 3M', color: '#fed7aa' },
  { label: '< 1M', color: '#ffedd5' },
];

export const DENSITY_LEGEND_GRADES = [
  { label: '> 500 / mi²', color: '#4c1d95' },
  { label: '250 – 500', color: '#6d28d9' },
  { label: '150 – 250', color: '#8b5cf6' },
  { label: '75 – 150', color: '#a78bfa' },
  { label: '35 – 75', color: '#c4b5fd' },
  { label: '15 – 35', color: '#ddd6fe' },
  { label: '< 15 / mi²', color: '#ede9fe' },
];

export function getHighwayColor(type: string): string {
  const t = (type || '').toLowerCase();
  if (t.includes('interstate')) return '#ef4444'; // vibrant red
  if (t.includes('us')) return '#f87171'; // lighter red
  if (t.includes('toll')) return '#b91c1c'; // deep crimson red
  if (t.includes('state')) return '#dc2626'; // scarlet red
  return '#ef4444'; // default red
}

// Pre-defined state center coordinates for quick zooming
export const STATE_CENTERS: Record<string, [number, number]> = {
  AL: [32.806671, -86.79113],
  AK: [61.370716, -152.404419],
  AZ: [33.729759, -111.431221],
  AR: [34.969704, -92.373123],
  CA: [36.116203, -119.681564],
  CO: [39.059811, -105.311104],
  CT: [41.597782, -72.755371],
  DE: [39.318523, -75.507141],
  DC: [38.897438, -77.026817],
  FL: [27.766279, -81.686783],
  GA: [33.040619, -83.643071],
  HI: [21.094318, -157.498337],
  ID: [44.240459, -114.478828],
  IL: [40.349457, -88.986137],
  IN: [39.849426, -86.258278],
  IA: [42.011539, -93.210526],
  KS: [38.5266, -96.726486],
  KY: [37.66814, -84.670067],
  LA: [31.169546, -91.867805],
  ME: [44.693947, -69.381927],
  MD: [39.063946, -76.802101],
  MA: [42.230171, -71.530106],
  MI: [43.326618, -84.536095],
  MN: [45.694454, -93.900192],
  MS: [32.741646, -89.678696],
  MO: [38.456085, -92.288368],
  MT: [46.921925, -110.454353],
  NE: [41.12537, -98.268082],
  NV: [38.313515, -117.055374],
  NH: [43.452492, -71.563896],
  NJ: [40.298904, -74.521011],
  NM: [34.840515, -106.248482],
  NY: [42.165726, -74.948051],
  NC: [35.630066, -79.806419],
  ND: [47.528912, -99.784012],
  OH: [40.388783, -82.764915],
  OK: [35.565342, -96.928917],
  OR: [44.572021, -122.070938],
  PA: [40.590752, -77.209755],
  RI: [41.680893, -71.51178],
  SC: [33.856892, -80.945007],
  SD: [44.299782, -99.438828],
  TN: [35.747845, -86.692345],
  TX: [31.054487, -97.563461],
  UT: [40.150032, -111.862434],
  VT: [44.045876, -72.710686],
  VA: [37.769337, -78.169968],
  WA: [47.400902, -121.490494],
  WV: [38.491226, -80.954453],
  WI: [44.268543, -89.616508],
  WY: [42.755966, -107.30249],
};
