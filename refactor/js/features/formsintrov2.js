/**
 * Módulo: FormsIntroV2
 * Propósito: encapsular el wizard de onboarding y su envío final.
 * API pública: init(), teardown().
 * Dependencias: utils/dom, utils/net.
 * Comentarios en modo “cuento para peques”.
 */

import {
  byId,
  qsa,
  on,
  delegate,
  setHTML,
  setText,
  createElement,
  serializeForm,
} from '../utils/dom.js';
import { postJson, retryOperation } from '../utils/net.js';

// === HUD · Navegación · Payload · Servicios ===
// Unificamos todo en este archivo para que cualquier persona que abra el feature
// pueda leerlo de arriba a abajo como si fuese una guía. No hay imports cruzados
// ni saltos entre módulos: cada bloque está seccionado y comentado con lujo de
// detalle para que la intención de cada paso resulte evidente.

const WORKER_URL = 'https://gamificationonboarding.rfullivarri22.workers.dev/';
const REDIRECT_URL = 'https://rfullivarri.github.io/gamificationweblanding/loginv2.html?await=1';

const FORM_LABELS = {
  lowBody: [
    'Dormir mejor 😴',
    'Alimentarte mejor 🥗',
    'Moverte un poco más 🏃',
    'Tomar más agua 💧',
    'Descansar sin culpa 🧘',
  ],
  lowSoul: [
    'Respirar profundo unos minutos 🌬️',
    'Escuchar música que te gusta 🎶',
    'Estar en contacto con la naturaleza 🍃',
    'Anotar lo que sentís en un papel 📝',
    'Hacer algo sin tener que ser útil 🌈',
  ],
  lowMind: [
    'Leer algo corto 📖',
    'Anotar tus pensamientos 📓',
    'Mirar una serie tranquila 📺',
    'Hacer una pausa sin pantallas 🚫📱',
    'Desarmar alguna idea negativa 🧩',
  ],
  chillMotiv: [
    '🌱 Crecer como persona / desarrollo personal',
    '🎯 Lograr metas concretas que me propongo',
    '🤝 Sentirme más conectado con otras personas',
    '🧘‍♂️ Vivir con más calma y menos estrés',
    '🏆 Superarme a mí mismo y romper mis límites',
    '🛠️ Crear o construir algo (proyectos, arte, emprendimientos)',
    '✨ Sentirme más feliz y satisfecho con mi día a día',
    '🗺️ Tener más experiencias y aventuras',
    '💖 Cuidar mi salud y bienestar a largo plazo',
  ],
  flowObstacles: [
    'Falta de tiempo',
    'Falta de energía o motivación',
    'Miedo al fracaso',
    'Dudas sobre dónde empezar',
    'Falta de apoyo',
    'Procrastinación',
    'No tengo Hábitos aún',
    'Síndrome del impostor',
  ],
  evolveCommit: [
    'Mis hábitos diarios',
    'Mi alimentación',
    'Mis rutinas de descanso',
    'Mi tiempo libre',
    'Mis relaciones sociales',
    'Mis creencias y bloqueos mentales',
    'Mis espacios físicos',
  ],
  evolveAtt: [
    'Estoy muy motivado y quiero cambios ya',
    'Quiero ir de a poco pero con foco',
    'Me cuesta mantener constancia pero quiero intentar',
  ],
  fBody: [
    '🏃‍♂️ Actividad física regular (Energía)',
    '🥗 Alimentación saludable (Nutrición)',
    '😴 Dormir y descansar mejor (Sueño)',
    '🛀 Relajación y pausas para recuperar el cuerpo (Recuperación)',
    '💧 Tomar más agua o hidratarte mejor (Hidratación)',
    '🧼 Higiene y cuidado personal diario (Higiene)',
    '🌅 Sentirte con más energía y vitalidad al despertar (Vitalidad)',
    '💺 Mejorar tu postura y ergonomía (Postura)',
    '🧘‍♂️ Flexibilidad y movilidad corporal (Movilidad)',
    '🚫 Reducir consumo de alcohol, tabaco o cafeína (Moderación)',
  ],
  fSoul: [
    '🤝 Fortalecer relaciones y vínculos personales (Conexión)',
    '🌌 Practicar espiritualidad o sentir plenitud interior (Espiritualidad)',
    '🎯 Definir tu propósito y dirección en la vida (Propósito)',
    '⚖️ Vivir más alineado a tus valores (Valores)',
    '💗 Ayudar a otros o aportar a una causa (Altruismo)',
    '🔍 Conocerte más profundamente (Insight)',
    '🙏 Practicar gratitud o tener una actitud positiva (Gratitud)',
    '🌳 Conectarte más con la naturaleza (Naturaleza)',
    '🎉 Jugar, reír y divertirte sin culpa (Gozo)',
    '🪞 Trabajar tu autoestima y hablarte con más amabilidad (Autoestima)',
  ],
  fMind: [
    '🎯 Mejorar tu enfoque y productividad diaria (Enfoque)',
    '📚 Aprender cosas nuevas o estudiar mejor (Aprendizaje)',
    '🎨 Desarrollar tu creatividad e ideas nuevas (Creatividad)',
    '😵‍💫 Manejar mejor el estrés o ansiedad (Gestión)',
    '🧠 Regular tus emociones y reacciones (Autocontrol)',
    '💪 Ser más resiliente frente a desafíos (Resiliencia)',
    '🗂️ Tener tus tareas o espacios mentales más organizados (Orden)',
    '🚀 Desarrollarte profesionalmente o avanzar en tu carrera (Proyección)',
    '💰 Mejorar tus hábitos financieros (Finanzas)',
    '🧩 Ejercitar tu memoria y agilidad mental (Agilidad)',
  ],
};

const MODE_LABELS = {
  LOW: 'Low Mood 🪫 - Quiero un cambio, pero no tengo la energia',
  CHILL: 'Chill Mood 🌿 - Estoy  bien, quiero trackear mis hábitos',
  FLOW: 'Flow Mood 🌊 - Tengo un objetivo y quiero comenzar esta aventura',
  EVOLVE: 'Evolve Mood 🧬 - Estoy enfocado y quiero ir al próximo nivel',
};

const state = {
  xp: { Body: 0, Mind: 0, Soul: 0, total: 0 },
  answers: {
    email: '',
    mode: null,
    low: { body: [], soul: [], mind: [], note: '' },
    chill: { oneThing: '', motiv: [] },
    flow: { goal: '', imped: [] },
    evolve: { goal: '', trade: [], att: '' },
    foundations: { body: [], soul: [], mind: [], bodyOpen: '', soulOpen: '', mindOpen: '' },
  },
  routeScreens: [],
  stepIndex: 0,
  sending: false,
};

const LISTS = {
  lowBody: FORM_LABELS.lowBody,
  lowSoul: FORM_LABELS.lowSoul,
  lowMind: FORM_LABELS.lowMind,
  chillMotiv: FORM_LABELS.chillMotiv,
  flowImped: FORM_LABELS.flowObstacles,
  evolveTrade: FORM_LABELS.evolveCommit,
  evolveAtt: FORM_LABELS.evolveAtt,
  fBody: FORM_LABELS.fBody,
  fSoul: FORM_LABELS.fSoul,
  fMind: FORM_LABELS.fMind,
};

const OPEN_FOUND = {
  'scr-f-body': 'fBodyOpen2',
  'scr-f-soul': 'fSoulOpen2',
  'scr-f-mind': 'fMindOpen2',
};

// === HUD: barra de progreso, XP y resúmenes ===============================
// Este bloque encapsula toda la lógica visual del encabezado (HUD). Mantiene
// la barra de progreso, reparte XP entre los pilares y arma el resumen final
// que mostramos antes del envío.
function buildHud({ state }) {
  // Mostramos un toast simpático en la esquina para dar feedback inmediato.
  function showToast(message) {
    const toastNode = byId('toast');
    if (!toastNode) return;
    setText(toastNode, message);
    toastNode.classList.add('show');
    window.setTimeout(() => toastNode.classList.remove('show'), 1100);
  }

  // Actualizamos la barra de progreso y los medidores de XP por pilar.
  function updateProgress() {
    const totalScreens = state.routeScreens.length;
    let percent = 0;
    if (totalScreens > 1) {
      percent = Math.min(
        100,
        Math.max(0, Math.round((state.stepIndex / (totalScreens - 1)) * 100))
      );
    }
    const fill = byId('progressFill');
    if (fill) fill.style.width = `${percent}%`;

    // Cada barra muestra el avance por cuerpo, mente y alma.
    ['Body', 'Mind', 'Soul'].forEach((key) => {
      const bar = byId(`bar${key}`);
      if (bar) bar.value = Math.min(Math.round(state.xp[key]), 100);
    });

    const xpTotal = byId('xpTotal');
    if (xpTotal) {
      setText(xpTotal, Math.round(state.xp.Body + state.xp.Mind + state.xp.Soul));
    }
  }

  // Sumamos XP distribuyéndolo entre los pilares y refrescamos el HUD.
  function addXp(amount, pillar) {
    if (amount <= 0) return;
    const round = (num) => Math.round(num * 100) / 100;
    if (pillar === 'ALL') {
      ['Body', 'Mind', 'Soul'].forEach((key) => {
        state.xp[key] = round(state.xp[key] + amount / 3);
      });
    } else {
      state.xp[pillar] = round(state.xp[pillar] + amount);
    }
    state.xp.total = round(state.xp.Body + state.xp.Mind + state.xp.Soul);
    updateProgress();
  }

  // Armamos el HTML del resumen final para que la persona valide sus datos.
  function paintSummary() {
    const box = byId('summaryBox');
    if (!box) return;
    const formatList = (arr) => (arr && arr.length ? arr.join(', ') : '—');
    const { answers, xp } = state;

    const lowBlock = `
    <div><strong>LOW · Body:</strong> ${formatList(answers.low.body)}</div>
    <div><strong>LOW · Soul:</strong> ${formatList(answers.low.soul)}</div>
    <div><strong>LOW · Mind:</strong> ${formatList(answers.low.mind)}</div>
    ${answers.low.note ? `<div><strong>Nota:</strong> ${answers.low.note}</div>` : ''}
  `;

    const modeBlocks = `
    ${
      answers.mode === 'CHILL'
        ? `<div><strong>CHILL · Objetivo:</strong> ${answers.chill.oneThing}</div><div><strong>CHILL · Motivaciones:</strong> ${formatList(answers.chill.motiv)}</div>`
        : ''
    }
    ${
      answers.mode === 'FLOW'
        ? `<div><strong>FLOW · Objetivo:</strong> ${answers.flow.goal}</div><div><strong>FLOW · Impedimentos:</strong> ${formatList(answers.flow.imped)}</div>`
        : ''
    }
    ${
      answers.mode === 'EVOLVE'
        ? `<div><strong>EVOLVE · Objetivo:</strong> ${answers.evolve.goal}</div><div><strong>EVOLVE · Ajustes:</strong> ${formatList(answers.evolve.trade)}</div><div><strong>EVOLVE · Actitud:</strong> ${answers.evolve.att}</div>`
        : ''
    }
    <hr style="border:0;border-top:1px solid var(--ring);margin:8px 0">
    <div><strong>Foundations · Body:</strong> ${formatList(answers.foundations.body)}</div>
    <div><strong>Foundations · Soul:</strong> ${formatList(answers.foundations.soul)}</div>
    <div><strong>Foundations · Mind:</strong> ${formatList(answers.foundations.mind)}</div>
  `;

    const summaryHtml = `
    <div><strong>Game Mode:</strong> ${answers.mode || '—'}</div>
    <div><strong>Email:</strong> ${answers.email || '—'}</div>
    <hr style="border:0;border-top:1px solid var(--ring);margin:8px 0">
    ${answers.mode === 'LOW' ? lowBlock : modeBlocks}
    <hr style="border:0;border-top:1px solid var(--ring);margin:8px 0">
    <div><strong>🫀 Body:</strong> ${Math.round(xp.Body)} XP</div>
    <div><strong>🧠 Mind:</strong> ${Math.round(xp.Mind)} XP</div>
    <div><strong>🏵️ Soul:</strong> ${Math.round(xp.Soul)} XP</div>
    <div style="margin-top:6px"><strong>Total:</strong> ${Math.round(xp.total)} XP</div>
  `;
    setHTML(box, summaryHtml);
  }

  return {
    showToast,
    updateProgress,
    addXp,
    paintSummary,
  };
}

// === Navegación: pantallas y rutas =========================================
// Orquesta los cambios de pantalla, determina el camino según el modo elegido
// y registra los listeners de teclado/botones que permiten recorrer el journey.
function buildNavigator({ state, updateProgress, paintSummary }) {
  function showScreen(id) {
    qsa('.scr').forEach((section) => section.classList.remove('active'));
    const section = byId(id);
    if (section) section.classList.add('active');
    updateProgress();
  }

  function goToScreen(id) {
    const idx = state.routeScreens.indexOf(id);
    if (idx >= 0) {
      state.stepIndex = idx;
    }
    showScreen(id);
  }

  function nextStep() {
    const next = Math.min(state.routeScreens.length - 1, state.stepIndex + 1);
    state.stepIndex = next;
    const target = state.routeScreens[next];
    if (target) {
      showScreen(target);
      if (target === 'scr-summary') {
        paintSummary();
      }
    }
  }

  function prevStep() {
    state.stepIndex = Math.max(0, state.stepIndex - 1);
    const target = state.routeScreens[state.stepIndex];
    if (target) showScreen(target);
  }

  function doOnce(sectionId, action) {
    const section = byId(sectionId);
    if (!section) return;
    if (section.dataset.done === '1') {
      nextStep();
      return;
    }
    action();
    section.dataset.done = '1';
    nextStep();
  }

  function resetAll() {
    state.xp = { Body: 0, Mind: 0, Soul: 0, total: 0 };
    state.answers = {
      email: '',
      mode: null,
      low: { body: [], soul: [], mind: [], note: '' },
      chill: { oneThing: '', motiv: [] },
      flow: { goal: '', imped: [] },
      evolve: { goal: '', trade: [], att: '' },
      foundations: { body: [], soul: [], mind: [], bodyOpen: '', soulOpen: '', mindOpen: '' },
    };
    state.routeScreens = [];
    state.stepIndex = 0;
    state.sending = false;

    qsa("input[type='email'], input[type='text'], textarea").forEach((el) => {
      el.value = '';
    });
    qsa("input[type='checkbox'], input[type='radio']").forEach((el) => {
      el.checked = false;
    });
    qsa('.card.selected').forEach((card) => card.classList.remove('selected'));
    [
      'confirmMode',
      'confirmChillOpen',
      'confirmFlowGoal',
      'confirmEvolveGoal',
      'confirmChillMotiv',
      'confirmFlowImped',
      'confirmEvolveTrade',
      'confirmEvolveAtt',
      'confirmLowBody',
      'confirmLowSoul',
      'confirmLowMind',
      'confirmFBody',
      'confirmFSoul',
      'confirmFMind',
    ].forEach((id) => {
      const btn = byId(id);
      if (btn) btn.disabled = true;
    });
    qsa('.scr').forEach((section) => {
      delete section.dataset.done;
      delete section.dataset.openDone;
    });
    updateProgress();
    showScreen('scr-intro');
  }

  function buildRoutes() {
    const routes = {
      LOW: ['scr-low-body', 'scr-low-soul', 'scr-low-mind', 'scr-low-note', 'scr-summary'],
      CHILL: ['scr-chill-open', 'scr-chill-motiv', 'scr-f-body', 'scr-f-soul', 'scr-f-mind', 'scr-summary'],
      FLOW: ['scr-flow-goal', 'scr-flow-imped', 'scr-f-body', 'scr-f-soul', 'scr-f-mind', 'scr-summary'],
      EVOLVE: ['scr-evolve-goal', 'scr-evolve-trade', 'scr-evolve-att', 'scr-f-body', 'scr-f-soul', 'scr-f-mind', 'scr-summary'],
    };
    state.routeScreens = routes[state.answers.mode] || [];
    state.stepIndex = 0;
    const first = state.routeScreens[0] || 'scr-intro';
    goToScreen(first);
  }

  function setupNavigation() {
    const cleanups = [];

    const keyHandler = (event) => {
      if (event.key === 'ArrowLeft') prevStep();
      if (event.key === 'ArrowRight') nextStep();
    };
    cleanups.push(on(document, 'keydown', keyHandler));

    const restart = byId('restart');
    if (restart) cleanups.push(on(restart, 'click', resetAll));

    const hudTitle = byId('hudTitle');
    if (hudTitle) {
      const handleHudClick = () => {
        if (!state.xp.total || window.confirm('¿Salir y volver al inicio? Se perderá el progreso.')) {
          window.location.href = 'https://rfullivarri.github.io/gamificationweblanding/indexv2.html';
        }
      };
      cleanups.push(on(hudTitle, 'click', handleHudClick));
    }

    const backIntro = byId('backIntro') || byId('backToIntro');
    if (backIntro) cleanups.push(on(backIntro, 'click', () => showScreen('scr-intro')));

    const goToMap = {
      backToModes1: 'scr-modes',
      backToModes2: 'scr-modes',
      backToModes3: 'scr-modes',
      backToModes4: 'scr-modes',
      backEvolveGoal: 'scr-evolve-goal',
    };
    Object.entries(goToMap).forEach(([id, target]) => {
      const btn = byId(id);
      if (btn) {
        cleanups.push(on(btn, 'click', () => goToScreen(target)));
      }
    });

    const prevIds = [
      'backLowBody',
      'backLowSoul',
      'backLowMind',
      'backChillOpen',
      'backFlowGoal',
      'backEvolveTrade',
      'backFoundPrev1',
      'backFBody',
      'backFSoul',
    ];
    prevIds.forEach((id) => {
      const btn = byId(id);
      if (btn) cleanups.push(on(btn, 'click', prevStep));
    });

    return () => {
      while (cleanups.length) {
        const cleanup = cleanups.pop();
        try {
          cleanup();
        } catch (error) {
          console.error('[formsintrov2] Error al limpiar navegación', error);
        }
      }
    };
  }

  return {
    showScreen,
    goToScreen,
    nextStep,
    prevStep,
    doOnce,
    resetAll,
    buildRoutes,
    setupNavigation,
  };
}

// === Payload: helpers para exponer el estado ===============================
// Aquí armamos un objeto global con getters para las respuestas y el XP, y un
// builder que sabe generar el JSON final listo para enviar al worker.
function buildPayloadTools({ state, modeLabels }) {
  function buildPayloadHelpers() {
    const keyCID = 'gj_client_id';

    function getClientId() {
      try {
        let cid = localStorage.getItem(keyCID);
        if (!cid) {
          cid = window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `cid-${Math.random().toString(36).slice(2)}${Date.now()}`;
          localStorage.setItem(keyCID, cid);
        }
        return cid;
      } catch (_error) {
        return `cid-${Date.now()}`;
      }
    }

    function meta() {
      let tz = '';
      try {
        tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      } catch (_error) {
        tz = '';
      }
      const lang = (navigator.language || '').toLowerCase();
      const ua = (navigator.userAgent || '').toLowerCase();
      const device = /mobi|android/.test(ua) ? 'mobile' : 'desktop';
      return { tz, lang, device, version: 'formsintrov2' };
    }

    // Dejamos helpers globales para depurar con facilidad.
    window.JOURNEY_STATE = {
      get answers() {
        return state.answers;
      },
      get xp() {
        return state.xp;
      },
    };

    window.GJPayload = {
      build() {
        const answers = window.JOURNEY_STATE?.answers || {};
        const xp = window.JOURNEY_STATE?.xp || { Body: 0, Mind: 0, Soul: 0, total: 0 };
        const payload = {
          email: answers.email,
          mode: answers.mode,
          mode_label: modeLabels[answers.mode] || '',
          answers,
          xp,
          meta: meta(),
          client_id: getClientId(),
          timestamp: new Date().toISOString(),
        };
        return payload;
      },
    };
  }

  return {
    buildPayloadHelpers,
  };
}

// === Servicios: envío al worker y feedback ================================
// Este bloque se encarga del botón final, genera el submit y maneja los casos
// de error con mensajes amables. Mantiene además los loaders y el redirect.
function buildServiceActions({ state, showToast, workerUrl, redirectUrl }) {
  async function sendPayload() {
    if (state.sending) return;
    state.sending = true;
    const finishBtn = byId('finish');
    if (!finishBtn) {
      state.sending = false;
      return;
    }

    const originalText = finishBtn.textContent;
    finishBtn.disabled = true;
    finishBtn.classList.add('loading');
    finishBtn.setAttribute('aria-busy', 'true');
    finishBtn.textContent = 'Enviando…';

    try {
      const payload = window.GJPayload?.build?.();
      if (!payload) throw new Error('payload_build_failed');
      if (!payload.email) throw new Error('email_required');
      if (!payload.mode) throw new Error('mode_required');

      const response = await retryOperation(
        () => postJson(workerUrl, payload),
        { retries: 2, retryDelay: (attempt) => 800 * (attempt + 1) }
      );
      if (!response || response.ok === false) {
        throw new Error(response?.error || 'worker_error');
      }

      try {
        sessionStorage.setItem('gj_email', payload.email || '');
        sessionStorage.setItem('gj_client_id', response.client_id || payload.client_id || '');
        window._lastClientId = response.client_id || payload.client_id || '';
      } catch (_error) {
        // Si storage falla seguimos igual: no es crítico para el flujo.
      }

      window.location.href = redirectUrl;
    } catch (error) {
      console.error('[onboarding] send error:', error);
      showToast('No pudimos enviar. Probá de nuevo.');
      finishBtn.classList.remove('loading');
      finishBtn.removeAttribute('aria-busy');
      finishBtn.disabled = false;
      finishBtn.textContent = originalText;
      state.sending = false;
    }
  }

  function setupFinishButton() {
    const finish = byId('finish');
    if (!finish) return () => {};
    return on(finish, 'click', (event) => {
      event.preventDefault();
      sendPayload();
    });
  }

  return {
    sendPayload,
    setupFinishButton,
  };
}

// === Utilidades compartidas =================================================
// Atajo para consultar selectores dentro de un scope (por defecto document).
function $$(selector, scope = document) {
  return qsa(selector, scope);
}

// Permite agrupar listeners y limpiarlos en bloque, dejando logs si algo falla.
function makeCleanupGroup(cleanups, label) {
  return () => {
    while (cleanups.length) {
      const cleanup = cleanups.pop();
      try {
        cleanup();
      } catch (error) {
        console.error(`[formsintrov2] ${label}`, error);
      }
    }
  };
}

// Guardamos referencias de limpieza para ejecutar al hacer teardown.
function rememberCleanup(fn) {
  if (typeof fn === 'function') {
    cleanupFns.push(fn);
  }
}

let hud = null;
let journeyNav = null;
let payloadHelpers = null;
let serviceActions = null;
let initialized = false;
const cleanupFns = [];

// === Selección de modo y primer paso =======================================
// Estas funciones manejan las cartas de modo y la transición inicial.
function handleModeSelection(card, mode) {
  $$('#modeGrid .card').forEach((node) => node.classList.remove('selected'));
  card.classList.add('selected');
  const confirm = byId('confirmMode');
  if (confirm) confirm.disabled = false;
  state.answers.mode = mode;
}

function setupModeGrid() {
  // Armamos los listeners de la grilla de modos y el botón de confirmación.
  const cleanups = [];
  const grid = byId('modeGrid');
  if (grid) {
    cleanups.push(delegate(grid, 'click', '.card', (event, card) => {
      const mode = card.dataset.mode;
      if (!mode) return;
      handleModeSelection(card, mode);
    }));
  }

  const confirmMode = byId('confirmMode');
  if (confirmMode) {
    cleanups.push(on(confirmMode, 'click', () => {
      if (!state.answers.mode) return;
      const label = MODE_LABELS[state.answers.mode];
      if (label) state.answers.modeLabel = label;
      const startScreens = {
        LOW: 'scr-low-body',
        CHILL: 'scr-chill-open',
        FLOW: 'scr-flow-goal',
        EVOLVE: 'scr-evolve-goal',
      };
      // Calculamos la ruta personalizada y saltamos a la primera pantalla real.
      journeyNav.buildRoutes();
      journeyNav.goToScreen(startScreens[state.answers.mode]);
    }));
  }

  return makeCleanupGroup(cleanups, 'Error al limpiar modo');
}

// === Captura de email y arranque del flujo ================================
function setupEmailIntro() {
  // Validamos el correo en vivo y abrimos el flujo cuando está correcto.
  const cleanups = [];
  const introForm = byId('introForm');
  const emailInput = byId('emailInput');
  const goBtn = byId('goModes');
  if (!emailInput || !goBtn) return () => {};

  if (String(goBtn.tagName).toUpperCase() === 'BUTTON') goBtn.type = 'submit';

  const normalize = (value) => String(value || '').trim().toLowerCase();
  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const readEmail = () => {
    if (introForm) {
      const values = serializeForm(introForm);
      if (values.email !== undefined) {
        return normalize(values.email);
      }
    }
    return normalize(emailInput.value);
  };

  const setEnabled = (ok) => {
    goBtn.disabled = !ok;
    if (ok && goBtn.hasAttribute('disabled')) {
      goBtn.removeAttribute('disabled');
    }
  };

  const saveEmail = (value) => {
    state.answers.email = value;
    window.GJ_EMAIL = value;
  };

  const refresh = () => {
    const value = readEmail();
    const ok = isEmail(value);
    setEnabled(ok);
    saveEmail(value);
  };

  const handleStart = (event) => {
    event.preventDefault();
    refresh();
    const value = readEmail();
    if (!isEmail(value)) {
      if (typeof hud?.showToast === 'function') {
        hud.showToast('Poné un correo válido ✉');
      }
      setEnabled(false);
      return;
    }
    // Reutilizamos la misma lógica de rutas que más adelante al confirmar modo.
    journeyNav.buildRoutes();
    journeyNav.goToScreen(state.routeScreens[0] || 'scr-modes');
  };

  ['input', 'change', 'paste', 'blur', 'compositionend'].forEach((evt) => {
    cleanups.push(on(emailInput, evt, refresh));
  });

  cleanups.push(on(goBtn, 'click', handleStart));
  if (introForm) {
    cleanups.push(on(introForm, 'submit', handleStart));
  }

  refresh();

  return makeCleanupGroup(cleanups, 'Error al limpiar email intro');
}

// === Helpers para leer inputs ==============================================
function getCheckedTexts(scopeSelector) {
  return $$(`${scopeSelector} input:checked`).map((input) => {
    const parent = input.parentElement;
    return parent ? parent.textContent.trim() : '';
  });
}

function getRadioText(scopeSelector) {
  const match = $$(`${scopeSelector} input[type="radio"]`).find((input) => input.checked);
  return match ? match.parentElement.textContent.trim() : '';
}

// === Respuestas abiertas (textareas) =======================================
function setupTextAreas() {
  // Cada textarea valida mínimo de contenido y suma XP cuando confirma.
  const cleanups = [];
  const lowNote = byId('lowNote');
  const confirmLowNote = byId('confirmLowNote');
  if (confirmLowNote) {
    cleanups.push(on(confirmLowNote, 'click', () => {
      journeyNav.doOnce('scr-low-note', () => {
        const value = lowNote?.value.trim() || '';
        state.answers.low.note = value;
        if (value) {
          const xpValue = Number(byId('scr-low-note')?.dataset?.xp || 21);
          hud.addXp(xpValue, 'ALL');
          hud.showToast(`+${xpValue} XP`);
        }
      });
    }));
  }

  const chillOneThing = byId('chillOneThing');
  const confirmChillOpen = byId('confirmChillOpen');
  if (chillOneThing && confirmChillOpen) {
    const update = () => {
      const value = chillOneThing.value.trim();
      confirmChillOpen.disabled = value.length < 1;
    };
    cleanups.push(on(chillOneThing, 'input', update));
    update();
    cleanups.push(on(confirmChillOpen, 'click', () => {
      journeyNav.doOnce('scr-chill-open', () => {
        state.answers.chill.oneThing = chillOneThing.value.trim();
        hud.addXp(21, 'ALL');
        hud.showToast('+21 XP');
      });
    }));
  }

  const flowGoal = byId('flowGoal');
  const confirmFlowGoal = byId('confirmFlowGoal');
  if (flowGoal && confirmFlowGoal) {
    const update = () => {
      confirmFlowGoal.disabled = flowGoal.value.trim().length < 1;
    };
    cleanups.push(on(flowGoal, 'input', update));
    update();
    cleanups.push(on(confirmFlowGoal, 'click', () => {
      journeyNav.doOnce('scr-flow-goal', () => {
        state.answers.flow.goal = flowGoal.value.trim();
        hud.addXp(21, 'ALL');
        hud.showToast('+21 XP');
      });
    }));
  }

  const evolveGoal = byId('evolveGoal');
  const confirmEvolveGoal = byId('confirmEvolveGoal');
  if (evolveGoal && confirmEvolveGoal) {
    const update = () => {
      confirmEvolveGoal.disabled = evolveGoal.value.trim().length < 1;
    };
    cleanups.push(on(evolveGoal, 'input', update));
    update();
    cleanups.push(on(confirmEvolveGoal, 'click', () => {
      journeyNav.doOnce('scr-evolve-goal', () => {
        state.answers.evolve.goal = evolveGoal.value.trim();
        hud.addXp(21, 'ALL');
        hud.showToast('+21 XP');
      });
    }));
  }

  return makeCleanupGroup(cleanups, 'Error al limpiar text areas');
}

// === Listas de selección según modo ========================================
function setupModeLists() {
  // Cada bloque vigila la cantidad mínima de ítems antes de habilitar continuar.
  const cleanups = [];

  const chillInputs = $$('#chillMotivList input');
  const confirmChillMotiv = byId('confirmChillMotiv');
  if (confirmChillMotiv) {
    const update = () => {
      confirmChillMotiv.disabled = chillInputs.filter((i) => i.checked).length < 1;
    };
    chillInputs.forEach((input) => cleanups.push(on(input, 'change', update)));
    update();
    cleanups.push(on(confirmChillMotiv, 'click', () => {
      journeyNav.doOnce('scr-chill-motiv', () => {
        state.answers.chill.motiv = getCheckedTexts('#chillMotivList');
        hud.addXp(13, 'ALL');
        hud.showToast('+13 XP');
      });
    }));
  }

  const flowInputs = $$('#flowImpedList input');
  const confirmFlowImped = byId('confirmFlowImped');
  if (confirmFlowImped) {
    const update = () => {
      confirmFlowImped.disabled = flowInputs.filter((i) => i.checked).length < 1;
    };
    flowInputs.forEach((input) => cleanups.push(on(input, 'change', update)));
    update();
    cleanups.push(on(confirmFlowImped, 'click', () => {
      journeyNav.doOnce('scr-flow-imped', () => {
        state.answers.flow.imped = getCheckedTexts('#flowImpedList');
        hud.addXp(13, 'ALL');
        hud.showToast('+13 XP');
      });
    }));
  }

  const evolveTradeInputs = $$('#evolveTradeList input');
  const confirmEvolveTrade = byId('confirmEvolveTrade');
  if (confirmEvolveTrade) {
    const update = () => {
      confirmEvolveTrade.disabled = evolveTradeInputs.filter((i) => i.checked).length < 1;
    };
    evolveTradeInputs.forEach((input) => cleanups.push(on(input, 'change', update)));
    update();
    cleanups.push(on(confirmEvolveTrade, 'click', () => {
      journeyNav.doOnce('scr-evolve-trade', () => {
        state.answers.evolve.trade = getCheckedTexts('#evolveTradeList');
        hud.addXp(13, 'ALL');
        hud.showToast('+13 XP');
      });
    }));
  }

  const evolveAttInputs = $$('#evolveAttList input');
  const confirmEvolveAtt = byId('confirmEvolveAtt');
  if (confirmEvolveAtt) {
    const update = () => {
      confirmEvolveAtt.disabled = !evolveAttInputs.some((i) => i.checked);
    };
    evolveAttInputs.forEach((input) => cleanups.push(on(input, 'change', update)));
    update();
    cleanups.push(on(confirmEvolveAtt, 'click', () => {
      journeyNav.doOnce('scr-evolve-att', () => {
        state.answers.evolve.att = getRadioText('#evolveAttList');
        hud.addXp(21, 'ALL');
        hud.showToast('+21 XP');
      });
    }));
  }

  return makeCleanupGroup(cleanups, 'Error al limpiar listas de modo');
}

// === Renderizado y binding de checklists ===================================
function paintChecklist(listId, items, type = 'checkbox', nameGroup = 'grp') {
  // Generamos dinámicamente cada chip de selección usando el catálogo indicado.
  const host = byId(listId);
  if (!host) return;
  setHTML(host, '');
  items.forEach((text, index) => {
    const inputId = `${listId}-${index}`;
    const label = createElement('label', { className: 'chip' });
    label.setAttribute('for', inputId);
    const input = createElement('input', { type });
    if (type === 'radio') input.name = nameGroup;
    input.id = inputId;
    const span = createElement('span', { textContent: text });
    label.appendChild(input);
    label.appendChild(span);
    host.appendChild(label);
  });
}

function bindLimitedChecklist(sectionId, listId, countId, storeArrRef, openTextareaId = null) {
  // Controla límites de selección, suma XP y guarda los textos elegidos.
  const section = byId(sectionId);
  if (!section) return () => {};
  const cleanups = [];
  const max = Number(section.dataset.limit || 5);
  const inputs = $$(`#${listId} input`);
  const counter = byId(countId);

  const confirmMap = {
    'scr-low-body': 'confirmLowBody',
    'scr-low-soul': 'confirmLowSoul',
    'scr-low-mind': 'confirmLowMind',
    'scr-f-body': 'confirmFBody',
    'scr-f-soul': 'confirmFSoul',
    'scr-f-mind': 'confirmFMind',
  };
  const confirmBtn = byId(confirmMap[sectionId]);
  if (!confirmBtn) return () => {};

  function update() {
    const selected = inputs.filter((input) => input.checked);
    // Si se supera el máximo permitido desmarcamos el último clic.
    if (selected.length > max) {
      selected[selected.length - 1].checked = false;
    }
    const current = inputs.filter((input) => input.checked).length;
    // Mostramos el contador en vivo y habilitamos el botón cuando hay al menos uno.
    if (counter) setText(counter, String(current));
    confirmBtn.disabled = current < 1;
  }

  inputs.forEach((input) => cleanups.push(on(input, 'change', update)));
  update();

  cleanups.push(on(confirmBtn, 'click', () => {
    if (openTextareaId) {
      const textarea = byId(openTextareaId);
      const value = textarea?.value.trim() || '';
      const keyMap = {
        'scr-f-body': 'bodyOpen',
        'scr-f-soul': 'soulOpen',
        'scr-f-mind': 'mindOpen',
        'scr-low-body': 'bodyOpen',
        'scr-low-soul': 'soulOpen',
        'scr-low-mind': 'mindOpen',
      };
      const key = keyMap[sectionId];
      if (key) state.answers.foundations[key] = value;
      if (value && section.dataset.openDone !== '1') {
        hud.addXp(21, 'ALL');
        hud.showToast('+21 XP');
        section.dataset.openDone = '1';
      }
    }

    // Solo otorgamos XP la primera vez que se confirma la sección.
    if (section.dataset.done !== '1') {
      storeArrRef.length = 0;
      getCheckedTexts(`#${listId}`).forEach((text) => storeArrRef.push(text));
      const xpValue = Number(section.dataset.xp || 13);
      const pillar = section.dataset.pillar;
      hud.addXp(xpValue, pillar);
      hud.showToast(`+${xpValue} XP`);
      section.dataset.done = '1';
    }
    journeyNav.nextStep();
  }));

  return makeCleanupGroup(cleanups, `Error al limpiar checklist ${sectionId}`);
}

function setupChecklistBindings() {
  // Enlazamos cada sección con su checklist correspondiente.
  const cleanups = [];
  cleanups.push(bindLimitedChecklist('scr-low-body', 'lowBodyList', 'lowBodyCount', state.answers.low.body, 'fBodyOpen'));
  cleanups.push(bindLimitedChecklist('scr-low-soul', 'lowSoulList', 'lowSoulCount', state.answers.low.soul, 'fSoulOpen'));
  cleanups.push(bindLimitedChecklist('scr-low-mind', 'lowMindList', 'lowMindCount', state.answers.low.mind, 'fMindOpen'));
  cleanups.push(bindLimitedChecklist('scr-f-body', 'fBodyList', 'fBodyCount', state.answers.foundations.body, 'fBodyOpen2'));
  cleanups.push(bindLimitedChecklist('scr-f-soul', 'fSoulList', 'fSoulCount', state.answers.foundations.soul, 'fSoulOpen2'));
  cleanups.push(bindLimitedChecklist('scr-f-mind', 'fMindList', 'fMindCount', state.answers.foundations.mind, 'fMindOpen2'));
  return makeCleanupGroup(cleanups, 'Error al limpiar checklists');
}

// === Notas abiertas en foundations =========================================
function setupFoundationsOpens() {
  // Guarda los textos libres que amplían la selección de foundations.
  const cleanups = [];
  Object.entries(OPEN_FOUND).forEach(([sectionId, textareaId]) => {
    const textarea = byId(textareaId);
    if (!textarea) return;
    cleanups.push(on(textarea, 'blur', () => {
      const value = textarea.value.trim();
      const mapKey = { 'scr-f-body': 'bodyOpen', 'scr-f-soul': 'soulOpen', 'scr-f-mind': 'mindOpen' }[sectionId];
      if (mapKey) state.answers.foundations[mapKey] = value;
    }));
  });
  return makeCleanupGroup(cleanups, 'Error al limpiar foundations open');
}

// === Punto de entrada: render inicial de todas las listas ===================
function mountLists() {
  // Pintamos cada checklist una única vez durante la inicialización.
  paintChecklist('lowBodyList', LISTS.lowBody);
  paintChecklist('lowSoulList', LISTS.lowSoul);
  paintChecklist('lowMindList', LISTS.lowMind);
  paintChecklist('fBodyList', LISTS.fBody);
  paintChecklist('fSoulList', LISTS.fSoul);
  paintChecklist('fMindList', LISTS.fMind);
  paintChecklist('chillMotivList', LISTS.chillMotiv);
  paintChecklist('flowImpedList', LISTS.flowImped);
  paintChecklist('evolveTradeList', LISTS.evolveTrade);
  paintChecklist('evolveAttList', LISTS.evolveAtt, 'radio', 'evolveAtt');
}

// === Ciclo de vida del feature ==============================================
function init() {
  if (initialized) return;
  initialized = true;

  // Levantamos cada bloque autónomo pasando solo lo que necesita.
  hud = buildHud({ state });
  journeyNav = buildNavigator({
    state,
    updateProgress: hud.updateProgress,
    paintSummary: hud.paintSummary,
  });
  payloadHelpers = buildPayloadTools({ state, modeLabels: MODE_LABELS });
  serviceActions = buildServiceActions({
    state,
    showToast: hud.showToast,
    workerUrl: WORKER_URL,
    redirectUrl: REDIRECT_URL,
  });

  cleanupFns.length = 0;

  // Render inicial + listeners por secciones.
  mountLists();
  rememberCleanup(setupChecklistBindings());
  rememberCleanup(setupModeGrid());
  rememberCleanup(setupEmailIntro());
  rememberCleanup(setupTextAreas());
  rememberCleanup(setupModeLists());
  rememberCleanup(journeyNav.setupNavigation());
  rememberCleanup(setupFoundationsOpens());
  rememberCleanup(serviceActions.setupFinishButton());

  // Exponemos helpers globales y dejamos listo el HUD.
  payloadHelpers.buildPayloadHelpers();
  hud.updateProgress();
  window.toast = hud.showToast;
}

function teardown() {
  // Recorremos todas las limpiezas registradas y dejamos el estado listo.
  while (cleanupFns.length) {
    const cleanup = cleanupFns.pop();
    try {
      cleanup();
    } catch (error) {
      console.error('[formsintrov2] Error al limpiar listeners', error);
    }
  }
  delete window.toast;
  initialized = false;
  hud = null;
  journeyNav = null;
  payloadHelpers = null;
  serviceActions = null;
  state.sending = false;
}

on(document, 'DOMContentLoaded', init);

export { init, teardown };

// Nota: mantenemos todo en un único archivo para priorizar lectura lineal del flujo.
