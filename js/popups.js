// ===== Gamification PopUps (front) =====
const POPUPS_API = 'https://script.google.com/macros/s/AKfycbzKOhJnvv_UW3WkTDSuHRhkq3O3KxLx_A72q8JZYKpcJCmTj3yQ1nuhCBKPoMlDvJ6U/exec';

/* ------------ utils ------------- */
function gjEmail(){
  const q = new URLSearchParams(location.search).get('email');
  return (q || localStorage.getItem('gj_email') || '').toLowerCase();
}
function seenKey(email){ return `gj_popups_seen:${email}`; }
function getSeen(email){
  try{
    const raw = localStorage.getItem(seenKey(email));
    return new Set((raw||'').split(',').map(s=>s.trim()).filter(Boolean));
  }catch{ return new Set(); }
}
function addSeen(email, id){
  try{
    const set = getSeen(email); set.add(id);
    localStorage.setItem(seenKey(email), Array.from(set).join(','));
  }catch{}
}

/** Determina si un item es de racha (para mostrar 🔥 cuando no hay imagen) */
function isStreakItem(it){
  const trg = String(it.trigger||'').toUpperCase();
  if (trg.includes('STREAK')) return true;
  const t  = (it.title||'') + ' ' + (it.body_md||'');
  return /racha|🔥/i.test(t);
}

/** Extrae el bonus numérico del item.
 *  Prioriza campos explícitos; si no existen, parsea del texto "Bono: +18 XP". */
function getBonusFromItem(it){
  const cand = [it.bonus, it.bonus_xp, it.extra && it.extra.bonus, it.param_bonus];
  for (const v of cand){ const n = Number(v); if (isFinite(n) && n>0) return n; }
  const txt = String(it.body_md||'')
                .replace(/\*\*/g,'')  // quita markdown simple
                .replace(/<\/?[^>]+>/g,''); // quita HTML si viene
  // busca "+18 XP" o "18 XP"
  const m = txt.match(/\+?\s*(\d+)\s*XP/i);
  return m ? Number(m[1]) : 0;
}




// ==== WEEK RECAP CSS (global y una sola vez) ====
window.ensureWeekRecapCSS = function(){
  if (document.getElementById('gj-weekrecap-css')) return;
  const css = `
  /* Overlay y card en modo recap: SIN scroll interno */
  #gj-pop-overlay.recap{ z-index:9999; align-items:flex-start; overflow-y:auto; padding:24px 12px; }
  .gj-pop.recap{ max-height:none !important; overflow:visible !important; }

  .gj-pop .wk { margin-top: 8px; }

  /* Pilar como CARD (bordes redondeados + fondo) */
  .wk-pillar{
    opacity:0; transform:translateY(8px);
    transition:opacity .36s ease, transform .36s ease;
    margin-top:12px; padding:12px 12px 10px;
    border-radius:14px; background:rgba(255,255,255,.055);
    outline:1px solid rgba(180,160,255,.10);
    box-shadow:0 6px 20px rgba(0,0,0,.18) inset, 0 2px 10px rgba(0,0,0,.06);
  }
  .wk-pillar.in{ opacity:1; transform:translateY(0); }

  /* Título con icono */
  .wk-title{ display:flex; align-items:center; gap:8px;
    font-size:13px; letter-spacing:.3px; text-transform:uppercase; opacity:.9; margin:0 0 8px; }
  .wk-ico{ width:18px; height:18px; display:inline-grid; place-items:center; }

  /* Lista de tareas */
  .wk-list{ display:flex; flex-direction:column; gap:10px; }
  .wk-card{
    opacity:0; transform:translateY(8px) scale(.98);
    border-radius:12px; padding:10px 12px; background:rgba(255,255,255,.04);
    transition:opacity .32s ease, transform .32s ease;
  }
  .wk-card.in{ opacity:1; transform:translateY(0) scale(1); }
  .wk-row{ display:flex; align-items:center; gap:8px; margin-bottom:6px; }
  .wk-dot{ width:8px; height:8px; border-radius:50%; background:#3ddc84; box-shadow:0 0 8px rgba(61,220,132,.6); flex:0 0 8px; }
  .wk-name{ flex:1; font-weight:600; }
  .wk-count{ font-variant-numeric:tabular-nums; opacity:.95; transform-origin:center; }
  .wk-count.pulse{ animation:wkPulse .42s ease 2; } /* 2 pulsos */
  @keyframes wkPulse{ 0%{transform:scale(.9);opacity:.6} 60%{transform:scale(1.12);opacity:1} 100%{transform:scale(1)} }

  /* Barra más lenta para que se note y sincronice con el pulso */
  .wk-bar{ position:relative; height:8px; border-radius:999px; background:rgba(180,160,255,.18); overflow:hidden; }
  .wk-fill{ position:absolute; inset:0 auto 0 0; width:0%; border-radius:999px;
    background:linear-gradient(90deg,#a78bfa,#8b5cf6);
    transition:width .7s cubic-bezier(.2,.75,.2,1);
  }

  .wk-empty{ opacity:.7; font-size:12px; padding:8px 0; }

  /* Mostrar más */
  .wk-more{ margin-top:8px; font-size:12px; opacity:.9; cursor:pointer; user-select:none; }
  .wk-card.hidden{ display:none; }

  .gj-pop .hero-emoji.calendar{ filter:drop-shadow(0 0 6px rgba(180,160,255,.55)); }

  @media (prefers-reduced-motion: reduce){
    .wk-pillar, .wk-card { transition:none!important; transform:none!important; }
    .wk-count.pulse { animation:none!important; }
    .wk-fill { transition:none!important; width:100%!important; }
  }`;
  const tag = document.createElement('style');
  tag.id = 'gj-weekrecap-css';
  tag.textContent = css;
  document.head.appendChild(tag);
};

// // ==== WEEK RECAP CSS (global y una sola vez) ====
// window.ensureWeekRecapCSS = function(){
//   if (document.getElementById('gj-weekrecap-css')) return;
//   const css = `
//   #gj-pop-overlay{ z-index:9999; }
//   .gj-pop .wk { margin-top: 8px; }
//   .wk-pillar { opacity: 0; transform: translateY(6px); transition: opacity .28s ease, transform .28s ease; margin-top: 8px; }
//   .wk-pillar.in { opacity: 1; transform: translateY(0); }
//   .wk-title { font-size: 13px; letter-spacing:.3px; text-transform:uppercase; opacity:.8; margin: 10px 0 6px; }
//   .wk-list { display:flex; flex-direction:column; gap:8px; }
//   .wk-card { opacity:0; transform: translateY(6px) scale(.98); border-radius:12px; padding:10px 12px; background:rgba(255,255,255,.04); transition: opacity .26s ease, transform .26s ease; }
//   .wk-card.in { opacity:1; transform: translateY(0) scale(1); }
//   .wk-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
//   .wk-dot { width:8px; height:8px; border-radius:50%; background:#3ddc84; box-shadow:0 0 8px rgba(61,220,132,.6); flex:0 0 8px; }
//   .wk-name { flex:1; font-weight:600; }
//   .wk-count { font-variant-numeric: tabular-nums; opacity:.9; transform-origin:center; }
//   .wk-count.pulse { animation: wkPulse .35s ease; }
//   @keyframes wkPulse{ 0%{transform:scale(.9);opacity:.6} 60%{transform:scale(1.1);opacity:1} 100%{transform:scale(1)} }
//   .wk-bar { position:relative; height:8px; border-radius:999px; background:rgba(180,160,255,.18); overflow:hidden; }
//   .wk-fill { position:absolute; left:0; top:0; bottom:0; width:0%; border-radius:999px; background:linear-gradient(90deg,#a78bfa,#8b5cf6); transition: width .35s ease; }
//   .wk-empty { opacity:.7; font-size:12px; padding:8px 0; }
//   .gj-pop .hero-emoji.calendar { filter: drop-shadow(0 0 6px rgba(180,160,255,.55)); }
//   @media (prefers-reduced-motion: reduce){
//     .wk-pillar, .wk-card { transition: none !important; transform: none !important; }
//     .wk-count.pulse { animation: none !important; }
//     .wk-fill { transition: none !important; width: 100% !important; }
//   }`;
//   const tag = document.createElement('style');
//   tag.id = 'gj-weekrecap-css';
//   tag.textContent = css;
//   document.head.appendChild(tag);
// };


/* ------------ red ------------- */
/** Marca vistos + (opcional) suma bonus en Setup!E22 (backend detecta items[]). */
let _ackBusy = false;
let _popupsRefreshing = false;
async function postAckToServer({ email, ids=[], items=[] }){
  if (_ackBusy) return { ok:false, err:'busy' };
  _ackBusy = true;
  try{
    if (!email) throw new Error('email requerido');
    if (!ids.length && !items.length) throw new Error('ids/items vacíos');

    // text/plain evita preflight; el WebApp parsea JSON igual
    const r = await fetch(POPUPS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ email, ids, items })
    });
    const j = await r.json();
    if (!j.ok) throw new Error(j.err || 'ack failed');
    return j;
  } finally { _ackBusy = false; }
}

/* ------------ UI (creado on-demand) ------------- */
function ensureOverlay(){
  let ov = document.getElementById('gj-pop-overlay');
  if (ov) return ov;
  ov = document.createElement('div');
  ov.id = 'gj-pop-overlay';
  ov.setAttribute('role','dialog');
  ov.setAttribute('aria-modal','true');
  document.body.appendChild(ov);
  return ov;
}

function confetti(container){
  const colors = ['#ff7ab6','#ffd66b','#7dd3fc','#a78bfa','#34d399','#fca5a5'];
  const layer = document.createElement('div'); layer.className = 'gj-confetti';
  container.appendChild(layer);
  const n = 40 + Math.floor(Math.random()*20);
  const w = container.clientWidth;
  for(let i=0;i<n;i++){
    const s = document.createElement('div'); s.className = 'gj-piece';
    s.style.left = (Math.random()*w) + 'px';
    s.style.background = colors[i%colors.length];
    s.style.transform = `translateY(-10px) rotate(${Math.random()*180}deg)`;
    s.style.animationDelay = (Math.random()*300) + 'ms';
    layer.appendChild(s);
  }
  setTimeout(()=>layer.remove(), 1500);
}

/** Render y manejo de un popup. Llama onClose({how,item}). */
function renderPopup(item, onClose){
  const ov = ensureOverlay();
  ov.innerHTML = ''; // clean

  // Imagen opcional; si no hay, elegimos emoji según tipo
  const imgSrc = item.hero_url || item.image_url || '';
  const hasImg = !!imgSrc;
  const fallbackEmoji = isStreakItem(item) ? '🔥' : '✨';
  const hero = hasImg
    ? `<img class="hero-img" src="${imgSrc}" alt="" />`
    : `<span class="hero-emoji" aria-hidden="true">${fallbackEmoji}</span>`;

  const card = document.createElement('div');
  card.className = 'gj-pop';
  card.setAttribute('data-popid', item.id || '');
  card.innerHTML = `
    <button class="close" aria-label="Cerrar">✕</button>
    <div class="pop-row">
      <div class="hero">${hero}</div>
      <div class="content">
        <h3 class="title">${item.title || 'Aviso'}</h3>
        <div class="lead">${(item.body_md || '').replace(/\n/g,'<br/>')}</div>
        ${item.cta_text ? `<button class="cta" id="gj-pop-cta">${item.cta_text}</button>` : ''}
        ${item.here_url ? `<a class="sub" href="${item.here_url}" target="_blank" rel="noopener">Más info</a>` : ''}
      </div>
    </div>
  `;
  ov.appendChild(card);
  ov.classList.add('show');

  // Bloquear scroll del fondo
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  // confetti en hitos
  if ((item.tipo||'').toLowerCase()==='hito') confetti(card);

  // fallback si la imagen falla → volver a ✨/🔥
  const img = card.querySelector('.hero-img');
  if (img) {
    img.addEventListener('error', () => {
      const wrap = card.querySelector('.hero');
      if (wrap) wrap.innerHTML = `<span class="hero-emoji" aria-hidden="true">${fallbackEmoji}</span>`;
    }, { once:true });
  }

  const finish = (how)=>{
    ov.classList.remove('show');
    ov.innerHTML = '';
    document.body.style.overflow = prevOverflow || '';
    onClose && onClose({ how: (how||'close'), item });
  };

  // cerrar con ✕
  card.querySelector('.close')?.addEventListener('click', ()=> finish('close'));

  // CTA
  const ctaBtn = card.querySelector('#gj-pop-cta');
  if (ctaBtn){
    ctaBtn.addEventListener('click', ()=>{
      const act = (item.cta_action||'').toLowerCase();
      if (act === 'open_link' && item.cta_link){
        const url = String(item.cta_link);
        if (url.startsWith('#')){
          document.querySelector(url)?.scrollIntoView({ behavior:'smooth', block:'start' });
        } else {
          location.href = url; // MISMA pestaña
        }
      } else if (act === 'open_scheduler'){
        const p = window.GJ_CTX?.scheduler || {};
        window.openSchedulerModal?.({ canal:p.canal, frecuencia:p.frecuencia, dias:p.dias,
          hora:p.hora ?? 8, timezone:p.timezone, estado:p.estado,
          linkPublico: window.GJ_CTX?.linkPublico || '' });
      }
      // cerramos igual
      ov.classList.remove('show'); ov.innerHTML=''; document.body.style.overflow='';
      onClose && onClose({ how:'cta', item });
    });
  }
}



// ==== WEEK RECAP (renderer especializado) ====
function renderWeekRecapPopup(item, onClose){
  window.ensureWeekRecapCSS();

  const ov = ensureOverlay();
  ov.classList.add('recap');   // usa reglas que quitan scroll interno
  ov.innerHTML = '';

  const hero = item.hero_url
    ? `<img class="hero-img" src="${item.hero_url}" alt="" />`
    : `<span class="hero-emoji calendar" aria-hidden="true">📅</span>`;

  const card = document.createElement('div');
  card.className = 'gj-pop recap';
  card.setAttribute('data-popid', item.id || '');
  card.innerHTML = `
    <button class="close" aria-label="Cerrar">✕</button>
    <div class="pop-row">
      <div class="hero">${hero}</div>
      <div class="content wk">
        <h3 class="title">${item.title || 'Resumen semanal'}</h3>
        <div class="lead">${(item.body_md || '').replace(/\n/g,'<br/>')}</div>
        <div class="wk-sections"></div>
        ${item.cta_text ? `<button class="cta" id="gj-pop-cta">${item.cta_text}</button>` : ''}
        ${item.here_url ? `<a class="sub" href="${item.here_url}" target="_blank" rel="noopener">Más info</a>` : ''}
      </div>
    </div>
  `;
  ov.appendChild(card);
  ov.classList.add('show');

  // Confetti primero, y recién después arrancan pilares
  const CONFETTI_MS = 900;
  try { confetti(card); setTimeout(()=>confetti(card), 220); } catch(_){}

  const finish = (how)=>{
    ov.classList.remove('show');
    ov.innerHTML = '';
    onClose && onClose({ how: (how||'close'), item });
  };
  card.querySelector('.close')?.addEventListener('click', ()=> finish('close'));

  const ctaBtn = card.querySelector('#gj-pop-cta');
  if (ctaBtn){
    ctaBtn.addEventListener('click', ()=>{
      const link = item.cta_link || '#';
      if (String(link).startsWith('#')) document.querySelector(link)?.scrollIntoView({ behavior:'smooth', block:'start' });
      else location.href = link;
      finish('cta');
    });
  }

  // ====== Secciones por pilar ======
  const secRoot = card.querySelector('.wk-sections');
  const data = (item.extra && item.extra.pillars) || {};
  const GOAL = Number(item.extra && item.extra.goal) || 3;

  const PILLARS = [
    ['body', 'BODY', '🫀'],
    ['mind', 'MIND', '🧠'],
    ['soul', 'SOUL', '🏵️'],
    ['otros','OTROS','•']
  ];

  // Ritmo: esperamos confetti y luego vamos en cascada
  const START_DELAY    = CONFETTI_MS + 150; // arranca después del confetti
  const PILLAR_STAG    = 360;
  const CARD_STAG      = 360;
  const MAX_PER_PILLAR = 3;

  let pillarIndex = 0;

  PILLARS.forEach(([key, label, emoji])=>{
    const list = Array.isArray(data[key]) ? data[key] : [];
    if (!list.length) return;

    const sec = document.createElement('section');
    sec.className = 'wk-pillar';
    sec.setAttribute('data-pillar', key);
    sec.innerHTML = `
      <div class="wk-title">
        <span class="wk-ico">${emoji}</span>
        <span>${label}</span>
      </div>
      <div class="wk-list"></div>
    `;
    secRoot.appendChild(sec);

    const pillarAppearAt = START_DELAY + PILLAR_STAG*pillarIndex;
    setTimeout(()=> sec.classList.add('in'), pillarAppearAt);

    const listEl = sec.querySelector('.wk-list');

    list.forEach((t, i)=>{
      const cc = document.createElement('div');
      const visible = (i < MAX_PER_PILLAR);
      cc.className = 'wk-card' + (visible ? '' : ' hidden');

      const c = Math.min(Number(t.count)||0, GOAL);
      const countText = `${c}/${GOAL}`;
      cc.innerHTML = `
        <div class="wk-row">
          <span class="wk-dot"></span>
          <span class="wk-name">${t.task}</span>
          <span class="wk-count">${countText}</span>
        </div>
        <div class="wk-bar"><span class="wk-fill"></span></div>
      `;
      listEl.appendChild(cc);

      if (visible){
        const d = pillarAppearAt + CARD_STAG*(i+0.25);
        setTimeout(()=>{
          cc.classList.add('in');
          const fill = cc.querySelector('.wk-fill');
          const cnt  = cc.querySelector('.wk-count');
          requestAnimationFrame(()=>{ fill.style.width = '100%'; });
          setTimeout(()=> cnt.classList.add('pulse'), 720); // doble pulso tras llenar
        }, d);
      }
    });

    if (list.length > MAX_PER_PILLAR){
      const more = document.createElement('div');
      more.className = 'wk-more';
      more.textContent = `Mostrar ${list.length - MAX_PER_PILLAR} más`;
      more.addEventListener('click', ()=>{
        const hidden = listEl.querySelectorAll('.wk-card.hidden');
        hidden.forEach((el, j)=>{
          el.classList.remove('hidden');
          setTimeout(()=> el.classList.add('in'), 30 + j*140);
          const fill = el.querySelector('.wk-fill');
          const cnt  = el.querySelector('.wk-count');
          setTimeout(()=> { fill.style.width = '100%'; }, 50 + j*140);
          setTimeout(()=> { cnt.classList.add('pulse'); }, 260 + j*140);
        });
        more.remove();
      });
      sec.appendChild(more);
    }

    pillarIndex++;
  });

  if (!secRoot.children.length){
    secRoot.innerHTML = `<div class="wk-empty">No hay tareas cumplidas esta semana.</div>`;
  }
}


// // ==== WEEK RECAP (renderer especializado) ====
// function renderWeekRecapPopup(item, onClose){
//   // CSS y overlay en modo "recap" (sin bloquear scroll del body)
//   window.ensureWeekRecapCSS();
//   const ov = ensureOverlay();
//   ov.classList.add('recap');   // estilos especiales para overlay recap
//   ov.innerHTML = '';

//   // Hero (emoji calendario si no hay imagen)
//   const hero = item.hero_url
//     ? `<img class="hero-img" src="${item.hero_url}" alt="" />`
//     : `<span class="hero-emoji calendar" aria-hidden="true">📅</span>`;

//   // Tarjeta base en modo recap (sin max-height/scroll interno)
//   const card = document.createElement('div');
//   card.className = 'gj-pop recap';
//   card.setAttribute('data-popid', item.id || '');
//   card.innerHTML = `
//     <button class="close" aria-label="Cerrar">✕</button>
//     <div class="pop-row">
//       <div class="hero">${hero}</div>
//       <div class="content wk">
//         <h3 class="title">${item.title || 'Resumen semanal'}</h3>
//         <div class="lead">${(item.body_md || '').replace(/\n/g,'<br/>')}</div>
//         <div class="wk-sections"></div>
//         ${item.cta_text ? `<button class="cta" id="gj-pop-cta">${item.cta_text}</button>` : ''}
//         ${item.here_url ? `<a class="sub" href="${item.here_url}" target="_blank" rel="noopener">Más info</a>` : ''}
//       </div>
//     </div>
//   `;
//   ov.appendChild(card);
//   ov.classList.add('show');

//   // Un poco más de confetti al abrir
//   try { confetti(card); setTimeout(()=>confetti(card), 220); } catch(_){}

//   // Cerrar / CTA
//   const finish = (how)=>{
//     ov.classList.remove('show');
//     ov.innerHTML = '';
//     onClose && onClose({ how: (how||'close'), item });
//   };
//   card.querySelector('.close')?.addEventListener('click', ()=> finish('close'));

//   // CTA SIEMPRE MISMA PESTAÑA
//   const ctaBtn = card.querySelector('#gj-pop-cta');
//   if (ctaBtn){
//     ctaBtn.addEventListener('click', ()=>{
//       const link = item.cta_link || '#';
//       if (String(link).startsWith('#')) {
//         document.querySelector(link)?.scrollIntoView({ behavior:'smooth', block:'start' });
//       } else {
//         location.href = link;
//       }
//       finish('cta');
//     });
//   }

//   // === Build sections por pilar ===========================================
//   const secRoot = card.querySelector('.wk-sections');
//   const data = (item.extra && item.extra.pillars) || {};
//   const GOAL = Number(item.extra && item.extra.goal) || 3;

//   // Orden y títulos + emojis pedidos
//   const PILLARS = [
//     ['body', 'BODY', '🫀'],
//     ['mind', 'MIND', '🧠'],
//     ['soul', 'SOUL', '🏵️'],
//     ['otros','OTROS','•']
//   ];

//   // Stagger / ritmo
//   const START_DELAY   = 250;  // ms antes del primer item
//   const PILLAR_STAG   = 320;  // separación entre pilares
//   const CARD_STAG     = 320;  // separación entre tareas dentro del pilar
//   const MAX_PER_PILLAR = 3;   // tope visible por pilar

//   let globalIdx = 0; // para escalonar animaciones suavemente

//   PILLARS.forEach(([key, label, emoji])=>{
//     const list = Array.isArray(data[key]) ? data[key] : [];
//     if (!list.length) return;

//     const sec = document.createElement('section');
//     sec.className = 'wk-pillar';
//     sec.setAttribute('data-pillar', key);
//     sec.innerHTML = `
//       <div class="wk-title">
//         <span class="wk-ico">${emoji}</span>
//         <span>${label}</span>
//       </div>
//       <div class="wk-list"></div>
//     `;
//     secRoot.appendChild(sec);

//     // revelar contenedor del pilar
//     const pillarAppearAt = START_DELAY + PILLAR_STAG*globalIdx;
//     setTimeout(()=> sec.classList.add('in'), pillarAppearAt);

//     const listEl = sec.querySelector('.wk-list');

//     // Render de tareas (máximo 3 visibles)
//     list.forEach((t, i)=>{
//       const cc = document.createElement('div');
//       const visible = (i < MAX_PER_PILLAR);
//       cc.className = 'wk-card' + (visible ? '' : ' hidden');

//       const c = Math.min(Number(t.count)||0, GOAL);
//       const countText = `${c}/${GOAL}`;
//       cc.innerHTML = `
//         <div class="wk-row">
//           <span class="wk-dot"></span>
//           <span class="wk-name">${t.task}</span>
//           <span class="wk-count">${countText}</span>
//         </div>
//         <div class="wk-bar"><span class="wk-fill"></span></div>
//       `;
//       listEl.appendChild(cc);

//       if (visible){
//         const d = pillarAppearAt + CARD_STAG*(i+0.3);
//         setTimeout(()=>{
//           cc.classList.add('in');
//           const fill = cc.querySelector('.wk-fill');
//           const cnt  = cc.querySelector('.wk-count');
//           requestAnimationFrame(()=>{ fill.style.width = '100%'; });
//           setTimeout(()=> cnt.classList.add('pulse'), 300);
//         }, d);
//       }
//     });

//     // “Mostrar X más” si hay más de 3
//     if (list.length > MAX_PER_PILLAR){
//       const more = document.createElement('div');
//       more.className = 'wk-more';
//       more.textContent = `Mostrar ${list.length - MAX_PER_PILLAR} más`;
//       more.addEventListener('click', ()=>{
//         const hidden = listEl.querySelectorAll('.wk-card.hidden');
//         hidden.forEach((el, j)=>{
//           el.classList.remove('hidden');
//           setTimeout(()=> el.classList.add('in'), 30 + j*140);
//           const fill = el.querySelector('.wk-fill');
//           const cnt  = el.querySelector('.wk-count');
//           setTimeout(()=> { fill.style.width = '100%'; }, 50 + j*140);
//           setTimeout(()=> { cnt.classList.add('pulse'); }, 260 + j*140);
//         });
//         more.remove();
//       });
//       sec.appendChild(more);
//     }

//     globalIdx++;
//   });

//   if (!secRoot.children.length){
//     secRoot.innerHTML = `<div class="wk-empty">No hay tareas cumplidas esta semana.</div>`;
//   }
// }

// // ==== WEEK RECAP (renderer especializado) ====
// function renderWeekRecapPopup(item, onClose){
//   window.ensureWeekRecapCSS();                       // <- inyecta CSS (ahora sí existe)
//   console.debug('[WK] renderer ON', item?.extra?.pillars); // <- verificación en consola
//   const ov = ensureOverlay(); ensureWeekRecapCSS();
//   ov.innerHTML = '';

//   const hero = `<span class="hero-emoji calendar" aria-hidden="true">📅</span>`;
//   const card = document.createElement('div');
//   card.className = 'gj-pop';
//   card.setAttribute('data-popid', item.id || '');
//   card.innerHTML = `
//     <button class="close" aria-label="Cerrar">✕</button>
//     <div class="pop-row">
//       <div class="hero">${item.hero_url ? `<img class="hero-img" src="${item.hero_url}" alt="" />` : hero}</div>
//       <div class="content wk">
//         <h3 class="title">${item.title || 'Resumen semanal'}</h3>
//         <div class="lead">${(item.body_md || '').replace(/\n/g,'<br/>')}</div>
//         <div class="wk-sections"></div>
//         ${item.cta_text ? `<button class="cta" id="gj-pop-cta">${item.cta_text}</button>` : ''}
//         ${item.here_url ? `<a class="sub" href="${item.here_url}" target="_blank" rel="noopener">Más info</a>` : ''}
//       </div>
//     </div>
//   `;
//   ov.appendChild(card);
//   ov.classList.add('show');

//   // lock scroll
//   const prevOverflow = document.body.style.overflow;
//   document.body.style.overflow = 'hidden';

//   const finish = (how)=>{
//     ov.classList.remove('show');
//     ov.innerHTML = '';
//     document.body.style.overflow = prevOverflow || '';
//     onClose && onClose({ how: (how||'close'), item });
//   };
//   card.querySelector('.close')?.addEventListener('click', ()=> finish('close'));

//   // CTA SIEMPRE MISMA PESTAÑA
//   const ctaBtn = card.querySelector('#gj-pop-cta');
//   if (ctaBtn){
//     ctaBtn.addEventListener('click', ()=>{
//       const link = item.cta_link || '#';
//       if (link.startsWith('#')) {
//         document.querySelector(link)?.scrollIntoView({ behavior:'smooth', block:'start' });
//       } else {
//         location.href = link;
//       }
//       finish('cta');
//     });
//   }

//   // === build sections por pilar
//   const secRoot = card.querySelector('.wk-sections');
//   const data = (item.extra && item.extra.pillars) || {};
//   const order = ['body','mind','soul','otros'];
//   const labels = { body:'Body', mind:'Mind', soul:'Soul', otros:'Otros' };

//   let pillarDelay = 0;
//   order.forEach(p=>{
//     const list = Array.isArray(data[p]) ? data[p] : [];
//     if (!list.length) return;

//     const sec = document.createElement('section');
//     sec.className = 'wk-pillar';
//     sec.setAttribute('data-pillar', p);
//     sec.innerHTML = `<div class="wk-title">${labels[p]}</div><div class="wk-list"></div>`;
//     secRoot.appendChild(sec);

//     // revelar contenedor del pilar en cascada
//     setTimeout(()=>sec.classList.add('in'), pillarDelay);
//     pillarDelay += 300;

//     // cards dentro del pilar (cascada)
//     const listEl = sec.querySelector('.wk-list');
//     list.forEach((it, idx)=>{
//       const cc = document.createElement('div');
//       cc.className = 'wk-card';
//       const countText = `${it.count}/${it.goal}`;
//       cc.innerHTML = `
//         <div class="wk-row">
//           <span class="wk-dot"></span>
//           <span class="wk-name">${it.task}</span>
//           <span class="wk-count">${countText}</span>
//         </div>
//         <div class="wk-bar"><span class="wk-fill"></span></div>
//       `;
//       listEl.appendChild(cc);

//       const d = pillarDelay + idx*300; // cascada
//       setTimeout(()=>{
//         cc.classList.add('in');
//         const fill = cc.querySelector('.wk-fill');
//         const cnt  = cc.querySelector('.wk-count');
//         requestAnimationFrame(()=>{ fill.style.width = '100%'; });
//         setTimeout(()=> cnt.classList.add('pulse'), 260);
//       }, d);
//     });
//   });

//   if (!secRoot.children.length){
//     secRoot.innerHTML = `<div class="wk-empty">No hay tareas cumplidas esta semana.</div>`;
//   }
// }

// ==== Router seguro: una sola envoltura, sin recursión ====
(function attachWeekRecapRouter(){
  if (window.__GJ_POPUP_ROUTED__) return;
  const ORIG = window.renderPopup.bind(window);
  window.__GJ_POPUP_ROUTED__ = true;

  window.renderPopup = function(item, onClose){
    const t  = String(item?.trigger||'').toUpperCase();
    const id = String(item?.id||'');
    if (t === 'AUTO_WEEK_RECAP' || id.startsWith('HITO_WEEK_RECAP')){
      return renderWeekRecapPopup(item, onClose);
    }
    return ORIG(item, onClose);
  };
})();

// // ==== Router seguro: captura el original una sola vez y evita doble wrap ====
// (function attachWeekRecapRouter(){
//   if (window.__GJ_POPUP_ROUTED__) return;         // evita envolver dos veces
//   const ORIG = window.renderPopup.bind(window);   // captura el genérico ORIGINAL
//   window.__GJ_POPUP_ROUTED__ = true;

//   window.renderPopup = function(item, onClose){
//     try{
//       const t  = String(item?.trigger||'').toUpperCase();
//       const id = String(item?.id||'');
//       if (t === 'AUTO_WEEK_RECAP' || id.startsWith('HITO_WEEK_RECAP')){
//         return renderWeekRecapPopup(item, onClose);   // usa el renderer nuevo
//       }
//     }catch(e){
//       console.warn('router err', e);
//     }
//     return ORIG(item, onClose);                       // cae al original capturado
//   };
// })();


/* ------------ Controller ------------- */
async function runPopups(){
  if (_popupsRefreshing) return;
  _popupsRefreshing = true;

  try {
    const email = gjEmail();
    if (!email) return;

    // 1) pedir items al backend
    let data;
    try{
      const r = await fetch(`${POPUPS_API}?email=${encodeURIComponent(email)}`, { cache: 'no-store' });
      data = await r.json();
    }catch{ return; }

    const serverItems = Array.isArray(data.items) ? data.items : [];
    if (!serverItems.length) return;

    // 2) filtro instantáneo por localStorage
    const seen = getSeen(email);
    const queue = serverItems.filter(it => it && it.id && !seen.has(it.id));
    if (!queue.length) return;

    // 3) mostrar en cola (uno por vez) y acumular ACK con bonus
    await new Promise((resolve) => {
      const finish = () => resolve();
      const next = () => {
        const it = queue.shift();
        if (!it) { finish(); return; }

        try {
          renderPopup(it, async ({how}={})=>{
            addSeen(email, it.id);

            // 1) calcula bonus
            const bonus = getBonusFromItem(it);

            // 2) refresca UI local al toque
            if (bonus > 0) {
              try {
                // número simple
                const el = document.querySelector('[data-xp-current]');
                if (el){
                  const cur = Number(el.getAttribute('data-xp-current')) || 0;
                  const nextVal = cur + bonus;
                  el.setAttribute('data-xp-current', String(nextVal));
                  el.textContent = nextVal.toLocaleString();
                }
                // barra (opcional) data-xp-progress (0..1)
                const bar = document.querySelector('[data-xp-progress]');
                if (bar){
                  const cur = Number(bar.getAttribute('data-xp-progress')) || 0;
                  const step = Number(bar.getAttribute('data-xp-step') || 0) || 100; // si tenés cuánto vale 1 “paso”
                  const nextVal = cur + (bonus/step);
                  bar.setAttribute('data-xp-progress', String(nextVal));
                  bar.style.setProperty('--progress', Math.min(1,nextVal));
                }
              } catch(_){}
            }

            // 3) manda ACK inmediato (marca + suma en E22, idempotente)
            try { await postAckToServer({ email, items: [{ id: it.id, bonus }] }); } catch(_){ }

            if (how === 'abort') { finish(); return; }

            // 4) siguiente popup
            next();
          });
        } catch (err) {
          console.warn('renderPopup err', err);
          finish();
        }
      };

      next();
    });
  } finally {
    _popupsRefreshing = false;
  }
}

function runPopupsSafely(){
  return runPopups();
}

// API mínima para debug desde consola
window.GJPopups = {
  run: runPopupsSafely,
  clearLocal(email = gjEmail()){
    try{ localStorage.removeItem(seenKey(email)); }catch{}
  }
};

// Arranque automático al cargar el dashboard
document.addEventListener('DOMContentLoaded', runPopups);

