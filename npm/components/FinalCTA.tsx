import Link from "next/link";

import { Container } from "./Container";

export function FinalCTA() {
  return (
    <section className="border-b border-white/5 bg-surface/20 py-24">
      <Container className="mx-auto max-w-2xl space-y-8 text-center">
        <h2 className="text-3xl font-semibold text-white sm:text-4xl">Listo para empezar</h2>
        <p className="text-base text-white/70">Te guiamos paso a paso. Empieza ahora.</p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/formsintrov3.html" className="btn-primary">
            Comenzar mi Journey
          </Link>
          <Link href="/sign-in" className="btn-ghost">
            Ya tengo cuenta
          </Link>
        </div>
      </Container>
    </section>
  );
}
