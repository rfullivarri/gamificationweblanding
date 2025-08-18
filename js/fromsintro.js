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

// ====== ENVÍO FIABLE A GOOGLE FORMS ======
// Enviamos como application/x-www-form-urlencoded (compatible con iOS Safari),
// probamos sendBeacon con Blob; si no, fetch no-cors; si no, formulario oculto + iframe.

async function submitToGoogleForms(){
  const fd = buildFormDataFromJourney();

  // 1) Convertir FormData -> urlencoded (k=v&k=v...)
  const pairs = [];
  for (const [k, v] of fd.entries()) {
    pairs.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(v)));
  }
  const bodyUrlEnc = pairs.join("&");
  const blob = new Blob([bodyUrlEnc], { type: "application/x-www-form-urlencoded;charset=UTF-8" });

  // 2) Intento con sendBeacon (iOS no acepta FormData, pero sí Blob urlencoded)
  try {
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon(FORM_ACTION_URL, blob);
      if (ok) return true;
    }
  } catch (e) {
    console.warn("[submit] sendBeacon error:", e);
  }

  // 3) Fallback fetch no-cors con urlencoded
  try {
    await fetch(FORM_ACTION_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: bodyUrlEnc
    });
    return true;
  } catch (e) {
    console.error("[submit] fetch error:", e);
  }

  // 4) Último recurso: form oculto apuntando a un iframe invisible
  try {
    const iframe = document.createElement("iframe");
    iframe.name = "hidden_iframe_target";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const form = document.createElement("form");
    form.action = FORM_ACTION_URL;
    form.method = "POST";
    form.target = "hidden_iframe_target";
    form.style.display = "none";

    // recrear inputs hidden a partir del FormData
    for (const [k, v] of fd.entries()) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = k;
      input.value = String(v);
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();

    return true;
  } catch (e) {
    console.error("[submit] hidden form error:", e);
    return false;
  }
}

// Listener del botón final
document.addEventListener("DOMContentLoaded", ()=>{
  const btn = document.getElementById("finish");
  if (!btn) { console.warn("#finish no encontrado"); return; }

  btn.addEventListener("click", async (e)=>{
    e.preventDefault();
    const ok = await submitToGoogleForms();
    // Pequeño delay para que el envío termine de flushear
    setTimeout(()=>{
      // Redirección post-envío
      window.location.href = "https://rfullivarri.github.io/gamificationweblanding/loginv2.html?await=1";
    }, 200);
  });
});
