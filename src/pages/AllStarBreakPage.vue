<script setup>
// dependencies
import { computed, ref, onMounted } from "vue";
import DataTable from "@/components/DataTable.vue";
import TabsComponent from "@/components/TabsComponent.vue";
import { getAllStarBreakData } from "@/scripts/allstar-break-logic.js";

// Tabs setup
const tabs = [
  { id: "allstar", label: "All-Star Game" },
  { id: "hrd", label: "Home Run Derby" },
];
const activeTab = ref("allstar");
function updateActiveTab(tabId) {
  activeTab.value = tabId;
}

// League tabs for mobile
const activeLeagueTab = ref("al");
function updateLeagueTab(tabId) {
  activeLeagueTab.value = tabId;
}

const allStarPlayers = ref([]);
const ownerPoints = ref({});
const winningLeague = ref(null);
const gameDate = ref(null);
const homeRunDerby = ref({
  gameDate: null,
  statusLabel: "Home Run Derby data has not been published yet.",
  currentRound: null,
  currentBatter: null,
  currentRoundTimeLeft: null,
  pickRows: [],
  bracketRows: [],
});

const ownerPointsColumns = [
  { key: "owner", label: "Owner", sortable: true },
  {
    key: "points",
    label: "Points",
    sortable: true,
    sortDirection: "desc",
  },
];

const rosterColumns = [
  { key: "fullName", label: "Player", sortable: true },
  { key: "teamName", label: "Team", sortable: true },
  { key: "owner", label: "Beneficiary", sortable: true },
  {
    key: "pointsAwarded",
    label: "Points",
    sortable: true,
    sortDirection: "desc",
  },
];

const hrdPickColumns = [
  { key: "owner", label: "Owner", sortable: true },
  { key: "playerName", label: "Pick", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "furthestRoundLabel", label: "Furthest Round", sortable: true },
  {
    key: "homeRuns",
    label: "HR",
    sortable: true,
    sortDirection: "desc",
  },
  {
    key: "points",
    label: "Points",
    sortable: true,
    sortDirection: "desc",
  },
];

const hrdBracketColumns = [
  { key: "roundLabel", label: "Round", sortable: true, sortValue: (row) => row.round },
  { key: "matchup", label: "Matchup", sortable: true },
  { key: "playerName", label: "Player", sortable: true },
  { key: "seed", label: "Seed", sortable: true },
  {
    key: "homeRuns",
    label: "HR",
    sortable: true,
    sortDirection: "desc",
  },
  { key: "result", label: "Result", sortable: true },
];

const leagueTabs = computed(() => [
  {
    id: "al",
    label: winningLeague.value === "American League" ? "American League 🏆" : "American League",
  },
  {
    id: "nl",
    label: winningLeague.value === "National League" ? "National League 🏆" : "National League",
  },
]);

const americanLeaguePlayers = computed(() =>
  allStarPlayers.value.filter((player) => player.asgTeamName === "American League"),
);

const nationalLeaguePlayers = computed(() =>
  allStarPlayers.value.filter((player) => player.asgTeamName === "National League"),
);

const ownerPointRows = computed(() =>
  Object.entries(ownerPoints.value)
    .map(([owner, points]) => ({ owner, points }))
    .sort((left, right) => right.points - left.points),
);

const homeRunDerbyPickRows = computed(() => homeRunDerby.value.pickRows || []);

const homeRunDerbyBracketRows = computed(() => homeRunDerby.value.bracketRows || []);

function formatGameDate(dateString) {
  if (!dateString) {
    return null;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${dateString}T12:00:00Z`));
}

onMounted(async () => {
  const {
    allStarPlayers: players,
    ownerPoints: points,
    winningLeague: winner,
    gameDate: officialDate,
    homeRunDerby: derbyData,
  } = await getAllStarBreakData();
  allStarPlayers.value = players;
  ownerPoints.value = points;
  winningLeague.value = winner;
  gameDate.value = officialDate;
  homeRunDerby.value = derbyData;

});
</script>

<template>
  <h1 class="my-2 text-4xl font-semibold tracking-tight">All-Star Break</h1>

  <p class="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
    All-Star Break scoring is a separate competition. These points do not count toward
    monthly regular-season standings or the season-long standings on the home page.
  </p>

  <h2 class="mb-2 text-2xl font-semibold">Points Overview</h2>
  <DataTable
    class="mb-8"
    :columns="ownerPointsColumns"
    :rows="ownerPointRows"
    row-key="owner"
    table-class="min-w-full border-collapse text-sm md:min-w-[420px]"
    empty-message="No All-Star points have been awarded yet." />

  <p v-if="formatGameDate(gameDate)" class="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
    Live All-Star data for {{ formatGameDate(gameDate) }}. Winning league and Home Run Derby bonuses apply automatically.
  </p>
  <p v-else class="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
    All-Star rosters will appear here once MLB publishes the current season game data.
  </p>

  <TabsComponent
    v-model="activeTab"
    :tabs="tabs"
    @update:modelValue="updateActiveTab" />

  <div v-show="activeTab === 'allstar'">
    <p class="mb-3">
      Players elected to the active roster for each All-Star team will each earn
      <b>6</b> points for the owner of the team they’re on, <b>6</b> extra
      points if their team (AL/NL) wins the All-Star game.
    </p>

    <!-- League Tabs for mobile (smaller sub-tabs, only visible on mobile) -->
    <div class="md:hidden">
      <TabsComponent
        v-model="activeLeagueTab"
        :tabs="leagueTabs"
        @update:modelValue="updateLeagueTab"
        class="mb-4 text-sm" />

      <div v-show="activeLeagueTab === 'al'">
        <DataTable
          :columns="rosterColumns"
          :rows="americanLeaguePlayers"
          row-key="id"
          empty-message="No American League All-Star data yet." />
      </div>
      <div v-show="activeLeagueTab === 'nl'">
        <DataTable
          :columns="rosterColumns"
          :rows="nationalLeaguePlayers"
          row-key="id"
          empty-message="No National League All-Star data yet." />
      </div>
    </div>

    <!-- Desktop: show both tables side-by-side -->
    <div class="hidden md:block">
      <div class="flex flex-row gap-10">
        <div class="min-w-0 flex-1">
          <h3 class="mb-2 text-xl font-semibold">
            {{ winningLeague === 'American League' ? 'American League 🏆' : 'American League' }}
          </h3>
          <DataTable
            :columns="rosterColumns"
            :rows="americanLeaguePlayers"
            row-key="id"
            empty-message="No American League All-Star data yet." />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="mb-2 text-xl font-semibold">
            {{ winningLeague === 'National League' ? 'National League 🏆' : 'National League' }}
          </h3>
          <DataTable
            :columns="rosterColumns"
            :rows="nationalLeaguePlayers"
            row-key="id"
            empty-message="No National League All-Star data yet." />
        </div>
      </div>
    </div>
  </div>

  <div v-show="activeTab === 'hrd'">
    <p class="mb-3">
      Home Run Derby is scored separately from the All-Star Game. A correct winner pick
      earns <b>40</b> points.
    </p>
    <p class="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
      If nobody picks the champion, the pick that advanced farthest wins instead. Ties
      still award the full 40 points to each tied winner.
    </p>
    <div class="mb-6 rounded-md border border-zinc-300 bg-zinc-100 px-4 py-3 text-sm dark:border-zinc-700 dark:bg-zinc-800/70">
      <p><strong>Status:</strong> {{ homeRunDerby.statusLabel }}</p>
      <p v-if="formatGameDate(homeRunDerby.gameDate)">
        <strong>Date:</strong> {{ formatGameDate(homeRunDerby.gameDate) }}
      </p>
      <p v-if="homeRunDerby.currentRound">
        <strong>Current Round:</strong> {{ homeRunDerby.currentRound }}
      </p>
      <p v-if="homeRunDerby.currentBatter">
        <strong>Current Batter:</strong> {{ homeRunDerby.currentBatter }}
      </p>
      <p v-if="homeRunDerby.currentRoundTimeLeft">
        <strong>Time Left:</strong> {{ homeRunDerby.currentRoundTimeLeft }}
      </p>
    </div>

    <h3 class="mb-2 text-xl font-semibold">Picks</h3>
    <DataTable
      class="mb-8"
      :columns="hrdPickColumns"
      :rows="homeRunDerbyPickRows"
      row-key="owner"
      empty-message="No Home Run Derby picks have been submitted yet." />

    <h3 class="mb-2 text-xl font-semibold">Derby Tracker</h3>
    <DataTable
      :columns="hrdBracketColumns"
      :rows="homeRunDerbyBracketRows"
      row-key="id"
      empty-message="MLB has not published Home Run Derby bracket data yet." />
  </div>
</template>
