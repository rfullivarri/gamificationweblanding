/**
 * Módulo: NetUtils
 * Propósito: envolver fetch con defaults seguros y fáciles de leer.
 * API pública: fetchJson(url, options), postJson(url, body, options), withTimeout(promise, ms),
 *             retryOperation(fn, config), createPoller(task, config), fetchJsonWithRetry(url, config)
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
 * ===== [NetUtils: reintentar operaciones asíncronas] =====
 * Ejecuta la callback varias veces; ideal para peticiones inestables.
 */
export async function retryOperation(operation, options = {}) {
  const { retries = 2, retryDelay = 600 } = options;
  let attempt = 0;
  let lastError = null;
  while (attempt <= retries) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt === retries) break;
      const delayMs = typeof retryDelay === 'function' ? retryDelay(attempt) : retryDelay * (attempt + 1);
      await delay(delayMs);
    }
    attempt += 1;
  }
  throw lastError || new Error('[NetUtils] retryOperation agotó los intentos');
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
  return retryOperation(() => fetchJson(url, fetchOptions), { retries, retryDelay });
}

/**
 * ===== [NetUtils: creador de pollers] =====
 * Devuelve un pequeño controlador para repetir una tarea cada cierto tiempo.
 */
export function createPoller(task, options = {}) {
  const { interval = 1000, immediate = false, onError = () => {} } = options;
  let timer = null;

  const runTask = async () => {
    try {
      const shouldStop = await task();
      if (shouldStop === true) {
        stop();
      }
    } catch (error) {
      onError(error);
    }
  };

  function start() {
    stop();
    if (immediate) {
      runTask();
    }
    timer = setInterval(runTask, interval);
  }

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function isRunning() {
    return timer !== null;
  }

  return { start, stop, isRunning };
}
