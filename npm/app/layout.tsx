import "../styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Rubik } from "next/font/google";
import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const metadata = {
  title: "Innerbloom — Gamification Journey",
  description:
    "Explora la experiencia gamificada para crear hábitos equilibrados en cuerpo, mente y alma.",
};

const rubik = Rubik({ subsets: ["latin"], variable: "--font-rubik" });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body
          className={cn(
            "relative min-h-screen bg-background text-white",
            "bg-mesh-gradient",
            rubik.variable
          )}
        >
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(125,60,255,0.18),transparent_55%)]" />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
