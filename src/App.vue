<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Check } from 'lucide-vue-next';
import { EXAM_SETS } from './data/exams';
import TaskWorkspace from './components/TaskWorkspace.vue';
import ReferenceBoardView from './components/ReferenceBoardView.vue';
import CustomPlayground from './components/CustomPlayground.vue';

type MainTab = 'zestaw-d' | 'zestaw-b' | 'tablica' | 'wlasny';

const activeTab = ref<MainTab>('zestaw-d');
const selectedTaskIdxBySet = ref<Record<'zestaw-d' | 'zestaw-b', number>>({
  'zestaw-d': 0,
  'zestaw-b': 0,
});
const quizMode = ref(false);
const mobileDrawerOpen = ref(false);

// Persist mastered tasks checklist in localStorage
const STORAGE_KEY = 'pi_kolokwium_mastered_v1';
const loadMastered = (): Record<string, boolean> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const masteredTasks = ref<Record<string, boolean>>(loadMastered());

watch(
  masteredTasks,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch {
      // ignore storage errors
    }
  },
  { deep: true }
);

const toggleMastered = (taskId: string) => {
  masteredTasks.value[taskId] = !masteredTasks.value[taskId];
};

const currentExamSet = computed(() => {
  if (activeTab.value === 'zestaw-b') return EXAM_SETS[1];
  return EXAM_SETS[0];
});

const currentTaskIndex = computed({
  get: () => {
    const key = activeTab.value === 'zestaw-b' ? 'zestaw-b' : 'zestaw-d';
    return selectedTaskIdxBySet.value[key] ?? 0;
  },
  set: (idx: number) => {
    const key = activeTab.value === 'zestaw-b' ? 'zestaw-b' : 'zestaw-d';
    selectedTaskIdxBySet.value[key] = idx;
  },
});

const currentTask = computed(
  () => currentExamSet.value.tasks[currentTaskIndex.value] ?? currentExamSet.value.tasks[0]
);

const masteredCountInCurrentSet = computed(
  () => currentExamSet.value.tasks.filter((t) => masteredTasks.value[t.id]).length
);

const selectTask = (idx: number) => {
  currentTaskIndex.value = idx;
  mobileDrawerOpen.value = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const selectTab = (tab: MainTab) => {
  activeTab.value = tab;
  mobileDrawerOpen.value = false;
  window.scrollTo({ top: 0, behavior: 'auto' });
};
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900">
    <!-- Top Bar: Strictly 3-zone contract -->
    <header class="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:gap-8 sm:px-6">
        <!-- Zone 1: Brand Wordmark -->
        <button
          type="button"
          @click="selectTab('zestaw-d')"
          class="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 text-left"
        >
          Podstawy Informatyki
        </button>

        <!-- Zone 2: 4 Clean Single-Line Nav Tabs (Desktop) -->
        <nav class="hidden md:flex items-center gap-6" aria-label="Zakładki główne">
          <button
            type="button"
            @click="selectTab('zestaw-d')"
            class="border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            :class="
              activeTab === 'zestaw-d'
                ? 'border-blue-700 text-blue-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            "
          >
            Zestaw D (12 zadań)
          </button>
          <button
            type="button"
            @click="selectTab('zestaw-b')"
            class="border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            :class="
              activeTab === 'zestaw-b'
                ? 'border-blue-700 text-blue-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            "
          >
            Zestaw B (13 zadań)
          </button>
          <button
            type="button"
            @click="selectTab('tablica')"
            class="border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            :class="
              activeTab === 'tablica'
                ? 'border-blue-700 text-blue-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            "
          >
            Tablica z zajęć
          </button>
          <button
            type="button"
            @click="selectTab('wlasny')"
            class="border-b-2 py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0"
            :class="
              activeTab === 'wlasny'
                ? 'border-blue-700 text-blue-700 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            "
          >
            Własne obliczenia
          </button>
        </nav>

        <!-- Zone 3: 1 Primary Action -->
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            @click="quizMode = !quizMode"
            class="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            :class="
              quizMode
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            "
          >
            {{ quizMode ? 'Wyłącz tryb sprawdzianu' : 'Tryb sprawdzianu' }}
          </button>
        </div>
      </div>

      <!-- Mobile Navigation Strip -->
      <div class="grid grid-cols-4 gap-1 border-t border-slate-100 px-3 py-1.5 md:hidden">
        <button
          type="button"
          @click="selectTab('zestaw-d')"
          class="rounded-md px-2 py-1.5 text-center text-xs font-medium whitespace-nowrap"
          :class="activeTab === 'zestaw-d' ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'"
        >
          Zestaw D
        </button>
        <button
          type="button"
          @click="selectTab('zestaw-b')"
          class="rounded-md px-2 py-1.5 text-center text-xs font-medium whitespace-nowrap"
          :class="activeTab === 'zestaw-b' ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'"
        >
          Zestaw B
        </button>
        <button
          type="button"
          @click="selectTab('tablica')"
          class="rounded-md px-2 py-1.5 text-center text-xs font-medium whitespace-nowrap"
          :class="activeTab === 'tablica' ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'"
        >
          Tablica
        </button>
        <button
          type="button"
          @click="selectTab('wlasny')"
          class="rounded-md px-2 py-1.5 text-center text-xs font-medium whitespace-nowrap"
          :class="activeTab === 'wlasny' ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-slate-100'"
        >
          Własne
        </button>
      </div>
    </header>

    <!-- Main Container -->
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      <!-- PDF Tabs: Zestaw D & Zestaw B -->
      <div
        v-if="activeTab === 'zestaw-d' || activeTab === 'zestaw-b'"
        class="flex flex-col gap-6 lg:flex-row lg:items-start"
      >
        <!-- Mobile Task Picker Toggle -->
        <div class="lg:hidden">
          <button
            type="button"
            @click="mobileDrawerOpen = !mobileDrawerOpen"
            class="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-900"
          >
            <span>
              Lista zadań: {{ currentExamSet.shortTitle }} (Zad. {{ currentTask.number }}/{{ currentExamSet.tasks.length }})
            </span>
            <span class="text-xs font-medium text-blue-700">
              {{ mobileDrawerOpen ? 'Ukryj' : 'Zmień zadanie' }}
            </span>
          </button>
        </div>

        <!-- Left Task Index Sidebar -->
        <aside
          class="w-full shrink-0 space-y-4 lg:w-80"
          :class="mobileDrawerOpen ? 'block' : 'hidden lg:block'"
        >
          <div class="rounded-xl border border-slate-200 bg-white p-4">
            <div class="text-xs font-semibold text-blue-700">{{ currentExamSet.formatLabel }}</div>
            <h2 class="mt-1 text-base font-bold text-slate-900">{{ currentExamSet.pdfTitle }}</h2>
            <p class="mt-1 text-xs text-slate-500">{{ currentExamSet.metaSummary }}</p>
            <div class="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-600">
              <span>Opanowane zadania</span>
              <strong class="font-mono tabular-nums text-slate-900">
                {{ masteredCountInCurrentSet }} / {{ currentExamSet.tasks.length }}
              </strong>
            </div>
          </div>

          <nav
            class="overflow-hidden rounded-xl border border-slate-200 bg-white"
            aria-label="Lista zadań z arkusza"
          >
            <div class="border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700">
              Wybierz zadanie
            </div>
            <ul class="divide-y divide-slate-100">
              <li v-for="(t, idx) in currentExamSet.tasks" :key="t.id">
                <div
                  class="flex items-center justify-between gap-2 px-3 py-2.5 transition-colors"
                  :class="idx === currentTaskIndex ? 'bg-blue-50/80' : 'hover:bg-slate-50'"
                >
                  <button
                    type="button"
                    @click="selectTask(idx)"
                    class="flex-1 text-left"
                  >
                    <div
                      class="text-xs sm:text-sm leading-snug"
                      :class="
                        idx === currentTaskIndex
                          ? 'font-bold text-blue-900'
                          : 'font-medium text-slate-800'
                      "
                    >
                      <span class="font-mono text-slate-500 mr-1 tabular-nums">{{ t.number }}.</span>
                      {{ t.title }}
                    </div>
                    <div class="mt-0.5 text-[11px] text-slate-500">{{ t.topic }}</div>
                  </button>

                  <button
                    type="button"
                    @click="toggleMastered(t.id)"
                    :aria-label="`Oznacz zadanie ${t.number} jako opanowane`"
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors"
                    :class="
                      masteredTasks[t.id]
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-300 hover:border-slate-300 hover:text-slate-500'
                    "
                  >
                    <Check class="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            </ul>
          </nav>

          <!-- Grading note & Zestaw D grade scale -->
          <div class="rounded-xl border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
            <div class="font-semibold text-slate-800 mb-1">Zasady oceniania</div>
            <p>{{ currentExamSet.gradingNote }}</p>

            <details v-if="activeTab === 'zestaw-d'" class="mt-3 border-t border-slate-100 pt-2.5">
              <summary class="cursor-pointer font-semibold text-slate-700 hover:text-slate-900">
                Skala ocen (12 punktów)
              </summary>
              <table class="mt-2 w-full text-left font-mono text-[11px] tabular-nums">
                <thead class="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th class="py-1">Pkt</th>
                    <th class="py-1">%</th>
                    <th class="py-1">Ocena</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-slate-700">
                  <tr><td class="py-1">0–5</td><td>0–41,67%</td><td>2,0 ndst</td></tr>
                  <tr><td class="py-1">6–7</td><td>50–58,33%</td><td>3,0 dst</td></tr>
                  <tr><td class="py-1">8</td><td>66,67%</td><td>3,5 dst+</td></tr>
                  <tr><td class="py-1">9</td><td>75,00%</td><td>4,0 db</td></tr>
                  <tr><td class="py-1">10</td><td>83,33%</td><td>4,5 db+</td></tr>
                  <tr><td class="py-1">11–12</td><td>91,67–100%</td><td>5,0 bdb</td></tr>
                </tbody>
              </table>
            </details>
          </div>
        </aside>

        <!-- Right Main Workspace -->
        <div class="min-w-0 flex-1">
          <TaskWorkspace
            :task="currentTask"
            :exam-short-title="currentExamSet.shortTitle"
            :quiz-mode="quizMode"
            :has-prev="currentTaskIndex > 0"
            :has-next="currentTaskIndex < currentExamSet.tasks.length - 1"
            @prev="selectTask(currentTaskIndex - 1)"
            @next="selectTask(currentTaskIndex + 1)"
            @open-board-tab="selectTab('tablica')"
          />
        </div>
      </div>

      <!-- Whiteboard Photos Reference Tab -->
      <ReferenceBoardView v-else-if="activeTab === 'tablica'" />

      <!-- Custom Playground Tab -->
      <CustomPlayground v-else-if="activeTab === 'wlasny'" />
    </main>

    <!-- Quiet Footer -->
    <footer class="border-t border-slate-200 bg-white py-4">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 text-xs text-slate-500 sm:px-6">
        <span>Materiały powtórkowe do kolokwium z Podstaw Informatyki (Zestaw D i Zestaw B)</span>
        <span>Wszystkie rozwiązania opracowane metodą pisemną krok po kroku</span>
      </div>
    </footer>
  </div>
</template>
