import Image from "next/image";
import Link from "next/link";

import { Container } from "./Container";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Tiempo de implementación",
    value: "2 semanas"
  },
  {
    label: "Integraciones",
    value: "+30 APIs"
  },
  {
    label: "Tasa de retención",
    value: "+25%"
  }
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-slate-950/95 pb-24 pt-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(134,96,255,0.4),_transparent_55%)]" />
        <div className="absolute inset-x-0 top-1/2 h-1/2 bg-[radial-gradient(circle_at_bottom,_rgba(33,150,243,0.12),_transparent_65%)]" />
      </div>

      <Container className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="text-left">
          <span className="inline-flex items-center rounded-full border border-brand-light/20 bg-brand-light/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-light">
            Gamificación para equipos digitales
          </span>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Convierte la experiencia en hábitos. Convierte los hábitos en crecimiento.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/70">
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
          <dl className="mt-14 grid gap-6 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 backdrop-blur">
                <dt className="text-xs uppercase tracking-[0.25em] text-white/60">{item.label}</dt>
                <dd className="mt-3 text-2xl font-semibold text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="absolute -inset-12 -z-10 bg-[radial-gradient(circle_at_top,_rgba(137,122,255,0.35),_transparent_60%)] blur-3xl" />
          <div className="relative mx-auto aspect-square w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-b from-indigo-500/30 via-slate-900 to-slate-950 shadow-[0_20px_120px_rgba(113,81,255,0.35)]">
            <Image
              src="/images/hero-gamification.svg"
              alt="Niño mirando una esfera de energía violeta en el cielo nocturno"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
