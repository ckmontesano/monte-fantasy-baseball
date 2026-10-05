import { PLAYOFF_ROUNDS, PLAYOFF_SLOTS } from "../data/playoff-brackets-2026.js";

export function normalizePlayoffSeries(games) {
  const uniqueGames = [...new Map(games.map((game) => [game.gamePk, game])).values()];
  const series = [];
  for (const slot of PLAYOFF_SLOTS) {
    const round = PLAYOFF_ROUNDS.find((round) => round.id === slot.round);
    const entrants = slot.sources.map((source) => typeof source === "number" ? source : series.find((entry) => entry.id === source)?.winnerId ?? null);
    const matching = entrants.every(Boolean) ? uniqueGames.filter((game) =>
      game.gameType === slot.round &&
      entrants.includes(game.teams?.home?.team?.id) && entrants.includes(game.teams?.away?.team?.id),
    ).sort((a, b) => a.seriesGameNumber - b.seriesGameNumber) : [];
    const wins = Object.fromEntries(entrants.filter(Boolean).map((id) => [id, 0]));
    let winnerId = null;
    let length = 0;
    for (const game of matching) {
      if (winnerId || game.status?.abstractGameState !== "Final") continue;
      const winningSide = [game.teams.home, game.teams.away].find((side) => side.isWinner === true);
      if (!winningSide) continue;
      wins[winningSide.team.id]++;
      length++;
      if (wins[winningSide.team.id] === round.winsNeeded) winnerId = winningSide.team.id;
    }
    series.push({ ...slot, entrants, wins, winnerId, length: winnerId ? length : null,
      status: winnerId ? "Complete" : length ? "In progress" : "Upcoming" });
  }
  return series;
}

export function scorePick(pick, series) {
  if (!pick) return { points: null, bonus: 0, status: "Bracket not provided" };
  if (!series.winnerId) return { points: 0, bonus: 0, status: "Pending" };
  if (pick.winnerId !== series.winnerId) return { points: 0, bonus: 0, status: "Incorrect" };
  const bonus = Number(pick.length === series.length);
  return { points: PLAYOFF_ROUNDS.find((round) => round.id === series.round).points + bonus,
    bonus, status: bonus ? "Correct + bonus" : "Correct winner" };
}

export function scoreBrackets(series, brackets) {
  const eliminated = new Set(series.filter((entry) => entry.winnerId)
    .flatMap((entry) => entry.entrants.filter((id) => id !== entry.winnerId)));
  const rows = Object.entries(brackets).map(([owner, picks]) => {
    const details = series.map((entry) => {
      const pick = picks?.[entry.id];
      const score = scorePick(pick, entry);
      if (pick && !entry.winnerId && eliminated.has(pick.winnerId)) score.status = "Eliminated pick";
      return { slotId: entry.id, pick, ...score };
    });
    const provided = validateBracket(picks) && series.length === PLAYOFF_SLOTS.length;
    return { owner, details, totalPoints: provided ? details.reduce((sum, detail) => sum + detail.points, 0) : null,
      correctWinners: details.filter((detail) => detail.status.startsWith("Correct")).length,
      bonuses: details.reduce((sum, detail) => sum + detail.bonus, 0) };
  }).sort((a, b) => (b.totalPoints ?? -1) - (a.totalPoints ?? -1));
  return rows.map((row, index) => ({ ...row, rank: row.totalPoints === null ? "—" :
    rows.findIndex((other) => other.totalPoints === row.totalPoints) + 1,
    leader: row.totalPoints !== null && row.totalPoints === rows[0]?.totalPoints, order: index }));
}

export function validateBracket(picks) {
  return PLAYOFF_SLOTS.every((slot) => {
    const pick = picks?.[slot.id];
    const round = PLAYOFF_ROUNDS.find((round) => round.id === slot.round);
    const entrants = slot.sources.map((source) => typeof source === "number" ? source : picks?.[source]?.winnerId);
    return pick && entrants.includes(pick.winnerId) && Number.isInteger(pick.length) &&
      pick.length >= round.winsNeeded;
  });
}

export function isPossibleSeriesLength(pick, roundId) {
  const round = PLAYOFF_ROUNDS.find((round) => round.id === roundId);
  return !!pick && Number.isInteger(pick.length) && pick.length >= round.winsNeeded &&
    pick.length <= round.winsNeeded * 2 - 1;
}

export function calculatePlayoffPayout(series, brackets, pool, placeholders = true) {
  if (placeholders || series.length !== 11 || !series.every((entry) => entry.winnerId) ||
    !Object.keys(brackets).length || !Object.values(brackets).every(validateBracket)) return null;
  const rows = scoreBrackets(series, brackets);
  const winners = rows.filter((row) => row.leader).map((row) => row.owner);
  return { winners, amount: pool, share: pool / winners.length };
}
