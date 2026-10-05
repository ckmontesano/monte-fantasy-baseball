import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAYOFF_SLOTS, PLAYOFF_ROUNDS } from "../data/playoff-brackets-2026.js";
import { calculatePlayoffChances } from "./playoff-chances.js";

function worldSeriesFixture() {
  const picks = {};
  const series = PLAYOFF_SLOTS.map((slot) => {
    const rule = PLAYOFF_ROUNDS.find((round) => round.id === slot.round);
    const entrants = slot.sources.map((source) => typeof source === "number" ? source : picks[source].winnerId);
    picks[slot.id] = { winnerId: entrants[0], length: rule.winsNeeded };
    return { ...slot, entrants, winnerId: slot.id === "WS" ? null : entrants[0],
      length: slot.id === "WS" ? null : rule.winsNeeded,
      wins: Object.fromEntries(entrants.map((id, i) => [id, slot.id === "WS" ? 0 : i === 0 ? rule.winsNeeded : 0])) };
  });
  const other = structuredClone(picks);
  other.WS.winnerId = series.at(-1).entrants[1];
  return { series, brackets: { A: picks, B: other } };
}

test("neutral World Series begins near 50/50 and a 3-0 lead uses existing wins", () => {
  const { series, brackets } = worldSeriesFixture();
  const initial = calculatePlayoffChances(series, brackets, 20000);
  assert.ok(Math.abs(initial.A - 50) < 1);
  assert.ok(Math.abs(initial.B - 50) < 1);
  series.at(-1).wins[series.at(-1).entrants[0]] = 3;
  const ahead = calculatePlayoffChances(series, brackets, 20000);
  assert.ok(Math.abs(ahead.A - 93.75) < 1);
  assert.deepEqual(ahead, calculatePlayoffChances(series, brackets, 20000));
});

test("finished results are certain and identical brackets include both tied winners", () => {
  const { series, brackets } = worldSeriesFixture();
  const tied = calculatePlayoffChances(series, { A: brackets.A, B: brackets.A }, 100);
  assert.deepEqual(tied, { A: 100, B: 100 });
  series.at(-1).winnerId = series.at(-1).entrants[0];
  series.at(-1).length = 4;
  assert.deepEqual(calculatePlayoffChances(series, brackets, 100), { A: 100, B: 0 });
  assert.equal(calculatePlayoffChances([], brackets), null);
  assert.equal(calculatePlayoffChances(series, { A: {} }), null);
});
