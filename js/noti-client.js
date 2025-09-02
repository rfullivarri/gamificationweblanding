// /js/noti-client.js  (solo GET, sin API key)
(function () {
  const WORKER_BASE =
    document.querySelector('meta[name="gj-worker-base"]')?.content ||
    'https://gamificationnotifications.rfullivarri22.workers.dev';

  const KEY = 'gj_notifications_v1';
  const LAST_SEEN_KEY = 'gj_notifications_last_seen_ts';

  const getList = () => JSON.parse(localStorage.getItem(KEY) || '[]');
  const setList = (l) => localStorage.setItem(KEY, JSON.stringify(l));
  const getLastSeen = () => Number(localStorage.getItem(LAST_SEEN_KEY) || 0);
  const setLastSeen = (ts) => localStorage.setItem(LAST_SEEN_KEY, String(ts));

  function getEmail() {
    return localStorage.getItem('gj_email') ||
           new URLSearchParams(location.search).get('email') || '';
  }

  function render() {
    const list = getList();
    const lastSeen = getLastSeen();
    const unread = list.filter(x => x.ts > lastSeen).length;

    const badge = document.getElementById('gj-noti-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-flex' : 'none';
    }

    const ul = document.getElementById('gj-noti-list');
    if (!ul) return;
    ul.innerHTML = list.map(x => `
      <li style="padding:10px 12px;border-bottom:1px solid #23232b;${x.ts>lastSeen?'background:#191926;':''}">
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

  function wireUI() {
    const btn = document.getElementById('gj-noti-btn');
    const dd  = document.getElementById('gj-noti-dropdown');

    btn?.addEventListener('click', () => {
      const open = dd.style.display === 'block';
      dd.style.display = open ? 'none' : 'block';
      if (!open) {
        // al abrir, se marcan como “vistos”
        const list = getList();
        const newest = list.length ? Math.max(...list.map(x=>x.ts||0)) : Date.now();
        setLastSeen(newest);
        render();
      }
    });

    document.getElementById('gj-noti-markall')?.addEventListener('click', () => {
      const list = getList();
      const newest = list.length ? Math.max(...list.map(x=>x.ts||0)) : Date.now();
      setLastSeen(newest);
      render();
    });

    document.addEventListener('click', (e) => {
      if (e.target === dd || e.target === btn || dd.contains(e.target)) return;
      dd.style.display = 'none';
    });
  }

  window.Noti = {
    init({ autoSync = true } = {}) { render(); wireUI(); if (autoSync) sync(); },
    sync, render
  };
})();
