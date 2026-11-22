<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  solveDecimalToBinary,
  solveBaseConversions,
  solveAnyBaseToAnyBase,
} from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  mode: 'decimal-to-binary' | 'base-conversions' | 'any-base-to-any-base';
  params: Record<string, unknown>;
}>();

const decToBinResult = computed(() =>
  props.mode === 'decimal-to-binary'
    ? solveDecimalToBinary(String(props.params.value ?? '43,2'))
    : null
);

const multiBaseResult = computed(() =>
  props.mode === 'base-conversions'
    ? solveBaseConversions(
        Number(props.params.decimal ?? 426),
        (props.params.bases as number[]) ?? [4, 8, 16]
      )
    : null
);

const anyBaseResult = computed(() =>
  props.mode === 'any-base-to-any-base'
    ? solveAnyBaseToAnyBase(
        String(props.params.source ?? '3A4'),
        Number(props.params.fromBase ?? 13),
        Number(props.params.toBase ?? 7)
      )
    : null
);

const totalSteps = computed(() => {
  if (props.mode === 'decimal-to-binary' && decToBinResult.value) {
    return decToBinResult.value.hasFraction ? 3 : 2;
  }
  if (props.mode === 'base-conversions' && multiBaseResult.value) {
    return multiBaseResult.value.length;
  }
  return 3;
});

const currentStep = ref(totalSteps.value);
watch(
  () => [props.mode, JSON.stringify(props.params)],
  () => {
    currentStep.value = totalSteps.value;
  }
);

const explanation = computed(() => {
  if (props.mode === 'decimal-to-binary' && decToBinResult.value) {
    if (currentStep.value === 1) {
      return `Etap 1: Konwertujemy część całkowitą (${decToBinResult.value.integerPart}) przez wielokrotne dzielenie przez 2, spisując reszty od dołu do góry → ${decToBinResult.value.integerBinary}.`;
    }
    if (currentStep.value === 2 && decToBinResult.value.hasFraction) {
      return decToBinResult.value.isRepeating
        ? `Etap 2: Mnożymy część ułamkową przez 2, spisując cyfry całkowite od góry do dołu. Zauważamy powrót do wartości wyjściowej — powstaje okres (${decToBinResult.value.repeatingBits})!`
        : `Etap 2: Mnożymy część ułamkową przez 2, spisując cyfry całkowite od góry do dołu aż do uzyskania zera w części ułamkowej.`;
    }
    return `Etap końcowy: Łączymy część całkowitą i ułamkową → wynik: ${decToBinResult.value.formattedBinary}₂.`;
  }
  if (props.mode === 'base-conversions' && multiBaseResult.value) {
    const active = multiBaseResult.value[currentStep.value - 1];
    return `Konwersja na system o podstawie ${active.targetBase}: dzielimy ${props.params.decimal} kolejno przez ${active.targetBase} i odczytujemy reszty od dołu do góry → (${active.result})_${active.targetBase}.`;
  }
  if (props.mode === 'any-base-to-any-base' && anyBaseResult.value) {
    if (currentStep.value === 1) {
      return `Etap 1: Rozpisujemy liczbę (${anyBaseResult.value.sourceStr})_${anyBaseResult.value.fromBase} na sumę potęg podstawy ${anyBaseResult.value.fromBase}, aby uzyskać wartość w systemie dziesiętnym (${anyBaseResult.value.decimalValue}₁₀).`;
    }
    if (currentStep.value === 2) {
      return `Etap 2: Dzielimy wynik dziesiętny (${anyBaseResult.value.decimalValue}) kolejno z resztą przez nową podstawę ${anyBaseResult.value.toBase}.`;
    }
    return `Etap 3: Odczytujemy reszty od dołu do góry → (${anyBaseResult.value.resultStr})_${anyBaseResult.value.toBase}.`;
  }
  return '';
});
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="totalSteps"
      :explanation="explanation"
    />

    <!-- Mode 1: Decimal to Binary (Integer + Fraction/Periodic) -->
    <div
      v-if="mode === 'decimal-to-binary' && decToBinResult"
      class="notebook-grid rounded-xl border border-slate-200 p-5 sm:p-6"
    >
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Part 1: Integer division ladder -->
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="text-xs font-semibold text-slate-700">
              1. Część całkowita ({{ decToBinResult.integerPart }}) — dzielenie przez 2
            </span>
            <span class="text-xs font-medium text-blue-700">Czytaj od dołu ↑</span>
          </div>

          <div class="space-y-1 font-mono text-sm tabular-nums">
            <div
              v-for="(st, idx) in decToBinResult.intSteps"
              :key="'int-' + idx"
              class="grid grid-cols-12 items-center rounded px-2 py-1 odd:bg-slate-50"
            >
              <span class="col-span-5 text-slate-800">{{ st.n }} : 2 = {{ st.quotient }}</span>
              <span class="col-span-3 text-slate-500">reszta</span>
              <span class="col-span-4 text-right font-bold text-blue-700">{{ st.digit }}</span>
            </div>
          </div>

          <div class="mt-3 border-t border-slate-200 pt-2.5 font-mono text-sm">
            Część całkowita: <strong class="text-slate-900">{{ decToBinResult.integerBinary }}₂</strong>
          </div>
        </div>

        <!-- Part 2: Fractional multiplication -->
        <div
          v-if="decToBinResult.hasFraction && currentStep >= 2"
          class="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div class="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="text-xs font-semibold text-slate-700">
              2. Część ułamkowa — mnożenie przez 2
            </span>
            <span class="text-xs font-medium text-emerald-700">Czytaj od góry ↓</span>
          </div>

          <div class="space-y-1.5 font-mono text-sm tabular-nums">
            <div
              v-for="fst in decToBinResult.fracSteps"
              :key="'frac-' + fst.stepNum"
              class="flex flex-wrap items-center justify-between gap-2 rounded px-2.5 py-1.5"
              :class="
                fst.repeatsStartStep !== null
                  ? 'border border-amber-300 bg-amber-50/70'
                  : 'odd:bg-slate-50'
              "
            >
              <span class="text-slate-800">
                {{ fst.currentFracStr }} · 2 = {{ fst.multipliedStr }}
              </span>
              <span class="flex items-center gap-2">
                <span class="text-xs text-slate-500">bit:</span>
                <strong class="text-base text-emerald-700">{{ fst.integerBit }}</strong>
              </span>
              <div
                v-if="fst.repeatsStartStep !== null"
                class="w-full text-xs font-sans font-medium text-amber-800"
              >
                Reszta {{ fst.nextFracStr }} powtarza się od kroku {{ fst.repeatsStartStep }} — zamknięcie okresu!
              </div>
            </div>
          </div>

          <div class="mt-3 border-t border-slate-200 pt-2.5 font-mono text-sm">
            Część po przecinku:
            <strong class="text-emerald-700">
              ,{{ decToBinResult.nonRepeatingBits }}<template v-if="decToBinResult.isRepeating">({{ decToBinResult.repeatingBits }})</template>
            </strong>
          </div>
        </div>
      </div>

      <div
        v-if="currentStep >= totalSteps"
        class="mt-5 rounded-lg border border-emerald-300 bg-emerald-50/70 px-4 py-3 font-mono text-base font-bold text-slate-900"
      >
        Wynik końcowy: ({{ decToBinResult.formattedBinary }})₂
      </div>
    </div>

    <!-- Mode 2: Multi-base conversions (4, 8, 16) -->
    <div
      v-if="mode === 'base-conversions' && multiBaseResult"
      class="notebook-grid rounded-xl border border-slate-200 p-5 sm:p-6"
    >
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          v-for="(conv, cIdx) in multiBaseResult.slice(0, currentStep)"
          :key="'conv-' + conv.targetBase"
          class="rounded-lg border bg-white p-4 transition-colors"
          :class="cIdx === currentStep - 1 ? 'border-blue-300' : 'border-slate-200'"
        >
          <div class="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="text-xs font-semibold text-slate-800">
              System o podstawie {{ conv.targetBase }}
            </span>
            <span class="text-xs font-medium text-blue-700">Od dołu ↑</span>
          </div>

          <div class="space-y-1 font-mono text-xs sm:text-sm tabular-nums">
            <div
              v-for="(st, idx) in conv.steps"
              :key="'bs-' + conv.targetBase + '-' + idx"
              class="flex items-center justify-between rounded px-2 py-1 odd:bg-slate-50"
            >
              <span class="text-slate-700">{{ st.n }} : {{ st.base }} = {{ st.quotient }}</span>
              <span class="font-bold text-blue-700">
                r. {{ st.remainder }}<template v-if="st.remainder >= 10"> ({{ st.digit }})</template>
              </span>
            </div>
          </div>

          <div class="mt-3 border-t border-slate-200 pt-2.5 font-mono text-sm font-bold text-emerald-700">
            Wynik: ({{ conv.result }})<sub>{{ conv.targetBase }}</sub>
          </div>
        </div>
      </div>
    </div>

    <!-- Mode 3: Any base -> 10 -> Target base -->
    <div
      v-if="mode === 'any-base-to-any-base' && anyBaseResult"
      class="notebook-grid rounded-xl border border-slate-200 p-5 sm:p-6"
    >
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Step 1: Positional expansion -->
        <div class="rounded-lg border border-slate-200 bg-white p-4">
          <div class="mb-3 border-b border-slate-100 pb-2 text-xs font-semibold text-slate-800">
            Etap 1: Zamiana ({{ anyBaseResult.sourceStr }})<sub>{{ anyBaseResult.fromBase }}</sub> na system dziesiętny
          </div>

          <div class="space-y-2 font-mono text-sm tabular-nums">
            <div
              v-for="term in anyBaseResult.positionalTerms"
              :key="'term-' + term.power"
              class="flex items-center justify-between rounded bg-slate-50 px-3 py-1.5"
            >
              <span>
                <strong class="text-blue-700">{{ term.digit }}</strong>
                <span v-if="term.digitValue >= 10" class="text-slate-500">({{ term.digitValue }})</span>
                · {{ anyBaseResult.fromBase }}<sup>{{ term.power }}</sup>
                <span class="text-slate-500"> (= {{ term.basePowerVal }})</span>
              </span>
              <strong class="text-slate-900">{{ term.termProduct }}</strong>
            </div>
          </div>

          <div class="mt-3 border-t border-slate-200 pt-2.5 font-mono text-sm">
            Suma dziesiętna: <strong class="text-blue-800">{{ anyBaseResult.decimalValue }}₁₀</strong>
          </div>
        </div>

        <!-- Step 2: Repeated division to target base -->
        <div
          v-if="currentStep >= 2"
          class="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div class="mb-3 flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="text-xs font-semibold text-slate-800">
              Etap 2: Zamiana {{ anyBaseResult.decimalValue }}₁₀ na podstawę {{ anyBaseResult.toBase }}
            </span>
            <span class="text-xs font-medium text-blue-700">Czytaj od dołu ↑</span>
          </div>

          <div class="space-y-1 font-mono text-sm tabular-nums">
            <div
              v-for="(st, idx) in anyBaseResult.divisionSteps"
              :key="'div-' + idx"
              class="flex items-center justify-between rounded px-2.5 py-1.5 odd:bg-slate-50"
            >
              <span>{{ st.n }} : {{ st.base }} = {{ st.quotient }}</span>
              <strong class="text-emerald-700">reszta {{ st.digit }}</strong>
            </div>
          </div>

          <div
            v-if="currentStep >= 3"
            class="mt-3 border-t border-slate-200 pt-2.5 font-mono text-base font-bold text-emerald-700"
          >
            Wynik końcowy: ({{ anyBaseResult.resultStr }})<sub>{{ anyBaseResult.toBase }}</sub>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
