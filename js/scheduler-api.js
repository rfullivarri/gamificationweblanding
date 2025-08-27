// js/scheduler-api.js

// === CONFIGURACIÓN ===
// Worker2 (Scheduler) — AJUSTÁ con tu dominio del worker que ya usás:
const WORKER2_BASE = 'https://gamificationscheduler.rfullivarri22.workers.dev';

// Si QUERÉS permitir fallback a un endpoint de Worker1, podés setearlo acá.
// PERO por defecto LEEMOS el contexto desde dashboardv3.js (window.GJ_CTX).
const WORKER1_FALLBACK = ''; // p.ej. 'https://tu-worker1/context' (opcional)

// ============ HELPERS HTTP ============
async function getJson(url) {
  const r = await fetch(url, { credentials: 'include' });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return r.json();
}
async function postJson(url, body) {
  const r = await fetch(url, {
    method: 'POST',
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
/**
 * Intentamos, en orden:
 * 1) window.GJ_CTX (inyectado por tu dashboardv3.js)
 * 2) localStorage (gj_ctx)
 * 3) Fallback opcional a Worker1 (si setearas WORKER1_FALLBACK)
 */
export async function apiGetContext(email) {
  // 1) window
  if (window.GJ_CTX && window.GJ_CTX.userSheetId) return window.GJ_CTX;

  // 2) localStorage
  const raw = localStorage.getItem('gj_ctx');
  if (raw) {
    try {
      const ctx = JSON.parse(raw);
      if (ctx && ctx.userSheetId) return ctx;
    } catch {}
  }

  // 3) Fallback (opcional)
  if (WORKER1_FALLBACK) {
    const url = `${WORKER1_FALLBACK}?email=${encodeURIComponent(email)}`;
    return getJson(url);
  }

  throw new Error('No hay contexto disponible. Asegurate de setear window.GJ_CTX en dashboardv3.js');
}

/** Guarda el contexto por si se refresca la SPA */
export function saveCtx(ctx) {
  try { localStorage.setItem('gj_ctx', JSON.stringify(ctx || {})); } catch {}
  if (ctx?.email)     localStorage.setItem('gj_email', ctx.email);
  if (ctx?.userSheetId) localStorage.setItem('gj_sheetId', ctx.userSheetId);
}
