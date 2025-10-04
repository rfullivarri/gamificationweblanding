import { Container } from "./Container";

const steps = [
  {
    title: "Define tu camino",
    description:
      "Responde una serie de preguntas, setea tu modo de juego y generamos tu base (Body/Mind/Soul) con IA."
  },
  {
    title: "Activa tu base",
    description: "Recibís tu pergamino digital por mail y editás/confirmás tu base."
  },
  {
    title: "Daily Quest + Emociones",
    description:
      "Con tu quest diaria reflexionás sobre tu día anterior y registrás la emoción que predominó."
  },
  {
    title: "XP, Rachas y Recompensas",
    description:
      "Seguís tu crecimiento acumulando XP, sosteniendo rachas semanales y desbloqueando misiones y recompensas."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how" className="border-b border-white/5 bg-surface/40 py-24">
      <Container className="space-y-10">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Cómo funciona</h2>
          <p className="text-base text-white/70">Un flujo claro, de la activación a la constancia.</p>
        </div>
        <ol className="grid gap-6 md:grid-cols-2">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group flex items-start gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel transition hover:border-accent-soft/50 hover:bg-white/10"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/30 text-base font-semibold text-white">
                {index + 1}
              </span>
              <div className="space-y-2 text-left">
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-white/70">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
