import { HOME_RUN_DERBY_PICKS, SEASON } from "@/data/season-2026.js";
import getMlbStandings from "@/scripts/mlb-standings.js";

const ALL_STAR_CACHE_KEY = `all-star-break-${SEASON}-v2`;
const ALL_STAR_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const HOME_RUN_DERBY_POINTS = 40;

function readCachedAllStarBreakData() {
  const cachedValue = localStorage.getItem(ALL_STAR_CACHE_KEY);

  if (!cachedValue) {
    return null;
  }

  try {
    const cached = JSON.parse(cachedValue);

    if (!cached?.fetchedAt || !cached?.payload) {
      return null;
    }

    if (Date.now() - cached.fetchedAt > ALL_STAR_CACHE_TTL_MS) {
      return null;
    }

    return cached.payload;
  } catch {
    return null;
  }
}

function writeCachedAllStarBreakData(payload) {
  localStorage.setItem(
    ALL_STAR_CACHE_KEY,
    JSON.stringify({
      fetchedAt: Date.now(),
      payload,
    }),
  );
}

function getOwnerByTeamId(teamId, standings) {
  for (const league of Object.values(standings || {})) {
    for (const division of Object.values(league)) {
      for (const teamRecord of division.standings || []) {
        if (teamRecord.team.id === teamId) {
          return teamRecord.team.owner || "Undrafted";
        }
      }
    }
  }

  return "Undrafted";
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}: ${url}`);
  }

  return response.json();
}

async function findAllStarGame() {
  const scheduleUrl = new URL("https://statsapi.mlb.com/api/v1/schedule");

  scheduleUrl.searchParams.set("sportId", "1");
  scheduleUrl.searchParams.set("season", String(SEASON));
  scheduleUrl.searchParams.set("startDate", `${SEASON}-07-01`);
  scheduleUrl.searchParams.set("endDate", `${SEASON}-07-31`);
  scheduleUrl.searchParams.set("gameType", "A");
  scheduleUrl.searchParams.set(
    "fields",
    [
      "dates",
      "games",
      "gamePk",
      "gameDate",
      "officialDate",
      "teams",
      "away",
      "team",
      "id",
      "name",
      "isWinner",
      "home",
      "status",
      "detailedState",
      "abstractGameState",
      "seriesDescription",
    ].join(","),
  );

  const schedule = await fetchJson(scheduleUrl.toString());
  const games = schedule.dates?.flatMap((date) => date.games || []) || [];

  return games[0] || null;
}

async function findHomeRunDerbyEvent() {
  const scheduleUrl = new URL("https://statsapi.mlb.com/api/v1/schedule");

  scheduleUrl.searchParams.set("sportId", "1");
  scheduleUrl.searchParams.set("season", String(SEASON));
  scheduleUrl.searchParams.set("startDate", `${SEASON}-07-01`);
  scheduleUrl.searchParams.set("endDate", `${SEASON}-07-31`);
  scheduleUrl.searchParams.set("gameTypes", "D");
  scheduleUrl.searchParams.set(
    "fields",
    [
      "dates",
      "games",
      "gamePk",
      "gameDate",
      "officialDate",
      "status",
      "detailedState",
      "abstractGameState",
      "seriesDescription",
    ].join(","),
  );

  const schedule = await fetchJson(scheduleUrl.toString());
  const games = schedule.dates?.flatMap((date) => date.games || []) || [];

  return games[0] || null;
}

function getEmptyHomeRunDerbyData(message = "Home Run Derby data has not been published yet.") {
  return {
    gamePk: null,
    gameDate: null,
    statusLabel: message,
    currentRound: null,
    currentBatter: null,
    currentRoundTimeLeft: null,
    pickRows: HOME_RUN_DERBY_PICKS.map((pick) => ({
      ...pick,
      status: "Pending",
      furthestRound: null,
      homeRuns: 0,
      points: 0,
    })),
    bracketRows: [],
    ownerPoints: {},
  };
}

function formatRound(round) {
  if (!round) {
    return "—";
  }

  if (round === 1) {
    return "Round 1";
  }

  if (round === 2) {
    return "Semifinal";
  }

  if (round === 3) {
    return "Final";
  }

  return `Round ${round}`;
}

function formatMatchup(matchup) {
  const topName = matchup?.topSeed?.player?.fullName;
  const bottomName = matchup?.bottomSeed?.player?.fullName;

  if (topName && bottomName) {
    return `${topName} vs. ${bottomName}`;
  }

  return "—";
}

function getBatterResult(batter) {
  if (batter.isWinner) {
    return "Won matchup";
  }

  if (batter.isComplete) {
    return "Eliminated";
  }

  if (batter.isStarted) {
    return "Active";
  }

  return "Pending";
}

function buildBracketRows(rounds = []) {
  return rounds.flatMap((round) => {
    if (round.matchups?.length) {
      return round.matchups.flatMap((matchup, matchupIndex) =>
        [matchup.topSeed, matchup.bottomSeed]
          .filter(Boolean)
          .map((batter) => ({
            id: `${round.round}-${matchupIndex}-${batter.player?.id || batter.seed}`,
            round: round.round,
            roundLabel: formatRound(round.round),
            matchup: formatMatchup(matchup),
            playerId: batter.player?.id || null,
            playerName: batter.player?.fullName || "TBD",
            seed: batter.seed ?? null,
            homeRuns: batter.numHomeRuns ?? 0,
            isStarted: Boolean(batter.isStarted),
            isComplete: Boolean(batter.isComplete),
            isWinner: Boolean(batter.isWinner),
            result: getBatterResult(batter),
          })),
      );
    }

    return (round.batters || []).map((batter) => ({
      id: `${round.round}-${batter.player?.id || batter.seed}`,
      round: round.round,
      roundLabel: formatRound(round.round),
      matchup: "—",
      playerId: batter.player?.id || null,
      playerName: batter.player?.fullName || "TBD",
      seed: batter.seed ?? null,
      homeRuns: batter.numHomeRuns ?? 0,
      isStarted: Boolean(batter.isStarted),
      isComplete: Boolean(batter.isComplete),
      isWinner: Boolean(batter.isWinner),
      result: getBatterResult(batter),
    }));
  });
}

function summarizePick(playerId, bracketRows) {
  const playerRows = bracketRows.filter((row) => row.playerId === playerId);
  const startedRows = playerRows.filter(
    (row) => row.isStarted || row.isComplete || row.isWinner || row.homeRuns > 0,
  );
  const latestRow = playerRows.slice().sort((left, right) => right.round - left.round)[0];
  const furthestRound = startedRows.reduce((highestRound, row) => Math.max(highestRound, row.round || 0), 0);
  const homeRuns = playerRows.reduce((total, row) => total + row.homeRuns, 0);

  return {
    furthestRound: furthestRound || null,
    homeRuns,
    latestRow,
  };
}

function buildPickRows(bracketRows, derbyStatus = {}) {
  const scheduledRounds = derbyStatus.scheduledRounds || Math.max(0, ...bracketRows.map((row) => row.round || 0));
  const winnerRows = bracketRows.filter((row) => row.isWinner);
  const championRow = winnerRows.slice().sort((left, right) => right.round - left.round)[0] || null;
  const state = derbyStatus.state || "";
  const isFinalState = /final|complete/i.test(state);
  const isComplete = Boolean(championRow && (isFinalState || championRow.round >= scheduledRounds));
  const championPickExists = isComplete && HOME_RUN_DERBY_PICKS.some((pick) => pick.playerId === championRow.playerId);
  const pickSummaries = HOME_RUN_DERBY_PICKS.map((pick) => ({
    ...pick,
    ...summarizePick(pick.playerId, bracketRows),
  }));
  const bestPickedRound = Math.max(0, ...pickSummaries.map((pick) => pick.furthestRound || 0));

  return pickSummaries.map((pick) => {
    let points = 0;
    let status = "Pending";

    if (isComplete && championRow?.playerId === pick.playerId) {
      points = HOME_RUN_DERBY_POINTS;
      status = "Champion";
    } else if (isComplete && !championPickExists && pick.furthestRound === bestPickedRound && bestPickedRound > 0) {
      points = HOME_RUN_DERBY_POINTS;
      status = `Furthest pick (${formatRound(pick.furthestRound)})`;
    } else if (pick.latestRow?.isComplete && !pick.latestRow?.isWinner) {
      status = `Eliminated in ${formatRound(pick.latestRow.round)}`;
    } else if (pick.latestRow?.isWinner) {
      status = pick.latestRow.round >= scheduledRounds
        ? "Awaiting final status"
        : `Advanced from ${formatRound(pick.latestRow.round)}`;
    } else if (pick.latestRow?.isStarted) {
      status = `Active in ${formatRound(pick.latestRow.round)}`;
    }

    return {
      owner: pick.owner,
      playerId: pick.playerId,
      playerName: pick.playerName,
      status,
      furthestRound: pick.furthestRound,
      furthestRoundLabel: pick.furthestRound ? formatRound(pick.furthestRound) : "—",
      homeRuns: pick.homeRuns,
      points,
    };
  });
}

async function getHomeRunDerbyData() {
  const derbyEvent = await findHomeRunDerbyEvent();

  if (!derbyEvent?.gamePk) {
    return getEmptyHomeRunDerbyData();
  }

  const derbyUrl = new URL(`https://statsapi.mlb.com/api/v1/homeRunDerby/${derbyEvent.gamePk}/bracket`);
  derbyUrl.searchParams.set(
    "fields",
    [
      "rounds",
      "round",
      "batters",
      "matchups",
      "topSeed",
      "bottomSeed",
      "player",
      "id",
      "fullName",
      "seed",
      "numHomeRuns",
      "isStarted",
      "isComplete",
      "isWinner",
      "status",
      "state",
      "currentRound",
      "scheduledRounds",
      "currentRoundTimeLeft",
      "currentBatter",
      "inTieBreaker",
      "bonusTime",
    ].join(","),
  );

  try {
    const derbyData = await fetchJson(derbyUrl.toString());
    const bracketRows = buildBracketRows(derbyData.rounds || []);
    const pickRows = buildPickRows(bracketRows, derbyData.status || {});
    const ownerPoints = Object.fromEntries(
      pickRows.filter((pick) => pick.points > 0).map((pick) => [pick.owner, pick.points]),
    );

    return {
      gamePk: derbyEvent.gamePk,
      gameDate: derbyEvent.officialDate || null,
      statusLabel: derbyData.status?.state || derbyEvent.status?.detailedState || "Scheduled",
      currentRound: derbyData.status?.currentRound || null,
      currentBatter: derbyData.status?.currentBatter?.fullName || null,
      currentRoundTimeLeft: derbyData.status?.currentRoundTimeLeft || null,
      pickRows,
      bracketRows,
      ownerPoints,
    };
  } catch {
    return getEmptyHomeRunDerbyData("Home Run Derby bracket data has not been published yet.");
  }
}

function combineOwnerPoints(...pointGroups) {
  const combinedPoints = {};

  for (const pointGroup of pointGroups) {
    for (const [owner, points] of Object.entries(pointGroup || {})) {
      combinedPoints[owner] = (combinedPoints[owner] || 0) + points;
    }
  }

  return combinedPoints;
}

function buildRosterAssignments(feed) {
  const assignments = new Map();
  const awayPlayers = Object.values(feed.liveData?.boxscore?.teams?.away?.players || {});
  const homePlayers = Object.values(feed.liveData?.boxscore?.teams?.home?.players || {});

  for (const player of awayPlayers) {
    if (player?.person?.id) {
      assignments.set(player.person.id, "American League");
    }
  }

  for (const player of homePlayers) {
    if (player?.person?.id) {
      assignments.set(player.person.id, "National League");
    }
  }

  return assignments;
}

function getWinningLeague(game) {
  if (game?.teams?.away?.isWinner) {
    return "American League";
  }

  if (game?.teams?.home?.isWinner) {
    return "National League";
  }

  return null;
}

export async function getAllStarBreakData({ forceRefresh = false } = {}) {
  if (!forceRefresh) {
    const cached = readCachedAllStarBreakData();

    if (cached) {
      return cached;
    }
  }

  const [{ standings: mlbStandings }, allStarGame, homeRunDerby] = await Promise.all([
    getMlbStandings(),
    findAllStarGame(),
    getHomeRunDerbyData(),
  ]);

  if (!allStarGame?.gamePk) {
    const emptyPayload = {
      mlbStandings,
      allStarPlayers: [],
      ownerPoints: combineOwnerPoints({}, homeRunDerby.ownerPoints),
      allStarGameOwnerPoints: {},
      homeRunDerby,
      winningLeague: null,
      gameDate: null,
    };

    writeCachedAllStarBreakData(emptyPayload);
    return emptyPayload;
  }

  const feedUrl = new URL(`https://statsapi.mlb.com/api/v1.1/game/${allStarGame.gamePk}/feed/live`);

  feedUrl.searchParams.set(
    "fields",
    [
      "gameData",
      "players",
      "id",
      "fullName",
      "liveData",
      "boxscore",
      "teams",
      "away",
      "players",
      "person",
      "id",
      "home",
      "players",
      "person",
      "id",
    ].join(","),
  );

  const feed = await fetchJson(feedUrl.toString());
  const rosterAssignments = buildRosterAssignments(feed);
  const personIds = Array.from(rosterAssignments.keys());

  if (personIds.length === 0) {
    const emptyPayload = {
      mlbStandings,
      allStarPlayers: [],
      ownerPoints: combineOwnerPoints({}, homeRunDerby.ownerPoints),
      allStarGameOwnerPoints: {},
      homeRunDerby,
      winningLeague: getWinningLeague(allStarGame),
      gameDate: allStarGame.officialDate || null,
    };

    writeCachedAllStarBreakData(emptyPayload);
    return emptyPayload;
  }

  const peopleUrl = new URL("https://statsapi.mlb.com/api/v1/people");
  peopleUrl.searchParams.set("personIds", personIds.join(","));
  peopleUrl.searchParams.set("hydrate", "currentTeam");
  peopleUrl.searchParams.set(
    "fields",
    "people,id,fullName,currentTeam,id,name",
  );

  const teamsUrl = new URL("https://statsapi.mlb.com/api/v1/teams");
  teamsUrl.searchParams.set("sportIds", "1");
  teamsUrl.searchParams.set("season", String(SEASON));
  teamsUrl.searchParams.set("fields", "teams,id,name,league,id,name");

  const [peopleData, teamsData] = await Promise.all([
    fetchJson(peopleUrl.toString()),
    fetchJson(teamsUrl.toString()),
  ]);

  const teamsById = new Map((teamsData.teams || []).map((team) => [team.id, team]));
  const winningLeague = getWinningLeague(allStarGame);
  const ownerPoints = {};

  const allStarPlayers = (peopleData.people || [])
    .filter((person) => person.currentTeam?.id)
    .map((person) => {
      const currentTeam = teamsById.get(person.currentTeam.id);
      const asgTeamName = rosterAssignments.get(person.id);
      const owner = getOwnerByTeamId(person.currentTeam.id, mlbStandings);
      const pointsAwarded = asgTeamName && asgTeamName === winningLeague ? 12 : 6;

      ownerPoints[owner] = (ownerPoints[owner] || 0) + pointsAwarded;

      return {
        id: person.id,
        fullName: person.fullName,
        teamId: person.currentTeam.id,
        teamName: person.currentTeam.name,
        teamLeagueName: currentTeam?.league?.name || null,
        asgTeamName,
        owner,
        pointsAwarded,
      };
    })
    .sort((left, right) => {
      if (left.asgTeamName === right.asgTeamName) {
        return left.teamName.localeCompare(right.teamName) || left.fullName.localeCompare(right.fullName);
      }

      return left.asgTeamName.localeCompare(right.asgTeamName);
    });

  const payload = {
    mlbStandings,
    allStarPlayers,
    ownerPoints: combineOwnerPoints(ownerPoints, homeRunDerby.ownerPoints),
    allStarGameOwnerPoints: ownerPoints,
    homeRunDerby,
    winningLeague,
    gameDate: allStarGame.officialDate || null,
  };

  writeCachedAllStarBreakData(payload);

  return payload;
}
