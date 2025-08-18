// submit.js  —  Enviar respuestas del Journey a Google Forms (versión GitHub Pages + redirect)

// 1) URL de tu Form (termina en /formResponse)
const FORM_ACTION_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSclxAQ2reKAgONJL3S5Js1GLzGLAciQO1cedbuFSx66u4iD8Q/formResponse";

// 2) Mapeo de tus entry.xxx (ya con email correcto)
const entries = {
  email: "entry.646330003",  // ✅ entry del campo Email

  mode: "entry.97701242",
  xp_total: "entry.1162318324",
  xp_body:  "entry.719321726",
  xp_mind:  "entry.1918862868",
  xp_soul:  "entry.463475479",

  // ---- LOW ----
  low_body: "entry.811917583",
  low_soul: "entry.1264509887",
  low_mind: "entry.930582201",
  low_note: "entry.1684429349",

  // ---- CHILL ----
  chill_one:   "entry.1593318786",
  chill_motiv: "entry.245183915",

  // ---- FLOW ----
  flow_goal:  "entry.1840529708",
  flow_imped: "entry.1903049465",

  // ---- EVOLVE ----
  evolve_goal:  "entry.1816542307",
  evolve_trade: "entry.263772832",
  evolve_att:   "entry.1936745776",

  // ---- FOUNDATIONS ----
  f_body:       "entry.1504903278",
  f_body_open:  "entry.263311735",
  f_soul:       "entry.753306725",
  f_soul_open:  "entry.590475620",
  f_mind:       "entry.1978710",
  f_mind_open:  "entry.1918822353",
};

// helper para arrays o strings
function appendMany(fd, entryId, values){
  if (!entryId || values == null) return;
  if (Array.isArray(values)) values.forEach(v => fd.append(entryId, String(v)));
  else fd.append(entryId, String(values));
}

// construir el payload desde el estado global
function buildFormDataFromJourney(){
  const {answers, xp} = window.JOURNEY_STATE;
  const fd = new FormData();

  // XP: total calculado como suma de pilares redondeados (evita desfases)
  const b = Math.round(xp.Body);
  const m = Math.round(xp.Mind);
  const s = Math.round(xp.Soul);
  const totalShown = b + m + s;

  appendMany(fd, entries.email,    answers.email || "");
  appendMany(fd, entries.mode,     answers.mode  || "");
  appendMany(fd, entries.xp_total, totalShown);
  appendMany(fd, entries.xp_body,  b);
  appendMany(fd, entries.xp_mind,  m);
  appendMany(fd, entries.xp_soul,  s);

  if (answers.mode === "LOW"){
    appendMany(fd, entries.low_body, answers.low.body);
    appendMany(fd, entries.low_soul, answers.low.soul);
    appendMany(fd, entries.low_mind, answers.low.mind);
    appendMany(fd, entries.low_note, answers.low.note || "");
  } else if (answers.mode === "CHILL"){
    appendMany(fd, entries.chill_one,   answers.chill.oneThing || "");
    appendMany(fd, entries.chill_motiv, answers.chill.motiv);
    appendMany(fd, entries.f_body, answers.foundations.body);
    appendMany(fd, entries.f_soul, answers.foundations.soul);
    appendMany(fd, entries.f_mind, answers.foundations.mind);
  } else if (answers.mode === "FLOW"){
    appendMany(fd, entries.flow_goal,  answers.flow.goal || "");
    appendMany(fd, entries.flow_imped, answers.flow.imped);
    appendMany(fd, entries.f_body, answers.foundations.body);
    appendMany(fd, entries.f_soul, answers.foundations.soul);
    appendMany(fd, entries.f_mind, answers.foundations.mind);
  } else if (answers.mode === "EVOLVE"){
    appendMany(fd, entries.evolve_goal,  answers.evolve.goal || "");
    appendMany(fd, entries.evolve_trade, answers.evolve.trade);
    appendMany(fd, entries.evolve_att,   answers.evolve.att || "");
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

// envío fiable: primero sendBeacon, si no, fetch no-cors
async function submitToGoogleForms(){
  const fd = buildFormDataFromJourney();

  let sent = false;
  try {
    if (navigator.sendBeacon) {
      // sendBeacon necesita un Blob; FormData funciona en la mayoría de navegadores modernos
      sent = navigator.sendBeacon(FORM_ACTION_URL, fd);
      console.log("[submit] sendBeacon:", sent);
    }
  } catch (e) { console.warn("[submit] sendBeacon error:", e); }

  if (!sent) {
    try {
      await fetch(FORM_ACTION_URL, { method:"POST", mode:"no-cors", body: fd });
      console.log("[submit] fetch no-cors disparado");
    } catch (e) {
      console.error("[submit] fetch error:", e);
    }
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("finish");
  if (!btn) { console.warn("#finish no encontrado"); return; }

  btn.addEventListener("click", async (e)=>{
    e.preventDefault();
    // dispara envío y luego redirige
    await submitToGoogleForms();
    // pequeña espera (por si el navegador decide flush asíncrono del beacon)
    setTimeout(()=>{
      window.location.href = "https://rfullivarri.github.io/gamificationweblanding/loginv2.html?await=1";
    }, 150);
  });
});
