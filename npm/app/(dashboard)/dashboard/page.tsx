import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function DashboardContent() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 py-12">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/80 shadow-xl">
        <h1 className="text-2xl font-semibold text-white">Hola, {user.firstName ?? user.username ?? "explorador"} 👋</h1>
        <p className="mt-4 text-sm leading-relaxed">
          Este es el punto de partida para gestionar campañas, retos y recompensas. Conecta Neon para almacenar eventos,
          programa webhooks para activar automatizaciones y visualiza métricas en tiempo real.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {["Usuarios activos", "Misiones en curso", "Recompensas entregadas", "Retención semanal"].map((metric) => (
          <div key={metric} className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6">
            <p className="text-sm text-white/60">{metric}</p>
            <p className="mt-4 text-3xl font-semibold text-white">—</p>
            <p className="mt-2 text-xs uppercase tracking-[0.25em] text-white/50">Integrado próximamente</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-white/60">Cargando panel...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
