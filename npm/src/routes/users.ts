import { sql } from "@/lib/db";

export interface GetUserSummaryTodayOptions {
  userId?: string;
  clerkUserId?: string;
  email?: string;
  date?: Date | string;
}

export interface UserSummaryLog {
  taskName: string;
  quantity: number;
  xpEarned: number;
  recordedAt?: string | null;
}

export interface UserSummaryToday {
  user: {
    id: string;
    clerkUserId: string;
    email: string | null;
    displayName: string | null;
  };
  date: string;
  totals: {
    tasksCompleted: number;
    xpEarned: number;
    uniqueTasks: number;
  };
  logs: UserSummaryLog[];
  emotion: {
    key: string;
    raw: string | null;
  } | null;
  progress: {
    totalXp: number;
    level: number;
    xpToNext: number;
    dailyStreak: number;
    weeklyStreak: {
      current: number;
      max: number;
    };
  };
  profile: {
    gameMode: string | null;
    pace: string | null;
    timezone: string | null;
  } | null;
}

export class SummaryInputError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "SummaryInputError";
    this.statusCode = statusCode;
  }
}

type DbUserRow = {
  id: string;
  clerk_user_id: string;
  email: string | null;
  display_name: string | null;
};

type SummaryRow = {
  tasks_completed: number | string | null;
  xp_earned: number | string | null;
  emotion_key: string | null;
  emotion_raw: string | null;
  total_xp: number | string | null;
  level: number | string | null;
  xp_to_next: number | string | null;
  streak_d: number | string | null;
  c1s_cur: number | string | null;
  c1s_max: number | string | null;
  game_mode: string | null;
  pace: string | null;
  timezone: string | null;
};

type LogRow = {
  task_name: string;
  qty: number | string | null;
  xp_earned: number | string | null;
  created_at: string | null;
};

export async function getUserSummaryToday(
  options: GetUserSummaryTodayOptions
): Promise<UserSummaryToday | null> {
  const userRow = await findUser(options);
  if (!userRow) {
    return null;
  }

  const targetDate = normalizeDate(options.date);

  const [summaryRowsRaw, logRowsRaw] = await Promise.all([
    sql`
      WITH logs AS (
        SELECT
          COALESCE(SUM(qty), 0)        AS tasks_completed,
          COALESCE(SUM(xp_earned), 0)  AS xp_earned
        FROM daily_log
        WHERE user_id = ${userRow.id} AND done_at = ${targetDate}
      ),
      emotion AS (
        SELECT emotion_key, emotion_raw
        FROM daily_emotion
        WHERE user_id = ${userRow.id} AND date = ${targetDate}
        ORDER BY created_at DESC
        LIMIT 1
      ),
      snapshot AS (
        SELECT total_xp, level, xp_to_next, streak_d, c1s_cur, c1s_max
        FROM user_progress_snapshot
        WHERE user_id = ${userRow.id}
      ),
      profile AS (
        SELECT game_mode, pace, timezone
        FROM user_profile
        WHERE user_id = ${userRow.id}
      )
      SELECT
        logs.tasks_completed,
        logs.xp_earned,
        emotion.emotion_key,
        emotion.emotion_raw,
        snapshot.total_xp,
        snapshot.level,
        snapshot.xp_to_next,
        snapshot.streak_d,
        snapshot.c1s_cur,
        snapshot.c1s_max,
        profile.game_mode,
        profile.pace,
        profile.timezone
      FROM logs
      LEFT JOIN emotion ON TRUE
      LEFT JOIN snapshot ON TRUE
      LEFT JOIN profile ON TRUE;
    `,
    sql`
      SELECT task_name, qty, xp_earned, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SSZ') AS created_at
      FROM daily_log
      WHERE user_id = ${userRow.id} AND done_at = ${targetDate}
      ORDER BY created_at ASC, task_name ASC;
    `,
  ]);

  const summaryRow = (Array.isArray(summaryRowsRaw) && summaryRowsRaw[0]
    ? (summaryRowsRaw[0] as SummaryRow)
    : undefined);

  const logRows = (Array.isArray(logRowsRaw) ? (logRowsRaw as LogRow[]) : [])
    .filter((row): row is LogRow =>
      typeof row === "object" &&
      row !== null &&
      typeof (row as { task_name?: unknown }).task_name === "string"
    );

  const logsFormatted: UserSummaryLog[] = logRows.map((log) => ({
    taskName: log.task_name,
    quantity: toNumber(log.qty),
    xpEarned: toNumber(log.xp_earned),
    recordedAt: log.created_at,
  }));

  const uniqueTasks = new Set(logsFormatted.map((log) => log.taskName)).size;

  return {
    user: {
      id: userRow.id,
      clerkUserId: userRow.clerk_user_id,
      email: userRow.email,
      displayName: userRow.display_name,
    },
    date: targetDate,
    totals: {
      tasksCompleted: toNumber(summaryRow?.tasks_completed),
      xpEarned: toNumber(summaryRow?.xp_earned),
      uniqueTasks,
    },
    logs: logsFormatted,
    emotion:
      summaryRow?.emotion_key != null
        ? {
            key: summaryRow.emotion_key,
            raw: summaryRow.emotion_raw,
          }
        : null,
    progress: {
      totalXp: toNumber(summaryRow?.total_xp),
      level: toNumber(summaryRow?.level, 1),
      xpToNext: toNumber(summaryRow?.xp_to_next),
      dailyStreak: toNumber(summaryRow?.streak_d),
      weeklyStreak: {
        current: toNumber(summaryRow?.c1s_cur),
        max: toNumber(summaryRow?.c1s_max),
      },
    },
    profile:
      summaryRow &&
      (summaryRow.game_mode != null || summaryRow.pace != null || summaryRow.timezone != null)
        ? {
            gameMode: summaryRow.game_mode,
            pace: summaryRow.pace,
            timezone: summaryRow.timezone,
          }
        : null,
  };
}

async function findUser(options: GetUserSummaryTodayOptions): Promise<DbUserRow | null> {
  if (!options.userId && !options.clerkUserId && !options.email) {
    throw new SummaryInputError(
      "Debes proporcionar `userId`, `clerkUserId` o `email` para obtener el resumen del usuario."
    );
  }

  if (options.userId) {
    const rows = await sql`
      SELECT id, clerk_user_id, email, display_name
      FROM app_user
      WHERE id = ${options.userId}
      LIMIT 1;
    `;
    const first = Array.isArray(rows) ? (rows[0] as DbUserRow | undefined) : undefined;
    if (first) {
      return first;
    }
    return null;
  }

  if (options.clerkUserId) {
    const rows = await sql`
      SELECT id, clerk_user_id, email, display_name
      FROM app_user
      WHERE clerk_user_id = ${options.clerkUserId}
      LIMIT 1;
    `;
    const first = Array.isArray(rows) ? (rows[0] as DbUserRow | undefined) : undefined;
    if (first) {
      return first;
    }
  }

  if (options.email) {
    const rows = await sql`
      SELECT id, clerk_user_id, email, display_name
      FROM app_user
      WHERE email = ${options.email}
      LIMIT 1;
    `;
    const first = Array.isArray(rows) ? (rows[0] as DbUserRow | undefined) : undefined;
    if (first) {
      return first;
    }
  }

  return null;
}

function normalizeDate(input?: Date | string): string {
  if (!input) {
    return formatDate(new Date());
  }

  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      throw new SummaryInputError("La fecha proporcionada no es válida.");
    }
    return formatDate(input);
  }

  const trimmed = input.trim();
  if (!trimmed) {
    throw new SummaryInputError("La fecha proporcionada no es válida.");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new SummaryInputError("La fecha proporcionada no es válida.");
  }

  return formatDate(parsed);
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
