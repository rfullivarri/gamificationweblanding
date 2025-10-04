import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ReactNode } from "react";

export const metadata = {
  title: "Gamification Platform",
  description: "Landing page modernizada con Next.js, Tailwind y Clerk"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body className="min-h-screen bg-slate-950 text-white">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
