/**
 * Módulo: DOMUtils
 * Propósito: reunir helpers pequeñitos para consultar nodos y manejar eventos.
 * API pública: byId(id), qs(selector, scope), qsa(selector, scope), on(target, eventName, handler, options),
 *             delegate(root, eventName, selector, handler), setHTML(element, html), setText(element, text),
 *             toggleHidden(element, force), focusFirstInteractive(scope), createElement(tagName, options),
 *             serializeForm(form).
 * Dependencias: ninguna (módulo base).
 * Side-effects: ninguno, solo lee/modifica nodos recibidos.
 * Errores esperados: recibe nodos nulos y sale con mensajes amigables escritos en consola.
 * Accesibilidad: helpers como toggleHidden y focusFirstInteractive respetan aria-hidden y foco seguro.
 */

// ===== [Feature: BuscarPorId] =====
// Qué hace: obtiene un elemento por ID, devuelve null si no existe.
// Entradas/Salidas clave: recibe el string del ID y retorna el nodo o null.
// Notas: si devuelve null, revisar el HTML para confirmar que el ID está escrito igual.
export function byId(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.error(`[DOMUtils] No encontré el elemento con id="${id}"`);
  }
  return el;
}

// ===== [Feature: BuscarUno] =====
// Qué hace: envuelve querySelector para evitar reventar si el scope es nulo.
// Entradas/Salidas clave: selector CSS y scope opcional.
// Notas: si falla, el console.error nos recuerda pasar el contenedor correcto.
export function qs(selector, scope = document) {
  if (!scope) {
    console.error('[DOMUtils] No tengo un scope para buscar', selector);
    return null;
  }
  return scope.querySelector(selector);
}

// ===== [Feature: BuscarMuchos] =====
// Qué hace: devuelve todos los nodos que coinciden en un array amigable.
// Entradas/Salidas clave: selector CSS y scope.
// Notas: si no hay nodos, entrega array vacío así los bucles no fallan.
export function qsa(selector, scope = document) {
  if (!scope) {
    console.error('[DOMUtils] No tengo un scope para buscar muchos', selector);
    return [];
  }
  return Array.from(scope.querySelectorAll(selector));
}

// ===== [Feature: EscucharEventos] =====
// Qué hace: agrega listeners y devuelve una función para limpiar.
// Entradas/Salidas clave: target DOM, nombre de evento, handler y opciones.
// Notas: probar clics y teclas; si falla, revisar que el target exista.
export function on(target, eventName, handler, options) {
  if (!target) {
    console.error(`[DOMUtils] Intenté escuchar ${eventName} pero no encontré el nodo`);
    return () => {};
  }
  target.addEventListener(eventName, handler, options);
  return () => target.removeEventListener(eventName, handler, options);
}

// ===== [Feature: DelegarEventos] =====
// Qué hace: escucha eventos en un contenedor y ejecuta handler para matches.
// Entradas/Salidas clave: root, nombre de evento, selector, handler.
// Notas: útil para listas dinámicas; probar agregando elementos después.
export function delegate(root, eventName, selector, handler) {
  return on(root, eventName, (event) => {
    const potential = event.target.closest(selector);
    if (potential && root.contains(potential)) {
      handler(event, potential);
    }
  });
}

// ===== [Feature: EscribirHTML] =====
// Qué hace: actualiza innerHTML solo si el nodo existe.
// Entradas/Salidas clave: elemento destino y string de HTML.
// Notas: si algo no se ve, revisar que el HTML sea seguro y que el nodo llegue.
export function setHTML(element, html) {
  if (!element) {
    console.error('[DOMUtils] No pude escribir HTML porque el elemento es nulo');
    return;
  }
  element.innerHTML = html;
}

// ===== [Feature: EscribirTexto] =====
// Qué hace: setea textContent con seguridad.
// Entradas/Salidas clave: elemento y texto.
// Notas: ideal para mensajes visibles; si se ve [object Object], revisar la fuente.
export function setText(element, text) {
  if (!element) {
    console.error('[DOMUtils] No pude escribir texto porque el elemento es nulo');
    return;
  }
  element.textContent = text;
}

// ===== [Feature: AlternarHidden] =====
// Qué hace: usa el atributo hidden para mostrar u ocultar algo sin borrar clases.
// Entradas/Salidas clave: elemento y booleano opcional.
// Notas: cuando algo no se oculta, verificar que force sea booleano o que no esté sobrescrito en CSS.
export function toggleHidden(element, force) {
  if (!element) {
    console.error('[DOMUtils] No pude alternar hidden porque el elemento es nulo');
    return;
  }
  const shouldHide = typeof force === 'boolean' ? force : !element.hidden;
  element.hidden = shouldHide;
  element.setAttribute('aria-hidden', shouldHide ? 'true' : 'false');
}

// ===== [Feature: EnfocarPrimerInteractivo] =====
// Qué hace: encuentra el primer elemento navegable y le da foco para ayudar a la navegación con teclado.
// Entradas/Salidas clave: scope opcional donde buscar.
// Notas: probar con tabulador; si falla, revisar que existan elementos focusables.
export function focusFirstInteractive(scope) {
  const focusables = qsa('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', scope);
  if (focusables.length > 0) {
    focusables[0].focus();
  }
}

// ===== [Feature: CrearElementoRapido] =====
// Qué hace: arma nodos nuevos con atributos sin escribir mucho boilerplate.
// Entradas/Salidas clave: etiqueta y opciones.
// Notas: si una propiedad no se aplica, revisa si es atributo o propiedad DOM.
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

// ===== [Feature: SerializarFormulario] =====
// Qué hace: convierte inputs en un objeto amigable.
// Entradas/Salidas clave: formulario HTML.
// Notas: si falta un campo, asegurar que tenga name o id.
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
