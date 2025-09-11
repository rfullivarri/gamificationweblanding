/* panel-rachas.js — componente + adaptador (browser global) */
(function (global) {
  const MODES = { Low:1, Chill:2, Flow:3, Evolve:4 };
  const $  = (sel,el=document)=>el.querySelector(sel);
  const $$ = (sel,el=document)=>[...el.querySelectorAll(sel)];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const pct=(done,goal)=>clamp(Math.round((done/goal)*100),0,100);
  const stateClass=(done,goal)=> done>=goal ? 'ok' : (done/goal>=.5 ? 'warn' : 'bad');

  // Barras: Mes = semanas; 3M = meses agregados
  function weeklyBars(values, goal){
    if(!Array.isArray(values) || values.length===0) return '';
    const BASE = 20, EXTRA = 6, g = Math.max(1, goal|0);
    return `<div class="wkbars">${
      values.map(v=>{
        const n = Math.max(0, Number(v)||0);
        if (n < g)  { const h = Math.max(6, Math.round(BASE*(n/g))); return `<b class="miss" style="height:${h}px"></b>`; }
        if (n === g){ return `<b class="hit" style="height:${BASE}px"></b>`; }
        const h = BASE + (n - g) * EXTRA;
        return `<b class="over" style="height:${h}px"></b>`;
      }).join('')
    }</div>`;
  }

  // === Componente ===
  function mount(target, { initialState, dataProvider }){
    const root = (typeof target==='string') ? document.querySelector(target) : target;
    const S = Object.assign({ mode:'Flow', pillar:'Body', range:'month', query:'' }, initialState||{});

    // UI
    root.innerHTML = `
      <div class="box">
        <div class="row">
          <div class="seg" data-role="pillars">
            <button aria-pressed="${S.pillar==='Body'}" data-p="Body">🫀 Body</button>
            <button aria-pressed="${S.pillar==='Mind'}" data-p="Mind">🧠 Mind</button>
            <button aria-pressed="${S.pillar==='Soul'}" data-p="Soul">🏵️ Soul</button>
          </div>
          <div class="seg">
            <span class="chip mode ${S.mode.toLowerCase()}" data-role="modeChip">🎮 ${S.mode} · <b>${MODES[S.mode]}×/sem</b></span>
          </div>
        </div>
        <div class="row" style="margin-top:8px">
          <div class="seg" data-role="range">
            <button aria-pressed="${S.range==='week'}"  data-r="week">Sem</button>
            <button aria-pressed="${S.range==='month'}" data-r="month">Mes</button>
            <button aria-pressed="${S.range==='qtr'}"   data-r="qtr">3M</button>
          </div>
          <button class="info" data-role="infoBtn">i</button>
        </div>
        <div class="streaks" data-role="streaks" style="display:none">
          <div class="stitle">🔥 Top 3 rachas <span class="muted">— semanas consecutivas sin cortar</span></div>
          <div class="slist" data-role="top3"></div>
        </div>
        <div class="filter"><input type="search" data-role="q" placeholder="Filtrar tareas… (ej.: ayuno)"></div>
        <div class="list" data-role="list"></div>
        <div class="muted" style="margin-top:8px">
          Tip: ✓×N = veces en el período · +XP = XP acumulado · 🔥 = racha (semanas).
          La barra muestra tu <b>progreso semanal</b> (hechas/N). En <b>Mes</b>: semanas; en <b>3M</b>: 3 barras (meses).
        </div>
      </div>
    `;

    // CSS (una vez)
    if (!document.getElementById('panel-rachas-styles')) {
      const css = document.createElement('style'); css.id='panel-rachas-styles';
      css.textContent = `
        .third{max-width:560px;margin:0 auto 18px;width:100%} /* gap arriba = 0 */
        @media(min-width:1160px){.third{max-width:33vw}}
        .box{background:linear-gradient(180deg,#111831,#0e152a);border:1px solid #1f2a48;border-radius:22px;padding:14px;box-shadow:0 10px 28px rgba(0,0,0,.35)}
        .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
        .seg{display:flex;gap:8px;flex-wrap:wrap}
        .seg button{background:#1a2240;border:1px solid #24325a;color:#cfd6ff;padding:7px 11px;border-radius:999px;font-weight:800;cursor:pointer}
        .seg button[aria-pressed="true"]{background:#eef2ff;color:#0f1630;border-color:transparent}
        .chip{background:#1a2037;border:1px solid #2a3560;color:#d6dcff;padding:6px 9px;border-radius:999px;font-weight:800;display:inline-flex;align-items:center;gap:8px}
        .chip.mode{--modeFlow:#1f7aff;background:color-mix(in srgb, var(--modeFlow) 12%, #0c1124);border-color:color-mix(in srgb, var(--modeFlow) 40%, #2a3560)}
        .chip.mode.low{--modeFlow:#7d7fff}.chip.mode.chill{--modeFlow:#7bc6ff}.chip.mode.flow{--modeFlow:#1f7aff}.chip.mode.evolve{--modeFlow:#20d3b0}
        .info{width:28px;height:28px;border-radius:999px;border:1px solid #2a3560;background:#1a2240;color:#cfd6ff;display:grid;place-items:center;cursor:pointer}
        .streaks{margin:12px 0 10px;padding:10px;border:1px solid #1f2a48;border-radius:16px;background:linear-gradient(180deg,#141c3a,#0e142b)}
        .stitle{font-weight:900;margin:0 2px 8px;display:flex;gap:8px;align-items:center}
        .slist{display:flex;flex-direction:column;gap:8px}
        .stag{position:relative;background:#0f1530;border:1px solid #263157;border-radius:12px;padding:10px 86px 10px 10px} /* espacio p/ chip */
        .stag .n{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .stag .sub{display:flex;align-items:center;justify-content:space-between;color:#cfd6ec;font-size:12px;margin-top:4px}
        .stag .bar{height:8px;background:#1f274a;border-radius:999px;overflow:hidden;margin-top:6px}
        .stag .bar i{display:block;height:100%;width:var(--p,0%);background:linear-gradient(90deg,#5a2bff,#a77bff)}
        .stag .streak-chip{position:absolute;top:8px;right:8px;background:rgba(255,157,77,.12);border:1px solid #6e3c17;color:#ffd6b2;padding:4px 8px;border-radius:999px;font-weight:900;font-size:12px}
        .filter{display:flex;gap:8px;margin:10px 0}
        .filter input{flex:1;background:#101735;border:1px solid #263157;color:#e9edff;border-radius:12px;padding:10px 12px;font-weight:600}
        .filter input::placeholder{color:#8ea0ce}
        .list{display:flex;flex-direction:column;gap:10px}
        .task{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:linear-gradient(180deg,#111831,#0b1428);border:1px solid #1f2a48;border-radius:16px;padding:10px}
        @media(max-width:520px){.task{grid-template-columns:1fr}}
        .left{min-width:0}.name{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stat{font-size:12px;color:#9aa3b2}
        .prog{display:flex;align-items:center;gap:8px;margin-top:8px}
        .state{width:10px;height:10px;border-radius:999px;border:1px solid #0004}.state.ok{background:#7af59b}.state.warn{background:#ffd166}.state.bad{background:#ff6b6b}
        .bar{position:relative;height:10px;background:#1f274a;border-radius:999px;overflow:hidden;flex:1}
        .bar i{position:absolute;inset:0;width:var(--p,0%);background:linear-gradient(90deg,#5a2bff,#a77bff)}
        .pnum{font-variant-numeric:tabular-nums;font-weight:900;min-width:48px;text-align:right}
        .right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
        .right .chip{background:transparent}
        .wkbars{display:grid;grid-auto-flow:column;gap:4px;align-items:end;height:32px;min-width:112px}
        .wkbars b{width:12px;border-radius:4px}
        .wkbars b.miss{background:#3a456f}.wkbars b.hit{background:#30e47b}.wkbars b.over{background:linear-gradient(180deg,#8bff6a,#26e0a4)}
        .muted{color:#9aa3b2}
        @media (max-width: 1280px){
        .task{grid-template-columns:1fr; row-gap:8px}
        .right{justify-content:space-between}
        .wkbars{min-width:0}
        }
        @media (max-width: 768px){
          .chip{font-size:12px; padding:5px 8px}
          .wkbars b{width:10px}
          .pnum{min-width:auto}
        }
      `;
      document.head.appendChild(css);
    }

    root.classList.add('third');

    const els = {
      pillars: $('[data-role="pillars"]', root),
      range:   $('[data-role="range"]', root),
      modeChip: $('[data-role="modeChip"]', root),
      streaks: $('[data-role="streaks"]', root),
      top3:    $('[data-role="top3"]', root),
      list:    $('[data-role="list"]', root),
      q:       $('[data-role="q"]', root),
      infoBtn: $('[data-role="infoBtn"]', root)
    };

    async function refresh(){
      const goal = MODES[S.mode] || 3;   // fallback
      els.modeChip.className = `chip mode ${S.mode.toLowerCase()}`;
      els.modeChip.innerHTML = `🎮 ${S.mode} · <b>${goal}×/sem</b>`;

      const { topStreaks=[], tasks=[] } = await dataProvider({ mode:S.mode, pillar:S.pillar, range:S.range, query:S.query });

      // TOP 3
      if(topStreaks.length===0){ els.streaks.style.display='none'; }
      else{
        els.streaks.style.display='';
        els.top3.innerHTML = topStreaks.slice(0,3).map(t=>{
          const p = pct(t.weekDone, goal);
          return `<div class="stag">
            <div class="n">${t.name}</div>
            <div class="sub"><span></span><span>${t.weekDone}/${goal}</span></div>
            <div class="bar" style="--p:${p}%"><i></i></div>
            ${t.streakWeeks>=2 ? `<span class="streak-chip">🔥 x${t.streakWeeks}w</span>` : ``}
          </div>`;
        }).join('');
      }

      // LISTA (ordenada por XP del scope y sin duplicar top)
      // === NUEVO ===
      const exclude = new Set(topStreaks.map(t=>t.id));
      
      // ordenar por XP del scope (desc)
      const ranked = tasks
        .filter(t => !exclude.has(t.id))
        .sort((a,b) => ((b.metrics[S.range]?.xp || 0) - (a.metrics[S.range]?.xp || 0)));
      
      els.list.innerHTML = ranked.map(t=>{
        const m   = t.metrics[S.range] || { count:0, xp:0, weeks:[] };
        const P   = pct(t.weekDone, goal);
        const st  = stateClass(t.weekDone, goal);
        const bars= (S.range==='week') ? '' : weeklyBars(m.weeks, goal);
        const fire= (t.streakWeeks>=2) ? `<span class="chip">🔥 x${t.streakWeeks}w</span>` : '';
      
        return `<div class="task">
          <div class="left">
            <div class="name">${t.name}</div>
            <div class="stat">Stat: ${t.stat}</div>
            <div class="prog">
              <span class="state ${st}" title="Estado semanal"></span>
              <div class="bar" style="--p:${P}%"><i></i></div>
              <div class="pnum">${t.weekDone}/${goal}</div>
            </div>
          </div>
          <div class="right">
            <span class="chip">✓×${m.count||0}</span>
            <span class="chip">+${m.xp||0} XP</span>
            ${fire}
            ${bars}
          </div>
        </div>`;
      }).join('');
    }
    
    // Eventos
    els.pillars.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b) return;
      S.pillar=b.dataset.p; $$('.seg[data-role="pillars"] button',root).forEach(x=>x.setAttribute('aria-pressed', x===b?'true':'false')); refresh();
    });
    els.range.addEventListener('click',e=>{
      const b=e.target.closest('button'); if(!b) return;
      S.range=b.dataset.r; $$('.seg[data-role="range"] button',root).forEach(x=>x.setAttribute('aria-pressed', x===b?'true':'false')); refresh();
    });
    els.q.addEventListener('input', ()=>{ S.query=els.q.value||''; refresh(); });
    els.infoBtn.addEventListener('click', ()=>{
      alert('Tip: ✓×N = veces en el período · +XP = XP · 🔥 = racha. Mes = semanas; 3M = meses (verde si todas las semanas llegaron).');
    });

    return refresh();
  }

  // === Adaptador a Dashboard v3 ===
  function fromDashboardV3(data){
    const MODE_TIER = { LOW:1, CHILL:2, FLOW:3, 'FLOW MOOD':3, EVOL:4, EVOLVE:4 };
    // Normaliza el game_mode que viene en el bundle (p.ej. "Flow Mood" → "FLOW")
    const GAME_MODE_NORM = String((data?.metrics?.game_mode ?? data?.game_mode ?? 'FLOW'))
      .toUpperCase()
      .split(/\s+/)[0]; // toma la primera palabra
    const PILLAR_MAP = {'Cuerpo':'Body','Mente':'Mind','Alma':'Soul','Body':'Body','Mind':'Mind','Soul':'Soul','BODY':'Body','MIND':'Mind','SOUL':'Soul','CUERPO':'Body','MENTE':'Mind','ALMA':'Soul'};
    const rows = Array.isArray(data?.bbdd) ? data.bbdd : [];

    const norm = (r)=>({
      id: (r.id || r.task || r.Task || r.TAREA || r.nombre || '').toString().trim() || Math.random().toString(36).slice(2),
      pillar: PILLAR_MAP[(r.pilar||r.pillar||'').toString().trim()] || 'Body',
      stat:   (r.stat || r.rasgo || r.trait || '').toString().trim(),
      name:   (r.task || r.Task || r.Tarea || r.nombre || '').toString().trim(),
      xp: Number(r.xp_base ?? r.xp ?? r.exp ?? 0),
      streakWeeks: Number(r.constancia || r.streak || 0),
      weeklyNow:{1:+(r.c1s_ac||0),2:+(r.c2s_ac||0),3:+(r.c3s_ac||0),4:+(r.c4s_ac||0)},
      weeklyMax:{1:+(r.c1s_m ||0),2:+(r.c2s_m ||0),3:+(r.c3s_m ||0),4:+(r.c4s_m ||0)}
    });
    const BASE = rows.map(norm);

    // Logs diarios (opcional)
    // ✅ Usa la nueva fuente con tarea + fecha
    const LOGS = Array.isArray(data?.daily_log_raw) ? data.daily_log_raw
              : (Array.isArray(data?.daily_log) ? data.daily_log : []);
    const get = (o,keys)=>{ for(const k of keys){ if(o && o[k]!=null) return o[k]; } };
    const parseD = (s)=>{
      const str=(s||'').toString(); const d=new Date(str);
      if(!isNaN(d)) return d;
      const m=str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
      if(m){const [_,dd,mm,yy]=m; return new Date(yy.length===2?('20'+yy):yy, mm-1, dd)}
      return null;
    };
    // compara ignorando acentos, mayúsculas y pequeños desvíos ("2l de agua" ~ "2 litros de agua")
    const normStr = s => (s ?? '').toString()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // sin acentos
      .toLowerCase().trim();
    
    const sameTask = (a,b) => {
      const A = normStr(a), B = normStr(b);
      return A === B || A.includes(B) || B.includes(A);
    };

    const now = new Date(), DAY=86400000;
    const weekStart = (date)=>{ const d=new Date(date); const day=(d.getDay()+6)%7; d.setHours(0,0,0,0); return new Date(d.getTime()-day*DAY); };
    const addDays=(d,n)=>new Date(d.getTime()+n*DAY);
    const monthStart = (d)=>new Date(d.getFullYear(), d.getMonth(), 1);
    const monthEnd   = (d)=>new Date(d.getFullYear(), d.getMonth()+1, 1);

    function buildWeeksOfCurrentMonth(){
      const start = monthStart(now);
      const end   = monthEnd(now);
      const weeks = [];
      for(let d=weekStart(start); d<end; d=addDays(d,7)){
        const s = d < start ? start : d;
        const e = addDays(d,7) > end ? end : addDays(d,7);
        if (s < e) weeks.push({start:s, end:e});
      }
      return weeks; // 4 o 5 barras según el mes
    }

    // Meses para 3M: actual y dos anteriores
    function build3Months(){
      const base = monthStart(now);
      const arr=[];
      for(let i=2;i>=0;i--){
        const s = new Date(base.getFullYear(), base.getMonth()-i, 1);
        const e = new Date(base.getFullYear(), base.getMonth()-i+1, 1);
        arr.push({start:s, end:e});
      }
      return arr;
    }

    // XP por log (si no viene en el log, usamos XP de la tarea)
    function xpFromLog(l, taskXP){
      const x = Number(get(l,['xp','XP','exp']));
      return isNaN(x) || x===0 ? Number(taskXP||0) : x;
    }

    // Agrega métricas para una tarea
    function aggregateForTask(t){
      const tier = MODE_TIER[GAME_MODE_NORM] || 3;

      // Filtrar logs que pertenezcan a ESTA tarea (si no hay nombre de tarea en el log, NO cuenta)
      const taskLogs = LOGS.filter(l=>{
        const ln = get(l, ['task','tarea','Task','nombre','habit','hábito','habito','actividad','activity']);
        if(!ln) return false; // << clave para evitar sumatorias iguales
        const lp = get(l, ['pillar','pilar','Pilar']);
        if(lp && PILLAR_MAP[lp] && PILLAR_MAP[lp]!==t.pillar) return false;
        return sameTask(String(ln), t.name);
      });

      // weekDone actual (de tu tabla base)
      // Barra semanal = weeklyNow (tu tabla base)
      const weekDone = t.weeklyNow[tier] || 0;
      
      // Chips "Sem": preferí logs si existen; si no, usá weeklyNow*t.xp
      const wStart = weekStart(now), wEnd = addDays(wStart,7);
      let wCount = weekDone;
      let wXP    = weekDone * (t.xp || 0);
      
      const weekLogs = [];
      for (const l of taskLogs) {
        const dt = parseD(get(l,['date','fecha','day','Fecha'])); if (!dt) continue;
        if (dt>=wStart && dt<wEnd) { weekLogs.push(l); }
      }
      if (weekLogs.length) {
        wCount = weekLogs.length;
        wXP    = weekLogs.reduce((acc,l)=>acc + xpFromLog(l, t.xp), 0);
      }
      
      const week = { count: wCount, xp: wXP };

      // Si no hay logs, devolvemos mínimos
      // Si no hay logs, igual devolvemos barras vacías (grises)
      if(!taskLogs.length){
        const monthWeeks = buildWeeksOfCurrentMonth().map(()=>0); // 4–5 barras
        const qtrBars    = [0,0,0];                               // 3 barras (meses)
        return {
          week,                                 // chips de semana = 0
          month: { count: 0, xp: 0, weeks: monthWeeks },
          qtr:   { count: 0, xp: 0, weeks: qtrBars }
        };
      }

      // ---- Mes (semanas) ----
      const weeks = buildWeeksOfCurrentMonth();
      const weeksArr = new Array(weeks.length).fill(0);
      let monthCount=0, monthXP=0;
      for(const l of taskLogs){
        const dt = parseD(get(l,['date','fecha','day','Fecha'])); if(!dt) continue;
        for(let i=0;i<weeks.length;i++){
          const b=weeks[i];
          if(dt>=b.start && dt<b.end){ weeksArr[i]++; monthCount++; monthXP += xpFromLog(l, t.xp); break; }
        }
      }
      const monthMetrics = { count: monthCount, xp: monthXP, weeks: weeksArr };

      // ---- 3M (3 barras = meses) ----
      const months = build3Months();
      const perWeekCount = new Map(); // key=weekStartISO -> count
      for(const l of taskLogs){
        const dt = parseD(get(l,['date','fecha','day','Fecha'])); if(!dt) continue;
        const k = weekStart(dt).toISOString().slice(0,10);
        perWeekCount.set(k, (perWeekCount.get(k)||0) + 1);
      }
      const qtrWeeks = []; // para cálculo de estados por cada mes
      const qtrBars = months.map(({start,end})=>{
        // semanas enteras dentro del mes
        const w = [];
        for(let d=weekStart(start); d<end; d=addDays(d,7)){
          const k = d.toISOString().slice(0,10);
          const c = perWeekCount.get(k)||0;
          // solo contamos semanas que caen dentro del mes mostrado
          if(d>=start && d<end) w.push(c);
        }
        qtrWeeks.push(w);
        const weeksN = Math.max(1, w.length);
        const total = w.reduce((a,b)=>a+b,0);
        const avg = total / weeksN;
        const allHit = w.every(v=>v>=tier);
        if(allHit) return tier;                    // hit → altura base (verde)
        if(avg <= tier) return avg;                // miss → gris proporcional
        return tier + Math.max(1, Math.round(avg - tier)); // over → verde más alta
      });

      // conteos / XP en 3M (sumatoria de los logs dentro de los 3 meses)
      const qStart = months[0].start, qEnd = months[months.length-1].end;
      let qCount=0, qXP=0;
      for(const l of taskLogs){
        const dt = parseD(get(l,['date','fecha','day','Fecha'])); if(!dt) continue;
        if(dt>=qStart && dt<qEnd){ qCount++; qXP += xpFromLog(l, t.xp); }
      }
      const qtrMetrics = { count:qCount, xp:qXP, weeks:qtrBars }; // weeks = 3 barras (meses)

      return { week, month: monthMetrics, qtr: qtrMetrics };
    }

    return ({ mode, pillar, range, query })=>{
      const q = (query||'').toLowerCase();
      const ofPillar = BASE.filter(x=>x.pillar===pillar && (!q || x.name.toLowerCase().includes(q) || x.stat.toLowerCase().includes(q)));

      // Top-3 rachas (si hay)
      const tier = MODE_TIER[GAME_MODE_NORM] || 3;
      const topStreaks = ofPillar
        .filter(x=>x.streakWeeks>=2)
        .sort((a,b)=>b.streakWeeks-a.streakWeeks)
        .slice(0,3)
        .map(x=>({ id:x.id, name:x.name, stat:x.stat, weekDone:(x.weeklyNow[tier]||0), streakWeeks:x.streakWeeks }));

      // Tareas con métricas completas
      const tasks = ofPillar.map(x=>{
        const metrics = aggregateForTask(x);
        return { id:x.id, name:x.name, stat:x.stat, weekDone:(x.weeklyNow[tier]||0), streakWeeks:x.streakWeeks, metrics };
      });

      return Promise.resolve({ topStreaks, tasks });
    };
  }

  const PanelRachas = { mount, adapters:{ fromDashboardV3 } };
  if (typeof module !== 'undefined' && module.exports) module.exports = PanelRachas;
  else global.PanelRachas = PanelRachas;

})(typeof window!=='undefined' ? window : globalThis);



    // Construye semanas visibles para "Mes" (4-5 últimas)
    // function buildWeeksMonth(){
    //   const arr=[]; const end=weekStart(now);
    //   // tomamos 5 semanas (últimas), se verán 4/5 según el mes
    //   for(let i=4;i>=0;i--){
    //     const start=addDays(end, -7*i);
    //     arr.push({start, end:addDays(start,7)});
    //   }
    //   return arr;
    // }


    //   const exclude = new Set(topStreaks.map(t=>t.id));
    //   const ranked = tasks
    //     .filter(t=>!exclude.has(t.id))
    //     .sort((a,b)=>((b.metrics[S.range]?.xp||0) - (a.metrics[S.range]?.xp||0)));

    //   els.list.innerHTML = ranked.map(t=>{
    //     const m = t.metrics[S.range] || {count:0,xp:0,values:[]};
    //     const P = pct(t.weekDone, goal), st = stateClass(t.weekDone, goal);
    //     const bars = (S.range==='week') ? '' : weeklyBars(m.weeks, goal);
    //     return `<div class="task">
    //       <div class="left">
    //         <div class="name">${t.name}</div>
    //         <div class="stat">Stat: ${t.stat}</div>
    //         <div class="prog">
    //           <span class="state ${st}" title="Estado semanal"></span>
    //           <div class="bar" style="--p:${P}%"><i></i></div>
    //           <div class="pnum">${t.weekDone}/${goal}</div>
    //         </div>
    //       </div>
    //       <div class="right">
    //         <span class="chip">✓×${m.count||0}</span>
    //         <span class="chip">+${m.xp||0} XP</span>
    //         <span class="chip">🔥 x${t.streakWeeks||0}w</span>
    //         ${bars}
    //       </div>
    //     </div>`;
    //   }).join('');
    // }




// /* panel-rachas.js — componente + adaptador (browser global) */
// (function (global) {
//   const MODES = { Low:1, Chill:2, Flow:3, Evolve:4 };
//   const $  = (sel,el=document)=>el.querySelector(sel);
//   const $$ = (sel,el=document)=>[...el.querySelectorAll(sel)];
//   const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
//   const pct=(done,goal)=>clamp(Math.round((done/goal)*100),0,100);
//   const stateClass=(done,goal)=> done>=goal ? 'ok' : (done/goal>=.5 ? 'warn' : 'bad');

//   // Barras semanales: =meta altura fija; <meta gris; >meta verde + alta
//   function weeklyBars(weeks, goal){
//     if(!weeks) return '';
//     const BASE=20, EXTRA=6;
//     return `<div class="wkbars">${
//       weeks.map(v=>{
//         let h=BASE, cls='hit';
//         if(v===goal){ h=BASE; cls='hit'; }
//         else if(v<goal){ h=Math.max(6, Math.round(BASE*(v/goal))); cls='miss'; }
//         else { h=BASE+(v-goal)*EXTRA; cls='over'; }
//         return `<b class="${cls}" style="height:${h}px"></b>`;
//       }).join('')
//     }</div>`;
//   }

//   // === Componente ===
//   function mount(target, { initialState, dataProvider }){
//     const root = (typeof target==='string') ? document.querySelector(target) : target;
//     const S = Object.assign({ mode:'Flow', pillar:'Body', range:'month', query:'' }, initialState||{});

//     // contenedor + UI
//     root.innerHTML = `
//       <div class="box">
//         <div class="row">
//           <div class="seg" data-role="pillars">
//             <button aria-pressed="${S.pillar==='Body'}" data-p="Body">🫀 Body</button>
//             <button aria-pressed="${S.pillar==='Mind'}" data-p="Mind">🧠 Mind</button>
//             <button aria-pressed="${S.pillar==='Soul'}" data-p="Soul">🏵️ Soul</button>
//           </div>
//           <div class="seg">
//             <span class="chip mode ${S.mode.toLowerCase()}" data-role="modeChip">🎮 ${S.mode} · <b>${MODES[S.mode]}×/sem</b></span>
//           </div>
//         </div>
//         <div class="row" style="margin-top:8px">
//           <div class="seg" data-role="range">
//             <button aria-pressed="${S.range==='week'}"  data-r="week">Sem</button>
//             <button aria-pressed="${S.range==='month'}" data-r="month">Mes</button>
//             <button aria-pressed="${S.range==='qtr'}"   data-r="qtr">3M</button>
//           </div>
//           <button class="info" data-role="infoBtn">i</button>
//         </div>
//         <div class="streaks" data-role="streaks" style="display:none">
//           <div class="stitle">🔥 Top 3 rachas <span class="muted">— semanas consecutivas sin cortar</span></div>
//           <div class="slist" data-role="top3"></div>
//         </div>
//         <div class="filter"><input type="search" data-role="q" placeholder="Filtrar tareas… (ej.: ayuno)"></div>
//         <div class="list" data-role="list"></div>
//         <div class="muted" style="margin-top:8px">
//           Tip: ✓×N = veces en el período · +XP = XP acumulado · 🔥 = racha (semanas).
//           La barra muestra tu <b>progreso semanal</b> (hechas/N). En <b>Mes/3M</b>: meta=verde igual; menos=gris; más=verde más alto.
//         </div>
//       </div>
//     `;

//     // inyecta el CSS una sola vez
//     if (!document.getElementById('panel-rachas-styles')) {
//       const css = document.createElement('style'); css.id='panel-rachas-styles';
//       css.textContent = `
//         .third{max-width:560px;margin:18px auto;padding:10px;width:100%}
//         @media(min-width:1160px){.third{max-width:33vw}}
//         .box{background:linear-gradient(180deg,#111831,#0e152a);border:1px solid #1f2a48;border-radius:22px;padding:14px;box-shadow:0 10px 28px rgba(0,0,0,.35)}
//         .row{display:flex;align-items:center;justify-content:space-between;gap:10px}
//         .seg{display:flex;gap:8px;flex-wrap:wrap}
//         .seg button{background:#1a2240;border:1px solid #24325a;color:#cfd6ff;padding:7px 11px;border-radius:999px;font-weight:800;cursor:pointer}
//         .seg button[aria-pressed="true"]{background:#eef2ff;color:#0f1630;border-color:transparent}
//         .chip{background:#1a2037;border:1px solid #2a3560;color:#d6dcff;padding:6px 9px;border-radius:999px;font-weight:800;display:inline-flex;align-items:center;gap:8px}
//         .chip.mode{--modeFlow:#1f7aff;background:color-mix(in srgb, var(--modeFlow) 12%, #0c1124);border-color:color-mix(in srgb, var(--modeFlow) 40%, #2a3560)}
//         .chip.mode.low{--modeFlow:#7d7fff}.chip.mode.chill{--modeFlow:#7bc6ff}.chip.mode.flow{--modeFlow:#1f7aff}.chip.mode.evolve{--modeFlow:#20d3b0}
//         .info{width:28px;height:28px;border-radius:999px;border:1px solid #2a3560;background:#1a2240;color:#cfd6ff;display:grid;place-items:center;cursor:pointer}
//         .streaks{margin:12px 0 10px;padding:10px;border:1px solid #1f2a48;border-radius:16px;background:linear-gradient(180deg,#141c3a,#0e142b)}
//         .stitle{font-weight:900;margin:0 2px 8px;display:flex;gap:8px;align-items:center}
//         .slist{display:flex;flex-direction:column;gap:8px}
//         .stag{position:relative;background:#0f1530;border:1px solid #263157;border-radius:12px;padding:10px}
//         .stag .n{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
//         .stag .sub{display:flex;align-items:center;justify-content:space-between;color:#cfd6ec;font-size:12px;margin-top:4px}
//         .stag .bar{height:8px;background:#1f274a;border-radius:999px;overflow:hidden;margin-top:6px}
//         .stag .bar i{display:block;height:100%;width:var(--p,0%);background:linear-gradient(90deg,#5a2bff,#a77bff)}
//         .stag .streak-chip{position:absolute;top:8px;right:8px;background:rgba(255,157,77,.12);border:1px solid #6e3c17;color:#ffd6b2;padding:4px 8px;border-radius:999px;font-weight:900;font-size:12px}
//         .filter{display:flex;gap:8px;margin:10px 0}
//         .filter input{flex:1;background:#101735;border:1px solid #263157;color:#e9edff;border-radius:12px;padding:10px 12px;font-weight:600}
//         .filter input::placeholder{color:#8ea0ce}
//         .list{display:flex;flex-direction:column;gap:10px}
//         .task{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;background:linear-gradient(180deg,#111831,#0b1428);border:1px solid #1f2a48;border-radius:16px;padding:10px}
//         @media(max-width:520px){.task{grid-template-columns:1fr}}
//         .left{min-width:0}.name{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.stat{font-size:12px;color:#9aa3b2}
//         .prog{display:flex;align-items:center;gap:8px;margin-top:8px}
//         .state{width:10px;height:10px;border-radius:999px;border:1px solid #0004}.state.ok{background:#7af59b}.state.warn{background:#ffd166}.state.bad{background:#ff6b6b}
//         .bar{position:relative;height:10px;background:#1f274a;border-radius:999px;overflow:hidden;flex:1}
//         .bar i{position:absolute;inset:0;width:var(--p,0%);background:linear-gradient(90deg,#5a2bff,#a77bff)}
//         .pnum{font-variant-numeric:tabular-nums;font-weight:900;min-width:48px;text-align:right}
//         .right{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:flex-end}
//         .right .chip{background:transparent}
//         .wkbars{display:grid;grid-auto-flow:column;gap:4px;align-items:end;height:32px;min-width:112px}
//         .wkbars b{width:12px;border-radius:4px}
//         .wkbars b.miss{background:#3a456f}.wkbars b.hit{background:#30e47b}.wkbars b.over{background:linear-gradient(180deg,#8bff6a,#26e0a4)}
//         .muted{color:#9aa3b2}
//       `;
//       document.head.appendChild(css);
//     }

//     root.classList.add('third');

//     const els = {
//       pillars: $('[data-role="pillars"]', root),
//       range:   $('[data-role="range"]', root),
//       modeChip: $('[data-role="modeChip"]', root),
//       streaks: $('[data-role="streaks"]', root),
//       top3:    $('[data-role="top3"]', root),
//       list:    $('[data-role="list"]', root),
//       q:       $('[data-role="q"]', root),
//       infoBtn: $('[data-role="infoBtn"]', root)
//     };

//     async function refresh(){
//       const goal = MODES[S.mode];
//       els.modeChip.className = `chip mode ${S.mode.toLowerCase()}`;
//       els.modeChip.innerHTML = `🎮 ${S.mode} · <b>${goal}×/sem</b>`;

//       const { topStreaks=[], tasks=[] } = await dataProvider({ mode:S.mode, pillar:S.pillar, range:S.range, query:S.query });

//       // Top 3 (si hay)
//       if(topStreaks.length===0){ els.streaks.style.display='none'; }
//       else{
//         els.streaks.style.display='';
//         els.top3.innerHTML = topStreaks.slice(0,3).map(t=>{
//           const p = pct(t.weekDone, goal);
//           return `<div class="stag">
//             <div class="n">${t.name}</div>
//             <div class="sub"><span></span><span>${t.weekDone}/${goal}</span></div>
//             <div class="bar" style="--p:${p}%"><i></i></div>
//             <span class="streak-chip">🔥 x${t.streakWeeks}w</span>
//           </div>`;
//         }).join('');
//       }

//       // Lista (sin duplicar top)
//       const exclude = new Set(topStreaks.map(t=>t.id));
//       els.list.innerHTML = tasks.filter(t=>!exclude.has(t.id)).map(t=>{
//         const m = t.metrics[S.range] || {count:0,xp:0,weeks:[]};
//         const P = pct(t.weekDone, goal), st = stateClass(t.weekDone, goal);
//         const wk = (S.range==='week') ? '' : weeklyBars(m.weeks, goal);
//         return `<div class="task">
//           <div class="left">
//             <div class="name">${t.name}</div>
//             <div class="stat">Stat: ${t.stat}</div>
//             <div class="prog">
//               <span class="state ${st}" title="Estado semanal"></span>
//               <div class="bar" style="--p:${P}%"><i></i></div>
//               <div class="pnum">${t.weekDone}/${goal}</div>
//             </div>
//           </div>
//           <div class="right">
//             <span class="chip">✓×${m.count||0}</span>
//             <span class="chip">+${m.xp||0} XP</span>
//             <span class="chip">🔥 x${t.streakWeeks||0}w</span>
//             ${wk}
//           </div>
//         </div>`;
//       }).join('');
//     }

//     // Eventos
//     els.pillars.addEventListener('click',e=>{
//       const b=e.target.closest('button'); if(!b) return;
//       S.pillar=b.dataset.p; $$('.seg[data-role="pillars"] button',root).forEach(x=>x.setAttribute('aria-pressed', x===b?'true':'false')); refresh();
//     });
//     els.range.addEventListener('click',e=>{
//       const b=e.target.closest('button'); if(!b) return;
//       S.range=b.dataset.r; $$('.seg[data-role="range"] button',root).forEach(x=>x.setAttribute('aria-pressed', x===b?'true':'false')); refresh();
//     });
//     els.q.addEventListener('input', ()=>{ S.query=els.q.value||''; refresh(); });
//     els.infoBtn.addEventListener('click', ()=>{
//       alert('Tip: ✓×N = veces en el período · +XP = XP · 🔥 = racha. Barra = hechas/N. En Mes/3M, barras verdes: meta=igual, menos=gris, más=más alta.');
//     });

//     return refresh();
//   }

//   // === Adaptador a tu Dashboard v3 ===
//   function fromDashboardV3(data){
//     const MODE_TIER = { LOW:1, CHILL:2, FLOW:3, EVOL:4, EVOLVE:4 };
//     const PILLAR_MAP = {'Cuerpo':'Body','Mente':'Mind','Alma':'Soul','Body':'Body','Mind':'Mind','Soul':'Soul','BODY':'Body','MIND':'Mind','SOUL':'Soul','CUERPO':'Body','MENTE':'Mind','ALMA':'Soul'};
//     const rows = Array.isArray(data?.bbdd) ? data.bbdd : [];

//     const norm = (r)=>({
//       id: (r.id || r.task || r.Task || r.TAREA || r.nombre || '').toString().trim() || Math.random().toString(36).slice(2),
//       pillar: PILLAR_MAP[(r.pilar||r.pillar||'').toString().trim()] || 'Body',
//       stat:   (r.stat || r.rasgo || r.trait || '').toString().trim(),
//       name:   (r.task || r.Task || r.Tarea || r.nombre || '').toString().trim(),
//       xp:     Number(r.exp || r.xp || 0),
//       streakWeeks: Number(r.constancia || r.streak || 0),
//       weeklyNow:{1:+(r.c1s_ac||0),2:+(r.c2s_ac||0),3:+(r.c3s_ac||0),4:+(r.c4s_ac||0)},
//       weeklyMax:{1:+(r.c1s_m ||0),2:+(r.c2s_m ||0),3:+(r.c3s_m ||0),4:+(r.c4s_m ||0)}
//     });
//     const BASE = rows.map(norm);

//     // Logs diarios (opcional)
//     const LOGS = Array.isArray(data?.daily_cultivation) ? data.daily_cultivation : [];
//     const get = (o,keys)=>{ for(const k of keys){ if(o && o[k]!=null) return o[k]; } };
//     const parseD = (s)=>{
//       const str=(s||'').toString(); const d=new Date(str);
//       if(!isNaN(d)) return d;
//       const m=str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
//       if(m){const [_,dd,mm,yy]=m; return new Date(yy.length===2?('20'+yy):yy, mm-1, dd)}
//       return null;
//     };

//     const now = new Date(), DAY=86400000;
//     const weekStart = (date)=>{ const d=new Date(date); const day=(d.getDay()+6)%7; d.setHours(0,0,0,0); return new Date(d.getTime()-day*DAY); };
//     const addDays=(d,n)=>new Date(d.getTime()+n*DAY);

//     function buildWeeks(range){
//       const arr=[]; const n=(range==='qtr'?13:5);
//       const end = weekStart(now);
//       for(let i=n-1;i>=0;i--){ const start=addDays(end, -7*i); arr.push({start, end:addDays(start,7)}); }
//       return arr;
//     }

//     function aggregateForTask(t, range){
//       const tier = MODE_TIER[String((data?.game_mode||'FLOW')).toUpperCase()] || 3;
//       const weekDone = t.weeklyNow[tier] || 0;
//       const week = { count: weekDone, xp: weekDone*(t.xp||0) };

//       if(!LOGS.length){
//         const blank = { count: week.count, xp: week.xp, weeks: [] };
//         return { week, month: blank, qtr: blank };
//       }

//       // filtrar logs por nombre y/o pilar
//       const logs = LOGS.filter(l=>{
//         const lp=get(l,['pillar','pilar','Pilar']); const ln=get(l,['task','tarea','Task','nombre']);
//         const dt=parseD(get(l,['date','fecha','day','Fecha'])); if(!dt) return false;
//         if(lp && PILLAR_MAP[lp] && PILLAR_MAP[lp]!==t.pillar) return false;
//         return !ln ? true : (String(ln).toLowerCase().trim()===t.name.toLowerCase().trim());
//       });

//       function counters(r){
//         const buckets = buildWeeks(r);
//         const w = new Array(buckets.length).fill(0);
//         let count=0, xp=0;
//         for(const l of logs){
//           const dt=parseD(get(l,['date','fecha','day','Fecha'])); if(!dt) continue;
//           const x=Number(get(l,['xp','XP','exp']))||0;
//           for(let i=0;i<buckets.length;i++){
//             const b=buckets[i];
//             if(dt>=b.start && dt<b.end){ w[i]++; count++; xp+=x; break; }
//           }
//         }
//         return (r==='month')
//           ? { count, xp, weeks: w.slice(-5) }
//           : { count, xp, weeks: w };
//       }

//       return { week, month: counters('month'), qtr: counters('qtr') };
//     }

//     return ({ mode, pillar, range, query })=>{
//       const tier = MODE_TIER[String((mode||'FLOW')).toUpperCase()] || 3;
//       const q = (query||'').toLowerCase();
//       const ofPillar = BASE.filter(x=>x.pillar===pillar && (!q || x.name.toLowerCase().includes(q) || x.stat.toLowerCase().includes(q)));

//       const topStreaks = ofPillar
//         .filter(x=>x.streakWeeks>0)
//         .sort((a,b)=>b.streakWeeks-a.streakWeeks)
//         .slice(0,3)
//         .map(x=>({ id:x.id, name:x.name, stat:x.stat, weekDone:(x.weeklyNow[tier]||0), streakWeeks:x.streakWeeks }));

//       const tasks = ofPillar.map(x=>{
//         const metrics = aggregateForTask(x, range);
//         return { id:x.id, name:x.name, stat:x.stat, weekDone:(x.weeklyNow[tier]||0), streakWeeks:x.streakWeeks, metrics };
//       });

//       return Promise.resolve({ topStreaks, tasks });
//     };
//   }

//   const PanelRachas = { mount, adapters:{ fromDashboardV3 } };
//   if (typeof module !== 'undefined' && module.exports) module.exports = PanelRachas;
//   else global.PanelRachas = PanelRachas;

// })(typeof window!=='undefined' ? window : globalThis);
