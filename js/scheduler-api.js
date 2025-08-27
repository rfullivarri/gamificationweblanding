// js/scheduler-api.js

// === CONFIGURACIÓN ===
// Worker2 (Scheduler) — AJUSTÁ con tu dominio del worker que ya usás:
const WORKER2_BASE = 'https://gamificationscheduler.rfullivarri22.workers.dev';

// Si QUERÉS permitir fallback a un endpoint de Worker1, podés setearlo acá.
// PERO por defecto LEEMOS el contexto desde dashboardv3.js (window.GJ_CTX).
const WORKER1_FALLBACK = ''; // p.ej. 'https://tu-worker1/context' (opcional)  https://gamificationworker.rfullivarri22.workers.dev

// ============ HELPERS HTTP ============
async function getJson(url) {
  const r = await fetch(url, { credentials: 'include',  mode: 'cors' });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return r.json();
}
async function postJson(url, body) {
  const r = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = {raw:text}; }
  if (!r.ok) throw new Error(`POST ${url} -> ${r.status} | ${text}`);
  return json;
}

// ============ API WORKER2 (Scheduler) ============
export function apiSchedule(payload) { return postJson(`${WORKER2_BASE}/schedule`,  payload); }
export function apiPause(payload)    { return postJson(`${WORKER2_BASE}/pause`,     payload); }
export function apiResume(payload)   { return postJson(`${WORKER2_BASE}/resume`,    payload); }
export function apiTestSend(payload) { return postJson(`${WORKER2_BASE}/testsend`,  payload); }

// ============ CONTEXTO (preferencia: dashboardv3.js) ============
export async function apiGetContext(email) {
  // 1) window.GJ_CTX ya armado por dashboardv3.js
  if (window.GJ_CTX && window.GJ_CTX.userSheetId) return window.GJ_CTX;

  // 2) cache local
  const raw = localStorage.getItem('gj_ctx');
  if (raw) {
    try {
      const ctx = JSON.parse(raw);
      if (ctx && ctx.userSheetId) return ctx;
    } catch {}
  }

  // 3) Fallback opcional a Worker1 (si definiste WORKER1_FALLBACK)
  if (WORKER1_FALLBACK) {
    const w1 = await getJson(`${WORKER1_FALLBACK}?email=${encodeURIComponent(email)}`);

    // helpers para normalizar
    const sheetIdFromUrl = (url) => {
      if (!url) return '';
      const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return m ? m[1] : '';
    };
    const onlyHour = (h) => {
      if (h == null) return null;
      const m = String(h).match(/^\s*(\d{1,2})/);
      if (!m) return null;
      return Math.max(0, Math.min(23, parseInt(m[1], 10)));
    };

    // posibles campos que devuelve tu Worker1/WebApp
    const sheetUrl =
      w1.sheetUrl || w1.links?.sheet || w1.dashboard_sheet_url || '';

    const userSheetId =
      w1.user_sheet_id || w1.userSheetId || sheetIdFromUrl(sheetUrl);

    const s = w1.scheduler || {};
    const ctx = {
      email,
      userSheetId,
      linkPublico: w1.daily_form_url || w1.links?.daily_form || '',
      scheduler: {
        canal:      s.canal      ?? 'email',
        frecuencia: s.frecuencia ?? 'DAILY',
        dias:       s.dias       ?? '',
        hora:       (onlyHour(s.hora) ?? 8),   // SOLO HH (0–23)
        timezone:   s.timezone   ?? 'Europe/Madrid',
        estado:     s.estado     ?? 'ACTIVO'
      }
    };
    return ctx;
  }

  // si no hubo ninguna fuente válida
  throw new Error('No hay contexto disponible. Asegurate de setear window.GJ_CTX en dashboardv3.js o configurar WORKER1_FALLBACK.');
}
/** Guarda el contexto por si se refresca la SPA */
export function saveCtx(ctx) {
  try { localStorage.setItem('gj_ctx', JSON.stringify(ctx || {})); } catch {}
  if (ctx?.email)     localStorage.setItem('gj_email', ctx.email);
  if (ctx?.userSheetId) localStorage.setItem('gj_sheetId', ctx.userSheetId);
}
