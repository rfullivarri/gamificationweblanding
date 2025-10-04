const testimonials = [
  {
    quote:
      "El engagement semanal se disparó un 32% después de implementar las campañas gamificadas. Nuestra comunidad ahora entiende claramente los pasos para avanzar.",
    author: "Lucía Ferrer",
    role: "Head of Product, TeamFlow"
  },
  {
    quote:
      "La integración con Slack y Notion nos permitió automatizar los reconocimientos. El equipo de soporte ahora recibe feedback en tiempo real.",
    author: "Jorge Reyes",
    role: "Director de Customer Success, Aurora Apps"
  }
];

export function Testimonials() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {testimonials.map((testimonial) => (
        <figure key={testimonial.author} className="flex h-full flex-col justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-8 text-left shadow-xl shadow-brand/10">
          <blockquote className="text-lg font-medium text-white/90">“{testimonial.quote}”</blockquote>
          <figcaption className="text-sm text-white/60">
            <span className="font-semibold text-white">{testimonial.author}</span>
            <br />
            {testimonial.role}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
