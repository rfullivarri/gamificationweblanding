const steps = [
  {
    title: "Configura tus objetivos",
    description: "Define las métricas de éxito y los comportamientos que quieres incentivar dentro de tu producto."
  },
  {
    title: "Diseña misiones personalizadas",
    description: "Combina puntos, niveles y recompensas automatizadas con templates creados por expertos."
  },
  {
    title: "Analiza y optimiza",
    description: "Conecta tu data warehouse, identifica cohorts de usuarios y ajusta la experiencia en tiempo real."
  }
];

export function Steps() {
  return (
    <ol className="space-y-6 text-left">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-5 rounded-3xl border border-white/5 bg-white/[0.03] p-6 backdrop-blur">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-lg font-semibold text-white">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/70">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
