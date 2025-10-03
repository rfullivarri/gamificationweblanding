/**
 * Módulo: A11yUtils
 * Propósito: agrupar helpers para foco y mensajes amigables.
 * API pública: trapFocus(container), releaseFocus(), announce(message, politeness).
 * Dependencias: utils/dom (para qsa de elementos focusables).
 * Side-effects: crea un nodo aria-live en body, intercepta eventos keydown.
 * Errores esperados: contenedores inexistentes → se ignoran avisando por consola.
 * Accesibilidad: garantiza que los modales sean navegables solo con teclado y que los mensajes se anuncien a lectores.
 */

import { qsa } from './dom.js';

let lastFocused = null;
let currentTrap = null;
let announcer = null;

// ===== [Feature: CrearAnnouncer] =====
// Qué hace: asegura que exista un div aria-live oculto para mensajes.
// Entradas/Salidas clave: retorna el nodo announcer para ser reutilizado.
// Notas: si no se crea, los lectores no escuchan los mensajes; se llama automáticamente desde announce.
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

// ===== [Feature: AnunciarMensajes] =====
// Qué hace: escribe texto en el aria-live con politeness configurable.
// Entradas/Salidas clave: mensaje y modo (polite/assertive).
// Notas: probar con lector (NVDA/VoiceOver); si no se escucha, confirmar que ensureAnnouncer corrió.
export function announce(message, politeness = 'polite') {
  const node = ensureAnnouncer();
  node.setAttribute('aria-live', politeness);
  node.textContent = message;
}

// ===== [Feature: AtraparFocoModal] =====
// Qué hace: guarda el último foco y lo mantiene dentro del contenedor modal.
// Entradas/Salidas clave: container DOM que contiene elementos interactivos.
// Notas: probar navegando con Tab; si se escapa el foco verificar que el modal tenga inputs focusables.
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

// ===== [Feature: LiberarFocoModal] =====
// Qué hace: quita el listener y devuelve el foco al elemento previo.
// Entradas/Salidas clave: ninguna (usa lastFocused almacenado).
// Notas: probar cerrando el modal con ESC; si falla, el foco queda en body y se considera bug P1.
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
