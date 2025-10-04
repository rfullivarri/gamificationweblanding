-- EXTENSIONES (Railway las crea al correr este archivo)
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- usamos gen_random_uuid()

-- Tipos
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'game_mode') THEN
    CREATE TYPE game_mode AS ENUM ('LOW','CHILL','FLOW','EVOLVE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty') THEN
    CREATE TYPE difficulty AS ENUM ('EASY','MEDIUM','HARD');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mission_status') THEN
    CREATE TYPE mission_status AS ENUM ('ACTIVE','COMPLETED','FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_status') THEN
    CREATE TYPE job_status AS ENUM ('QUEUED','RUNNING','DONE','ERROR');
  END IF;
END$$;

-- === 1) Identidad de usuario (Clerk como autoridad) ===
CREATE TABLE app_user (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id   TEXT UNIQUE NOT NULL,
  email           CITEXT,
  display_name    TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON app_user (clerk_user_id);

CREATE TABLE user_profile (
  user_id         UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  game_mode       game_mode,
  pace            TEXT,                 -- "Low/Chill/Normal/Shark" (o los finales)
  timezone        TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === 2) Taxonomía base (catálogo global) ===
CREATE TABLE pillar (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        TEXT UNIQUE NOT NULL,     -- BODY / MIND / SOUL
  name        TEXT NOT NULL
);

CREATE TABLE trait (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pillar_id   UUID NOT NULL REFERENCES pillar(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  UNIQUE (pillar_id, code)
);

CREATE TABLE stat (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trait_id    UUID NOT NULL REFERENCES trait(id) ON DELETE CASCADE,
  code        TEXT NOT NULL,
  name        TEXT NOT NULL,
  UNIQUE (trait_id, code)
);

CREATE TABLE task_catalog (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stat_id       UUID NOT NULL REFERENCES stat(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  difficulty    difficulty NOT NULL,
  base_xp       INTEGER NOT NULL DEFAULT 10,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (stat_id, code)
);

-- === 3) Instancias personalizadas por usuario ===
CREATE TABLE user_task (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  task_catalog_id UUID REFERENCES task_catalog(id) ON DELETE SET NULL,
  pillar_id       UUID NOT NULL REFERENCES pillar(id),
  trait_id        UUID NOT NULL REFERENCES trait(id),
  stat_id         UUID NOT NULL REFERENCES stat(id),
  name            TEXT NOT NULL,
  difficulty      difficulty NOT NULL,
  base_xp         INTEGER NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  position        INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON user_task (user_id, is_active);

-- === 4) Datos diarios ===
CREATE TABLE daily_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  user_task_id  UUID REFERENCES user_task(id) ON DELETE SET NULL,
  task_name     TEXT NOT NULL,
  done_at       DATE NOT NULL,
  qty           INTEGER NOT NULL DEFAULT 1,
  xp_earned     INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, user_task_id, done_at, task_name)
);
CREATE INDEX ON daily_log (user_id, done_at);

CREATE TABLE daily_emotion (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  emotion_key   TEXT NOT NULL,
  emotion_raw   TEXT,
  note          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
CREATE INDEX ON daily_emotion (user_id, date);

-- === 5) Snapshot/caché de progreso (derivable, pero útil) ===
CREATE TABLE user_progress_snapshot (
  user_id       UUID PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  total_xp      INTEGER NOT NULL DEFAULT 0,
  level         INTEGER NOT NULL DEFAULT 1,
  xp_to_next    INTEGER NOT NULL DEFAULT 100,
  journey_days  INTEGER NOT NULL DEFAULT 0,
  base_state    TEXT,           -- 'modificada' / 'constante'
  streak_d      INTEGER NOT NULL DEFAULT 0,  -- racha diaria actual
  c1s_cur       INTEGER NOT NULL DEFAULT 0,  -- rachas semanales actuales
  c2s_cur       INTEGER NOT NULL DEFAULT 0,
  c3s_cur       INTEGER NOT NULL DEFAULT 0,
  c4s_cur       INTEGER NOT NULL DEFAULT 0,
  c1s_max       INTEGER NOT NULL DEFAULT 0,  -- rachas máximas
  c2s_max       INTEGER NOT NULL DEFAULT 0,
  c3s_max       INTEGER NOT NULL DEFAULT 0,
  c4s_max       INTEGER NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === 6) Hábitos graduados ===
CREATE TABLE habit_achieved (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  user_task_id  UUID REFERENCES user_task(id) ON DELETE SET NULL,
  task_name     TEXT NOT NULL,
  achieved_on   DATE NOT NULL,
  reason        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON habit_achieved (user_id, achieved_on);

-- === 7) Prompts / IA ===
CREATE TABLE ai_prompt (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES app_user(id) ON DELETE SET NULL,
  mode          game_mode,
  status        TEXT NOT NULL DEFAULT 'PENDING',
  input_text    TEXT NOT NULL,
  output_json   JSONB,
  error_text    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  done_at       TIMESTAMPTZ
);
CREATE INDEX ON ai_prompt (user_id, status);

-- === 8) Misiones / Recompensas ===
CREATE TABLE mission (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  goal_desc     TEXT,
  difficulty    difficulty,
  bonus_type    TEXT,           -- 'xp_multiplier' | 'xp_bonus'
  bonus_value   NUMERIC,        -- 1.5 o 50
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_mission (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  mission_id    UUID NOT NULL REFERENCES mission(id) ON DELETE CASCADE,
  status        mission_status NOT NULL DEFAULT 'ACTIVE',
  started_at    DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at  DATE,
  progress_json JSONB,
  UNIQUE (user_id, mission_id, status)
);
CREATE INDEX ON user_mission (user_id, status);

-- === 9) Emails / Jobs (orquestación) ===
CREATE TABLE email_log (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES app_user(id) ON DELETE SET NULL,
  to_email      CITEXT NOT NULL,
  template_key  TEXT NOT NULL,
  subject       TEXT,
  payload_json  JSONB,
  sent_at       TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'QUEUED',
  error_text    TEXT
);

CREATE TABLE job_schedule (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type      TEXT NOT NULL,           -- 'send_daily_form', 'recalc_weekly', etc.
  user_id       UUID REFERENCES app_user(id) ON DELETE CASCADE,
  cron_expr     TEXT NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  last_run_at   TIMESTAMPTZ,
  status        job_status NOT NULL DEFAULT 'QUEUED',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON job_schedule (job_type, active);
