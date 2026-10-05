import { ref, onMounted } from "vue";
import { SEASON, STAKES, OWNERS } from "@/data/season-2026.js";
import { PLAYOFF_BRACKETS, PICKS_ARE_PLACEHOLDERS } from "@/data/playoff-brackets-2026.js";
import { calculatePlayoffPayout, normalizePlayoffSeries } from "@/scripts/playoff-scoring.js";
import { fetchPlayoffGames } from "@/scripts/mlb-playoffs.js";
import { calculateRegularSeasonPoints } from "@/scripts/regular-season-scoring.js";
import { getAllStarBreakData } from "@/scripts/allstar-break-logic.js";
import getMlbStandings from "@/scripts/mlb-standings.js";

const payoutHistory = ref([]);
const isLoading = ref(false);
const error = ref(null);

let hasLoaded = false;
let pendingRequest = null;

const MONTH_LABELS = [
  { label: "April", monthNumber: 4 },
  { label: "May", monthNumber: 5 },
  { label: "June", monthNumber: 6 },
  { label: "July", monthNumber: 7 },
  { label: "August", monthNumber: 8 },
  { label: "September", monthNumber: 9 },
];

function getCompletedScoringMonths(now = new Date()) {
  const currentYear = now.getFullYear();
  const currentMonthNumber = now.getMonth() + 1;

  if (currentYear < SEASON) {
    return [];
  }

  if (currentYear > SEASON) {
    return MONTH_LABELS;
  }

  return MONTH_LABELS.filter(({ monthNumber }) => monthNumber < currentMonthNumber);
}

function getMonthEndDate(monthNumber) {
  return new Date(Date.UTC(SEASON, monthNumber, 0)).toISOString().slice(0, 10);
}

function buildPayoutEntry(label, snapshotDate, standings) {
  const scoring = calculateRegularSeasonPoints(standings, { september: label === "September" });
  if (label === "September" && !scoring.isFinal) return null;
  if (label !== "September" && !scoring.isComplete) {
    throw new Error(`${label} standings are incomplete. Payout totals are unavailable until all six division leaders are available.`);
  }
  const { ownerPoints } = scoring;
  const sortedOwners = Object.entries(ownerPoints).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );
  const topPoints = sortedOwners[0]?.[1] ?? null;
  const winners = sortedOwners
    .filter(([, points]) => points === topPoints)
    .map(([owner]) => owner);

  return {
    date: label,
    winner: winners.join(", "),
    amount: STAKES.monthly.payout,
    snapshotDate,
  };
}

function buildAllStarPayoutEntry(gameDate, ownerPoints) {
  const sortedOwners = Object.entries(ownerPoints).sort(
    (left, right) => right[1] - left[1] || left[0].localeCompare(right[0]),
  );
  const topPoints = sortedOwners[0]?.[1] ?? null;

  if (topPoints == null) {
    return null;
  }

  const winners = sortedOwners
    .filter(([, points]) => points === topPoints)
    .map(([owner]) => owner);

  return {
    date: "All-Star Break",
    winner: winners.join(", "),
    amount: STAKES.allStar.payout,
    snapshotDate: gameDate,
  };
}

async function loadPayoutHistory({ forceRefresh = false } = {}) {
  if (pendingRequest) {
    return pendingRequest;
  }

  isLoading.value = true;
  error.value = null;

  pendingRequest = Promise.all([
    Promise.all(
      getCompletedScoringMonths().map(async ({ label, monthNumber }) => {
        const snapshotDate = getMonthEndDate(monthNumber);
        // Season standings retain final regular-season qualifiers during the playoffs.
        const { standings } = await getMlbStandings({ dateString: monthNumber === 9 ? null : snapshotDate, forceRefresh });

        return buildPayoutEntry(label, snapshotDate, standings);
      }),
    ),
    getAllStarBreakData(),
    PICKS_ARE_PLACEHOLDERS ? Promise.resolve(null) : fetchPlayoffGames().then((games) => {
      const result = calculatePlayoffPayout(normalizePlayoffSeries(games), PLAYOFF_BRACKETS,
        STAKES.playoffs.wager * OWNERS.length, false);
      if (!result) return null;
      const finalGames = games.filter((game) => game.gameType === "W" && game.status?.abstractGameState === "Final");
      return { date: "Playoffs", winner: result.winners.join(", "), amount: result.amount,
        snapshotDate: `${SEASON}-playoffs`, gamePk: finalGames.at(-1)?.gamePk };
    }),
  ])
    .then(([monthlyHistory, allStarData, playoffEntry]) => {
      const history = monthlyHistory.filter(Boolean);
      if (playoffEntry) history.push(playoffEntry);
      const gameDate = allStarData?.gameDate;
      const ownerPoints = allStarData?.ownerPoints || {};

      if (gameDate && new Date(`${gameDate}T23:59:59Z`) <= new Date()) {
        const allStarEntry = buildAllStarPayoutEntry(gameDate, ownerPoints);

        if (allStarEntry) {
          history.push(allStarEntry);
        }
      }

      payoutHistory.value = history;
      hasLoaded = true;
      return history;
    })
    .catch((err) => {
      error.value = err;
      throw err;
    })
    .finally(() => {
      isLoading.value = false;
      pendingRequest = null;
    });

  return pendingRequest;
}

export function usePayoutHistory() {
  onMounted(() => {
    if (!hasLoaded) {
      loadPayoutHistory().catch(() => {});
    }
  });

  return {
    payoutHistory,
    isLoading,
    error,
    refreshPayoutHistory: () => loadPayoutHistory({ forceRefresh: true }),
  };
}
