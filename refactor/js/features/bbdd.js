/**
 * Módulo: BBDDEditor
 * Propósito: replicar la consola de edición y confirmación de BBDD.
 * API pública: init()
 * Dependencias: DOM estándar, fetch.
 * Side-effects: localStorage/sessionStorage, listeners globales y window.* helpers.
 * Notas de accesibilidad: gestiona foco, aria-live y bloqueo de UI al confirmar.
 */

/* ====== Config ====== */
// PRODUCCIÓN: apuntá al Worker
const API_BASE = "https://gamificationbbddedit.rfullivarri22.workers.dev/api";
const PROXY_KEY = "bbddconfig2332"; // misma que pusiste en el Worker
const DASHBOARD_URL = "https://rfullivarri.github.io/gamificationweblanding/dashboardv3.html";

/* ====== Catálogos ====== */
const PILARES_OPTS = ["Body", "Mind", "Soul"];
const DIFICULTAD_OPTS = ["Fácil", "Media", "Difícil"];
const RASGOS_POR_PILAR = {
  Body: ["Energía","Nutrición","Sueño","Recuperación","Hidratación","Higiene","Vitalidad","Postura","Movilidad","Moderación"],
  Mind: ["Enfoque","Aprendizaje","Creatividad","Gestión","Autocontrol","Resiliencia","Orden","Proyección","Finanzas","Agilidad"],
  Soul: ["Conexión","Espiritualidad","Propósito","Valores","Altruismo","Insight","Gratitud","Naturaleza","Gozo","Autoestima"],
};
const RASGOS_COMBO = Object.entries(RASGOS_POR_PILAR)
  .flatMap(([pilar, rasgos]) => rasgos.map(r => `${r}, ${pilar}`));

/* ====== Util ====== */
const qs = sel => document.querySelector(sel);
const qsa = sel => [...document.querySelectorAll(sel)];
const param = (k) => new URL(location.href).searchParams.get(k);
const email = (param("email") || localStorage.getItem("gj_email") || "").trim().toLowerCase();

function hashRows(rows){
  // rows: array de arrays (A-E)
  const s = rows.map(r => r.map(v => (v??"").toString().trim()).join("|")).join("||");
  // djb2 simple
  let h=5381; for(const ch of s) h=((h<<5)+h)+ch.charCodeAt(0); return h>>>0;
}
function cleanRasgo(s){
  s = (s||"").trim();
  return s.includes(",") ? s.split(",")[0].trim() : s;
}
function normPilar(v){
  const map = { body:"Body", cuerpo:"Body", mind:"Mind", mente:"Mind", soul:"Soul", alma:"Soul" };
  const k = (v||"").toString().trim().toLowerCase();
  return map[k] || (v||"").toString().trim();
}
function normDiff(v){
  const map = { facil:"Fácil","fácil":"Fácil", media:"Media", medio:"Media", dificil:"Difícil","difícil":"Difícil" };
  const k = (v||"").toString().trim().toLowerCase();
  return map[k] || (v||"").toString().trim();
}
function toast(msg, ok=true, ms=3200){
  const el = qs("#status-msg");
  el.textContent = msg;
  el.style.color = ok ? "#9ff7cc" : "#ff8a9b";
  setTimeout(()=>{ el.textContent=""; }, 4000);
}

// ===== [Estado] =====
let state = {
  rows: [],          // [[Pilar,Rasgo,Stats,Tasks,Dificultad,Feedback]]
  origHash: null,
  dirty: false,
  filter: "",
  aiUpdated: new Set(),
};

window.state = state;




// ===== [API adapters] =====
async function apiGetBBDD(email){
  const r = await fetch(`${API_BASE}/bbdd?email=${encodeURIComponent(email)}`, {
    credentials:"include",
    headers: { "X-Proxy-Key": PROXY_KEY }
  });
  if(!r.ok) throw new Error("Error al cargar BBDD");
  return r.json();
}
async function apiSaveBBDD(email, rows){
  const r = await fetch(`${API_BASE}/bbdd`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "X-Proxy-Key": PROXY_KEY },
    body: JSON.stringify({ email, rows })
  });
  if(!r.ok) throw new Error("Error al guardar BBDD");
  return r.json();
}
async function apiConfirmBBDD(email){
  const r = await fetch(`${API_BASE}/bbdd/confirm`, {
    method:"POST",
    headers:{ "Content-Type":"application/json", "X-Proxy-Key": PROXY_KEY },
    body: JSON.stringify({ email })
  });
  if(!r.ok) throw new Error("Error al confirmar cambios");
  return r.json();
}

// ===== [UI: render] =====
function render(){
  const tbody = qs("#bbdd-tbody");
  tbody.innerHTML = "";

  const term = state.filter.toLowerCase();

  state.rows.forEach((row, realIdx) => {
    // aplicar filtro sin perder índice real
    if (term) {
      const hay = row.join(" ").toLowerCase().includes(term);
      if (!hay) return;
    }

    const tr = document.createElement("tr");
    tr.draggable = true;
    tr.dataset.index = realIdx; // << índice REAL en state.rows
    tr.innerHTML = `
      <td>${selectPilar(row[0])}</td>
      <td>${selectRasgo(row[1], row[0])}</td>
      <td>${inputText(row[2], "Stats")}</td>
      <td>${inputText(row[3], "Tasks")}</td>
      <td>${selectDiff(row[4])}</td>
      <td>${feedbackButtons(row[5]||"")}</td>
      <td class="row-actions">
        <span class="handle" title="Arrastrar">⋮⋮</span>
        <button class="mini" data-act="del">X</button>
      </td>
    `;
    if (state.aiUpdated.has(realIdx)) {
      tr.querySelector('input[data-col="3"]').classList.add("ai-updated");
    }
    tr.addEventListener("input", onRowInput);
    tr.addEventListener("click", onRowClick);
    tr.addEventListener("dragstart", onDragStart);
    tr.addEventListener("dragover", onDragOver);
    tr.addEventListener("drop", onDrop);

    tbody.appendChild(tr);
  });

  qs("#dirty-indicator").classList.toggle("hidden", !state.dirty);
}

function selectPilar(val){
  const opts = Array.from(new Set([...PILARES_OPTS])); // podríamos sumar existentes si querés
  const html = opts.map(o => `<option ${o===val?"selected":""}>${o}</option>`).join("");
  return `<select data-col="0">${html}</select>`;
}
function selectRasgo(val, pilarActual){
  const p = normPilar(pilarActual||"");
  const base = RASGOS_POR_PILAR[p] || [];
  const opts = Array.from(new Set([val, ...base])).filter(Boolean);
  const html = opts.map(o => `<option ${o===val?"selected":""}>${o}</option>`).join("");
  return `<select data-col="1">${html}</select>`;
}
function selectDiff(val){
  const opts = Array.from(new Set([...DIFICULTAD_OPTS, val].filter(Boolean)));
  const html = opts.map(o => `<option ${o===val?"selected":""}>${o}</option>`).join("");
  return `<select data-col="4">${html}</select>`;
}
function inputText(val, placeholder){
  const v = (val??"").toString().replace(/"/g,"&quot;");
  return `<input class="input" data-col="2or3" placeholder="${placeholder}" value="${v}"/>`.replace("2or3", placeholder==="Stats"?"2":"3");
}
function feedbackButtons(current){
  const is = k => current===k ? "active" : "";
  return `
    <div class="feedback" data-col="5">
      <button data-fb="improve" class="${is("improve")}" title="Mejorar esta task">🪄</button>
      <button data-fb="replace" class="${is("replace")}" title="Modificar esta task">🔁</button>
    </div>
  `;
}

/* ====== Handlers ====== */
function markDirty(){
  state.dirty = true;
  const dot = document.querySelector("#dirty-indicator");
  if (dot) dot.classList.remove("hidden"); // sin re-render
}

function onRowInput(e){
  const tr = e.currentTarget;
  const idx = Number(tr.dataset.index);
  const t = e.target;

  if(t.matches("select,[data-col]")){
    const col = Number(t.dataset.col);
    let val = t.value;

    if (col===0){            // Pilar cambió
      val = normPilar(val);
      state.rows[idx][0] = val;
    
      const rasgoActual = cleanRasgo(state.rows[idx][1]);
      if (!RASGOS_POR_PILAR[val]?.includes(rasgoActual)) {
        state.rows[idx][1] = "";
      }
      markDirty();
      render();              // <-- sólo acá
      return;
    }
    // col 1/2/3/4:
    if (col===1) val = cleanRasgo(val);
    if (col===4) val = normDiff(val);
    state.rows[idx][col] = val;
    markDirty();            // <-- sin render
  }
}

function onRowClick(e){
  const tr = e.currentTarget;
  const idx = Number(tr.dataset.index);
  const t = e.target;

  // feedback por fila
  if (t.closest(".feedback")){
    const fb = t.dataset.fb; // "improve" | "replace"
    if(!fb) return;
    const wasActive = t.classList.contains("active");
    state.rows[idx][5] = wasActive ? "" : fb; // toggle
    const box = t.closest(".feedback");
    box.querySelectorAll("button").forEach(b=>b.classList.remove("active"));
    if (!wasActive) t.classList.add("active");
    markDirty();
    return;
  }

  // eliminar fila
  if(t.dataset.act === "del"){
    state.rows.splice(idx,1);
  
    // Reindexar el set de aiUpdated
    const next = new Set();
    for (const i of state.aiUpdated) {
      if (i < idx) next.add(i);
      else if (i > idx) next.add(i - 1);
      // si i === idx, la fila borrada desaparece del set
    }
    state.aiUpdated = next;
  
    markDirty(); render();
  }
}

// ===== [DnD] =====
let dragIndex = null;
function onDragStart(e){ dragIndex = Number(e.currentTarget.dataset.index); e.dataTransfer.effectAllowed="move"; }
function onDragOver(e){ e.preventDefault(); e.dataTransfer.dropEffect="move"; }
function onDrop(e){
  e.preventDefault();
  const to = Number(e.currentTarget.dataset.index);
  if(dragIndex===null || to===dragIndex) return;

  // mover la fila
  const [item] = state.rows.splice(dragIndex,1);
  state.rows.splice(to,0,item);

  // mover también la marca aiUpdated si corresponde
  const moved = state.aiUpdated.has(dragIndex);
  const next = new Set();
  for (const i of state.aiUpdated) {
    if (i === dragIndex) continue;         // se reubicará
    // corregir índices que quedaron entre medio
    if (dragIndex < to)       next.add(i > dragIndex && i <= to ? i - 1 : i);
    else if (dragIndex > to)  next.add(i >= to && i < dragIndex ? i + 1 : i);
    else                      next.add(i);
  }
  if (moved) next.add(to);
  state.aiUpdated = next;

  dragIndex = null;
  markDirty(); render();
}

/*====HELPERS=====*/
function setTableLoading(on){
  qs("#table-wrap").classList.toggle("table-loading", on);
  const spin = qs("#table-spinner");
  if (!spin) return;
  spin.style.display = on ? "" : "none"; // deja que el CSS ponga display:flex
}

function aiLoading(on){
  const wrap = qs("#table-wrap");
  if(!wrap) return;
  wrap.classList.toggle("ai-loading", !!on);
}

/* === Polyfill/bridge: setDot seguro si el dashboard no está cargado === */
function _localSetDot(el, on, color = '#ffc107') {
  if (!el) return;
  let dot = el.querySelector(':scope > .dot');
  if (on) {
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'dot';
      el.appendChild(dot);
    }
    dot.style.background = color;
    // posición especial sólo para la hamburguesa
    if (el.id === 'menu-toggle') {
      dot.style.top = '-2px';
      dot.style.right = '-2px';
    } else {
      dot.style.top = '';
      dot.style.right = '';
    }
  } else if (dot) {
    dot.remove();
  }
}

/* Usa window.setDot si existe; si no, usa el local para que no falle */
const setDotSafe = (typeof window !== 'undefined' && typeof window.setDot === 'function')
  ? window.setDot
  : _localSetDot;


/* ====== Actions ====== */
function currentVisibleRows(){
  // devuelve matriz A-E (ignora feedback para guardar)
  return state.rows.map(r => [ normPilar(r[0]), cleanRasgo(r[1]), (r[2]||""),(r[3]||""), normDiff(r[4]) ]);
}

async function doSave(){
  const rows = currentVisibleRows()
    .filter(r => r.some(v => (v||"").toString().trim()!=="")); // quita filas totalmente vacías

  // validaciones mínimas
  for(const r of rows){
    if(!["Body","Mind","Soul"].includes(r[0])) return toast("Pilar inválido. Usá Body/Mind/Soul.", false);
    if(!r[3]) return toast("La columna 'Tasks' no puede estar vacía.", false);
  }

  await apiSaveBBDD(email, rows);
  state.origHash = hashRows(rows);
  state.dirty = false;
  state.aiUpdated.clear();
  toast("✅ Guardado");
  render();
}

async function doConfirm(){
  const btn = document.querySelector("#bbdd-confirm");
  // START loading UI
  btn.disabled = true;
  btn.classList.add("loading");
  btn.setAttribute("aria-busy", "true");

  try {
    // 1) Construir A–E desde el estado actual (normalizado)
    const rows = currentVisibleRows().filter(r =>
      r.some(v => (v||"").toString().trim()!=="")
    );

    // 2) Guardar en servidor (decide estado y escribe Setup!E14)
    let saveRes;
    try {
      saveRes = await apiSaveBBDD(email, rows); // { ok, estado, ... }
    } catch (err) {
      toast("Error al guardar: " + err.message, false);
      return; // <- el finally re-activa el botón
    }

    const estado = (saveRes && saveRes.estado) || "constante";
    if (estado === "constante"){
      toast("✅ No hubo cambios (estado: constante)");
      state.dirty = false;
      // No re-render masivo aquí para no perder foco; sólo ocultá el dot:
      const dot = document.querySelector("#dirty-indicator");
      if (dot) dot.classList.add("hidden");
      return; // <- no confirm → no BOBO
    }

    // 3) Confirmar (marca F/G y dispara BOBO)
    try {
      await apiConfirmBBDD(email);
      state.dirty = false;
      state.aiUpdated.clear();
      render();
      toast("✅ Cambios confirmados. ¡Estamos configurando tu Daily Quest!");

      // === UI Onboarding: si es PRIMERA vez, avisar al dashboard de forma inmediata ===
      const isFirst = String(estado || '').toLowerCase() === 'primera';
      if (isFirst) {
        try {
          // 1) avisar al DASHBOARD (funciona en overlay/iframe o en otra pestaña)
          try {
            window.parent?.postMessage(
              { kind: 'GJ_ONBOARD', step: 'BBDD_CONFIRMED', estado: 'primera', email },
              '*'
            );
          } catch {}
      
          // 2) fallback si navega al dashboard en el mismo tab
          try { sessionStorage.setItem('gj_onboarding', 'primera'); } catch {}
      
          // 3) one-shot legacy por si el dashboard aún no tenía el listener
          try { localStorage.setItem(`gj_force_scheduler_banner:${(email||'').toLowerCase()}`, '1'); } catch {}
        } catch {}
      }

    } catch (err) {
      toast("Error en confirmación: " + err.message, false);
      return;
    }

    // 4) Cerrar / volver (sin navegar para que el banner quede visible en el dashboard)
    setTimeout(()=>{
      if(window.BBDD_MODE==="modal"){
        window.GJ_AUTO?.poke();  //LLAMA A CONSULTAR EL REFRESH KV
        closeOverlay();    // el dashboard ya está detrás y con el banner mostrado
      } else {
        // Si preferís navegar igualmente, podés reactivar esta línea:
        // location.href = `${DASHBOARD_URL}?email=${encodeURIComponent(email)}`;
      }
    }, 300);

  } finally {
    // END loading UI (se ejecuta SIEMPRE, incluso si hubo return/throw)
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.removeAttribute("aria-busy");
  }
}

window.doConfirm = doConfirm;


// /* ====== Actions ====== */
// function currentVisibleRows(){
//   // devuelve matriz A-E (ignora feedback para guardar)
//   return state.rows.map(r => [ normPilar(r[0]), cleanRasgo(r[1]), (r[2]||""),(r[3]||""), normDiff(r[4]) ]);
// }

// async function doSave(){
//   const rows = currentVisibleRows()
//     .filter(r => r.some(v => (v||"").toString().trim()!=="")); // quita filas totalmente vacías

//   // validaciones mínimas
//   for(const r of rows){
//     if(!["Body","Mind","Soul"].includes(r[0])) return toast("Pilar inválido. Usá Body/Mind/Soul.", false);
//     if(!r[3]) return toast("La columna 'Tasks' no puede estar vacía.", false);
//   }

//   await apiSaveBBDD(email, rows);
//   state.origHash = hashRows(rows);
//   state.dirty = false;
//   state.aiUpdated.clear();
//   toast("✅ Guardado");
//   render();
// }

// async function doConfirm(){
//   const btn = document.querySelector("#bbdd-confirm");
//   // START loading UI
//   btn.disabled = true;
//   btn.classList.add("loading");
//   btn.setAttribute("aria-busy", "true");

//   try {
//     // 1) Construir A–E desde el estado actual (normalizado)
//     const rows = currentVisibleRows().filter(r =>
//       r.some(v => (v||"").toString().trim()!=="")
//     );

//     // 2) Guardar en servidor (decide estado y escribe Setup!E14)
//     let saveRes;
//     try {
//       saveRes = await apiSaveBBDD(email, rows); // { ok, estado, ... }
//     } catch (err) {
//       toast("Error al guardar: " + err.message, false);
//       return; // <- el finally re-activa el botón
//     }

//     const estado = (saveRes && saveRes.estado) || "constante";
//     if (estado === "constante"){
//       toast("✅ No hubo cambios (estado: constante)");
//       state.dirty = false;
//       // No re-render masivo aquí para no perder foco; sólo ocultá el dot:
//       const dot = document.querySelector("#dirty-indicator");
//       if (dot) dot.classList.add("hidden");
//       return; // <- no confirm → no BOBO
//     }

//     // 3) Confirmar (marca F/G y dispara BOBO)
//     try {
//       await apiConfirmBBDD(email);
//       state.dirty = false;
//       state.aiUpdated.clear();
//       render();
//       toast("✅ Cambios confirmados. ¡Estamos configurando tu Daily Quest!");
    
//       // === UI Onboarding (optimista estricta): solo si estado === "primera" ===
//       const isFirst = String(estado || '').toLowerCase() === 'primera';
    
//       if (isFirst) {
//         try {
//           // 1) Ocultar banners de BBDD si están visibles
//           ['journey-warning','bbdd-warning'].forEach(id => {
//             const el = document.getElementById(id);
//             if (el && getComputedStyle(el).display !== 'none') el.style.display = 'none';
//           });
    
//           // 2) Apagar dots de BBDD en menú (usa polyfill seguro)
//           setDotSafe(document.getElementById('menu-toggle'), false);
//           setDotSafe(document.getElementById('li-edit-bbdd'), false);
    
//           // 3) Mostrar banner de Programar Daily + dots (no marcamos "visto" acá)
//           const warn = document.getElementById('scheduler-warning');
//           if (warn && getComputedStyle(warn).display === 'none') {
//             warn.style.display = 'block';
//           }
//           setDotSafe(document.getElementById('menu-toggle'), true, '#ffc107');
//           setDotSafe(document.getElementById('open-scheduler'), true, '#ffc107');
    
//           // ⚠️ NO grabamos gj_sched_hint_shown acá: solo al hacer click en "Programar"
//         } catch (uiErr) {
//           console.warn('[BBDD UI] hint scheduler fallo suave:', uiErr);
//         }
//       }
    
//     } catch (err) {
//       toast("❌ Error en confirmación: " + err.message, false);
//       return;
//     }

//     // 4) Cerrar / volver
//     setTimeout(()=>{
//       if(window.BBDD_MODE==="modal"){
//         closeOverlay();
//         if(confirm("¿Volver al Dashboard?")){
//           location.href = `${DASHBOARD_URL}?email=${encodeURIComponent(email)}`;
//         }
//       } else {
//         location.href = `${DASHBOARD_URL}?email=${encodeURIComponent(email)}`;
//       }
//     }, 400);

//   } finally {
//     // END loading UI (se ejecuta SIEMPRE, incluso si hubo return/throw)
//     btn.disabled = false;
//     btn.classList.remove("loading");
//     btn.removeAttribute("aria-busy");
//   }
// }

/* ====== Clipboard paste ====== */
async function pasteFromClipboard(){
  try{
    const text = await navigator.clipboard.readText();
    if(!text) return;
    const lines = text.split(/\r?\n/).map(l=>l.split("\t"));
    // mapeamos columnas 0..4 como A-E
    for(const cols of lines){
      if(cols.every(c=>!c)) continue;
      const row = [
        normPilar(cols[0]||""),
        cleanRasgo(cols[1]||""),
        (cols[2]||""),
        (cols[3]||""),
        normDiff(cols[4]||""),
        "" // feedback
      ];
      state.rows.push(row);
    }
    markDirty(); render();
  }catch(err){ toast("No pude leer el portapapeles", false); }
}

/* ====== Filtro ====== */
function onFilter(e){ state.filter = e.target.value; render(); }

/* ====== Overlay control ====== */
function openOverlay(){
  qs("#bbdd-overlay").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeOverlay(){
  if(state.dirty && !confirm("Tenés cambios sin guardar. ¿Cerrar igualmente?")) return;
  qs("#bbdd-overlay").classList.add("hidden");
  document.body.style.overflow = "";
}




/* ====== AI wiring ====== */

// 1) Tomar selección con feedback y construir batch + mapa de índices reales
function aiBuildSelection() {
  const idxs = [];   // índices reales en state.rows
  const batch = [];  // [[Pilar,Rasgo,Stat,Task,Dificultad,Acción], ...]
  state.rows.forEach((r, i) => {
    const fb = (r[5] || "").toLowerCase(); // "improve" | "replace"
    if (fb === "improve" || fb === "replace") {
      idxs.push(i);
      batch.push([
        normPilar(r[0] || ""),
        cleanRasgo(r[1] || ""),
        (r[2] || ""),
        (r[3] || ""),
        normDiff(r[4] || ""),
        fb
      ]);
    }
  });
  return { idxs, batch };
}

// 2) POST al Worker de AI
async function aiSendBatch(email, batch) {
  const AI_API = "https://gamificationaicuratetask.rfullivarri22.workers.dev/"; // ok que esté acá
  const url = AI_API;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, batch })
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("Respuesta no es JSON"); }

  if (!res.ok) {
    throw new Error(data?.error || `Error ${res.status}`);
  }
  if (!data?.results || !Array.isArray(data.results)) {
    throw new Error("Respuesta sin 'results'");
  }
  return data.results; // [[Pilar,Rasgo,Stat,NuevaTask,Dificultad,Acción], ...]
}

// 3) Aplicar resultados a state.rows según índices
function aiApplyResults(idxs, results) {
  if (idxs.length !== results.length) {
    throw new Error("Desfase resultados vs selección");
  }
  for (let k = 0; k < idxs.length; k++) {
    const rowIndex = idxs[k];
    const resultRow = results[k];
    const newTask = (resultRow?.[3] || "").toString().trim();
    if (newTask) {
      state.rows[rowIndex][3] = newTask;  // pegar Task
      state.rows[rowIndex][5] = "";       // limpiar feedback
      state.aiUpdated.add(rowIndex);
    }
  }
}

window.aiApplyResults = aiApplyResults;

// 4) Orquestador con chunking (para muchas filas)
async function aiRunForSelection() {
  const { idxs, batch } = aiBuildSelection();
  if (!idxs.length) {
    alert("Seleccioná al menos una fila con 🪄 o 🔁");
    return;
  }

  // UI loading
  aiLoading(true);
 //setTableLoading(true);

  try {
    const CHUNK = 20; // podés subirlo si querés, 20–30 es sano
    for (let start = 0; start < batch.length; start += CHUNK) {
      const end = Math.min(start + CHUNK, batch.length);
      const sliceIdxs = idxs.slice(start, end);
      const sliceBatch = batch.slice(start, end);

      const results = await aiSendBatch(email, sliceBatch);
      aiApplyResults(sliceIdxs, results);
      render(); // ver el progreso por tandas
    }

    markDirty(); // hay cambios locales sin guardar
    toast("✅ Tareas generadas por AI. Revisá y guardá cuando estés conforme.");

  } catch (err) {
    console.error(err);
    toast("Error al generar con AI: " + err.message, false);
  } finally {
    aiLoading(false);
    setTableLoading(false);
  }
}






// ===== [UI: extras portados del inline] =====
function setupAppbarSnap(){
  if (setupAppbarSnap.done) return;
  setupAppbarSnap.done = true;
  const panel  = document.querySelector('.bbdd-panel');
  const appbar = document.querySelector('header.appbar');
  const main   = document.querySelector('.bbdd-panel > main');
  if(!panel || !appbar || !main) return;

  const root = document.documentElement;

  let lastY = panel.scrollTop;
  let hide  = 0;
  let H     = appbar.offsetHeight || 0;
  let MAX   = Math.max(0, H - 6);
  const K = 1;
  const FRICTION = 0.13;

  function applyVars(){
    appbar.style.setProperty('--appbarHide', hide + 'px');
    const pad = 0;
    root.style.setProperty('--appbarPad', pad + 'px');
    main.style.setProperty('--appbarPad', pad + 'px');
  }

  function recalcHeader(){
    H   = appbar.offsetHeight || 0;
    MAX = Math.max(0, H - 6);
    hide = Math.min(hide, MAX);
    applyVars();
  }

  new ResizeObserver(recalcHeader).observe(appbar);
  recalcHeader();

  panel.addEventListener('scroll', () => {
    const y  = panel.scrollTop;
    const dy = y - lastY;

    if (dy > 0) {
      hide += dy * K;
    } else if (dy < 0) {
      hide += dy * K * (1 - FRICTION);
    }

    hide = Math.min(Math.max(hide, 0), MAX);
    applyVars();

    if (y <= 0 && hide !== 0) {
      hide = 0;
      applyVars();
    }

    lastY = y;
  }, { passive:true });
}

function detectMode(){
  const q = new URLSearchParams(location.search);
  const hasEmail = q.has('email') && q.get('email').trim() !== '';
  window.BBDD_MODE = hasEmail ? 'page' : 'modal';
}

function setupMobileEnhancements(){
  if (setupMobileEnhancements.done) return;
  setupMobileEnhancements.done = true;
  const dup = document.getElementById('add-row-dup');
  if(dup){
    dup.addEventListener('click', (e)=>{
      e.preventDefault();
      document.getElementById('add-row')?.click();
    });
  }

  const originalAiApply = window.aiApplyResults;
  if(typeof originalAiApply === 'function'){
    window.aiApplyResults = function patchedAiApply(idxs, results){
      if(Array.isArray(idxs) && window.state && Array.isArray(window.state.rows)){
        idxs.forEach((rowIdx, pos)=>{
          const row = window.state.rows[rowIdx];
          if(!row) return;
          let mode = '';
          const res = Array.isArray(results) ? results[pos] : null;
          if(res){
            if(typeof res?.[5] === 'string') mode = res[5];
            else if(typeof res?.action === 'string') mode = res.action;
            else if(typeof res?.mode === 'string') mode = res.mode;
          }
          if(!mode && typeof row[5] === 'string'){
            const hint = row[5].toLowerCase();
            if(hint === 'improve' || hint === 'replace'){
              mode = hint;
            }
          }
          mode = (mode || '').toLowerCase();
          if(mode && mode.includes('modify')) mode = 'replace';
          if(mode && mode.includes('mejor')) mode = 'improve';
          if(mode !== 'improve' && mode !== 'replace'){
            mode = mode.includes('replace') ? 'replace' : (mode.includes('improve') ? 'improve' : mode);
          }
          if(mode === 'replace' || mode === 'improve'){
            row.__aiMode = mode;
          } else if(!row.__aiMode){
            row.__aiMode = 'improve';
          }
        });
      }
      return originalAiApply.apply(this, arguments);
    };
  }

  const tbody = document.getElementById('bbdd-tbody');
  if(!tbody) return;

  const observer = new MutationObserver((mutations)=>{
    for(const m of mutations){
      m.addedNodes.forEach(node => {
        if(node.nodeType === 1 && node.matches('tr')){
          enhanceRow(node);
        }
      });
    }
    requestAnimationFrame(armSwipeHint);
  });
  observer.observe(tbody,{childList:true});

  requestAnimationFrame(()=>{
    tbody.querySelectorAll('tr').forEach(enhanceRow);
    armSwipeHint();
  });

  let opened = null;
  let swipeHintDismissed = false;
  let currentHintEl = null;

  function enhanceRow(tr){
    if (tr.dataset.mobileReady === '1') return;

    const cells = tr.querySelectorAll('td');
    if (cells.length < 7) return;

    const pilarSel   = cells[0].querySelector('select[data-col="0"]');
    const rasgoSel   = cells[1].querySelector('select[data-col="1"]');
    const statInput  = cells[2].querySelector('input[data-col="2"]');
    const taskInput  = cells[3].querySelector('input[data-col="3"]');
    const diffSelect = cells[4].querySelector('select[data-col="4"]');
    const feedbackBox= cells[5].querySelector('.feedback');

    if (!taskInput || !diffSelect || !pilarSel || !rasgoSel || !statInput) return;

    const td = document.createElement('td');
    td.colSpan = tr.children.length || cells.length || 7;

    const item = document.createElement('div');
    item.className = 'item';

    const actions = document.createElement('div');
    actions.className = 'actions';
    const btnModify  = makeAction('modify','🔁','Modificar', ()=> runAiForRow(tr,'replace'));
    const btnImprove = makeAction('improve','🪄','Mejorar',   ()=> runAiForRow(tr,'improve'));
    const btnDelete  = makeAction('del','🗑️','Eliminar',     ()=> deleteRow(tr));
    actions.append(btnImprove, btnModify, btnDelete);

    const slidable = document.createElement('div');
    slidable.className = 'slidable shadow';

    const mark = document.createElement('div');
    mark.className = 'mark';

    const content = document.createElement('div');
    content.className = 'content';

    const rowMain = document.createElement('div');
    rowMain.className = 'row-main';

    taskInput.classList.add('task-input');
    taskInput.setAttribute('placeholder','Nueva task…');

    const diffChip = document.createElement('button');
    diffChip.type = 'button';
    diffChip.className = 'diff-chip';
    diffChip.title = 'Cambiar dificultad';
    diffChip.innerHTML = '<span class="dot"></span><span class="label"></span>';

    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'more';
    more.title = 'Mostrar columnas';
    more.textContent = '⋯';

    rowMain.append(taskInput, diffChip, more);

    const meta = document.createElement('div');
    meta.className = 'meta';

    const statLabel = createMeta('Stat', statInput);
    const rasgoLabel = createMeta('Rasgo', rasgoSel);
    const pilarLabel = createMeta('Pilar', pilarSel);

    const feedbackWrap = document.createElement('div');
    feedbackWrap.className = 'feedback';
    if (feedbackBox) {
      feedbackWrap.append(...feedbackBox.children);
    }

    const metaActions = document.createElement('div');
    metaActions.className = 'meta-actions';
    const aiImprove = makeMetaAction('🪄', 'Mejorar con IA', ()=> runAiForRow(tr,'improve'));
    const aiReplace = makeMetaAction('🔁', 'Modificar con IA', ()=> runAiForRow(tr,'replace'));
    const deleteBtn = makeMetaAction('🗑️', 'Eliminar fila', ()=> deleteRow(tr), true);
    metaActions.append(aiImprove, aiReplace, deleteBtn);

    meta.append(pilarLabel, rasgoLabel, statLabel, feedbackWrap, metaActions);

    slidable.append(mark, content, actions);
    content.append(rowMain, meta);

    item.append(slidable);
    td.append(item);

    tr.innerHTML = '';
    tr.append(td);
    tr.dataset.mobileReady = '1';

    const idx = Number(tr.dataset.index);
    if (!Number.isNaN(idx) && typeof state !== 'undefined'){
      if (state.aiUpdated && state.aiUpdated.has(idx)){
        const mode = state.rows?.[idx]?.__aiMode === 'replace' ? 'replace' : 'improve';
        item.classList.add(mode === 'replace' ? 'ai-modified' : 'ai-improved');
      }
    }

    updateDiff(diffChip, diffSelect.value);
    diffSelect.classList.add('sr-only');

    function pushDiffToState(){
      if (typeof state === 'undefined' || Number.isNaN(idx)) return;
      if (!state.rows || !state.rows[idx]) return;
      const v = (typeof normDiff === 'function') ? normDiff(diffSelect.value) : diffSelect.value;
      if (state.rows[idx][4] !== v) {
        state.rows[idx][4] = v;
        if (typeof markDirty === 'function') markDirty();
      }
    }

    diffChip.addEventListener('click', ()=>{
      cycleDiff(diffSelect);
      updateDiff(diffChip, diffSelect.value);
      pushDiffToState();
      diffSelect.dispatchEvent(new Event('input',  { bubbles:true }));
      diffSelect.dispatchEvent(new Event('change', { bubbles:true }));
    });

    diffSelect.addEventListener('change', ()=>{
      updateDiff(diffChip, diffSelect.value);
      pushDiffToState();
    });
    diffSelect.addEventListener('input', ()=>{
      updateDiff(diffChip, diffSelect.value);
      pushDiffToState();
    });

    more.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      const willExpand = !item.classList.contains('expanded');
      item.classList.toggle('expanded', willExpand);
      if (willExpand) openRow(item, slidable, true);
      else            closeRow(item, slidable);
    });

    makeSwipeable(item, slidable);
  }

  function makeAction(cls, icon, label, onClick){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `act ${cls}`;
    b.setAttribute('aria-label', label);
    b.innerHTML = `<span aria-hidden="true">${icon}</span><span class="sr-only">${label}</span>`;
    b.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      closeAll();
      onClick();
    });
    return b;
  }

  function makeMetaAction(icon, label, onClick, danger=false){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `meta-btn${danger ? ' danger' : ''}`;
    btn.innerHTML = `<span aria-hidden="true">${icon}</span><span>${label}</span>`;
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function createMeta(label, control){
    const wrap = document.createElement('label');
    wrap.textContent = label;
    wrap.append(control);
    return wrap;
  }

  function updateDiff(chip, value){
    chip.dataset.v = value || '';
    chip.querySelector('.label').textContent = value || '—';
  }

  function cycleDiff(select){
    const opts = Array.from(select.options).map(o=>o.value).filter(Boolean);
    if(!opts.length) return;
    const idx = opts.indexOf(select.value);
    const next = opts[(idx+1)%opts.length];
    select.value = next;
  }

  function makeSwipeable(wrapper, slide){
    const actions = wrapper.querySelector('.actions');
    const max = () => actions ? actions.getBoundingClientRect().width + 12 : 0;

    let startX = 0;
    let currentX = 0;
    let dragging = false;
    let pointerId = null;

    const start = (event) => {
      if (dragging) return;
      pointerId = event.pointerId;
      dragging = true;
      startX = event.clientX;
      wrapper.classList.add('dragging');
      slide.style.transition = 'none';
      wrapper.classList.remove('swipe-hint');
    };

    const move = (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      currentX = event.clientX;
      const dx = currentX - startX;
      if (dx < 0) {
        slide.style.transform = `translateX(${Math.max(dx, -max())}px)`;
        if (!wrapper.classList.contains('row-open')) {
          wrapper.classList.add('row-peek');
        }
      } else {
        slide.style.transform = `translateX(${Math.min(dx, 0)}px)`;
      }
    };

    const end = (event) => {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      wrapper.classList.remove('dragging');
      slide.style.transition = '';

      const dx = currentX - startX;
      const threshold = max() * 0.45;
      if (dx < -threshold) {
        openRow(wrapper, slide);
      } else {
        closeRow(wrapper, slide);
      }
      pointerId = null;
    };

    slide.addEventListener('pointerdown', start);
    slide.addEventListener('pointermove', move);
    slide.addEventListener('pointerup', end);
    slide.addEventListener('pointercancel', end);
    slide.addEventListener('pointerleave', end);
  }

  function openRow(wrapper, slide, viaMore=false){
    closeOther(wrapper);
    const actions = wrapper.querySelector('.actions');

    if(viaMore){
      slide.style.transform = 'translateX(0)';
      wrapper.classList.add('expanded');
    }else{
      const width = actions?.getBoundingClientRect().width
        || parseFloat(getComputedStyle(document.documentElement)
             .getPropertyValue('--actionsw')) || 0;
      slide.style.transform = `translateX(${-width - 12}px)`;
      wrapper.classList.remove('expanded');
    }

    wrapper.classList.add('row-open');
    wrapper.classList.remove('row-peek');
    opened = wrapper;

    if(wrapper === currentHintEl){
      dismissHint();
    }
  }

  function closeRow(wrapper, slide){
    slide.style.transform = 'translateX(0)';
    wrapper.classList.remove('row-open', 'row-peek');
    wrapper.classList.remove('expanded');
    if(opened === wrapper) opened = null;
  }

  function closeAll(){
    if(!opened) return;
    const slide = opened.querySelector('.slidable');
    if(slide) closeRow(opened, slide);
  }

  function closeOther(wrapper){
    if(!opened || opened === wrapper) return;
    const slide = opened.querySelector('.slidable');
    if(slide) closeRow(opened, slide);
  }

  document.addEventListener('pointerdown', (e)=>{
    if(!opened) return;
    if(opened.contains(e.target)) return;
    const slide = opened.querySelector('.slidable');
    if(slide) closeRow(opened, slide);
  });

  function armSwipeHint(){
    if(currentHintEl && !currentHintEl.isConnected){
      currentHintEl = null;
    }
    if(swipeHintDismissed) return;
    const first = tbody.querySelector('tr:first-child .item');
    if(!first || first === currentHintEl) return;
    if(currentHintEl){
      currentHintEl.classList.remove('swipe-hint');
    }
    currentHintEl = first;
    first.classList.add('swipe-hint');
    const stop = (ev)=>{
      if(!currentHintEl) return;
      if(ev && !currentHintEl.contains(ev.target)) return;
      dismissHint();
    };
    currentHintEl.addEventListener('touchstart', stop, { once:true, capture:true });
    currentHintEl.addEventListener('pointerdown', stop, { once:true, capture:true });
  }

  function dismissHint(){
    if(currentHintEl){
      currentHintEl.classList.remove('swipe-hint');
    }
    currentHintEl = null;
    swipeHintDismissed = true;
  }

  function deleteRow(tr){
    if(typeof state === 'undefined') return;
    const idx = Number(tr.dataset.index);
    if(Number.isNaN(idx)) return;
    state.rows.splice(idx,1);

    const next = new Set();
    for(const i of state.aiUpdated){
      if(i < idx) next.add(i);
      else if(i > idx) next.add(i - 1);
    }
    state.aiUpdated = next;

    markDirty();
    render();
  }

  async function runAiForRow(tr, mode){
    if(typeof state === 'undefined') return;
    const idx = Number(tr.dataset.index);
    if(Number.isNaN(idx)) return;
    const row = state.rows[idx];
    if(!row) return;

    try{
      aiLoading(true);
      row.__aiMode = mode === 'replace' ? 'replace' : 'improve';
      const batch = [[normPilar(row[0]||''), cleanRasgo(row[1]||''), (row[2]||''), (row[3]||''), normDiff(row[4]||''), mode]];
      const results = await aiSendBatch(email, batch);
      aiApplyResults([idx], results);
      markDirty();
      render();
      toast(mode === 'improve' ? '🪄 Task mejorada con IA' : '🔁 Task modificada con IA');
    }catch(err){
      console.error(err);
      toast('Error al usar IA: ' + err.message, false);
    }finally{
      aiLoading(false);
    }
  }
}

function registerShadowServiceWorker(){
  if (!('serviceWorker' in navigator)) return;
  const swUrl = new URL('../../sw.refactor.js', import.meta.url);
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { scope: '/' })
      .catch(err => console.error('[SW] registro falló', err));
  });
}

function guardConfirmButton(){
  const bbddPanel = document.querySelector('.bbdd-panel');
  const confirmarBtn = document.getElementById('bbdd-confirm');
  if (!bbddPanel || !confirmarBtn || typeof window.doConfirm !== 'function') {
    return;
  }

  const confirmarOriginal = window.doConfirm;

  const escudoDeGuardado = document.getElementById('saving-shield') ?? (() => {
    const nuevoEscudo = document.createElement('div');
    nuevoEscudo.id = 'saving-shield';
    Object.assign(nuevoEscudo.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '70',
      display: 'none',
      background: 'transparent',
      pointerEvents: 'auto',
    });
    bbddPanel.appendChild(nuevoEscudo);
    return nuevoEscudo;
  })();

  const desactivarControlesDelPanel = () => {
    bbddPanel.querySelectorAll('input, select, textarea, button').forEach(control => {
      if (control === confirmarBtn) return;
      if (!control.disabled) control.dataset.estabaActivo = '1';
      control.disabled = true;
    });
  };

  const restaurarControlesDelPanel = () => {
    bbddPanel.querySelectorAll('[data-estaba-activo="1"]').forEach(control => {
      control.disabled = false;
      delete control.dataset.estabaActivo;
    });
  };

  window.doConfirm = async function confirmarConEscudo() {
    if (confirmarBtn.dataset.bloqueado === '1') return;
    confirmarBtn.dataset.bloqueado = '1';

    document.activeElement?.blur?.();

    bbddPanel.classList.add('saving');
    bbddPanel.setAttribute('aria-busy', 'true');
    escudoDeGuardado.style.display = 'block';
    desactivarControlesDelPanel();

    try {
      await confirmarOriginal.call(this);
    } finally {
      restaurarControlesDelPanel();
      escudoDeGuardado.style.display = 'none';
      bbddPanel.classList.remove('saving');
      bbddPanel.removeAttribute('aria-busy');
      delete confirmarBtn.dataset.bloqueado;
    }
  };
}

/* ====== Init ====== */
async function init(){
  if(!email){
    alert("No se detectó tu email. Abrí esta página desde el Dashboard (menú → Editar Base).");
    return;
  }

  detectMode();
  setupAppbarSnap();

  // Modo: modal o página
  if (window.BBDD_MODE === "modal") {
    openOverlay();
  } else {
    qs("#bbdd-overlay").classList.remove("hidden");
  }

  guardConfirmButton();

  // ── Listeners UI ───────────────────────────────────────────────
  qs("#bbdd-back").addEventListener("click", (e)=> {
    e.preventDefault();

    if (window.BBDD_MODE === "modal") {
      closeOverlay();
      return;
    }

    // En “page/web”: priorizar &back= si existe; si no, ir al dashboard con email
    const u = new URL(location.href);
    const back = u.searchParams.get("back");
    if (back) {
      location.href = decodeURIComponent(back);
      return;
    }

    const dash = new URL(DASHBOARD_URL);
    if (email) dash.searchParams.set("email", email);
    location.href = dash.toString();
  });

  qs("#close-modal").addEventListener("click", closeOverlay);
  qs("#bbdd-confirm").addEventListener("click", ()=> doConfirm().catch(e=>toast(e.message,false)));
  qs("#add-row").addEventListener("click", ()=>{ state.rows.push(["","","","","",""]); markDirty(); render(); });
  qs("#search").addEventListener("input", onFilter);

  // Botón AI (opcional)
  const aiBtn = document.getElementById("bbdd-ai");
  if (aiBtn) {
    aiBtn.addEventListener("click", () => {
      aiRunForSelection().catch(e => toast(e.message, false));
    });
  }
  // const aiBtn = document.getElementById("bbdd-ai");
  // if (aiBtn) {
  //   aiBtn.addEventListener("click", ()=>{
  //     const marcadas = state.rows.filter(r => r[5]==="improve" || r[5]==="replace");
  //     if(!marcadas.length){
  //       alert("Seleccioná al menos una task con feedback🪄 o 🔁");
  //       return;
  //     }
  //     console.log("Tasks seleccionadas para AI:", marcadas);
  //   });
  // }

  // Cerrar con ESC
  document.addEventListener("keydown", (e)=>{
    if (e.key === "Escape") {
      const doClose = () => {
        if (window.BBDD_MODE === "modal") closeOverlay();
        else history.back();
      };
      if (state.dirty) {
        if (confirm("Tenés cambios sin guardar. ¿Cerrar igualmente?")) doClose();
      } else {
        doClose();
      }
    }
  });

  // Atajo: Ctrl/⌘+V para pegar filas (si no estás editando un campo)
  document.addEventListener("keydown", async (e)=>{
    const isPaste = (e.key.toLowerCase() === "v") && (e.ctrlKey || e.metaKey);
    if (!isPaste) return;

    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const isEditingField = ["input","textarea","select"].includes(tag);
    if (isEditingField) return; // dejar pegar dentro del campo

    e.preventDefault();
    try { await pasteFromClipboard(); }
    catch { toast("No pude leer el portapapeles. Probá habilitar permisos.", false); }
  });

  // ── Carga de datos ─────────────────────────────────────────────
  setTableLoading(true);
  try{
    const { rows } = await apiGetBBDD(email);

    // Filtro estricto: conservar solo filas con Tasks (col 3) no vacía
    const fetched = (rows || []).filter(r => (r?.[3] ?? "").toString().trim() !== "");

    // Extender con slot de feedback
    state.rows = fetched.map(r => [ r[0]||"", r[1]||"", r[2]||"", r[3]||"", r[4]||"", "" ]);

    // Hash calculado sobre lo realmente renderizado
    state.origHash = hashRows(fetched);

    render();
    setupMobileEnhancements();
  } catch(err){
    toast("Error cargando BBDD: " + err.message, false);
  } finally {
    setTableLoading(false);
  }
}

// Bootstrap
if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);

registerShadowServiceWorker();

/* ====== Exponer helper para abrir modal desde el dashboard ====== */
window.openBBDD = function(emailParam){
  if (emailParam) localStorage.setItem("gj_email", emailParam);
  window.BBDD_MODE = "modal";
  init();
};
