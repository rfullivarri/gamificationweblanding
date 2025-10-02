/**
 * Módulo: DOMUtils
 * Propósito: reunir helpers pequeñitos para consultar nodos y manejar eventos.
 * API pública: byId(id), qs(selector, scope), qsa(selector, scope), on(el, evt, handler), delegate(root, evt, selector, handler), setHTML(el, html), toggleHidden(el, force)
 * Dependencias: ninguna (módulo base).
 * Side-effects: ninguno, solo lee/modifica nodos recibidos.
 * Errores esperados: recibe nodos nulos y sale con mensajes amigables.
 * Notas de accesibilidad: permite manejar focos y atributos sin duplicar código.
 */

/**
 * ===== [DOMUtils: seleccionar por ID] =====
 * Devuelve el elemento si existe; si no, avisa en consola y retorna null.
 */
export function byId(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`[DOMUtils] No encontré el elemento con id="${id}"`);
  }
  return el;
}

/**
 * ===== [DOMUtils: querySelector seguro] =====
 * Busca dentro de scope (o document) y devuelve el primer match.
 */
export function qs(selector, scope = document) {
  if (!scope) {
    console.error('[DOMUtils] No tengo un scope para buscar', selector);
    return null;
  }
  return scope.querySelector(selector);
}

/**
 * ===== [DOMUtils: querySelectorAll sencillo] =====
 * Siempre devuelve un array para que podamos usar forEach sin miedo.
 */
export function qsa(selector, scope = document) {
  if (!scope) {
    console.error('[DOMUtils] No tengo un scope para buscar muchos', selector);
    return [];
  }
  return Array.from(scope.querySelectorAll(selector));
}

/**
 * ===== [DOMUtils: escuchar eventos] =====
 * Adjunta un listener y devuelve una función para removerlo.
 */
export function on(target, eventName, handler, options) {
  if (!target) {
    console.error(`[DOMUtils] Intenté escuchar ${eventName} pero no encontré el nodo`);
    return () => {};
  }
  target.addEventListener(eventName, handler, options);
  return () => target.removeEventListener(eventName, handler, options);
}

/**
 * ===== [DOMUtils: delegar eventos] =====
 * Escucha un evento en root y lo ejecuta cuando el target coincide con selector.
 */
export function delegate(root, eventName, selector, handler) {
  return on(root, eventName, (event) => {
    const potential = event.target.closest(selector);
    if (potential && root.contains(potential)) {
      handler(event, potential);
    }
  });
}

/**
 * ===== [DOMUtils: setear HTML] =====
 * Reemplaza el contenido de un nodo; si el nodo no existe, lo ignora sin romper.
 */
export function setHTML(element, html) {
  if (!element) {
    console.error('[DOMUtils] No pude escribir HTML porque el elemento es nulo');
    return;
  }
  element.innerHTML = html;
}

/**
 * ===== [DOMUtils: setear texto plano] =====
 * Cambia textContent y evita escapes manuales.
 */
export function setText(element, text) {
  if (!element) {
    console.error('[DOMUtils] No pude escribir texto porque el elemento es nulo');
    return;
  }
  element.textContent = text;
}

/**
 * ===== [DOMUtils: mostrar/ocultar con hidden] =====
 * Usa el atributo hidden para no tocar clases ni estilos externos.
 */
export function toggleHidden(element, force) {
  if (!element) {
    console.error('[DOMUtils] No pude alternar hidden porque el elemento es nulo');
    return;
  }
  const shouldHide = typeof force === 'boolean' ? force : !element.hidden;
  element.hidden = shouldHide;
  element.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
}

/**
 * ===== [DOMUtils: enfocar el primer elemento navegable] =====
 * Busca botones, enlaces o inputs y les da foco.
 */
export function focusFirstInteractive(scope) {
  const focusables = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', scope);
  if (focusables.length > 0) {
    focusables[0].focus();
  }
}

/**
 * ===== [DOMUtils: crear elemento rápido] =====
 * Genera nodos con clases, HTML interno y atributos opcionales.
 */
export function createElement(tagName, options = {}) {
  const {
    className,
    innerHTML,
    textContent,
    attributes,
    ...rest
  } = options;
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (typeof innerHTML === 'string') element.innerHTML = innerHTML;
  if (typeof textContent === 'string') element.textContent = textContent;
  if (attributes && typeof attributes === 'object') {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  Object.entries(rest).forEach(([key, value]) => {
    if (key.startsWith('data-')) {
      element.setAttribute(key, value);
      return;
    }
    if (key in element) {
      element[key] = value;
    }
  });
  return element;
}

/**
 * ===== [DOMUtils: serializar formulario] =====
 * Devuelve un objeto simple usando name o id como clave.
 */
export function serializeForm(form) {
  if (!form) {
    console.error('[DOMUtils] No pude serializar porque el formulario es nulo');
    return {};
  }
  const result = {};
  const elements = Array.from(form.elements || []);
  elements.forEach((field) => {
    if (!field || field.disabled) return;
    const tag = (field.tagName || '').toLowerCase();
    if (!tag) return;
    const key = field.name || field.id;
    if (!key) return;

    if ((field.type === 'checkbox' || field.type === 'radio') && !field.checked) {
      return;
    }

    let value;
    if (tag === 'select' && field.multiple) {
      value = Array.from(field.selectedOptions || []).map((opt) => opt.value);
    } else if (field.type === 'file') {
      value = field.files ? Array.from(field.files) : [];
    } else {
      value = field.value;
    }

    if (result[key] !== undefined) {
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]];
      }
      result[key].push(value);
    } else {
      result[key] = value;
    }
  });
  return result;
}
