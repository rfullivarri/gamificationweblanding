/**
 * Módulo: A11yUtils
 * Propósito: agrupar helpers para foco y mensajes amigables.
 * API pública: trapFocus(container), releaseFocus(), announce(message, politeness)
 * Dependencias: utils/dom.
 * Side-effects: maneja focus en document.activeElement y aria-live global.
 * Errores esperados: contenedores inexistentes → se ignoran avisando por consola.
 * Notas de accesibilidad: refuerza que los modales sean navegables.
 */

import { qsa } from './dom.js';

let lastFocused = null;
let currentTrap = null;
let announcer = null;

/**
 * ===== [A11y: crear announcer] =====
 * Genera un div aria-live para comunicar mensajes cortos.
 */
function ensureAnnouncer() {
  if (announcer) return announcer;
  announcer = document.createElement('div');
  announcer.setAttribute('role', 'status');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.style.position = 'absolute';
  announcer.style.width = '1px';
  announcer.style.height = '1px';
  announcer.style.margin = '-1px';
  announcer.style.border = '0';
  announcer.style.padding = '0';
  announcer.style.clip = 'rect(0 0 0 0)';
  document.body.appendChild(announcer);
  return announcer;
}

/**
 * ===== [A11y: anunciar mensajes] =====
 * Envía texto al aria-live para lectores de pantalla.
 */
export function announce(message, politeness = 'polite') {
  const node = ensureAnnouncer();
  node.setAttribute('aria-live', politeness);
  node.textContent = message;
}

/**
 * ===== [A11y: atrapar foco en un modal] =====
 * Guarda quién tenía el foco, y cicla dentro del contenedor.
 */
export function trapFocus(container) {
  if (!container) {
    console.error('[A11yUtils] No encontré el contenedor para trapFocus');
    return;
  }
  lastFocused = document.activeElement;
  currentTrap = container;
  const focusables = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', container);
  if (focusables.length > 0) {
    focusables[0].focus();
  }

  const handleKeydown = (event) => {
    if (event.key !== 'Tab' || !currentTrap) return;
    const elements = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', currentTrap);
    if (elements.length === 0) return;
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.__trapHandler = handleKeydown;
  document.addEventListener('keydown', handleKeydown);
}

/**
 * ===== [A11y: liberar foco] =====
 * Regresa el foco al elemento previo si todavía existe.
 */
export function releaseFocus() {
  if (currentTrap && currentTrap.__trapHandler) {
    document.removeEventListener('keydown', currentTrap.__trapHandler);
    delete currentTrap.__trapHandler;
  }
  currentTrap = null;
  if (lastFocused && typeof lastFocused.focus === 'function') {
    lastFocused.focus();
  }
  lastFocused = null;
}
