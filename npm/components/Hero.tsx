import Image from "next/image";
import Link from "next/link";

import { Container } from "./Container";

export function Hero() {
  return (
    <section
      id="overview"
      className="relative overflow-hidden border-b border-white/5 bg-surface/80 py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-glow" />
      <Container className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="space-y-8 text-left">
          <span className="inline-flex items-center rounded-full bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.35em] text-white/60">
            self-improvement journey
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Convierte la experiencia en hábitos. <span className="text-accent-soft">Convierte los hábitos en camino.</span>
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-white/75">
            Tus hábitos son el mapa. Tu constancia, el nivel que alcanzas. Es tu
            <strong className="text-white"> self-improvement journey</strong> con equilibrio entre
            <strong className="text-white"> 🫀 Cuerpo</strong>, <strong className="text-white">🧠 Mente</strong> y
            <strong className="text-white"> 🏵️ Alma</strong>.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/formsintrov3.html" className="btn-primary">
              Comenzar mi Journey
            </Link>
            <Link href="/sign-in" className="btn-ghost">
              Ya tengo cuenta
            </Link>
          </div>
          <p className="text-sm text-white/60">
            En menos de 3 minutos generamos tu base personalizada con IA.
          </p>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 -z-10 rounded-full bg-accent/40 blur-3xl" />
          <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-white/5 shadow-panel">
            <Image
              src="https://i.ibb.co/Gv7WTT7h/Whats-App-Image-2025-08-31-at-03-52-15.jpg"
              alt="Niño mirando una esfera de energía violeta en el cielo nocturno — Gamification Journey"
              width={900}
              height={900}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
