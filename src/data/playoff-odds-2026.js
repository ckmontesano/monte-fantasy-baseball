// User-supplied FanGraphs "Make Playoffs" percentages, March 25, 2026.
export const PLAYOFF_ODDS_SOURCE = "https://www.fangraphs.com/standings/playoff-odds/fg/div?date=2026-03-25";
export const PLAYOFF_PROBABILITIES = {
  147: 78.8, 111: 60.8, 141: 52.8, 110: 44.5, 139: 28.9,
  116: 60.2, 118: 44.8, 142: 28.4, 114: 15.2, 145: 1.1,
  136: 79.6, 140: 46.3, 117: 32.8, 133: 21.4, 108: 4.1,
  121: 80.4, 144: 79.0, 143: 68.8, 146: 9.5, 120: 0.8,
  112: 54.0, 134: 45.3, 158: 42.6, 113: 17.7, 138: 8.5,
  119: 98.1, 109: 36.9, 137: 31.4, 135: 27.0, 115: 0.1,
};

export function probabilityToAmericanOdds(percent) {
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return null;
  const p = percent / 100;
  return p <= 0.5 ? 100 * (1 - p) / p : -100 * p / (1 - p);
}
