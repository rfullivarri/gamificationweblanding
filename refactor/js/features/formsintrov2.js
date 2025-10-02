/**
 * Módulo: FormsIntroV2
 * Propósito: encapsular el wizard de onboarding y su envío final.
 * API pública: se inicializa solo al cargar la página.
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
} from '../utils/dom.js';
import { postJson } from '../utils/net.js';

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

function $$(selector, scope = document) {
  return qsa(selector, scope);
}

function toast(message) {
  const toastEl = byId('toast');
  if (!toastEl) return;
  setText(toastEl, message);
  toastEl.classList.add('show');
  window.setTimeout(() => toastEl.classList.remove('show'), 1100);
}

function drawProgress() {
  const total = state.routeScreens.length;
  let pct = 0;
  if (total > 1) {
    pct = Math.min(100, Math.max(0, Math.round((state.stepIndex / (total - 1)) * 100)));
  }
  const fill = byId('progressFill');
  if (fill) fill.style.width = `${pct}%`;

  const barBody = byId('barBody');
  const barMind = byId('barMind');
  const barSoul = byId('barSoul');
  if (barBody) barBody.value = Math.min(Math.round(state.xp.Body), 100);
  if (barMind) barMind.value = Math.min(Math.round(state.xp.Mind), 100);
  if (barSoul) barSoul.value = Math.min(Math.round(state.xp.Soul), 100);

  const xpTotal = byId('xpTotal');
  if (xpTotal) setText(xpTotal, Math.round(state.xp.Body + state.xp.Mind + state.xp.Soul));
}

function addXP(amount, pillar) {
  if (amount <= 0) return;
  const fix = (num) => Math.round(num * 100) / 100;
  if (pillar === 'ALL') {
    ['Body', 'Mind', 'Soul'].forEach((key) => {
      state.xp[key] = fix(state.xp[key] + amount / 3);
    });
  } else {
    state.xp[pillar] = fix(state.xp[pillar] + amount);
  }
  state.xp.total = fix(state.xp.Body + state.xp.Mind + state.xp.Soul);
  drawProgress();
}

function showScreen(id) {
  $$('.scr').forEach((section) => section.classList.remove('active'));
  const section = byId(id);
  if (section) section.classList.add('active');
  drawProgress();
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
      renderSummary();
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

function paintChecklist(listId, items, type = 'checkbox', nameGroup = 'grp') {
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

function getCheckedTexts(scopeSelector) {
  return $$(`${scopeSelector} input:checked`).map((input) => {
    const parent = input.parentElement;
    return parent ? parent.textContent.trim() : '';
  });
}

function getRadioText(scopeSelector) {
  const match = $$( `${scopeSelector} input[type="radio"]` ).find((input) => input.checked);
  return match ? match.parentElement.textContent.trim() : '';
}

function bindLimitedChecklist(sectionId, listId, countId, storeArrRef, openTextareaId = null) {
  const section = byId(sectionId);
  if (!section) return;
  const max = Number(section.dataset.limit || 5);
  const inputs = $$( `#${listId} input` );
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
  if (!confirmBtn) return;

  function update() {
    const selected = inputs.filter((input) => input.checked);
    if (selected.length > max) {
      selected[selected.length - 1].checked = false;
    }
    const current = inputs.filter((input) => input.checked).length;
    if (counter) setText(counter, String(current));
    confirmBtn.disabled = current < 1;
  }

  inputs.forEach((input) => on(input, 'change', update));
  update();

  on(confirmBtn, 'click', () => {
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
        addXP(21, 'ALL');
        toast('+21 XP');
        section.dataset.openDone = '1';
      }
    }

    if (section.dataset.done !== '1') {
      storeArrRef.length = 0;
      getCheckedTexts(`#${listId}`).forEach((text) => storeArrRef.push(text));
      const xpValue = Number(section.dataset.xp || 13);
      const pillar = section.dataset.pillar;
      addXP(xpValue, pillar);
      toast(`+${xpValue} XP`);
      section.dataset.done = '1';
    }
    nextStep();
  });
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

  $$("input[type='email'], input[type='text'], textarea").forEach((el) => { el.value = ''; });
  $$("input[type='checkbox'], input[type='radio']").forEach((el) => { el.checked = false; });
  $$('.card.selected').forEach((card) => card.classList.remove('selected'));
  [
    'confirmMode', 'confirmChillOpen', 'confirmFlowGoal', 'confirmEvolveGoal',
    'confirmChillMotiv', 'confirmFlowImped', 'confirmEvolveTrade', 'confirmEvolveAtt',
    'confirmLowBody', 'confirmLowSoul', 'confirmLowMind', 'confirmFBody', 'confirmFSoul', 'confirmFMind',
  ].forEach((id) => {
    const btn = byId(id);
    if (btn) btn.disabled = true;
  });
  $$('.scr').forEach((section) => {
    delete section.dataset.done;
    delete section.dataset.openDone;
  });
  drawProgress();
  showScreen('scr-intro');
}

function renderSummary() {
  const box = byId('summaryBox');
  if (!box) return;
  const fmt = (arr) => (arr && arr.length ? arr.join(', ') : '—');
  const { answers, xp } = state;

  const lowBlock = `
    <div><strong>LOW · Body:</strong> ${fmt(answers.low.body)}</div>
    <div><strong>LOW · Soul:</strong> ${fmt(answers.low.soul)}</div>
    <div><strong>LOW · Mind:</strong> ${fmt(answers.low.mind)}</div>
    ${answers.low.note ? `<div><strong>Nota:</strong> ${answers.low.note}</div>` : ''}
  `;

  const modeBlocks = `
    ${answers.mode === 'CHILL' ? `<div><strong>CHILL · Objetivo:</strong> ${answers.chill.oneThing}</div><div><strong>CHILL · Motivaciones:</strong> ${fmt(answers.chill.motiv)}</div>` : ''}
    ${answers.mode === 'FLOW' ? `<div><strong>FLOW · Objetivo:</strong> ${answers.flow.goal}</div><div><strong>FLOW · Impedimentos:</strong> ${fmt(answers.flow.imped)}</div>` : ''}
    ${answers.mode === 'EVOLVE' ? `<div><strong>EVOLVE · Objetivo:</strong> ${answers.evolve.goal}</div><div><strong>EVOLVE · Ajustes:</strong> ${fmt(answers.evolve.trade)}</div><div><strong>EVOLVE · Actitud:</strong> ${answers.evolve.att}</div>` : ''}
    <hr style="border:0;border-top:1px solid var(--ring);margin:8px 0">
    <div><strong>Foundations · Body:</strong> ${fmt(answers.foundations.body)}</div>
    <div><strong>Foundations · Soul:</strong> ${fmt(answers.foundations.soul)}</div>
    <div><strong>Foundations · Mind:</strong> ${fmt(answers.foundations.mind)}</div>
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

function handleModeSelection(card, mode) {
  $$('#modeGrid .card').forEach((node) => node.classList.remove('selected'));
  card.classList.add('selected');
  const confirm = byId('confirmMode');
  if (confirm) confirm.disabled = false;
  state.answers.mode = mode;
}

function setupModeGrid() {
  const grid = byId('modeGrid');
  if (grid) {
    delegate(grid, 'click', '.card', (event, card) => {
      const mode = card.dataset.mode;
      if (!mode) return;
      handleModeSelection(card, mode);
    });
  }

  const confirmMode = byId('confirmMode');
  if (confirmMode) {
    on(confirmMode, 'click', () => {
      if (!state.answers.mode) return;
      const label = MODE_LABELS[state.answers.mode];
      if (label) state.answers.modeLabel = label;
      const startScreens = {
        LOW: 'scr-low-body',
        CHILL: 'scr-chill-open',
        FLOW: 'scr-flow-goal',
        EVOLVE: 'scr-evolve-goal',
      };
      buildRoutes();
      goToScreen(startScreens[state.answers.mode]);
    });
  }
}

function setupEmailIntro() {
  const emailInput = byId('emailInput');
  const goBtn = byId('goModes');
  if (!emailInput || !goBtn) return;
  if (String(goBtn.tagName).toUpperCase() === 'BUTTON') goBtn.type = 'button';
  const normalize = (value) => String(value || '').trim().toLowerCase();
  const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  function refresh() {
    const val = normalize(emailInput.value);
    const ok = isEmail(val);
    goBtn.disabled = !ok;
    state.answers.email = val;
    window.GJ_EMAIL = val;
  }

  ['input', 'change', 'paste', 'blur', 'compositionend'].forEach((evt) => {
    on(emailInput, evt, refresh);
  });

  on(goBtn, 'click', () => {
    if (goBtn.disabled) return;
    buildRoutes();
    goToScreen(state.routeScreens[0] || 'scr-modes');
  });

  refresh();
}

function setupTextAreas() {
  const lowNote = byId('lowNote');
  const confirmLowNote = byId('confirmLowNote');
  if (confirmLowNote) {
    on(confirmLowNote, 'click', () => {
      doOnce('scr-low-note', () => {
        const value = lowNote?.value.trim() || '';
        state.answers.low.note = value;
        if (value) {
          const xpValue = Number(byId('scr-low-note')?.dataset?.xp || 21);
          addXP(xpValue, 'ALL');
          toast(`+${xpValue} XP`);
        }
      });
    });
  }

  const chillOneThing = byId('chillOneThing');
  const confirmChillOpen = byId('confirmChillOpen');
  if (chillOneThing && confirmChillOpen) {
    const update = () => {
      const value = chillOneThing.value.trim();
      confirmChillOpen.disabled = value.length < 1;
    };
    on(chillOneThing, 'input', update);
    update();
    on(confirmChillOpen, 'click', () => {
      doOnce('scr-chill-open', () => {
        state.answers.chill.oneThing = chillOneThing.value.trim();
        addXP(21, 'ALL');
        toast('+21 XP');
      });
    });
  }

  const flowGoal = byId('flowGoal');
  const confirmFlowGoal = byId('confirmFlowGoal');
  if (flowGoal && confirmFlowGoal) {
    const update = () => {
      confirmFlowGoal.disabled = flowGoal.value.trim().length < 1;
    };
    on(flowGoal, 'input', update);
    update();
    on(confirmFlowGoal, 'click', () => {
      doOnce('scr-flow-goal', () => {
        state.answers.flow.goal = flowGoal.value.trim();
        addXP(21, 'ALL');
        toast('+21 XP');
      });
    });
  }

  const evolveGoal = byId('evolveGoal');
  const confirmEvolveGoal = byId('confirmEvolveGoal');
  if (evolveGoal && confirmEvolveGoal) {
    const update = () => {
      confirmEvolveGoal.disabled = evolveGoal.value.trim().length < 1;
    };
    on(evolveGoal, 'input', update);
    update();
    on(confirmEvolveGoal, 'click', () => {
      doOnce('scr-evolve-goal', () => {
        state.answers.evolve.goal = evolveGoal.value.trim();
        addXP(21, 'ALL');
        toast('+21 XP');
      });
    });
  }
}

function setupModeLists() {
  const chillInputs = $$('#chillMotivList input');
  const confirmChillMotiv = byId('confirmChillMotiv');
  if (confirmChillMotiv) {
    const update = () => {
      confirmChillMotiv.disabled = chillInputs.filter((i) => i.checked).length < 1;
    };
    chillInputs.forEach((input) => on(input, 'change', update));
    update();
    on(confirmChillMotiv, 'click', () => {
      doOnce('scr-chill-motiv', () => {
        state.answers.chill.motiv = getCheckedTexts('#chillMotivList');
        addXP(13, 'ALL');
        toast('+13 XP');
      });
    });
  }

  const flowInputs = $$('#flowImpedList input');
  const confirmFlowImped = byId('confirmFlowImped');
  if (confirmFlowImped) {
    const update = () => {
      confirmFlowImped.disabled = flowInputs.filter((i) => i.checked).length < 1;
    };
    flowInputs.forEach((input) => on(input, 'change', update));
    update();
    on(confirmFlowImped, 'click', () => {
      doOnce('scr-flow-imped', () => {
        state.answers.flow.imped = getCheckedTexts('#flowImpedList');
        addXP(13, 'ALL');
        toast('+13 XP');
      });
    });
  }

  const evolveTradeInputs = $$('#evolveTradeList input');
  const confirmEvolveTrade = byId('confirmEvolveTrade');
  if (confirmEvolveTrade) {
    const update = () => {
      confirmEvolveTrade.disabled = evolveTradeInputs.filter((i) => i.checked).length < 1;
    };
    evolveTradeInputs.forEach((input) => on(input, 'change', update));
    update();
    on(confirmEvolveTrade, 'click', () => {
      doOnce('scr-evolve-trade', () => {
        state.answers.evolve.trade = getCheckedTexts('#evolveTradeList');
        addXP(13, 'ALL');
        toast('+13 XP');
      });
    });
  }

  const evolveAttInputs = $$('#evolveAttList input');
  const confirmEvolveAtt = byId('confirmEvolveAtt');
  if (confirmEvolveAtt) {
    const update = () => {
      confirmEvolveAtt.disabled = !evolveAttInputs.some((i) => i.checked);
    };
    evolveAttInputs.forEach((input) => on(input, 'change', update));
    update();
    on(confirmEvolveAtt, 'click', () => {
      doOnce('scr-evolve-att', () => {
        state.answers.evolve.att = getRadioText('#evolveAttList');
        addXP(21, 'ALL');
        toast('+21 XP');
      });
    });
  }
}

function setupNavigation() {
  on(document, 'keydown', (event) => {
    if (event.key === 'ArrowLeft') prevStep();
    if (event.key === 'ArrowRight') nextStep();
  });

  const restart = byId('restart');
  if (restart) on(restart, 'click', resetAll);

  const hudTitle = byId('hudTitle');
  if (hudTitle) {
    on(hudTitle, 'click', () => {
      if (!state.xp.total || window.confirm('¿Salir y volver al inicio? Se perderá el progreso.')) {
        window.location.href = 'https://rfullivarri.github.io/gamificationweblanding/indexv2.html';
      }
    });
  }

  const backIntro = byId('backIntro') || byId('backToIntro');
  if (backIntro) on(backIntro, 'click', () => showScreen('scr-intro'));

  const goToMap = {
    backToModes1: 'scr-modes',
    backToModes2: 'scr-modes',
    backToModes3: 'scr-modes',
    backToModes4: 'scr-modes',
    backEvolveGoal: 'scr-evolve-goal',
  };
  Object.entries(goToMap).forEach(([id, target]) => {
    const btn = byId(id);
    if (btn) on(btn, 'click', () => goToScreen(target));
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
    if (btn) on(btn, 'click', prevStep);
  });
}

function setupFoundationsOpens() {
  Object.entries(OPEN_FOUND).forEach(([sectionId, textareaId]) => {
    const textarea = byId(textareaId);
    if (!textarea) return;
    on(textarea, 'blur', () => {
      const value = textarea.value.trim();
      const mapKey = { 'scr-f-body': 'bodyOpen', 'scr-f-soul': 'soulOpen', 'scr-f-mind': 'mindOpen' }[sectionId];
      if (mapKey) state.answers.foundations[mapKey] = value;
    });
  });
}

function setupChecklistBindings() {
  bindLimitedChecklist('scr-low-body', 'lowBodyList', 'lowBodyCount', state.answers.low.body, 'fBodyOpen');
  bindLimitedChecklist('scr-low-soul', 'lowSoulList', 'lowSoulCount', state.answers.low.soul, 'fSoulOpen');
  bindLimitedChecklist('scr-low-mind', 'lowMindList', 'lowMindCount', state.answers.low.mind, 'fMindOpen');
  bindLimitedChecklist('scr-f-body', 'fBodyList', 'fBodyCount', state.answers.foundations.body, 'fBodyOpen2');
  bindLimitedChecklist('scr-f-soul', 'fSoulList', 'fSoulCount', state.answers.foundations.soul, 'fSoulOpen2');
  bindLimitedChecklist('scr-f-mind', 'fMindList', 'fMindCount', state.answers.foundations.mind, 'fMindOpen2');
}

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

    const response = await postJson(WORKER_URL, payload);
    if (!response || response.ok === false) {
      throw new Error(response?.error || 'worker_error');
    }

    try {
      sessionStorage.setItem('gj_email', payload.email || '');
      sessionStorage.setItem('gj_client_id', response.client_id || payload.client_id || '');
      window._lastClientId = response.client_id || payload.client_id || '';
    } catch (_error) {
      // continuar igual
    }

    window.location.href = REDIRECT_URL;
  } catch (error) {
    console.error('[onboarding] send error:', error);
    toast('No pudimos enviar. Probá de nuevo.');
    finishBtn.classList.remove('loading');
    finishBtn.removeAttribute('aria-busy');
    finishBtn.disabled = false;
    finishBtn.textContent = originalText;
    state.sending = false;
  }
}

function buildPayloadHelpers() {
  const keyCID = 'gj_client_id';

  function getClientId() {
    try {
      let cid = localStorage.getItem(keyCID);
      if (!cid) {
        cid = window.crypto?.randomUUID ? window.crypto.randomUUID() : `cid-${Math.random().toString(36).slice(2)}${Date.now()}`;
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
        mode_label: MODE_LABELS[answers.mode] || '',
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

function setupFinishButton() {
  const finish = byId('finish');
  if (finish) on(finish, 'click', (event) => {
    event.preventDefault();
    sendPayload();
  });
}

function mountLists() {
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

function init() {
  mountLists();
  setupChecklistBindings();
  setupModeGrid();
  setupEmailIntro();
  setupTextAreas();
  setupModeLists();
  setupNavigation();
  setupFoundationsOpens();
  setupFinishButton();
  buildPayloadHelpers();
  drawProgress();
  window.toast = toast;
}

on(document, 'DOMContentLoaded', init);

// TODO: dividir el módulo en submódulos (HUD, rutas, envío) para seguir limpiando responsabilidades.
