// === CONFIGURACIÓN ===
// Worker2 (Scheduler)
const WORKER2_BASE = 'https://gamificationscheduler.rfullivarri22.workers.dev';

// Fallback a Worker1 para traer el contexto del usuario (bundle)
const WORKER1_FALLBACK = 'https://gamificationworker.rfullivarri22.workers.dev/bundle';

// ============ HELPERS HTTP ============
async function getJson(url) {
  const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
  if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
  return r.json();
}
async function postJson(url, body) {
  console.log('[SCHED] POST →', url, body);
  const r = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {})
  });
  const text = await r.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!r.ok) throw new Error(`POST ${url} -> ${r.status} | ${text}`);
  return json;
}

// ============ API WORKER2 (Scheduler) ============
export function apiSchedule(payload) { return postJson(`${WORKER2_BASE}/schedule`,  payload); }
export function apiPause(payload)    { return postJson(`${WORKER2_BASE}/pause`,     payload); }
export function apiResume(payload)   { return postJson(`${WORKER2_BASE}/resume`,    payload); }
export function apiTestSend(payload) { return postJson(`${WORKER2_BASE}/testsend`,  payload); }

// ⬇️ NUEVO: marca L='SI' en HUB.Scheduler (lo hace el backend; no expone tu API key)
export function apiMarkFirstProgrammed(email) {
  return postJson(`${WORKER2_BASE}/mark_first_programmed`, { email });
}

// ============ CONTEXTO (preferencia: dashboardv3.js) ============
export async function apiGetContext(email) {
  const pick = (...vals) => {
    for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    return '';
  };
  const sheetIdFromUrl = (url) => {
    if (!url) return '';
    const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return m ? m[1] : '';
  };
  const findSheetIdDeep = (obj) => {
    const re = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    let found = '';
    (function walk(x){
      if (!x || found) return;
      if (typeof x === 'string') {
        const m = x.match(re);
        if (m) found = m[1];
      } else if (typeof x === 'object') {
        for (const k in x) walk(x[k]);
      }
    })(obj);
    return found;
  };
  const onlyHour = (h) => {
    if (h == null) return null;
    const m = String(h).match(/^\s*(\d{1,2})/);
    if (!m) return null;
    return Math.max(0, Math.min(23, parseInt(m[1],10)));
  };

  if (window.GJ_CTX?.userSheetId) return window.GJ_CTX;

  const raw = localStorage.getItem('gj_ctx');
  if (raw) {
    try {
      const ctx = JSON.parse(raw);
      if (ctx?.userSheetId) return ctx;
    } catch {}
  }

  if (WORKER1_FALLBACK) {
    const w1 = await getJson(`${WORKER1_FALLBACK}?email=${encodeURIComponent(email)}`);

    const sheetUrl = pick(
      w1.sheetUrl, w1.sheet_url, w1.sheet,
      w1.links?.sheet, w1.links?.sheet_url, w1.links?.sheetUrl,
      w1.dashboard_sheet_url, w1.links?.dashboard_sheet_url,
      w1.user_sheet_url, w1.links?.user_sheet_url
    );

    const userSheetId = pick(
      w1.user_sheet_id, w1.userSheetId, w1.sheetId, w1.sheet_id,
      sheetIdFromUrl(sheetUrl),
      findSheetIdDeep(w1)
    );

    const s = w1.scheduler || {};
    return {
      email,
      userSheetId,
      linkPublico: pick(w1.daily_form_url, w1.links?.daily_form, w1.links?.daily_form_url, ''),
      scheduler: {
        canal:      s.canal      ?? 'email',
        frecuencia: s.frecuencia ?? 'DAILY',
        dias:       s.dias       ?? '',
        hora:       (onlyHour(s.hora) ?? 8),
        timezone:   s.timezone   ?? 'Europe/Madrid',
        estado:     s.estado     ?? 'ACTIVO'
      }
    };
  }

  throw new Error('No hay contexto disponible (falta userSheetId).');
}

/** Guarda el contexto por si se refresca la SPA */
export function saveCtx(ctx) {
  try { localStorage.setItem('gj_ctx', JSON.stringify(ctx || {})); } catch {}
  if (ctx?.email)       localStorage.setItem('gj_email', ctx.email);
  if (ctx?.userSheetId) localStorage.setItem('gj_sheetId', ctx.userSheetId);
}


















// // js/scheduler-api.js

// // === CONFIGURACIÓN ===
// // Worker2 (Scheduler)
// const WORKER2_BASE = 'https://gamificationscheduler.rfullivarri22.workers.dev';

// // Fallback a Worker1 para traer el contexto del usuario (bundle)
// const WORKER1_FALLBACK = 'https://gamificationworker.rfullivarri22.workers.dev/bundle';

// // ============ HELPERS HTTP ============
// async function getJson(url) {
//   // SIN credenciales para evitar CORS con ACAO: *
//   const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
//   if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
//   return r.json();
// }
// async function postJson(url, body) {
//   console.log('[SCHED] POST →', url, body);
//   // Tampoco enviamos credenciales aquí; Workers responden ACAO: *
//   const r = await fetch(url, {
//     method: 'POST',
//     mode: 'cors',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(body)
//   });
//   const text = await r.text();
//   let json;
//   try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
//   if (!r.ok) throw new Error(`POST ${url} -> ${r.status} | ${text}`);
//   return json;
// }

// // ============ API WORKER2 (Scheduler) ============
// export function apiSchedule(payload) { return postJson(`${WORKER2_BASE}/schedule`,  payload); }
// export function apiPause(payload)    { return postJson(`${WORKER2_BASE}/pause`,     payload); }
// export function apiResume(payload)   { return postJson(`${WORKER2_BASE}/resume`,    payload); }
// export function apiTestSend(payload) { return postJson(`${WORKER2_BASE}/testsend`,  payload); }

// // ============ CONTEXTO (preferencia: dashboardv3.js) ============
// export async function apiGetContext(email) {
//   const pick = (...vals) => {
//     for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v;
//     return '';
//   };
//   const sheetIdFromUrl = (url) => {
//     if (!url) return '';
//     const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
//     return m ? m[1] : '';
//   };
//   const findSheetIdDeep = (obj) => {
//     // busca una URL de Google Sheets en cualquier string del objeto
//     const re = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
//     let found = '';
//     (function walk(x){
//       if (!x || found) return;
//       if (typeof x === 'string') {
//         const m = x.match(re);
//         if (m) found = m[1];
//       } else if (typeof x === 'object') {
//         for (const k in x) walk(x[k]);
//       }
//     })(obj);
//     return found;
//   };
//   const onlyHour = (h) => {
//     if (h == null) return null;
//     const m = String(h).match(/^\s*(\d{1,2})/);
//     if (!m) return null;
//     return Math.max(0, Math.min(23, parseInt(m[1],10)));
//   };

//   // 1) si el dashboard ya dejó todo listo y con sheetId, usamos eso
//   if (window.GJ_CTX?.userSheetId) return window.GJ_CTX;

//   // 2) cache local
//   const raw = localStorage.getItem('gj_ctx');
//   if (raw) {
//     try {
//       const ctx = JSON.parse(raw);
//       if (ctx?.userSheetId) return ctx;
//     } catch {}
//   }

//   // 3) fallback al Worker1 /bundle si lo configuraste
//   if (WORKER1_FALLBACK) {
//     const w1 = await getJson(`${WORKER1_FALLBACK}?email=${encodeURIComponent(email)}`);

//     const sheetUrl = pick(
//       w1.sheetUrl, w1.sheet_url, w1.sheet,
//       w1.links?.sheet, w1.links?.sheet_url, w1.links?.sheetUrl,
//       w1.dashboard_sheet_url, w1.links?.dashboard_sheet_url,
//       w1.user_sheet_url, w1.links?.user_sheet_url
//     );

//     const userSheetId = pick(
//       w1.user_sheet_id, w1.userSheetId, w1.sheetId, w1.sheet_id,
//       sheetIdFromUrl(sheetUrl),
//       findSheetIdDeep(w1) // ← último recurso: escaneo profundo
//     );

//     const s = w1.scheduler || {};
//     return {
//       email,
//       userSheetId,
//       linkPublico: pick(w1.daily_form_url, w1.links?.daily_form, w1.links?.daily_form_url, ''),
//       scheduler: {
//         canal:      s.canal      ?? 'email',
//         frecuencia: s.frecuencia ?? 'DAILY',
//         dias:       s.dias       ?? '',
//         hora:       (onlyHour(s.hora) ?? 8),
//         timezone:   s.timezone   ?? 'Europe/Madrid',
//         estado:     s.estado     ?? 'ACTIVO'
//       }
//     };
//   }

//   throw new Error('No hay contexto disponible (falta userSheetId).');
// }

// /** Guarda el contexto por si se refresca la SPA */
// export function saveCtx(ctx) {
//   try { localStorage.setItem('gj_ctx', JSON.stringify(ctx || {})); } catch {}
//   if (ctx?.email)       localStorage.setItem('gj_email', ctx.email);
//   if (ctx?.userSheetId) localStorage.setItem('gj_sheetId', ctx.userSheetId);
// }







// // js/scheduler-api.js

// // === CONFIGURACIÓN ===
// // Worker2 (Scheduler)
// const WORKER2_BASE = 'https://gamificationscheduler.rfullivarri22.workers.dev';

// // Fallback a Worker1 para traer el contexto del usuario (bundle)
// const WORKER1_FALLBACK = 'https://gamificationworker.rfullivarri22.workers.dev/bundle';

// // ============ HELPERS HTTP ============
// async function getJson(url) {
//   // SIN credenciales para evitar CORS con ACAO: *
//   const r = await fetch(url, { mode: 'cors', cache: 'no-store' });
//   if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
//   return r.json();
// }
// async function postJson(url, body) {
//   console.log('[SCHED] POST →', url, body);
//   // Tampoco enviamos credenciales aquí; Workers responden ACAO: *
//   const r = await fetch(url, {
//     method: 'POST',
//     mode: 'cors',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(body)
//   });
//   const text = await r.text();
//   let json;
//   try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
//   if (!r.ok) throw new Error(`POST ${url} -> ${r.status} | ${text}`);
//   return json;
// }

// // ============ API WORKER2 (Scheduler) ============
// export function apiSchedule(payload) { return postJson(`${WORKER2_BASE}/schedule`,  payload); }
// export function apiPause(payload)    { return postJson(`${WORKER2_BASE}/pause`,     payload); }
// export function apiResume(payload)   { return postJson(`${WORKER2_BASE}/resume`,    payload); }
// export function apiTestSend(payload) { return postJson(`${WORKER2_BASE}/testsend`,  payload); }

// // ============ CONTEXTO (preferencia: dashboardv3.js) ============
// export async function apiGetContext(email) {
//   const pick = (...vals) => {
//     for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v;
//     return '';
//   };
//   const sheetIdFromUrl = (url) => {
//     if (!url) return '';
//     const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
//     return m ? m[1] : '';
//   };
//   const findSheetIdDeep = (obj) => {
//     // busca una URL de Google Sheets en cualquier string del objeto
//     const re = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
//     let found = '';
//     (function walk(x){
//       if (!x || found) return;
//       if (typeof x === 'string') {
//         const m = x.match(re);
//         if (m) found = m[1];
//       } else if (typeof x === 'object') {
//         for (const k in x) walk(x[k]);
//       }
//     })(obj);
//     return found;
//   };
//   const onlyHour = (h) => {
//     if (h == null) return null;
//     const m = String(h).match(/^\s*(\d{1,2})/);
//     if (!m) return null;
//     return Math.max(0, Math.min(23, parseInt(m[1],10)));
//   };

//   // 1) si el dashboard ya dejó todo listo y con sheetId, usamos eso
//   if (window.GJ_CTX?.userSheetId) return window.GJ_CTX;

//   // 2) cache local
//   const raw = localStorage.getItem('gj_ctx');
//   if (raw) {
//     try {
//       const ctx = JSON.parse(raw);
//       if (ctx?.userSheetId) return ctx;
//     } catch {}
//   }

//   // 3) fallback al Worker1 /bundle si lo configuraste
//   if (WORKER1_FALLBACK) {
//     const w1 = await getJson(`${WORKER1_FALLBACK}?email=${encodeURIComponent(email)}`);

//     const sheetUrl = pick(
//       w1.sheetUrl, w1.sheet_url, w1.sheet,
//       w1.links?.sheet, w1.links?.sheet_url, w1.links?.sheetUrl,
//       w1.dashboard_sheet_url, w1.links?.dashboard_sheet_url,
//       w1.user_sheet_url, w1.links?.user_sheet_url
//     );

//     const userSheetId = pick(
//       w1.user_sheet_id, w1.userSheetId, w1.sheetId, w1.sheet_id,
//       sheetIdFromUrl(sheetUrl),
//       findSheetIdDeep(w1) // ← último recurso: escaneo profundo
//     );

//     const s = w1.scheduler || {};
//     return {
//       email,
//       userSheetId,
//       linkPublico: pick(w1.daily_form_url, w1.links?.daily_form, w1.links?.daily_form_url, ''),
//       scheduler: {
//         canal:      s.canal      ?? 'email',
//         frecuencia: s.frecuencia ?? 'DAILY',
//         dias:       s.dias       ?? '',
//         hora:       (onlyHour(s.hora) ?? 8),
//         timezone:   s.timezone   ?? 'Europe/Madrid',
//         estado:     s.estado     ?? 'ACTIVO'
//       }
//     };
//   }

//   throw new Error('No hay contexto disponible (falta userSheetId).');
// }

// /** Guarda el contexto por si se refresca la SPA */
// export function saveCtx(ctx) {
//   try { localStorage.setItem('gj_ctx', JSON.stringify(ctx || {})); } catch {}
//   if (ctx?.email)       localStorage.setItem('gj_email', ctx.email);
//   if (ctx?.userSheetId) localStorage.setItem('gj_sheetId', ctx.userSheetId);
// }
