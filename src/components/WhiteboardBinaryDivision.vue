<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { solveBinaryDivision } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  dividend: string;
  divisor: string;
}>();

const result = computed(() => solveBinaryDivision(props.dividend, props.divisor));
const currentStep = ref(result.value.steps.length);

watch(
  () => [props.dividend, props.divisor],
  () => {
    currentStep.value = result.value.steps.length;
  }
);

const visibleSteps = computed(() => result.value.steps.slice(0, currentStep.value));
const activeStep = computed(() => visibleSteps.value[visibleSteps.value.length - 1]);

// Build visual rows matching whiteboard photo 1 (image_c4352989.png)
interface VisualSubBlock {
  stepNum: number;
  startCol: number;
  endCol: number;
  currentPadded: string;
  subtrahendPadded: string;
  remainderPadded: string;
  borrows: number[];
  droppedCols: number[]; // indices dropped right after this subtraction
  nextAfterDrops: string | null;
  nextStartCol: number;
}

const visualBlocks = computed(() => {
  const blocks: VisualSubBlock[] = [];
  const allSteps = result.value.steps;
  const limit = currentStep.value;

  for (let i = 0; i < limit; i++) {
    const st = allSteps[i];
    if (st.kind === 'subtract' && st.remainderAfterSubBin !== null) {
      const droppedCols: number[] = [];
      let nextAfterDrops = st.nextValueAfterDropBin;
      if (st.droppedBitIndex !== null && i + 1 < limit) {
        droppedCols.push(st.droppedBitIndex);
      } else if (st.droppedBitIndex !== null && currentStep.value > i) {
        // show the drop if this step itself ran
        droppedCols.push(st.droppedBitIndex);
      }

      // Collect consecutive drop-zero steps that immediately follow within visible limit
      let j = i + 1;
      while (j < limit && allSteps[j].kind === 'drop-zero') {
        const dz = allSteps[j];
        if (dz.droppedBitIndex !== null) {
          droppedCols.push(dz.droppedBitIndex);
          nextAfterDrops = dz.nextValueAfterDropBin;
        }
        j++;
      }

      const nextEndCol = droppedCols.length > 0 ? droppedCols[droppedCols.length - 1] : st.endCol;
      const lenDiff = st.currentValueBin.length;
      const nextStrLen = nextAfterDrops ? nextAfterDrops.length : lenDiff;

      blocks.push({
        stepNum: st.stepNum,
        startCol: st.startCol,
        endCol: st.endCol,
        currentPadded: st.currentValueBin,
        subtrahendPadded: st.divisorBin.padStart(st.currentValueBin.length, ' '),
        remainderPadded: st.remainderAfterSubBin,
        borrows: st.borrows,
        droppedCols,
        nextAfterDrops,
        nextStartCol: nextEndCol - nextStrLen + 1,
      });
    }
  }
  return blocks;
});

const visibleQuotientAligned = computed(() => {
  const arr: (string | null)[] = Array(result.value.dividend.length).fill(null);
  for (const st of visibleSteps.value) {
    arr[st.quotientCol] = st.quotientBit;
  }
  return arr;
});

const charArray = (str: string) => str.split('');
</script>

<template>
  <div class="space-y-4">
    <StepControls
      v-model:current-step="currentStep"
      :total-steps="result.steps.length"
      :explanation="activeStep?.explanation ?? ''"
    />

    <!-- Whiteboard grid mimicking image_c4352989.png -->
    <div class="notebook-grid overflow-x-auto rounded-xl border border-slate-200 p-5 sm:p-7">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>Zapis pisemny zgodny z tablicą (iloraz nad kreską, pionowe linie spuszczania bitów)</span>
        <span class="font-mono tabular-nums">
          Sprawdzenie dziesiętne: {{ result.decimalCheck.dividendDec }} : {{ result.decimalCheck.divisorDec }} = {{ result.decimalCheck.quotientDec }}
          <template v-if="result.decimalCheck.remainderDec > 0"> (r. {{ result.decimalCheck.remainderDec }})</template>
        </span>
      </div>

      <div class="inline-block min-w-max font-mono text-lg sm:text-xl leading-none select-text tabular-nums">
        <!-- Quotient Row ABOVE bar -->
        <div class="flex items-center">
          <span class="w-8"></span>
          <div class="flex">
            <span
              v-for="(qBit, idx) in visibleQuotientAligned"
              :key="'q-' + idx"
              class="flex h-8 w-7 items-center justify-center font-bold transition-colors"
              :class="
                qBit !== null
                  ? idx === activeStep?.quotientCol
                    ? 'text-blue-700 bg-blue-100/80 rounded'
                    : 'text-emerald-700'
                  : 'text-transparent'
              "
            >
              {{ qBit ?? '\u00A0' }}
            </span>
          </div>
        </div>

        <!-- Horizontal Bar above Dividend -->
        <div class="flex items-center">
          <span class="w-8"></span>
          <div
            class="border-b-2 border-slate-900"
            :style="{ width: `${result.dividend.length * 1.75}rem` }"
          ></div>
        </div>

        <!-- Dividend : Divisor Row -->
        <div class="flex items-center pt-1.5 pb-1">
          <span class="w-8"></span>
          <div class="flex">
            <span
              v-for="(bit, idx) in charArray(result.dividend)"
              :key="'d-' + idx"
              class="relative flex h-8 w-7 items-center justify-center font-semibold text-slate-900"
            >
              {{ bit }}
            </span>
          </div>
          <span class="mx-3 font-bold text-slate-700">:</span>
          <span class="font-bold tracking-wider text-slate-900">{{ result.divisor }}</span>
        </div>

        <!-- Subtraction Steps Stack -->
        <div v-for="(blk, bIdx) in visualBlocks" :key="'blk-' + bIdx" class="mt-0.5">
          <!-- For bIdx > 0, show the brought-down working row first -->
          <div v-if="bIdx > 0" class="flex items-center">
            <span class="w-8"></span>
            <div class="flex">
              <span
                v-for="c in result.dividend.length"
                :key="'w-' + bIdx + '-' + c"
                class="relative flex h-8 w-7 items-center justify-center font-semibold"
                :class="
                  c - 1 >= blk.startCol && c - 1 <= blk.endCol
                    ? 'text-slate-900'
                    : 'text-transparent'
                "
              >
                <template v-if="c - 1 >= blk.startCol && c - 1 <= blk.endCol">
                  <!-- Borrow tick above digit if borrowed -->
                  <span
                    v-if="blk.borrows.includes(c - 1 - blk.startCol)"
                    class="absolute -top-1.5 right-0.5 text-[11px] font-bold text-amber-600"
                    title="Pożyczka (10₂ − 1₂ = 1₂)"
                    >″</span
                  >
                  {{ blk.currentPadded[c - 1 - blk.startCol] }}
                </template>
              </span>
            </div>
          </div>

          <div class="flex items-center">
            <span class="w-8"></span>
            <div class="relative flex items-center">
              <span
                v-for="c in result.dividend.length"
                :key="'sub-' + bIdx + '-' + c"
                class="relative flex h-8 w-7 items-center justify-center text-slate-800"
              >
                <!-- Minus sign right before the leading 1 of the divisor -->
                <span
                  v-if="c - 1 === blk.endCol - result.divisor.length + 1"
                  class="absolute -left-5 font-bold text-rose-700"
                  >−</span
                >
                <span v-if="c - 1 >= blk.startCol && c - 1 <= blk.endCol">
                  {{ blk.subtrahendPadded[c - 1 - blk.startCol] }}
                </span>
                <!-- Horizontal bar under divisor -->
                <span
                  v-if="c - 1 >= blk.endCol - result.divisor.length + 1 && c - 1 <= blk.endCol"
                  class="absolute right-0 bottom-0 left-0 border-b-2 border-slate-800"
                ></span>
              </span>
            </div>
          </div>

          <!-- Remainder + Vertical drop-down guide lines (like whiteboard!) -->
          <div class="flex items-center pt-1">
            <span class="w-8"></span>
            <div class="flex items-center">
              <span
                v-for="c in result.dividend.length"
                :key="'rem-' + bIdx + '-' + c"
                class="relative flex h-8 w-7 items-center justify-center"
              >
                <!-- If this column is part of the remainder -->
                <span
                  v-if="c - 1 >= blk.startCol && c - 1 <= blk.endCol"
                  class="font-semibold"
                  :class="
                    bIdx === visualBlocks.length - 1 && !blk.nextAfterDrops
                      ? 'text-emerald-700 font-bold'
                      : 'text-slate-700'
                  "
                >
                  {{ blk.remainderPadded[c - 1 - blk.startCol] }}
                </span>

                <!-- If this column was dropped down in this block, show vertical guide line + dropped bit -->
                <span
                  v-if="blk.droppedCols.includes(c - 1)"
                  class="relative flex h-8 w-7 items-center justify-center font-bold text-blue-700"
                >
                  <span
                    class="pointer-events-none absolute -top-20 bottom-6 left-1/2 w-px -translate-x-1/2 border-l border-dashed border-blue-400"
                    aria-hidden="true"
                  ></span>
                  {{ result.dividend[c - 1] }}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Legend for whiteboard symbols -->
      <div class="mt-5 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-600">
        <span><strong class="font-mono text-emerald-700">Zielone cyfry u góry</strong> = wynik (iloraz)</span>
        <span><strong class="font-mono text-blue-700">Przerywana linia ↓</strong> = opuszczenie kolejnego bitu dzielnej</span>
        <span><strong class="font-mono text-amber-600">″</strong> = pożyczka binarna (10₂ − 1₂ = 1₂)</span>
      </div>
    </div>

    <!-- Step list summary -->
    <details class="rounded-lg border border-slate-200 bg-white">
      <summary class="cursor-pointer px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
        Lista wszystkich kroków dzielenia ({{ visibleSteps.length }} z {{ result.steps.length }})
      </summary>
      <ol class="divide-y divide-slate-100 border-t border-slate-200 px-4 py-2 text-xs text-slate-700">
        <li
          v-for="s in visibleSteps"
          :key="s.stepNum"
          class="py-2 leading-relaxed"
          :class="s.stepNum === activeStep?.stepNum ? 'font-medium text-blue-900' : ''"
        >
          <span class="font-mono font-semibold text-slate-500">{{ s.stepNum }}.</span> {{ s.explanation }}
        </li>
      </ol>
    </details>
  </div>
</template>
