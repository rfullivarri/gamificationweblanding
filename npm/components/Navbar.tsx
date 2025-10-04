import Link from "next/link";

import { Container } from "./Container";

const navigation = [
  { href: "#overview", label: "Overview" },
  { href: "#why", label: "Nuestros pilares" },
  { href: "#modes", label: "Modos" },
  { href: "#how", label: "Cómo funciona" },
  { href: "#features", label: "Features" },
  { href: "#testimonials", label: "Testimonios" },
  { href: "#faq", label: "FAQ" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-surface/80 backdrop-blur">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="#overview" className="group flex items-center gap-3 text-lg font-semibold text-white">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 shadow-glow transition group-hover:bg-white/10">
            <span className="text-xl">✨</span>
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm uppercase tracking-[0.35em] text-white/40">Innerbloom</span>
            <span className="text-base font-semibold text-white">Gamification Journey</span>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 lg:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-white"
              scroll
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/sign-up" className="btn-primary hidden md:inline-flex">
            Crear cuenta
          </Link>
          <Link href="/sign-in" className="btn-ghost">
            Ya tengo cuenta
          </Link>
        </div>
      </Container>
    </header>
  );
}
