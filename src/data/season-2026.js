export const SEASON = 2026;

export const OWNERS = ["Cameron", "Caden", "Jack", "Dad"];

export const ROUND_MULTIPLIERS = {
  1: 1,
  2: 6 / 7,
  3: 5 / 7,
  4: 4 / 7,
  5: 3 / 7,
  6: 2 / 7,
  7: 1 / 7,
};

export const STAKES = {
  monthly: {
    wager: 20,
    payout: 60,
    months: ["April", "May", "June", "July", "August", "September"],
    excludes: ["March"],
  },
  allStar: {
    wager: 30,
    payout: 90,
  },
  playoffs: {
    wager: 50,
  },
  totalCommitment: 200,
};

export const TOTAL_SEASON_BUY_IN = STAKES.totalCommitment * OWNERS.length;

export const HOME_RUN_DERBY_PICKS = [
  { owner: "Cameron", playerId: 656941, playerName: "Kyle Schwarber" },
  { owner: "Caden", playerId: 808959, playerName: "Munetaka Murakami" },
  { owner: "Jack", playerId: 547180, playerName: "Kyle Schwarber" },
  { owner: "Dad", playerId: 691406, playerName: "Junior Caminero" },
];

export const TEAM_DRAFT_BOARD = [
  {
    teamId: 136,
    teamName: "Mariners",
    owner: "Dad",
    odds: -105,
    draftRound: 1,
  },
  { teamId: 143, teamName: "Phillies", owner: "Dad", odds: 190, draftRound: 2 },
  { teamId: 147, teamName: "Yankees", owner: "Dad", odds: 175, draftRound: 3 },
  { teamId: 113, teamName: "Reds", owner: "Dad", odds: 500, draftRound: 4 },
  {
    teamId: 114,
    teamName: "Guardians",
    owner: "Dad",
    odds: 420,
    draftRound: 5,
  },
  { teamId: 146, teamName: "Marlins", owner: "Dad", odds: 2700, draftRound: 6 },
  {
    teamId: 145,
    teamName: "White Sox",
    owner: "Dad",
    odds: 2000,
    draftRound: 7,
  },

  { teamId: 121, teamName: "Mets", owner: "Cameron", odds: 135, draftRound: 1 },
  {
    teamId: 141,
    teamName: "Blue Jays",
    owner: "Cameron",
    odds: 310,
    draftRound: 2,
  },
  {
    teamId: 140,
    teamName: "Rangers",
    owner: "Cameron",
    odds: 330,
    draftRound: 3,
  },
  {
    teamId: 134,
    teamName: "Pirates",
    owner: "Cameron",
    odds: 550,
    draftRound: 4,
  },
  {
    teamId: 137,
    teamName: "Giants",
    owner: "Cameron",
    odds: 1700,
    draftRound: 5,
  },
  {
    teamId: 133,
    teamName: "Athletics",
    owner: "Cameron",
    odds: 1300,
    draftRound: 6,
  },
  {
    teamId: 115,
    teamName: "Rockies",
    owner: "Cameron",
    odds: 30000,
    draftRound: 7,
  },

  { teamId: 116, teamName: "Tigers", owner: "Jack", odds: 115, draftRound: 1 },
  { teamId: 112, teamName: "Cubs", owner: "Jack", odds: 115, draftRound: 2 },
  { teamId: 111, teamName: "Red Sox", owner: "Jack", odds: 270, draftRound: 3 },
  { teamId: 144, teamName: "Braves", owner: "Jack", odds: 230, draftRound: 4 },
  { teamId: 117, teamName: "Astros", owner: "Jack", odds: 270, draftRound: 5 },
  { teamId: 142, teamName: "Twins", owner: "Jack", odds: 950, draftRound: 6 },
  { teamId: 139, teamName: "Rays", owner: "Jack", odds: 2000, draftRound: 7 },

  {
    teamId: 158,
    teamName: "Brewers",
    owner: "Caden",
    odds: 230,
    draftRound: 1,
  },
  { teamId: 135, teamName: "Padres", owner: "Caden", odds: 950, draftRound: 2 },
  {
    teamId: 119,
    teamName: "Dodgers",
    owner: "Caden",
    odds: -700,
    draftRound: 3,
  },
  { teamId: 118, teamName: "Royals", owner: "Caden", odds: 210, draftRound: 4 },
  {
    teamId: 109,
    teamName: "Diamondbacks",
    owner: "Caden",
    odds: 2200,
    draftRound: 5,
  },
  {
    teamId: 110,
    teamName: "Orioles",
    owner: "Caden",
    odds: 420,
    draftRound: 6,
  },
  {
    teamId: 108,
    teamName: "Angels",
    owner: "Caden",
    odds: 2700,
    draftRound: 7,
  },
];

export const UNDRAFTED_TEAMS = [
  { teamId: 120, teamName: "Nationals", odds: 10000 },
  { teamId: 138, teamName: "Cardinals", odds: 3000 },
];

export const TEAM_METADATA = [
  ...TEAM_DRAFT_BOARD,
  ...UNDRAFTED_TEAMS.map((team) => ({
    ...team,
    owner: "Undrafted",
    draftRound: null,
  })),
];

const TEAM_METADATA_MAP = new Map(
  TEAM_METADATA.map((team) => [team.teamId, team]),
);

export function getTeamSeasonMetadata(teamId) {
  return TEAM_METADATA_MAP.get(teamId) || null;
}

export function getRoundMultiplier(round) {
  return ROUND_MULTIPLIERS[round] ?? 0;
}

export function calculateBasePointsFromOdds(odds) {
  if (typeof odds !== "number" || Number.isNaN(odds) || odds === 0) {
    return null;
  }

  if (odds > 0) {
    return 100 * (odds / 100 + 1);
  }

  return 100 * (100 / Math.abs(odds) + 1);
}

export function calculateFantasyPoints(odds, draftRound) {
  const basePoints = calculateBasePointsFromOdds(odds);
  const multiplier = getRoundMultiplier(draftRound);

  if (basePoints === null || multiplier === 0) {
    return 0;
  }

  return Math.round(basePoints * multiplier);
}

export function formatAmericanOdds(odds) {
  if (typeof odds !== "number" || Number.isNaN(odds)) {
    return "N/A";
  }

  return odds > 0 ? `+${odds}` : `${odds}`;
}
