<script setup>
import { computed, ref } from "vue";
import AppModal from "@/components/AppModal.vue";
import { useMlbStandings } from "@/composables/useMlbStandings.js";
import { useThemeSettings } from "@/composables/useThemeSettings.js";
import baseballIcon from "@/assets/baseball.png";

const mobileNavOpen = ref(false);
const isForceRefreshing = ref(false);
const isSettingsOpen = ref(false);
const { isLoading, lastFetchedAt, refreshMlbStandings } = useMlbStandings();
const { effectiveThemeMode, settings, updateAccentColor, updateDarkThemeVariant, updateThemeMode } =
  useThemeSettings();

const themeModes = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const darkThemeVariants = [
  { id: "default", label: "Default" },
  { id: "midnight", label: "Midnight" },
];

const accentColors = [
  { id: "blue", label: "Blue", swatch: "#2563eb" },
  { id: "red", label: "Red", swatch: "#dc2626" },
  { id: "orange", label: "Orange", swatch: "#ea580c" },
  { id: "purple", label: "Purple", swatch: "#7c3aed" },
];

const optionBaseClass =
  "accent-focus rounded-md border border-zinc-300 px-3 py-2 text-left text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 dark:border-zinc-600 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-100";

const showDarkVariantOptions = computed(() => settings.themeMode !== "light");

const toggleMobileNav = () => {
  mobileNavOpen.value = !mobileNavOpen.value;
};

const closeMobileNav = () => {
  mobileNavOpen.value = false;
};

function openSettings() {
  closeMobileNav();
  isSettingsOpen.value = true;
}

const navLinks = [
  { href: "#/", label: "Playoffs" },
  { href: "#/regular-season", label: "Regular Season" },
  { href: "#/teams", label: "Teams" },
  { href: "#/all-star-break", label: "All-Star Break" },
  { href: "#/mlb-standings", label: "MLB Standings" },
  { href: "#/rules", label: "Rules" },
];

function formatLastUpdated(timestamp) {
  if (!timestamp) {
    return "Waiting for first MLB sync";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

async function handleForceRefresh() {
  const startedAt = Date.now();

  isForceRefreshing.value = true;

  try {
    await refreshMlbStandings();
  } catch {
    // Keep the navbar quiet if refresh fails; error state lives in the composable.
  } finally {
    const remainingDelay = 1000 - (Date.now() - startedAt);

    if (remainingDelay > 0) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, remainingDelay);
      });
    }

    isForceRefreshing.value = false;
  }
}

function getOptionClass(isSelected) {
  return isSelected ? `${optionBaseClass} accent-choice-selected` : optionBaseClass;
}
</script>

<template>
  <header class="app-nav fixed inset-x-0 top-0 z-50 border-b border-zinc-300/80 bg-white/95 text-zinc-900 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-950/95 dark:text-zinc-100">
    <div class="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-2 sm:px-6 md:px-8">
      <a href="#/" class="group flex items-center gap-3 text-inherit" @click="closeMobileNav">
        <img class="h-9 w-9" :src="baseballIcon" draggable="false" alt="Montesano Fantasy Baseball logo" />
        <div class="flex flex-col leading-tight">
          <span class="text-xl font-semibold tracking-tight sm:hidden">MFB</span>
          <span class="hidden text-xl font-semibold tracking-tight sm:block">Montesano Fantasy Baseball</span>
          <span class="-mt-1.5 text-base text-zinc-600 dark:text-zinc-300">2026 Season</span>
        </div>
      </a>

      <div class="flex items-center gap-1">
        <nav
          class="absolute top-16 right-0 left-0 border-b border-zinc-300 bg-zinc-50 px-2 py-2 md:static md:border-0 md:bg-transparent md:p-0 dark:border-zinc-700 dark:bg-zinc-900 md:dark:bg-transparent"
          :class="mobileNavOpen ? 'block' : 'hidden md:block'">
          <ul class="flex flex-col gap-1 md:flex-row md:items-center md:gap-1">
            <li v-for="link in navLinks" :key="link.href">
              <a
                :href="link.href"
                class="block rounded-md px-3 py-2 font-semibold text-zinc-700 transition hover:bg-zinc-200 hover:text-zinc-900 md:py-1.5 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                @click="closeMobileNav">
                {{ link.label }}
              </a>
            </li>
            <li class="md:hidden">
              <button
                class="accent-focus block w-full rounded-md px-3 py-2 text-left font-semibold text-zinc-700 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                type="button"
                aria-label="Open settings"
                @click="openSettings">
                Settings
              </button>
            </li>
            <li class="hidden md:block">
              <button
                class="accent-focus inline-flex items-center justify-center rounded-md px-3 py-1.5 font-semibold text-zinc-700 transition hover:bg-zinc-200 hover:text-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                type="button"
                aria-label="Open settings"
                @click="openSettings">
                <span class="text-lg leading-none">⚙</span>
              </button>
            </li>
          </ul>
        </nav>

        <button
          class="accent-focus inline-flex h-11 w-11 items-center justify-center rounded-md text-zinc-700 transition hover:bg-zinc-100 md:hidden dark:text-zinc-200 dark:hover:bg-zinc-800"
          type="button"
          aria-label="Toggle navigation"
          @click="toggleMobileNav">
          <span class="text-xl leading-none">☰</span>
        </button>
      </div>
    </div>

    <div class="marquee hidden border-t border-zinc-300 bg-zinc-200/80 py-1.5 text-center text-xs text-zinc-700 md:block dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300">
      <p>
        Last MLB data update: {{ formatLastUpdated(lastFetchedAt) }}.
        <span class="ml-1">Data is stored for one hour.</span>
        <button
          type="button"
          class="accent-link ml-2 underline underline-offset-2 disabled:no-underline"
          :disabled="isLoading || isForceRefreshing"
          @click="handleForceRefresh">
          {{ isLoading || isForceRefreshing ? "Refreshing..." : "Force refresh" }}
        </button>
      </p>
    </div>

    <AppModal v-model="isSettingsOpen" title="Settings" max-width-class="max-w-xl">
      <div class="space-y-6">
        <section>
          <h3 class="mb-2 text-lg font-semibold">Theme</h3>
          <div class="grid gap-2 sm:grid-cols-3">
            <button
              v-for="option in themeModes"
              :key="option.id"
              type="button"
              :class="getOptionClass(settings.themeMode === option.id)"
              @click="updateThemeMode(option.id)">
              {{ option.label }}
            </button>
          </div>
          <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            System is currently using {{ effectiveThemeMode }} mode.
          </p>
        </section>

        <section v-if="showDarkVariantOptions">
          <h3 class="mb-2 text-lg font-semibold">Dark Theme</h3>
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="option in darkThemeVariants"
              :key="option.id"
              type="button"
              :class="getOptionClass(settings.darkThemeVariant === option.id)"
              @click="updateDarkThemeVariant(option.id)">
              <span>{{ option.label }}</span>
            </button>
          </div>
          <p class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            This applies whenever dark mode is active.
          </p>
        </section>

        <section>
          <h3 class="mb-2 text-lg font-semibold">Accent Color</h3>
          <div class="grid gap-2 sm:grid-cols-2">
            <button
              v-for="option in accentColors"
              :key="option.id"
              type="button"
              :class="getOptionClass(settings.accentColor === option.id)"
              @click="updateAccentColor(option.id)">
              <span class="flex items-center gap-3">
                <span class="accent-swatch h-4 w-4 rounded-full" :style="{ backgroundColor: option.swatch }"></span>
                <span>{{ option.label }}</span>
              </span>
            </button>
          </div>
        </section>
      </div>
    </AppModal>
  </header>
</template>
