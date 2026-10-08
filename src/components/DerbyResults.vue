<script setup>
import { computed } from "vue";

const props = defineProps({
  rows: { type: Array, default: () => [] },
  picks: { type: Array, default: () => [] },
  isFinal: { type: Boolean, default: false },
});

const rounds = computed(() => {
  const numbers = [...new Set(props.rows.map((row) => row.round))].sort((a, b) => a - b);
  return numbers.map((number) => {
    const rows = props.rows.filter((row) => row.round === number);
    const rankedRows = rows.slice().sort((a, b) => b.homeRuns - a.homeRuns || a.playerName.localeCompare(b.playerName));
    const matchups = new Map();
    for (const row of rows) {
      const key = row.matchupId || `${number}-pool`;
      if (!matchups.has(key)) matchups.set(key, []);
      matchups.get(key).push(row);
    }
    return {
      number,
      label: rows[0].roundLabel,
      rows: rankedRows,
      matchups: number === 1
        ? [{ id: `${number}-pool`, batters: rankedRows }]
        : [...matchups].map(([id, batters]) => ({ id, batters })),
    };
  });
});
const finalRound = computed(() => rounds.value.at(-1));
const champion = computed(() => props.isFinal ? finalRound.value?.rows.find((row) => row.isWinner) : null);
const runnerUp = computed(() => finalRound.value?.rows.find((row) => !row.isWinner));
function owners(playerId) {
  return props.picks.filter((pick) => pick.playerId === playerId).map((pick) => pick.owner).join(" · ");
}
function resultLabel(row, round) {
  if (row.isWinner) {
    if (props.isFinal && round === finalRound.value?.number) return "Champion";
    return round === 1 ? "Advanced" : "Winner";
  }
  if (row.isComplete) return props.isFinal && round === finalRound.value?.number ? "Runner-up" : "Eliminated";
  return row.isStarted ? "In progress" : "Pending";
}
</script>

<template>
  <section aria-labelledby="derby-results-heading">
    <h3 id="derby-results-heading" class="mb-3 text-xl font-semibold">Derby Results</h3>
    <div v-if="champion" class="mb-5 rounded-xl border border-zinc-300 bg-zinc-100 p-5 dark:border-zinc-500 dark:bg-zinc-700">
      <p class="text-xs font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-200">Derby champion</p>
      <p class="mt-1 text-2xl font-semibold tracking-tight">{{ champion.playerName }}</p>
      <p v-if="runnerUp" class="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        Defeated {{ runnerUp.playerName }}
        <strong class="tabular-nums">{{ champion.homeRuns }}–{{ runnerUp.homeRuns }}</strong> in the final.
      </p>
    </div>

    <div v-if="rounds.length" class="grid items-start gap-5 lg:grid-cols-3">
      <section v-for="round in rounds" :key="round.number" :aria-labelledby="`derby-round-${round.number}`">
        <header class="mb-3 pb-3">
          <p class="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Stage {{ round.number }}</p>
          <h4 :id="`derby-round-${round.number}`" class="mt-1 text-lg font-semibold">{{ round.label }}</h4>
          <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {{ round.number === 1 ? 'Eight-player field · Top four advance' : `${round.rows.length} players · Head-to-head` }}
          </p>
        </header>

        <div class="space-y-4">
          <article v-for="(matchup, index) in round.matchups" :key="matchup.id" class="overflow-hidden rounded-xl border"
            :class="round.number === finalRound.number ? 'border-zinc-400 dark:border-zinc-500' : 'border-zinc-300 dark:border-zinc-700'">
            <h5 class="bg-zinc-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {{ round.matchups.length > 1 ? `Matchup ${index + 1}` : round.label }}
              <span class="float-right">HR</span>
            </h5>
            <ul class="divide-y divide-zinc-200 dark:divide-zinc-700">
              <li v-for="row in matchup.batters" :key="row.id" class="flex items-center justify-between gap-3 px-4 py-4"
                :class="row.isWinner ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-white dark:bg-zinc-900'">
                <div class="min-w-0">
                  <p class="font-semibold">{{ row.playerName }}</p>
                  <p v-if="owners(row.playerId)" class="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">Pick: {{ owners(row.playerId) }}</p>
                  <p class="mt-1 text-xs font-medium" :class="row.isWinner ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'">
                    {{ resultLabel(row, round.number) }}
                  </p>
                </div>
                <span class="text-2xl font-semibold tabular-nums">{{ row.homeRuns }}</span>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </div>
    <p v-else class="rounded-lg border border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
      Home Run Derby bracket results are unavailable.
    </p>
  </section>
</template>
