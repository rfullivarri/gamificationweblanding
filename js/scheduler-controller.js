// js/scheduler-controller.js

import './scheduler-modal.js?v=3';
import {
  apiSchedule, apiPause, apiResume, apiTestSend,
  apiGetContext, saveCtx
} from './scheduler-api.js?v=3';

// --- POLYFILL UI (scheduler)
const setDot      = (window.setDot      || function(){});
const setDotSafe  = (el,on,color) => { try { setDot(el,on,color); } catch(_) {} };
const hideSched   = () => { const w = document.getElementById('scheduler-warning'); if (w) w.style.display = 'none'; };
const showSched   = () => { const w = document.getElementById('scheduler-warning'); if (w) w.style.display = 'block'; };

// —— helpers ——
function getEmail() {
  const url = new URL(location.href);
  return (url.searchParams.get('email') || localStorage.getItem('gj_email') || '')
    .trim().toLowerCase();
}
async function ensureCtx() {
  const email = getEmail();
  const ctx = await apiGetContext(email);   // usa window.GJ_CTX cuando está
  saveCtx(ctx);
  return ctx;
}
// Normaliza a número 0..23 (acepta "3", "03", "03:00")
function onlyHour(v) {
  if (v == null) return null;
  const m = String(v).trim().match(/^(\d{1,2})(?::\d{1,2})?$/);
  if (!m) return null;
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  return h;
}
// (queda por compat aunque no lo usemos abajo)
function buildPayload(ctx, v) {
  const h = onlyHour(v.hora);
  return {
    email: ctx.email,
    userSheetId: ctx.userSheetId,
    sheetId: ctx.userSheetId,
    canal: v.canal,
    frecuencia: v.frecuencia,
    dias: v.dias || '',
    hora: (h == null ? 8 : h),
    timezone: v.timezone || 'Europe/Madrid',
    estado: v.estado,
    linkPublico: v.linkPublico || ctx.linkPublico || ''
  };
}
// function wireMenuButton(modal) {
//   // Enlaza menú, banner y (por compat) el viejo edit-form
//   const triggers = [
//     document.getElementById('open-scheduler'),
//     document.getElementById('btn-programar-dq'),
//     document.getElementById('edit-form')
//   ].filter(Boolean);

//   if (!triggers.length) return;

//   triggers.forEach(btn => {
//     btn.addEventListener('click', (e) => {
//       e.preventDefault();   // evita navegar a '#'
//       modal.open();         // abre el popup
//     });
//   });
// }

function wireMenuButton(modal) {
  // Engancha cualquiera de estos ids si existen
  const candidates = [
    document.getElementById('open-scheduler'),
    document.getElementById('btn-programar-dq'),
    document.getElementById('edit-form')
  ].filter(Boolean);

  candidates.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal.open();
    });
  });

  // Extra: delegación segura por si en el futuro usamos data-open-scheduler
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-open-scheduler]');
    if (!el) return;
    e.preventDefault();
    modal.open();
  });
}

// function wireMenuButton(modal) {
//   const btn =
//     document.getElementById('open-scheduler') ||
//     document.getElementById('edit-form');
//   if (!btn) return;
//   btn.addEventListener('click', (e) => {
//     e.preventDefault();
//     modal.open();
//   });
// }

// —— núcleo ——
export function attachSchedulerModal() {
  // inyectar modal si no existe
  let modal = document.querySelector('scheduler-modal');
  if (!modal) {
    modal = document.createElement('scheduler-modal');
    document.body.appendChild(modal);
  }

  // al abrir → prefill
  modal.addEventListener('open', async () => {
    modal.setNotice('⏳ Cargando tu configuración...');
    try {
      const ctx = await ensureCtx();
      const s = ctx.scheduler || {};
      const h = onlyHour(s.hora);
      modal.setValue({
        canal:      s.canal || 'email',
        frecuencia: s.frecuencia || 'DAILY',
        dias:       s.dias || '',
        hora:       (h != null ? h : 8),
        timezone:   s.timezone || 'Europe/Madrid',
        estado:     s.estado || 'ACTIVO',
        linkPublico: ctx.linkPublico || ''
      });
      const hhTxt = (h != null ? h : 8);
      const txt = (s.frecuencia === 'CUSTOM' && s.dias)
        ? `Se enviará ${s.dias} a las ${hhTxt}.`
        : `Se enviará todos los días a las ${hhTxt}.`;
      modal.setNotice(`Contexto cargado. ${txt}`);
    } catch (e) {
      console.error(e);
      modal.setNotice('⚠️ No pude cargar tu contexto. Probá más tarde.');
    }
  });

  // helper para extraer SheetId desde una URL
  function extractSheetIdFromUrl(url) {
    if (!url) return '';
    const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return m ? m[1] : '';
  }
  
  // Guardar programación
  modal.addEventListener('schedule:save', async (ev) => {
    modal.setAttribute('data-busy', '1');
    try {
      let ctx = await ensureCtx();

      // reconstruir sheetId si falta
      let sheetId =
        ctx.userSheetId ||
        extractSheetIdFromUrl(ctx.linkPublico) ||
        '';

      if (!sheetId) {
        try { localStorage.removeItem('gj_ctx'); } catch {}
        ctx = await ensureCtx();
        sheetId =
          ctx.userSheetId ||
          extractSheetIdFromUrl(ctx.linkPublico) ||
          '';
      }

      if (!sheetId) {
        console.error('[SCHED] No tengo sheetId. ctx=', ctx);
        modal.setNotice('❌ No pude obtener tu Sheet ID. Refrescá la página e intentá de nuevo.');
        return;
      }

      const v = ev.detail || {};
      const hh = onlyHour(v.hora);
      const payload = {
        email: ctx.email,
        userSheetId: sheetId,
        sheetId,
        canal: v.canal,
        frecuencia: v.frecuencia,
        dias: v.dias || '',
        hora: String(hh != null ? hh : 8), // el backend normaliza a HH
        timezone: v.timezone || 'Europe/Madrid',
        estado: v.estado
      };

      console.log('[SCHED → /schedule] payload =', payload);
      const resp = await apiSchedule(payload);
      console.log('[SCHED ← /schedule] response =', resp);

      if (resp?.status === 'ERROR') {
        modal.setNotice(`❌ Error al guardar: ${resp.message || 'desconocido'}`);
        return;
      }

      // === UI / estado local optimista (usar lo que acabamos de guardar) ===
      const saved = {
        canal: payload.canal,
        frecuencia: payload.frecuencia,
        dias: payload.dias,
        hora: (hh != null ? hh : 8),
        timezone: payload.timezone,
        estado: payload.estado,
        firstProgrammed: 'SI',
        linkPublico: ctx.linkPublico || ''
      };
      
      // Actualizar GJ_CTX en memoria
      window.GJ_CTX = window.GJ_CTX || {};
      window.GJ_CTX.scheduler = { ...(window.GJ_CTX.scheduler || {}), ...saved };
      
      // Repintar el modal inmediatamente
      modal.setValue({
        canal: saved.canal,
        frecuencia: saved.frecuencia,
        dias: saved.dias,
        hora: saved.hora,
        timezone: saved.timezone,
        estado: saved.estado,
        linkPublico: saved.linkPublico
      });
      
      const txt2 = (saved.frecuencia === 'CUSTOM' && saved.dias)
        ? `Se enviará ${saved.dias} a las ${saved.hora || 8}.`
        : `Se enviará todos los días a las ${saved.hora || 8}.`;
      modal.setNotice(`✅ Guardado y actualizado. ${txt2}`);
      
      // “picar” al auto-refresh para traer el bundle nuevo más rápido
      try { window.GJ_AUTO?.poke?.(); } catch {}
      
      // Sincronía con backend y flags optimistas (oculta el warning del dashboard)
      try {
        if (window.refreshBundle) {
          await window.refreshBundle(ctx.email, {
            mode: 'soft',
            optimistic: { firstprog_ok: 1 },
            expect: { L: 'SI' },
            retries: [1500, 4000, 8000],
            ttlPending: 10 * 60 * 1000
          });
        }
      } catch (e) {
        console.warn('[SCHED] refreshBundle (soft) falló, no bloqueante:', e);
      }

      // UX optimista inmediata en el dashboard
      hideSched();
      setDotSafe(document.getElementById('menu-toggle'), false);
      setDotSafe(document.getElementById('open-scheduler'), false);
      try {
        const configuredKey = `gj_sched_configured:${(ctx.email||'').toLowerCase()}`;
        localStorage.setItem(configuredKey, '1');
      } catch {}

      // Importante: NO re-leemos ctx aquí para no pisar el optimista.
      // El auto-refresh + refreshBundle soft re-pintarán cuando llegue el bundle nuevo.

    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error guardando programación');
    } finally {
      modal.removeAttribute('data-busy');
    }
  });

  modal.addEventListener('schedule:pause', async () => {
    modal.setAttribute('data-busy', '1');
    try {
      const ctx = await ensureCtx();
      await apiPause({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('⏸️ Programación en pausa.');
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error al pausar');
    } finally {
      modal.removeAttribute('data-busy');
    }
  });

  modal.addEventListener('schedule:resume', async () => {
    modal.setAttribute('data-busy', '1');
    try {
      const ctx = await ensureCtx();
      await apiResume({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('▶️ Programación activada.');
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error al reanudar');
    } finally {
      modal.removeAttribute('data-busy');
    }
  });

  modal.addEventListener('schedule:test', async () => {
    modal.setAttribute('data-busy', '1');
    try {
      const ctx = await ensureCtx();
      await apiTestSend({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('✉️ Envío de prueba solicitado.');
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error en el envío de prueba');
    } finally {
      modal.removeAttribute('data-busy');
    }
  });

  // botón del menú 🍔
  wireMenuButton(modal);

  // API global por si querés abrir manualmente con prefill
  window.openSchedulerModal = (prefill = {}) => {
    if (prefill && typeof modal.setValue === 'function') modal.setValue(prefill);
    modal.open();
  };
}

// —— init robusto
(function safeInit() {
  const start = () => {
    try { attachSchedulerModal(); } catch (e) {
      console.error('Scheduler init error:', e);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();

















// // js/scheduler-controller.js

// import './scheduler-modal.js?v=3';
// import {
//   apiSchedule, apiPause, apiResume, apiTestSend,
//   apiGetContext, saveCtx
// } from './scheduler-api.js?v=3';

// // --- POLYFILL UI (scheduler)
// const setDot      = (window.setDot      || function(){});
// const setDotSafe  = (el,on,color) => { try { setDot(el,on,color); } catch(_) {} };
// const hideSched   = () => { const w = document.getElementById('scheduler-warning'); if (w) w.style.display = 'none'; };
// const showSched   = () => { const w = document.getElementById('scheduler-warning'); if (w) w.style.display = 'block'; };

// // —— helpers ——
// function getEmail() {
//   const url = new URL(location.href);
//   return (url.searchParams.get('email') || localStorage.getItem('gj_email') || '')
//     .trim().toLowerCase();
// }
// async function ensureCtx() {
//   const email = getEmail();
//   const ctx = await apiGetContext(email);   // usa window.GJ_CTX cuando está
//   saveCtx(ctx);
//   return ctx;
// }
// // (queda por compat aunque no lo usemos abajo)
// function buildPayload(ctx, v) {
//   const horaNum = Number(v.hora);
//   return {
//     email: ctx.email,
//     userSheetId: ctx.userSheetId,
//     sheetId: ctx.userSheetId,
//     canal: v.canal,
//     frecuencia: v.frecuencia,
//     dias: v.dias || '',
//     hora: isNaN(horaNum) ? 8 : horaNum,
//     timezone: v.timezone || 'Europe/Madrid',
//     estado: v.estado,
//     linkPublico: v.linkPublico || ctx.linkPublico || ''
//   };
// }
// function wireMenuButton(modal) {
//   const btn =
//     document.getElementById('open-scheduler') ||
//     document.getElementById('edit-form');
//   if (!btn) return;
//   btn.addEventListener('click', (e) => {
//     e.preventDefault();
//     modal.open();
//   });
// }

// // —— núcleo ——
// export function attachSchedulerModal() {
//   // inyectar modal si no existe
//   let modal = document.querySelector('scheduler-modal');
//   if (!modal) {
//     modal = document.createElement('scheduler-modal');
//     document.body.appendChild(modal);
//   }

//   // al abrir → prefill
//   modal.addEventListener('open', async () => {
//     modal.setNotice('⏳ Cargando tu configuración...');
//     try {
//       const ctx = await ensureCtx();
//       const s = ctx.scheduler || {};
//       modal.setValue({
//         canal:      s.canal || 'email',
//         frecuencia: s.frecuencia || 'DAILY',
//         dias:       s.dias || '',
//         hora:       (s.hora != null ? Number(s.hora) : 8),
//         timezone:   s.timezone || 'Europe/Madrid',
//         estado:     s.estado || 'ACTIVO',
//         linkPublico: ctx.linkPublico || ''
//       });
//       const txt = (s.frecuencia === 'CUSTOM' && s.dias)
//         ? `Se enviará ${s.dias} a las ${s.hora || 8}.`
//         : `Se enviará todos los días a las ${s.hora || 8}.`;
//       modal.setNotice(`Contexto cargado. ${txt}`);
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('⚠️ No pude cargar tu contexto. Probá más tarde.');
//     }
//   });

//   // helper para extraer SheetId desde una URL
//   function extractSheetIdFromUrl(url) {
//     if (!url) return '';
//     const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
//     return m ? m[1] : '';
//   }
  
//   // Guardar programación
//   modal.addEventListener('schedule:save', async (ev) => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       let ctx = await ensureCtx();

//       // reconstruir sheetId si falta
//       let sheetId =
//         ctx.userSheetId ||
//         extractSheetIdFromUrl(ctx.linkPublico) ||
//         '';

//       if (!sheetId) {
//         try { localStorage.removeItem('gj_ctx'); } catch {}
//         ctx = await ensureCtx();
//         sheetId =
//           ctx.userSheetId ||
//           extractSheetIdFromUrl(ctx.linkPublico) ||
//           '';
//       }

//       if (!sheetId) {
//         console.error('[SCHED] No tengo sheetId. ctx=', ctx);
//         modal.setNotice('❌ No pude obtener tu Sheet ID. Refrescá la página e intentá de nuevo.');
//         return;
//       }

//       const v = ev.detail || {};
//       const payload = {
//         email: ctx.email,
//         userSheetId: sheetId,
//         sheetId,
//         canal: v.canal,
//         frecuencia: v.frecuencia,
//         dias: v.dias || '',
//         hora: String(v.hora),              // el backend normaliza a HH
//         timezone: v.timezone || 'Europe/Madrid',
//         estado: v.estado
//       };

//       console.log('[SCHED → /schedule] payload =', payload);
//       const resp = await apiSchedule(payload);
//       console.log('[SCHED ← /schedule] response =', resp);
//       // === UI / estado local optimista (usar lo que acabamos de guardar) ===
//       const saved = {
//         canal: payload.canal,
//         frecuencia: payload.frecuencia,
//         dias: payload.dias,
//         hora: Number(v.hora),
//         timezone: payload.timezone,
//         estado: payload.estado,
//         firstProgrammed: 'SI',
//         linkPublico: ctx.linkPublico || ''
//       };
      
//       // Actualizar GJ_CTX en memoria
//       window.GJ_CTX = window.GJ_CTX || {};
//       window.GJ_CTX.scheduler = { ...(window.GJ_CTX.scheduler || {}), ...saved };
      
//       // Repintar el modal inmediatamente
//       modal.setValue({
//         canal: saved.canal,
//         frecuencia: saved.frecuencia,
//         dias: saved.dias,
//         hora: saved.hora,
//         timezone: saved.timezone,
//         estado: saved.estado,
//         linkPublico: saved.linkPublico
//       });
      
//       const txt2 = (saved.frecuencia === 'CUSTOM' && saved.dias)
//         ? `Se enviará ${saved.dias} a las ${saved.hora || 8}.`
//         : `Se enviará todos los días a las ${saved.hora || 8}.`;
//       modal.setNotice(`✅ Guardado y actualizado. ${txt2}`);
      
//       // Opcional: “picar” al auto-refresh para traer el bundle nuevo más rápido
//       try { window.GJ_AUTO?.poke?.(); } catch {}
      
//       // Sincronía con backend y flags optimistas (oculta el warning del dashboard)
//       try {
//         if (window.refreshBundle) {
//           await window.refreshBundle(ctx.email, {
//             mode: 'soft',
//             optimistic: { firstprog_ok: 1 },
//             expect: { L: 'SI' },              // confirmar que L quedó en SI
//             retries: [1500, 4000, 8000]
//           });
//         }
//       } catch (e) {
//         console.warn('[SCHED] refreshBundle (soft) falló, no bloqueante:', e);
//       }

//       if (resp?.status === 'ERROR') {
//         modal.setNotice(`❌ Error al guardar: ${resp.message || 'desconocido'}`);
//         return;
//       }

//       // si L estaba vacío en el contexto → marcar primera programación (idempotente server)
//       const firstProg = String(ctx?.scheduler?.firstProgrammed || '').trim().toUpperCase();

//       // UX optimista inmediata
//       hideSched();
//       setDotSafe(document.getElementById('menu-toggle'), false);
//       setDotSafe(document.getElementById('open-scheduler'), false);
//       try {
//         const configuredKey = `gj_sched_configured:${(ctx.email||'').toLowerCase()}`;
//         localStorage.setItem(configuredKey, '1');
//       } catch {}

//       // acelerar polling si está activo
//       try { window.gauto?.poke?.(); } catch {}

//       // pedir refresh suave y consistente
//       try {
//         if (window.refreshBundle) {
//           await window.refreshBundle(ctx.email, {
//             mode: 'soft',
//             optimistic: { firstprog_ok: 1 },
//             expect: { L: 'SI' },
//             ttlPending: 10 * 60 * 1000
//           });
//         }
//       } catch (e) {
//         console.warn('[SCHED] refreshBundle (soft) falló (no bloqueante):', e);
//       }

//       // re-cargar contexto y re-pintar modal (opcional)
//       try {
//         try { localStorage.removeItem('gj_ctx'); } catch {}
//         const ctx2 = await ensureCtx();
//         const s2 = ctx2.scheduler || {};
//         modal.setValue({
//           canal:      s2.canal || 'email',
//           frecuencia: s2.frecuencia || 'DAILY',
//           dias:       s2.dias || '',
//           hora:       (s2.hora != null ? Number(s2.hora) : 8),
//           timezone:   s2.timezone || 'Europe/Madrid',
//           estado:     s2.estado || 'ACTIVO',
//           linkPublico: ctx2.linkPublico || ''
//         });
//         const txt2 = (s2.frecuencia === 'CUSTOM' && s2.dias)
//           ? `Se enviará ${s2.dias} a las ${s2.hora || 8}.`
//           : `Se enviará todos los días a las ${s2.hora || 8}.`;
//         modal.setNotice(`✅ Guardado y actualizado. ${txt2}`);
//       } catch {}

//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error guardando programación');
//     } finally {
//       modal.removeAttribute('data-busy');
//     }
//   });

//   modal.addEventListener('schedule:pause', async () => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       const ctx = await ensureCtx();
//       await apiPause({ email: ctx.email, userSheetId: ctx.userSheetId });
//       modal.setNotice('⏸️ Programación en pausa.');
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error al pausar');
//     } finally {
//       modal.removeAttribute('data-busy');
//     }
//   });

//   modal.addEventListener('schedule:resume', async () => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       const ctx = await ensureCtx();
//       await apiResume({ email: ctx.email, userSheetId: ctx.userSheetId });
//       modal.setNotice('▶️ Programación activada.');
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error al reanudar');
//     } finally {
//       modal.removeAttribute('data-busy');
//     }
//   });

//   modal.addEventListener('schedule:test', async () => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       const ctx = await ensureCtx();
//       await apiTestSend({ email: ctx.email, userSheetId: ctx.userSheetId });
//       modal.setNotice('✉️ Envío de prueba solicitado.');
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error en el envío de prueba');
//     } finally {
//       modal.removeAttribute('data-busy');
//     }
//   });

//   // botón del menú 🍔
//   wireMenuButton(modal);

//   // API global por si querés abrir manualmente con prefill
//   window.openSchedulerModal = (prefill = {}) => {
//     if (prefill && typeof modal.setValue === 'function') modal.setValue(prefill);
//     modal.open();
//   };
// }

// // —— init robusto
// (function safeInit() {
//   const start = () => {
//     try { attachSchedulerModal(); } catch (e) {
//       console.error('Scheduler init error:', e);
//     }
//   };
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', start, { once: true });
//   } else {
//     start();
//   }
// })();








// // js/scheduler-controller.js


// import './scheduler-modal.js?v=3';
// import {
//   apiSchedule, apiPause, apiResume, apiTestSend,
//   apiGetContext, saveCtx
// } from './scheduler-api.js?v=3';

// // --- POLYFILL UI (scheduler): evita ReferenceError si no está definido en el dashboard ---
// const setDot      = (window.setDot      || function(){});
// const setDotSafe  = (el,on,color) => { try { setDot(el,on,color); } catch(_) {} };
// const hideSched   = () => { const w = document.getElementById('scheduler-warning'); if (w) w.style.display = 'none'; };
// const showSched   = () => { const w = document.getElementById('scheduler-warning'); if (w) w.style.display = 'block'; };

// // —— helpers ——
// function getEmail() {
//   const url = new URL(location.href);
//   return (url.searchParams.get('email') || localStorage.getItem('gj_email') || '')
//     .trim().toLowerCase();
// }
// async function ensureCtx() {
//   const email = getEmail();
//   const ctx = await apiGetContext(email);   // usa window.GJ_CTX cuando está
//   saveCtx(ctx);
//   return ctx;
// }
// // --- construye el payload que va al Worker2
// function buildPayload(ctx, v) {
//   const horaNum = Number(v.hora); // asegurar número
//   return {
//     email: ctx.email,
//     userSheetId: ctx.userSheetId,     // nombre 1
//     sheetId: ctx.userSheetId,         // nombre 2 (por compatibilidad)
//     canal: v.canal,
//     frecuencia: v.frecuencia,
//     dias: v.dias || '',
//     hora: isNaN(horaNum) ? 8 : horaNum,      // SOLO HH como número
//     timezone: v.timezone || 'Europe/Madrid',
//     estado: v.estado,
//     linkPublico: v.linkPublico || ctx.linkPublico || ''
//   };
// }
// function wireMenuButton(modal) {
//   const btn =
//     document.getElementById('open-scheduler') ||
//     document.getElementById('edit-form');
//   if (!btn) return;
//   btn.addEventListener('click', (e) => {
//     e.preventDefault();
//     modal.open(); // El prefill ocurre en el evento 'open'
//   });
// }

// // —— núcleo ——
// export function attachSchedulerModal() {
//   // inyectar modal si no existe
//   let modal = document.querySelector('scheduler-modal');
//   if (!modal) {
//     modal = document.createElement('scheduler-modal');
//     document.body.appendChild(modal);
//   }

//   // al abrir → prefill desde contexto
//   modal.addEventListener('open', async () => {
//     modal.setNotice('⏳ Cargando tu configuración...');
//     try {
//       const ctx = await ensureCtx();
//       const s = ctx.scheduler || {};
//       modal.setValue({
//         canal:      s.canal || 'email',
//         frecuencia: s.frecuencia || 'DAILY',
//         dias:       s.dias || '',
//         hora:       (s.hora != null ? Number(s.hora) : 8),
//         timezone:   s.timezone || 'Europe/Madrid',
//         estado:     s.estado || 'ACTIVO',
//         linkPublico: ctx.linkPublico || ''
//       });
//       const txt = (s.frecuencia === 'CUSTOM' && s.dias)
//         ? `Se enviará ${s.dias} a las ${s.hora || 8}.`
//         : `Se enviará todos los días a las ${s.hora || 8}.`;
//       modal.setNotice(`Contexto cargado. ${txt}`);
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('⚠️ No pude cargar tu contexto. Probá más tarde.');
//     }
//   });

//   // acciones
//   // --- handler de Guardar ---
//   // helper para extraer el ID desde una URL de Sheets
//   function extractSheetIdFromUrl(url) {
//     if (!url) return '';
//     const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
//     return m ? m[1] : '';
//   }
  
//   modal.addEventListener('schedule:save', async (ev) => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       // 1) Traer contexto “fresco”
//       let ctx = await ensureCtx();
  
//       // 2) Si el ID no está, intentar reconstruirlo
//       let sheetId =
//         ctx.userSheetId ||
//         extractSheetIdFromUrl(ctx.linkPublico) ||
//         '';
  
//       // 3) Si sigue vacío, forzar fallback (limpio cache y pido al Worker1)
//       if (!sheetId) {
//         try { localStorage.removeItem('gj_ctx'); } catch {}
//         ctx = await ensureCtx(); // esto ahora irá al fallback si lo configuraste
//         sheetId =
//           ctx.userSheetId ||
//           extractSheetIdFromUrl(ctx.linkPublico) ||
//           '';
//       }
  
//       // 4) Validación final
//       if (!sheetId) {
//         console.error('[SCHED] No tengo sheetId. ctx=', ctx);
//         modal.setNotice('❌ No pude obtener tu Sheet ID. Refrescá la página e intentá de nuevo.');
//         return;
//       }
  
//       // 5) Armar payload (mandamos ambos por compatibilidad)
//       const v = ev.detail || {};
//       const payload = {
//         email: ctx.email,
//         userSheetId: sheetId,
//         sheetId,                            // ← por si tu Worker2 lo espera así
//         canal: v.canal,
//         frecuencia: v.frecuencia,
//         dias: v.dias || '',
//         hora: String(v.hora),               // solo “HH”
//         timezone: v.timezone || 'Europe/Madrid',
//         estado: v.estado
//         //linkPublico: v.linkPublico || ctx.linkPublico || ''
//       };
  
//       console.log('[SCHED → /schedule] payload =', payload);
  
//       // 6) Guardar
//       const resp = await apiSchedule(payload);
//       // marcar en HUB la primera programación
//       try {
//         await apiMarkFirstProgrammed(ctx.email);
//       } catch (e) {
//         console.warn('[SCHED] mark_first_programmed falló (no bloqueante):', e);
//       }
//       console.log('[SCHED ← /schedule] response =', resp);
  
//       if (resp?.status === 'ERROR') {
//         modal.setNotice(`❌ Error al guardar: ${resp.message || 'desconocido'}`);
//         return;
//       }
//       // marcar que YA programó al menos una vez (no mostrar más el banner)
//       try {
//         const configuredKey = `gj_sched_configured:${(ctx.email||'').toLowerCase()}`;
//         localStorage.setItem(configuredKey, '1');
//       } catch {}
  
//       modal.setNotice(`✅ Programación guardada. Se enviará ${v.frecuencia==='CUSTOM' && v.dias ? `${v.dias} a las ${v.hora}` : `todos los días a las ${v.hora}`}.`);
//       // === UI optimista: esconder banner y dots de “Programar Daily” ===
//       (function(){
//         hideSched();
      
//         // apagar puntitos
//         setDotSafe(document.getElementById('menu-toggle'), false);
//         setDotSafe(document.getElementById('open-scheduler'), false);
      
//         // marcar como visto en este dispositivo (para no re-mostrar)
//         try {
//           const onceKey = `gj_sched_hint_shown:${(ctx.email||'').toLowerCase()}`;
//           localStorage.setItem(onceKey, '1');
//         } catch(_) {}
//       })();

//       // === refrescar KV del Worker y re-cargar el contexto para pintar lo nuevo ===
//       try {
//         // usa tu función global existente (definida en dashboardv3.js)
//         if (window.refreshBundle) {
//           await window.refreshBundle(ctx.email);
//           // pequeña espera para asegurar persistencia
//           await new Promise(r => setTimeout(r, 400));
//         }
//       } catch (e) {
//         console.warn('[SCHED] refreshBundle falló (no bloqueante):', e);
//       }
      
//       // forzar que el próximo get no use el cache anterior del ctx
//       try { localStorage.removeItem('gj_ctx'); } catch {}
      
//       // volver a leer el contexto (ya con los datos nuevos del Worker)
//       const ctx2 = await ensureCtx();
//       const s2 = ctx2.scheduler || {};
      
//       // re-pintar el modal con lo último
//       modal.setValue({
//         canal:      s2.canal || 'email',
//         frecuencia: s2.frecuencia || 'DAILY',
//         dias:       s2.dias || '',
//         hora:       (s2.hora != null ? Number(s2.hora) : 8),
//         timezone:   s2.timezone || 'Europe/Madrid',
//         estado:     s2.estado || 'ACTIVO',
//         linkPublico: ctx2.linkPublico || ''
//       });
      
//       // feedback final
//       const txt2 = (s2.frecuencia === 'CUSTOM' && s2.dias)
//         ? `Se enviará ${s2.dias} a las ${s2.hora || 8}.`
//         : `Se enviará todos los días a las ${s2.hora || 8}.`;
//       modal.setNotice(`✅ Guardado y actualizado. ${txt2}`);

//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error guardando programación');
//     } finally {
//       modal.removeAttribute('data-busy');  // ← apaga spinner
//       }
//   });

//   modal.addEventListener('schedule:pause', async () => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       const ctx = await ensureCtx();
//       await apiPause({ email: ctx.email, userSheetId: ctx.userSheetId });
//       modal.setNotice('⏸️ Programación en pausa.');
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error al pausar');
//     } finally {
//       modal.removeAttribute('data-busy');  // ← apaga spinner
//       }
//   });

//   modal.addEventListener('schedule:resume', async () => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       const ctx = await ensureCtx();
//       await apiResume({ email: ctx.email, userSheetId: ctx.userSheetId });
//       modal.setNotice('▶️ Programación activada.');
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error al reanudar');
//     } finally {
//       modal.removeAttribute('data-busy');  // ← apaga spinner
//     }
//   });

//   modal.addEventListener('schedule:test', async () => {
//     modal.setAttribute('data-busy', '1');
//     try {
//       const ctx = await ensureCtx();
//       await apiTestSend({ email: ctx.email, userSheetId: ctx.userSheetId });
//       modal.setNotice('✉️ Envío de prueba solicitado.');
//     } catch (e) {
//       console.error(e);
//       modal.setNotice('❌ Error en el envío de prueba');
//     } finally {
//       modal.removeAttribute('data-busy');  // ← apaga spinner
//     }
//   });

//   // botón del menú 🍔
//   wireMenuButton(modal);

//   // API global por si querés abrir manualmente con prefill
//   window.openSchedulerModal = (prefill = {}) => {
//     if (prefill && typeof modal.setValue === 'function') modal.setValue(prefill);
//     modal.open();
//   };
// }

// // —— init robusto (funciona aunque DOM ya esté listo) ——
// (function safeInit() {
//   const start = () => {
//     try { attachSchedulerModal(); } catch (e) {
//       console.error('Scheduler init error:', e);
//     }
//   };
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', start, { once: true });
//   } else {
//     start();
//   }
// })();

