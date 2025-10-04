import { Container } from "./Container";

const modes = [
  {
    title: "🪫 LOW MOOD",
    state: "Estado: sin energía, abrumado.",
    goal: "Objetivo: activar tu mínimo vital con acciones pequeñas y sostenibles.",
    accent: "from-rose-500/50 to-orange-400/30"
  },
  {
    title: "🍃 CHILL MOOD",
    state: "Estado: relajado y estable.",
    goal: "Objetivo: sostener bienestar con rutinas suaves y balanceadas.",
    accent: "from-emerald-400/40 to-teal-300/20"
  },
  {
    title: "🌊 FLOW MOOD",
    state: "Estado: enfocado y en movimiento.",
    goal: "Objetivo: aprovechar el impulso con un plan alineado a metas concretas.",
    accent: "from-sky-400/40 to-indigo-400/30"
  },
  {
    title: "🧬 EVOLVE MOOD",
    state: "Estado: ambicioso y determinado.",
    goal: "Objetivo: sistema retador con Hábitos Atómicos, misiones y recompensas.",
    accent: "from-purple-500/40 to-fuchsia-400/25"
  }
];

export function ModesSection() {
  return (
    <section id="modes" className="border-b border-white/5 bg-surface/50 py-24">
      <Container className="space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Mood: tu modo de juego</h2>
          <p className="text-base text-white/70">
            Cambia según tu momento. El sistema se adapta a tu energía.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {modes.map((mode) => (
            <article
              key={mode.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-panel"
            >
              <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${mode.accent}`} />
              <h3 className="text-lg font-semibold text-white">
                {mode.title}
                <span className="ml-3 inline-flex h-2 w-2 rounded-full bg-white/70 align-middle" aria-hidden />
              </h3>
              <p className="mt-4 text-sm font-medium text-white/80">{mode.state}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{mode.goal}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
