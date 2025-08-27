// js/scheduler-controller.js
import './scheduler-modal.js';
import { apiSchedule, apiPause, apiResume, apiTestSend, apiGetContext, saveCtx } from './scheduler-api.js';

// Email desde URL o cache
function getEmail() {
  const url = new URL(location.href);
  return (url.searchParams.get('email') || localStorage.getItem('gj_email') || '').trim().toLowerCase();
}

async function ensureCtx() {
  const email = getEmail();
  const ctx = await apiGetContext(email); // ← preferirá window.GJ_CTX puesto por tu dashboard
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
    hora: String(v.hora),         // IMPORTANTE: solo “HH”
    timezone: v.timezone || 'Europe/Madrid',
    estado: v.estado,
    linkPublico: v.linkPublico || ctx.linkPublico || ''
  };
}

export function attachSchedulerModal() {
  // inyectar modal si no existe
  let modal = document.querySelector('scheduler-modal');
  if (!modal) {
    modal = document.createElement('scheduler-modal');
    document.body.appendChild(modal);
  }

  // al abrir → prefill
  modal.addEventListener('open', async ()=>{
    modal.setNotice('⏳ Cargando tu configuración...');
    try {
      const ctx = await ensureCtx();
      const s = ctx.scheduler || {};
      modal.setValue({
        canal: s.canal || 'email',
        frecuencia: s.frecuencia || 'DAILY',
        dias: s.dias || '',
        hora: (s.hora!=null ? Number(s.hora) : 8),
        timezone: s.timezone || 'Europe/Madrid',
        estado: s.estado || 'ACTIVO',
        linkPublico: ctx.linkPublico || ''
      });
      const txt = (s.frecuencia==='CUSTOM' && s.dias) ? `Se enviará ${s.dias} a las ${s.hora||8}.` : `Se enviará todos los días a las ${s.hora||8}.`;
      modal.setNotice(`Contexto cargado. ${txt}`);
    } catch (e) {
      console.error(e);
      modal.setNotice('⚠️ No pude cargar tu contexto. Probá más tarde.');
    }
  });

  // acciones
  modal.addEventListener('schedule:save', async (ev)=>{
    try {
      const ctx = await ensureCtx();
      const payload = buildPayload(ctx, ev.detail);
      await apiSchedule(payload);
      modal.setNotice('✅ Programación guardada.');
    } catch (e) {
      console.error(e); modal.setNotice('❌ Error guardando programación');
    }
  });

  modal.addEventListener('schedule:pause', async ()=>{
    try {
      const ctx = await ensureCtx();
      await apiPause({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('⏸️ Programación en pausa.');
    } catch (e) {
      console.error(e); modal.setNotice('❌ Error al pausar');
    }
  });

  modal.addEventListener('schedule:resume', async ()=>{
    try {
      const ctx = await ensureCtx();
      await apiResume({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('▶️ Programación activada.');
    } catch (e) {
      console.error(e); modal.setNotice('❌ Error al reanudar');
    }
  });

  modal.addEventListener('schedule:test', async ()=>{
    try {
      const ctx = await ensureCtx();
      await apiTestSend({ email: ctx.email, userSheetId: ctx.userSheetId });
      modal.setNotice('✉️ Envío de prueba solicitado.');
    } catch (e) {
      console.error(e); modal.setNotice('❌ Error en el envío de prueba');
    }
  });

  // botón del menú 🍔
  // --- Selector flexible: soporta ambos ids
  const btn =
    document.getElementById('open-scheduler') ||
    document.getElementById('edit-form');
  
  if (btn) btn.addEventListener('click', (e)=>{ e.preventDefault(); modal.open(); });
  
  // --- API global opcional (por si querés abrirlo manual desde dashboardv3.js)
  window.openSchedulerModal = (prefill={}) => {
    modal.setValue(prefill);
    modal.open();
  };
  
  // --- Auto attach sin tocar tu HTML (evita script inline)
  document.addEventListener('DOMContentLoaded', attachSchedulerModal);
