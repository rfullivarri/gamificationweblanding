/**
 * Módulo: AppConstants
 * Propósito: centralizar endpoints, rutas y claves de storage.
 * API pública: export const con strings mágicos y números usados en features.
 * Dependencias: ninguna.
 * Side-effects: ninguno.
 * Errores esperados: si se cambia un endpoint, actualizar aquí.
 * Notas de accesibilidad: sin impacto directo, pero evita duplicar valores.
 */

export const CHECK_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzOvVEFFtNQfFE28AK5Tgi7kwdzn4if5tbLHofmlyAQ3fiVLdQgwXah2TcqTZDLEzua/exec';
export const POLL_INTERVAL_MS = 10000;
export const DASHBOARD_ROUTE = 'dashboardv3.html';

export const WORKER_BASE = 'https://gamificationworker.rfullivarri22.workers.dev';
export const OLD_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxncfav0V6OJsHDFMcFg7S8qISWXrG5P5l5WTCzBn-iC_4cerC22lsznJHlDsQhneGdpA/exec';
export const NOTIFICATIONS_WORKER_BASE = 'https://gamificationnotifications.rfullivarri22.workers.dev';

export const POPUPS_ENDPOINT = 'https://script.google.com/macros/s/AKfycbzKOhJnvv_UW3WkTDSuHRhkq3O3KxLx_A72q8JZYKpcJCmTj3yQ1nuhCBKPoMlDvJ6U/exec';
export const SCHEDULER_WORKER_BASE = 'https://gamificationscheduler.rfullivarri22.workers.dev';
export const SCHEDULER_FALLBACK_BUNDLE_ENDPOINT = `${WORKER_BASE}/bundle`;

export const BUNDLE_ENDPOINT = `${WORKER_BASE}/bundle`;
export const REFRESH_ENDPOINT = `${WORKER_BASE}/refresh`;

export const STORAGE_KEYS = {
  BUNDLE_CACHE: 'gj_bundle',
  PRIME_FLAG: 'gj_prime',
  PRIME_DELAY: 'gj_soft_delay_ms',
};

export const BUNDLE_SOFT_DELAY_MS = 12000;
