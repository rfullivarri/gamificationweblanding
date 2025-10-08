# Estructura de base de datos y endpoints actuales

## Tipos y enums definidos
- `game_mode`: `LOW`, `CHILL`, `FLOW`, `EVOLVE`. 【F:npm/sql/schema.sql†L6-L20】
- `difficulty`: `EASY`, `MEDIUM`, `HARD`. 【F:npm/sql/schema.sql†L6-L20】
- `mission_status`: `ACTIVE`, `COMPLETED`, `FAILED`. 【F:npm/sql/schema.sql†L6-L20】
- `job_status`: `QUEUED`, `RUNNING`, `DONE`, `ERROR`. 【F:npm/sql/schema.sql†L6-L20】

## Tablas principales
- **`app_user`**: identidad sincronizada con Clerk; guarda `clerk_user_id`, email, nombre visible y avatar con trazabilidad de creación/actualización. 【F:npm/sql/schema.sql†L22-L33】
- **`user_profile`**: preferencias y estado operativo del usuario (`game_mode`, ritmo, huso horario, estado). Relación 1:1 con `app_user`. 【F:npm/sql/schema.sql†L34-L42】
- **`pillar` / `trait` / `stat` / `task_catalog`**: taxonomía global. `pillar` expone códigos BODY/MIND/SOUL; `trait` y `stat` cuelgan jerárquicamente y `task_catalog` almacena tareas base con dificultad enum, XP y bandera de actividad. 【F:npm/sql/schema.sql†L44-L76】
- **`user_task`**: catálogo personalizado de tareas por usuario, con referencias al catálogo global, dificultad, XP, posición y estado. 【F:npm/sql/schema.sql†L78-L95】
- **`daily_log`**: registros diarios de ejecución de tareas (cantidad, XP obtenido) únicos por día/tarea. 【F:npm/sql/schema.sql†L96-L108】
- **`daily_emotion`**: check-in emocional diario por usuario, con clave y nota opcional. 【F:npm/sql/schema.sql†L110-L120】
- **`user_progress_snapshot`**: caché derivado (XP total, nivel, días de viaje, estado de la base, rachas actuales y máximas). 【F:npm/sql/schema.sql†L122-L140】
- **`habit_achieved`**: hitos en los que una task se consolidó como hábito, con fecha y motivo. 【F:npm/sql/schema.sql†L142-L152】
- **`ai_prompt`**: auditoría de prompts generados para IA (modo, estado, input/output y errores). 【F:npm/sql/schema.sql†L154-L166】
- **`mission` / `user_mission`**: catálogo de misiones gamificadas y asignaciones por usuario con estado y progreso JSON. 【F:npm/sql/schema.sql†L168-L191】
- **`email_log`**: histórico de correos enviados (plantilla, payload, estado, error). 【F:npm/sql/schema.sql†L193-L204】
- **`job_schedule`**: agenda de jobs (tipo, cron, estado, último run) ligada opcionalmente a usuarios. 【F:npm/sql/schema.sql†L206-L216】

## Endpoints detectados en el front
| Archivo | Método y ruta | Propósito |
| --- | --- | --- |
| `js/bbdd.js` | `GET ${API_BASE}/bbdd?email=…` | Trae la matriz A–E de tasks para el editor compacto. 【F:js/bbdd.js†L3-L70】 |
| `js/bbdd.js` | `POST ${API_BASE}/bbdd` | Persiste cambios del editor. 【F:js/bbdd.js†L72-L80】 |
| `js/bbdd.js` | `POST ${API_BASE}/bbdd/confirm` | Confirma cambios y dispara refresco de Daily Quest. 【F:js/bbdd.js†L81-L88】 |
| `js/dashboardv3.js` | `GET ${WORKER_BASE}/bundle?email=…` | Descarga el bundle consolidado (estado general del usuario). 【F:js/dashboardv3.js†L174-L219】 |
| `js/dashboardv3.js` | `POST ${WORKER_BASE}/refresh-pull` | Solicita al worker que actualice el bundle desde la WebApp original. 【F:js/dashboardv3.js†L1484-L1515】 |
| `js/dashboardv3.js` | `GET ${OLD_WEBAPP_URL}?email=…` | Fallback legacy al Apps Script si el worker falla. 【F:js/dashboardv3.js†L174-L187】 |
| `js/dashboardv3.js` | `POST ${OLD_WEBAPP_URL}?action=mark_first_programmed…` | Marca desde Apps Script que el scheduler quedó configurado. 【F:js/dashboardv3.js†L451-L466】 |
| `js/noti-client.js` | `GET ${WORKER_BASE}/api/events?email=…&limit=50` | Sincroniza notificaciones recientes. 【F:js/noti-client.js†L1-L37】 |
| `js/scheduler-api.js` | `POST ${WORKER2_BASE}/schedule` · `/pause` · `/resume` · `/testsend` | Opera el scheduler de recordatorios vía worker dedicado. 【F:js/scheduler-api.js†L1-L43】 |
| `js/scheduler-api.js` | `GET ${WORKER1_FALLBACK}?email=…` | Recupera contexto/bundle si no está en cache. 【F:js/scheduler-api.js†L40-L109】 |
| `js/scheduler-api.js` | `POST ${WEBAPP_URL}` con `action=mark_first_programmed` | Replica la actualización legacy cuando se agenda desde el scheduler modal. 【F:js/scheduler-api.js†L44-L67】 |
| `js/signupv2.js` | `POST FORM_ACTION` (Google Form) | Envía el alta de usuario. 【F:js/signupv2.js†L1-L88】 |
| `js/signupv2.js` | `POST https://api.imgbb.com/1/upload?key=…` | Sube avatar opcional antes del alta. 【F:js/signupv2.js†L99-L113】 |
| `js/signupv2.js` | `GET ${CHECK_STATUS_ENDPOINT}?email=…` | Consulta Apps Script para saber si la base está lista. 【F:js/signupv2.js†L137-L142】 |
| `js/formsintrov2.js` | `POST https://formulariointro.rfullivarri22.workers.dev/` (+`?debug=1`) | Envía el journey del wizard al worker proxy del formulario. 【F:js/formsintrov2.js†L772-L815】 |
| `js/popups.js` | `GET ${POPUPS_API}` y `GET ${POPUPS_API}?email=…` | Pide configuraciones de pop-ups y recap semanales. 【F:js/popups.js†L1-L119】【F:js/popups.js†L254-L842】 |
| `js/dashboardv3.js` | `POST https://api.imgbb.com/1/upload?key=…` y `POST AVATAR_FORM.ACTION` | Actualiza el avatar desde el dashboard cuando el usuario carga una imagen. 【F:js/dashboardv3.js†L1470-L1516】【F:js/dashboardv3.js†L1436-L1470】 |
| `js/dashboardv3.js` | `GET ${WORKER_BASE}/refresh-pull` → `GET ${WORKER_BASE}/bundle` (sondeo) | Flujo de backoff para reflejar cambios luego de confirmar BBDD/scheduler. 【F:js/dashboardv3.js†L1484-L1519】 |
| `js/formsintrov2.js` | `GET https://rfullivarri.github.io/gamificationweblanding/indexv2.html` (redirect) | Redirige al landing si el usuario abandona el wizard desde el HUD. 【F:js/formsintrov2.js†L300-L307】 |

> Nota: los endpoints externos se heredan tanto en la versión legacy (`js/`) como en la carpeta `refactor/`, donde se reutilizan las mismas URLs productivas.
