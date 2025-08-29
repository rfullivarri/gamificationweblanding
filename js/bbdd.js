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
function toast(msg, ok=true){
  const el = qs("#status-msg");
  el.textContent = msg;
  el.style.color = ok ? "#9ff7cc" : "#ff8a9b";
  setTimeout(()=>{ el.textContent=""; }, 4000);
}

/* ====== Estado ====== */
let state = {
  rows: [],          // [[Pilar,Rasgo,Stats,Tasks,Dificultad,Feedback]]
  origHash: null,
  dirty: false,
  filter: "",
};




/* ====== API (adaptable a tu WebApp actual) ====== */
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

/* ====== Render ====== */
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
        <button class="mini" data-act="del">Eliminar</button>
      </td>
    `;
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
    markDirty(); render();
  }
}

/* Drag & drop */
let dragIndex = null;
function onDragStart(e){ dragIndex = Number(e.currentTarget.dataset.index); e.dataTransfer.effectAllowed="move"; }
function onDragOver(e){ e.preventDefault(); e.dataTransfer.dropEffect="move"; }
function onDrop(e){
  e.preventDefault();
  const to = Number(e.currentTarget.dataset.index);
  if(dragIndex===null || to===dragIndex) return;
  const [item] = state.rows.splice(dragIndex,1);
  state.rows.splice(to,0,item);
  dragIndex = null;
  markDirty(); render();
}

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
      toast("✅ Cambios confirmados. ¡Estamos configurando tu Daily Quest!");
    } catch (err) {
      toast("Error en confirmación: " + err.message, false);
      return;
    }

    // 4) Cerrar / volver
    setTimeout(()=>{
      if(window.BBDD_MODE==="modal"){
        closeOverlay();
        if(confirm("¿Volver al Dashboard?")){
          location.href = `${DASHBOARD_URL}?email=${encodeURIComponent(email)}`;
        }
      } else {
        location.href = `${DASHBOARD_URL}?email=${encodeURIComponent(email)}`;
      }
    }, 400);

  } finally {
    // END loading UI (se ejecuta SIEMPRE, incluso si hubo return/throw)
    btn.disabled = false;
    btn.classList.remove("loading");
    btn.removeAttribute("aria-busy");
  }
}

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


/* ====== Init ====== */
async function init(){
  if(!email){
    alert("No se detectó tu email. Abrí esta página desde el Dashboard (menú → Editar Base).");
    return;
  }

  // Modo: modal o página
  if(window.BBDD_MODE==="modal"){ openOverlay(); }
  else { qs("#bbdd-overlay").classList.remove("hidden"); }

  // listeners UI
  qs("#bbdd-back").addEventListener("click", ()=> {
    if(window.BBDD_MODE==="modal") closeOverlay();
    else history.back();
  });
  qs("#close-modal").addEventListener("click", closeOverlay);
  qs("#bbdd-confirm").addEventListener("click", ()=>doConfirm().catch(e=>toast(e.message,false)));
  qs("#add-row").addEventListener("click", ()=>{ state.rows.push(["","","","","",""]); markDirty(); render(); });
  qs("#search").addEventListener("input", onFilter);

  // Botón AI global (opcional)
  const aiBtn = document.getElementById("bbdd-ai");
  if (aiBtn) {
    aiBtn.addEventListener("click", ()=>{
      const marcadas = state.rows.filter(r => r[5]==="improve" || r[5]==="replace");
      if(!marcadas.length){
        alert("Seleccioná al menos una task con feedback🪄 o 🔁");
        return;
      }
      console.log("Tasks seleccionadas para AI:", marcadas);
    });
  }

  // Cerrar con ESC (confirma si hay cambios)
  document.addEventListener("keydown", (e)=>{
    if(e.key==="Escape"){
      const doClose = () => {
        if(window.BBDD_MODE==="modal") closeOverlay();
        else history.back();
      };
      if(state.dirty){
        if(confirm("Tenés cambios sin guardar. ¿Cerrar igualmente?")) doClose();
      } else {
        doClose();
      }
    }
  });

  // Atajo: Ctrl/⌘ + V para pegar filas (si no estás escribiendo en un input/textarea/select)
  document.addEventListener("keydown", async (e)=>{
    const isPaste = (e.key.toLowerCase() === "v") && (e.ctrlKey || e.metaKey);
    if (!isPaste) return;

    const tag = (document.activeElement?.tagName || "").toLowerCase();
    const isEditingField = ["input","textarea","select"].includes(tag);
    if (isEditingField) return; // dejá que el navegador pegue dentro del campo

    e.preventDefault();
    try {
      await pasteFromClipboard();
    } catch (err) {
      toast("No pude leer el portapapeles. Probá habilitar permisos.", false);
    }
  });
  

  // load data
  try{
    const { rows } = await apiGetBBDD(email);
    // extendemos con slot para feedback
    state.rows = rows.map(r => [ r[0]||"", r[1]||"", r[2]||"", r[3]||"", r[4]||"", "" ]);
    state.origHash = hashRows(rows);
    render();
  }catch(err){
    toast("Error cargando BBDD: " + err.message, false);
  }
}

if(document.readyState!=="loading") init();
else document.addEventListener("DOMContentLoaded", init);

/* ====== Exponer helper para abrir modal desde el dashboard ====== */
window.openBBDD = function(emailParam){
  if(emailParam) localStorage.setItem("gj_email", emailParam);
  window.BBDD_MODE = "modal";
  init();
};
