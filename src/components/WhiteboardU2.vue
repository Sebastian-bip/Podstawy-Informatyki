<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { solveU2Addition } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  a: number;
  b: number;
  bits?: number;
}>();

const result = computed(() => solveU2Addition(props.a, props.b, props.bits ?? 8));
const totalSteps = 3;
const currentStep = ref(totalSteps);

watch(
  () => [props.a, props.b, props.bits],
  () => {
    currentStep.value = totalSteps;
  }
);

const explanation = computed(() => {
  if (currentStep.value === 1) {
    return `Etap 1: Konwertujemy obie liczby na ${result.value.bits}-bitowy kod U2 (liczby ujemne: zapis modułu → negacja bitów U1 → dodanie 1).`;
  }
  if (currentStep.value === 2) {
    return `Etap 2: Ustawiamy oba ciągi w słupku i dodajemy bit po bicie od prawej do lewej (pamiętając o przeniesieniach nad wierszem).`;
  }
  return `Etap 3: Otrzymujemy wynik ${result.value.sumBinary} w U2${result.value.verifyNegativeInversion ? ` (sprawdzenie: po negacji + 1 daje ${result.value.verifyNegativeInversion.magnitude}, więc oznacza ${result.value.sumDecimalCheck})` : ` (= ${result.value.sumDecimalCheck})`}.`;
});

const chars = (s: string) => s.split('');
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="totalSteps"
      :explanation="explanation"
    />

    <div class="notebook-grid rounded-xl border border-slate-200 p-5 sm:p-6 dark:border-slate-800">
      <!-- Step 1: Operands conversion -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div
          v-for="(op, idx) in [result.a, result.b]"
          :key="'op-' + idx"
          class="rounded-lg border border-slate-200 bg-white p-4 font-mono text-xs sm:text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900"
        >
          <div class="mb-2 font-sans text-xs font-semibold text-slate-800 dark:text-slate-200">
            Składnik {{ idx + 1 }}: {{ op.decimal >= 0 ? '+' + op.decimal : op.decimal }}
          </div>
          <div class="space-y-1 text-slate-700 dark:text-slate-300">
            <div>Moduł |{{ op.decimal }}| = <strong class="text-slate-900 dark:text-slate-100">{{ op.absBinary }}</strong></div>
            <template v-if="op.invertedU1 !== null">
              <div>Negacja (U1): <span class="text-amber-700 dark:text-amber-400">{{ op.invertedU1 }}</span></div>
              <div>Dodaj 1 (U2): <strong class="text-blue-700 dark:text-blue-400">{{ op.u2Binary }}</strong></div>
            </template>
            <div v-else class="text-blue-700 dark:text-blue-400">
              Liczba dodatnia → U2 = <strong>{{ op.u2Binary }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Column Addition -->
      <div v-if="currentStep >= 2" class="mt-6 flex flex-col items-start">
        <div class="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
          Dodawanie pisemne w słupku (przeniesienia zapisane u góry):
        </div>

        <div class="rounded-lg border border-slate-200 bg-white px-5 py-4 font-mono text-lg sm:text-xl tabular-nums dark:border-slate-700 dark:bg-slate-900">
          <!-- Carries row -->
          <div class="flex items-center text-xs text-amber-600 dark:text-amber-400">
            <span class="w-8"></span>
            <span
              v-for="(c, idx) in chars(result.carriesRow)"
              :key="'c-' + idx"
              class="flex h-5 w-7 items-center justify-center font-bold"
            >
              {{ c === '1' ? '1' : '·' }}
            </span>
          </div>

          <!-- A -->
          <div class="flex items-center text-slate-900 dark:text-slate-100">
            <span class="w-8 text-sm text-slate-400"></span>
            <span
              v-for="(b, idx) in chars(result.a.u2Binary)"
              :key="'ab-' + idx"
              class="flex h-8 w-7 items-center justify-center font-semibold"
            >
              {{ b }}
            </span>
            <span class="ml-3 text-xs text-slate-500 dark:text-slate-400">({{ result.a.decimal }})</span>
          </div>

          <!-- B -->
          <div class="flex items-center border-b-2 border-slate-900 pb-1 text-slate-900 dark:border-slate-200 dark:text-slate-100">
            <span class="w-8 font-bold text-slate-600 dark:text-slate-400">+</span>
            <span
              v-for="(b, idx) in chars(result.b.u2Binary)"
              :key="'bb-' + idx"
              class="flex h-8 w-7 items-center justify-center font-semibold"
            >
              {{ b }}
            </span>
            <span class="ml-3 text-xs text-slate-500 dark:text-slate-400">({{ result.b.decimal }})</span>
          </div>

          <!-- Sum -->
          <div class="flex items-center pt-1.5 font-bold text-emerald-700 dark:text-emerald-400">
            <span class="w-8 text-xs text-slate-400 dark:text-slate-500">=</span>
            <span
              v-for="(b, idx) in chars(result.sumBinary)"
              :key="'sb-' + idx"
              class="flex h-8 w-7 items-center justify-center"
              :class="idx === 0 ? 'underline decoration-emerald-400 underline-offset-4 dark:decoration-emerald-500' : ''"
            >
              {{ b }}
            </span>
            <span class="ml-3 text-xs font-sans text-slate-600 dark:text-slate-400">({{ result.sumDecimalCheck }})</span>
          </div>
        </div>
      </div>

      <!-- Step 3: Verification -->
      <div
        v-if="currentStep >= 3 && result.verifyNegativeInversion"
        class="mt-4 rounded-lg border border-emerald-300 bg-emerald-50/70 px-4 py-3 font-mono text-xs sm:text-sm text-slate-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-slate-200"
      >
        <strong>Sprawdzenie wyniku ujemnego (MSB = 1):</strong>
        negacja({{ result.sumBinary }}) = {{ result.verifyNegativeInversion.inverted }} → +1 =
        {{ result.verifyNegativeInversion.plusOne }} (= {{ result.verifyNegativeInversion.magnitude }}), czyli wynik to
        <strong>{{ result.sumDecimalCheck }}</strong>. Zapis końcowy w U2:
        <strong class="text-emerald-800 dark:text-emerald-300">{{ result.sumBinary }}</strong>.
      </div>
    </div>
  </div>
</template>
