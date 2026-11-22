<script setup lang="ts">
import { ref } from 'vue';
import WhiteboardBinaryDivision from './WhiteboardBinaryDivision.vue';
import WhiteboardHexMult from './WhiteboardHexMult.vue';

const activePhotoExample = ref<'none' | 'div' | 'hex'>('none');

const boards = [
  {
    id: 'div',
    title: '1. Dzielenie pisemne w systemie dwójkowym',
    image: '/assets/aistudio/image_c4352989.png',
    exampleLabel: 'Przykład z tablicy: 11110101011 : 1101 = 10010111',
    canSimulate: 'div' as const,
    rules: [
      'Wynik (iloraz) zapisujemy NAD dzielną i oddzielamy poziomą kreską.',
      'Kolejne bity dzielnej spuszczamy w dół wyraźnymi pionowymi kreskami (|).',
      'Jeśli po spuszczeniu bitu liczba jest mniejsza od dzielnika, wpisujemy 0 nad tym bitem i od razu spuszczamy następny bit.',
      'Przy odejmowaniu binarnym pożyczki oznaczamy podwójnym apostrofem (″) nad cyfrą (10₂ − 1₂ = 1₂).',
    ],
  },
  {
    id: 'crc',
    title: '2. Wyznaczanie i sprawdzanie kodu CRC (modulo 2)',
    image: '/assets/aistudio/image_49592ee4.png',
    exampleLabel: 'Generator z tablicy: 10101 (5 bitów → 4-bitowa reszta)',
    canSimulate: 'none' as const,
    rules: [
      'Z boku kartki zapisujemy wielomian generacyjny i podpisujemy jako GENERATOR.',
      'Przy wyznaczaniu CRC dopisujemy na końcu danych tyle zer, ile wynosi długość generatora minus 1. Przy weryfikacji odebranej ramki NIE dopisujemy zer.',
      'Generator wyrównujemy zawsze pod pierwszą napotkaną jedynką z lewej strony.',
      'Wykonujemy XOR (bez pożyczek!): 1⊕1=0, 0⊕0=0, 1⊕0=1, 0⊕1=1. Przerywanymi liniami spuszczamy kolejne bity z góry.',
    ],
  },
  {
    id: 'hex',
    title: '3. Mnożenie pisemne w systemie szesnastkowym',
    image: '/assets/aistudio/image_29e0f29a.png',
    exampleLabel: 'Przykład z tablicy: 3E9 · 2B7 = A9D8F',
    canSimulate: 'hex' as const,
    rules: [
      'Po lewej stronie kartki wypisujemy słownik liter: A=10, B=11, C=12, D=13, E=14, F=15.',
      'Każdy iloczyn cząstkowy (cyfra · cyfra + przeniesienie) zapisujemy po prawej w brudnopisie jako liczbę dziesiętną (np. 63, 101, 99, 160).',
      'Dzielimy wartość z brudnopisu przez 16: wynik całkowity zapisujemy obok jako przeniesienie (np. 63 → 3), a resztę w hex wpisujemy do wiersza.',
      'Kolejne wiersze iloczynów przesuwamy w lewo, a na końcu sumujemy w kolumnach w bazie 16.',
    ],
  },
];
</script>

<template>
  <div class="space-y-8">
    <div class="border-b border-slate-200 pb-4">
      <h1 class="text-2xl font-bold tracking-tight text-slate-900">
        Wzory zapisu pisemnego z tablicy wykładowczyni
      </h1>
      <p class="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-600">
        Poniżej znajdują się oryginalne zdjęcia z zajęć wraz z objaśnieniem każdego elementu zapisu. Na kolokwium stosuj dokładnie ten układ na kartce, aby uzyskać komplet punktów.
      </p>
    </div>

    <div class="space-y-8">
      <article
        v-for="board in boards"
        :key="board.id"
        class="overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div class="grid grid-cols-1 lg:grid-cols-12">
          <div class="flex items-center justify-center bg-slate-100 p-2 lg:col-span-5">
            <img
              :src="board.image"
              :alt="board.title"
              referrerpolicy="no-referrer"
              class="max-h-[440px] w-full rounded-lg object-contain"
            />
          </div>
          <div class="flex flex-col justify-between p-5 sm:p-6 lg:col-span-7">
            <div>
              <div class="text-xs font-medium text-blue-700">{{ board.exampleLabel }}</div>
              <h2 class="mt-1 text-xl font-bold text-slate-900">{{ board.title }}</h2>

              <ul class="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-700">
                <li
                  v-for="(rule, idx) in board.rules"
                  :key="idx"
                  class="flex items-start gap-2.5"
                >
                  <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-100 font-mono text-xs font-bold text-slate-700">
                    {{ idx + 1 }}
                  </span>
                  <span>{{ rule }}</span>
                </li>
              </ul>
            </div>

            <div v-if="board.canSimulate !== 'none'" class="mt-5 border-t border-slate-100 pt-4">
              <button
                type="button"
                @click="activePhotoExample = activePhotoExample === board.canSimulate ? 'none' : board.canSimulate"
                class="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
              >
                {{
                  activePhotoExample === board.canSimulate
                    ? 'Ukryj interaktywną symulację tego przykładu'
                    : 'Rozpisz krok po kroku dokładnie ten przykład z tablicy'
                }}
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="board.canSimulate === 'div' && activePhotoExample === 'div'"
          class="border-t border-slate-200 bg-slate-50 p-5 sm:p-6"
        >
          <WhiteboardBinaryDivision dividend="11110101011" divisor="1101" />
        </div>

        <div
          v-if="board.canSimulate === 'hex' && activePhotoExample === 'hex'"
          class="border-t border-slate-200 bg-slate-50 p-5 sm:p-6"
        >
          <WhiteboardHexMult a-hex="3E9" b-hex="2B7" />
        </div>
      </article>
    </div>
  </div>
</template>
