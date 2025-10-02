/**
 * Módulo: SignupV2
 * Propósito: mover la lógica de signupv2.html a un módulo claro y reutilizable.
 * API pública: se auto-inicializa en DOMContentLoaded.
 * Dependencias: utils/dom, utils/net.
 * Side-effects: timers de polling, lectura de inputs y llamadas fetch/ImgBB.
 * Comentario amigable: explicado como para un peque de 5 años 🙂.
 */

import {
  byId,
  on,
  setHTML,
  setText,
  createElement,
  serializeForm,
} from '../utils/dom.js';
import { fetchJsonWithRetry, createPoller } from '../utils/net.js';

const CONFIG = {
  formAction: 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeXmBXfo0dw3srvcLzazcwW67K5Gv-dsvmdRDXVd78MRMjNLA/formResponse',
  statusEndpoint: 'https://script.google.com/macros/s/AKfycbxOaMmRvEUweOyfXxj93ERX-ls8yvovoU5B_jjDg7qDeWLPhn70-0ClahMyOg69zJhf/exec',
  formPublicUrl: 'https://rfullivarri.github.io/gamificationweblanding/formsintrov3.html',
  loginUrl: 'loginv2.html',
  pollInterval: 10000,
  defaultAvatar: 'https://i.ibb.co/Mxf30SX5/Whats-App-Image-2025-07-29-at-10-17-40.jpg',
  imgbbEndpoint: 'https://api.imgbb.com/1/upload?key=b78f6fa1f849b2c8fcc41ba4b195864f',
};

const state = {
  lastEmail: '',
};

const elements = {};

let statusPoller = null;

function cacheElements() {
  elements.form = byId('signup-form');
  elements.avatarInput = byId('avatar');
  elements.avatarPreview = byId('avatar-preview');
  elements.filenamePreview = byId('filename-preview');
  elements.status = byId('status');
  elements.modal = byId('modal');
  elements.modalTitle = byId('modalTitle');
  elements.modalBody = byId('modalBody');
  elements.modalActions = byId('modalActions');
  elements.modalClose = byId('modalClose');
}

// ===== [Helpers sencillos] =====
function setStatus(message, spinning = false) {
  if (!elements.status) return;
  const spinner = spinning ? ' <span class="spinner" aria-hidden="true"></span>' : '';
  setHTML(elements.status, `${message}${spinner}`);
}

function showModal() {
  if (!elements.modal) return;
  elements.modal.classList.add('visible');
  elements.modal.setAttribute('aria-hidden', 'false');
}

function hideModal() {
  if (!elements.modal) return;
  elements.modal.classList.remove('visible');
  elements.modal.setAttribute('aria-hidden', 'true');
}

function drawModal(title, bodyHtml, actionConfigs) {
  if (!elements.modalTitle || !elements.modalBody || !elements.modalActions) return;
  setText(elements.modalTitle, title);
  setHTML(elements.modalBody, bodyHtml);
  setHTML(elements.modalActions, '');

  actionConfigs.forEach((action) => {
    const node = createElement(action.tag || 'button', {
      className: action.className || 'btn',
      innerHTML: action.html || action.text || 'OK',
    });

    if (action.href) {
      node.setAttribute('href', action.href);
      node.setAttribute('rel', 'noopener');
      node.setAttribute('target', action.target || '_self');
    }

    if (typeof action.onClick === 'function') {
      on(node, 'click', action.onClick);
    }

    elements.modalActions.appendChild(node);
  });
}

function rememberEmail(email) {
  state.lastEmail = email;
}

function ensurePoller() {
  if (!statusPoller) {
    statusPoller = createPoller(
      async () => {
        if (!state.lastEmail) {
          return true;
        }
        await checkAndRenderStatus();
        return false;
      },
      {
        interval: CONFIG.pollInterval,
        onError: (error) => {
          console.warn('[Signup] Poll falló, se reintentará automáticamente', error);
        },
      },
    );
  }
  return statusPoller;
}

function startPolling() {
  ensurePoller().start();
}

function stopPolling() {
  if (statusPoller) {
    statusPoller.stop();
  }
}

async function checkAndRenderStatus() {
  if (!state.lastEmail) return;
  try {
    const data = await fetchJsonWithRetry(
      `${CONFIG.statusEndpoint}?email=${encodeURIComponent(state.lastEmail)}`,
      { retries: 1, retryDelay: 1500, fetchOptions: { cache: 'no-store' } },
    );

    if (data?.ok && data?.processed) {
      drawModal(
        '¡Todo listo! 🎉',
        '<p>Tu cuenta está activa. Ya podés entrar al Dashboard.</p>',
        [
          {
            tag: 'a',
            className: 'btn',
            href: `${CONFIG.loginUrl}?email=${encodeURIComponent(state.lastEmail)}`,
            text: 'Ir al Login',
          },
          { tag: 'a', className: 'btn ghost', href: 'indexv2.html', text: 'Volver al inicio' },
        ],
      );
      stopPolling();
      return;
    }

    drawModal(
      'Falta un paso',
      '<p>Completá el formulario para terminar la configuración. Apenas esté, te avisamos acá.</p>',
      [
        { tag: 'a', className: 'btn', href: CONFIG.formPublicUrl, target: '_blank', text: 'Completar formulario' },
        { tag: 'a', className: 'btn ghost', href: 'indexv2.html', text: 'Más tarde' },
      ],
    );
  } catch (_error) {
    // Silenciar: volveremos a intentar en el próximo intervalo.
  }
}

function showWaitingModal() {
  showModal();
  drawModal(
    'Creando tu cuenta…',
    '<p>Guardamos tus datos. Estamos preparando tu base con IA <span class="spinner"></span></p>',
    [
      { tag: 'a', className: 'btn ghost', href: 'indexv2.html', text: 'Más tarde' },
      { tag: 'a', className: 'btn', href: CONFIG.formPublicUrl, target: '_blank', text: 'Completar formulario' },
    ],
  );
}

async function uploadAvatar(file) {
  if (!file) return CONFIG.defaultAvatar;

  const fileBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.split(',')[1];
      if (base64) resolve(base64);
      else reject(new Error('avatar_read_error'));
    };
    reader.onerror = () => reject(new Error('avatar_read_error'));
    reader.readAsDataURL(file);
  });

  try {
    const response = await fetch(CONFIG.imgbbEndpoint, {
      method: 'POST',
      body: new URLSearchParams({ image: fileBase64 }),
    });
    const data = await response.json();
    return data?.data?.url || CONFIG.defaultAvatar;
  } catch (_error) {
    return CONFIG.defaultAvatar;
  }
}

async function submitForm(avatarUrl) {
  const values = elements.form ? serializeForm(elements.form) : {};
  const email = (values.email || '').trim().toLowerCase();
  const nombre = (values.nombre || '').trim();
  const apellido = (values.apellido || '').trim();
  const edad = (values.edad || '').trim();
  const sexo = (values.sexo || '').trim();

  if (!email || !nombre) {
    window.alert('Por favor, completá al menos tu email y nombre.');
    return;
  }

  rememberEmail(email);

  const formData = new FormData();
  formData.append('entry.978262299', email);
  formData.append('entry.268921631', nombre);
  formData.append('entry.1084572637', apellido);
  formData.append('entry.2109129788', edad);
  formData.append('entry.1142848287', avatarUrl);
  formData.append('entry.902905747', sexo);

  try {
    setStatus('Registrando…', true);
    await fetch(CONFIG.formAction, { method: 'POST', mode: 'no-cors', body: formData });
    showWaitingModal();
    await checkAndRenderStatus();
    startPolling();
  } catch (error) {
    window.alert('Ocurrió un error al registrar: ' + error);
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  const file = elements.avatarInput?.files?.[0];
  const avatarUrl = await uploadAvatar(file);
  submitForm(avatarUrl);
}

function handleAvatarPreview(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const imageUrl = URL.createObjectURL(file);
  if (elements.avatarPreview) elements.avatarPreview.src = imageUrl;
  if (elements.filenamePreview) setText(elements.filenamePreview, file.name);
}

function bindEvents() {
  if (elements.form) {
    on(elements.form, 'submit', handleSubmit);
  }
  if (elements.avatarInput) {
    on(elements.avatarInput, 'change', handleAvatarPreview);
  }
  if (elements.modalClose) {
    on(elements.modalClose, 'click', hideModal);
  }
}

function init() {
  cacheElements();
  bindEvents();
}

on(document, 'DOMContentLoaded', init);

// TODO: mover a constantes compartidas los IDs entry.* si se reutilizan en otro flujo.
