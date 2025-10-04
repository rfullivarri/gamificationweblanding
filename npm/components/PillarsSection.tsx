import { Container } from "./Container";

const pillars = [
  {
    title: "🫀 Cuerpo",
    description:
      "Tu cuerpo es el sustrato del hábito: sueño, nutrición y movimiento marcan tu disponibilidad de energía diaria (HP)."
  },
  {
    title: "🧠 Mente",
    description:
      "La mente filtra y prioriza. Diseñamos sesiones simples para sostener la atención, el aprendizaje y la creatividad."
  },
  {
    title: "🏵️ Alma",
    description:
      "Las emociones, los vínculos y el propósito estabilizan el sistema. Sin esto, los hábitos no atraviesan semanas ni meses."
  }
];

export function PillarsSection() {
  return (
    <section id="why" className="border-b border-white/5 bg-surface/60 py-24">
      <Container className="space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Nuestros pilares fundamentales
          </h2>
          <p className="text-base leading-relaxed text-white/70">
            El progreso sostenible necesita equilibrio. <strong className="text-white">🫀 Cuerpo</strong> para la energía y la
            salud, <strong className="text-white">🧠 Mente</strong> para el foco y el aprendizaje, y
            <strong className="text-white"> 🏵️ Alma</strong> para el bienestar emocional y el sentido. Cuando uno cae, los otros
            dos lo sostienen. Cuando se alinean, tu progreso se acelera.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article
              key={pillar.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-8 text-left shadow-panel transition hover:border-white/20 hover:bg-white/10"
            >
              <h3 className="text-xl font-semibold text-white">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{pillar.description}</p>
            </article>
          ))}
        </div>
        <p className="text-center text-sm text-white/60">
          Observate por primera vez en tercera persona y toma el control de tus acciones y hábitos.
        </p>
      </Container>
    </section>
  );
}
