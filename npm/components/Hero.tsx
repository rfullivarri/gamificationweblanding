import Link from "next/link";
import { Container } from "./Container";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 pb-32 pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(92,106,196,0.35),_transparent_55%)]" />
      <Container className="flex flex-col items-center text-center">
        <span className="rounded-full border border-brand-light/30 px-4 py-1 text-xs uppercase tracking-[0.3em] text-brand-light">
          Gamificación para equipos digitales
        </span>
        <h1 className="mt-8 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Transforma la participación de tu comunidad en crecimiento sostenible
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
          Diseña misiones, recompensas y progresiones personalizadas para tu producto digital. Automatiza notificaciones, integra métricas con tu stack y mantén a tus usuarios enganchados con experiencias dinámicas.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link href="/sign-up" className="button-primary">
            Comenzar gratis
          </Link>
          <Link
            href="#demo"
            className={cn(
              "rounded-full border border-white/20 px-6 py-3 font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
            )}
          >
            Ver demo interactiva
          </Link>
        </div>
        <dl className="mt-14 grid w-full gap-6 text-left sm:grid-cols-3">
          {[{
            label: "Tiempo de implementación",
            value: "2 semanas"
          }, {
            label: "Integraciones",
            value: "+30 APIs"
          }, {
            label: "Tasa de retención",
            value: "+25%"
          }].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 backdrop-blur">
              <dt className="text-xs uppercase tracking-[0.25em] text-white/60">{item.label}</dt>
              <dd className="mt-3 text-2xl font-semibold text-white">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
