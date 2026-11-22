<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { solveBCDU9Addition } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  a: number;
  b: number;
}>();

const result = computed(() => solveBCDU9Addition(props.a, props.b));
const totalSteps = 3;
const currentStep = ref(1);

watch(
  () => [props.a, props.b],
  () => {
    currentStep.value = 1;
  }
);

const explanation = computed(() => {
  if (currentStep.value === 1) {
    return `Etap 1: Liczbę dodatnią zapisujemy wprost w kodzie BCD (8421), a liczbę ujemną zamieniamy najpierw na 2-cyfrowy kod U9 (99 − moduł) i potem każdą cyfrę na 4-bitowy blok BCD.`;
  }
  if (currentStep.value === 2) {
    const hasCorr = result.value.nibbleSteps.some((n) => n.needsCorrection);
    return hasCorr
      ? `Etap 2: Dodajemy odpowiednie bloki 4-bitowe. Ponieważ suma w bloku jedności przekroczyła 9 (> 1001), wykonujemy obowiązkową korekcję +0110 (+6) i przenosimy 1 do dziesiątek!`
      : `Etap 2: Dodajemy bloki 4-bitowe od prawej do lewej. Obie sumy są ≤ 9, więc korekcja +6 nie jest potrzebna.`;
  }
  return `Etap 3: Odczytujemy wynik końcowy w U9 zapisany w kodzie BCD: ${result.value.resultBcd} (${result.value.resultU9Dec} w U9, co odpowiada ${result.value.decodedDecimalResult}).`;
});
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="totalSteps"
      :explanation="explanation"
    />

    <div class="notebook-grid rounded-xl border border-[#e4dccb] p-5 sm:p-6 dark:border-slate-800">
      <!-- Step 1: Conversion to U9 + BCD -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] p-4 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-1.5 font-sans text-xs font-semibold text-stone-800 dark:text-slate-200">
            1. Pierwsza liczba: {{ a }}
          </div>
          <div class="text-stone-700 dark:text-slate-300">
            {{ a < 0 ? `U9(${a}) = 99 − ${Math.abs(a)} = ${result.aU9Dec}` : 'Dodatnia → bez zmiany' }}
          </div>
          <div class="mt-1 font-bold text-blue-700 dark:text-blue-400">BCD: {{ result.aBcd }}</div>
        </div>

        <div class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] p-4 font-mono text-sm tabular-nums dark:border-slate-700 dark:bg-slate-900">
          <div class="mb-1.5 font-sans text-xs font-semibold text-stone-800 dark:text-slate-200">
            2. Druga liczba: {{ b }}
          </div>
          <div class="text-stone-700 dark:text-slate-300">
            {{ b < 0 ? `U9(${b}) = 99 − ${Math.abs(b)} = ${result.bU9Dec}` : 'Dodatnia → bez zmiany' }}
          </div>
          <div class="mt-1 font-bold text-blue-700 dark:text-blue-400">BCD: {{ result.bBcd }}</div>
        </div>
      </div>

      <!-- Step 2: Nibble-by-nibble addition with +6 correction -->
      <div v-if="currentStep >= 2" class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <!-- Show Tens on left, Ones on right (visual match to written columns!) -->
        <div
          v-for="nib in [result.nibbleSteps[1], result.nibbleSteps[0]]"
          :key="nib.positionLabel"
          class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <div class="mb-2 text-xs font-semibold text-stone-700 dark:text-slate-300">{{ nib.positionLabel }}</div>
          <div class="space-y-1 font-mono text-base tabular-nums text-stone-900 dark:text-slate-100">
            <div v-if="nib.incomingCarry > 0" class="text-xs font-bold text-amber-700 dark:text-amber-400">
              +1 (przeniesienie z jedności)
            </div>
            <div class="flex justify-between">
              <span>{{ nib.bcdA }}</span>
              <span class="text-stone-500 dark:text-slate-500">({{ nib.digitA }})</span>
            </div>
            <div class="flex justify-between border-b border-stone-800 pb-1 dark:border-slate-300">
              <span>+ {{ nib.bcdB }}</span>
              <span class="text-stone-500 dark:text-slate-500">({{ nib.digitB }})</span>
            </div>
            <div class="flex justify-between pt-0.5 font-semibold">
              <span>{{ nib.rawSumBin }}</span>
              <span :class="nib.needsCorrection ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'">
                ({{ nib.rawSumDec }}{{ nib.needsCorrection ? ' > 9!' : ' ≤ 9' }})
              </span>
            </div>
            <template v-if="nib.needsCorrection">
              <div class="flex justify-between border-b border-amber-600 pb-1 text-amber-700 dark:border-amber-500 dark:text-amber-400">
                <span>+ 0110</span>
                <span class="text-xs font-sans font-semibold">(korekcja +6)</span>
              </div>
              <div class="flex justify-between pt-0.5 font-bold text-emerald-700 dark:text-emerald-400">
                <span>{{ nib.finalBcd }}</span>
                <span class="text-xs font-sans">({{ nib.finalDigit }}, przen. {{ nib.carryOut }})</span>
              </div>
            </template>
          </div>
          <p class="mt-2 text-xs leading-relaxed text-stone-600 dark:text-slate-400">{{ nib.explanation }}</p>
        </div>
      </div>

      <!-- Step 3: Final Answer -->
      <div
        v-if="currentStep >= 3"
        class="mt-5 rounded-lg border border-emerald-300 bg-emerald-50/70 px-4 py-3 text-sm dark:border-emerald-700 dark:bg-emerald-950/50"
      >
        <div class="font-mono text-base font-bold text-stone-900 dark:text-slate-100">
          Wynik w U9 zapisany w BCD: <span class="text-emerald-800 dark:text-emerald-300">{{ result.resultBcd }}</span>
        </div>
        <div class="mt-1 text-xs text-stone-700 dark:text-slate-300">
          Brak przeniesienia z najstarszej pozycji (dziesiątek) oznacza wynik ujemny w kodzie U9:
          <span class="font-mono font-semibold">{{ result.resultU9Dec }}</span> w U9 = −(99 − {{ result.resultU9Dec }}) =
          <strong>{{ result.decodedDecimalResult }}</strong> (zgodnie z {{ a }} + ({{ b }}) = {{ a + b }}).
        </div>
      </div>
    </div>
  </div>
</template>
