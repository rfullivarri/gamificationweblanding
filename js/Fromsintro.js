// 1) PONÉ LA URL DE TU FORM AQUÍ (la que termina en /formResponse)
const FORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSclxAQ2reKAgONJL3S5Js1GLzGLAciQO1cedbuFSx66u4iD8Q/formResponse";

// 2) Mapeo de tus entry.xxx (reemplazá los números)
const entries = {
  mode: "entry.97701242",
  xp_total: "entry.1162318324",
  xp_body:  "entry.719321726",
  xp_mind:  "entry.1918862868",
  xp_soul:  "entry.463475479",

  // ---- LOW (checklists + nota) ----
  low_body: "entry.811917583",     // Dormir mejor, Alimentarte mejor, ...
  low_soul: "entry.1264509887",    // Respirar, Música, Naturaleza, ...
  low_mind: "entry.930582201",     // Leer corto, Anotar, Serie tranquila, ...
  low_note: "entry.1684429349",    // Contarnos cómo estás LOW (abierta)

  // ---- CHILL ----
  chill_one:   "entry.1593318786", // “Si pudieras mejorar o lograr una cosa…” (abierta)
  chill_motiv: "entry.245183915",  // Motivaciones (MC)

  // ---- FLOW ----
  flow_goal:  "entry.1840529708",  // Objetivo FLOW (abierta)
  flow_imped: "entry.1903049465",  // Impedimentos (MC)

  // ---- EVOLVE ----
  evolve_goal:  "entry.1816542307", // Objetivo desafiante (abierta)
  evolve_trade: "entry.263772832",  // ¿Qué estás dispuesto a cambiar? (MC)
  evolve_att:   "entry.1936745776", // Actitud (radio)

  // ---- FOUNDATIONS (Body / Soul / Mind) ----
  f_body:       "entry.1504903278", // Body (10 opciones MC)
  f_body_open:  "entry.263311735",  // “Algo que te cueste” Body (abierta)

  f_soul:       "entry.753306725",  // Soul (10 opciones MC)
  f_soul_open:  "entry.590475620",  // Prácticas espirituales (abierta)

  f_mind:       "entry.1978710",    // Mind (10 opciones MC)
  f_mind_open:  "entry.1918822353", // ¿Qué te gustaría lograr mentalmente? (abierta)
};

// Utilidad: añade 1 o muchas respuestas al mismo entry (checkbox → varias filas del mismo entry)
function appendMany(fd, entryId, values){
  if (!entryId || values == null) return;
  if (Array.isArray(values)) values.forEach(v => fd.append(entryId, String(v)));
  else fd.append(entryId, String(values));
}

// Construye el FormData desde el estado expuesto por el flujo
function buildFormDataFromJourney(){
  const {answers, xp} = window.JOURNEY_STATE;
  const fd = new FormData();

  appendMany(fd, entries.mode,      answers.mode || "");
  appendMany(fd, entries.xp_total,  Math.round(xp.total));
  appendMany(fd, entries.xp_body,   Math.round(xp.Body));
  appendMany(fd, entries.xp_mind,   Math.round(xp.Mind));
  appendMany(fd, entries.xp_soul,   Math.round(xp.Soul));

  if (answers.mode === "LOW"){
    appendMany(fd, entries.low_body, answers.low.body);
    appendMany(fd, entries.low_soul, answers.low.soul);
    appendMany(fd, entries.low_mind, answers.low.mind);
    appendMany(fd, entries.low_note, answers.low.note || "");
  } else if (answers.mode === "CHILL"){
    appendMany(fd, entries.chill_one,   answers.chill.oneThing || "");
    appendMany(fd, entries.chill_motiv, answers.chill.motiv);
    // Foundations
    appendMany(fd, entries.f_body, answers.foundations.body);
    appendMany(fd, entries.f_soul, answers.foundations.soul);
    appendMany(fd, entries.f_mind, answers.foundations.mind);
  } else if (answers.mode === "FLOW"){
    appendMany(fd, entries.flow_goal,   answers.flow.goal || "");
    appendMany(fd, entries.flow_imped,  answers.flow.imped);
    // Foundations
    appendMany(fd, entries.f_body, answers.foundations.body);
    appendMany(fd, entries.f_soul, answers.foundations.soul);
    appendMany(fd, entries.f_mind, answers.foundations.mind);
  } else if (answers.mode === "EVOLVE"){
    appendMany(fd, entries.evolve_goal,  answers.evolve.goal || "");
    appendMany(fd, entries.evolve_trade, answers.evolve.trade);
    appendMany(fd, entries.evolve_att,   answers.evolve.att || "");
    // Foundations
    appendMany(fd, entries.f_body, answers.foundations.body);
    appendMany(fd, entries.f_soul, answers.foundations.soul);
    appendMany(fd, entries.f_mind, answers.foundations.mind);
  }

  // Campos que Forms suele esperar
  fd.append("fvv","1");
  fd.append("draftResponse","[]");
  fd.append("pageHistory","0");

  return fd;
}

async function submitToGoogleForms(){
  try{
    const fd = buildFormDataFromJourney();
    await fetch(FORM_ACTION_URL, { method:"POST", mode:"no-cors", body: fd });
  }catch(err){
    console.error("Error enviando al Form:", err);
  }
}

// Enlazar botón final
document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("finish");
  if (!btn) return;
  btn.addEventListener("click", async (e)=>{
    e.preventDefault();
    await submitToGoogleForms();
    // Acá navegás a tu ThankYou o dejas la pantalla de misiones
    alert("Onboarding terminado. Respuestas enviadas ✅");
  });
});
