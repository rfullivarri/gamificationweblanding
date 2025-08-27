// js/scheduler-modal.js

const tpl = document.createElement('template');
tpl.innerHTML = `
<style>
:host {
  position: fixed; inset: 0; display: none; z-index: 9999;
}
.backdrop {
  position: absolute; inset: 0;
  background: rgba(10,14,20,.55);
  backdrop-filter: blur(6px);
}
.dialog {
  position: relative;
  max-width: 680px; width: calc(100% - 24px);
  margin: 6vh auto; background: #121829; color: #e8ecf1;
  border: 1px solid rgba(255,255,255,.12); border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0,0,0,.4);
  overflow: hidden;
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.08);
}
.title { font-weight: 700; letter-spacing:.2px; }
.close { background: transparent; border: 0; color: #c7cedd; font-size: 20px; cursor: pointer; }
.body { padding: 16px; }

.row { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 14px; }
@media (min-width: 640px) {
  .row.cols-2 { grid-template-columns: 1fr 1fr; }
  .row.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
}

.label { font-size: 12px; opacity: .85; margin-bottom: 6px; }
.btn-group { display: flex; flex-wrap: wrap; gap: 8px; }

.btn {
  border: 1px solid #3f3b6b; background: #181f31; color:#c7cedd;
  padding: 10px 12px; border-radius: 10px; cursor: pointer; font-weight: 700;
}
.btn[data-active="true"] { background: #7d3cff; color: #fff; border-color: #7d3cff; }

.select, .time-input {
  width: 100%; background: #0f1523; color:#e8ecf1; border:1px solid #2b3350;
  padding: 10px 12px; border-radius: 10px; outline: none;
}

.note { font-size: 12px; opacity: .8; margin-top: 6px; }
.hr { height:1px; background: rgba(255,255,255,.08); margin: 14px 0; }

.footer { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; justify-content: space-between; padding: 12px 16px; border-top:1px solid rgba(255,255,255,.08); }
.actions { display:flex; gap:10px; flex-wrap:wrap; }
.primary { background:#7d3cff; border-color:#7d3cff; color:#fff; }
.warn { border-color:#8b6cf7; }
.muted { font-size: 12px; opacity: .8; }
.info { font-size: 12px; opacity: .7; }

.small { font-size: 12px; opacity:.85; display:flex; align-items:center; gap:6px; }
.small .chip { background:#1a2133; border:1px solid #2b3350; border-radius:8px; padding:6px 8px; }

.hidden { display:none; }
</style>

<div class="backdrop"></div>
<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="sched-title">
  <div class="header">
    <div class="title" id="sched-title">🗓️ Programar Daily Quest</div>
    <button class="close" aria-label="Cerrar">✕</button>
  </div>

  <div class="body">
    <!-- Canal -->
    <div class="row">
      <div>
        <div class="label">Canal</div>
        <div class="btn-group" id="canal-group">
          <button class="btn" data-val="email" data-active="true">✉️ Email</button>
          <button class="btn warn" data-val="telegram" disabled>Telegram (coming soon)</button>
          <button class="btn warn" data-val="pwa" disabled>Notificación PWA (coming soon)</button>
        </div>
      </div>
    </div>

    <!-- Frecuencia + días -->
    <div class="row cols-2">
      <div>
        <div class="label">Frecuencia</div>
        <div class="btn-group" id="freq-group">
          <button class="btn" data-val="DAILY" data-active="true">Todos los días</button>
          <button class="btn" data-val="CUSTOM">Personalizada</button>
        </div>
      </div>
      <div id="days-col" class="hidden">
        <div class="label">Días</div>
        <div class="btn-group" id="days-group">
          <button class="btn" data-day="L">L</button>
          <button class="btn" data-day="M">M</button>
          <button class="btn" data-day="X">X</button>
          <button class="btn" data-day="J">J</button>
          <button class="btn" data-day="V">V</button>
          <button class="btn" data-day="S">S</button>
          <button class="btn" data-day="D">D</button>
        </div>
        <div class="note">Elegí uno o más días.</div>
      </div>
    </div>

    <!-- Hora (solo la hora, sin minutos) -->
    <div class="row cols-3">
      <div>
        <div class="label">Hora (24h)</div>
        <select id="hour" class="select">
          ${Array.from({length:24}).map((_,h)=>`<option value="${h}">${String(h).padStart(2,'0')}:00</option>`).join('')}
        </select>
      </div>
      <div>
        <div class="label">Estado</div>
        <div class="btn-group" id="estado-group">
          <button class="btn" data-val="ACTIVO" data-active="true">Activo</button>
          <button class="btn" data-val="PAUSADO">Pausado</button>
        </div>
      </div>
      <div>
        <div class="label small">Zona horaria <span class="chip">Europe/Madrid</span></div>
        <div class="info">Por ahora no editable.</div>
      </div>
    </div>

    <div class="hr"></div>
    <div class="note" id="notice">Configurá y guardá tu programación.</div>
  </div>

  <div class="footer">
    <div class="actions">
      <button class="btn" id="pause">Pausar</button>
      <button class="btn" id="resume">Reanudar</button>
      <button class="btn" id="test">Enviar prueba</button>
      <button class="btn primary" id="save">Guardar programación</button>
    </div>
    <div class="muted">Estado actual: <span id="estado-text">ACTIVO</span></div>
  </div>
</div>;


class SchedulerModal extends HTMLElement {
  constructor(){
    super();
    this.attachShadow({mode:'open'}).appendChild(tpl.content.cloneNode(true));
    this._v = {
      canal: 'email',
      frecuencia: 'DAILY',
      dias: '',
      hora: 8,
      timezone: 'Europe/Madrid',
      estado: 'ACTIVO',
      linkPublico: ''
    };
    // refs
    this.$back = this.shadowRoot.querySelector('.backdrop');
    this.$dlg  = this.shadowRoot.querySelector('.dialog');
    this.$close= this.shadowRoot.querySelector('.close');
    this.$notice = this.shadowRoot.querySelector('#notice');
    this.$estadoText = this.shadowRoot.querySelector('#estado-text');

    // groups
    this.bindToggleGroup('#canal-group','canal');
    this.bindToggleGroup('#freq-group','frecuencia', (val)=>{
      this.shadowRoot.querySelector('#days-col').classList.toggle('hidden', val!=='CUSTOM');
    });
    this.bindMultiDay('#days-group');
    this.shadowRoot.querySelector('#hour').addEventListener('change',(e)=>{
      this._v.hora = parseInt(e.target.value,10);
    });
    this.bindToggleGroup('#estado-group','estado', (val)=>{ this.$estadoText.textContent = val; });

    // actions
    this.$close.addEventListener('click', ()=>this.close());
    this.$back .addEventListener('click', ()=>this.close());
    this.shadowRoot.querySelector('#save').addEventListener('click', ()=>{
      this.dispatchEvent(new CustomEvent('schedule:save',{detail:this.value(), bubbles:true}));
    });
    this.shadowRoot.querySelector('#pause').addEventListener('click', ()=>{
      this.dispatchEvent(new CustomEvent('schedule:pause',{bubbles:true}));
    });
    this.shadowRoot.querySelector('#resume').addEventListener('click', ()=>{
      this.dispatchEvent(new CustomEvent('schedule:resume',{bubbles:true}));
    });
    this.shadowRoot.querySelector('#test').addEventListener('click', ()=>{
      this.dispatchEvent(new CustomEvent('schedule:test',{bubbles:true}));
    });
  }

  bindToggleGroup(sel, key, onChange){
    const g = this.shadowRoot.querySelector(sel);
    g.addEventListener('click', (e)=>{
      const b = e.target.closest('.btn'); if(!b || b.disabled) return;
      [...g.querySelectorAll('.btn')].forEach(x=>x.dataset.active='false');
      b.dataset.active='true';
      this._v[key] = b.dataset.val;
      if (onChange) onChange(this._v[key]);
    });
  }
  bindMultiDay(sel){
    const g = this.shadowRoot.querySelector(sel);
    g.addEventListener('click',(e)=>{
      const b = e.target.closest('.btn'); if(!b) return;
      b.dataset.active = (b.dataset.active === 'true') ? 'false' : 'true';
      const selected = [...g.querySelectorAll('.btn[data-active="true"]')].map(x=>x.dataset.day);
      this._v.dias = selected.join(',');
    });
  }

  // API pública
  open(){ this.style.display='block'; this.dispatchEvent(new CustomEvent('open',{bubbles:true})); }
  close(){ this.style.display='none'; }
  setNotice(text){ this.$notice.textContent = text; }
  setValue(v){
    // merge + pintar
    this._v = {...this._v, ...(v||{})};
    // canal
    this.setActive('#canal-group','[data-val]',this._v.canal);
    // freq
    this.setActive('#freq-group','[data-val]',this._v.frecuencia);
    this.shadowRoot.querySelector('#days-col').classList.toggle('hidden', this._v.frecuencia!=='CUSTOM');
    // días
    [...this.shadowRoot.querySelectorAll('#days-group .btn')].forEach(b=>{
      b.dataset.active = this._v.dias.split(',').includes(b.dataset.day) ? 'true' : 'false';
    });
    // hora
    const hr = this.shadowRoot.querySelector('#hour');
    if (String(hr.value)!==String(this._v.hora)) hr.value = String(this._v.hora);
    // estado
    this.setActive('#estado-group','[data-val]',this._v.estado);
    this.$estadoText.textContent = this._v.estado;
  }
  setActive(groupSel, itemSel, val){
    const g = this.shadowRoot.querySelector(groupSel);
    [...g.querySelectorAll(itemSel)].forEach(b=> b.dataset.active = (b.dataset.val===String(val))?'true':'false');
  }
  value(){ return {...this._v}; }
}

if (!customElements.get('scheduler-modal')) {
  customElements.define('scheduler-modal', SchedulerModal);
}



