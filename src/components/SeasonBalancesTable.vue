<script setup>
import { computed } from "vue";
import DataTable from "@/components/DataTable.vue";
import { usePayoutHistory } from "@/composables/usePayoutHistory.js";
import { OWNERS, SEASON, TOTAL_SEASON_BUY_IN } from "@/data/season-2026.js";

const { isLoading, payoutHistory, error, refreshPayoutHistory } = usePayoutHistory();

function retry() {
  refreshPayoutHistory().catch(() => {});
}

const columns = [
  { key: "owner", label: "Owner", sortable: true },
  {
    key: "winnings",
    label: "Season Winnings",
    sortable: true,
    sortDirection: "desc",
  },
];

function formatCurrency(amount) {
  return Number.isInteger(amount) ? `$${amount}` : `$${amount.toFixed(2)}`;
}

function getWinners(entry) {
  return String(entry.winner || "")
    .split(",")
    .map((winner) => winner.trim())
    .filter(Boolean);
}

const rows = computed(() => {
  const winningsByOwner = Object.fromEntries(OWNERS.map((owner) => [owner, 0]));

  for (const entry of payoutHistory.value) {
    const winners = getWinners(entry).filter((winner) => winningsByOwner[winner] !== undefined);

    if (winners.length === 0) {
      continue;
    }

    const winnerShare = entry.amount / winners.length;

    for (const winner of winners) {
      winningsByOwner[winner] += winnerShare;
    }
  }

  return OWNERS.map((owner) => ({
    owner,
    winnings: winningsByOwner[owner],
  })).sort((left, right) => right.winnings - left.winnings || left.owner.localeCompare(right.owner));
});

const totalSeasonWinnings = computed(() => rows.value.reduce((total, row) => total + row.winnings, 0));

const potRemaining = computed(() => TOTAL_SEASON_BUY_IN - totalSeasonWinnings.value);
</script>

<template>
  <p v-if="isLoading" role="status">Loading season balances…</p>
  <div v-else-if="error" role="alert">
    <p>Season balances are unavailable because payout data could not be loaded.</p>
    <p class="mt-1 text-sm">{{ error.message }}</p>
    <button class="accent-link mt-2" @click="retry">Retry payout data</button>
  </div>
  <template v-else>
    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="owner"
      :empty-message="`No ${SEASON} payouts yet.`">
      <template #cell-winnings="{ row }">{{ formatCurrency(row.winnings) }}</template>
    </DataTable>
    <p class="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
      Unallocated Pot: {{ formatCurrency(potRemaining) }}
    </p>
    <p class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
      Winnings include returned entry deposits. The unallocated pot is collected funds
      not yet awarded; payouts are held for end-of-season distribution.
    </p>
  </template>
</template>
