<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { solveCRC } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  data: string;
  generator: string;
  appendZeros: boolean;
}>();

const result = computed(() => solveCRC(props.data, props.generator, props.appendZeros));
const currentStep = ref(1);

watch(
  () => [props.data, props.generator, props.appendZeros],
  () => {
    currentStep.value = 1;
  }
);

const visibleSteps = computed(() => result.value.steps.slice(0, currentStep.value));
const activeStep = computed(() => visibleSteps.value[visibleSteps.value.length - 1]);
const isComplete = computed(() => currentStep.value >= result.value.steps.length);
const chars = (s: string) => s.split('');
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="Math.max(1, result.steps.length)"
      :explanation="activeStep?.explanation ?? ''"
    />

    <!-- Whiteboard grid mimicking image_49592ee4.png -->
    <div class="notebook-grid overflow-x-auto rounded-xl border border-[#e4dccb] p-5 sm:p-6 dark:border-slate-800">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <!-- Left/Main: Modulo-2 Division Stack -->
        <div class="overflow-x-auto">
          <div class="mb-3 text-xs text-stone-600 dark:text-slate-400">
            Dzielenie modulo 2 (XOR bez pożyczek, przerywane kreski oznaczają spuszczane bity)
          </div>

          <div class="inline-block min-w-max font-mono text-lg sm:text-xl leading-none tabular-nums">
            <!-- Top Row: Original data + optional appended zeros -->
            <div class="flex items-center pb-1">
              <span
                v-for="(bit, col) in chars(result.dividend)"
                :key="'top-' + col"
                class="flex h-8 w-6 items-center justify-center font-bold"
                :class="
                  appendZeros && col >= result.originalData.length
                    ? 'text-blue-700 underline decoration-blue-300 decoration-2 underline-offset-4 dark:text-blue-400 dark:decoration-blue-500'
                    : 'text-stone-900 dark:text-slate-100'
                "
              >
                {{ bit }}
              </span>
            </div>

            <!-- Each XOR Step -->
            <div v-for="(st, sIdx) in visibleSteps" :key="'crc-' + st.stepNum" class="mt-0.5">
              <!-- For steps > 0, display the working window brought down -->
              <div v-if="sIdx > 0" class="flex items-center">
                <span
                  v-for="col in result.dividend.length"
                  :key="'win-' + sIdx + '-' + col"
                  class="relative flex h-7 w-6 items-center justify-center font-semibold"
                >
                  <template
                    v-if="
                      col - 1 >= st.alignStartCol &&
                      col - 1 < st.alignStartCol + st.currentWindow.length
                    "
                  >
                    <!-- Check if this bit was dropped from the previous step -->
                    <span
                      v-if="
                        visibleSteps[sIdx - 1].droppedFromCol !== null &&
                        col - 1 >= (visibleSteps[sIdx - 1].droppedFromCol ?? 0) &&
                        col - 1 <= (visibleSteps[sIdx - 1].droppedToCol ?? -1)
                      "
                      class="relative flex h-7 w-6 items-center justify-center font-bold text-blue-700 dark:text-blue-400"
                    >
                      <span
                        class="pointer-events-none absolute -top-12 bottom-6 left-1/2 w-px -translate-x-1/2 border-l border-dashed border-blue-400 dark:border-blue-500"
                        aria-hidden="true"
                      ></span>
                      {{ st.currentWindow[col - 1 - st.alignStartCol] }}
                    </span>
                    <span v-else class="text-stone-900 dark:text-slate-100">
                      {{ st.currentWindow[col - 1 - st.alignStartCol] }}
                    </span>
                  </template>
                </span>
              </div>

              <!-- Generator aligned underneath -->
              <div class="flex items-center">
                <span
                  v-for="col in result.dividend.length"
                  :key="'gen-' + sIdx + '-' + col"
                  class="relative flex h-7 w-6 items-center justify-center"
                  :class="
                    sIdx === visibleSteps.length - 1
                      ? 'text-rose-700 font-semibold dark:text-rose-400'
                      : 'text-stone-700 dark:text-slate-300'
                  "
                >
                  <template
                    v-if="
                      col - 1 >= st.alignStartCol &&
                      col - 1 < st.alignStartCol + st.generator.length
                    "
                  >
                    {{ st.generator[col - 1 - st.alignStartCol] }}
                    <span
                      class="absolute right-0 bottom-0 left-0 border-b-2 border-stone-800 dark:border-slate-300"
                    ></span>
                  </template>
                </span>
              </div>

              <!-- On the last visible step, also show its XOR result (and final remainder if complete) -->
              <div v-if="sIdx === visibleSteps.length - 1" class="flex items-center pt-1">
                <span
                  v-for="col in result.dividend.length"
                  :key="'xor-' + sIdx + '-' + col"
                  class="flex h-8 w-6 items-center justify-center font-bold"
                >
                  <template
                    v-if="
                      col - 1 >= st.alignStartCol &&
                      col - 1 < st.alignStartCol + st.xorResultFull.length
                    "
                  >
                    <span
                      :class="
                        isComplete &&
                        col - 1 >= result.dividend.length - result.remainderLength
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-stone-600 dark:text-slate-400'
                      "
                    >
                      {{ st.xorResultFull[col - 1 - st.alignStartCol] }}
                    </span>
                  </template>
                  <template
                    v-else-if="
                      isComplete &&
                      st.droppedFromCol !== null &&
                      col - 1 >= st.droppedFromCol &&
                      col - 1 <= (st.droppedToCol ?? -1)
                    "
                  >
                    <span class="text-emerald-700 dark:text-emerald-400">{{ result.dividend[col - 1] }}</span>
                  </template>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: GENERATOR box (exact match to right side of image_49592ee4.png) -->
        <div class="shrink-0 space-y-3 lg:w-64">
          <div class="rounded-lg border border-[#d6ccb8] bg-[#fffdf7] p-3.5 dark:border-slate-700 dark:bg-slate-900">
            <div class="mb-2 flex items-center justify-between border-b border-[#e4dccb] pb-1.5 dark:border-slate-700">
              <span class="font-mono text-base font-bold text-stone-900 dark:text-slate-100">{{ result.generator }}</span>
              <span class="text-xs font-semibold tracking-wide text-stone-500 dark:text-slate-400">GENERATOR</span>
            </div>
            <div class="space-y-1.5 text-xs text-stone-700 dark:text-slate-300">
              <div>
                Długość generatora: <strong class="font-mono">{{ result.generator.length }} bitów</strong>
              </div>
              <div>
                Długość reszty CRC: <strong class="font-mono">{{ result.remainderLength }} bity</strong>
              </div>
              <div>
                Dopisane zera:
                <strong class="font-mono" :class="appendZeros ? 'text-blue-700 dark:text-blue-400' : 'text-amber-700 dark:text-amber-400'">
                  {{ appendZeros ? `${result.appendedZerosCount} zera (wyznaczanie)` : '0 zer (weryfikacja!)' }}
                </strong>
              </div>
            </div>
          </div>

          <div
            v-if="isComplete"
            class="rounded-lg border p-3.5"
            :class="
              result.errorDetected === true
                ? 'border-rose-300 bg-rose-50/70 dark:border-rose-700 dark:bg-rose-950/50'
                : 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-700 dark:bg-emerald-950/50'
            "
          >
            <div class="text-xs font-medium text-stone-600 dark:text-slate-300">
              {{ appendZeros ? 'Wyznaczona reszta CRC:' : 'Reszta z weryfikacji:' }}
            </div>
            <div class="mt-1 font-mono text-2xl font-bold tracking-widest text-stone-900 dark:text-slate-100 tabular-nums">
              {{ result.remainder }}
            </div>
            <div v-if="appendZeros" class="mt-2 text-xs text-stone-700 dark:text-slate-300">
              Ramka do wysłania: <span class="font-mono font-semibold">{{ result.transmittedFrame }}</span>
            </div>
            <div v-else class="mt-2 text-xs font-semibold">
              <span v-if="result.errorDetected" class="text-rose-800 dark:text-rose-300">
                Wykryto błąd transmisji (reszta ≠ 0000)
              </span>
              <span v-else class="text-emerald-800 dark:text-emerald-300">
                Nie wykryto błędu transmisji (reszta = 0000)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
