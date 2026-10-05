import { OWNERS, calculateFantasyPoints, getTeamSeasonMetadata, getRoundMultiplier } from "../data/season-2026.js";
import { PLAYOFF_PROBABILITIES, probabilityToAmericanOdds } from "../data/playoff-odds-2026.js";

export function calculateRegularSeasonPoints(standings, { september = false } = {}) {
  const teams = [];
  let finalLeagues = 0;
  let completeLeagues = 0;
  for (const league of Object.values(standings || {})) {
    const divisions = Object.values(league);
    if (divisions.length === 3 && divisions.every((division) => division.leader?.team?.id)) {
      completeLeagues++;
    }
    const records = divisions.flatMap((division) => division.standings || []);
    // MLB can retain a contradictory divisionChamp flag on a wild-card team.
    // A division champion must also be the actual division leader.
    const champions = records.filter((record) =>
      record.divisionChamp === true && record.divisionLeader === true,
    );
    const wildCards = records.filter((record) =>
      record.clinched === true && record.divisionLeader === false &&
      record.wildCardLeader === true,
    );
    if (champions.length === 3 && wildCards.length === 3) finalLeagues++;
    const winners = september ? champions : divisions.map((division) => division.leader).filter(Boolean);
    for (const record of [...winners, ...(september ? wildCards : [])]) {
      const team = getTeamSeasonMetadata(record.team.id);
      const isWildCard = september && wildCards.includes(record);
      const probability = isWildCard ? PLAYOFF_PROBABILITIES[record.team.id] : null;
      const odds = isWildCard ? probabilityToAmericanOdds(probability) : team?.odds;
      teams.push({
        teamId: record.team.id,
        teamName: record.team.name,
        owner: team?.owner || "Undrafted",
        qualification: isWildCard ? "Wild card" : "Division winner",
        probability, odds, draftRound: team?.draftRound,
        multiplier: getRoundMultiplier(team?.draftRound),
        points: odds == null ? null : calculateFantasyPoints(odds, team?.draftRound),
      });
    }
  }
  const owners = OWNERS.map((owner) => {
    const owned = teams.filter((team) => team.owner === owner);
    const divisionPoints = owned.filter((team) => team.qualification === "Division winner").reduce((sum, team) => sum + (team.points ?? 0), 0);
    const wildCardPoints = owned.filter((team) => team.qualification === "Wild card").reduce((sum, team) => sum + (team.points ?? 0), 0);
    return { owner, divisionPoints, wildCardPoints, totalPoints: divisionPoints + wildCardPoints };
  });
  return {
    teams, owners,
    isComplete: completeLeagues === 2 && teams.every((team) => team.points !== null),
    isFinal: september && finalLeagues === 2 && teams.every((team) => team.points !== null),
    ownerPoints: Object.fromEntries(owners.map((owner) => [owner.owner, owner.totalPoints])),
  };
}
