// /js/noti-client.js  (no usa API key; solo GET)
// Si querés poder cambiar la URL sin tocar JS, poné un <meta name="gj-worker-base">
(function () {
  const WORKER_BASE =
    document.querySelector('meta[name="gj-worker-base"]')?.content ||
    'https://gamificationnotifications.rfullivarri22.workers.dev';

  const KEY = 'gj_notifications_v1';

  const getList = () => JSON.parse(localStorage.getItem(KEY) || '[]');
  const setList = (l) => localStorage.setItem(KEY, JSON.stringify(l));

  function getEmail() {
    return localStorage.getItem('gj_email') ||
           new URLSearchParams(location.search).get('email') || '';
  }

  function render() {
    const list = getList();
    const unread = list.filter(x => !x.read).length;

    const badge = document.getElementById('gj-noti-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-flex' : 'none';
    }

    const ul = document.getElementById('gj-noti-list');
    if (!ul) return;
    ul.innerHTML = list.map(x => `
      <li class="${x.read ? '' : 'unread'}" style="padding:10px 12px;border-bottom:1px solid #23232b;${x.read?'':'background:#191926;'}">
        <div style="font-weight:600;margin-bottom:2px;">${x.title}</div>
        <div style="font-size:12px;opacity:.8;">${new Date(x.ts).toLocaleString()} — ${x.type}</div>
      </li>
    `).join('') || `<li style="padding:12px;opacity:.7;">Sin notificaciones</li>`;
  }

  async function sync() {
    const email = getEmail();
    if (!email) return;
    const url = `${WORKER_BASE}/api/events?email=${encodeURIComponent(email)}&limit=50`;
    const res = await fetch(url);
    const list = await res.json();
    setList(list.sort((a,b)=>b.ts-a.ts));
    render();
  }

  // Por ahora "marcar leído" solo local (no metas API_KEY en el front).
  function markAllReadLocal() {
    const list = getList().map(x => ({ ...x, read: true }));
    setList(list);
    render();
  }

  function wireUI() {
    const btn = document.getElementById('gj-noti-btn');
    const dd  = document.getElementById('gj-noti-dropdown');
    btn?.addEventListener('click', () => {
      dd.style.display = (dd.style.display === 'block') ? 'none' : 'block';
    });
    document.getElementById('gj-noti-markall')?.addEventListener('click', markAllReadLocal);
    document.addEventListener('click', (e) => {
      if (e.target === dd || e.target === btn || dd.contains(e.target)) return;
      dd.style.display = 'none';
    });
  }

  // API pública mínima
  window.Noti = {
    init({ autoSync = true } = {}) { render(); wireUI(); if (autoSync) sync(); },
    sync,
    render
  };
})();
