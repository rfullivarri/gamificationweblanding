/**
 * Módulo: Constants
 * Propósito: guardar todas las palabras mágicas (URLs, claves y selectores) en un solo lugar.
 * API pública: CHECK_ENDPOINT, POLL_INTERVAL_MS, DASHBOARD_ROUTE, WORKER_BASE, OLD_WEBAPP_URL, NOTIFICATIONS_WORKER_BASE,
 *             POPUPS_ENDPOINT, SCHEDULER_WORKER_BASE, SCHEDULER_FALLBACK_BUNDLE_ENDPOINT, BUNDLE_ENDPOINT,
 *             REFRESH_ENDPOINT, STORAGE_KEYS, SELECTOR_IDS, SELECTOR_CLASSES, EVENT_NAMES, BUNDLE_SOFT_DELAY_MS.
 * Dependencias: ninguna (este archivo debe poder importarse desde todos los demás sin bucles).
 * Side-effects: ninguno; solo exporta constantes inmutables.
 * Errores esperados: si alguien cambia un endpoint en el backend y olvida actualizar aquí, las llamadas fallarán (fetch 404).
 * Accesibilidad: al centralizar selectores garantizamos que los módulos usen los mismos IDs necesarios para lector de pantalla.
 */

/*
[Índice]
1) Endpoints principales
2) Configuración de bundle y polling
3) Selectores compartidos (IDs y clases)
4) Eventos personalizados usados globalmente
*/

// ===== [Feature: EndpointsPrincipales] =====
// Qué hace: agrupa todas las URLs absolutas para llamadas HTTP.
// Entradas/Salidas clave: se utilizan en fetch/requests desde los módulos.
// Notas: si falla una URL, probar en el navegador para ver si responde o si cambió la ruta.
export const CHECK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzOvVEFFtNQfFE28AK5Tgi7kwdzn4if5tbLHofmlyAQ3fiVLdQgwXah2TcqTZDLEzua/exec';
export const WORKER_BASE = 'https://gamificationworker.rfullivarri22.workers.dev';
export const OLD_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxncfav0V6OJsHDFMcFg7S8qISWXrG5P5l5WTCzBn-iC_4cerC22lsznJHlDsQhneGdpA/exec';
export const NOTIFICATIONS_WORKER_BASE = 'https://gamificationnotifications.rfullivarri22.workers.dev';
export const POPUPS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzKOhJnvv_UW3WkTDSuHRhkq3O3KxLx_A72q8JZYKpcJCmTj3yQ1nuhCBKPoMlDvJ6U/exec';
export const SCHEDULER_WORKER_BASE = 'https://gamificationscheduler.rfullivarri22.workers.dev';
export const BUNDLE_ENDPOINT = `${WORKER_BASE}/bundle`;
export const REFRESH_ENDPOINT = `${WORKER_BASE}/refresh`;
export const SCHEDULER_FALLBACK_BUNDLE_ENDPOINT = `${WORKER_BASE}/bundle`;

// ===== [Feature: ConfiguracionBundle] =====
// Qué hace: define tiempos y rutas internas usadas para sincronizar datos del bundle.
// Entradas/Salidas clave: intervalos en milisegundos y rutas internas.
// Notas: si se ajusta el intervalo, probar recarga automática observando la consola para confirmar eventos.
export const POLL_INTERVAL_MS = 10000;
export const DASHBOARD_ROUTE = 'dashboardv3.html';
export const BUNDLE_SOFT_DELAY_MS = 12000;

// ===== [Feature: StorageCompartido] =====
// Qué hace: agrupa las claves de localStorage usadas en todos los módulos.
// Entradas/Salidas clave: cada clave guarda JSON o flags.
// Notas: si se borra storage manualmente en pruebas, asegurarse de que los módulos lo regeneren sin romper.
export const STORAGE_KEYS = {
  BUNDLE_CACHE: 'gj_bundle',
  PRIME_FLAG: 'gj_prime',
  PRIME_DELAY: 'gj_soft_delay_ms',
};

// ===== [Feature: SelectoresCompartidos] =====
// Qué hace: expone selectores repetidos (IDs y clases) para evitar errores tipográficos.
// Entradas/Salidas clave: los módulos los importan y usan en querySelector/closest.
// Notas: al cambiar un ID en HTML hay que actualizarlo aquí y en la vista correspondiente.
export const SELECTOR_IDS = {
  BBDD_WARNING: 'bbdd-warning',
  EDIT_BBDD_WARNING: 'edit-bbdd-warning',
  SCHEDULER_WARNING: 'scheduler-warning',
  HERO_CAROUSEL: 'hero-carousel',
  LOGIN_FORM: 'login-form',
  SIGNUP_FORM: 'signup-form',
};

export const SELECTOR_CLASSES = {
  DOT_ACTIVE: 'dot--active',
  MODAL_OPEN: 'is-modal-open',
  SLIDE_VISIBLE: 'is-visible',
};

// ===== [Feature: EventosGlobales] =====
// Qué hace: define nombres de eventos CustomEvent escuchados en varias features.
// Entradas/Salidas clave: usados con window.dispatchEvent y window.addEventListener.
// Notas: si se renombra un evento hay que ajustar listeners para no “romper la conversación”.
export const EVENT_NAMES = {
  BUNDLE_UPDATED: 'gj:bundle-updated',
  DATA_READY: 'gj:data-ready',
  STATE_CHANGED: 'gj:state-changed',
};
