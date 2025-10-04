const plans = [
  {
    name: "Starter",
    price: "Gratis",
    description: "Ideal para equipos en etapa de descubrimiento",
    features: [
      "Hasta 1.000 usuarios activos",
      "Campañas ilimitadas",
      "Integración con Slack y Notion",
      "Reportes semanales"
    ]
  },
  {
    name: "Scale",
    price: "$249/mes",
    description: "Optimiza productos en crecimiento acelerado",
    features: [
      "Usuarios ilimitados",
      "API y webhooks en tiempo real",
      "Modelos predictivos de retención",
      "Soporte prioritario 24/7"
    ],
    highlight: true
  }
];

export function Pricing() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {plans.map((plan) => (
        <article
          key={plan.name}
          className={`relative flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-left shadow-xl shadow-brand/10 ${plan.highlight ? "ring-2 ring-brand" : ""}`}
        >
          <div>
            <h3 className="text-2xl font-semibold text-white">{plan.name}</h3>
            <p className="mt-2 text-sm text-white/60">{plan.description}</p>
          </div>
          <p className="text-3xl font-bold text-brand-light">{plan.price}</p>
          <ul className="space-y-2 text-sm text-white/80">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <button className="button-primary mt-auto w-full">Comenzar</button>
        </article>
      ))}
    </div>
  );
}
