import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Container } from "@/components/Container";

const energy = [
  { label: "HP", value: 76, gradient: "from-rose-500 to-orange-400" },
  { label: "Mood", value: 62, gradient: "from-sky-400 to-indigo-500" },
  { label: "Focus", value: 88, gradient: "from-emerald-400 to-teal-500" }
];

const cultivation = [
  { day: "Lun", value: 60 },
  { day: "Mar", value: 80 },
  { day: "Mié", value: 55 },
  { day: "Jue", value: 90 },
  { day: "Vie", value: 70 },
  { day: "Sáb", value: 85 },
  { day: "Dom", value: 65 }
];

const pillarBalance = [
  {
    title: "Cuerpo",
    description: "Sueño, nutrición y movimiento",
    value: 72,
    accent: "from-rose-500/60 to-orange-400/40"
  },
  {
    title: "Mente",
    description: "Foco, aprendizaje y creatividad",
    value: 65,
    accent: "from-sky-500/60 to-indigo-400/40"
  },
  {
    title: "Alma",
    description: "Emociones, vínculos y propósito",
    value: 78,
    accent: "from-purple-500/60 to-fuchsia-400/40"
  }
];

const questTasks = [
  { title: "Respiración 4-7-8", pillar: "Alma", xp: 20, done: true },
  { title: "Checklist de foco", pillar: "Mente", xp: 35, done: false },
  { title: "Mover el cuerpo 20'", pillar: "Cuerpo", xp: 30, done: false }
];

const streaks = [
  { habit: "Morning Journal", streak: "12 días", xp: 180 },
  { habit: "Flow sprint creativo", streak: "8 días", xp: 140 },
  { habit: "Yoga nocturno", streak: "5 días", xp: 90 }
];

const rewards = [
  { title: "Upgrade de avatar", description: "Desbloquea un nuevo set de auras", unlocked: true },
  { title: "Misión colaborativa", description: "Suma XP en equipo durante el fin de semana", unlocked: false }
];

const missions = [
  {
    title: "Constancia cuerpo",
    description: "Completa 5 sesiones de movimiento consciente",
    status: "En curso",
    progress: "3/5",
    tag: "Semana"
  },
  {
    title: "Deep Work creativo",
    description: "Dos bloques de flow sin interrupciones",
    status: "Hoy",
    progress: "1/2",
    tag: "Daily"
  },
  {
    title: "Mood check",
    description: "Registrar emociones 4 días consecutivos",
    status: "Próxima",
    progress: "0/4",
    tag: "Racha"
  },
  {
    title: "Rewards boost",
    description: "Canjea 250 XP por una recompensa",
    status: "Nuevo",
    progress: "0/1",
    tag: "XP"
  }
];

function ProgressBar({ value, gradient }: { value: number; gradient: string }) {
  return (
    <div className="h-2 rounded-full bg-white/10">
      <div
        className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

async function DashboardContent() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const displayName = user.firstName ?? user.username ?? "explorador";
  const avatar = user.imageUrl;

  return (
    <div className="relative min-h-screen bg-background text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(125,60,255,0.22),_transparent_55%)]" />
      <header className="border-b border-white/10 bg-surface/70 backdrop-blur">
        <Container className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">🎮</div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-white/50">Gamification Journey</p>
              <p className="text-lg font-semibold text-white">Self-Improvement Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg shadow-glow"
              aria-label="Notificaciones"
            >
              🔔
              <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent text-xs font-semibold text-white">
                3
              </span>
            </button>
            <button className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white">
              ☰ Menú
            </button>
          </div>
        </Container>
      </header>
      <main className="pb-20 pt-12">
        <Container className="space-y-16">
          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-white/60">Hola, {displayName} 👋</p>
                    <h1 className="mt-2 text-2xl font-semibold text-white">Tu progreso de hoy</h1>
                  </div>
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={`${displayName} avatar`}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/30 text-xl">
                      {displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>Total XP</span>
                    <span>2.860</span>
                  </div>
                  <ProgressBar value={68} gradient="from-accent to-purple-500" />
                  <div className="flex items-center justify-between text-xs text-white/50">
                    <span>Level 12</span>
                    <span>✨ Te faltan 120 XP para el próximo nivel</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <h2 className="text-lg font-semibold text-white">💠 Daily Energy</h2>
                <p className="mt-1 text-sm text-white/60">
                  Indicadores dinámicos según tus hábitos de los últimos 7 días.
                </p>
                <div className="mt-6 space-y-4">
                  {energy.map((item) => (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-white/70">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <ProgressBar value={item.value} gradient={item.gradient} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">🪴 Daily Cultivation</h2>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">Marzo</span>
                </div>
                <div className="mt-6 grid grid-cols-7 gap-3 text-center text-xs text-white/60">
                  {cultivation.map((item) => (
                    <div key={item.day} className="flex flex-col items-center gap-2">
                      <span>{item.day}</span>
                      <div className="flex h-28 w-8 items-end overflow-hidden rounded-full bg-white/10">
                        <div
                          className="w-full rounded-full bg-gradient-to-t from-accent to-white"
                          style={{ height: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">⚖️ Balance de pilares</h2>
                  <Link href="#" className="text-xs font-semibold text-accent-soft hover:text-white">
                    Ver historial
                  </Link>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  Mantén alineados cuerpo, mente y alma para desbloquear misiones especiales.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {pillarBalance.map((pillar) => (
                    <article
                      key={pillar.title}
                      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br ${pillar.accent}`} />
                      <h3 className="text-base font-semibold text-white">{pillar.title}</h3>
                      <p className="mt-1 text-xs text-white/60">{pillar.description}</p>
                      <div className="mt-4 text-3xl font-semibold text-white">{pillar.value}%</div>
                      <ProgressBar value={pillar.value} gradient="from-white/80 to-white/40" />
                    </article>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-lg font-semibold text-white">🎯 Daily Quest</h2>
                  <button className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/70 transition hover:border-white/40 hover:text-white">
                    Programar
                  </button>
                </div>
                <div className="mt-6 space-y-4">
                  {questTasks.map((task) => (
                    <div key={task.title} className="flex items-center justify-between gap-4 rounded-2xl bg-white/5 p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                            task.done ? "border-accent bg-accent/20" : "border-white/30"
                          }`}
                        >
                          {task.done ? "✓" : ""}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{task.title}</p>
                          <p className="text-xs text-white/60">Pilar: {task.pillar}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-white/70">+{task.xp} XP</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                  <p className="font-semibold text-white">Reflexión emocional</p>
                  <p className="mt-1">
                    Tu emoción predominante ayer fue <span className="text-accent-soft">Curiosidad</span>. Observa cómo impactó en tu energía hoy.
                  </p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <h2 className="text-lg font-semibold text-white">🌡️ Emotion Heatmap</h2>
                <p className="mt-2 text-sm text-white/60">Últimos 14 días</p>
                <div className="mt-6 grid grid-cols-7 gap-3 text-center text-xs text-white/60">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="h-16 w-full rounded-xl bg-gradient-to-br from-accent/20 to-transparent"></div>
                      <span>D{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <h2 className="text-lg font-semibold text-white">⚠️ Recordatorios</h2>
                <div className="mt-4 space-y-4 text-sm text-white/70">
                  <div className="rounded-2xl border-l-4 border-accent/70 bg-white/5 p-4">
                    <p className="font-semibold text-white">Confirmá tu base</p>
                    <p className="mt-1">Revisá y confirma tu pergamino para activar nuevas quests.</p>
                    <Link href="#" className="mt-3 inline-flex text-xs font-semibold text-accent-soft hover:text-white">
                      Editar base →
                    </Link>
                  </div>
                  <div className="rounded-2xl border-l-4 border-emerald-400/80 bg-white/5 p-4">
                    <p className="font-semibold text-white">Programá tu Daily Quest</p>
                    <p className="mt-1">Recibe cada día tu misión en tu bandeja y evita perder rachas.</p>
                    <button className="mt-3 inline-flex text-xs font-semibold text-accent-soft hover:text-white">
                      Abrir scheduler →
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <h2 className="text-lg font-semibold text-white">🔥 Tus rachas</h2>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  {streaks.map((streak) => (
                    <div key={streak.habit} className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                      <div>
                        <p className="font-semibold text-white">{streak.habit}</p>
                        <p className="text-xs text-white/60">{streak.streak}</p>
                      </div>
                      <span className="text-xs font-semibold text-white/70">+{streak.xp} XP</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-panel">
                <h2 className="text-lg font-semibold text-white">🎁 Recompensas</h2>
                <div className="mt-4 space-y-3 text-sm text-white/70">
                  {rewards.map((reward) => (
                    <div
                      key={reward.title}
                      className={`rounded-2xl border p-4 ${
                        reward.unlocked
                          ? "border-accent/60 bg-accent/20 text-white"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <p className="font-semibold">{reward.title}</p>
                      <p className="mt-1 text-xs text-white/70">{reward.description}</p>
                      {reward.unlocked ? (
                        <button className="mt-3 inline-flex rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:bg-white/20">
                          Canjear ahora
                        </button>
                      ) : (
                        <span className="mt-3 inline-flex rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/50">
                          Pronto
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          <section className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl font-semibold text-white">🗂️ Misiones</h2>
              <Link href="#" className="text-sm font-semibold text-accent-soft hover:text-white">
                Ver todas las misiones →
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {missions.map((mission) => {
                const [current, total] = mission.progress.split("/").map((part) => Number(part));
                const ratio = total ? Math.min((current / total) * 100, 100) : 0;

                return (
                  <article
                    key={mission.title}
                    className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-panel transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                      <span>{mission.tag}</span>
                      <span>{mission.status}</span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">{mission.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{mission.description}</p>
                    <div className="mt-6 flex items-center justify-between text-xs text-white/60">
                      <span>Progreso</span>
                      <span>{mission.progress}</span>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-accent to-purple-500"
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </Container>
      </main>
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
