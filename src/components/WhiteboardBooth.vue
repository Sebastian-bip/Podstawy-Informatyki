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
const currentStep = ref(props.highlightIter ?? result.value.iterations.length);

watch(
  () => [props.mDec, props.qDec, props.bits, props.highlightIter],
  () => {
    currentStep.value = props.highlightIter ?? result.value.iterations.length;
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

    <div class="notebook-grid rounded-xl border border-slate-200 p-5 sm:p-6">
      <!-- Setup constants -->
      <div class="mb-4 flex flex-wrap gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 font-mono text-xs sm:text-sm tabular-nums">
        <span>M ({{ mDec }}) = <strong class="text-blue-700">{{ result.M_bin }}</strong></span>
        <span>−M ({{ -mDec }}) = <strong class="text-rose-700">{{ result.negM_bin }}</strong></span>
        <span>Q ({{ qDec }}) = <strong>{{ result.initQ }}</strong></span>
        <span>A₀ = <strong>{{ result.initA }}</strong></span>
        <span>Q₋₁ = <strong>0</strong></span>
      </div>

      <!-- Iterations Table -->
      <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table class="w-full text-left font-mono text-xs sm:text-sm tabular-nums">
          <thead class="border-b border-slate-200 bg-slate-50 font-sans text-xs font-semibold text-slate-700">
            <tr>
              <th class="px-3 py-2.5">Iteracja</th>
              <th class="px-3 py-2.5">(Q₀, Q₋₁)</th>
              <th class="px-3 py-2.5">Operacja na A</th>
              <th class="px-3 py-2.5">A przed przes.</th>
              <th class="px-3 py-2.5">Po przesunięciu ASR [A | Q | Q₋₁]</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr class="bg-slate-50/50 text-slate-600">
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
                  ? 'bg-emerald-50/80 font-semibold'
                  : it.iter === currentStep
                    ? 'bg-blue-50/70'
                    : ''
              "
            >
              <td class="px-3 py-2.5 font-sans">
                Iteracja {{ it.iter }}
                <span v-if="it.iter === highlightIter" class="ml-1 text-xs font-bold text-emerald-700">
                  (Pytanie!)
                </span>
              </td>
              <td class="px-3 py-2.5">
                <span
                  class="font-bold"
                  :class="
                    it.opType === 'sub'
                      ? 'text-rose-700'
                      : it.opType === 'add'
                        ? 'text-blue-700'
                        : 'text-slate-500'
                  "
                >
                  {{ it.q0 }}{{ it.qm1 }}
                </span>
              </td>
              <td class="px-3 py-2.5 font-sans text-xs text-slate-700">{{ it.actionLabel }}</td>
              <td class="px-3 py-2.5 text-slate-800">{{ it.A_afterOp }}</td>
              <td class="px-3 py-2.5">
                <strong
                  :class="
                    it.iter === highlightIter ? 'text-emerald-800 underline decoration-2' : 'text-blue-800'
                  "
                >{{ it.A_afterShift }}</strong>
                <span class="text-slate-400"> | </span>
                <span>{{ it.Q_afterShift }}</span>
                <span class="text-slate-400"> | </span>
                <span class="text-slate-600">{{ it.Qm1_afterShift }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="currentStep >= result.iterations.length"
        class="mt-4 rounded-lg border border-slate-200 bg-white px-4 py-2.5 font-mono text-xs text-slate-700"
      >
        Sprawdzenie po pełnych {{ result.bits }} iteracjach: [A, Q] = {{ result.finalProductBin }} (w U2 = {{ result.finalProductDec }}), a {{ mDec }} · {{ qDec }} = {{ mDec * qDec }}.
      </div>
    </div>
  </div>
</template>
