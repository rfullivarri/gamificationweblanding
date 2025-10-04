import { ReactNode } from "react";
import { Container } from "./Container";

interface SectionTitleProps {
  eyebrow: string;
  title: string;
  description?: string;
  id?: string;
  children?: ReactNode;
}

export function SectionTitle({ eyebrow, title, description, id, children }: SectionTitleProps) {
  return (
    <section id={id} className="py-24">
      <Container className="flex flex-col gap-8 text-center">
        <div>
          <span className="text-xs uppercase tracking-[0.3em] text-brand-light/80">{eyebrow}</span>
          <h2 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{title}</h2>
          {description ? (
            <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-white/70">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </Container>
    </section>
  );
}
