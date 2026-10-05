import { SEASON } from "../data/season-2026.js";

export async function fetchPlayoffGames(signal) {
  const url = new URL("https://statsapi.mlb.com/api/v1/schedule/");
  const params = { sportId: "1", season: String(SEASON), gameTypes: "F,D,L,W",
    startDate: `${SEASON}-09-20`, endDate: `${SEASON}-11-15`,
    fields: "dates,games,gamePk,gameType,seriesGameNumber,status,abstractGameState,teams,home,away,team,id,name,isWinner" };
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Postseason request failed (${response.status}).`);
  const data = await response.json();
  const games = (data.dates || []).flatMap((date) => date.games || []);
  if (!games.length) throw new Error("Postseason schedule is unavailable.");
  return games;
}
