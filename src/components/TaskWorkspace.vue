<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ListChecks,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
} from 'lucide-vue-next';
import type { ExamTask } from '../data/exams';
import type { TuringRule } from '../math/solvers';
import WhiteboardBinaryDivision from './WhiteboardBinaryDivision.vue';
import WhiteboardHexMult from './WhiteboardHexMult.vue';
import WhiteboardBaseConv from './WhiteboardBaseConv.vue';
import WhiteboardCRC from './WhiteboardCRC.vue';
import WhiteboardTuring from './WhiteboardTuring.vue';
import WhiteboardIEEE754 from './WhiteboardIEEE754.vue';
import WhiteboardU2 from './WhiteboardU2.vue';
import WhiteboardBCDU9 from './WhiteboardBCDU9.vue';
import WhiteboardBooth from './WhiteboardBooth.vue';

const props = defineProps<{
  task: ExamTask;
  examShortTitle: string;
  quizMode: boolean;
  hasPrev: boolean;
  hasNext: boolean;
}>();

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'open-board-tab'): void;
}>();

const selectedOption = ref<string | null>(null);
const revealedInQuizMode = ref(false);
const showPhotoModal = ref(false);

watch(
  () => [props.task.id, props.quizMode],
  () => {
    selectedOption.value = null;
    revealedInQuizMode.value = false;
    showPhotoModal.value = false;
  }
);
</script>

<template>
  <div class="space-y-6">
    <!-- Task Header & Prompt -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          <span class="font-semibold text-blue-700">{{ examShortTitle }}</span>
          <span aria-hidden="true">·</span>
          <span>Zadanie {{ task.number }}</span>
          <span aria-hidden="true">·</span>
          <span>{{ task.topic }}</span>
          <span aria-hidden="true">·</span>
          <span class="tabular-nums">{{ task.points }} pkt</span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="emit('prev')"
            :disabled="!hasPrev"
            class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            <ChevronLeft class="h-3.5 w-3.5" />
            Poprzednie
          </button>
          <button
            type="button"
            @click="emit('next')"
            :disabled="!hasNext"
            class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap shrink-0"
          >
            Następne
            <ChevronRight class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <h1 class="mt-2.5 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
        Zadanie {{ task.number }}. {{ task.title }}
      </h1>

      <div class="mt-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <p class="text-sm sm:text-base font-medium leading-relaxed text-slate-900">
          {{ task.prompt }}
        </p>
        <p v-if="task.subPrompt" class="mt-2 font-mono text-xs sm:text-sm text-slate-700">
          {{ task.subPrompt }}
        </p>
      </div>

      <!-- Multiple choice A-E (for Zestaw D) -->
      <div v-if="task.options" class="mt-4">
        <div class="mb-2 text-xs font-semibold text-slate-600">
          {{ quizMode ? 'Wybierz odpowiedź A–E (tryb sprawdzianu):' : 'Warianty odpowiedzi z arkusza:' }}
        </div>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            v-for="opt in task.options"
            :key="opt.label"
            type="button"
            @click="selectedOption = opt.label"
            class="flex items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-left font-mono text-xs sm:text-sm transition-colors"
            :class="
              !quizMode && opt.label === task.correctOption
                ? 'border-emerald-400 bg-emerald-50/80 font-semibold text-emerald-950'
                : quizMode && selectedOption === opt.label
                  ? opt.label === task.correctOption
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold'
                    : 'border-rose-400 bg-rose-50 text-rose-950 font-semibold'
                  : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
            "
          >
            <span>
              <strong class="mr-1.5">{{ opt.label }}.</strong>
              <span>{{ opt.text }}</span>
            </span>
            <CheckCircle2
              v-if="(!quizMode || selectedOption === opt.label) && opt.label === task.correctOption"
              class="h-4 w-4 shrink-0 text-emerald-700"
            />
            <XCircle
              v-else-if="quizMode && selectedOption === opt.label && opt.label !== task.correctOption"
              class="h-4 w-4 shrink-0 text-rose-700"
            />
          </button>
        </div>
      </div>

      <!-- Open Answer summary / reveal -->
      <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3.5">
        <div v-if="!quizMode || revealedInQuizMode" class="text-sm">
          <span class="font-medium text-slate-600">Poprawna odpowiedź: </span>
          <strong class="font-mono text-emerald-800">{{ task.expectedAnswer }}</strong>
        </div>
        <div v-else class="text-xs text-slate-600">
          Tryb kolokwium aktywny — spróbuj najpierw policzyć zadanie na kartce.
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            v-if="task.whiteboardPhotoRef"
            type="button"
            @click="showPhotoModal = !showPhotoModal"
            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <ImageIcon class="h-3.5 w-3.5 text-blue-700" />
            {{ showPhotoModal ? 'Ukryj zdjęcie z tablicy' : 'Pokaż zdjęcie z tablicy' }}
          </button>

          <button
            v-if="quizMode"
            type="button"
            @click="revealedInQuizMode = !revealedInQuizMode"
            class="rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-800 whitespace-nowrap shrink-0"
          >
            {{ revealedInQuizMode ? 'Ukryj rozwiązanie' : 'Sprawdź rozwiązanie krok po kroku' }}
          </button>
        </div>
      </div>

      <!-- Optional inline reference photo drawer -->
      <div
        v-if="showPhotoModal && task.whiteboardPhotoRef"
        class="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
      >
        <div class="grid grid-cols-1 items-center gap-4 p-4 md:grid-cols-12">
          <img
            :src="task.whiteboardPhotoRef.imagePath"
            alt="Zdjęcie tablicy z zajęć"
            referrerpolicy="no-referrer"
            class="max-h-64 w-full rounded-md object-cover md:col-span-5"
          />
          <div class="space-y-2 md:col-span-7">
            <div class="text-xs font-semibold text-slate-800">Wzór zapisu z zajęć</div>
            <p class="text-sm leading-relaxed text-slate-700">
              {{ task.whiteboardPhotoRef.caption }}
            </p>
            <!-- <button
              type="button"
              @click="emit('open-board-tab')"
              class="text-xs font-semibold text-blue-700 underline underline-offset-4 hover:text-blue-900"
            >
              Otwórz pełną zakładkę „Tablica z zajęć” →
            </button> -->
          </div>
        </div>
      </div>
    </section>

    <!-- Section 1: "Co jest czym?" (Terminology Glossary) -->
    <section class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div class="mb-3 flex items-center gap-2">
        <BookOpen class="h-4 w-4 text-blue-700" />
        <h2 class="text-base font-bold text-slate-900">Co jest czym w tym zadaniu?</h2>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div
          v-for="item in task.glossary"
          :key="item.term"
          class="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5"
        >
          <div class="font-mono text-xs sm:text-sm font-bold text-slate-900">{{ item.term }}</div>
          <p class="mt-1 text-xs sm:text-sm leading-relaxed text-slate-700">{{ item.meaning }}</p>
        </div>
      </div>
    </section>

    <!-- Section 2: Interactive Written Whiteboard Solution -->
    <section
      v-if="!quizMode || revealedInQuizMode"
      class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div class="mb-4">
        <h2 class="text-base font-bold text-slate-900">
          Rozwiązanie pisemne krok po kroku (układ na kolokwium)
        </h2>
        <p class="mt-0.5 text-xs text-slate-500">
          Klikaj „Następny krok”, aby zobaczyć dokładnie, co i w jakiej kolejności dopisywać na kartce.
        </p>
      </div>

      <WhiteboardBinaryDivision
        v-if="task.solverType === 'binary-division'"
        :dividend="String(task.solverParams.dividend)"
        :divisor="String(task.solverParams.divisor)"
      />
      <WhiteboardHexMult
        v-else-if="task.solverType === 'hex-multiplication'"
        :a-hex="String(task.solverParams.aHex)"
        :b-hex="String(task.solverParams.bHex)"
      />
      <WhiteboardBaseConv
        v-else-if="
          task.solverType === 'decimal-to-binary' ||
          task.solverType === 'base-conversions' ||
          task.solverType === 'any-base-to-any-base'
        "
        :mode="task.solverType"
        :params="task.solverParams"
      />
      <WhiteboardCRC
        v-else-if="task.solverType === 'crc'"
        :data="String(task.solverParams.data)"
        :generator="String(task.solverParams.generator)"
        :append-zeros="Boolean(task.solverParams.appendZeros)"
      />
      <WhiteboardTuring
        v-else-if="task.solverType === 'turing-machine'"
        :tape-str="String(task.solverParams.tape)"
        :start-state="String(task.solverParams.startState)"
        :start-pos="Number(task.solverParams.startPos)"
        :rules="task.solverParams.rules as TuringRule[]"
      />
      <WhiteboardIEEE754
        v-else-if="task.solverType === 'ieee754-decode'"
        mode="decode"
        :bits-or-value="String(task.solverParams.bits)"
        :bias="Number(task.solverParams.bias ?? 15)"
      />
      <WhiteboardIEEE754
        v-else-if="task.solverType === 'ieee754-encode'"
        mode="encode"
        :bits-or-value="String(task.solverParams.value)"
        :bias="Number(task.solverParams.bias ?? 15)"
      />
      <WhiteboardU2
        v-else-if="task.solverType === 'u2-addition'"
        :a="Number(task.solverParams.a)"
        :b="Number(task.solverParams.b)"
        :bits="Number(task.solverParams.bits ?? 8)"
      />
      <WhiteboardBCDU9
        v-else-if="task.solverType === 'bcd-u9'"
        :a="Number(task.solverParams.a)"
        :b="Number(task.solverParams.b)"
      />
      <WhiteboardBooth
        v-else-if="task.solverType === 'booth'"
        :m-dec="Number(task.solverParams.mDec)"
        :q-dec="Number(task.solverParams.qDec)"
        :bits="Number(task.solverParams.bits ?? 4)"
        :highlight-iter="Number(task.solverParams.highlightIter ?? 3)"
      />
    </section>

    <!-- Section 3: Exact Solving Order Checklist + Lecturer Tip -->
    <section
      v-if="!quizMode || revealedInQuizMode"
      class="grid grid-cols-1 gap-4 lg:grid-cols-12"
    >
      <div class="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-8">
        <div class="mb-3 flex items-center gap-2">
          <ListChecks class="h-4 w-4 text-emerald-700" />
          <h2 class="text-base font-bold text-slate-900">
            Kolejność rozwiązywania na kartce (algorytm krok po kroku)
          </h2>
        </div>
        <ol class="space-y-2.5 text-sm leading-relaxed text-slate-700">
          <li
            v-for="(stepText, idx) in task.solvingOrder"
            :key="idx"
            class="flex items-start gap-3"
          >
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-800 tabular-nums">
              {{ idx + 1 }}
            </span>
            <span>{{ stepText }}</span>
          </li>
        </ol>
      </div>

      <div class="rounded-xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 lg:col-span-4">
        <div class="mb-2 flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-amber-700" />
          <h2 class="text-sm font-bold text-amber-950">Pułapka na kolokwium</h2>
        </div>
        <p class="text-sm leading-relaxed text-amber-950/90">
          {{ task.examTip }}
        </p>
      </div>
    </section>
  </div>
</template>
