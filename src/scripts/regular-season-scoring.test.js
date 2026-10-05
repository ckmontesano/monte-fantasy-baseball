import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateRegularSeasonPoints } from "./regular-season-scoring.js";
import { PLAYOFF_PROBABILITIES, probabilityToAmericanOdds } from "../data/playoff-odds-2026.js";
import { TEAM_METADATA, calculateFantasyPoints } from "../data/season-2026.js";

function record(id, champion = false, clinched = true) {
  return {
    team: { id, name: `Team ${id}` },
    divisionChamp: champion, divisionLeader: champion,
    wildCardLeader: !champion, clinched,
  };
}

function league(champions, wildCards) {
  return Object.fromEntries(champions.map((id, index) => {
    const leader = record(id, true);
    return [index, { leader, standings: [leader, record(wildCards[index])] }];
  }));
}

const standings = {
  american: league([141, 114, 136], [147, 111, 116]),
  national: league([143, 158, 119], [112, 135, 113]),
};

test("all supplied probabilities cover the draft board and preserve exact return before rounding", () => {
  assert.equal(Object.keys(PLAYOFF_PROBABILITIES).length, 30);
  for (const team of TEAM_METADATA) {
    const percent = PLAYOFF_PROBABILITIES[team.teamId];
    assert.ok(percent > 0 && percent < 100);
    if (team.draftRound) {
      assert.equal(calculateFantasyPoints(probabilityToAmericanOdds(percent), team.draftRound),
        Math.round(10000 / percent * (8 - team.draftRound) / 7));
    }
  }
  assert.equal(probabilityToAmericanOdds(25), 300);
  assert.equal(probabilityToAmericanOdds(50), 100);
  assert.equal(calculateFantasyPoints(probabilityToAmericanOdds(60.8), 3), 117);
  for (const invalid of [undefined, null, NaN, 0, 100, -1, Infinity]) {
    assert.equal(probabilityToAmericanOdds(invalid), null);
  }
});

test("September includes six wild cards, never double-counts champions, and matches owner totals", () => {
  const result = calculateRegularSeasonPoints(standings, { september: true });
  assert.equal(result.isFinal, true);
  assert.equal(result.teams.length, 12);
  assert.equal(new Set(result.teams.map((team) => team.teamId)).size, 12);
  assert.equal(result.teams.filter((team) => team.qualification === "Wild card").length, 6);
  assert.equal(result.teams.find((team) => team.teamId === 111).points, 117);
  assert.equal(result.ownerPoints.Jack, 442); // Tigers 166 + Cubs 159 + Red Sox 117.
  assert.equal(result.owners.reduce((sum, owner) => sum + owner.totalPoints, 0),
    result.teams.reduce((sum, team) => sum + team.points, 0));
});

test("earlier months stay division-only; unclinched teams cannot finalize September", () => {
  assert.equal(calculateRegularSeasonPoints(standings).teams.length, 6);
  assert.equal(calculateRegularSeasonPoints(standings).isComplete, true);
  const pending = structuredClone(standings);
  pending.american[0].standings[1].clinched = false;
  const result = calculateRegularSeasonPoints(pending, { september: true });
  assert.equal(result.isFinal, false);
  assert.equal(result.teams.some((team) => team.teamId === 147), false);
  assert.equal(calculateRegularSeasonPoints(null, { september: true }).isFinal, false);
});

test("empty or partial monthly standings cannot be treated as completed scoring", () => {
  assert.equal(calculateRegularSeasonPoints(null).isComplete, false);
  assert.equal(calculateRegularSeasonPoints({}).isComplete, false);
  const partial = structuredClone(standings);
  partial.american[0].leader = null;
  assert.equal(calculateRegularSeasonPoints(partial).isComplete, false);
  delete partial.american;
  assert.equal(calculateRegularSeasonPoints(partial).isComplete, false);
});

test("undrafted qualifiers receive no points and missing probabilities prevent finalization", () => {
  const modified = structuredClone(standings);
  modified.national[0].standings[1] = record(120);
  const result = calculateRegularSeasonPoints(modified, { september: true });
  assert.equal(result.teams.find((team) => team.teamId === 120).points, 0);
  modified.national[0].standings[1] = record(999);
  assert.equal(calculateRegularSeasonPoints(modified, { september: true }).isFinal, false);
});

test("a contradictory divisionChamp flag cannot turn a wild card into a second division winner", () => {
  const modified = structuredClone(standings);
  // Reproduce the MLB NL East response: Braves lead, Phillies are WC #3,
  // but both carry divisionChamp: true.
  modified.national[0].leader = record(144, true);
  modified.national[0].standings = [modified.national[0].leader, {
    ...record(143), divisionChamp: true, divisionRank: "2", wildCardRank: "3",
  }];
  const result = calculateRegularSeasonPoints(modified, { september: true });
  assert.equal(result.isFinal, true);
  assert.equal(result.teams.length, 12);
  const phillies = result.teams.find((team) => team.teamId === 143);
  assert.equal(phillies.qualification, "Wild card");
  assert.equal(phillies.points, 125);
  assert.equal(result.teams.filter((team) => team.qualification === "Division winner").length, 6);
});
