<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { solveIEEE754Decode, solveIEEE754Encode } from '../math/solvers';
import StepControls from './StepControls.vue';

const props = defineProps<{
  mode: 'decode' | 'encode';
  bitsOrValue: string;
  bias: number;
}>();

const decodeRes = computed(() =>
  props.mode === 'decode' ? solveIEEE754Decode(props.bitsOrValue, props.bias) : null
);
const encodeRes = computed(() =>
  props.mode === 'encode' ? solveIEEE754Encode(props.bitsOrValue, props.bias) : null
);

const totalSteps = 4;
const currentStep = ref(1);
watch(
  () => [props.mode, props.bitsOrValue, props.bias],
  () => {
    currentStep.value = 1;
  }
);

const explanation = computed(() => {
  if (props.mode === 'decode' && decodeRes.value) {
    const d = decodeRes.value;
    if (currentStep.value === 1)
      return `Krok 1: Dzielimy 16 bitów na 3 pola: znak S = ${d.signBit} (${d.signMultiplier === 1 ? '+' : '−'}), cecha E = ${d.exponentBits}, mantysa M = ${d.mantissaBits}.`;
    if (currentStep.value === 2)
      return `Krok 2: Przeliczamy cechę E = ${d.exponentBits}₂ = ${d.exponentBiased}₁₀ i odejmujemy bias (${d.bias}): wykładnik rzeczywisty e = ${d.exponentBiased} − ${d.bias} = ${d.exponentActual}.`;
    if (currentStep.value === 3)
      return `Krok 3: Dodajemy domyślną jedynkę przed przecinkiem mantysy: ${d.mantissaBinary}₂ i mnożymy przez 2^${d.exponentActual} → ${d.denormalizedBinary}₂.`;
    return `Krok 4: Zamieniamy na system dziesiętny wraz ze znakiem → wynik: ${d.formattedPolish}.`;
  }
  if (props.mode === 'encode' && encodeRes.value) {
    const e = encodeRes.value;
    if (currentStep.value === 1)
      return `Krok 1: Ustalenie znaku: liczba ${e.inputStr} jest ${e.signBit === '1' ? 'ujemna, więc S = 1' : 'dodatnia, więc S = 0'}. Moduł zapisujemy dwójkowo: ${e.absBinary}₂.`;
    if (currentStep.value === 2)
      return `Krok 2: Normalizacja do postaci 1,xxxx · 2^e → ${e.normalizedBinary} (wykładnik rzeczywisty e = ${e.exponentActual}).`;
    if (currentStep.value === 3)
      return `Krok 3: Obliczenie cechy z biasem: E = e + ${e.bias} = ${e.exponentActual} + ${e.bias} = ${e.exponentBiased}₁₀ = ${e.exponentBits}₂ (5 bitów).`;
    return `Krok 4: Wpisujemy bity ułamkowe mantysy i dopełniamy zerami z prawej do 10 bitów (${e.mantissaBits}) → całość: ${e.bits16}.`;
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

    <div class="notebook-grid rounded-xl border border-[#e4dccb] p-5 sm:p-6 dark:border-slate-800">
      <!-- 16-bit Field Diagram -->
      <div class="mb-6 overflow-x-auto">
        <div class="inline-flex min-w-max gap-3 font-mono tabular-nums">
          <!-- Sign bit (1) -->
          <div class="rounded-lg border border-rose-300 bg-rose-50/70 p-3 text-center dark:border-rose-700 dark:bg-rose-950/50">
            <div class="mb-1 text-[11px] font-sans font-semibold text-rose-800 dark:text-rose-300">Znak (1 bit)</div>
            <div class="text-xl font-bold text-rose-900 dark:text-rose-200">
              {{ mode === 'decode' ? decodeRes?.signBit : encodeRes?.signBit }}
            </div>
          </div>

          <!-- Exponent (5 bits) -->
          <div class="rounded-lg border border-blue-300 bg-blue-50/70 p-3 text-center dark:border-blue-700 dark:bg-blue-950/50">
            <div class="mb-1 text-[11px] font-sans font-semibold text-blue-800 dark:text-blue-300">
              Cecha E (5 bitów)
            </div>
            <div class="text-xl font-bold tracking-widest text-blue-900 dark:text-blue-200">
              {{
                mode === 'decode'
                  ? decodeRes?.exponentBits
                  : currentStep >= 3
                    ? encodeRes?.exponentBits
                    : '?????'
              }}
            </div>
          </div>

          <!-- Mantissa (10 bits) -->
          <div class="rounded-lg border border-emerald-300 bg-emerald-50/70 p-3 text-center dark:border-emerald-700 dark:bg-emerald-950/50">
            <div class="mb-1 text-[11px] font-sans font-semibold text-emerald-800 dark:text-emerald-300">
              Część ułamkowa mantysy (10 bitów)
            </div>
            <div class="text-xl font-bold tracking-widest text-emerald-900 dark:text-emerald-200">
              {{
                mode === 'decode'
                  ? decodeRes?.mantissaBits
                  : currentStep >= 4
                    ? encodeRes?.mantissaBits
                    : '??????????'
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- Decode Breakdown -->
      <div v-if="mode === 'decode' && decodeRes" class="space-y-2.5 text-sm">
        <div class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2.5 text-stone-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <span class="font-semibold text-rose-800 dark:text-rose-400">1. Znak (S):</span>
          <span class="font-mono ml-2">
            S = {{ decodeRes.signBit }} → (−1)<sup>{{ decodeRes.signBit }}</sup> =
            {{ decodeRes.signMultiplier === 1 ? '+1 (dodatnia)' : '−1 (ujemna)' }}
          </span>
        </div>

        <div
          v-if="currentStep >= 2"
          class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2.5 text-stone-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <span class="font-semibold text-blue-800 dark:text-blue-400">2. Cecha i wykładnik (e):</span>
          <span class="font-mono ml-2">
            E = ({{ decodeRes.exponentBits }})₂ = {{ decodeRes.exponentBiased }}₁₀ → e =
            {{ decodeRes.exponentBiased }} − {{ decodeRes.bias }} =
            <strong>{{ decodeRes.exponentActual }}</strong>
          </span>
        </div>

        <div
          v-if="currentStep >= 3"
          class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2.5 text-stone-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <span class="font-semibold text-emerald-800 dark:text-emerald-400">3. Mantysa i przesunięcie przecinka:</span>
          <div class="mt-1 font-mono text-stone-800 dark:text-slate-200">
            M = {{ decodeRes.mantissaBinary }}₂ (z domyślną jedynką „1,”) · 2<sup>{{ decodeRes.exponentActual }}</sup>
            = <strong>{{ decodeRes.denormalizedBinary }}₂</strong>
          </div>
        </div>

        <div
          v-if="currentStep >= 4"
          class="rounded-lg border border-emerald-300 bg-emerald-50/70 px-4 py-3 font-mono text-base font-bold text-stone-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
        >
          4. Wartość dziesiętna: {{ decodeRes.formattedPolish }}
        </div>
      </div>

      <!-- Encode Breakdown -->
      <div v-if="mode === 'encode' && encodeRes" class="space-y-2.5 text-sm">
        <div class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2.5 text-stone-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <span class="font-semibold text-rose-800 dark:text-rose-400">1. Znak i moduł binarny:</span>
          <span class="font-mono ml-2">
            S = {{ encodeRes.signBit }}, moduł |{{ encodeRes.inputStr }}| = {{ encodeRes.absBinary }}₂
          </span>
        </div>

        <div
          v-if="currentStep >= 2"
          class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2.5 text-stone-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <span class="font-semibold text-stone-800 dark:text-slate-200">2. Normalizacja (postać 1,xxxx · 2^e):</span>
          <span class="font-mono ml-2">
            {{ encodeRes.absBinary }}₂ = <strong>{{ encodeRes.normalizedBinary }}</strong> (e = {{ encodeRes.exponentActual }})
          </span>
        </div>

        <div
          v-if="currentStep >= 3"
          class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2.5 text-stone-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <span class="font-semibold text-blue-800 dark:text-blue-400">3. Cecha z biasem:</span>
          <span class="font-mono ml-2">
            E = {{ encodeRes.exponentActual }} + {{ encodeRes.bias }} = {{ encodeRes.exponentBiased }}₁₀ =
            <strong>{{ encodeRes.exponentBits }}₂</strong>
          </span>
        </div>

        <div
          v-if="currentStep >= 4"
          class="rounded-lg border border-emerald-300 bg-emerald-50/70 px-4 py-3 font-mono text-base font-bold text-stone-900 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200"
        >
          4. Ciąg 16-bitowy: {{ encodeRes.bits16 }}
          <span class="ml-2 text-xs font-normal text-stone-600 dark:text-emerald-300/80">({{ encodeRes.bitsGrouped }})</span>
        </div>
      </div>
    </div>
  </div>
</template>
