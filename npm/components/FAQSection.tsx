import { Container } from "./Container";

const questions = [
  {
    question: "¿Necesito mucha disciplina para empezar?",
    answer:
      "No. Si estás con poca energía, empezás en Low para activar el mínimo vital. El sistema ajusta el ritmo."
  },
  {
    question: "¿Puedo cambiar de modo de juego?",
    answer: "Sí. Podés cambiar entre Low, Chill, Flow y Evolve según tu momento."
  },
  {
    question: "¿Dónde veo mis métricas?",
    answer: "En tu archivo y en el Dashboard: XP, nivel, rachas y mapa emocional."
  },
  {
    question: "¿Qué pasa si dejo de registrar?",
    answer:
      "No perdés progreso. Retomás cuando quieras y ajustamos objetivos según tu energía."
  }
];

export function FAQSection() {
  return (
    <section id="faq" className="border-b border-white/5 bg-surface/20 py-24">
      <Container className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-3 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">Preguntas frecuentes</h2>
        </div>
        <div className="space-y-4 text-left">
          {questions.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80 transition hover:border-accent-soft/60 hover:bg-white/10"
            >
              <summary className="cursor-pointer text-base font-semibold text-white focus:outline-none">
                {item.question}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
