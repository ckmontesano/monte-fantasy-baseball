<script setup>
// components
import { STAKES } from "@/data/season-2026.js";
import DataTable from "@/components/DataTable.vue";
import MlbDivisionLeadersTable from "@/components/MlbDivisionLeadersTable.vue";
import FantasyStandingsTable from "@/components/FantasyStandingsTable.vue";
import PayoutHistoryTable from "@/components/PayoutHistoryTable.vue";
import SeasonBalancesTable from "@/components/SeasonBalancesTable.vue";
import TabsComponent from "@/components/TabsComponent.vue";
import { ref } from "vue";

const activeTab = ref("standings");
const tabs = [
  { id: "standings", label: "Standings" },
  { id: "payouts", label: "Pools and Payouts" },
];

const poolsColumns = [
  { key: "pool", label: "Pool", sortable: true },
  { key: "stake", label: "Stake", sortable: true },
  { key: "payout", label: "Payout", sortable: true },
];

const poolsRows = [
  {
    pool: "Regular Season",
    stake: `$${STAKES.monthly.wager}/person each month`,
    payout: `$${STAKES.monthly.payout} monthly winner`,
  },
  {
    pool: "All-Star Break",
    stake: `$${STAKES.allStar.wager}/person`,
    payout: `$${STAKES.allStar.payout} winner`,
  },
  {
    pool: "Playoffs",
    stake: `$${STAKES.playoffs.wager}/person`,
    payout: "Separate playoff pool",
  },
  {
    pool: "Season Total",
    stake: `$${STAKES.totalCommitment}/person`,
    payout: "Collected up front on draft day",
  },
];

function getPoolsRowClass(row, rowIndex) {
  const baseClass = "odd:bg-zinc-100 odd:dark:bg-zinc-800/70";

  return rowIndex === poolsRows.length - 1
    ? `${baseClass} font-semibold`
    : baseClass;
}
</script>

<template>
  <div
    class="mb-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <h1 class="text-4xl font-semibold tracking-tight">Home</h1>
  </div>
  <TabsComponent v-model="activeTab" :tabs="tabs" />

  <div v-if="activeTab === 'standings'" class="grid gap-5 md:grid-cols-3">
    <div class="min-w-0 md:col-span-1">
      <h2 class="mb-2 text-2xl font-semibold">Fantasy Standings</h2>
      <FantasyStandingsTable />
    </div>
    <div class="min-w-0 md:col-span-3">
      <h2 class="mb-2 text-2xl font-semibold">MLB Division Leaders</h2>
      <MlbDivisionLeadersTable />
    </div>
  </div>
  <div v-if="activeTab === 'payouts'">
    <div class="flex flex-col gap-4 pb-2 md:flex-row md:items-start md:gap-10">
      <div class="mb-2 w-full min-w-0 flex-1 md:min-w-[350px]">
        <h2 class="mb-2 text-2xl font-semibold">Season Balances</h2>
        <SeasonBalancesTable />
      </div>
      <div class="mb-2 w-full min-w-0 flex-1 md:min-w-[350px]">
        <h2 class="mb-2 text-2xl font-semibold">Payout History</h2>
        <PayoutHistoryTable />
      </div>
    </div>
    <div>
      <h2 class="mb-2 text-2xl font-semibold">Pools / Stakes</h2>
      <DataTable
        :columns="poolsColumns"
        :rows="poolsRows"
        row-key="pool"
        :row-class="getPoolsRowClass" />
      <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        March does not count toward monthly regular-season winners.
      </p>
    </div>
  </div>
</template>
