<script setup>
import { computed } from "vue";
import DataTable from "@/components/DataTable.vue";
import { useMlbStandings } from "@/composables/useMlbStandings.js";
import { calculateRegularSeasonPoints } from "@/scripts/regular-season-scoring.js";
import { PLAYOFF_ODDS_SOURCE } from "@/data/playoff-odds-2026.js";
import { SEASON, formatAmericanOdds } from "@/data/season-2026.js";

const { mlbStandings, error, isLoading, refreshMlbStandings } = useMlbStandings();
const scoring = computed(() => calculateRegularSeasonPoints(mlbStandings.value, { september: true }));
const owners = computed(() => [...scoring.value.owners].sort((a, b) => b.totalPoints - a.totalPoints));
const ownerColumns = [
  { key: "owner", label: "Owner", sortable: true },
  { key: "divisionPoints", label: "Division points", sortable: true },
  { key: "wildCardPoints", label: "Wild-card points", sortable: true },
  { key: "totalPoints", label: "September total", sortable: true },
];
const teamColumns = [
  { key: "teamName", label: "Team", sortable: true },
  { key: "owner", label: "Owner", sortable: true },
  { key: "qualification", label: "Qualification", sortable: true },
  { key: "probability", label: "Make Playoffs", sortable: true },
  { key: "odds", label: "Scoring odds", sortable: true },
  { key: "draftRound", label: "Round", sortable: true },
  { key: "multiplier", label: "Multiplier", sortable: true },
  { key: "points", label: "Points", sortable: true },
];

function refresh() {
  refreshMlbStandings().catch(() => {});
}
</script>

<template>
  <section class="space-y-4">
    <h2 class="text-2xl font-semibold">September {{ SEASON }} Point Earnings</h2>
    <p class="text-sm text-zinc-600 dark:text-zinc-300">
      Division winners earn division-odds points. Playoff qualifiers that did not win
      their division earn points from their fixed Make Playoffs probability, using
      the same $100 return and draft-round multiplier. No team earns both awards.
    </p>
    <p v-if="error" role="alert">Unable to load September results. Please retry.</p>
    <button class="accent-link" :disabled="isLoading" @click="refresh">
      {{ isLoading ? "Loading…" : "Refresh results" }}
    </button>
    <template v-if="mlbStandings">
      <p role="status" class="font-semibold">
        {{ scoring.isFinal ? "Final qualification results — September earnings" : "Pending — partial points for confirmed qualifiers only; September totals are not final." }}
      </p>
      <DataTable :columns="ownerColumns" :rows="owners" row-key="owner" />
      <h3 class="text-xl font-semibold">Team Breakdown</h3>
      <DataTable :columns="teamColumns" :rows="scoring.teams" row-key="teamId"
        empty-message="No confirmed division winners or wild-card qualifiers yet.">
        <template #cell-probability="{ row }">{{ row.probability == null ? '—' : `${row.probability}%` }}</template>
        <template #cell-odds="{ row }">{{ row.odds == null ? 'Unavailable' : formatAmericanOdds(Number(row.odds.toFixed(2))) }}</template>
        <template #cell-draftRound="{ row }">{{ row.draftRound ?? '—' }}</template>
        <template #cell-multiplier="{ row }">{{ row.draftRound ? (row.draftRound === 1 ? '1' : `${8 - row.draftRound}/7`) : '—' }}</template>
        <template #cell-points="{ row }">{{ row.points ?? 'Unavailable' }}</template>
      </DataTable>
    </template>
    <p class="text-sm text-zinc-600 dark:text-zinc-300">
      Source: <a class="accent-link" :href="PLAYOFF_ODDS_SOURCE" target="_blank" rel="noreferrer">FanGraphs, March 25, 2026</a>
      (user-supplied Make Playoffs percentages). Odds are displayed to two decimal places;
      only final team points are rounded for scoring. Undrafted teams earn no owner points.
    </p>
  </section>
</template>
