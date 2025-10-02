/**
 * Módulo: Login
 * Propósito: replicar el flujo original de login, modales y PWA.
 * API pública: init()
 * Dependencias: utils/dom, utils/net, utils/a11y, utils/constants.
 * Side-effects: timers de polling, localStorage/sessionStorage, registro de SW.
 * Errores esperados: caídas de red o endpoints sin configurar → se informan en consola.
 * Notas de accesibilidad: controla focus dentro de modales y anuncia estados.
 */

import {
  byId,
  on,
  setHTML,
  toggleHidden,
  focusFirstInteractive,
} from '../utils/dom.js';
import { announce, trapFocus, releaseFocus } from '../utils/a11y.js';
import {
  CHECK_ENDPOINT,
  POLL_INTERVAL_MS,
  DASHBOARD_ROUTE,
  REFRESH_ENDPOINT,
  STORAGE_KEYS,
  BUNDLE_SOFT_DELAY_MS,
  WORKER_BASE,
  OLD_WEBAPP_URL,
} from '../utils/constants.js';

const state = {
  pollTimer: null,
  lastEmail: '',
  deferredPrompt: null,
};

const SELECTORS = {
  loginWrap: 'loginWrap',
  loginForm: 'loginForm',
  email: 'email',
  goBtn: 'goBtn',
  status: 'status',
  awaitModal: 'awaitModal',
  notFoundModal: 'notFoundModal',
  closeAwait: 'closeModal',
  closeNotFound: 'closeNF',
  backNotFound: 'backNF',
  signupNF: 'signupNF',
  installBtn: 'installBtn',
  copyLinkBtn: 'copyLinkBtn',
  installHelp: 'installHelp',
  retry: 'retryBtn',
};

const USER_AGENT = navigator.userAgent || '';
const IS_IOS = /iPhone|iPad|iPod/i.test(USER_AGENT);
const IS_STANDALONE = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

// ===== [Helpers: Query params] =====
function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return (params.get(name) || '').trim();
}

// ===== [Helpers: Status] =====
function setStatus(message, spinning = false) {
  const statusEl = byId(SELECTORS.status);
  if (!statusEl) return;
  const spinner = spinning ? ' <span class="spinner" aria-hidden="true"></span>' : '';
  setHTML(statusEl, `${message}${spinner}`);
  if (message) {
    announce(message);
  }
}

// ===== [Helpers: Modales] =====
function showModal(id) {
  const modal = byId(id);
  if (!modal) return;
  modal.classList.add('visible');
  modal.setAttribute('aria-hidden', 'false');
  trapFocus(modal);
  focusFirstInteractive(modal);
}

function hideModal(id) {
  const modal = byId(id);
  if (!modal) return;
  modal.classList.remove('visible');
  modal.setAttribute('aria-hidden', 'true');
  releaseFocus();
}

function hideLogin() {
  const wrap = byId(SELECTORS.loginWrap);
  toggleHidden(wrap, true);
}

function showLogin() {
  const wrap = byId(SELECTORS.loginWrap);
  toggleHidden(wrap, false);
  const email = byId(SELECTORS.email);
  if (email) {
    email.focus();
  }
}

// ===== [Helpers: Cache bundle] =====
function getCachedBundle() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BUNDLE_CACHE);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Login] No pude leer el bundle cacheado', error);
    return null;
  }
}

function setCachedBundle(bundle) {
  try {
    localStorage.setItem(STORAGE_KEYS.BUNDLE_CACHE, JSON.stringify(bundle));
  } catch (error) {
    console.error('[Login] No pude guardar el bundle cacheado', error);
  }
}

async function loadDataFromCacheOrWebApp(email) {
  try {
    const response = await fetch(`${WORKER_BASE}/bundle?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    if (response.status === 200) {
      return await response.json();
    }
    if (response.status === 204) {
      throw new Error('No bundle yet');
    }
    throw new Error(`Worker ${response.status}`);
  } catch (error) {
    const fallback = await fetch(`${OLD_WEBAPP_URL}?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    return fallback.json();
  }
}

async function primeBundlePrefetch(email) {
  try {
    const data = await loadDataFromCacheOrWebApp(email);
    if (data) {
      setCachedBundle(data);
    }
  } catch (error) {
    console.error('[Login] No pude prefetchear el bundle', error);
  }
}

function pokeRefreshWorker(email) {
  try {
    const payload = JSON.stringify({ email });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(REFRESH_ENDPOINT, blob);
    } else {
      fetch(REFRESH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        cache: 'no-store',
      }).catch(() => {});
    }
  } catch (error) {
    console.error('[Login] No pude notificar al worker de refresh', error);
  }
}

function markPrimeFlags(delayMs = BUNDLE_SOFT_DELAY_MS) {
  try {
    sessionStorage.setItem(STORAGE_KEYS.PRIME_FLAG, '1');
    sessionStorage.setItem(STORAGE_KEYS.PRIME_DELAY, String(delayMs));
  } catch (error) {
    console.error('[Login] No pude guardar los flags de refresh', error);
  }
}

// ===== [Helpers: Chequeo de estado] =====
async function checkStatus(email) {
  const url = `${CHECK_ENDPOINT}?email=${encodeURIComponent(email)}`;
  const response = await fetch(url, { cache: 'no-store' });
  if (response.status === 404) {
    return { ok: false, notFound: true };
  }
  let data = {};
  try {
    data = await response.json();
  } catch (error) {
    data = {};
  }
  if (data && data.notFound) {
    return { ok: false, notFound: true };
  }
  return data;
}

function isReady(data) {
  return Boolean(data && data.ok && (data.has_url || data.ready));
}

function isNotFound(data) {
  if (!data) return false;
  if (data.notFound === true) return true;
  const message = (data.message || data.error || data.reason || '').toString().toLowerCase();
  return /no existe|not found|no encontrado/.test(message);
}

function goToDashboard(email) {
  window.location.href = `${DASHBOARD_ROUTE}?email=${encodeURIComponent(email)}`;
}

function startPolling() {
  stopPolling();
  state.pollTimer = window.setInterval(async () => {
    if (!state.lastEmail) return;
    try {
      const data = await checkStatus(state.lastEmail);
      if (isNotFound(data)) {
        stopPolling();
        hideModal(SELECTORS.awaitModal);
        showLogin();
        setStatus('Ese correo no está registrado.');
        showModal(SELECTORS.notFoundModal);
        return;
      }
      if (isReady(data)) {
        stopPolling();
        hideModal(SELECTORS.awaitModal);
        goToDashboard(state.lastEmail);
      }
    } catch (error) {
      console.error('[Login] Falló el polling', error);
    }
  }, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
}

// ===== [Acciones: envío del formulario] =====
async function handleSubmit(event) {
  event.preventDefault();
  const emailInput = byId(SELECTORS.email);
  const goBtn = byId(SELECTORS.goBtn);
  const email = (emailInput?.value || '').trim().toLowerCase();

  if (!email || !email.includes('@')) {
    setStatus('Ingresá un correo válido.');
    return;
  }

  state.lastEmail = email;

  if (!CHECK_ENDPOINT || CHECK_ENDPOINT.startsWith('PON_AQUI')) {
    hideLogin();
    showModal(SELECTORS.awaitModal);
    return;
  }

  if (goBtn) goBtn.disabled = true;
  if (goBtn) goBtn.style.opacity = '0.7';
  setStatus('Chequeando estado…', true);

  try {
    const data = await checkStatus(email);

    if (isNotFound(data)) {
      setStatus('Ese correo no está registrado.');
      hideModal(SELECTORS.awaitModal);
      showModal(SELECTORS.notFoundModal);
      const signup = byId(SELECTORS.signupNF);
      if (signup) {
        signup.focus();
      }
      return;
    }

    if (isReady(data)) {
      setStatus('Listo, entrando…', true);
      try {
        await primeBundlePrefetch(email);
      } catch (_) {
        // ya se logueó en consola
      }
      pokeRefreshWorker(email);
      markPrimeFlags(BUNDLE_SOFT_DELAY_MS);
      goToDashboard(email);
      return;
    }

    setStatus('Tu base está en camino. Voy a esperar con vos…', true);
    hideLogin();
    showModal(SELECTORS.awaitModal);
    startPolling();
  } catch (error) {
    console.error('[Login] Error revisando el estado', error);
    setStatus('Ups, algo falló. Intentá de nuevo en unos segundos.');
  } finally {
    if (goBtn) {
      goBtn.disabled = false;
      goBtn.style.opacity = '1';
    }
  }
}

// ===== [Acciones: cerrar modales] =====
function wireModalActions() {
  const closeAwait = byId(SELECTORS.closeAwait);
  on(closeAwait, 'click', () => {
    stopPolling();
    hideModal(SELECTORS.awaitModal);
    showLogin();
    setStatus('Listo para intentar de nuevo.');
  });

  const retry = byId(SELECTORS.retry);
  if (retry) {
    on(retry, 'click', async () => {
      if (!state.lastEmail) return;
      const original = retry.textContent;
      setHTML(retry, 'Reintentando <span class="spinner" aria-hidden="true"></span>');
      retry.disabled = true;
      try {
        const data = await checkStatus(state.lastEmail);
        if (isNotFound(data)) {
          stopPolling();
          hideModal(SELECTORS.awaitModal);
          showLogin();
          setStatus('Ese correo no está registrado.');
          showModal(SELECTORS.notFoundModal);
          return;
        }
        if (isReady(data)) {
          stopPolling();
          hideModal(SELECTORS.awaitModal);
          goToDashboard(state.lastEmail);
        }
      } catch (error) {
        console.error('[Login] Error al reintentar', error);
      } finally {
        retry.textContent = original;
        retry.disabled = false;
      }
    });
  }

  const closeNF = byId(SELECTORS.closeNotFound);
  const backNF = byId(SELECTORS.backNotFound);

  on(closeNF, 'click', () => hideModal(SELECTORS.notFoundModal));
  on(backNF, 'click', () => hideModal(SELECTORS.notFoundModal));
}

// ===== [Acciones: teclado] =====
function wireEnterShortcut() {
  on(document, 'keydown', (event) => {
    const email = byId(SELECTORS.email);
    if (event.key === 'Enter' && document.activeElement === email) {
      event.preventDefault();
      byId(SELECTORS.goBtn)?.click();
    }
  });
}

// ===== [Acciones: PWA] =====
function buildPortalUrlForMobile() {
  const base = `${window.location.origin}${window.location.pathname}`;
  const email = (byId(SELECTORS.email)?.value || '').trim().toLowerCase();
  const params = new URLSearchParams({ await: '1' });
  if (email) params.set('email', email);
  return `${base}?${params.toString()}`;
}

function wirePwaActions() {
  const installBtn = byId(SELECTORS.installBtn);
  const copyLinkBtn = byId(SELECTORS.copyLinkBtn);
  const installHelp = byId(SELECTORS.installHelp);

  if (installBtn && IS_IOS) {
    installBtn.style.display = 'inline-block';
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    if (IS_STANDALONE) return;
    event.preventDefault();
    state.deferredPrompt = event;
    if (installBtn) installBtn.style.display = 'inline-block';
  });

  on(installBtn, 'click', async () => {
    if (state.deferredPrompt) {
      state.deferredPrompt.prompt();
      try {
        await state.deferredPrompt.userChoice;
      } catch (error) {
        console.error('[Login] Instalación rechazada o fallida', error);
      }
      state.deferredPrompt = null;
      return;
    }
    if (IS_IOS) {
      if (installHelp) installHelp.style.display = 'block';
      return;
    }
    alert('Si tu navegador lo permite, usá “Instalar app / Agregar a la pantalla de inicio”.');
  });

  on(copyLinkBtn, 'click', async () => {
    if (!copyLinkBtn) return;
    const url = buildPortalUrlForMobile();
    try {
      await navigator.clipboard.writeText(url);
      const original = copyLinkBtn.textContent || '';
      copyLinkBtn.textContent = 'Copiado ✓';
      setTimeout(() => {
        copyLinkBtn.textContent = original;
      }, 1400);
    } catch (error) {
      console.error('[Login] No pude copiar al portapapeles', error);
      window.prompt('Copiá este link:', url);
    }
  });
}

function wireServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('../../sw.js', { scope: '../../' })  // TODO: usar sw.refactor.js en Lote 4
      .then((registration) => console.log('[SW] registrado', registration.scope))
      .catch((error) => console.error('[SW] error', error));
  });
}

// ===== [Boot] =====
export function init() {
  const form = byId(SELECTORS.loginForm);
  if (!form) {
    console.error('[Login] No encontré el formulario de login');
    return { teardown() {} };
  }

  form.addEventListener('submit', handleSubmit);
  wireModalActions();
  wireEnterShortcut();
  wirePwaActions();
  wireServiceWorker();

  const preloadEmail = getQueryParam('email');
  if (preloadEmail) {
    const emailInput = byId(SELECTORS.email);
    if (emailInput) emailInput.value = preloadEmail;
    state.lastEmail = preloadEmail.toLowerCase();
  }

  const forceAwait = getQueryParam('await');
  if (forceAwait === '1') {
    hideLogin();
    showModal(SELECTORS.awaitModal);
    if (state.lastEmail) {
      startPolling();
    }
  }

  announce('Pantalla de login lista.');

  return {
    teardown() {
      form.removeEventListener('submit', handleSubmit);
      stopPolling();
    },
  };
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
