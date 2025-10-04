"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    quote: "Por primera vez sostuve hábitos 6 semanas. El mapa y las misiones me ordenaron.",
    author: "Lucía • Diseñadora"
  },
  {
    quote: "El heatmap emocional me cambió la mirada. Ajusto tareas por energía real.",
    author: "Diego • Dev"
  },
  {
    quote: "Empecé en Low y pasé a Flow con objetivos claros, sin culpa.",
    author: "Caro • Estudiante"
  }
];

export function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const goTo = (nextIndex: number) => {
    const total = testimonials.length;
    setIndex((nextIndex + total) % total);
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 shadow-panel"
      aria-roledescription="carousel"
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {testimonials.map((testimonial, idx) => (
          <figure key={testimonial.author} className="w-full shrink-0 space-y-4 text-center">
            <blockquote className="text-lg font-medium leading-relaxed text-white/80">
              “{testimonial.quote}”
            </blockquote>
            <figcaption className="text-sm uppercase tracking-[0.3em] text-white/50">
              {testimonial.author}
            </figcaption>
            <span className="sr-only">{`Slide ${idx + 1} de ${testimonials.length}`}</span>
          </figure>
        ))}
      </div>
      <div className="mt-8 flex items-center justify-center gap-3">
        {testimonials.map((testimonial, dotIndex) => (
          <button
            key={testimonial.author}
            type="button"
            aria-label={`Ver testimonio ${dotIndex + 1}`}
            aria-selected={dotIndex === index}
            className={`h-2.5 w-2.5 rounded-full transition ${
              dotIndex === index ? "bg-white" : "bg-white/30"
            }`}
            onClick={() => goTo(dotIndex)}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
        <div className="pointer-events-auto">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            aria-label="Anterior"
            onClick={() => goTo(index - 1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="pointer-events-auto">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
            aria-label="Siguiente"
            onClick={() => goTo(index + 1)}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
