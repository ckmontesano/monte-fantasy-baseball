import { PLAYOFF_ROUNDS, PLAYOFF_SLOTS } from "../data/playoff-brackets-2026.js";
import { validateBracket } from "./playoff-scoring.js";

export const CHANCE_SIMULATIONS = 40000;

// Neutral model: independent 50/50 remaining games, starting from actual wins.
// Fixed seed keeps estimates stable until the real series scores change.
export function calculatePlayoffChances(series, brackets, simulations = CHANCE_SIMULATIONS) {
  if (series.length !== PLAYOFF_SLOTS.length || !Number.isInteger(simulations) || simulations < 1 ||
    !Object.values(brackets).every(validateBracket)) return null;
  const owners = Object.keys(brackets);
  if (!owners.length) return null;
  const firsts = owners.map(() => 0);
  const slots = PLAYOFF_SLOTS.map((slot) => ({ ...slot,
    actual: series.find((entry) => entry.id === slot.id),
    rule: PLAYOFF_ROUNDS.find((round) => round.id === slot.round),
    picks: owners.map((owner) => brackets[owner][slot.id]),
  }));
  if (slots.some((slot) => !slot.actual)) return null;
  let seed = 20261004;
  function coin() {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) < 2147483648;
  }
  for (let trial = 0; trial < simulations; trial++) {
    const winners = {};
    const totals = owners.map(() => 0);
    for (const slot of slots) {
      let winner = slot.actual.winnerId;
      let length = slot.actual.length;
      if (!winner) {
        const entrants = slot.sources.map((source) => typeof source === "number" ? source : winners[source]);
        let a = slot.actual.wins[entrants[0]] || 0;
        let b = slot.actual.wins[entrants[1]] || 0;
        while (a < slot.rule.winsNeeded && b < slot.rule.winsNeeded) {
          if (coin()) a++; else b++;
        }
        winner = entrants[a === slot.rule.winsNeeded ? 0 : 1];
        length = a + b;
      }
      winners[slot.id] = winner;
      slot.picks.forEach((pick, index) => {
        if (pick.winnerId === winner) totals[index] += slot.rule.points + Number(pick.length === length);
      });
    }
    const highest = Math.max(...totals);
    totals.forEach((total, index) => { if (total === highest) firsts[index]++; });
  }
  return Object.fromEntries(owners.map((owner, index) => [owner, firsts[index] / simulations * 100]));
}
