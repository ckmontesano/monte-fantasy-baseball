<script setup>
import { computed, ref, watch } from "vue";
import DataTable from "@/components/DataTable.vue";
import TabsComponent from "@/components/TabsComponent.vue";
import { SEASON, TEAM_METADATA, OWNERS, STAKES } from "@/data/season-2026.js";
import { PLAYOFF_ROUNDS, PLAYOFF_BRACKETS, PICKS_ARE_PLACEHOLDERS, PICK_LENGTH_ADJUSTMENTS } from "@/data/playoff-brackets-2026.js";
import { usePlayoffs } from "@/composables/usePlayoffs.js";
import { scoreBrackets } from "@/scripts/playoff-scoring.js";
import getTeamLogoURL from "@/scripts/mlb-team-logos.js";

const { series, error, isLoading, fetchedAt } = usePlayoffs();
const activeRound = ref("F");
let initialized = false;
watch(series, (value) => {
  if (!value || initialized) return;
  activeRound.value = value.find((entry) => entry.status === "In progress")?.round ||
    value.find((entry) => entry.status !== "Complete")?.round || "W";
  initialized = true;
});
const rows = computed(() => scoreBrackets(series.value || [], PLAYOFF_BRACKETS));
const completed = computed(() => series.value?.filter((entry) => entry.winnerId).length || 0);
const currentRound = computed(() => PLAYOFF_ROUNDS.find((round) => round.id ===
  (series.value?.find((entry) => entry.status === "In progress")?.round || series.value?.find((entry) => !entry.winnerId)?.round || "W"))?.label);
const shownSeries = computed(() => series.value?.filter((entry) => entry.round === activeRound.value) || []);
const tabs = PLAYOFF_ROUNDS.map((round) => ({ id: round.id, label: round.label }));
const columns = [
  { key: "rank", label: "Rank" }, { key: "owner", label: "Participant" },
  { key: "totalPoints", label: "Points" }, { key: "correctWinners", label: "Correct winners" },
  { key: "bonuses", label: "Length bonuses" },
];
const pickColumns = [
  { key: "owner", label: "Participant" }, { key: "prediction", label: "Prediction" },
  { key: "status", label: "Status" }, { key: "points", label: "Points" },
];
const updated = computed(() => fetchedAt.value ? new Date(fetchedAt.value).toLocaleString() : null);
function teamName(id) { return TEAM_METADATA.find((team) => team.teamId === id)?.teamName || "TBD"; }
function predictions(entry) {
  return rows.value.map((row) => {
    const detail = row.details.find((detail) => detail.slotId === entry.id);
    return { owner: row.owner, prediction: detail?.pick ? `${teamName(detail.pick.winnerId)} in ${detail.pick.length}` : "Bracket not provided",
      status: detail?.status, points: detail?.status === "Pending" ? "—" : detail?.points ?? "—" };
  });
}
</script>

<template>
  <section class="space-y-6">
    <header>
      <h1 class="text-4xl font-semibold tracking-tight">Playoffs</h1>
      <p class="mt-2 text-zinc-600 dark:text-zinc-300">
        {{ SEASON }} · ${{ STAKES.playoffs.wager * OWNERS.length }} pool
        <template v-if="series"> · {{ currentRound }} · {{ completed }} of 11 series completed</template>
      </p>
      <p v-if="updated" class="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Last updated: {{ updated }} · Updates every minute while this page is visible.</p>
    </header>
    <p v-if="PICKS_ARE_PLACEHOLDERS" class="rounded-lg border border-amber-500 bg-amber-50 p-4 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
      <strong>Sample brackets:</strong> All predictions and fantasy scores below are examples,
      not the league's submitted picks. MLB series results are live. No sample winnings are added to season balances.
    </p>
    <p v-if="error" role="alert" class="rounded-lg border border-red-500 p-3">
      {{ error.message }} {{ series ? 'Showing last-known results; scores may be out of date.' : 'Fantasy standings are unavailable until results load.' }}
    </p>
    <p v-if="!series && isLoading" role="status">Loading postseason results…</p>
    <template v-if="series">
      <section>
        <h2 class="mb-3 text-2xl font-semibold">{{ PICKS_ARE_PLACEHOLDERS ? 'Sample Fantasy Standings' : 'Fantasy Standings' }}</h2>
        <DataTable :columns="columns" :rows="rows" row-key="owner"
          :row-class="row => row.leader ? 'font-bold bg-zinc-200 dark:bg-zinc-700' : 'odd:bg-zinc-100 odd:dark:bg-zinc-800/70'">
          <template #cell-totalPoints="{ row }">{{ row.totalPoints ?? 'Bracket not provided' }}</template>
        </DataTable>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Completed series only: 5 / 10 / 20 / 30 points by round. +1 for the exact length when the winner is correct.</p>
        <p v-if="completed === 11" class="mt-3 font-semibold">
          {{ PICKS_ARE_PLACEHOLDERS ? 'Sample winners' : 'Winners' }}:
          {{ rows.filter(row => row.leader).map(row => row.owner).join(', ') }}
          <template v-if="!PICKS_ARE_PLACEHOLDERS"> · ${{ (STAKES.playoffs.wager * OWNERS.length / rows.filter(row => row.leader).length).toFixed(2) }} each, including returned deposits</template>
        </p>
      </section>
      <section>
        <h2 class="mb-3 text-2xl font-semibold">Series & Predictions</h2>
        <TabsComponent v-model="activeRound" :tabs="tabs" />
        <div class="grid gap-4 lg:grid-cols-2">
          <article v-for="entry in shownSeries" :key="entry.id" class="min-w-0 rounded-lg border border-zinc-300 p-4 dark:border-zinc-600">
            <div class="mb-3 flex items-center justify-between gap-2">
              <h3 class="font-semibold">{{ entry.label }}</h3>
              <span class="rounded bg-zinc-200 px-2 py-1 text-xs dark:bg-zinc-700">{{ entry.status }}</span>
            </div>
            <div v-for="(id, index) in entry.entrants" :key="index" class="mb-2 flex items-center gap-2 text-lg">
              <img v-if="id" :src="getTeamLogoURL(id)" alt="" class="h-6 w-6" />
              <span class="flex-1" :class="entry.winnerId === id ? 'font-bold' : ''">{{ teamName(id) }}</span>
              <strong>{{ id ? entry.wins[id] : '—' }}</strong>
            </div>
            <p class="mb-4 text-sm text-zinc-600 dark:text-zinc-300">
              {{ entry.winnerId ? `${teamName(entry.winnerId)} won in ${entry.length} games` : `Best of ${PLAYOFF_ROUNDS.find(round => round.id === entry.round).winsNeeded * 2 - 1}` }}
            </p>
            <DataTable :columns="pickColumns" :rows="predictions(entry)" row-key="owner">
              <template #cell-status="{ row }"><span :class="row.status?.startsWith('Correct') ? 'font-semibold text-green-700 dark:text-green-400' : ''">{{ row.status }}</span></template>
            </DataTable>
          </article>
        </div>
      </section>
      <section v-if="PICK_LENGTH_ADJUSTMENTS.length" class="rounded-lg border border-zinc-300 p-4 dark:border-zinc-600">
        <h2 class="mb-2 text-xl font-semibold">Series-Length Adjustments</h2>
        <p class="mb-2 text-sm">Picks exceeding a round's maximum length are rounded down to its last possible game. The adjusted length is used for scoring, including the bonus.</p>
        <ul class="ml-5 list-disc space-y-2 text-sm">
          <li v-for="adjustment in PICK_LENGTH_ADJUSTMENTS" :key="`${adjustment.owner}-${adjustment.slot.id}`">
            <strong>{{ adjustment.owner }}</strong> · {{ adjustment.slot.label }}:
            {{ teamName(adjustment.winnerId) }} in {{ adjustment.submittedLength }} → in {{ adjustment.length }}
            (best of {{ adjustment.length }}).
          </li>
        </ul>
      </section>
    </template>
  </section>
</template>
