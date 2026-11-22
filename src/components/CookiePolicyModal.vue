<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue';
import { Cookie, ShieldCheck, Trash2, X } from 'lucide-vue-next';

const props = defineProps<{
  masteredTasks: Record<string, boolean>;
  noticeAccepted: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'accept-notice'): void;
  (e: 'clear-progress'): void;
}>();

const savedIds = computed(() =>
  Object.entries(props.masteredTasks)
    .filter(([, done]) => Boolean(done))
    .map(([id]) => id)
);

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close');
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-xs dark:bg-slate-950/80"
    role="dialog"
    aria-modal="true"
    aria-labelledby="cookie-policy-title"
    @click.self="emit('close')"
  >
    <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e4dccb] bg-[#fffdf7] shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      <!-- Header -->
      <div class="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e4dccb] bg-[#fffdf7]/95 px-5 py-4 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
        <div class="flex items-center gap-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4dccb] bg-[#f7f1e3] text-amber-700 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400">
            <Cookie class="h-4.5 w-4.5" />
          </div>
          <div>
            <h2 id="cookie-policy-title" class="text-base sm:text-lg font-bold text-stone-900 dark:text-slate-100">
              Polityka plików cookies (ciasteczek)
            </h2>
            <p class="text-xs text-stone-600 dark:text-slate-400">
              Zasady zapisu postępów nauki i działania strony
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          aria-label="Zamknij politykę ciasteczek"
          class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] p-1.5 text-stone-600 transition-colors hover:bg-[#f7f1e3] hover:text-stone-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="space-y-5 p-5 text-sm leading-relaxed text-stone-700 dark:text-slate-300 sm:p-6">
        <section>
          <h3 class="text-sm font-bold text-stone-900 dark:text-slate-100">
            1. Czym są pliki cookies i po co ich używamy?
          </h3>
          <p class="mt-1.5 text-xs sm:text-sm">
            Pliki cookies (ciasteczka) to niewielkie dane tekstowe zapisywane w Twojej przeglądarce internetowej. Na naszej stronie służą wyłącznie do zapamiętania Twojego postępu w nauce (które zadania z zestawów D, E i B oznaczyłeś jako zrobione) oraz potwierdzenia komunikatu o ciasteczkach. Dzięki temu po odświeżeniu strony lub powrocie przed kolokwium lista odhaczonych zadań jest od razu wczytywana z ciasteczka.
          </p>
        </section>

        <section>
          <h3 class="text-sm font-bold text-stone-900 dark:text-slate-100">
            2. Wykaz używanych ciasteczek i mechanizmów pamięci
          </h3>
          <div class="mt-2.5 space-y-2.5">
            <div class="rounded-lg border border-[#e4dccb] bg-[#f7f1e3]/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-mono text-xs font-bold text-blue-800 dark:text-blue-300">pi_done_tasks</span>
                <span class="text-[11px] font-medium text-stone-600 dark:text-slate-400">Funkcjonalne · Ważność: 365 dni</span>
              </div>
              <p class="mt-1 text-xs text-stone-700 dark:text-slate-300">
                Przechowuje identyfikatory zadań odznaczonych jako zrobione (np. <code class="font-mono">d-1,e-4</code>). Przy każdym wejściu na stronę aplikacja odczytuje to ciasteczko i automatycznie zaznacza ukończone zadania.
              </p>
            </div>

            <div class="rounded-lg border border-[#e4dccb] bg-[#f7f1e3]/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-mono text-xs font-bold text-blue-800 dark:text-blue-300">pi_cookie_notice</span>
                <span class="text-[11px] font-medium text-stone-600 dark:text-slate-400">Niezbędne · Ważność: 365 dni</span>
              </div>
              <p class="mt-1 text-xs text-stone-700 dark:text-slate-300">
                Zapamiętuje zamknięcie lub zaakceptowanie dolnego paska z informacją o ciasteczkach, aby nie wyświetlał się przy każdej wizycie.
              </p>
            </div>

            <div class="rounded-lg border border-[#e4dccb] bg-[#f7f1e3]/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-mono text-xs font-bold text-stone-800 dark:text-slate-200">pi_kolokwium_theme_v1 (localStorage)</span>
                <span class="text-[11px] font-medium text-stone-600 dark:text-slate-400">Preferencja wyglądu · Bezterminowo</span>
              </div>
              <p class="mt-1 text-xs text-stone-700 dark:text-slate-300">
                Zapamiętuje wybrany motyw strony: dzienny (biało-kremowy) lub nocny.
              </p>
            </div>

            <div class="rounded-lg border border-[#e4dccb] bg-[#f7f1e3]/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-mono text-xs font-bold text-stone-800 dark:text-slate-200">Vercel Web Analytics &amp; Speed Insights</span>
                <span class="text-[11px] font-medium text-stone-600 dark:text-slate-400">Statystyka i wydajność</span>
              </div>
              <p class="mt-1 text-xs text-stone-700 dark:text-slate-300">
                Zbierają anonimowe, zagregowane statystyki odwiedzin oraz czasu ładowania strony (Core Web Vitals). Nie używamy ciasteczek reklamowych ani profilowania użytkowników.
              </p>
            </div>
          </div>
        </section>

        <!-- Live cookie preview & reset -->
        <section class="rounded-xl border border-[#c8daf0] bg-[#eef4fb]/70 p-4 dark:border-blue-900 dark:bg-blue-950/40">
          <div class="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
            <ShieldCheck class="h-4 w-4 shrink-0" />
            <span>Podgląd danych zapisanych w ciasteczku <code class="font-mono">pi_done_tasks</code></span>
          </div>
          <p class="mt-1.5 text-xs text-stone-700 dark:text-slate-300">
            Aktualnie zapisane zadania:
            <strong class="font-mono text-stone-900 dark:text-slate-100">{{ savedIds.length }}</strong>
            <span v-if="savedIds.length > 0" class="ml-1 font-mono text-stone-600 dark:text-slate-400">
              ({{ savedIds.join(', ') }})
            </span>
            <span v-else class="ml-1 text-stone-600 dark:text-slate-400">
              — brak odznaczonych zadań.
            </span>
          </p>

          <div class="mt-3">
            <button
              type="button"
              :disabled="savedIds.length === 0"
              @click="emit('clear-progress')"
              class="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-[#fffdf7] px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300 dark:hover:bg-rose-950/60"
            >
              <Trash2 class="h-3.5 w-3.5" />
              Wyczyść zapisane zadania (usuń ciasteczko)
            </button>
          </div>
        </section>

        <section>
          <h3 class="text-sm font-bold text-stone-900 dark:text-slate-100">
            3. Zarządzanie ciasteczkami w przeglądarce
          </h3>
          <p class="mt-1.5 text-xs sm:text-sm">
            W każdej chwili możesz ograniczyć, zablokować lub usunąć pliki cookies w ustawieniach swojej przeglądarki internetowej (Chrome, Firefox, Edge, Safari). Zablokowanie ciasteczek nie blokuje przeglądania zadań i rozwiązań, ale sprawi, że odznaczone zadania nie zostaną zapamiętane po zamknięciu karty.
          </p>
        </section>
      </div>

      <!-- Footer actions -->
      <div class="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#e4dccb] bg-[#f7f1e3]/60 px-5 py-3.5 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <button
          type="button"
          @click="emit('close')"
          class="rounded-lg border border-[#e4dccb] bg-[#fffdf7] px-4 py-2 text-xs font-semibold text-stone-700 transition-colors hover:bg-[#f7f1e3] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Zamknij
        </button>
        <button
          v-if="!noticeAccepted"
          type="button"
          @click="emit('accept-notice'); emit('close')"
          class="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Akceptuję i zamknij
        </button>
      </div>
    </div>
  </div>
</template>
