import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Container } from "./Container";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-base font-bold text-white shadow-lg">G</span>
          <span className="hidden sm:inline-flex">GamificationOS</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="#beneficios" className="hidden text-white/80 transition hover:text-white md:inline-flex">
            Beneficios
          </Link>
          <Link href="#caracteristicas" className="hidden text-white/80 transition hover:text-white md:inline-flex">
            Características
          </Link>
          <Link href="#casos" className="hidden text-white/80 transition hover:text-white lg:inline-flex">
            Casos de uso
          </Link>
          <SignedOut>
            <Link href="/sign-in" className="rounded-full border border-white/20 px-4 py-2 text-white/90 transition hover:border-white/40">
              Iniciar sesión
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="button-primary hidden sm:inline-flex">
              Ir al panel
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </Container>
    </header>
  );
}
