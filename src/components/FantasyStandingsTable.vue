<script setup>
import { computed, ref, watch } from "vue";
import DataTable from "@/components/DataTable.vue";
import { useMlbStandings } from "@/composables/useMlbStandings.js";

const { mlbStandings } = useMlbStandings();
const points = ref({
  Cameron: 0,
  Caden: 0,
  Jack: 0,
  Dad: 0,
});
const mlbPoints = ref({
  Cameron: 0,
  Caden: 0,
  Jack: 0,
  Dad: 0,
});

const columns = [
  {
    key: "owner",
    label: "Team",
    sortable: true,
  },
  {
    key: "totalPoints",
    label: "Points",
    sortable: true,
    sortDirection: "desc",
  },
];

const rows = computed(() =>
  Object.entries(points.value)
    .map(([owner, totalPoints]) => ({
      owner,
      totalPoints,
      mlbPoints: mlbPoints.value[owner] || 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints),
);

const topOwner = computed(() => rows.value[0]?.owner || null);

function getRowClass(row) {
  const baseClass = "odd:bg-zinc-100 odd:dark:bg-zinc-800/70";

  return row.owner === topOwner.value ? `${baseClass} font-bold` : baseClass;
}

function calculatePoints() {
  Object.keys(points.value).forEach((owner) => {
    points.value[owner] = mlbPoints.value[owner] || 0;
  });
}

watch(
  mlbStandings,
  (standings) => {
    if (!standings) return;
    mlbPoints.value = {
      Cameron: 0,
      Caden: 0,
      Jack: 0,
      Dad: 0,
    };
    Object.values(standings).forEach((league) => {
      Object.values(league).forEach((division) => {
        if (!division.leader?.team) {
          return;
        }

        const team = division.leader.team;
        if (mlbPoints.value[team.owner] !== undefined) {
          mlbPoints.value[team.owner] += team.fantasyPoints || 0;
        }
      });
    });
    calculatePoints();
  },
  { immediate: true },
);
</script>

<template>
  <template v-if="mlbStandings">
    <DataTable
      :columns="columns"
      :rows="rows"
      row-key="owner"
      :row-class="getRowClass">
      <template #cell-owner="{ row }">
        <div class="whitespace-nowrap">
          <img
            class="-mt-0.5 mr-1 inline h-5 align-middle"
            :class="row.owner === topOwner ? '' : 'hidden'"
            src="@/assets/crown.png"
            alt="" />
          {{ row.owner }}
        </div>
      </template>
      <template #cell-totalPoints="{ row }">
        <span class="whitespace-nowrap">
          {{ row.totalPoints }}
        </span>
      </template>
    </DataTable>
    <div class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
      <strong>Key:</strong> Regular-season points from the current division leaders only.
      September division and wild-card earnings are shown in the September Points tab.
    </div>
    <div class="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
      All-Star Break points are tracked separately on the All-Star Break page.
    </div>
    <a class="accent-link mt-2 block" href="#/teams">See team ownerships →</a>
  </template>
  <p v-else>Loading…</p>
</template>
