<script setup lang="ts">
import { ChevronLeft, ChevronRight, RotateCcw, Eye } from 'lucide-vue-next';

const props = defineProps<{
  currentStep: number;
  totalSteps: number;
  explanation: string;
}>();

const emit = defineEmits<{
  (e: 'update:currentStep', val: number): void;
}>();

const prev = () => {
  if (props.currentStep > 1) emit('update:currentStep', props.currentStep - 1);
};
const next = () => {
  if (props.currentStep < props.totalSteps) emit('update:currentStep', props.currentStep + 1);
};
const reset = () => emit('update:currentStep', 1);
const showAll = () => emit('update:currentStep', props.totalSteps);
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4dccb] pb-3 dark:border-slate-800">
      <div class="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          @click="reset"
          :disabled="currentStep <= 1"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-[#f7f1e3] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          aria-label="Od początku"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          Od początku
        </button>
        <button
          type="button"
          @click="prev"
          :disabled="currentStep <= 1"
          class="inline-flex items-center gap-1 rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-[#f7f1e3] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          aria-label="Poprzedni krok"
        >
          <ChevronLeft class="h-3.5 w-3.5" />
          Wstecz
        </button>
        <button
          type="button"
          @click="next"
          :disabled="currentStep >= totalSteps"
          class="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-500 whitespace-nowrap shrink-0"
          aria-label="Następny krok"
        >
          Następny krok
          <ChevronRight class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          @click="showAll"
          :disabled="currentStep >= totalSteps"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-2.5 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-[#f7f1e3] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 whitespace-nowrap shrink-0"
          aria-label="Pokaż całe rozwiązanie"
        >
          <Eye class="h-3.5 w-3.5" />
          Pokaż całość
        </button>
      </div>

      <span class="font-mono text-xs font-medium text-stone-600 dark:text-slate-400 tabular-nums whitespace-nowrap shrink-0">
        Krok {{ Math.min(currentStep, totalSteps) }} / {{ totalSteps }}
      </span>
    </div>

    <div
      v-if="explanation"
      class="rounded-lg border border-[#c8daf0] bg-[#eef4fb]/80 px-3.5 py-2.5 text-sm leading-relaxed text-stone-800 dark:border-blue-800/70 dark:bg-blue-950/50 dark:text-slate-200"
    >
      <span class="font-semibold text-blue-900 dark:text-blue-300">Bieżący krok: </span>{{ explanation }}
    </div>
  </div>
</template>
