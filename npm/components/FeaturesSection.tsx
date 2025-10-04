import { Container } from "./Container";

const features = [
  {
    title: "📝 Daily Quest",
    description: "Seguimiento de tareas por pilar y emoción diaria. 100% conectado a tu board."
  },
  {
    title: "⭐ XP & Nivel",
    description: "Progreso con datos reales. Barra de nivel y XP faltante al siguiente nivel."
  },
  {
    title: "📆 Constancia semanal",
    description: "Rachas por tarea: cuántas semanas seguidas mantienes la constancia de tus actividades."
  },
  {
    title: "🎯 Misiones & Rewards",
    description: "Misiones vinculadas a rachas. Bonos de XP al cumplir objetivos."
  },
  {
    title: "🗺️ Emotion Heatmap",
    description: "Mapa visual de tu estado emocional a lo largo del tiempo."
  },
  {
    title: "📱 App & Recordatorios",
    description: "Descarga nuestra APP y recibe recordatorios y mejor seguimiento."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="border-b border-white/5 bg-surface/30 py-24">
      <Container className="space-y-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Lo que desbloqueás</h2>
          <p className="text-base text-white/70">Herramientas que te dan claridad y momentum.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 text-left shadow-panel transition hover:border-white/20 hover:bg-white/10"
            >
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{feature.description}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
