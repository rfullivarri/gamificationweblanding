/**
 * Módulo: NetUtils
 * Propósito: envolver fetch con defaults seguros y fáciles de leer.
 * API pública: fetchJson(url, options), postJson(url, body, options), withTimeout(promise, ms)
 * Dependencias: ninguna.
 * Side-effects: solo llamadas a fetch.
 * Errores esperados: timeouts o respuestas no JSON → se reportan en consola.
 * Notas de accesibilidad: sin impacto directo, pero mantiene mensajes claros.
 */

const DEFAULT_TIMEOUT_MS = 15000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ===== [NetUtils: timeout amigable] =====
 * Si algo tarda mucho, lo cancelamos para no colgar la UI.
 */
export function withTimeout(promise, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[NetUtils] La petición tardó más de ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

/**
 * ===== [NetUtils: GET que devuelve JSON] =====
 * Usa fetch y convierte la respuesta en objeto.
 */
export async function fetchJson(url, options = {}) {
  try {
    const response = await withTimeout(fetch(url, options), options.timeoutMs);
    if (!response.ok && response.status !== 404) {
      console.error('[NetUtils] Respuesta inesperada', response.status, url);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error('[NetUtils] No pude obtener JSON', url, error);
    throw error;
  }
}

/**
 * ===== [NetUtils: POST JSON] =====
 * Serializa el body y devuelve la respuesta parseada.
 */
export async function postJson(url, body, options = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: payload,
    keepalive: true,
    cache: 'no-store',
    ...options,
  };
  return fetchJson(url, opts);
}

/**
 * ===== [NetUtils: GET con reintentos] =====
 * Ideal para polling: intenta varias veces antes de fallar.
 */
export async function fetchJsonWithRetry(url, config = {}) {
  const { retries = 2, retryDelay = 600, fetchOptions = {} } = config;
  let attempt = 0;
  let lastError = null;
  while (attempt <= retries) {
    try {
      return await fetchJson(url, fetchOptions);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      await delay(retryDelay * (attempt + 1));
    }
    attempt += 1;
  }
  throw lastError || new Error('[NetUtils] fetchJsonWithRetry agotó los intentos');
}
