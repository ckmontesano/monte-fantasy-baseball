<script setup>
const RULEBOOK_URL =
  "https://docs.google.com/document/d/1Mfqf9ZAHJ4xVGX93Ih5qCH-_zdR23RcSwOPW3smEj9M/edit?usp=sharing";

const ruleChanges = [
  "Wagers are collected up front on draft day for easier end-of-season payouts.",
  "Regular-season points now use true draft-day odds, including negative odds.",
  "Draft picks are prorated by round so late-round picks are worth less.",
  "Wild-card teams now earn points at the end of the regular season.",
  "Special-case bonuses like no-hitters and player record events are gone.",
  "Tie-breakers now follow MLB's tie-break order instead of sharing points within divisions.",
];

const regularSeasonItems = [
  "Monthly winners are decided from April through September. March does not count.",
  "Each month is a $20 per person pool. The winner receives $80 total: $60 net winnings plus their $20 entry deposit back.",
  "Team points are based on a $100 draft-day odds calculation, then prorated by draft round.",
  "Round multipliers are: round 1 = 1, round 2 = 6/7, round 3 = 5/7, round 4 = 4/7, round 5 = 3/7, round 6 = 2/7, round 7 = 1/7.",
  "September includes division-winner points plus wild-card points for playoff qualifiers that did not win their division. April–August remain division-only.",
  "Wild-card points use the fixed March 25, 2026 FanGraphs Make Playoffs percentages, converted to American odds and prorated using the same draft-round multipliers. Only final team points are rounded. A team cannot receive both awards.",
];

const allStarItems = [
  "All-Star Break is a separate competition and does not count toward monthly or season standings.",
  "Each active-roster All-Star earns 6 points for that MLB team's fantasy owner.",
  "If that player is on the winning league, add 6 bonus points.",
  "The All-Star pool is $30 per person. The winner receives $120 total: $90 net winnings plus their $30 entry deposit back.",
  "Home Run Derby winner picks are worth 40 points. If nobody picks the champion, the pick that advanced farthest wins instead.",
];

const playoffItems = [
  "Playoffs are a separate competition with points resetting after the regular season winner is crowned.",
  "Wild Card series win = 5 points.",
  "Division Series win = 10 points.",
  "Championship Series win = 20 points.",
  "World Series win = 30 points.",
  "Correctly guessing both the winner and exact clinching game number adds 1 bonus point.",
  "The playoff pool is $50 per person.",
];

const tieBreakerItems = [
  "Two-team tie: head-to-head, intradivision record, interdivision record, then last half of intra-league games.",
  "Three-team tie: combined head-to-head winning percentage, then intradivision record.",
  "The site follows MLB-style tie-breakers instead of splitting division points across tied teams.",
];
</script>

<template>
  <section class="w-full">
    <div class="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h1 class="text-4xl font-semibold tracking-tight">Rules</h1>
        <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Summary of the 2026 Montesano Fantasy Baseball rulebook.
        </p>
      </div>
      <a
        :href="RULEBOOK_URL"
        target="_blank"
        rel="noreferrer"
        class="accent-focus accent-outline-button inline-flex items-center self-start rounded-md border px-3 py-2 text-sm font-semibold transition md:ml-auto">
        Open Full Rulebook
      </a>
    </div>

    <div class="mb-6 rounded-lg border border-zinc-300 bg-zinc-100 p-4 dark:border-zinc-700 dark:bg-zinc-800/70">
      <div class="max-w-4xl">
        <h2 class="mb-2 text-2xl font-semibold">At A Glance</h2>
        <p>
          Everyone pays <b>$200</b> up front on draft day. That covers the monthly
          regular-season pools, the All-Star Break pool, and the playoff pool.
        </p>
      </div>
    </div>

    <div class="max-w-4xl space-y-8">
      <section>
        <h2 class="mb-3 text-2xl font-semibold">What's New In 2026</h2>
        <ul class="ml-5 list-disc space-y-2">
          <li v-for="item in ruleChanges" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-2xl font-semibold">Regular Season</h2>
        <ul class="ml-5 list-disc space-y-2">
          <li v-for="item in regularSeasonItems" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-2xl font-semibold">All-Star Break</h2>
        <ul class="ml-5 list-disc space-y-2">
          <li v-for="item in allStarItems" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-2xl font-semibold">Playoffs</h2>
        <ul class="ml-5 list-disc space-y-2">
          <li v-for="item in playoffItems" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section>
        <h2 class="mb-3 text-2xl font-semibold">Tie-Breakers</h2>
        <ul class="ml-5 list-disc space-y-2">
          <li v-for="item in tieBreakerItems" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>
  </section>
</template>
