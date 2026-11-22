<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { solveHexMultiplication } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  aHex: string;
  bHex: string;
}>();

const result = computed(() => solveHexMultiplication(props.aHex, props.bHex));

// Total steps = partialProducts.length (each row) + 1 (final addition)
const totalSteps = computed(() => result.value.partialProducts.length + 1);
const currentStep = ref(totalSteps.value);

watch(
  () => [props.aHex, props.bHex],
  () => {
    currentStep.value = totalSteps.value;
  }
);

const HEX_LEGEND = [
  { hex: 'A', dec: 10 },
  { hex: 'B', dec: 11 },
  { hex: 'C', dec: 12 },
  { hex: 'D', dec: 13 },
  { hex: 'E', dec: 14 },
  { hex: 'F', dec: 15 },
];

const maxColWidth = computed(() =>
  Math.max(
    result.value.resultHex.length,
    result.value.aHex.length + 1,
    result.value.bHex.length + 1
  )
);

const padLeftChars = (str: string, shiftRight: number, totalWidth: number): string[] => {
  const arr = Array(totalWidth).fill('');
  for (let i = 0; i < str.length; i++) {
    const colFromRight = shiftRight + (str.length - 1 - i);
    const targetIdx = totalWidth - 1 - colFromRight;
    if (targetIdx >= 0 && targetIdx < totalWidth) {
      arr[targetIdx] = str[i];
    }
  }
  return arr;
};

const visiblePartials = computed(() =>
  result.value.partialProducts.slice(0, Math.min(currentStep.value, result.value.partialProducts.length))
);

const showFinalSum = computed(() => currentStep.value >= totalSteps.value);

const currentExplanation = computed(() => {
  if (currentStep.value <= result.value.partialProducts.length) {
    const p = result.value.partialProducts[currentStep.value - 1];
    return `Mnożymy górną liczbę (${result.value.aHex}) przez cyfrę '${p.multiplierDigit}' (${p.multiplierDec}₁₀), przesuwając wiersz o ${p.shift} kolumn(y) w lewo → wynik cząstkowy: ${p.rowHex}. Po prawej stronie zobaczysz dzielenie sum cząstkowych przez 16.`;
  }
  return `Dodajemy wszystkie iloczyny częściowe w kolumnach od prawej do lewej (w systemie 16). Ostateczny wynik: (${result.value.resultHex})₁₆.`;
});
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="totalSteps"
      :explanation="currentExplanation"
    />

    <!-- Whiteboard grid mimicking image_29e0f29a.png -->
    <div class="notebook-grid overflow-x-auto rounded-xl border border-slate-200 p-5 sm:p-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Zapis pisemny zgodny z tablicą: słownik po lewej, słupek w środku, brudnopis ÷ 16 po prawej</span>
        <span class="font-mono tabular-nums">
          Sprawdzenie: {{ result.decimalCheck.aDec }} · {{ result.decimalCheck.bDec }} = {{ result.decimalCheck.productDec }}₁₀
        </span>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <!-- Left column: A-10 .. F-15 Legend -->
        <div class="lg:col-span-2">
          <div class="rounded-lg border border-slate-200 bg-white/90 p-3">
            <div class="mb-2 text-xs font-semibold text-slate-700">Słownik cyfr</div>
            <div class="grid grid-cols-3 gap-1.5 font-mono text-sm lg:grid-cols-1 tabular-nums">
              <div
                v-for="item in HEX_LEGEND"
                :key="item.hex"
                class="flex items-center justify-between rounded bg-slate-50 px-2 py-0.5 text-slate-800"
              >
                <span class="font-bold text-blue-800">{{ item.hex }}</span>
                <span class="text-slate-400">–</span>
                <span>{{ item.dec }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Center column: Vertical Multiplication -->
        <div class="flex flex-col items-center justify-start lg:col-span-5">
          <div class="inline-block font-mono text-xl sm:text-2xl leading-snug tabular-nums">
            <!-- Top carries from active partial product -->
            <div
              v-if="currentStep <= result.partialProducts.length"
              class="flex justify-end text-xs text-amber-700"
            >
              <span
                v-for="(ch, idx) in padLeftChars(result.aHex, 0, maxColWidth)"
                :key="'carry-' + idx"
                class="flex h-5 w-8 items-center justify-center font-bold"
              >
                <template v-if="ch !== ''">
                  {{
                    result.partialProducts[currentStep - 1].carriesAboveA[
                      idx - (maxColWidth - result.aHex.length)
                    ] || ''
                  }}
                </template>
              </span>
            </div>

            <!-- Operand A -->
            <div class="flex justify-end font-semibold text-slate-900">
              <span
                v-for="(ch, idx) in padLeftChars(result.aHex, 0, maxColWidth)"
                :key="'a-' + idx"
                class="flex h-8 w-8 items-center justify-center"
              >
                {{ ch }}
              </span>
            </div>

            <!-- Operand B with multiply symbol -->
            <div class="flex justify-end border-b-2 border-slate-900 pb-1 font-semibold text-slate-900">
              <span
                v-for="(ch, idx) in padLeftChars(result.bHex, 0, maxColWidth)"
                :key="'b-' + idx"
                class="relative flex h-8 w-8 items-center justify-center"
              >
                <span
                  v-if="idx === maxColWidth - result.bHex.length - 1"
                  class="text-base font-bold text-slate-600"
                  >·</span
                >
                {{ ch }}
              </span>
            </div>

            <!-- Partial Products -->
            <div class="py-1">
              <div
                v-for="(prod, pIdx) in visiblePartials"
                :key="'p-' + pIdx"
                class="flex justify-end transition-colors"
                :class="
                  pIdx === currentStep - 1 && !showFinalSum
                    ? 'rounded bg-blue-50/90 text-blue-900 font-semibold'
                    : 'text-slate-800'
                "
              >
                <span
                  v-for="(ch, idx) in padLeftChars(prod.rowHex, prod.shift, maxColWidth)"
                  :key="'p-' + pIdx + '-' + idx"
                  class="flex h-8 w-8 items-center justify-center"
                >
                  <template v-if="ch !== ''">{{ ch }}</template>
                  <template v-else-if="idx >= maxColWidth - prod.shift && idx < maxColWidth">
                    <span class="text-xs text-slate-300">·</span>
                  </template>
                </span>
              </div>
            </div>

            <!-- Final Sum -->
            <div
              v-if="showFinalSum"
              class="flex justify-end border-t-2 border-slate-900 pt-1.5 font-bold text-emerald-700"
            >
              <span
                v-for="(ch, idx) in padLeftChars(result.resultHex, 0, maxColWidth)"
                :key="'res-' + idx"
                class="flex h-9 w-8 items-center justify-center"
              >
                {{ ch }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right column: Scratchpad ÷ 16 (just like 63 | 3, 101 | 6 on the whiteboard!) -->
        <div class="lg:col-span-5">
          <div class="rounded-lg border border-slate-200 bg-white/95 p-3.5">
            <div class="mb-2 text-xs font-semibold text-slate-700">
              Brudnopis obliczeń na boku (wartość dziesiętna → dzielenie przez 16)
            </div>

            <div class="space-y-3">
              <div
                v-for="(prod, pIdx) in visiblePartials"
                :key="'sp-' + pIdx"
                class="rounded-md border p-2.5 text-xs"
                :class="
                  pIdx === currentStep - 1 && !showFinalSum
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-slate-100 bg-slate-50/70'
                "
              >
                <div class="mb-1.5 font-semibold text-slate-800">
                  Mnożenie przez {{ prod.multiplierDigit }} ({{ prod.multiplierDec }}):
                </div>
                <div class="space-y-1 font-mono text-xs tabular-nums">
                  <div
                    v-for="(entry, eIdx) in prod.scratchpad"
                    :key="'e-' + eIdx"
                    class="flex flex-wrap items-center justify-between gap-2 text-slate-700"
                  >
                    <span>{{ entry.expr }} = <strong class="text-slate-900">{{ entry.totalDec }}</strong></span>
                    <span class="text-slate-600">
                      {{ entry.carryOut }}·16 + {{ entry.digitRem }} → wpisz
                      <strong class="text-blue-700">{{ entry.digitHex }}</strong>, przenieś
                      <strong class="text-amber-700">{{ entry.carryOut }}</strong>
                    </span>
                  </div>
                </div>
              </div>

              <!-- Addition breakdown -->
              <div
                v-if="showFinalSum"
                class="rounded-md border border-emerald-200 bg-emerald-50/50 p-2.5 text-xs"
              >
                <div class="mb-1.5 font-semibold text-emerald-900">
                  Sumowanie kolumn od prawej do lewej (w bazie 16):
                </div>
                <ul class="space-y-1 font-mono text-xs text-slate-700 tabular-nums">
                  <li v-for="col in result.additionColumns" :key="'ac-' + col.colFromRight">
                    {{ col.explanation }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
