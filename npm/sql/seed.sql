-- Pillars
INSERT INTO pillar (code, name) VALUES
  ('BODY','Cuerpo'), ('MIND','Mente'), ('SOUL','Alma')
ON CONFLICT (code) DO NOTHING;

-- Traits + Stats + Catálogo base (ejemplo rápido)
WITH p_body AS (SELECT id FROM pillar WHERE code='BODY'),
     p_mind AS (SELECT id FROM pillar WHERE code='MIND'),
     p_soul AS (SELECT id FROM pillar WHERE code='SOUL')
INSERT INTO trait (pillar_id, code, name)
SELECT id, 'REST','Descanso' FROM p_body
ON CONFLICT DO NOTHING;

WITH t_rest AS (
  SELECT t.id FROM trait t JOIN pillar p ON p.id=t.pillar_id
  WHERE p.code='BODY' AND t.code='REST'
)
INSERT INTO stat (trait_id, code, name)
SELECT id, 'SLEEP','Sueño' FROM t_rest
ON CONFLICT DO NOTHING;

WITH s_sleep AS (
  SELECT s.id FROM stat s JOIN trait t ON t.id=s.trait_id
  JOIN pillar p ON p.id=t.pillar_id
  WHERE p.code='BODY' AND t.code='REST' AND s.code='SLEEP'
)
INSERT INTO task_catalog (stat_id, code, name, difficulty, base_xp)
SELECT id, 'SLEEP_7H', 'Dormir 7h', 'EASY', 10 FROM s_sleep
ON CONFLICT DO NOTHING;

-- Mind
INSERT INTO trait (pillar_id, code, name)
SELECT id, 'FOCUS','Enfoque' FROM p_mind
ON CONFLICT DO NOTHING;

WITH t_focus AS (
  SELECT t.id FROM trait t JOIN pillar p ON p.id=t.pillar_id
  WHERE p.code='MIND' AND t.code='FOCUS'
)
INSERT INTO stat (trait_id, code, name)
SELECT id, 'READ','Lectura' FROM t_focus
ON CONFLICT DO NOTHING;

WITH s_read AS (
  SELECT s.id FROM stat s JOIN trait t ON t.id=s.trait_id
  JOIN pillar p ON p.id=t.pillar_id
  WHERE p.code='MIND' AND t.code='FOCUS' AND s.code='READ'
)
INSERT INTO task_catalog (stat_id, code, name, difficulty, base_xp)
SELECT id, 'READ_10', 'Leer 10 min', 'EASY', 10 FROM s_read
ON CONFLICT DO NOTHING;

-- Soul
INSERT INTO trait (pillar_id, code, name)
SELECT id, 'EMO','Emociones' FROM p_soul
ON CONFLICT DO NOTHING;

WITH t_emo AS (
  SELECT t.id FROM trait t JOIN pillar p ON p.id=t.pillar_id
  WHERE p.code='SOUL' AND t.code='EMO'
)
INSERT INTO stat (trait_id, code, name)
SELECT id, 'JOURNAL','Registro emocional' FROM t_emo
ON CONFLICT DO NOTHING;

WITH s_journal AS (
  SELECT s.id FROM stat s JOIN trait t ON t.id=s.trait_id
  JOIN pillar p ON p.id=t.pillar_id
  WHERE p.code='SOUL' AND t.code='EMO' AND s.code='JOURNAL'
)
INSERT INTO task_catalog (stat_id, code, name, difficulty, base_xp)
SELECT id, 'JOURNAL_1', 'Escribir 1 reflexión', 'EASY', 10 FROM s_journal
ON CONFLICT DO NOTHING;

-- Usuario demo (Clerk)
INSERT INTO app_user (clerk_user_id, email, display_name)
VALUES ('clerk_demo_123','demo@innerbloom.app','Demo')
ON CONFLICT (clerk_user_id) DO NOTHING;

INSERT INTO user_profile (user_id, game_mode, pace, timezone)
SELECT id, 'CHILL','Normal','Europe/Berlin'
FROM app_user WHERE clerk_user_id='clerk_demo_123'
ON CONFLICT (user_id) DO NOTHING;

-- Instanciar tasks base para el usuario demo
INSERT INTO user_task (user_id, task_catalog_id, pillar_id, trait_id, stat_id, name, difficulty, base_xp)
SELECT u.id, tc.id, tr.pillar_id, tr.id, s.id, tc.name, tc.difficulty, tc.base_xp
FROM app_user u
CROSS JOIN task_catalog tc
JOIN stat s   ON s.id=tc.stat_id
JOIN trait tr ON tr.id=s.trait_id
WHERE u.clerk_user_id='clerk_demo_123';

-- Un par de logs y emociones
INSERT INTO daily_log (user_id, user_task_id, task_name, done_at, qty, xp_earned)
SELECT u.id, ut.id, ut.name, CURRENT_DATE - 1, 1, ut.base_xp
FROM app_user u
JOIN user_task ut ON ut.user_id=u.id
WHERE u.clerk_user_id='clerk_demo_123'
LIMIT 2;

INSERT INTO daily_emotion (user_id, date, emotion_key, emotion_raw)
SELECT u.id, CURRENT_DATE - 1, 'Calm', '🟦 Calm - centered' FROM app_user u WHERE u.clerk_user_id='clerk_demo_123'
ON CONFLICT DO NOTHING;

INSERT INTO daily_emotion (user_id, date, emotion_key, emotion_raw)
SELECT u.id, CURRENT_DATE, 'Focused', '🟩 Focused - clear' FROM app_user u WHERE u.clerk_user_id='clerk_demo_123'
ON CONFLICT DO NOTHING;
