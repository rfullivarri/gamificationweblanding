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
async function postSeenToServer(email, ids){
  // text/plain → evita preflight; el WebApp parsea JSON igual
  try{
    await fetch(POPUPS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ email, ids })
    });
  }catch{}
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

function renderPopup(item, onClose){
  const ov = ensureOverlay();
  ov.innerHTML = ''; // clean

  // Soporta imagen opcional desde POPUPS: hero_url o image_url
  const hasImg = !!(item.hero_url || item.image_url);
  const hero = hasImg
    ? `<img class="hero-img" src="${item.hero_url || item.image_url}" alt="" />`
    : `<span class="hero-emoji" aria-hidden="true">✨</span>`;

  const card = document.createElement('div');
  card.className = 'gj-pop';
  card.setAttribute('data-popid', item.id || '');
  card.innerHTML = `
    <button class="close" aria-label="Cerrar">✕</button>
    <div class="pop-row" style="display:flex;align-items:flex-start;gap:12px;">
      <div class="hero">${hero}</div>
      <div class="content" style="flex:1 1 auto;">
        <h3 class="title">${item.title || 'Aviso'}</h3>
        <div class="lead">${(item.body_md || '').replace(/\n/g,'<br/>')}</div>
        ${item.cta_text ? `<button class="cta" id="gj-pop-cta">${item.cta_text}</button>` : ''}
        ${item.here_url ? `<a class="sub" href="${item.here_url}" target="_blank" rel="noopener">Más info</a>` : ''}
      </div>
    </div>
  `;
  ov.appendChild(card);
  ov.classList.add('show');

  // confetti en hitos
  if ((item.tipo||'').toLowerCase()==='hito') confetti(card);

  const finish = (how)=>{
    ov.classList.remove('show');
    ov.innerHTML = '';
    onClose?.(how || 'close');
  };

  // cerrar con ✕
  card.querySelector('.close')?.addEventListener('click', ()=> finish('close'));

  // CTA
  const ctaBtn = card.querySelector('#gj-pop-cta');
  if (ctaBtn){
    ctaBtn.addEventListener('click', ()=>{
      const act = (item.cta_action||'').toLowerCase();
      if (act === 'open_link' && item.cta_link){
        window.open(item.cta_link, '_blank', 'noopener');
      } else if (act === 'open_scheduler'){
        const p = window.GJ_CTX?.scheduler || {};
        window.openSchedulerModal?.({
          canal: p.canal, frecuencia: p.frecuencia, dias: p.dias,
          hora: p.hora ?? 8, timezone: p.timezone, estado: p.estado,
          linkPublico: window.GJ_CTX?.linkPublico || ''
        });
      }
      finish('cta');
    });
  }
}

/* ------------ Controller ------------- */
async function runPopups(){
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

  // 3) mostrar en cola (uno por vez)
  const seenIds = [];
  const next = ()=>{
    const it = queue.shift();
    if (!it) {
      if (seenIds.length) postSeenToServer(email, seenIds); // sync en background
      return;
    }
    renderPopup(it, ()=>{
      // marcar visto instantáneo al cerrar o CTA
      addSeen(email, it.id);
      seenIds.push(it.id);
      next();
    });
  };
  next();
}

// API mínima para debug desde consola
window.GJPopups = {
  run: runPopups,
  clearLocal(email = gjEmail()){
    try{ localStorage.removeItem(seenKey(email)); }catch{}
  }
};

// Arranque automático al cargar el dashboard
document.addEventListener('DOMContentLoaded', runPopups);
