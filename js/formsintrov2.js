// ==========================
// 1) Etiquetas 1:1 con el Form (copiadas del prellenado)
// ==========================
const FORM_LABELS = {
  // LOW (emoji AL FINAL, textos y tildes exactos)
  lowBody: [
    "Dormir mejor 😴",
    "Alimentarte mejor 🥗",
    "Moverte un poco más 🏃",
    "Tomar más agua 💧",
    "Descansar sin culpa 🧘"
  ],
  lowSoul: [
    "Respirar profundo unos minutos 🌬️",
    "Escuchar música que te gusta 🎶",
    "Estar en contacto con la naturaleza 🍃",
    "Anotar lo que sentís en un papel 📝",
    "Hacer algo sin tener que ser útil 🌈"
  ],
  lowMind: [
    "Leer algo corto 📖",
    "Anotar tus pensamientos 📓",
    "Mirar una serie tranquila 📺",
    "Hacer una pausa sin pantallas 🚫📱",
    "Desarmar alguna idea negativa 🧩"
  ],

  // CHILL — Motivaciones (emoji AL INICIO, exactamente como en el form)
  chillMotiv: [
    "🌱 Crecer como persona / desarrollo personal",
    "🎯 Lograr metas concretas que me propongo",
    "🤝 Sentirme más conectado con otras personas",
    "🧘‍♂️ Vivir con más calma y menos estrés",
    "🏆 Superarme a mí mismo y romper mis límites",
    "🛠️ Crear o construir algo (proyectos, arte, emprendimientos)",
    "✨ Sentirme más feliz y satisfecho con mi día a día",
    "🗺️ Tener más experiencias y aventuras",
    "💖 Cuidar mi salud y bienestar a largo plazo"
  ],

  flowObstacles: [
    "Falta de tiempo",
    "Falta de energía o motivación",
    "Miedo al fracaso",
    "Dudas sobre dónde empezar",
    "Falta de apoyo",
    "Procrastinación",
    "No tengo Hábitos aún",
    "Síndrome del impostor"
  ],

  evolveCommit: [
    "Mis hábitos diarios",
    "Mi alimentación",
    "Mis rutinas de descanso",
    "Mi tiempo libre",
    "Mis relaciones sociales",
    "Mis creencias y bloqueos mentales",
    "Mis espacios físicos"
  ],
  evolveAtt: [
    "Estoy muy motivado y quiero cambios ya",
    "Quiero ir de a poco pero con foco",
    "Me cuesta mantener constancia pero quiero intentar"
  ],

  // FOUNDATIONS — Body
  fBody: [
    "🏃‍♂️ Actividad física regular (Energía)",
    "🥗 Alimentación saludable (Nutrición)",
    "😴 Dormir y descansar mejor (Sueño)",
    "🛀 Relajación y pausas para recuperar el cuerpo (Recuperación)",
    "💧 Tomar más agua o hidratarte mejor (Hidratación)",
    "🧼 Higiene y cuidado personal diario (Higiene)",
    "🌅 Sentirte con más energía y vitalidad al despertar (Vitalidad)",
    "💺 Mejorar tu postura y ergonomía (Postura)",
    "🧘‍♂️ Flexibilidad y movilidad corporal (Movilidad)",
    "🚫 Reducir consumo de alcohol, tabaco o cafeína (Moderación)"
  ],

  fSoul: [
    "🤝 Fortalecer relaciones y vínculos personales (Conexión)",
    "🌌 Practicar espiritualidad o sentir plenitud interior (Espiritualidad)",
    "🎯 Definir tu propósito y dirección en la vida (Propósito)",
    "⚖️ Vivir más alineado a tus valores (Valores)",
    "💗 Ayudar a otros o aportar a una causa (Altruismo)",
    "🔍 Conocerte más profundamente (Insight)",
    "🙏 Practicar gratitud o tener una actitud positiva (Gratitud)",
    "🌳 Conectarte más con la naturaleza (Naturaleza)",
    "🎉 Jugar, reír y divertirte sin culpa (Gozo)",
    "🪞 Trabajar tu autoestima y hablarte con más amabilidad (Autoestima)"
  ],

  fMind: [
    "🎯 Mejorar tu enfoque y productividad diaria (Enfoque)",
    "📚 Aprender cosas nuevas o estudiar mejor (Aprendizaje)",
    "🎨 Desarrollar tu creatividad e ideas nuevas (Creatividad)",
    "😵‍💫 Manejar mejor el estrés o ansiedad (Gestión)",
    "🧠 Regular tus emociones y reacciones (Autocontrol)",
    "💪 Ser más resiliente frente a desafíos (Resiliencia)",
    "🗂️ Tener tus tareas o espacios mentales más organizados (Orden)",
    "🚀 Desarrollarte profesionalmente o avanzar en tu carrera (Proyección)",
    "💰 Mejorar tus hábitos financieros (Finanzas)",
    "🧩 Ejercitar tu memoria y agilidad mental (Agilidad)"
  ]
};
// ==========================
// Mapear los modos internos a etiquetas exactas del Form
// ==========================
  const MODE_LABELS = {
  LOW:   "Low Mood 🪫 - Quiero un cambio, pero no tengo la energia",
  CHILL: "Chill Mood 🌿 - Estoy  bien, quiero trackear mis hábitos",
  FLOW:  "Flow Mood 🌊 - Tengo un objetivo y quiero comenzar esta aventura",
  EVOLVE:"Evolve Mood 🧬 - Estoy enfocado y quiero ir al próximo nivel"
};




// ==========================
// 2) Lógica UI + XP + rutas
// ==========================
(() => {
  // Estado
  const xp = { Body:0, Mind:0, Soul:0, total:0 };
  const answers = {
    email:"",
    mode:null,
    low:{ body:[], soul:[], mind:[], note:"" },
    chill:{ oneThing:"", motiv:[] },
    flow:{ goal:"", imped:[] },
    evolve:{ goal:"", trade:[], att:"" },
    foundations:{
      body:[], soul:[], mind:[],
      bodyOpen:"", soulOpen:"", mindOpen:""    // 👈 NUEVO
    }
  };
  const routes = {
    LOW: ["scr-low-body","scr-low-soul","scr-low-mind","scr-low-note","scr-summary"],
    CHILL: ["scr-chill-open","scr-chill-motiv","scr-f-body","scr-f-soul","scr-f-mind","scr-summary"],
    FLOW: ["scr-flow-goal","scr-flow-imped","scr-f-body","scr-f-soul","scr-f-mind","scr-summary"],
    EVOLVE:["scr-evolve-goal","scr-evolve-trade","scr-evolve-att","scr-f-body","scr-f-soul","scr-f-mind","scr-summary"]
  };
  let routeScreens = []; let stepIndex = 0;

  // Helpers
  const $  = s=>document.querySelector(s);
  const $$ = s=>Array.from(document.querySelectorAll(s));
  const $go = id => document.getElementById(id);
  const show = id => { $$(".scr").forEach(s=>s.classList.remove("active")); $("#"+id).classList.add("active"); drawProgress(); };
  const toast = (txt) => { const t=$("#toast"); t.textContent=txt; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"), 1100); };

  function drawProgress(){
    const total = routeScreens.length || 1;
    const pct = Math.min(100, Math.round((stepIndex)/(total-1)*100));
    $("#progressFill").style.width = pct + "%";

    const b = Math.round(xp.Body);
    const m = Math.round(xp.Mind);
    const s = Math.round(xp.Soul);

    $("#barBody").value = Math.min(b, 100);
    $("#barMind").value = Math.min(m, 100);
    $("#barSoul").value = Math.min(s, 100);

    const shownTotal = b + m + s;
    $("#xpTotal").textContent = shownTotal;
    xp.total = shownTotal;
  }

  function addXP(amount, pillar){
    if (amount <= 0) return;
    const fix = n => Math.round(n * 100) / 100;
    if (pillar === "ALL") ["Body","Mind","Soul"].forEach(p => { xp[p] = fix(xp[p] + amount/3); });
    else xp[pillar] = fix(xp[pillar] + amount);
    xp.total = fix(xp.Body + xp.Mind + xp.Soul);
    drawProgress();
  }

  // Pintado de listas
  function paintChecklist(listId, items, type="checkbox", nameGroup="grp"){
    const host = document.getElementById(listId);
    host.innerHTML = "";
    items.forEach((txt,i)=>{
      const id = `${listId}-${i}`;
      const input = document.createElement("input");
      input.type = type;
      if(type==="radio") input.name = nameGroup;
      input.id = id;
      const label = document.createElement("label");
      label.className = "chip"; label.setAttribute("for", id);
      label.appendChild(input);
      const span = document.createElement("span"); span.textContent = txt; label.appendChild(span);
      host.appendChild(label);
    });
  }

  // Fuente única → UI
  const LISTS = {
    // LOW
    lowBody: FORM_LABELS.lowBody,
    lowSoul: FORM_LABELS.lowSoul,
    lowMind: FORM_LABELS.lowMind,
    // CHILL
    chillMotiv: FORM_LABELS.chillMotiv,
    // FLOW
    flowImped: FORM_LABELS.flowObstacles,
    // EVOLVE
    evolveTrade: FORM_LABELS.evolveCommit,
    evolveAtt: FORM_LABELS.evolveAtt,
    // FOUNDATIONS
    fBody: FORM_LABELS.fBody,
    fSoul: FORM_LABELS.fSoul,
    fMind: FORM_LABELS.fMind
  };

  // Textareas "open" de Foundations para sumar +21 si tienen contenido
  const OPEN_FOUND = {
    "scr-f-body": "fBodyOpen2",
    "scr-f-soul": "fSoulOpen2",
    "scr-f-mind": "fMindOpen2"
  };

  // Pintar todas
  paintChecklist("lowBodyList", LISTS.lowBody);
  paintChecklist("lowSoulList", LISTS.lowSoul);
  paintChecklist("lowMindList", LISTS.lowMind);
  paintChecklist("fBodyList",   LISTS.fBody);
  paintChecklist("fSoulList",   LISTS.fSoul);
  paintChecklist("fMindList",   LISTS.fMind);
  paintChecklist("chillMotivList", LISTS.chillMotiv);
  paintChecklist("flowImpedList",  LISTS.flowImped);
  paintChecklist("evolveTradeList", LISTS.evolveTrade);
  paintChecklist("evolveAttList",   LISTS.evolveAtt, "radio", "evolveAtt");

  // --- helpers para no duplicar XP y para resetear todo ---
  // Ejecuta la acción de una pantalla solo la primera vez (usa data-done en la <section>)
  function doOnce(sectionId, fn) {
    const sec = document.getElementById(sectionId);
    if (!sec) return;
    if (sec.dataset.done === "1") {            // ya se ejecutó → solo avanzar
      nextStep();
      return;
    }
    fn();                                       // primera vez → hace lo que corresponda
    sec.dataset.done = "1";                     // marca como hecho
    nextStep();
  }
  
  // Resetea TODO el estado, UI y marcas "done"
  function resetAll(){
    // 1) estado
    xp.Body = xp.Mind = xp.Soul = xp.total = 0;
    answers.email = "";
    answers.mode  = null;
    answers.low   = { body:[], soul:[], mind:[], note:"" };
    answers.chill = { oneThing:"", motiv:[] };
    answers.flow  = { goal:"", imped:[] };
    answers.evolve= { goal:"", trade:[], att:"" };
    answers.foundations = { body:[], soul:[], mind:[], bodyOpen:"", soulOpen:"", mindOpen:"" };
  
    // 2) UI: limpiar inputs / checks / textareas
    document.querySelectorAll("input[type=email], input[type=text], textarea")
      .forEach(el => el.value = "");
    document.querySelectorAll("input[type=checkbox], input[type=radio]")
      .forEach(el => el.checked = false);
  
    // 3) desmarcar selecciones visuales y re‑deshabilitar botones de confirm donde aplique
    document.querySelectorAll(".card.selected").forEach(c => c.classList.remove("selected"));
    ["confirmMode","confirmChillOpen","confirmFlowGoal","confirmEvolveGoal",
     "confirmChillMotiv","confirmFlowImped","confirmEvolveTrade","confirmEvolveAtt",
     "confirmLowBody","confirmLowSoul","confirmLowMind",
     "confirmFBody","confirmFSoul","confirmFMind"]
      .forEach(id => { const b=document.getElementById(id); if(b) b.disabled = true; });
  
    // 4) quitar todas las marcas de ejecución (para que no cuenten XP al re‑hacer)
    document.querySelectorAll(".scr").forEach(s => delete s.dataset.done);
  
    // 5) barra superior y progreso
    document.getElementById("xpTotal").textContent = "0";
    ["barBody","barMind","barSoul"].forEach(id => { const p=document.getElementById(id); if(p) p.value=0; });
    const fill = document.getElementById("progressFill"); if (fill) fill.style.width = "0%";
  
    // 6) rutas/step y volver a la intro
    routeScreens = [];
    stepIndex = 0;
    show("scr-intro");
  }

  // Navegación base
  const nextStep = ()=>{
    const next = Math.min(routeScreens.length - 1, stepIndex + 1);
    const target = routeScreens[next];
    if (!target) return;
    stepIndex = next;
    show(target);
    if (target === "scr-summary") renderSummary();
  };
  const prevStep = ()=>{
    stepIndex = Math.max(0, stepIndex - 1);
    show(routeScreens[stepIndex]);
  };
  // HUD: click en "Journey" para volver al landing
  $go("hudTitle")?.addEventListener("click", ()=>{
    if (!xp.total || confirm("¿Salir y volver al inicio? Se perderá el progreso.")) {
      window.location.href = "https://rfullivarri.github.io/gamificationweblanding/indexv2.html"; // 🔗 tu URL del landing
    }
  });

  // Back a intro (manejo ambos IDs por tu HTML actual)
  const backIntroBtn = $go("backIntro") || $go("backToIntro");
  if (backIntroBtn) backIntroBtn.addEventListener("click", ()=> show("scr-intro"));

  // Email Intro
  const emailInput = document.getElementById("emailInput");
  const goModesBtn = document.getElementById("goModes");
  const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||"").trim());
  if (emailInput && goModesBtn){
    const refresh = ()=> { goModesBtn.disabled = !isEmail(emailInput.value); };
    emailInput.addEventListener("input", refresh);
    refresh();
    goModesBtn.addEventListener("click", ()=>{
      const v = String(emailInput.value||"").trim();
      if(!isEmail(v)){ toast("Poné un correo válido ✉️"); return; }
      answers.email = v;
      show("scr-modes");
    });
  }

  // Elegir modo
  $$("#modeGrid .card").forEach(card=>{
    card.addEventListener("click", ()=>{
      $$("#modeGrid .card").forEach(c=>c.classList.remove("selected"));
      card.classList.add("selected");
      answers.mode = card.dataset.mode;
      $go("confirmMode").disabled = false;
    });
  });
  $go("confirmMode").addEventListener("click", ()=>{
    routeScreens = routes[answers.mode];
    stepIndex = 0;
    show(routeScreens[stepIndex]);
  });

  // Volver a modes
  ["backToModes1","backToModes2","backToModes3","backToModes4"].forEach(id=>{
    if($go(id)) $go(id).addEventListener("click", ()=> show("scr-modes"));
  });

  // BACKS Foundations (Body → Soul → Mind)
  ["backFoundPrev1","backFBody","backFSoul"].forEach(id => {
    const btn = $go(id);
    if (!btn) return;
    btn.addEventListener("click", () => {
      stepIndex = Math.max(0, stepIndex - 1);
      show(routeScreens[stepIndex]);
    });
  });

  // Utils selección
  const getCheckedTexts = sel => $$(sel+" input:checked").map(i=>i.parentElement.textContent.trim());
  const getRadioText   = sel => { const el = $$(sel+" input[type=radio]").find(i=>i.checked); return el?el.parentElement.textContent.trim():""; };

  // Checklist con límite + XP (13) y, si hay open con texto, +21 extra.
  // Evita duplicar XP aunque vuelvas y confirmes varias veces.
  // Checklist con límite y confirm (+ opcional "open" con +21 XP)
  function bindLimitedChecklist(scrId, listId, countId, storeArrRef, openTextareaId=null){
    const max    = Number($("#"+scrId).dataset.limit || 5);
    const inputs = $$("#"+listId+" input");
    const count  = $("#"+countId);
  
    function update(){
      const ch = inputs.filter(i=>i.checked);
      if(ch.length > max){ ch[ch.length-1].checked = false; }
      const now = inputs.filter(i=>i.checked).length;
      if (count) count.textContent = now;
      $go(confirmIdFor(scrId)).disabled = (now < 1);
    }
    inputs.forEach(i=> i.addEventListener("change", update));
    update();
  
    function confirmIdFor(id){
      return ({
        "scr-low-body":"confirmLowBody","scr-low-soul":"confirmLowSoul","scr-low-mind":"confirmLowMind",
        "scr-f-body":"confirmFBody","scr-f-soul":"confirmFSoul","scr-f-mind":"confirmFMind"
      })[id];
    }
  
    $go(confirmIdFor(scrId)).addEventListener("click", ()=>{
      const sec = document.getElementById(scrId);
  
      // 1) Guardar y evaluar el "open" si existe (puede sumarse aunque la checklist ya estuviera hecha)
      if (openTextareaId){
        const val = ($go(openTextareaId)?.value || "").trim();
        // mapear a la key correcta en answers.foundations
        const keyMap = {
          "scr-f-body":"bodyOpen",
          "scr-f-soul":"soulOpen",
          "scr-f-mind":"mindOpen",
          "scr-low-body": "bodyOpen",
          "scr-low-soul": "soulOpen",
          "scr-low-mind": "mindOpen"
        };
        const k = keyMap[scrId];
        answers.foundations = answers.foundations || {};
        if (k) answers.foundations[k] = val;
  
        if (val && sec.dataset.openDone !== "1"){
          addXP(21,"ALL"); toast("+21 XP");
          sec.dataset.openDone = "1"; // marca que el +21 ya se otorgó por este open
        }
      }
  
      // 2) Checklist: solo la 1ª vez guarda, suma +13 y marca done
      if (sec.dataset.done !== "1"){
        storeArrRef.length = 0;
        getCheckedTexts("#"+listId).forEach(t=>storeArrRef.push(t));
        const xpVal = Number($("#"+scrId).dataset.xp || 13);
        const pillar = $("#"+scrId).dataset.pillar;
        addXP(xpVal, pillar);
        toast(`+${xpVal} XP`);
        sec.dataset.done = "1";
      }
  
      // 3) Avanzar
      nextStep();
    });
  }


  


  // Binds LOW + FOUNDATIONS
  bindLimitedChecklist("scr-low-body","lowBodyList","lowBodyCount",   answers.low.body, "fBodyOpen");
  bindLimitedChecklist("scr-low-soul","lowSoulList","lowSoulCount",   answers.low.soul, "fSoulOpen");
  bindLimitedChecklist("scr-low-mind","lowMindList","lowMindCount",   answers.low.mind, "fMindOpen");
  bindLimitedChecklist("scr-f-body",  "fBodyList",  "fBodyCount", answers.foundations.body, "fBodyOpen2");
  bindLimitedChecklist("scr-f-soul",  "fSoulList",  "fSoulCount", answers.foundations.soul, "fSoulOpen2");
  bindLimitedChecklist("scr-f-mind",  "fMindList",  "fMindCount", answers.foundations.mind, "fMindOpen2");
  // bindLimitedChecklist("scr-f-body",  "fBodyList",  "fBodyCount",     answers.foundations.body);
  // bindLimitedChecklist("scr-f-soul",  "fSoulList",  "fSoulCount",     answers.foundations.soul);
  // bindLimitedChecklist("scr-f-mind",  "fMindList",  "fMindCount",     answers.foundations.mind);

  // LOW note (21 XP)
  $go("backLowMind")?.addEventListener("click", ()=> prevStep());
  $go("confirmLowNote")?.addEventListener("click", ()=>{
  answers.low.note = $go("lowNote").value.trim();
  // SUMA XP solo si escribió algo:
  if (answers.low.note) (window.JOURNEY_STATE.xp.Soul ||= 0, window.JOURNEY_STATE.xp.Soul += Number($go("scr-low-note")?.dataset?.xp || 21));
  nextStep();
});

  // ---------- CHILL ----------
$go("chillOneThing").addEventListener("input", ()=> {
  $go("confirmChillOpen").disabled = ($go("chillOneThing").value.trim().length < 1);
});

// CHILL open (+21) — evita duplicar XP al re‑confirmar
$go("confirmChillOpen").addEventListener("click", ()=>{
  doOnce("scr-chill-open", ()=>{
    answers.chill.oneThing = $go("chillOneThing").value.trim();
    addXP(21, "ALL"); toast("+21 XP");
  });
});

const chillInputs = $$("#chillMotivList input");
const updateChill = ()=> $go("confirmChillMotiv").disabled = chillInputs.filter(i=>i.checked).length < 1;
chillInputs.forEach(i=> i.addEventListener("change", updateChill)); updateChill();

// CHILL motiv (+13)
  $go("confirmChillMotiv").addEventListener("click", ()=>{
    doOnce("scr-chill-motiv", ()=>{
      answers.chill.motiv = getCheckedTexts("#chillMotivList");
      addXP(13, "ALL"); toast("+13 XP");
    });
  });
  $go("backChillOpen").addEventListener("click", ()=> prevStep());
  
  
  // ---------- FLOW ----------
  $go("flowGoal").addEventListener("input", ()=> {
    $go("confirmFlowGoal").disabled = ($go("flowGoal").value.trim().length < 1);
  });
  
  // FLOW goal (+21)
  $go("confirmFlowGoal").addEventListener("click", ()=>{
    doOnce("scr-flow-goal", ()=>{
      answers.flow.goal = $go("flowGoal").value.trim();
      addXP(21, "ALL"); toast("+21 XP");
    });
  });
  
  const flowImps = $$("#flowImpedList input");
  const updateFlow = ()=> $go("confirmFlowImped").disabled = flowImps.filter(i=>i.checked).length < 1;
  flowImps.forEach(i=> i.addEventListener("change", updateFlow)); updateFlow();
  
  // FLOW imped (+13)
  $go("confirmFlowImped").addEventListener("click", ()=>{
    doOnce("scr-flow-imped", ()=>{
      answers.flow.imped = getCheckedTexts("#flowImpedList");
      addXP(13, "ALL"); toast("+13 XP");
    });
  });
  $go("backFlowGoal").addEventListener("click", ()=> prevStep());
  
  
  // ---------- EVOLVE ----------
  $go("evolveGoal").addEventListener("input", ()=> {
    $go("confirmEvolveGoal").disabled = ($go("evolveGoal").value.trim().length < 1);
  });
  
  // EVOLVE goal (+21)
  $go("confirmEvolveGoal").addEventListener("click", ()=>{
    doOnce("scr-evolve-goal", ()=>{
      answers.evolve.goal = $go("evolveGoal").value.trim();
      addXP(21, "ALL"); toast("+21 XP");
    });
  });
  
  const evTrade = $$("#evolveTradeList input");
  const updEvTrade = ()=> $go("confirmEvolveTrade").disabled = evTrade.filter(i=>i.checked).length < 1;
  evTrade.forEach(i=> i.addEventListener("change", updEvTrade)); updEvTrade();
  
  // EVOLVE trade (+13)
  $go("confirmEvolveTrade").addEventListener("click", ()=>{
    doOnce("scr-evolve-trade", ()=>{
      answers.evolve.trade = getCheckedTexts("#evolveTradeList");
      addXP(13, "ALL"); toast("+13 XP");
    });
  });
  
  // EVOLVE att (+21)
  const evAtt = $$("#evolveAttList input");
  evAtt.forEach(i=> i.addEventListener("change", ()=> $go("confirmEvolveAtt").disabled = !evAtt.some(x=>x.checked)));
  $go("confirmEvolveAtt").addEventListener("click", ()=>{
    doOnce("scr-evolve-att", ()=>{
      answers.evolve.att = getRadioText("#evolveAttList");
      addXP(21, "ALL"); toast("+21 XP");
    });
  });
 
  $go("backEvolveTrade").addEventListener("click", ()=> prevStep());

  // Atajos teclado
  document.addEventListener("keydown",(e)=>{
    if(e.key==="ArrowLeft")  prevStep();
    if(e.key==="ArrowRight") nextStep();
  });

  // Resumen
  function renderSummary(){
    const box = $("#summaryBox");
    const fmt = a => (a && a.length)? a.join(", ") : "—";
    box.innerHTML = `
      <div><strong>Game Mode:</strong> ${answers.mode||"—"}</div>
      <div><strong>Email:</strong> ${answers.email||"—"}</div>
      <hr style="border:0;border-top:1px solid var(--ring);margin:8px 0">
      ${
        answers.mode==="LOW"
        ? `
          <div><strong>LOW · Body:</strong> ${fmt(answers.low.body)}</div>
          <div><strong>LOW · Soul:</strong> ${fmt(answers.low.soul)}</div>
          <div><strong>LOW · Mind:</strong> ${fmt(answers.low.mind)}</div>
          ${answers.low.note?`<div><strong>Nota:</strong> ${answers.low.note}</div>`:""}
        `
        : `
          ${answers.mode==="CHILL" ? `<div><strong>CHILL · Objetivo:</strong> ${answers.chill.oneThing}</div>
          <div><strong>CHILL · Motivaciones:</strong> ${fmt(answers.chill.motiv)}</div>`:""}
          ${answers.mode==="FLOW" ? `<div><strong>FLOW · Objetivo:</strong> ${answers.flow.goal}</div>
          <div><strong>FLOW · Impedimentos:</strong> ${fmt(answers.flow.imped)}</div>`:""}
          ${answers.mode==="EVOLVE" ? `<div><strong>EVOLVE · Objetivo:</strong> ${answers.evolve.goal}</div>
          <div><strong>EVOLVE · Ajustes:</strong> ${fmt(answers.evolve.trade)}</div>
          <div><strong>EVOLVE · Actitud:</strong> ${answers.evolve.att}</div>`:""}
          <hr style="border:0;border-top:1px solid var(--ring);margin:8px 0">
          <div><strong>Foundations · Body:</strong> ${fmt(answers.foundations.body)}</div>
          <div><strong>Foundations · Soul:</strong> ${fmt(answers.foundations.soul)}</div>
          <div><strong>Foundations · Mind:</strong> ${fmt(answers.foundations.mind)}</div>
        `
      }
      <hr style="border:0;border-top:1px solid var(--ring);margin:8px 0">
      <div><strong>🫀 Body:</strong> ${Math.round(xp.Body)} XP</div>
      <div><strong>🧠 Mind:</strong> ${Math.round(xp.Mind)} XP</div>
      <div><strong>🏵️ Soul:</strong> ${Math.round(xp.Soul)} XP</div>
      <div style="margin-top:6px"><strong>Total:</strong> ${Math.round(xp.total)} XP</div>
    `;
  }
  // Botón "Volver al inicio" del resumen
  document.getElementById("restart")?.addEventListener("click", resetAll);

  // Init
  drawProgress();
  window.JOURNEY_STATE = { get answers(){ return answers; }, get xp(){ return xp; } };
})();




/* ==========================
   3) Envío a Google Forms
   ========================== */

/* IDs de entradas (1:1 con tu último prellenado) */
const ENTRIES = {
  email: "entry.646330003",
  mode:  "entry.97701242",

  // XP
  xp_total: "entry.1162318324",
  xp_body:  "entry.719321726",
  xp_mind:  "entry.1918862868",
  xp_soul:  "entry.463475479",

  // LOW
  low_body: "entry.811917583",
  low_soul: "entry.1264509887",
  low_mind: "entry.930582201",
  low_note: "entry.1684429349",

  // CHILL
  chill_one:   "entry.1593318786",
  chill_motiv: "entry.245183915",

  // FLOW
  flow_goal:  "entry.1840529708",
  flow_imped: "entry.1903049465",

  // EVOLVE
  evolve_goal:  "entry.1816542307",
  evolve_trade: "entry.263772832",
  evolve_att:   "entry.1936745776",

  // FOUNDATIONS
  f_body:       "entry.1504903278",
  f_body_open:  "entry.263311735",
  f_soul:       "entry.753306725",
  f_soul_open:  "entry.590475620",
  f_mind:       "entry.1978710",
  f_mind_open:  "entry.1918822353",
};

/* ---------- Helpers ---------- */
function appendFD(fd, name, val){
  if (Array.isArray(val)) {
    // Checkbox: si no hay selecciones, NO mandes nada
    if (val.length > 0) val.forEach(v => fd.append(name, String(v)));
    return;
  }
  // Scalars
  if (val == null) return;
  const s = String(val);
  if (s.trim() === "") return;   // texto vacío → no lo mandes
  fd.append(name, s);
}

// Intenta usar MODE_LABELS del Script 1 (si existen)
function modeLabelFrom(answers){
  try {
    if (typeof MODE_LABELS !== "undefined" && MODE_LABELS[answers?.mode]) {
      return MODE_LABELS[answers.mode];
    }
  } catch(_) {}
  return answers?.mode || "";
}

// Si tenemos FORM_LABELS, filtramos a los valores válidos EXACTOS (evita que Forms descarte)
function sanitizeArray(values, allowed, opts = {}) {
  const { field = "(unknown-field)", mode = "" } = opts || {};

  // Tipo inválido → aviso y vacío
  if (!Array.isArray(values)) {
    console.warn(`[forms] ${field} (${mode}) → recibido no-array:`, values);
    return [];
  }

  // Sin catálogo → no filtramos
  if (!Array.isArray(allowed) || allowed.length === 0) {
    return values;
  }

  const whitelist = new Set(allowed);
  const out = values.filter(v => whitelist.has(v));

  // Si filtró algo, log detallado + traza acumulada
  if (out.length !== values.length) {
    const descartados = values.filter(v => !whitelist.has(v));
    console.error("[forms] MISMATCH en catálogo", {
      field, mode,
      descartados,
      permitidos: allowed,
      enviados: out
    });
    try {
      (window.__FORM_MISMATCHES ||= []).push({
        ts: Date.now(), field, mode,
        descartados, permitidos: allowed, enviados: out
      });
    } catch(_) {}
  }

  return out;
}

function pickEmail(){
  const a = window.JOURNEY_STATE?.answers?.email || "";
  const b = document.querySelector("#emailInput")?.value || "";
  const c = document.querySelector("input[type=email]")?.value || "";
  return String(a || b || c || "").trim();
}


  
 function buildFormDataFromState(){
   const fd = new FormData();

   const state   = window.JOURNEY_STATE || { answers:{}, xp:{} };
   const answers = state.answers || {};
   const xp      = state.xp || {};
   const t = x => String(x || "").trim();              // helper texto seguro

   // ===== OBLIGATORIOS
   const email = pickEmail();
   const modeLabel = modeLabelFrom(answers);
   appendFD(fd, ENTRIES.email, email);
   appendFD(fd, ENTRIES.mode,  modeLabel);

   // ===== XP (siempre números)
   const b = Math.round(Number(xp.Body || 0));
   const m = Math.round(Number(xp.Mind || 0));
   const s = Math.round(Number(xp.Soul || 0));
   appendFD(fd, ENTRIES.xp_total, b+m+s);
   appendFD(fd, ENTRIES.xp_body,  b);
   appendFD(fd, ENTRIES.xp_mind,  m);
   appendFD(fd, ENTRIES.xp_soul,  s);

   // ===== Catálogo para sanear
   const L = (typeof FORM_LABELS !== "undefined") ? FORM_LABELS : {};

   // LOW
  appendFD(fd, ENTRIES.low_body, sanitizeArray(answers?.low?.body || [], L.lowBody || [], { field: "low_body", mode: modeLabel }));
  appendFD(fd, ENTRIES.low_soul, sanitizeArray(answers?.low?.soul || [], L.lowSoul || [], { field: "low_soul", mode: modeLabel }));
  appendFD(fd, ENTRIES.low_mind, sanitizeArray(answers?.low?.mind || [], L.lowMind || [], { field: "low_mind", mode: modeLabel }));
  appendFD(fd, ENTRIES.low_note, t(answers?.low?.note)); // 🔸 siempre
  
  // CHILL
  appendFD(fd, ENTRIES.chill_one, t(answers?.chill?.oneThing)); // 🔸 siempre
  appendFD(fd, ENTRIES.chill_motiv, sanitizeArray(answers?.chill?.motiv || [], L.chillMotiv || [], { field: "chill_motiv", mode: modeLabel }));
  
  // FLOW
  appendFD(fd, ENTRIES.flow_goal, t(answers?.flow?.goal)); // 🔸 siempre
  appendFD(fd, ENTRIES.flow_imped, sanitizeArray(answers?.flow?.imped || [], L.flowObstacles || [], { field: "flow_imped", mode: modeLabel }));
  
  // EVOLVE
  appendFD(fd, ENTRIES.evolve_goal, t(answers?.evolve?.goal)); // 🔸 siempre
  appendFD(fd, ENTRIES.evolve_trade, sanitizeArray(answers?.evolve?.trade || [], L.evolveCommit || [], { field: "evolve_trade", mode: modeLabel }));
  appendFD(fd, ENTRIES.evolve_att, t(answers?.evolve?.att));
  
  // FOUNDATIONS
  appendFD(fd, ENTRIES.f_body, sanitizeArray(answers?.foundations?.body || [], L.fBody || [], { field: "f_body", mode: modeLabel }));
  appendFD(fd, ENTRIES.f_soul, sanitizeArray(answers?.foundations?.soul || [], L.fSoul || [], { field: "f_soul", mode: modeLabel }));
  appendFD(fd, ENTRIES.f_mind, sanitizeArray(answers?.foundations?.mind || [], L.fMind || [], { field: "f_mind", mode: modeLabel }));
  
  // “open” de foundations — 🔸 SIEMPRE (vacío si no hay texto)
  appendFD(fd, ENTRIES.f_body_open, t(answers?.foundations?.bodyOpen));
  appendFD(fd, ENTRIES.f_soul_open, t(answers?.foundations?.soulOpen));
  appendFD(fd, ENTRIES.f_mind_open, t(answers?.foundations?.mindOpen));
   return fd;
 }  



// ✨ NUEVO: usar el proxy del Worker
const PROXY_URL = "https://formulariointro.rfullivarri22.workers.dev/";

// ✨ Si activaste REQUIRE_KEY en el Worker, poné la misma clave acá.
const PROXY_KEY = "formsintro"; // o "" si no usás clave

async function submitJourneyToForm() {
  try {
    // 1) Armamos el FormData como ya lo tenés
    const fd = buildFormDataFromState();

    // 2) Headers (API key del Worker si aplica)
    const headers = {};
    if (PROXY_KEY) headers["X-Proxy-Key"] = PROXY_KEY;

    // 3) Modo debug conmutado por flag o por query (?debug=1 en la URL actual)
    const qsDebug = new URL(location.href).searchParams.get("debug") === "1";
    const USE_DEBUG = qsDebug; // producción por defecto (false), debug si pasás ?debug=1
    const url = PROXY_URL + (USE_DEBUG ? "?debug=1" : "");

    // 4) Fetch al Worker (keepalive para mobile / pestaña que navega)
    const resp = await fetch(url, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      headers,
      body: fd,
      keepalive: true
    });

    // 5) En debug el Worker responde JSON {ok, status, location, html, received...}
    if (USE_DEBUG) {
      const data = await resp.json().catch(() => ({}));
      console.log("[forms] 🔍 Debug Worker →", data);

      // éxito si el Worker vio redirect/location O si status es 200/204
      const ok = !!data.ok || data.status === 204 || data.status === 200;
      return ok;
    }

    // 6) En producción: consideramos éxito 204 (expected) o 200 (variantes)
    return resp.status === 204 || resp.status === 200;

  } catch (err) {
    console.error("[forms] ❌ Error en envío:", err);
    return false;
  }
}
// async function submitJourneyToForm() {
//   try {
//     const fd = buildFormDataFromState();

//     // ---- FormData -> URLSearchParams (lo que espera tu Worker sin 400) ----
//     const body = new URLSearchParams();
//     for (const [k, v] of fd.entries()) body.append(k, v);

//     const headers = {};
//     if (PROXY_KEY) headers["X-Proxy-Key"] = PROXY_KEY;
//     headers["Content-Type"] = "application/x-www-form-urlencoded;charset=UTF-8";

//     // Log opcional (previo a enviar)
//     const preview = {};
//     for (const [k, v] of body.entries()) (preview[k] ||= []).push(v);
//     console.log("=== LOG ENVÍO (via Worker) ===", preview);

//     // Envío con debug=1 para ver status de Google
//     const resp = await fetch(PROXY_URL + "?debug=1", {
//       method: "POST",
//       mode: "cors",
//       headers,
//       body
//     });

//     const dbg = await resp.json().catch(() => ({}));
//     console.log("[forms] 🔍 Debug Worker →", dbg);
//     console.log("[forms] ✅ Enviado vía Worker");
//   } catch (err) {
//     console.error("[forms] ❌ Error en envío:", err);
//   }
// }

  
// /* Hook del botón final */
// document.addEventListener("DOMContentLoaded", ()=>{
//   const btn = document.getElementById("finish");
//   if (!btn) {
//     console.warn('[forms] No encontré #finish; agregá id="finish" al botón final.');
//     return;
//   }
//   btn.addEventListener("click", async (e)=>{
//     e.preventDefault();
//     try {
//       await submitJourneyToForm();        // 👈 esperamos a que el Worker responda
//     } catch (err) {
//       console.error("Envío falló:", err); // opcional: mostrar toast
//     } finally {
//       window.location.href = "https://rfullivarri.github.io/gamificationweblanding/loginv2.html?await=1";
//     }
//   });
// });

document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("finish");
  if (!btn){ console.warn('[forms] No encontré #finish'); return; }

  btn.addEventListener("click", async (e)=>{
    e.preventDefault();

    // UI: bloquear y mostrar spinner
    btn.disabled = true;
    btn.classList.add("loading");
    // opcional: cambiar texto mientras envía
    const oldTxt = btn.textContent;
    btn.textContent = "Enviando…";

    const ok = await submitJourneyToForm();

    if (ok){
      // éxito → ahora sí navegamos
      window.location.href = "https://rfullivarri.github.io/gamificationweblanding/loginv2.html?await=1";
    }else{
      // fallo → reactivar UI y avisar
      btn.classList.remove("loading");
      btn.disabled = false;
      btn.textContent = oldTxt;
      alert("No pudimos enviar. Revisá tu conexión e intentá de nuevo.");
    }
  });
});

</html>
