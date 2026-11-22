<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { simulateTuringMachine, type TuringRule } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  tapeStr: string;
  startState: string;
  startPos: number;
  rules: TuringRule[];
}>();

const result = computed(() =>
  simulateTuringMachine(
    props.tapeStr.trim().split(/\s+/),
    props.rules,
    props.startState,
    props.startPos
  )
);

const currentStep = ref(result.value.steps.length);
watch(
  () => props.tapeStr,
  () => {
    currentStep.value = result.value.steps.length;
  }
);

const activeStep = computed(() => {
  const idx = Math.max(0, Math.min(currentStep.value - 1, result.value.steps.length - 1));
  return result.value.steps[idx];
});

const displayedTape = computed(() => activeStep.value?.tapeAfter ?? result.value.initialTape);
const displayedHead = computed(() => activeStep.value?.headPosAfter ?? props.startPos);
const displayedState = computed(() => activeStep.value?.nextState ?? props.startState);
const isDone = computed(() => currentStep.value >= result.value.steps.length && result.value.halted);
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="result.steps.length"
      :explanation="activeStep?.explanation ?? ''"
    />

    <div class="notebook-grid rounded-xl border border-slate-200 p-5 sm:p-6">
      <!-- Live Tape Visualizer -->
      <div class="mb-6">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <span>
            Stan maszyny po kroku {{ currentStep }}:
            <strong
              class="font-mono text-sm"
              :class="displayedState === 'k' ? 'text-emerald-700' : 'text-blue-700'"
            >
              {{ displayedState }}{{ displayedState === 'k' ? ' (KONIEC)' : '' }}
            </strong>
          </span>
          <span class="font-mono">□ = pusta komórka · ▶ = koniec taśmy</span>
        </div>

        <div class="overflow-x-auto pb-2">
          <div class="inline-flex min-w-max items-center gap-1.5">
            <div
              v-for="(sym, idx) in displayedTape"
              :key="'cell-' + idx"
              class="flex flex-col items-center"
            >
              <span class="mb-1 font-mono text-[11px] text-slate-400 tabular-nums">{{ idx + 1 }}</span>
              <div
                class="flex h-12 w-11 items-center justify-center rounded-lg border-2 font-mono text-lg font-bold transition-colors"
                :class="
                  idx === displayedHead
                    ? isDone
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                      : 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-300 bg-white text-slate-900'
                "
              >
                {{ sym }}
              </div>
              <span
                class="mt-1 font-mono text-xs font-bold"
                :class="idx === displayedHead ? 'text-blue-700' : 'text-transparent'"
              >
                ▲
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Two-column layout: Transition Table + Step Trace Table -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <!-- Transition Table -->
        <div class="lg:col-span-5">
          <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div class="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              Tabela przejść (podświetlona aktywna reguła)
            </div>
            <table class="w-full text-center font-mono text-xs tabular-nums">
              <thead class="border-b border-slate-200 bg-slate-50/70 text-slate-600">
                <tr>
                  <th class="py-1.5 px-2">Stan</th>
                  <th class="py-1.5 px-2">Odczyt</th>
                  <th class="py-1.5 px-2">Zapis</th>
                  <th class="py-1.5 px-2">Ruch</th>
                  <th class="py-1.5 px-2">Nast.</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                <tr
                  v-for="(rule, rIdx) in rules"
                  :key="'r-' + rIdx"
                  :class="
                    activeStep?.matchedRuleIndex === rIdx
                      ? 'bg-blue-100/80 font-bold text-blue-950'
                      : 'text-slate-700'
                  "
                >
                  <td class="py-1.5 px-2">{{ rule.state }}</td>
                  <td class="py-1.5 px-2">{{ rule.read }}</td>
                  <td class="py-1.5 px-2">{{ rule.write }}</td>
                  <td class="py-1.5 px-2">{{ rule.move }}</td>
                  <td class="py-1.5 px-2">{{ rule.nextState }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Written Trace Log (just how you write it on paper!) -->
        <div class="lg:col-span-7">
          <div class="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div class="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              Ślad wykonania krok po kroku (zapis do zeszytu)
            </div>
            <div class="max-h-80 overflow-y-auto divide-y divide-slate-100">
              <button
                v-for="st in result.steps.slice(0, currentStep)"
                :key="'tr-' + st.stepNum"
                type="button"
                @click="currentStep = st.stepNum"
                class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-slate-50 tabular-nums"
                :class="st.stepNum === currentStep ? 'bg-blue-50/70' : ''"
              >
                <span class="shrink-0 text-slate-500">
                  {{ String(st.stepNum).padStart(2, '0') }}. [{{ st.stateBefore }}→{{ st.nextState }}]
                </span>
                <span class="truncate text-slate-800">
                  <template v-for="(ch, cIdx) in st.tapeAfter" :key="cIdx">
                    <span
                      :class="
                        cIdx === st.headPosBefore
                          ? 'rounded bg-amber-100 px-0.5 font-bold text-amber-900'
                          : ''
                      "
                    >{{ ch }}</span>{{ cIdx < st.tapeAfter.length - 1 ? ' ' : '' }}
                  </template>
                </span>
                <span class="shrink-0 text-slate-500">poz. {{ st.headPosBefore + 1 }} {{ st.move }}</span>
              </button>
            </div>
          </div>

          <div
            v-if="isDone"
            class="mt-3 rounded-lg border border-emerald-300 bg-emerald-50/70 px-4 py-2.5 font-mono text-sm font-bold text-slate-900"
          >
            Taśma końcowa: {{ result.finalTapeStr }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
