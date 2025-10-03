/**
 * Módulo: NetUtils
 * Propósito: envolver fetch con defaults seguros y fáciles de leer.
 * API pública: fetchJson(url, options), postJson(url, body, options), withTimeout(promise, ms),
 *             retryOperation(operation, options), createPoller(task, options), fetchJsonWithRetry(url, config).
 * Dependencias: ninguna (se usa en múltiples módulos sin circularidad).
 * Side-effects: solo llamadas a fetch y timers.
 * Errores esperados: timeouts o respuestas no JSON → se reportan en consola.
 * Accesibilidad: sin impacto directo; ayuda a que la UI muestre mensajes rápidos cuando algo falla.
 */

const DEFAULT_TIMEOUT_MS = 15000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ===== [Feature: ReintentosAmigables] =====
// Qué hace: vuelve a ejecutar una operación asincrónica las veces necesarias.
// Entradas/Salidas clave: operation(attempt) devuelve promesa; options con retries y retryDelay.
// Notas: probar con una operación que falle la primera vez; si todos los intentos fallan lanza el último error.
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

// ===== [Feature: TimeoutAmigable] =====
// Qué hace: corta la promesa si excede cierto tiempo para liberar la UI.
// Entradas/Salidas clave: promesa original y timeoutMs.
// Notas: probar con fetch que nunca responde; se obtiene error claro `[NetUtils]`.
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

// ===== [Feature: GetJsonSeguro] =====
// Qué hace: realiza fetch y devuelve JSON parseado o null.
// Entradas/Salidas clave: url y opciones (timeoutMs). Devuelve objeto/array.
// Notas: si la respuesta no es JSON lanza error; probar con endpoint de prueba para validar mensajes.
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

// ===== [Feature: PostJsonSeguro] =====
// Qué hace: envía JSON y reusa fetchJson para parsear la respuesta.
// Entradas/Salidas clave: url, body, headers adicionales.
// Notas: ideal para formularios; si el backend responde 500 se verá en consola.
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

// ===== [Feature: GetJsonConReintentos] =====
// Qué hace: combina fetchJson con retryOperation para robustecer el polling.
// Entradas/Salidas clave: url y config con retries/delay.
// Notas: probar con red lenta; la promesa reintenta automáticamente antes de rechazar.
export async function fetchJsonWithRetry(url, config = {}) {
  const { retries = 2, retryDelay = 600, fetchOptions = {} } = config;
  return retryOperation(() => fetchJson(url, fetchOptions), { retries, retryDelay });
}

// ===== [Feature: CreadorPollers] =====
// Qué hace: crea un bucle controlado con setInterval para tareas repetidas.
// Entradas/Salidas clave: task async que puede devolver true para frenar.
// Notas: probar con immediate=true; si task lanza error se deriva a onError sin romper la app.
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
