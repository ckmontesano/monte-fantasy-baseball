<script setup>
import NavigationBar from "@/components/NavigationBar.vue";
import Footer from "@/components/Footer.vue";

import HomePage from "@/pages/HomePage.vue";
import PlayoffsPage from "@/pages/PlayoffsPage.vue";
import TeamsPage from "@/pages/TeamsPage.vue";
import AllStarBreakPage from "@/pages/AllStarBreakPage.vue";
import RulesPage from "@/pages/RulesPage.vue";
import MLBStandings from "@/pages/MLBStandings.vue";
import NotFound from "@/pages/NotFound.vue";

import { ref, computed } from "vue";

const routes = {
  "/": PlayoffsPage,
  "/regular-season": HomePage,
  "/playoffs": PlayoffsPage,
  "/teams": TeamsPage,
  "/all-star-break": AllStarBreakPage,
  "/rules": RulesPage,
  "/mlb-standings": MLBStandings,
};

const currentPath = ref(window.location.hash);
window.addEventListener("hashchange", () => {
  currentPath.value = window.location.hash;
});

const currentView = computed(() => {
  return routes[currentPath.value.slice(1) || "/"] || NotFound;
});
</script>

<template>
  <div class="app-shell min-h-screen bg-zinc-200 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
    <NavigationBar />
    <main class="app-main mx-auto max-w-7xl bg-zinc-100 px-2 pt-24 pb-8 text-sm sm:px-6 md:px-8 md:pt-28 md:pb-12 dark:bg-zinc-800">
      <component :is="currentView" />
    </main>
    <Footer />
  </div>
</template>
