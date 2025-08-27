// /static/js/scheduler-modal.js
const tpl = document.createElement('template');
tpl.innerHTML = /*html*/`
<style>
:host{all:initial; font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
:host{
  --bg:#0b0f19; --card:#121829; --stroke:rgba(255,255,255,.12);
  --text:#e8ecf1; --muted:#c7cedd; --brand:#7d3cff; --chip:#1a2236; --ok:#18c37d;
}
.backdrop{position:fixed; inset:0; background:rgba(7,10,18,.65); backdrop-filter:blur(6px); display:none; z-index:9990}
.modal{
  position:fixed; inset:64px 16px 16px; margin:0 auto; max-width: min(920px, 100%);
  display:none; z-index:9991; background:var(--card); color:var(--text);
  border:1px solid var(--stroke); border-radius:14px;
  padding: clamp(16px, 2.6vw, 22px); box-shadow:0 20px 60px rgba(0,0,0,.35)
}
.h{display:flex; align-items:center; gap:12px; margin:0 0 6px}
.h h2{all:unset; font-weight:800; font-size:clamp(18px,2.2vw,22px)}
.sub{color:var(--muted); margin:0 0 clamp(8px,1.6vw,12px); font-size:clamp(12px,1.6vw,14px)}
.x{all:unset; margin-left:auto; color:var(--muted); font-size:20px; cursor:pointer}

.grid{display:grid; gap:clamp(10px,1.8vw,16px)}
@media (min-width:720px){
  .grid-3{grid-template-columns: 1fr 1fr 1fr}
  .grid-2{grid-template-columns: 1.3fr .7fr}
}
.card{
  background:linear-gradient(0deg,rgba(255,255,255,.02),rgba(255,255,255,.02)),var(--card);
  border:1px solid var(--stroke); border-radius:12px; padding:clamp(12px,2vw,16px)
}
.card h3{all:unset; display:block; font-size:clamp(13px,1.8vw,14px); margin:0 0 8px}

.chips{display:flex; flex-wrap:wrap; gap:10px}
.chip{all:unset; background:#1a2236; color:var(--text); border:1px solid var(--stroke);
  padding:8px 12px; border-radius:999px; font-size:13px; cursor:pointer}
.chip[aria-pressed="true"]{background:var(--brand); color:#fff; border-color:transparent; font-weight:700}
.chip[disabled]{opacity:.45; cursor:not-allowed}

.inline{display:flex; align-items:center; gap:12px}
.input{all:unset; background:#0f1424; border:1px solid var(--stroke); color:#fff;
  border-radius:10px; padding:10px 12px; font-size:14px; min-width:90px}
.hint{color:var(--muted); font-size:12px}

.days{display:none; margin-top:8px}
.days.show{display:flex}

.info{display:flex; align-items:center; gap:8px}
.badge{background:#0f1424; border:1px solid var(--stroke); border-radius:999px; padding:6px 10px; font-size:12px}
.i{display:inline-block; width:18px; height:18px; line-height:18px; text-align:center;
   border-radius:50%; background:#1a2236; color:#b8c0d4; font-weight:800; font-size:12px}
.i[title]{cursor:help}

.footer{
  display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-top:14px
}
.actions{display:flex; gap:10px; flex-wrap:wrap}
.btn{all:unset; border-radius:10px; padding:12px 16px; font-weight:800; cursor:pointer}
.primary{background:var(--brand); color:#fff}
.ghost{border:1px solid var(--stroke)}
.ok{background:var(--ok); color:#0b0f19}

.summary{margin-top:6px; color:var(--muted); font-size:12px}

.toast{position:fixed; right:20px; bottom:20px; background:#151c2d; color:#fff;
  border:1px solid var(--stroke); border-radius:10px; padding:10px 14px; display:none}
</style>

<div class="backdrop"></div>
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="t">
  <div class="h">
    <h2 id="t">Programar DailyQuest</h2>
    <button class="x" aria-label="Cerrar">✕</button>
  </div>
  <p class="sub">Configurá tu recordatorio diario. Enviaremos el link del Daily Form en el canal elegido, a la hora configurada.</p>

  <!-- Canal -->
  <div class="card">
    <h3>Canal</h3>
    <div class="chips" id="canal">
      <button class="chip" data-val="email" aria-pressed="true">Email</button>
      <button class="chip" data-val="telegram" disabled>Telegram (pronto)</button>
      <button class="chip" data-val="pwa" disabled>Notificación PWA (pronto)</button>
    </div>
  </div>

  <!-- Frecuencia + Hora -->
  <div class="grid grid-3">
    <div class="card">
      <h3>Frecuencia</h3>
      <div class="chips" id="freq">
        <button class="chip" data-val="DAILY" aria-pressed="true">Todos los días</button>
        <button class="chip" data-val="CUSTOM">Seleccionar días</button>
      </div>
      <div id="days" class="chips days" aria-hidden="true">
        <button class="chip" data-day="L">L</button><button class="chip" data-day="M">M</button>
        <button class="chip" data-day="X">X</button><button class="chip" data-day="J">J</button>
        <button class="chip" data-day="V">V</button><button class="chip" data-day="S">S</button>
        <button class="chip" data-day="D">D</button>
      </div>
    </div>

    <div class="card">
      <h3>Hora</h3>
      <div class="inline">
        <input id="hour" class="input" type="number" min="0" max="23" step="1" placeholder="8" />
        <span class="hint">0–23 (ej: 8, 13, 21)</span>
      </div>
    </div>

    <div class="card">
      <h3>Estado</h3>
      <div class="chips" id="state">
        <button class="chip" data-val="ACTIVO" aria-pressed="true">ACTIVO</button>
        <button class="chip" data-val="PAUSADO">PAUSADO</button>
      </div>
    </div>
  </div>

  <!-- Zona (info) -->
  <div class="card">
    <h3>Zona (info)</h3>
    <div class="info">
      <span class="badge">Europe/Madrid</span>
      <span class="i" title="El trigger usa el huso del proyecto. Por ahora no se puede cambiar.">i</span>
      <span class="hint">Informativo / consistencia.</span>
    </div>
  </div>

  <!-- hidden -->
  <input type="hidden" id="email" />
  <input type="hidden" id="sheetId" />
  <input type="hidden" id="link" />

  <div class="footer">
    <button class="btn primary" id="save">💾 Guardar programación</button>
    <div class="actions">
      <button class="btn ghost"  id="toggle">⏸️ Pausar</button>
      <button class="btn ghost"  id="test">🧪 Probar envío</button>
    </div>
  </div>

  <div class="summary" id="summary"></div>
</div>
<div class="toast" id="toast"></div>
`;

export class SchedulerModal extends HTMLElement {
  constructor(){ super(); this.attachShadow({mode:'open'}).appendChild(tpl.content.cloneNode(true)); }
  connectedCallback(){
    const $ = s => this.shadowRoot.querySelector(s);
    const $$= s => Array.from(this.shadowRoot.querySelectorAll(s));

    this.$ = {
      back:$('.backdrop'), modal:$('.modal'), toast:$('#toast'),
      hour:$('#hour'), days:$('#days'), summary:$('#summary'),
      email:$('#email'), sheetId:$('#sheetId'), link:$('#link'),
      toggle:$('#toggle')
    };

    // chips helpers
    const setGroup=(wrap,val)=> $$(wrap+' .chip').forEach(c=>c.setAttribute('aria-pressed', String(c.dataset.val===val)));
    const getGroup=(wrap)=> (this.shadowRoot.querySelector(wrap+' .chip[aria-pressed="true"]')?.dataset.val)||null;
    const toggleDay = (btn)=> btn.setAttribute('aria-pressed', String(!(btn.getAttribute('aria-pressed')==='true')));

    // listeners
    this.shadowRoot.getElementById('canal').addEventListener('click', e=>{
      const b=e.target.closest('.chip'); if(!b||b.disabled) return;
      setGroup('#canal', b.dataset.val); this._updateSummary();
    });

    this.shadowRoot.getElementById('freq').addEventListener('click', e=>{
      const b=e.target.closest('.chip'); if(!b) return;
      setGroup('#freq', b.dataset.val);
      const isCustom=b.dataset.val==='CUSTOM';
      this.$.days.classList.toggle('show',isCustom);
      this.$.days.setAttribute('aria-hidden', String(!isCustom));
      this._updateSummary();
    });
    this.$.days.addEventListener('click', e=>{
      const b=e.target.closest('.chip'); if(!b) return; toggleDay(b); this._updateSummary();
    });

    this.shadowRoot.getElementById('state').addEventListener('click', e=>{
      const b=e.target.closest('.chip'); if(!b) return;
      setGroup('#state', b.dataset.val);
      this._syncToggleLabel(); this._updateSummary();
    });

    this.$.hour.addEventListener('input', ()=>this._updateSummary());
    this.shadowRoot.querySelector('.x').onclick=()=>this.close();
    this.$.back.onclick=()=>this.close();

    // acciones
    this.shadowRoot.getElementById('save').onclick = ()=> this._emit('schedule:save', this._collect());
    this.$.toggle.onclick = ()=>{
      const state = getGroup('#state');
      if (state==='ACTIVO') this._emit('schedule:pause', this._collect());
      else this._emit('schedule:resume', this._collect());
    };
    this.shadowRoot.getElementById('test').onclick = ()=> this._emit('schedule:test', this._collect());
  }

  _emit(name, detail){
    this.dispatchEvent(new CustomEvent(name,{bubbles:true,detail}));
    this.toast('Listo: ' + name.replace('schedule:',''));
  }
  toast(msg,ms=1600){ const t=this.$.toast; t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',ms); }

  _collect(){
    const g = id => (this.shadowRoot.querySelector(id+' .chip[aria-pressed="true"]')?.dataset.val);
    const h = Number(this.$.hour.value);
    if (!Number.isInteger(h)||h<0||h>23) { this.toast('Indicá una hora 0–23'); throw new Error('hora inválida'); }
    let dias=''; if (g('#freq')==='CUSTOM'){
      const arr = Array.from(this.$.days.querySelectorAll('.chip[aria-pressed="true"]')).map(b=>b.dataset.day);
      if(!arr.length){ this.toast('Elegí al menos un día'); throw new Error('sin días'); }
      dias = arr.join(',');
    }
    return {
      email: this.$.email.value.trim(),
      userSheetId: this.$.sheetId.value.trim(),
      linkPublico: this.$.link.value.trim(),
      canal: g('#canal') || 'email',
      frecuencia: g('#freq') || 'DAILY',
      dias,
      hora: String(h),
      timezone: 'Europe/Madrid',
      estado: g('#state') || 'ACTIVO'
    };
  }

  _syncToggleLabel(){
    const state = (this.shadowRoot.querySelector('#state .chip[aria-pressed="true"]')?.dataset.val)||'ACTIVO';
    this.$.toggle.textContent = (state==='ACTIVO') ? '⏸️ Pausar' : '▶️ Reanudar';
  }

  _updateSummary(){
    try{
      const d = this._collect();
      const dias = (d.frecuencia==='DAILY') ? 'todos los días' : d.dias;
      this.$.summary.textContent = `Estado: ${d.estado}. Se enviará ${dias} a las ${d.hora}. Canal: ${d.canal}.`;
    }catch(_){ /* hora inválida o sin días → no actualizar */ }
  }

  open(prefill={}){
    const setGroup=(wrap,val)=> this.shadowRoot.querySelectorAll(wrap+' .chip')
      .forEach(c=>c.setAttribute('aria-pressed', String(c.dataset.val===val)));

    setGroup('#canal', prefill.canal || 'email');
    setGroup('#freq',  prefill.frecuencia || 'DAILY');
    setGroup('#state', prefill.estado || 'ACTIVO');

    this.$.hour.value = prefill.hora ?? '';
    const isCustom = (prefill.frecuencia==='CUSTOM');
    this.$.days.classList.toggle('show',isCustom);
    this.$.days.setAttribute('aria-hidden', String(!isCustom));
    this.$.days.querySelectorAll('.chip').forEach(b=>b.setAttribute('aria-pressed','false'));
    (prefill.dias||'').split(',').map(s=>s.trim()).filter(Boolean)
      .forEach(d => this.$.days.querySelector(`.chip[data-day="${d}"]`)?.setAttribute('aria-pressed','true'));

    this.$.email.value   = prefill.email || '';
    this.$.sheetId.value = prefill.userSheetId || '';
    this.$.link.value    = prefill.linkPublico || '';

    this._syncToggleLabel();
    this._updateSummary();

    this.$.back.style.display='block';
    this.$.modal.style.display='block';
  }

  close(){ this.$.back.style.display='none'; this.$.modal.style.display='none'; }
}
customElements.define('scheduler-modal', SchedulerModal);
