import {
  SEASON,
  calculateFantasyPoints,
  getTeamSeasonMetadata,
} from "@/data/season-2026.js";

const STANDINGS_CACHE_KEY = `mlb-standings-${SEASON}-v2`;
const STANDINGS_CACHE_TTL_MS = 60 * 60 * 1000;
const STANDINGS_FIELDS = [
  "records",
  "league",
  "id",
  "name",
  "division",
  "id",
  "name",
  "teamRecords",
  "team",
  "id",
  "name",
  "divisionLeader",
  "divisionChamp",
  "clinched",
  "wildCardLeader",
  "wins",
  "losses",
  "winningPercentage",
  "wildCardRank",
  "gamesBack",
  "divisionRank",
  "records",
  "splitRecords",
  "type",
  "wins",
  "losses",
  "pct",
].join(",");

const DIVISION_PATHS = {
  200: ["american", "west"],
  201: ["american", "east"],
  202: ["american", "central"],
  203: ["national", "west"],
  204: ["national", "east"],
  205: ["national", "central"],
};

function buildStandingsUrl(dateString = null) {
  const standingsUrl = new URL("https://statsapi.mlb.com/api/v1/standings");

  standingsUrl.searchParams.set("leagueId", "103,104");
  standingsUrl.searchParams.set("sportId", "1");
  standingsUrl.searchParams.set("season", String(SEASON));
  standingsUrl.searchParams.set("fields", STANDINGS_FIELDS);

  if (dateString) {
    standingsUrl.searchParams.set("date", dateString);
  }

  return standingsUrl;
}

function getStandingsCacheKey(dateString = null) {
  return `${STANDINGS_CACHE_KEY}-${dateString || "current"}`;
}

function createEmptyStandings() {
  return {
    american: {
      east: { name: "American League East", standings: [], leader: null },
      central: { name: "American League Central", standings: [], leader: null },
      west: { name: "American League West", standings: [], leader: null },
    },
    national: {
      east: { name: "National League East", standings: [], leader: null },
      central: { name: "National League Central", standings: [], leader: null },
      west: { name: "National League West", standings: [], leader: null },
    },
  };
}

function getSplitRecord(records, type) {
  return records?.splitRecords?.find((record) => record.type === type) || null;
}

function enrichTeamRecord(teamRecord) {
  const teamMetadata = getTeamSeasonMetadata(teamRecord.team.id);

  return {
    ...teamRecord,
    team: {
      ...teamRecord.team,
      owner: teamMetadata?.owner || "Undrafted",
      odds: teamMetadata?.odds ?? null,
      draftRound: teamMetadata?.draftRound ?? null,
      fantasyPoints: calculateFantasyPoints(
        teamMetadata?.odds ?? null,
        teamMetadata?.draftRound ?? null,
      ),
    },
    records: {
      ...teamRecord.records,
      home: getSplitRecord(teamRecord.records, "home"),
      away: getSplitRecord(teamRecord.records, "away"),
      lastTen: getSplitRecord(teamRecord.records, "lastTen"),
    },
  };
}

function normalizeStandings(records) {
  const standings = createEmptyStandings();

  for (const record of records || []) {
    const path = DIVISION_PATHS[record.division?.id];

    if (!path) {
      continue;
    }

    const [leagueKey, divisionKey] = path;
    const division = standings[leagueKey][divisionKey];

    division.name = record.division?.name || division.name;
    division.standings = (record.teamRecords || []).map(enrichTeamRecord);
    division.leader =
      division.standings.find((team) => team.divisionLeader === true) || null;
  }

  return standings;
}

function readCachedStandings(dateString = null) {
  const cachedValue = localStorage.getItem(getStandingsCacheKey(dateString));

  if (!cachedValue) {
    return null;
  }

  try {
    const cached = JSON.parse(cachedValue);

    if (!cached?.fetchedAt || !cached?.standings) {
      return null;
    }

    if (Date.now() - cached.fetchedAt > STANDINGS_CACHE_TTL_MS) {
      return null;
    }

    return cached;
  } catch {
    return null;
  }
}

function writeCachedStandings(standings, dateString = null) {
  const payload = {
    season: SEASON,
    fetchedAt: Date.now(),
    snapshotDate: dateString,
    standings,
  };

  localStorage.setItem(getStandingsCacheKey(dateString), JSON.stringify(payload));

  return payload;
}

export function getMlbStandingsCacheMetadata(dateString = null) {
  const cachedValue = localStorage.getItem(getStandingsCacheKey(dateString));

  if (!cachedValue) {
    return null;
  }

  try {
    const cached = JSON.parse(cachedValue);

    return cached?.fetchedAt
      ? {
          fetchedAt: cached.fetchedAt,
          season: cached.season || SEASON,
        }
      : null;
  } catch {
    return null;
  }
}

export default async function getMlbStandings({ forceRefresh = false, dateString = null } = {}) {
  if (!forceRefresh) {
    const cached = readCachedStandings(dateString);

    if (cached) {
      return cached;
    }
  }

  const response = await fetch(buildStandingsUrl(dateString).toString());

  if (!response.ok) {
    throw new Error(`MLB standings request failed with ${response.status}`);
  }

  const data = await response.json();
  const standings = normalizeStandings(data.records);

  return writeCachedStandings(standings, dateString);
}

export { STANDINGS_CACHE_KEY, STANDINGS_CACHE_TTL_MS };
