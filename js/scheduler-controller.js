// js/scheduler-controller.js


import './scheduler-modal.js?v=3';
import {
  apiSchedule, apiPause, apiResume, apiTestSend,
  apiGetContext, saveCtx
} from './scheduler-api.js?v=3';

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
// --- construye el payload que va al Worker2
function buildPayload(ctx, v) {
  const horaNum = Number(v.hora); // asegurar número
  return {
    email: ctx.email,
    userSheetId: ctx.userSheetId,     // nombre 1
    sheetId: ctx.userSheetId,         // nombre 2 (por compatibilidad)
    canal: v.canal,
    frecuencia: v.frecuencia,
    dias: v.dias || '',
    hora: isNaN(horaNum) ? 8 : horaNum,      // SOLO HH como número
    timezone: v.timezone || 'Europe/Madrid',
    estado: v.estado,
    linkPublico: v.linkPublico || ctx.linkPublico || ''
  };
}
function wireMenuButton(modal) {
  const btn =
    document.getElementById('open-scheduler') ||
    document.getElementById('edit-form');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.open(); // El prefill ocurre en el evento 'open'
  });
}

// —— núcleo ——
export function attachSchedulerModal() {
  // inyectar modal si no existe
  let modal = document.querySelector('scheduler-modal');
  if (!modal) {
    modal = document.createElement('scheduler-modal');
    document.body.appendChild(modal);
  }

  // al abrir → prefill desde contexto
  modal.addEventListener('open', async () => {
    modal.setNotice('⏳ Cargando tu configuración...');
    try {
      const ctx = await ensureCtx();
      const s = ctx.scheduler || {};
      modal.setValue({
        canal:      s.canal || 'email',
        frecuencia: s.frecuencia || 'DAILY',
        dias:       s.dias || '',
        hora:       (s.hora != null ? Number(s.hora) : 8),
        timezone:   s.timezone || 'Europe/Madrid',
        estado:     s.estado || 'ACTIVO',
        linkPublico: ctx.linkPublico || ''
      });
      const txt = (s.frecuencia === 'CUSTOM' && s.dias)
        ? `Se enviará ${s.dias} a las ${s.hora || 8}.`
        : `Se enviará todos los días a las ${s.hora || 8}.`;
      modal.setNotice(`Contexto cargado. ${txt}`);
    } catch (e) {
      console.error(e);
      modal.setNotice('⚠️ No pude cargar tu contexto. Probá más tarde.');
    }
  });

  // acciones
  // --- handler de Guardar ---
  modal.addEventListener('schedule:save', async (ev) => {
    const payloadNotice = (p) => JSON.stringify({
      email: p.email,
      sheetId: p.sheetId,
      canal: p.canal,
      frecuencia: p.frecuencia,
      dias: p.dias,
      hora: p.hora,
      timezone: p.timezone,
      estado: p.estado,
      linkPublico: !!p.linkPublico
    });
  
    try {
      // bloquear botones mientras guardamos
      modal.setNotice('⏳ Guardando programación…');
      const ctx = await ensureCtx();
      const payload = buildPayload(ctx, ev.detail);
  
      console.log('[SCHED ⇢ /schedule] payload =', payload);
      const res = await apiSchedule(payload);
      console.log('[SCHED ⇠ /schedule] response =', res);
  
      // actualizar contexto local para que el modal muestre lo nuevo
      const newCtx = {
        ...ctx,
        scheduler: {
          ...(ctx.scheduler || {}),
          canal: payload.canal,
          frecuencia: payload.frecuencia,
          dias: payload.dias,
          hora: payload.hora,
          timezone: payload.timezone,
          estado: payload.estado
        }
      };
      saveCtx(newCtx);
      window.GJ_CTX = newCtx;
  
      const human = (payload.frecuencia === 'CUSTOM' && payload.dias)
        ? `Se enviará ${payload.dias} a las ${String(payload.hora).padStart(2,'0')}.`
        : `Se enviará todos los días a las ${String(payload.hora).padStart(2,'0')}.`;
  
      modal.setNotice(`✅ Programación guardada. ${human}`);
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error guardando programación. Abrí la consola para ver detalles.');
    }
  });

  modal.addEventListener('schedule:pause', async () => {
    try {
      const ctx = await ensureCtx();
      await apiPause({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('⏸️ Programación en pausa.');
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error al pausar');
    }
  });

  modal.addEventListener('schedule:resume', async () => {
    try {
      const ctx = await ensureCtx();
      await apiResume({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('▶️ Programación activada.');
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error al reanudar');
    }
  });

  modal.addEventListener('schedule:test', async () => {
    try {
      const ctx = await ensureCtx();
      await apiTestSend({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('✉️ Envío de prueba solicitado.');
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error en el envío de prueba');
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

// —— init robusto (funciona aunque DOM ya esté listo) ——
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

