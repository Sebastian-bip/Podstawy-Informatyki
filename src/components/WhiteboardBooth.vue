<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { solveBoothAlgorithm } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  mDec: number;
  qDec: number;
  bits?: number;
  highlightIter?: number;
}>();

const result = computed(() => solveBoothAlgorithm(props.mDec, props.qDec, props.bits ?? 4));
const currentStep = ref(1);

watch(
  () => [props.mDec, props.qDec, props.bits, props.highlightIter],
  () => {
    currentStep.value = 1;
  }
);

const visibleIters = computed(() => result.value.iterations.slice(0, currentStep.value));
const activeIter = computed(() => visibleIters.value[visibleIters.value.length - 1]);
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="result.iterations.length"
      :explanation="activeIter?.explanation ?? ''"
    />

    <div class="notebook-grid rounded-xl border border-[#e4dccb] p-5 sm:p-6 dark:border-slate-800">
      <!-- Setup constants -->
      <div class="mb-4 flex flex-wrap gap-4 rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-3 font-mono text-xs sm:text-sm tabular-nums text-stone-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
        <span>M ({{ mDec }}) = <strong class="text-blue-700 dark:text-blue-400">{{ result.M_bin }}</strong></span>
        <span>−M ({{ -mDec }}) = <strong class="text-rose-700 dark:text-rose-400">{{ result.negM_bin }}</strong></span>
        <span>Q ({{ qDec }}) = <strong>{{ result.initQ }}</strong></span>
        <span>A₀ = <strong>{{ result.initA }}</strong></span>
        <span>Q₋₁ = <strong>0</strong></span>
      </div>

      <!-- Iterations Table -->
      <div class="overflow-x-auto rounded-lg border border-[#e4dccb] bg-[#fffdf7] dark:border-slate-700 dark:bg-slate-900">
        <table class="w-full text-left font-mono text-xs sm:text-sm tabular-nums">
          <thead class="border-b border-[#e4dccb] bg-[#f7f1e3] font-sans text-xs font-semibold text-stone-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
            <tr>
              <th class="px-3 py-2.5">Iteracja</th>
              <th class="px-3 py-2.5">(Q₀, Q₋₁)</th>
              <th class="px-3 py-2.5">Operacja na A</th>
              <th class="px-3 py-2.5">A przed przes.</th>
              <th class="px-3 py-2.5">Po przesunięciu ASR [A | Q | Q₋₁]</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#ede6d7] dark:divide-slate-800 text-stone-800 dark:text-slate-200">
            <tr class="bg-[#f7f1e3]/60 text-stone-600 dark:bg-slate-800/40 dark:text-slate-400">
              <td class="px-3 py-2 font-sans">Start (0)</td>
              <td class="px-3 py-2">—</td>
              <td class="px-3 py-2 font-sans">Wartości początkowe</td>
              <td class="px-3 py-2">{{ result.initA }}</td>
              <td class="px-3 py-2">{{ result.initA }} | {{ result.initQ }} | {{ result.initQm1 }}</td>
            </tr>
            <tr
              v-for="it in visibleIters"
              :key="it.iter"
              :class="
                it.iter === highlightIter
                  ? 'bg-emerald-50/80 font-semibold dark:bg-emerald-950/50'
                  : it.iter === currentStep
                    ? 'bg-blue-50/70 dark:bg-blue-950/50'
                    : ''
              "
            >
              <td class="px-3 py-2.5 font-sans">
                Iteracja {{ it.iter }}
                <span v-if="it.iter === highlightIter" class="ml-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  (Pytanie!)
                </span>
              </td>
              <td class="px-3 py-2.5">
                <span
                  class="font-bold"
                  :class="
                    it.opType === 'sub'
                      ? 'text-rose-700 dark:text-rose-400'
                      : it.opType === 'add'
                        ? 'text-blue-700 dark:text-blue-400'
                        : 'text-stone-500 dark:text-slate-400'
                  "
                >
                  {{ it.q0 }}{{ it.qm1 }}
                </span>
              </td>
              <td class="px-3 py-2.5 font-sans text-xs text-stone-700 dark:text-slate-300">{{ it.actionLabel }}</td>
              <td class="px-3 py-2.5 text-stone-800 dark:text-slate-200">{{ it.A_afterOp }}</td>
              <td class="px-3 py-2.5">
                <strong
                  :class="
                    it.iter === highlightIter ? 'text-emerald-800 underline decoration-2 dark:text-emerald-300' : 'text-blue-800 dark:text-blue-300'
                  "
                >{{ it.A_afterShift }}</strong>
                <span class="text-stone-400 dark:text-slate-500"> | </span>
                <span>{{ it.Q_afterShift }}</span>
                <span class="text-stone-400 dark:text-slate-500"> | </span>
                <span class="text-stone-600 dark:text-slate-400">{{ it.Qm1_afterShift }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="currentStep >= result.iterations.length"
        class="mt-4 rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2.5 font-mono text-xs text-stone-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        Sprawdzenie po pełnych {{ result.bits }} iteracjach: [A, Q] = {{ result.finalProductBin }} (w U2 = {{ result.finalProductDec }}), a {{ mDec }} · {{ qDec }} = {{ mDec * qDec }}.
      </div>
    </div>
  </div>
</template>
