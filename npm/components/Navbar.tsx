import Link from "next/link";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

type NavigationItem = {
  href: string;
  label: string;
  className?: string;
};

const navigation: NavigationItem[] = [
  { href: "#beneficios", label: "Beneficios", className: "hidden md:inline-flex" },
  { href: "#caracteristicas", label: "Características", className: "hidden md:inline-flex" },
  { href: "#casos", label: "Casos de uso", className: "hidden lg:inline-flex" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-base font-bold text-white shadow-lg">
            G
          </span>
          <span className="hidden sm:inline-flex">GamificationOS</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn("text-white/80 transition hover:text-white", item.className)}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="rounded-full border border-white/20 px-4 py-2 text-white/90 transition hover:border-white/40">
              Iniciar sesión
            </Link>
            <Link href="/sign-up" className="button-primary hidden sm:inline-flex">
              Crear cuenta
            </Link>
          </div>
        </nav>
      </Container>
    </header>
  );
}
