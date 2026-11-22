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
  if (props.currentStep > 0) emit('update:currentStep', props.currentStep - 1);
};
const next = () => {
  if (props.currentStep < props.totalSteps) emit('update:currentStep', props.currentStep + 1);
};
const reset = () => emit('update:currentStep', 1);
const showAll = () => emit('update:currentStep', props.totalSteps);
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="reset"
          :disabled="currentStep <= 1"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
          aria-label="Od początku"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          Od początku
        </button>
        <button
          type="button"
          @click="prev"
          :disabled="currentStep <= 1"
          class="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
          aria-label="Poprzedni krok"
        >
          <ChevronLeft class="h-3.5 w-3.5" />
          Wstecz
        </button>
        <button
          type="button"
          @click="next"
          :disabled="currentStep >= totalSteps"
          class="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-40 whitespace-nowrap shrink-0"
          aria-label="Następny krok"
        >
          Następny krok
          <ChevronRight class="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          @click="showAll"
          :disabled="currentStep >= totalSteps"
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
          aria-label="Pokaż całe rozwiązanie"
        >
          <Eye class="h-3.5 w-3.5" />
          Pokaż całość
        </button>
      </div>

      <span class="font-mono text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap shrink-0">
        Krok {{ Math.min(currentStep, totalSteps) }} / {{ totalSteps }}
      </span>
    </div>

    <div
      v-if="explanation"
      class="rounded-lg border border-blue-200 bg-blue-50/70 px-3.5 py-2.5 text-sm leading-relaxed text-slate-800"
    >
      <span class="font-semibold text-blue-900">Bieżący krok: </span>{{ explanation }}
    </div>
  </div>
</template>
