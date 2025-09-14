// === Worker + fallback a WebApp ===
const WORKER_BASE    = 'https://gamificationworker.rfullivarri22.workers.dev';
const OLD_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxncfav0V6OJsHDFMcFg7S8qISWXrG5P5l5WTCzBn-iC_4cerC22lsznJHlDsQhneGdpA/exec';

// Devuelve `data` desde el Worker; si no puede, usa la WebApp
async function loadDataFromCacheOrWebApp(email) {
  try {
    const r = await fetch(`${WORKER_BASE}/bundle?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    if (r.status === 200) return await r.json();
    if (r.status === 204) throw new Error('No bundle yet');
    throw new Error(`Worker ${r.status}`);
  } catch (err) {
    const resp = await fetch(`${OLD_WEBAPP_URL}?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
    return await resp.json();
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  // Spinner
  const overlay = document.getElementById("spinner-overlay");
  const showSpinner = () => overlay && (overlay.style.display = "flex");
  const hideSpinner = () => overlay && (overlay.style.display = "none");
  showSpinner();

  try {
    // 1) email
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (!email) { alert("No se proporcionó un correo electrónico."); return; }

    // 1.1) Contexto para el SCHEDULER
    window.GJ_CTX = { email };

    // 2) FETCH DATOS (usa Worker -> fallback WebApp)
    const dataRaw = await loadDataFromCacheOrWebApp(email);

    // 2.1) Logs crudos para rachas (CLAVE)
    const logsRaw = Array.isArray(dataRaw?.daily_log_raw) ? dataRaw.daily_log_raw
                  : (Array.isArray(dataRaw?.daily_log)    ? dataRaw.daily_log : []);

    // DEBUG: ver que lleguen
    console.log('[Dashboard] bundle:', dataRaw);
    console.log('[Dashboard] daily_log_raw len =', logsRaw.length);

    // ---- Normalizar data al formato plano que usa el front ----
    const data = {
      // Métricas (flatten)
      xp:            dataRaw.xp ?? dataRaw.metrics?.xp_actual ?? 0,
      nivel:         dataRaw.nivel ?? dataRaw.metrics?.nivel ?? 0,
      xp_faltante:   dataRaw.xp_faltante ?? dataRaw.metrics?.xp_faltante ?? 0,
      exp_objetivo:  dataRaw.exp_objetivo ?? dataRaw.metrics?.xp_objetivo ?? 100,
      hp:            dataRaw.hp ?? dataRaw.metrics?.hp ?? 0,
      mood:          dataRaw.mood ?? dataRaw.metrics?.mood ?? 0,
      focus:         dataRaw.focus ?? dataRaw.metrics?.focus ?? 0,
      dias_journey:  dataRaw.dias_journey ?? dataRaw.metrics?.dias_journey ?? 0,
      game_mode:     dataRaw.game_mode ?? dataRaw.metrics?.game_mode ?? "",

      // Links
      avatar_url:          dataRaw.avatar_url ?? dataRaw.links?.avatar_url ?? "",
      daily_form_url:      dataRaw.daily_form_url ?? dataRaw.links?.daily_form ?? "",
      daily_form_edit_url: dataRaw.daily_form_edit_url ?? dataRaw.links?.daily_form_edit ?? "",
      user_profile:        dataRaw.user_profile ?? dataRaw.links?.user_profile ?? "",
      bbdd_editor_url:     dataRaw.bbdd_editor_url ?? dataRaw.links?.bbdd_editor ?? "",

      // Otros
      estado:            dataRaw.estado ?? "",
      confirmacionbbdd:  dataRaw.confirmacionbbdd ?? "",
      nombre:            dataRaw.nombre ?? "",
      apellido:          dataRaw.apellido ?? "",
      sexo:              dataRaw.sexo ?? "",
      edad:              dataRaw.edad ?? "",

      // Series que ya usás
      daily_cultivation: dataRaw.daily_cultivation ?? [],
      daily_emotion:     dataRaw.daily_emotion ?? [],

      // BBDD de tareas
      bbdd:              Array.isArray(dataRaw.bbdd) ? dataRaw.bbdd : [],

      // Habitos Logrados (para Radar)
      habitos_logrados:  dataRaw.habitos_logrados ?? [],
      habitos_by_rasgo:  dataRaw.habitos_agg_by_rasgo ?? null,

      // ⬅️ NUEVO: EXponer logs crudos para el panel de rachas
      daily_log_raw:     logsRaw,
      daily_log:         logsRaw, // alias por compat
    };

    // 3) Espejos globales
    // - GJ_DATA: objeto “plano” que usa la UI
    // - GJ_W1:   bundle estilo worker/webapp (por si algo quiere el shape original)
    window.GJ_DATA = data;
    window.GJ_W1   = { ...dataRaw, daily_log_raw: logsRaw, daily_log: logsRaw };

    // 4) Notificar que hay datos listos
    document.dispatchEvent(new CustomEvent('gj:data-ready', { detail: { data } }));


    // ========== SCHEDULER — Exponer contexto para el modal ==========
    function pick(...vals){
      for (const v of vals) if (v !== undefined && v !== null && String(v).trim() !== '') return v;
      return '';
    }
    function _sheetIdFromUrl_(url){
      if (!url) return '';
      const m = String(url).match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      return m ? m[1] : '';
    }
    function _normalizeHour_(h){
      if (h == null) return null;
      const m = String(h).match(/^\s*(\d{1,2})/);
      if (!m) return null;
      return Math.max(0, Math.min(23, parseInt(m[1],10)));
    }
    // Deep-scan por si la URL del Sheet viene en otro lado
    function _findSheetIdDeep_(obj){
      const re = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
      let found = '';
      (function walk(x){
        if (!x || found) return;
        if (typeof x === 'string') {
          const m = x.match(re);
          if (m) found = m[1];
        } else if (typeof x === 'object') {
          for (const k in x) walk(x[k]);
        }
      })(obj);
      return found;
    }
    
    // posibles llaves que puede traer tu Worker/WebApp
    const sheetUrl = pick(
      dataRaw.sheetUrl,                // camelCase
      dataRaw.sheet_url,               // snake_case
      dataRaw.sheet,                   // genérico
      dataRaw.links?.sheet,
      dataRaw.links?.sheetUrl,         // camelCase en links
      dataRaw.links?.sheet_url,        // snake_case en links
      dataRaw.dashboard_sheet_url,
      dataRaw.links?.dashboard_sheet_url,
      dataRaw.user_sheet_url,
      dataRaw.links?.user_sheet_url
    );
    
    // ID final del Sheet del usuario (incluye deep-scan como último recurso)
    const userSheetId = pick(
      dataRaw.user_sheet_id,
      dataRaw.userSheetId,
      dataRaw.sheetId,
      dataRaw.sheet_id,
      _sheetIdFromUrl_(sheetUrl),
      _findSheetIdDeep_(dataRaw)       // ← si vino escondida en otro subobjeto
    );
    
    // Config scheduler (si no vino, defaults)
    const s = dataRaw.schedule || dataRaw.scheduler || {};
    const horaNorm = _normalizeHour_(s.hora);
    
    // Contexto global para el Scheduler (y resto del dashboard)
    window.GJ_CTX = {
      email, // ya definido arriba
      userSheetId,
      linkPublico: pick(data.daily_form_url, dataRaw.daily_form_url, dataRaw.links?.daily_form, ''),
      scheduler: {
        canal:      s.canal      ?? 'email',
        frecuencia: s.frecuencia ?? 'DAILY',
        dias:       s.dias       ?? '',
        hora:       (horaNorm != null ? horaNorm : 8), // SOLO HH (0–23)
        timezone:   s.timezone   ?? 'Europe/Madrid',
        estado:     s.estado     ?? 'ACTIVO'
      }
    };


    
    // —— AVISO de programación (hasta que se programe al menos una vez)
    try {
      const emailLC  = String(email || '').toLowerCase();
      const sched    = (window.GJ_CTX && window.GJ_CTX.scheduler) || {};
      const schedOk  = String(sched.estado || '').toUpperCase() === 'ACTIVO' && (sched.hora != null);
    
      // setDot seguro
      const setDotSafe = window.setDotSafe || window.setDot || function(){};
    
      // “ya programó al menos una vez” (no mostrar más)
      const configuredKey = `gj_sched_configured:${emailLC}`;
      const yaProgramado  = localStorage.getItem(configuredKey) === '1';
    
      // Forzado one–shot (lo deja BBDD al confirmar "primera") + señal de navegación
      const forceKey   = `gj_force_scheduler_banner:${emailLC}`;
      const forcedLS   = (localStorage.getItem(forceKey) === '1') || (window.GJ_FORCE_SCHED_HINT === true);
      const forcedSS   = (sessionStorage.getItem('gj_onboarding') || '').toLowerCase() === 'primera';
      const forced     = forcedLS || forcedSS;
    
      function showSchedulerBanner() {
        // ocultar avisos de BBDD si estuvieran
        ['journey-warning','bbdd-warning'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
        // mostrar aviso de Programar
        const warn = document.getElementById('scheduler-warning');
        if (warn) warn.style.display = 'block';
        // dots ON
        setDotSafe(document.getElementById('menu-toggle'), true, '#ffc107');
        setDotSafe(document.getElementById('open-scheduler'), true, '#ffc107');
      }
    
      function consumeForce() {
        try { localStorage.removeItem(forceKey); } catch {}
        try { sessionStorage.removeItem('gj_onboarding'); } catch {}
        try { delete window.GJ_FORCE_SCHED_HINT; } catch {}
      }
    
      // (A) Listener “en caliente” desde BBDD (postMessage entre páginas/iframe)
      (function attachOnboardingListener(){
        function handleMsg(ev){
          const d = ev && ev.data || {};
          if (d.kind === 'GJ_ONBOARD' && d.step === 'BBDD_CONFIRMED' &&
              String(d.estado||'').toLowerCase() === 'primera') {
            if (!yaProgramado) showSchedulerBanner();
            consumeForce();
          }
        }
        window.addEventListener('message', handleMsg);
      })();
    
      // (B) Señal persistida si hubo navegación desde BBDD (mismo tab)
      if (!yaProgramado && forcedSS) {
        showSchedulerBanner();
        consumeForce();
      }
    
      // (C) Lógica normal: si no hay scheduler OK o viene forzado → mostrar
      if (!yaProgramado && (forced || !schedOk)) {
        showSchedulerBanner();
        // si vino forzado por LS/SS, consúmelo para no repetir
        if (forced) consumeForce();
      }
    
      // (D) Mensaje alternativo por BroadcastChannel (si lo usás)
      try {
        const bc = new BroadcastChannel('gj_onboarding');
        bc.onmessage = (ev) => {
          const msg = ev && ev.data || {};
          if (msg.type === 'bbdd-confirmed' &&
              String(msg.estado || '').toLowerCase() === 'primera') {
            if (!yaProgramado) showSchedulerBanner();
            consumeForce();
          }
        };
      } catch {}
    
      // (E) Si YA está programado, asegurá dots off y ocultar banner
      if (schedOk || yaProgramado) {
        setDotSafe(document.getElementById('menu-toggle'), false);
        setDotSafe(document.getElementById('open-scheduler'), false);
        const warn = document.getElementById('scheduler-warning');
        if (warn) warn.style.display = 'none';
      }
    } catch {}

    
    
    // Cache (y por si el controller cae al LS)
    try {
      localStorage.setItem('gj_ctx', JSON.stringify(window.GJ_CTX));
      localStorage.setItem('gj_email', email);
      if (userSheetId) localStorage.setItem('gj_sheetId', userSheetId);
    } catch {}
    
    // Avisar al controller que el contexto está listo
    window.dispatchEvent(new CustomEvent('gj:ctx-ready', { detail: window.GJ_CTX }));
    
    // (Opcional) abrir con prefill desde tu botón del menú
    const btn = document.getElementById('open-scheduler');
    if (btn) {
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        const p = window.GJ_CTX.scheduler;
        window.openSchedulerModal?.({
          canal: p.canal, frecuencia: p.frecuencia, dias: p.dias,
          hora: p.hora ?? 8, timezone: p.timezone, estado: p.estado,
          linkPublico: window.GJ_CTX.linkPublico
        });
      });
    }
    

    // 3) ENLACES
    //    a) Base que viene del WebApp (aceptamos dos nombres de campo)
    // const editorBase = data.bbdd_editor_url || data["bbdd editor url"] || "";
    // const editorURL  = editorBase ? new URL(editorBase) : null;
    // if (editorURL) editorURL.searchParams.set("email", email); // << agregamos ?email=

    // //    b) Setear el botón clásico por id (como ya tenías)
    // const editBbdd = document.getElementById("edit-bbdd");
    // if (editBbdd) editBbdd.href = editorURL ? editorURL.toString() : "#";

    // //    c) Y además TODOS los links marcados con data-link="editar-base"
    // document.querySelectorAll('[data-link="editar-base"]').forEach(a => {
    //   const finalURL = editorURL ? editorURL.toString() : "#";
    //   a.setAttribute("href", finalURL);
    //   // Forzamos navegación en la misma pestaña (a prueba de handlers/caches)
    //   a.addEventListener("click", (ev) => {
    //     ev.preventDefault();
    //     window.location.href = finalURL;
    //   });
    // });

    //    d) Resto de enlaces como ya tenías
    const dailyQuest = document.getElementById("daily-quest");
    const editFormEl = document.getElementById("edit-form");
    if (dailyQuest) dailyQuest.href = data.daily_form_url      || "#";
    if (editFormEl) editFormEl.href = data.daily_form_edit_url || "#";
    

    // 4) WARNING + PUNTITOS NOTIFICACION
    // 4.1) ====PUNTITOS EN MENUS===================
    function setDot(el, on, color = '#ffc107') {
      if (!el) return;
      let dot = el.querySelector(':scope > .dot');
      if (on) {
        if (!dot) {
          dot = document.createElement('span');
          dot.className = 'dot';
          el.appendChild(dot);
        }
        dot.style.background = color;
    
        // Solo posicionamos la hamburguesa por JS.
        // El <li> usa el CSS (#li-edit-bbdd > .dot { top:10px; right:10px })
        if (el.id === 'menu-toggle') {
          dot.style.top = '-2px';
          dot.style.right = '-2px';
        } else {
          // IMPORTANTE: no fuerces top/right aquí para dejar actuar al CSS
          dot.style.top = '';
          dot.style.right = '';
        }
      } else if (dot) {
        dot.remove();
      }
    }

    // 4.2) Se crep BBDD (Posiblemente Obsoleto)
    if (data.estado !== "PROCESADO ✅") {
      const warningContainer = document.getElementById("journey-warning");
      if (warningContainer) warningContainer.style.display = "block";
    }

    // 4.3) CONFIRMAR BBDD PUNTITO
    const needsBBDD = String(data.confirmacionbbdd || '').toUpperCase() !== 'SI';

    // ocultamos warning viejo
    document.getElementById('bbdd-warning')?.style.setProperty('display','none');
    
    // llamamos a setDot
    setDot(document.getElementById('menu-toggle'), needsBBDD, '#ffc107');
    setDot(document.getElementById('li-edit-bbdd'), needsBBDD, '#ffc107');

    
    // 4.3bis) CONFIRMAR BBDD (OLD)
    if (data.confirmacionbbdd !== "SI") {
      const bbddWarning = document.getElementById("bbdd-warning");
      if (bbddWarning) bbddWarning.style.display = "block";
    }

    // 4.4) Primer render listo: ocultamos el spinner global
    // Dejo un frame para que el DOM pinte antes de ocultar
    await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
    hideSpinner();

    // 🔥 BLOQUE DE TAREAS Y CONSTANCIA DOPAMINE STYLE (v2 con lógica actual/max)
    const PCARD = (() => {
      const MODE_TIER = { LOW: 1, CHILL: 2, FLOW: 3, EVOL: 4 };
      // const PILLAR_MAP = { 'Cuerpo':'Body','Mente':'Mind','Alma':'Soul','Body':'Body','Mind':'Mind','Soul':'Soul' };
      const PILLAR_MAP = Object.freeze({'Cuerpo':'Body','Mente':'Mind','Alma':'Soul','Body':'Body','Mind':'Mind','Soul':'Soul','BODY':'Body','MIND':'Mind','SOUL':'Soul','CUERPO':'Body','MENTE':'Mind','ALMA':'Soul'});
    
      const esc = (s='') => s.toString().replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
      const el  = (tag, cls, html) => { const n=document.createElement(tag); if(cls)n.className=cls; if(html!=null)n.innerHTML=html; return n; };
    
      function normalizeRow(r){
        return {
          pillar: PILLAR_MAP[(r.pilar||'').trim()] || 'Body',
          rasgo:  r.rasgo || '',
          stat:   r.stat  || '',
          task:   r.task  || '',
          xp:     Number(r.exp || 0),
          streak: Number(r.constancia || 0),
          weeklyMax:{1:+(r.c1s_m||0),2:+(r.c2s_m||0),3:+(r.c3s_m||0),4:+(r.c4s_m||0)},
          weeklyNow:{1:+(r.c1s_ac||0),2:+(r.c2s_ac||0),3:+(r.c3s_ac||0),4:+(r.c4s_ac||0)}
        };
      }
    
      // Barra de progreso semanal (comparación actual vs máximo)
      function progressBar(now, max, tier){
        let _now = Math.max(0, Number(now) || 0);
        let _max = Math.max(Number(max) || 0, 1);
    
        // Si no hay máximo registrado, usar default del modo
        if (_max <= 1 && _now > 0) _max = Math.max(_now, tier);
    
        // Evitar que la barra se rompa si actual supera máximo → actualizar
        if (_now > _max) _max = _now;
    
        const pct = Math.round((_now/_max)*100);
    
        const wrap = el('div','pc-progress');
        const fill = el('div','pc-progress-fill');
        fill.style.width = pct + '%';
    
        const labelText = `${_now}/${_max}`;
        const label = el('div','pc-progress-label', esc(labelText));
    
        if (_now >= _max && _max > 0) {
          const trophy = el('span','pc-progress-trophy','🏆');
          label.appendChild(trophy);
          wrap.classList.add('pc-progress-record');
        }
    
        wrap.appendChild(fill);
        wrap.appendChild(label);
        return wrap;
      }
    
      function buildSection(name, items, mode){
        const tier = MODE_TIER[mode] || MODE_TIER.FLOW;
        const sec = el('section','pc-section'+(name==='Body'?' pc-active':'')); 
        sec.dataset.section = name.toLowerCase();
    
        sec.appendChild(el('div','pc-h4','🔥 Tareas con racha de constancia'));
    
        // Top-3 con fuego
        const top3Box = el('div','pc-top3');
        const withStreak = items.filter(t => t.streak > 1).sort((a,b)=>b.streak-a.streak);
        const top3 = withStreak.slice(0,3);
    
        top3.forEach(t=>{
          const c = el('div','pc-tcard');
          c.appendChild(el('div','pc-thead','<span class="pc-fire">🔥</span><span class="pc-streak">x'+t.streak+'</span>'));
    
          // // Chips XP + Stat en línea
          // const chips = el('div','pc-chips-inline');
          // chips.appendChild(el('span','pc-chip pc-xp-small','<span class="pc-spark"></span>+' + t.xp + ' XP'));
          // if(t.stat) chips.appendChild(el('span','pc-chip','Stat: ' + esc(t.stat)));
          // c.appendChild(chips);

          // Chips XP + Stat en línea
          const chips = el('div','pc-chips-inline');
          chips.appendChild(el('span','pc-chip pc-xp-small','<span class="pc-spark"></span>+' + t.xp + ' XP'));
          if (t.stat) {chips.appendChild(el('span','pc-chip pc-stat','Stat: ' + esc(t.stat)) // 👈 clase extra
            );}
          c.appendChild(chips);
    
          // Nombre tarea
          c.appendChild(el('div','pc-tname',esc(t.task)));
    
          // Barra abajo del fuego
          const now = t.weeklyNow[tier] || 0;
          const mx  = t.weeklyMax[tier] || 0;
          c.appendChild(progressBar(now, mx, tier));
    
          top3Box.appendChild(c);
        });
        if (top3.length) sec.appendChild(top3Box);
    
        // Otras tareas en racha
        const leftovers = withStreak.slice(3);
        if (leftovers.length){
          const more = el('div','pc-morestreak');
          more.appendChild(el('span','pc-morestreak-label','Otras en racha:'));
          leftovers.slice(0,6).forEach(t=>{
            more.appendChild(el('span','pc-morestreak-chip', `${esc(t.task)} 🔥x${t.streak}`));
          });
          sec.appendChild(more);
        }
    
        // Filtro
        const input = el('input','pc-filter');
        input.placeholder = "Filtrar tareas… (ej. 'ayuno')";
        input.dataset.filter = name.toLowerCase();
        sec.appendChild(input);
    
        // Lista compacta
        const list = el('div','pc-list');
        list.dataset.list = name.toLowerCase();
        list.appendChild(el(
          'div',
          'pc-row pc-label',
          `<div>Tarea</div><div class="pc-xp">XP</div><div class="pc-right">Semanal (${tier}×/sem)</div>`
        ));
    
        const rest = items
          .filter(x=>!top3.includes(x))
          .sort((a,b)=>a.task.localeCompare(b.task,'es'));
    
        rest.forEach(t=>{
          const row = el('div','pc-row');
          const now = t.weeklyNow[tier] || 0;
          const mx  = t.weeklyMax[tier] || 0;
    
          const col1 = el('div',null,esc(t.task));
          const col2 = el('div','pc-xp','+'+t.xp);
          const col3 = el('div','pc-right');
          col3.appendChild(progressBar(now, mx, tier));
    
          row.appendChild(col1);
          row.appendChild(col2);
          row.appendChild(col3);
          list.appendChild(row);
        });
    
        sec.appendChild(list);
    
        input.addEventListener('input', ()=>{
          const q = input.value.toLowerCase();
          list.querySelectorAll('.pc-row:not(.pc-label)').forEach(r=>{
            const name = r.firstElementChild.textContent.toLowerCase();
            r.style.display = name.includes(q) ? '' : 'none';
          });
        });
    
        return sec;
      }
    
      function render(rootEl, bbddRaw, modeInput){
        const root = (typeof rootEl==='string') ? document.querySelector(rootEl) : rootEl;
        if(!root) return;
        root.classList.add('pc');
        root.innerHTML = '';
    
        const mode = (modeInput || 'FLOW').toUpperCase();
        const rows = (Array.isArray(bbddRaw) ? bbddRaw : []).map(normalizeRow);
        const groups = { Body:[], Mind:[], Soul:[] };
        rows.forEach(x => groups[x.pillar]?.push(x));
    
        const top = el('div','pc-topbar');
        const tabs = el('div','pc-tabs');
        ['Body','Mind','Soul'].forEach((p,i)=>{
          const b = el('button','pc-tab'+(i===0?' pc-active':''),(p==='Body'?'🫀 ':p==='Mind'?'🧠 ':'🏵️ ')+p);
          b.dataset.tab = p.toLowerCase();
          b.addEventListener('click', ()=>{
            root.querySelectorAll('.pc-tab').forEach(x=>x.classList.remove('pc-active'));
            b.classList.add('pc-active');
            root.querySelectorAll('.pc-section').forEach(s=>s.classList.toggle('pc-active', s.dataset.section===b.dataset.tab));
          });
          tabs.appendChild(b);
        });

        // --- (venís de crear `const top = el('div','pc-topbar')` y `const tabs = el('div','pc-tabs')`) ---
        // 1) ancla vacío donde va el chip (misma clase que usan las demás cards)
        const infoAnchor = el('div', 'card-title-with-info');
        infoAnchor.id = 'pc-constancy-info';
        
        // 2) arma la topbar: tabs + ancla para el chip
        top.appendChild(tabs);
        top.appendChild(infoAnchor);
        root.appendChild(top);
        
        // 3) contenido del pop (podés editar el texto tranquilo)
        const infoHTML = `
          <strong>¿Cómo leer?</strong><br/>
          • 🔥 + <b>xN</b> = días de racha real.<br/>
          • <b>XP</b> = experiencia total.<br/>
          • <b>Barra semanal</b>: actual / máximo histórico para el modo (<u>${mode}</u>).<br/>
          • Si no hay máximo, usa valor por defecto del modo.<br/>
          • Tiers por modo: LOW=1× · CHILL=2× · FLOW=3× · EVOL=4× / semana.
        `;
        
        // 4) usa tu util v3 (position: fixed + viewport-safe)
        attachInfoChip('#pc-constancy-info', infoHTML, 'right');

        root.appendChild(buildSection('Body', groups.Body||[], mode));
        root.appendChild(buildSection('Mind', groups.Mind||[], mode));
        root.appendChild(buildSection('Soul', groups.Soul||[], mode));
      }
    
      return { render };
    })();


    // === Pillar Card render (columna 3) ===
    try {
      const root = document.getElementById('pillar-card-root') || document.getElementById('pillarCard'); // fallback por si quedó el id viejo
      const gameMode = (data.game_mode || window.gameMode || 'FLOW').toUpperCase();
    
      console.log('[PCARD] root:', !!root,
                  '| bbdd array?', Array.isArray(data.bbdd),
                  '| len:', data.bbdd?.length,
                  '| mode:', gameMode);
    
      if (root && Array.isArray(data.bbdd) && data.bbdd.length) {
        PCARD.render(root, data.bbdd, gameMode);
      } else {
        console.warn('PillarCard: faltan root o data.bbdd');
      }
    } catch (e) {
      console.error('PillarCard error:', e);
    }

    
    // ================= AVATAR =================
    const avatarURL = (data.avatar_url || "").trim();
    const avatarImg  = document.getElementById("avatar");
    if (avatarImg) {
      if ((avatarImg.tagName || "").toLowerCase() === "img") {
        if (avatarURL) {
          if (avatarImg.src !== avatarURL) avatarImg.src = avatarURL;
          avatarImg.alt = (data.nombre ? `${data.nombre} — avatar` : "Avatar");
          avatarImg.loading = "eager";
          avatarImg.decoding = "async";
        } else {
          avatarImg.removeAttribute("src");
        }
      } else {
        // #avatar no es <img>: uso background
        avatarImg.style.backgroundImage  = avatarURL ? `url("${avatarURL}")` : "";
        avatarImg.style.backgroundSize   = "cover";
        avatarImg.style.backgroundRepeat = "no-repeat";
        avatarImg.style.backgroundPosition = "center";
      }
    }
    
    // Helpers locales (no cambian API pública)
    const clamp01 = v => Math.max(0, Math.min(1, v));
    const num = (x, def = 0) => {
      const n = Number(x);
      return Number.isFinite(n) ? n : def;
    };
    const putText = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = String(value);
    };
    
    // ============= ESTADO DIARIO: barras =============
    const setProgress = (id, value) => {
      const bar = document.getElementById(id);
      if (!bar) return;
    
      // Tus valores vienen 0–1 → convierto a %
      const percent = Math.round(clamp01(num(value)) * 100);
    
      // Si hay un hijo .fill usarlo; si no, la propia barra
      const target = bar.querySelector(".fill") || bar;
      target.style.width = percent + "%";
      if ("textContent" in target) target.textContent = percent + "%";
    };
    
    setProgress("bar-hp",    data.hp);
    setProgress("bar-mood",  data.mood);
    setProgress("bar-focus", data.focus);
    
    // ============= XP Y NIVEL =============
    const xpActual     = num(data.xp);
    const nivelActual  = num(data.nivel);
    const xpFaltante   = num(data.xp_faltante);
    const expObjetivo  = num(data.exp_objetivo, 0);
    
    // Textos
    putText("xp-actual",    xpActual);
    putText("nivel-actual", nivelActual);
    putText("xp-faltante",  xpFaltante);
    
    // Progreso de nivel (evita NaN y divide-by-0)
    let progresoNivel = 0;
    if (expObjetivo > 0) {
      progresoNivel = Math.round(clamp01(xpActual / expObjetivo) * 100);
    }
    
    const barNivel = document.getElementById("bar-nivel");
    if (barNivel) {
      const target = barNivel.querySelector(".fill") || barNivel;
      target.style.width = progresoNivel + "%";
      if ("textContent" in target) target.textContent = progresoNivel + "%";
    }
  
    // 🧿 RADAR DE RASGOS
    function calcularXPporRasgoDesdeBBDD(bbdd, habitos_logrados, habitos_by_rasgo) {
      const xpPorRasgo = {};
    
      // 1) Suma desde BBDD (lo que ya tenías)
      (bbdd || []).forEach(row => {
        const rasgo = row && row.rasgo;
        const exp   = Number(row && row.exp) || 0;
        if (!rasgo) return;
        xpPorRasgo[rasgo] = (xpPorRasgo[rasgo] || 0) + exp;
      });
    
      // 2) Suma desde Hábitos Logrados
      //    a) si vino el agregado del backend, úsalo directo (más barato)
      if (habitos_by_rasgo && typeof habitos_by_rasgo === 'object') {
        for (const r in habitos_by_rasgo) {
          const exp = Number(habitos_by_rasgo[r]) || 0;
          if (!r) continue;
          xpPorRasgo[r] = (xpPorRasgo[r] || 0) + exp;
        }
      } else {
        //    b) si no vino el agregado, sumar desde la lista A:G
        (habitos_logrados || []).forEach(h => {
          const rasgo = h && h.rasgo;
          const exp   = Number(h && h.exp) || 0;
          if (!rasgo) return;
          xpPorRasgo[rasgo] = (xpPorRasgo[rasgo] || 0) + exp;
        });
      }
    
      // 3) Salida ordenada (desc por XP) para que el radar sea estable
      const entries = Object.entries(xpPorRasgo).sort((a,b)=> b[1]-a[1]);
      const labels  = entries.map(([r]) => r);
      const values  = entries.map(([,v]) => v);
      return { labels, values };
    }
  
    // const radarCanvas = document.getElementById("radarChart");
    // const radarData = data.bbdd ? calcularXPporRasgoDesdeBBDD(data.bbdd) : { labels: [], values: [] };

    const radarCanvas = document.getElementById("radarChart");
    const radarData = calcularXPporRasgoDesdeBBDD(
      data.bbdd,
      data.habitos_logrados,
      data.habitos_by_rasgo
    );
  
    new Chart(radarCanvas, {
      type: "radar",
      data: {
        labels: radarData.labels,
        datasets: [{
          data: radarData.values,
          fill: true,
          borderColor: "rgba(102, 0, 204, 1)",
          backgroundColor: "rgba(102, 0, 204, 0.2)",
          pointBackgroundColor: "rgba(102, 0, 204, 1)"
        }]
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
          datalabels: {
            color: '#fff',
            font: { size: 12, weight: 'bold' },
            formatter: (value) => value
          }
        },
        scales: {
          r: {
            suggestedMin: 0,
            // suggestedMax: Math.max(...radarData.values, 10),
            suggestedMax: Math.max(10, ...(radarData.values || [])),
            pointLabels: {
              color: "#ffffff",
              font: { family: "'Rubik', sans-serif", size: 13 }
            },
            grid: { color: "#444" },
            angleLines: { color: "#555" },
            ticks: { display: false }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  
    // 🪴 DAILY CULTIVATION
    function formatMonthName(monthStr) {
      const [year, month] = monthStr.split("-");
      const meses = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sept","Oct","Nov","Dic"];
      return `${meses[parseInt(month, 10) - 1]} ${year}`;
    }
  
    function renderMonthSelector(dataArr) {
      const monthSelector = document.getElementById("month-select");
      if (!monthSelector) return;
  
      const uniqueMonths = [...new Set(dataArr.map(item => {
        const d = new Date(item.fecha);
        if (isNaN(d)) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }))].filter(Boolean);
  
      monthSelector.innerHTML = "";
      uniqueMonths.forEach(month => {
        const option = document.createElement("option");
        option.value = month;
        option.textContent = formatMonthName(month);
        monthSelector.appendChild(option);
      });
  
      const currentMonth = new Date().toISOString().slice(0, 7);
      monthSelector.value = uniqueMonths.includes(currentMonth) ? currentMonth : uniqueMonths[0];
  
      const selectedInit = monthSelector.value;
      renderXPChart(dataArr.filter(item => item.fecha.startsWith(selectedInit)));
  
      monthSelector.addEventListener("change", () => {
        const selected = monthSelector.value;
        const filtered = dataArr.filter(item => item.fecha.startsWith(selected));
        renderXPChart(filtered);
      });
    }
  
    let xpChart;
    function renderXPChart(arr) {
      const ctx = document.getElementById("xpChart").getContext("2d");
      if (xpChart) xpChart.destroy();
  
      const fechas = arr.map(entry => entry.fecha);
      const xp = arr.map(entry => entry.xp);
  
      xpChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: fechas,
          datasets: [{
            // label: "XP", // (quitamos label para no mostrar en leyenda)
            data: xp,
            borderColor: "#B17EFF",
            backgroundColor: "rgba(177,126,255,0.2)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#B17EFF"
          }]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: { enabled: false },
            legend: { display: false }, // 👈 ocultamos la leyenda
            datalabels: {
              color: "#fff",
              font: { size: 11, weight: "bold" },
              align: "top",
              formatter: value => value
            }
          },
          scales: {
            x: {
              ticks: { color: "white", font: { size: 13 } }
            },
            y: {
              ticks: { color: "white", beginAtZero: true }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }
  
    if (data.daily_cultivation && Array.isArray(data.daily_cultivation)) {
      renderMonthSelector(data.daily_cultivation);
    } else {
      console.warn("⚠️ No hay datos válidos para Daily Cultivation");
    }
  
    // // ========================
    // // 💖 EMOTION CHART (Neutral -> Cansancio, sin registro en gris)
    // // ========================
    // function renderEmotionChart(dailyEmotion) {
    //   // Backward compat: normalizamos "Neutral" a "Cansancio"
    //   const normalize = (s) => (s || "").replace(/neutral/i, "Cansancio").trim();
  
    //   // Claves internas (no usamos emojis para distinguir "sin dato")
    //   const emotionKey = {
    //     "Calma": "CALMA",
    //     "Felicidad": "FELI",
    //     "Motivación": "MOTI",
    //     "Tristeza": "TRIS",
    //     "Ansiedad": "ANSI",
    //     "Frustración": "FRUS",
    //     "Cansancio": "CANS"
    //   };
  
    //   const keyToName = {
    //     CALMA: "Calma",
    //     FELI: "Felicidad",
    //     MOTI: "Motivación",
    //     TRIS: "Tristeza",
    //     ANSI: "Ansiedad",
    //     FRUS: "Frustración",
    //     CANS: "Cansancio",
    //     NONE: "Sin registro"
    //   };
  
    //   // Colores (Cansancio turquesa oscuro; días sin registro gris)
    //   const keyToColor = {
    //     CALMA: "#2ECC71",
    //     FELI:  "#F1C40F",
    //     MOTI:  "#9B59B6",
    //     TRIS:  "#3498DB",
    //     ANSI:  "#E74C3C",
    //     FRUS:  "#8D6E63",
    //     CANS:  "#16A085", // 👈 turquesa oscuro
    //     NONE:  "#555555"  // 👈 sin datos
    //   };
  
    //   const parseDate = (str) => {
    //     const [day, month, year] = str.split("/");
    //     return new Date(`${year}-${month}-${day}`);
    //   };
    //   const iso = (d) => d.toISOString().split("T")[0];
  
    //   // Mapa fecha -> clave emoción
    //   const emotionMap = {};
    //   dailyEmotion.forEach(entry => {
    //     const d = parseDate(entry.fecha);
    //     const k = emotionKey[ normalize(entry.emocion) ];
    //     if (!isNaN(d) && k) emotionMap[iso(d)] = k;
    //   });
  
    //   const sortedDates = Object.keys(emotionMap).sort();
    //   if (sortedDates.length === 0) return;
  
    //   const startDate = new Date(sortedDates[0]);
    //   startDate.setDate(startDate.getDate() - startDate.getDay());
  
    //   const NUM_WEEKS = 26;
    //   const DAYS_IN_WEEK = 7;
  
    //   const emotionChart = document.getElementById("emotionChart");
    //   emotionChart.innerHTML = "";
  
    //   const monthLabelsContainer = document.createElement("div");
    //   monthLabelsContainer.className = "month-labels";
  
    //   const gridContainer = document.createElement("div");
    //   gridContainer.className = "emotion-grid";
  
    //   // Etiquetas de mes alineadas por columna (una por semana)
    //   let currentMonth = -1;
    //   for (let col = 0; col < NUM_WEEKS; col++) {
    //     const labelDate = new Date(startDate);
    //     labelDate.setDate(startDate.getDate() + col * 7);
    //     const month = labelDate.getMonth();
  
    //     const label = document.createElement("div");
    //     label.className = "month-label";
    //     label.textContent = (month !== currentMonth)
    //       ? labelDate.toLocaleString("es-ES", { month: "short" })
    //       : "";
    //     currentMonth = month;
    //     label.style.width = `5px`;
    //     monthLabelsContainer.appendChild(label);
    //   }
  
    //   // 7 filas (días) x 26 columnas (semanas)
    //   for (let row = 0; row < DAYS_IN_WEEK; row++) {
    //     const rowDiv = document.createElement("div");
    //     rowDiv.className = "emotion-row";
  
    //     for (let col = 0; col < NUM_WEEKS; col++) {
    //       const cellDate = new Date(startDate);
    //       cellDate.setDate(startDate.getDate() + row + col * 7);
    //       const key = emotionMap[iso(cellDate)] || "NONE";
  
    //       const cell = document.createElement("div");
    //       cell.className = "emotion-cell";
    //       cell.style.backgroundColor = keyToColor[key] || "#555";
    //       cell.title = `${iso(cellDate)} – ${keyToName[key]}`;
    //       rowDiv.appendChild(cell);
    //     }
    //     gridContainer.appendChild(rowDiv);
    //   }
  
    //   emotionChart.appendChild(monthLabelsContainer);
    //   emotionChart.appendChild(gridContainer);
    // }
  
    // if (data.daily_emotion) {
    //   renderEmotionChart(data.daily_emotion);
    // } else {
    //   console.warn("⚠️ No hay datos válidos para Emotion Chart");
    // }
  
    // // Emoción más frecuente (incluimos ahora Cansancio; ya no excluimos Neutral)
    // function mostrarEmocionPrevalente(datos, dias = 15) {
    //   if (!Array.isArray(datos) || datos.length === 0) return;
  
    //   // Normalizamos "Neutral" -> "Cansancio"
    //   const norm = (s) => (s || "").replace(/neutral/i, "Cansancio").trim();
  
    //   const ordenados = [...datos].sort((a, b) => {
    //     const da = new Date(a.fecha.split("/").reverse().join("-"));
    //     const db = new Date(b.fecha.split("/").reverse().join("-"));
    //     return db - da;
    //   });
  
    //   const recientes = ordenados.slice(0, dias);
  
    //   const contador = {};
    //   recientes.forEach(entry => {
    //     const emocion = norm(entry.emocion?.split("–")[0]?.trim());
    //     if (emocion) contador[emocion] = (contador[emocion] || 0) + 1;
    //   });
  
    //   const top = Object.entries(contador).sort((a, b) => b[1] - a[1])[0];
    //   if (!top) return;
  
    //   const [nombreEmocion] = top;
  
    //   const colores = {
    //     "Calma": "#2ECC71",
    //     "Felicidad": "#F1C40F",
    //     "Motivación": "#9B59B6",
    //     "Tristeza": "#3498DB",
    //     "Ansiedad": "#E74C3C",
    //     "Frustración": "#8D6E63",
    //     "Cansancio": "#16A085"
    //   };
    //   const color = colores[nombreEmocion] || "#555";
  
    //   const contenedor = document.getElementById("emotion-destacada");
    //   if (contenedor) {
    //     contenedor.innerHTML = `
    //       <div class="emotion-highlight">
    //         <div class="big-box" style="background-color:${color};"></div>
    //         <div>
    //           <div class="emotion-name">${nombreEmocion}</div>
    //           <div class="emotion-info">Emoción más frecuente en los últimos ${dias} días</div>
    //         </div>
    //       </div>
    //     `;
    //   }
    // }
    // if (data.daily_emotion) {
    //   mostrarEmocionPrevalente(data.daily_emotion, 15);
    // }


    // ========================
    // 💖 EMOTION CHART (fix iOS date parsing + TZ safe)
    // ========================
    function renderEmotionChart(dailyEmotion) {
      // Backward compat: normalizamos "Neutral" a "Cansancio"
      const normalize = (s) => (s || "").replace(/neutral/i, "Cansancio").trim();
    
      // Claves internas (no usamos emojis para distinguir "sin dato")
      const emotionKey = {
        "Calma": "CALMA",
        "Felicidad": "FELI",
        "Motivación": "MOTI",
        "Tristeza": "TRIS",
        "Ansiedad": "ANSI",
        "Frustración": "FRUS",
        "Cansancio": "CANS"
      };
    
      const keyToName = {
        CALMA: "Calma",
        FELI: "Felicidad",
        MOTI: "Motivación",
        TRIS: "Tristeza",
        ANSI: "Ansiedad",
        FRUS: "Frustración",
        CANS: "Cansancio",
        NONE: "Sin registro"
      };
    
      // Colores (Cansancio turquesa oscuro; días sin registro gris)
      const keyToColor = {
        CALMA: "#2ECC71",
        FELI:  "#F1C40F",
        MOTI:  "#9B59B6",
        TRIS:  "#3498DB",
        ANSI:  "#E74C3C",
        FRUS:  "#8D6E63",
        CANS:  "#16A085", // 👈 turquesa oscuro
        NONE:  "#555555"  // 👈 sin datos
      };
    
      // === FIX 1: parseo robusto D/M/YYYY -> Date local (evita Safari issues)
      const parseDate = (str) => {
        if (!str) return null;
        const parts = String(str).split("/");
        if (parts.length !== 3) return null;
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day); // <-- local time, cross-browser
      };
    
      // === FIX 2: ISO local sin zona horaria (evita corrimientos de día)
      const isoLocal = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const da = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${da}`;
      };
    
      // Mapa fecha -> clave emoción
      const emotionMap = {};
      (dailyEmotion || []).forEach(entry => {
        const d = parseDate(entry.fecha);
        const k = emotionKey[ normalize(entry.emocion) ];
        if (d instanceof Date && !isNaN(d) && k) {
          emotionMap[isoLocal(d)] = k;
        }
      });
    
      const sortedDates = Object.keys(emotionMap).sort();
      if (sortedDates.length === 0) {
        // nada que pintar
        const emotionChart = document.getElementById("emotionChart");
        if (emotionChart) emotionChart.innerHTML = "";
        return;
      }
    
      // arranca desde el domingo de la primera semana
      const startDate = new Date(parseDate(sortedDates[0]));
      startDate.setDate(startDate.getDate() - startDate.getDay());
    
      const NUM_WEEKS = 26;
      const DAYS_IN_WEEK = 7;
    
      const emotionChart = document.getElementById("emotionChart");
      if (!emotionChart) return;
      emotionChart.innerHTML = "";
    
      const monthLabelsContainer = document.createElement("div");
      monthLabelsContainer.className = "month-labels";
    
      const gridContainer = document.createElement("div");
      gridContainer.className = "emotion-grid";
    
      // Etiquetas de mes alineadas por columna (una por semana)
      let currentMonth = -1;
      for (let col = 0; col < NUM_WEEKS; col++) {
        const labelDate = new Date(startDate);
        labelDate.setDate(startDate.getDate() + col * 7);
        const month = labelDate.getMonth();
    
        const label = document.createElement("div");
        label.className = "month-label";
        label.textContent = (month !== currentMonth)
          ? labelDate.toLocaleString("es-ES", { month: "short" })
          : "";
        currentMonth = month;
        label.style.width = `5px`;
        monthLabelsContainer.appendChild(label);
      }
    
      // 7 filas (días) x 26 columnas (semanas)
      for (let row = 0; row < DAYS_IN_WEEK; row++) {
        const rowDiv = document.createElement("div");
        rowDiv.className = "emotion-row";
    
        for (let col = 0; col < NUM_WEEKS; col++) {
          const cellDate = new Date(startDate);
          cellDate.setDate(startDate.getDate() + row + col * 7);
          const key = emotionMap[isoLocal(cellDate)] || "NONE";
    
          const cell = document.createElement("div");
          cell.className = "emotion-cell";
          cell.style.backgroundColor = keyToColor[key] || "#555";
          cell.title = `${isoLocal(cellDate)} – ${keyToName[key]}`;
          rowDiv.appendChild(cell);
        }
        gridContainer.appendChild(rowDiv);
      }
    
      emotionChart.appendChild(monthLabelsContainer);
      emotionChart.appendChild(gridContainer);
    }
    
    if (data.daily_emotion) {
      renderEmotionChart(data.daily_emotion);
    } else {
      console.warn("⚠️ No hay datos válidos para Emotion Chart");
    }
    
    // Emoción más frecuente (incluimos ahora Cansancio; ya no excluimos Neutral)
    function mostrarEmocionPrevalente(datos, dias = 15) {
      if (!Array.isArray(datos) || datos.length === 0) return;
    
      const norm = (s) => (s || "").replace(/neutral/i, "Cansancio").trim();
    
      const ordenados = [...datos].sort((a, b) => {
        const da = new Date(a.fecha.split("/").reverse().join("-"));
        const db = new Date(b.fecha.split("/").reverse().join("-"));
        return db - da;
      });
    
      const recientes = ordenados.slice(0, dias);
    
      const contador = {};
      recientes.forEach(entry => {
        const emocion = norm(entry.emocion?.split("–")[0]?.trim());
        if (emocion) contador[emocion] = (contador[emocion] || 0) + 1;
      });
    
      const top = Object.entries(contador).sort((a, b) => b[1] - a[1])[0];
      if (!top) return;
    
      const [nombreEmocion] = top;
    
      const colores = {
        "Calma": "#2ECC71",
        "Felicidad": "#F1C40F",
        "Motivación": "#9B59B6",
        "Tristeza": "#3498DB",
        "Ansiedad": "#E74C3C",
        "Frustración": "#8D6E63",
        "Cansancio": "#16A085"
      };
      const color = colores[nombreEmocion] || "#555";
    
      const contenedor = document.getElementById("emotion-destacada");
      if (contenedor) {
        contenedor.innerHTML = `
          <div class="emotion-highlight">
            <div class="big-box" style="background-color:${color};"></div>
            <div>
              <div class="emotion-name">${nombreEmocion}</div>
              <div class="emotion-info">Emoción más frecuente en los últimos ${dias} días</div>
            </div>
          </div>
        `;
      }
    }
    if (data.daily_emotion) {
      mostrarEmocionPrevalente(data.daily_emotion, 15);
    }


    
    // REWARDS
    document.getElementById("rewardsContainer").innerHTML = "<p>(🪄Rewards WIP - Very Soon)</p>";
  
    // MISIONES
    const missionsWrapper = document.getElementById("missions-wrapper");
    (data.misiones || []).forEach((m) => {
      const card = document.createElement("div");
      card.className = "mission-card";
      card.innerHTML = `
        <h4>🎯 ${m.nombre}</h4>
        <p><strong>Pilar:</strong> ${m.pilar}</p>
        <p><strong>Rasgo:</strong> ${m.rasgo}</p>
        <p><strong>Tasks:</strong> ${m.tasks.join(", ")}</p>
        <p><strong>Semanas necesarias:</strong> ${m.constancia_semanas}</p>
        <p><strong>XP:</strong> ${m.xp}</p>
        <button>Activar</button>
      `;
      missionsWrapper.appendChild(card);
    });
  
    // MENÚ HAMBURGUESA
    const menuToggle = document.getElementById("menu-toggle");
    const dashMenu = document.getElementById("dashboard-menu");
    if (menuToggle && dashMenu) {
      menuToggle.addEventListener("click", () => dashMenu.classList.toggle("active"));
      document.addEventListener("click", (e) => {
        if (!dashMenu.contains(e.target) && e.target !== menuToggle) dashMenu.classList.remove("active");
      });
    }
  
    // --- Responsiveness / resize for charts ---
    const radarCanvasEl = document.getElementById('radarChart');
    const getRadarChart = () => {
      try { return Chart.getChart(radarCanvasEl); } catch { return null; }
    };
  
    const resizeTargets = [
      document.getElementById('radarChartContainer'),
      document.getElementById('xpChart')?.parentElement
    ].filter(Boolean);
  
    const ro = new ResizeObserver(() => {
      const rc = getRadarChart();
      if (rc) rc.resize();
      if (typeof xpChart !== 'undefined' && xpChart) xpChart.resize();
    });
    resizeTargets.forEach(t => ro.observe(t));
  
    window.addEventListener('resize', () => {
      const rc = getRadarChart();
      if (rc) rc.resize();
      if (typeof xpChart !== 'undefined' && xpChart) xpChart.resize();
    });

  } catch (err) {
    console.error("Error cargando datos del dashboard:", err);
  } finally {
    hideSpinner(); // siempre se oculta al final
  }
});

// === BOTÓN ACTUALIZAR ===
(function attachRefreshButton () {
  const btn = document.getElementById('refresh-kv')
            || document.querySelector('[data-action="refresh-kv"]');
  if (!btn) return;

  let cooling = false;
  btn.addEventListener('click', async (e) => {
    e.preventDefault();
    if (cooling) return;
    cooling = true;

    const email = (window.GJ_CTX && window.GJ_CTX.email)
               || new URLSearchParams(location.search).get('email');
    if (!email) { alert('Falta email'); cooling = false; return; }

    try {
      btn.classList.add('is-loading');     // spinner CSS opcional
      await refreshBundle(email);          // ← actualiza el KV en el Worker

      // feedback opcional
      if (window.toast) toast.success('Actualizado ✨');

      // pequeña pausa para que KV quede persistido y…
      await new Promise(r => setTimeout(r, 400));

      // …recargamos la página para re-leer TODO el bundle y pintar lo nuevo
      location.reload();
      return; // por si el reload se demora
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar ahora.');
    } finally {
      btn.classList.remove('is-loading');
      setTimeout(() => (cooling = false), 1500);
    }
  });
})();



// ===== CAMBIAR AVATAR abrir/cerrar + subir a ImgBB + persistir en Sheet =====
  // ===== Config del Form que actualiza el avatar =====
  const AVATAR_FORM = {
    ACTION: "https://docs.google.com/forms/u/0/d/e/1FAIpQLScFl3MFsLSos0OEnW9mTI2eZ3DpRBmfq8o29fgKLxEKpXX4Kg/formResponse", // <-- FORM_ACTION
    ENTRY_EMAIL: "entry.158494973",        // <-- ENTRY para email
    ENTRY_AVATAR: "entry.1736118796"        // <-- ENTRY para avatar URL
  };
  
  // ===== Subida a ImgBB (igual que en tu SignUp) =====
  async function uploadToImgBB(file){
    const IMGBB_KEY = "b78f6fa1f849b2c8fcc41ba4b195864f"; // misma key
    const reader = new FileReader();
  
    return new Promise((resolve, reject)=>{
      reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
      reader.onloadend = async () => {
        try {
          const base64 = String(reader.result).split(",")[1];
          const resp = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, {
            method: "POST",
            body: new URLSearchParams({ image: base64 })
          });
          const data = await resp.json();
          const url = data?.data?.url;
          url ? resolve(url) : reject(new Error("Respuesta inválida de ImgBB"));
        } catch (err) { reject(err); }
      };
      reader.readAsDataURL(file);
    });
  }
  
  // ===== Enviar al Google Form (no-cors, como en SignUp) =====
  async function sendAvatarToForm(email, avatarUrl){
    const fd = new FormData();
    fd.append(AVATAR_FORM.ENTRY_EMAIL, email);
    fd.append(AVATAR_FORM.ENTRY_AVATAR, avatarUrl);
  
    await fetch(AVATAR_FORM.ACTION, {
      method: "POST",
      mode: "no-cors",
      body: fd
    });
    // no-cors no permite leer respuesta → asumimos éxito como en SignUp
  }
  
  // ===== Integración con el popup del Dashboard =====
  (() => {
    const openBtn   = document.getElementById('edit-avatar');
    const modal     = document.getElementById('avatarPopup');
    const closeBtn  = document.getElementById('closeAvatarPopup');
    const cancelBtn = document.getElementById('cancelAvatar');
    const confirmBtn= document.getElementById('confirmAvatar');
    const inputFile = document.getElementById('newAvatarInput');
    const statusEl  = document.getElementById('avatarStatus');
    const avatarImg = document.getElementById('avatar');
    const current   = document.getElementById('currentAvatar');
  
    function showModal(){ modal?.classList.add('visible'); }
    function hideModal(){ modal?.classList.remove('visible'); statusEl.textContent=''; inputFile.value=''; }
  
    openBtn?.addEventListener('click', (e)=>{
      e.preventDefault();
      if (current && avatarImg) current.src = avatarImg.src || "";
      showModal();
    });
    closeBtn?.addEventListener('click', hideModal);
    cancelBtn?.addEventListener('click', hideModal);
  
    confirmBtn?.addEventListener('click', async ()=>{
      const file = inputFile?.files?.[0];
      if (!file){ alert("Elegí una imagen primero."); return; }
  
      const email = new URLSearchParams(location.search).get('email') || "";
      if (!email){ alert("Falta email en la URL."); return; }
  
      try {
        statusEl.textContent = "Subiendo imagen…";
        const url = await uploadToImgBB(file);
  
        statusEl.textContent = "Actualizando tu perfil…";
        await sendAvatarToForm(email, url);

        // Refrescar KV para que el Worker tenga el nuevo avatar al toque
        await refreshBundle(ctx.email);
  
        // Refrescar avatar en el acto
        if (avatarImg) avatarImg.src = url;
        if (current) current.src = url;
  
        statusEl.textContent = "Listo ✅";
        setTimeout(hideModal, 600);
      } catch (err) {
        console.error(err);
        statusEl.textContent = "Error: " + err.message;
      }
    });
  })();


// ====== REFRESH GENÉRICO (Worker pull) ======
async function refreshBundle(email, { mode = 'reload' } = {}) {
  if (!email) throw new Error('Falta email');

  // 1) Pedir al Worker que se refresque desde el WebApp y escriba el KV
  const r = await fetch(`${WORKER_BASE}/refresh-pull?email=${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    body: JSON.stringify({ email })
  });
  if (!r.ok) throw new Error('refresh-pull failed: ' + r.status);

  // 2a) Modo simple: recargar todo (garantiza que el dashboard use el bundle nuevo)
  if (mode === 'reload') { location.reload(); return; }

  // 2b) Modo sin F5: obtener bundle fresco y anunciarlo (para quien quiera escucharlo)
  const b = await fetch(`${WORKER_BASE}/bundle?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
  if (!b.ok) return;
  const freshRaw = await b.json();

  // Guardar y avisar. NO tocamos ctx ni campos sueltos.
  window.GJ_BUNDLE = freshRaw;
  try { localStorage.setItem('gj_bundle', JSON.stringify(freshRaw)); } catch {}
  window.dispatchEvent(new CustomEvent('gj:bundle-updated', { detail: freshRaw }));

  return freshRaw;
}



// // ====== REFRESH KV (Front → Worker → WebApp → KV) ======
// async function refreshBundle(email) {
//   if (!email) throw new Error("Falta email para refrescar");

//   const r = await fetch(
//     `${WORKER_BASE}/refresh-pull?email=${encodeURIComponent(email)}`,
//     {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' }, // ok aunque también mandemos el email en query
//       cache: 'no-store',
//       body: JSON.stringify({ email })
//     }
//   );

//   if (!r.ok) throw new Error('Worker refresh-pull failed: ' + r.status);
//   return r.json(); // { ok:true, email, key, source: 'webapp->worker' }
// }



/* ========= InfoChip util v3 (fixed, viewport-safe) ===========================
   Uso declarativo:
     <h3 class="card-title" data-info="Texto..." data-info-pos="left"></h3>

   Uso por JS:
     attachInfoChip('.xp-box h3', 'Qué es el XP...', 'right')

   Cambios clave:
   - El pop usa position: FIXED -> no lo recortan contenedores ni overflow:hidden.
   - Colocación inteligente dentro del viewport (con margen).
   - Misma API que tu versión anterior.
============================================================================= */
/* ========= InfoChip util v3 — scroll-aware & left/right anchor =============== */
(function(){
  const MARGIN = 10; // margen de resguardo contra los bordes de la ventana
  const TAP_GUARD_MS = 450; // evita doble toggle (touch + click)

  function _build(targetEl, html, pos){
    if (!targetEl) return;

    // contenedor lógico para estilos del chip
    targetEl.classList.add('card-title-with-info');

    // normalizo posición
    const anchor = String(pos || targetEl.dataset.infoPos || 'right').toLowerCase();

    // botón chip
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'info-chip' + (anchor === 'left' ? ' info-left' : '');
    chip.setAttribute('aria-label','Información');
    chip.textContent = 'i'; // si preferís el circulito: 'ⓘ'

    // pop
    const pop = document.createElement('div');
    pop.className = 'info-pop';
    pop.innerHTML = html;

    targetEl.appendChild(chip);
    targetEl.appendChild(pop);

    let rafId = null;
    let lastTouchTs = 0;

    // coloca el pop usando coordenadas de viewport (position: fixed en CSS)
    function place(){
      // mostrar para medir
      pop.style.display  = 'block';
      pop.classList.add('show');

      const r  = chip.getBoundingClientRect();
      const pw = pop.offsetWidth;
      const ph = pop.offsetHeight;

      // base horizontal según ancla
      let left;
      if (anchor === 'left' || chip.classList.contains('info-left')){
        left = Math.round(r.left);
      } else {
        left = Math.round(r.right - pw);
      }

      // clamp horizontal
      if (left < MARGIN) left = MARGIN;
      if (left + pw > window.innerWidth - MARGIN){
        left = window.innerWidth - MARGIN - pw;
      }

      // vertical: preferir debajo del chip; si no entra, va arriba
      let top  = Math.round(r.bottom + 1); // 2px de aire
      if (top + ph > window.innerHeight - MARGIN){
        top = Math.max(MARGIN, Math.round(r.top - ph - 6));
      }

      pop.style.left = left + 'px';
      pop.style.top  = top  + 'px';
    }

    function closeAll(){
      document.querySelectorAll('.info-pop.show').forEach(p=>{
        p.classList.remove('show');
        p.style.display = 'none';
      });
    }

    // abrir/cerrar con exclusión mutua
    function toggle(e){
      if (e) e.stopPropagation();
      const wantShow = !pop.classList.contains('show');
      closeAll();
      if (wantShow){ place(); }
    }

    // eventos de apertura
    chip.addEventListener('click', (e)=>{
      // si hubo un touch hace < TAP_GUARD_MS, ignorá el click (doble firing iOS/Android)
      if (Date.now() - lastTouchTs < TAP_GUARD_MS) return;
      toggle(e);
    });

    chip.addEventListener('touchstart', (e)=>{
      lastTouchTs = Date.now();
      toggle(e);
    }, {passive:true});

    // opcional desktop: precolocar al pasar el mouse
    chip.addEventListener('mouseenter', place);

    // reposicionar mientras esté visible (scroll/resize/orientation)
    function onScrollOrResize(){
      if (!pop.classList.contains('show')) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(place);
    }
    window.addEventListener('scroll', onScrollOrResize, {passive:true});
    document.addEventListener('scroll', onScrollOrResize, {passive:true});
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('orientationchange', onScrollOrResize);

    // cerrar en click fuera o ESC
    document.addEventListener('click', (e)=>{
      if (!e.target.closest('.info-pop') && !e.target.closest('.info-chip')){
        pop.classList.remove('show'); pop.style.display='none';
      }
    });

    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape'){
        pop.classList.remove('show'); pop.style.display='none';
      }
    });
  }

  // Declarativo: cualquier elemento con data-info
  function initInfoChips(){
    document.querySelectorAll('[data-info]').forEach(el=>{
      if (el.dataset.infoInit === '1') return;
      el.dataset.infoInit = '1';
      _build(el, el.dataset.info, (el.dataset.infoPos||'right'));
    });
  }

  // API pública
  window.attachInfoChip = function(selector, text, position){
    const el = document.querySelector(selector);
    _build(el, text, (position||'right'));
  };

  document.addEventListener('DOMContentLoaded', initInfoChips);
})();
