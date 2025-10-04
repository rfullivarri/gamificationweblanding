import { Container } from "./Container";
import { TestimonialsCarousel } from "./TestimonialsCarousel";

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="border-b border-white/5 bg-surface/30 py-24">
      <Container className="space-y-10">
        <div className="mx-auto max-w-3xl space-y-4 text-center text-white">
          <h2 className="text-3xl font-semibold sm:text-4xl">Testimonios</h2>
          <p className="text-base text-white/70">Lo que dicen quienes ya empezaron su Journey.</p>
        </div>
        <TestimonialsCarousel />
      </Container>
    </section>
  );
}
