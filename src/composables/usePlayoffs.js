import { ref, onMounted, onBeforeUnmount } from "vue";
import { SEASON } from "@/data/season-2026.js";
import { normalizePlayoffSeries } from "@/scripts/playoff-scoring.js";
import { fetchPlayoffGames } from "@/scripts/mlb-playoffs.js";

export function usePlayoffs() {
  const series = ref(null);
  const error = ref(null);
  const isLoading = ref(false);
  const fetchedAt = ref(null);
  let timer;
  let controller;
  const key = `playoffs-${SEASON}-v1`;
  async function load() {
    if (isLoading.value) return;
    isLoading.value = true;
    error.value = null;
    controller = new AbortController();
    try {
      const games = await fetchPlayoffGames(controller.signal);
      series.value = normalizePlayoffSeries(games);
      fetchedAt.value = Date.now();
      try { localStorage.setItem(key, JSON.stringify({ games, fetchedAt: fetchedAt.value })); } catch { /* Cache is optional. */ }
    } catch (err) {
      if (err.name !== "AbortError") error.value = err;
    } finally { isLoading.value = false; }
  }
  onMounted(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      if (cached?.games && cached.fetchedAt) {
        series.value = normalizePlayoffSeries(cached.games);
        fetchedAt.value = cached.fetchedAt;
      }
    } catch { /* Ignore invalid cache. */ }
    load();
    timer = setInterval(() => { if (!document.hidden) load(); }, 60 * 1000);
  });
  onBeforeUnmount(() => { clearInterval(timer); controller?.abort(); });
  return { series, error, isLoading, fetchedAt };
}
