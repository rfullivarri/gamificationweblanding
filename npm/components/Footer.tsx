import Link from "next/link";

import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="bg-surface/30 py-10">
      <Container className="flex flex-col items-center justify-between gap-6 text-sm text-white/60 md:flex-row">
        <span>©️ {new Date().getFullYear()} Gamification Journey</span>
        <nav className="flex items-center gap-4">
          <Link href="/sign-in" className="transition hover:text-white">
            Login
          </Link>
          <Link href="/sign-up" className="transition hover:text-white">
            Crear cuenta
          </Link>
          <Link href="#faq" className="transition hover:text-white">
            FAQ
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
