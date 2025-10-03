/**
 * Módulo: Landing
 * Propósito: animar el carrusel de testimonios sin cambiar su experiencia.
 * API pública: init(rootEl)
 * Dependencias: utils/dom, utils/a11y.
 * Side-effects: timers de autoplay y listeners sobre el carrusel.
 * Errores esperados: si falta el carrusel, solo se reporta en consola.
 * Notas de accesibilidad: actualiza aria-selected y responde a teclas.
 */

import { byId, qsa, on, patchPreviewLinks } from '../utils/dom.js';
import { announce } from '../utils/a11y.js';

const AUTOPLAY_INTERVAL_MS = 4000;

// ===== [Feature: Landing Carousel] =====
// Esta parte mueve los testimonios como un trencito de tarjetas.
function createCarousel(root) {
  if (!root) {
    console.error('[Landing] No encontré el carrusel de testimonios');
    return { teardown() {} };
  }

  const track = root.querySelector('.slider-track');
  const slides = qsa(':scope .slider-track > *', root);
  const prevBtn = root.querySelector('.slider-btn.prev');
  const nextBtn = root.querySelector('.slider-btn.next');
  const dots = qsa('.dot', root);

  if (!track || slides.length === 0) {
    console.error('[Landing] El carrusel no tiene tarjetas para mostrar');
    return { teardown() {} };
  }

  let index = 0;
  let timer = null;

  const goTo = (newIndex) => {
    index = (newIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-selected', dotIndex === index ? 'true' : 'false');
    });
    announce(`Testimonio ${index + 1} de ${slides.length}`);
  };

  const play = () => {
    stop();
    timer = window.setInterval(() => goTo(index + 1), AUTOPLAY_INTERVAL_MS);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const destroyers = [];

  destroyers.push(on(prevBtn, 'click', () => goTo(index - 1)));
  destroyers.push(on(nextBtn, 'click', () => goTo(index + 1)));
  dots.forEach((dot, dotIndex) => {
    destroyers.push(on(dot, 'click', () => goTo(dotIndex)));
  });

  destroyers.push(on(root, 'mouseenter', stop));
  destroyers.push(on(root, 'mouseleave', play));
  destroyers.push(on(root, 'keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    }
  }));

  goTo(0);
  play();

  return {
    teardown() {
      stop();
      destroyers.forEach((fn) => fn && fn());
    },
  };
}

export function init(root = document) {
  patchPreviewLinks({
    'indexv2.html': 'indexv2.refactor.html',
    'loginv2.html': 'loginv2.refactor.html',
    'signupv2.html': 'signupv2.refactor.html',
    'formsintrov3.html': 'formsintrov3.refactor.html',
    'dashboardv3.html': 'dashboardv3.refactor.html',
  }, root);

  const slider = createCarousel(byId('testi-slider'));
  return {
    teardown() {
      slider.teardown();
    },
  };
}

// ===== [Auto arranque] =====
// Esperamos a que el DOM esté listo para encender el carrusel.
document.addEventListener('DOMContentLoaded', () => {
  init(document);
});
