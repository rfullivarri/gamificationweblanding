// js/scheduler-controller.js
import './scheduler-modal.js';
import {
  apiSchedule, apiPause, apiResume, apiTestSend,
  apiGetContext, saveCtx
} from './scheduler-api.js';

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
function buildPayload(ctx, v) {
  return {
    email: ctx.email,
    userSheetId: ctx.userSheetId,
    canal: v.canal,
    frecuencia: v.frecuencia,
    dias: v.dias || '',
    hora: String(v.hora),                   // SOLO “HH”
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
  modal.addEventListener('schedule:save', async (ev) => {
    try {
      const ctx = await ensureCtx();
      const payload = buildPayload(ctx, ev.detail);
      await apiSchedule(payload);
      modal.setNotice('✅ Programación guardada.');
    } catch (e) {
      console.error(e);
      modal.setNotice('❌ Error guardando programación');
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
