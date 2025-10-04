import Link from "next/link";
import { Container } from "./Container";

export function CTA() {
  return (
    <section className="py-24">
      <Container className="relative overflow-hidden rounded-3xl border border-brand/30 bg-gradient-to-br from-brand-dark via-brand to-brand-light/40 p-12 text-center text-white shadow-2xl">
        <div className="absolute -left-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -right-24 top-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <h2 className="text-3xl font-semibold sm:text-4xl">Listo para convertir tu producto en una experiencia épica?</h2>
          <p className="mt-4 text-base text-white/80">
            Activa la prueba gratuita de 14 días y conecta tus herramientas favoritas en minutos. Sin tarjeta de crédito.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <Link href="/sign-up" className="button-primary">
              Crear cuenta
            </Link>
            <Link href="https://cal.com" className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white transition hover:border-white">
              Agenda una demo
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
