<script setup>
import { SEASON } from "@/data/season-2026.js";
import DataTable from "@/components/DataTable.vue";
import { usePayoutHistory } from "@/composables/usePayoutHistory.js";

const { isLoading, payoutHistory, error, refreshPayoutHistory } = usePayoutHistory();

function retry() {
  refreshPayoutHistory().catch(() => {});
}

const monthOrder = {
  April: 4,
  May: 5,
  June: 6,
  "All-Star Break": 6.5,
  July: 7,
  August: 8,
  September: 9,
};

const columns = [
  {
    key: "date",
    label: "Date",
    sortable: true,
    sortValue: (row) => monthOrder[row.date] || 99,
  },
  { key: "winner", label: "Winner", sortable: true },
  { key: "amount", label: "Amount", sortable: true },
];
</script>

<template>
  <p v-if="isLoading" role="status">Loading payout history…</p>
  <div v-else-if="error" role="alert">
    <p>Payout history is unavailable. Please retry loading the results.</p>
    <button class="accent-link mt-2" @click="retry">Retry payout data</button>
  </div>
  <DataTable
    v-else
    :columns="columns"
    :rows="payoutHistory"
    row-key="snapshotDate"
    :empty-message="isLoading ? 'Loading payout history...' : `No ${SEASON} payout results yet.`">
    <template #cell-date="{ row }">{{ row.date }}</template>
    <template #cell-winner="{ row }">{{ row.winner }}</template>
    <template #cell-amount="{ row }">${{ row.amount }}</template>
  </DataTable>
</template>
