import { test } from "node:test";
import assert from "node:assert/strict";
import { PLAYOFF_BRACKETS, PLAYOFF_SLOTS, PLAYOFF_ROUNDS, PICK_LENGTH_ADJUSTMENTS } from "../data/playoff-brackets-2026.js";
import { normalizePlayoffSeries, scorePick, scoreBrackets, validateBracket, calculatePlayoffPayout, isPossibleSeriesLength } from "./playoff-scoring.js";

function game(pk, home, away, winner, round = "F", number = 1, state = "Final") {
  return { gamePk: pk, gameType: round, seriesGameNumber: number, status: { abstractGameState: state },
    teams: { home: { team: { id: home }, isWinner: winner === home }, away: { team: { id: away }, isWinner: winner === away } } };
}

test("submitted brackets contain eleven consistent picks with four audited length caps", () => {
  for (const picks of Object.values(PLAYOFF_BRACKETS)) assert.equal(validateBracket(picks), true);
  const impossible = Object.values(PLAYOFF_BRACKETS).flatMap((picks) =>
    PLAYOFF_SLOTS.filter((slot) => !isPossibleSeriesLength(picks[slot.id], slot.round)));
  assert.equal(impossible.length, 0);
  assert.equal(PICK_LENGTH_ADJUSTMENTS.length, 4);
  assert.equal(PLAYOFF_BRACKETS.Dad["AL-DS-2"].length, 5);
  assert.equal(PLAYOFF_BRACKETS.Dad["AL-DS-2"].submittedLength, 7);
  assert.equal(PLAYOFF_BRACKETS.Caden["NL-WC-1"].length, 3);
  assert.equal(PLAYOFF_BRACKETS.Caden["NL-WC-1"].submittedLength, 4);
  assert.equal(validateBracket({}), false);
  const invalid = structuredClone(PLAYOFF_BRACKETS.Cameron);
  invalid.WS.length = 2;
  assert.equal(validateBracket(invalid), false);
});

test("actual Wild Card results award the expected participant totals", () => {
  const games = [
    game(1, 147, 111, 147), game(2, 147, 111, 147, "F", 2),
    game(3, 117, 145, 145), game(4, 117, 145, 145, "F", 2),
    game(5, 135, 112, 135), game(6, 135, 112, 135, "F", 2),
    game(7, 144, 143, 144), game(8, 144, 143, 143, "F", 2), game(9, 144, 143, 144, "F", 3),
  ];
  const rows = scoreBrackets(normalizePlayoffSeries(games), PLAYOFF_BRACKETS);
  assert.deepEqual(Object.fromEntries(rows.map((row) => [row.owner, row.totalPoints])),
    { Jack: 21, Cameron: 16, Dad: 11, Caden: 16 });
  assert.equal(scorePick(PLAYOFF_BRACKETS.Dad["AL-DS-2"], { round: "D", winnerId: 145, length: 5 }).points, 11);
});

test("wrong winner never earns length bonus and unfinished series earn no points", () => {
  const entry = { round: "D", winnerId: 147, length: 4 };
  assert.equal(scorePick({ winnerId: 147, length: 4 }, entry).points, 11);
  assert.equal(scorePick({ winnerId: 147, length: 5 }, entry).points, 10);
  assert.equal(scorePick({ winnerId: 111, length: 4 }, entry).points, 0);
  assert.equal(scorePick({ winnerId: 147, length: 4 }, { ...entry, winnerId: null }).points, 0);
});

test("home/away reversals, duplicate and unfinished games do not corrupt clinching", () => {
  const first = game(1, 147, 111, 147);
  const series = normalizePlayoffSeries([first, first, game(2, 111, 147, 147, "F", 2), game(3, 147, 111, 111, "F", 3, "Preview")]);
  assert.equal(series[0].winnerId, 147);
  assert.equal(series[0].length, 2);
  assert.deepEqual(series.find((slot) => slot.id === "AL-DS-1").entrants, [139, 147]);
});

test("all eleven series produce 141 points for a perfect bracket with equal ranks for ties", () => {
  const games = [];
  const picks = {};
  for (const slot of PLAYOFF_SLOTS) {
    const entrants = slot.sources.map((source) => typeof source === "number" ? source : picks[source].winnerId);
    const round = PLAYOFF_ROUNDS.find((round) => round.id === slot.round);
    picks[slot.id] = { winnerId: entrants[0], length: round.winsNeeded };
    for (let n = 1; n <= round.winsNeeded; n++) games.push(game(games.length + 1, entrants[0], entrants[1], entrants[0], slot.round, n));
  }
  const series = normalizePlayoffSeries(games);
  const rows = scoreBrackets(series, { A: picks, B: picks });
  assert.equal(series.filter((entry) => entry.winnerId).length, 11);
  assert.equal(rows[0].totalPoints, 141);
  assert.equal(rows[1].rank, 1);
  assert.equal(rows[0].bonuses, 11);
  assert.equal(calculatePlayoffPayout(series, { A: picks, B: picks }, 200), null);
  assert.equal(calculatePlayoffPayout(series, { A: picks, B: picks }, 200, false).share, 100);
  assert.equal(calculatePlayoffPayout(series.slice(0, 10), { A: picks }, 200, false), null);
});

test("future picks for eliminated teams are labeled and missing brackets are not genuine zeros", () => {
  const series = normalizePlayoffSeries([game(1, 147, 111, 147), game(2, 147, 111, 147, "F", 2)]);
  const picks = structuredClone(PLAYOFF_BRACKETS.Cameron);
  picks["AL-DS-1"].winnerId = 111;
  const rows = scoreBrackets(series, { A: picks, B: null });
  assert.equal(rows.find((row) => row.owner === "A").details.find((detail) => detail.slotId === "AL-DS-1").status, "Eliminated pick");
  assert.equal(rows.find((row) => row.owner === "B").totalPoints, null);
});
