<script setup>
import { computed } from "vue";
import DataTable from "@/components/DataTable.vue";
import { usePayoutHistory } from "@/composables/usePayoutHistory.js";
import { OWNERS, SEASON, TOTAL_SEASON_BUY_IN } from "@/data/season-2026.js";

const { isLoading, payoutHistory } = usePayoutHistory();

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
  <DataTable
    :columns="columns"
    :rows="rows"
    row-key="owner"
    :empty-message="isLoading ? 'Loading season balances...' : `No ${SEASON} payouts yet.`">
    <template #cell-winnings="{ row }">{{ formatCurrency(row.winnings) }}</template>
  </DataTable>
  <p class="mt-2 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
    Pot Remaining: {{ formatCurrency(potRemaining) }}
  </p>
</template>
