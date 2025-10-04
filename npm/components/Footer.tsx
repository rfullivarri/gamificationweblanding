import Link from "next/link";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 py-12">
      <Container className="flex flex-col gap-6 text-center text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} GamificationOS. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-4">
          <Link href="/privacidad" className="hover:text-white">
            Privacidad
          </Link>
          <Link href="/terminos" className="hover:text-white">
            Términos
          </Link>
          <Link href="mailto:hola@gamificationos.com" className="hover:text-white">
            Contacto
          </Link>
        </div>
      </Container>
    </footer>
  );
}
