<script setup lang="ts">
import { ref, computed } from 'vue';
import WhiteboardBinaryDivision from './WhiteboardBinaryDivision.vue';
import WhiteboardHexMult from './WhiteboardHexMult.vue';
import WhiteboardBaseConv from './WhiteboardBaseConv.vue';
import WhiteboardCRC from './WhiteboardCRC.vue';
import WhiteboardIEEE754 from './WhiteboardIEEE754.vue';
import WhiteboardU2 from './WhiteboardU2.vue';
import WhiteboardBCDU9 from './WhiteboardBCDU9.vue';
import WhiteboardBooth from './WhiteboardBooth.vue';

type ToolId =
  | 'binary-division'
  | 'hex-multiplication'
  | 'decimal-to-binary'
  | 'any-base'
  | 'crc'
  | 'ieee-decode'
  | 'ieee-encode'
  | 'u2'
  | 'bcd-u9'
  | 'booth';

const activeTool = ref<ToolId>('binary-division');

// Inputs
const binDividend = ref('11110101011');
const binDivisor = ref('1101');

const hexA = ref('3E9');
const hexB = ref('2B7');

const decToBinInput = ref('43,2');

const anySource = ref('3A4');
const anyFromBase = ref(13);
const anyToBase = ref(7);

const crcData = ref('1011 0110 10');
const crcGen = ref('10011');
const crcAppendZeros = ref(true);

const ieeeBits = ref('0100011110000000');
const ieeeVal = ref('-11,5');

const u2A = ref(-29);
const u2B = ref(12);

const bcdA = ref(47);
const bcdB = ref(-83);

const boothM = ref(-3);
const boothQ = ref(2);

const validationError = computed(() => {
  try {
    if (activeTool.value === 'binary-division') {
      if (!/^[01]+$/.test(binDividend.value.trim()) || !/^[01]*1[01]*$/.test(binDivisor.value.trim())) {
        return 'Wpisz poprawne liczby binarne (dzielnik nie może być zerem).';
      }
    } else if (activeTool.value === 'hex-multiplication') {
      if (!/^[0-9a-fA-F]+$/.test(hexA.value.trim()) || !/^[0-9a-fA-F]+$/.test(hexB.value.trim())) {
        return 'Użyj wyłącznie cyfr szesnastkowych 0–9 oraz A–F.';
      }
    } else if (activeTool.value === 'decimal-to-binary') {
      if (!/^\d+([,.]\d+)?$/.test(decToBinInput.value.trim())) {
        return 'Podaj nieujemną liczbę dziesiętną, np. 43,2 lub 45,375.';
      }
    } else if (activeTool.value === 'crc') {
      if (!/^[01\s]+$/.test(crcData.value) || !/^1[01]+$/.test(crcGen.value.trim())) {
        return 'Dane i wielomian generacyjny muszą zawierać bity 0 i 1 (generator zaczyna się od 1).';
      }
    } else if (activeTool.value === 'ieee-decode') {
      if (!/^[01]{16}$/.test(ieeeBits.value.replace(/\s+/g, ''))) {
        return 'Ciąg bitów IEEE 754 binary16 musi mieć dokładnie 16 bitów.';
      }
    } else if (activeTool.value === 'ieee-encode') {
      const n = Number(ieeeVal.value.trim().replace('−', '-').replace(',', '.'));
      if (Number.isNaN(n) || n === 0) {
        return 'Podaj niezerową liczbę rzeczywistą (np. -11,5).';
      }
    } else if (activeTool.value === 'u2') {
      if (u2A.value < -128 || u2A.value > 127 || u2B.value < -128 || u2B.value > 127) {
        return 'Dla 8-bitowego kodu U2 liczby muszą mieścić się w zakresie od -128 do 127.';
      }
    } else if (activeTool.value === 'bcd-u9') {
      if (Math.abs(bcdA.value) > 99 || Math.abs(bcdB.value) > 99) {
        return 'Dla reprezentacji dwucyfrowej BCD/U9 użyj liczb od -99 do 99.';
      }
    } else if (activeTool.value === 'booth') {
      if (boothM.value < -8 || boothM.value > 7 || boothQ.value < -8 || boothQ.value > 7) {
        return 'Dla 4-bitowego algorytmu Bootha liczby muszą być z zakresu od -8 do 7.';
      }
    }
    return '';
  } catch {
    return 'Nieprawidłowe dane wejściowe.';
  }
});

const tools: { id: ToolId; label: string }[] = [
  { id: 'binary-division', label: 'Dzielenie binarne' },
  { id: 'hex-multiplication', label: 'Mnożenie hex' },
  { id: 'decimal-to-binary', label: 'Dziesiętna → Binarna' },
  { id: 'any-base', label: 'System A → System B' },
  { id: 'crc', label: 'Kod CRC (modulo 2)' },
  { id: 'ieee-decode', label: 'IEEE 754 Odczyt' },
  { id: 'ieee-encode', label: 'IEEE 754 Zapis' },
  { id: 'u2', label: 'Dodawanie U2 (8-bit)' },
  { id: 'bcd-u9', label: 'BCD 8421 + U9' },
  { id: 'booth', label: 'Algorytm Bootha' },
];
</script>

<template>
  <div class="space-y-6">
    <div class="border-b border-slate-200 pb-4 dark:border-slate-800">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
        Generator własnych przykładów pisemnych
      </h1>
      <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        Wpisz własne liczby z notatek lub poprzednich kolokwiów, a system automatycznie wygeneruje pełne rozwiązanie krok po kroku zgodnie ze sposobem zapisu wymaganym na zajęciach.
      </p>
    </div>

    <!-- Tool Selector -->
    <div class="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
      <button
        v-for="t in tools"
        :key="t.id"
        type="button"
        @click="activeTool = t.id"
        class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0"
        :class="
          activeTool === t.id
            ? 'bg-blue-700 text-white dark:bg-blue-600'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        "
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Input Panel -->
    <div class="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div v-if="activeTool === 'binary-division'" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Dzielna (binarnie)
          <input
            v-model="binDividend"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Dzielnik (binarnie)
          <input
            v-model="binDivisor"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'hex-multiplication'" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Pierwsza liczba (hex)
          <input
            v-model="hexA"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Druga liczba (hex)
          <input
            v-model="hexB"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'decimal-to-binary'" class="max-w-sm">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Liczba dziesiętna (z ułamkiem lub okresowa, np. 43,2)
          <input
            v-model="decToBinInput"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'any-base'" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Liczba wejściowa
          <input
            v-model="anySource"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm uppercase text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Podstawa źródłowa (2–16)
          <input
            v-model.number="anyFromBase"
            type="number"
            min="2"
            max="16"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Podstawa docelowa (2–16)
          <input
            v-model.number="anyToBase"
            type="number"
            min="2"
            max="16"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'crc'" class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Ciąg danych / odebrana ramka
          <input
            v-model="crcData"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Wielomian generacyjny
          <input
            v-model="crcGen"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="flex items-center gap-2.5 pt-5 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <input v-model="crcAppendZeros" type="checkbox" class="h-4 w-4 rounded border-slate-300 text-blue-700 dark:border-slate-600 dark:bg-slate-800" />
          Dopisz zera (wyznaczanie CRC zamiast weryfikacji)
        </label>
      </div>

      <div v-if="activeTool === 'ieee-decode'" class="max-w-md">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Ciąg 16 bitów (binary16, bias = 15)
          <input
            v-model="ieeeBits"
            type="text"
            maxlength="19"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'ieee-encode'" class="max-w-sm">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Liczba dziesiętna (np. -11,5 lub 6,25)
          <input
            v-model="ieeeVal"
            type="text"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'u2'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Pierwsza liczba (−128 do 127)
          <input
            v-model.number="u2A"
            type="number"
            min="-128"
            max="127"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Druga liczba (−128 do 127)
          <input
            v-model.number="u2B"
            type="number"
            min="-128"
            max="127"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'bcd-u9'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Pierwsza liczba (−99 do 99)
          <input
            v-model.number="bcdA"
            type="number"
            min="-99"
            max="99"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Druga liczba (−99 do 99)
          <input
            v-model.number="bcdB"
            type="number"
            min="-99"
            max="99"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <div v-if="activeTool === 'booth'" class="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-md">
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Mnożna M (−8 do 7)
          <input
            v-model.number="boothM"
            type="number"
            min="-8"
            max="7"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
        <label class="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Mnożnik Q (−8 do 7)
          <input
            v-model.number="boothQ"
            type="number"
            min="-8"
            max="7"
            class="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-blue-500"
          />
        </label>
      </div>

      <p v-if="validationError" class="mt-3 text-xs font-semibold text-rose-700 dark:text-rose-400">
        {{ validationError }}
      </p>
    </div>

    <!-- Live Output -->
    <div v-if="!validationError">
      <WhiteboardBinaryDivision
        v-if="activeTool === 'binary-division'"
        :dividend="binDividend"
        :divisor="binDivisor"
      />
      <WhiteboardHexMult
        v-else-if="activeTool === 'hex-multiplication'"
        :a-hex="hexA"
        :b-hex="hexB"
      />
      <WhiteboardBaseConv
        v-else-if="activeTool === 'decimal-to-binary'"
        mode="decimal-to-binary"
        :params="{ value: decToBinInput }"
      />
      <WhiteboardBaseConv
        v-else-if="activeTool === 'any-base'"
        mode="any-base-to-any-base"
        :params="{ source: anySource, fromBase: anyFromBase, toBase: anyToBase }"
      />
      <WhiteboardCRC
        v-else-if="activeTool === 'crc'"
        :data="crcData"
        :generator="crcGen"
        :append-zeros="crcAppendZeros"
      />
      <WhiteboardIEEE754
        v-else-if="activeTool === 'ieee-decode'"
        mode="decode"
        :bits-or-value="ieeeBits"
        :bias="15"
      />
      <WhiteboardIEEE754
        v-else-if="activeTool === 'ieee-encode'"
        mode="encode"
        :bits-or-value="ieeeVal"
        :bias="15"
      />
      <WhiteboardU2
        v-else-if="activeTool === 'u2'"
        :a="u2A"
        :b="u2B"
        :bits="8"
      />
      <WhiteboardBCDU9
        v-else-if="activeTool === 'bcd-u9'"
        :a="bcdA"
        :b="bcdB"
      />
      <WhiteboardBooth
        v-else-if="activeTool === 'booth'"
        :m-dec="boothM"
        :q-dec="boothQ"
        :bits="4"
      />
    </div>
  </div>
</template>
