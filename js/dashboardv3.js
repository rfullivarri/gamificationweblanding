document.addEventListener("DOMContentLoaded", async () => {
  // Spinner
  const overlay = document.getElementById("spinner-overlay");
  const showSpinner = () => overlay && (overlay.style.display = "flex");
  const hideSpinner = () => overlay && (overlay.style.display = "none");

  showSpinner(); // que se vea antes de cualquier fetch

  try {
    // 1) email
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (!email) { 
      alert("No se proporcionó un correo electrónico."); 
      return; 
    }

    // 2) fetch datos
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbzbigb7y9Hcwbo1O8A8mnLRM5zFt0JaOApAJnVyh7HZbl0XmeSdGWgj1pJ3twDwctK9Qw/exec?email=${encodeURIComponent(email)}`
    );
    const data = await response.json();

    // 3) ENLACES
    //    a) Base que viene del WebApp (aceptamos dos nombres de campo)
    const editorBase = data.bbdd_editor_url || data["bbdd editor url"] || "";
    const editorURL  = editorBase ? new URL(editorBase) : null;
    if (editorURL) editorURL.searchParams.set("email", email); // << agregamos ?email=

    //    b) Setear el botón clásico por id (como ya tenías)
    const editBbdd = document.getElementById("edit-bbdd");
    if (editBbdd) editBbdd.href = editorURL ? editorURL.toString() : "#";

    //    c) Y además TODOS los links marcados con data-link="editar-base"
    document.querySelectorAll('[data-link="editar-base"]').forEach(a => {
      const finalURL = editorURL ? editorURL.toString() : "#";
      a.setAttribute("href", finalURL);
      // Forzamos navegación en la misma pestaña (a prueba de handlers/caches)
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        window.location.href = finalURL;
      });
    });

    //    d) Resto de enlaces como ya tenías
    const dailyQuest = document.getElementById("daily-quest");
    const editFormEl = document.getElementById("edit-form");
    if (dailyQuest) dailyQuest.href = data.daily_form_url      || "#";
    if (editFormEl) editFormEl.href = data.daily_form_edit_url || "#";

    // 4) WARNING
    if (data.estado !== "PROCESADO ✅") {
      const warningContainer = document.getElementById("journey-warning");
      if (warningContainer) warningContainer.style.display = "block";
    }

    // 4.1) CONFIRMAR BBDD
    if (data.confirmacionbbdd !== "SI") {
      const bbddWarning = document.getElementById("bbdd-warning");
      if (bbddWarning) bbddWarning.style.display = "block";
    }

    // BLOQUE DE TAREAS Y CONSTANCIA DOPAMINE STYLE
    // ===== Pillar Card (engine) – NO TOCAR TUS COSAS =====
    const PCARD = (() => {
      const MODE_THRESH = { LOW:[1,2], CHILL:[2,3], FLOW:[2,3], EVOL:[3,4] };
      const PILLAR_MAP = { 'Cuerpo':'Body','Mente':'Mind','Alma':'Soul','Body':'Body','Mind':'Mind','Soul':'Soul' };
    
      function pcEsc(s=''){return s.toString().replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
      function pcEl(tag, cls, html){const n=document.createElement(tag); if(cls)n.className=cls; if(html!=null)n.innerHTML=html; return n;}
    
      function normalizeRow(r){
        return {
          pillar: PILLAR_MAP[(r.pilar||'').trim()] || 'Body',
          rasgo: r.rasgo || '',
          stat:  r.stat  || '',
          task:  r.task  || '',
          xp:    Number(r.exp || 0),
          streak:Number(r.constancia || 0),
          weeklyMax:{1:+(r.c1s_m||0),2:+(r.c2s_m||0),3:+(r.c3s_m||0),4:+(r.c4s_m||0)},
          weeklyNow:{1:+(r.c1s_ac||0),2:+(r.c2s_ac||0),3:+(r.c3s_ac||0),4:+(r.c4s_ac||0)}
        };
      }
    
      function buildSection(name, items, mode){
        const [u1,u2] = MODE_THRESH[mode] || MODE_THRESH.FLOW;
        const sec = pcEl('section','pc-section'+(name==='Body'?' pc-active':'')); 
        sec.dataset.section = name.toLowerCase();
    
        sec.appendChild(pcEl('div','pc-h4','🔥 Tareas con racha de constancia'));
    
        // Top‑3 (por racha real)
        const top3Box = pcEl('div','pc-top3');
        const top3 = [...items].sort((a,b)=>b.streak-a.streak).slice(0,3);
        top3.forEach(t=>{
          const c = pcEl('div','pc-tcard');
          c.appendChild(pcEl('div','pc-thead','<span class="pc-fire">🔥</span><span class="pc-streak">x'+t.streak+'</span>'));
          c.appendChild(pcEl('div','pc-tname',pcEsc(t.task)));
          const row = pcEl('div','pc-row-mini');
          const chips = pcEl('div','pc-chips');
          chips.appendChild(pcEl('span','pc-chip pc-xp','<span class="pc-spark"></span> XP +' + t.xp));
          if(t.stat) chips.appendChild(pcEl('span','pc-chip','Stat: ' + pcEsc(t.stat)));
          row.appendChild(chips); 
          c.appendChild(row);
    
          const b = pcEl('div','pc-badges');
          b.appendChild(pcEl('span','pc-badge pc-max',`Max ${u1}×/sem = ${t.weeklyMax[u1]||0}`));
          b.appendChild(pcEl('span','pc-badge pc-now',`Ahora ${u1}×/sem = ${t.weeklyNow[u1]||0}`));
          b.appendChild(pcEl('span','pc-badge pc-max',`Max ${u2}×/sem = ${t.weeklyMax[u2]||0}`));
          b.appendChild(pcEl('span','pc-badge pc-now',`Ahora ${u2}×/sem = ${t.weeklyNow[u2]||0}`));
          c.appendChild(b);
          top3Box.appendChild(c);
        });
        sec.appendChild(top3Box);
    
        // Filtro
        const input = pcEl('input','pc-filter');
        input.placeholder = "Filtrar tareas… (ej. 'ayuno')";
        input.dataset.filter = name.toLowerCase();
        sec.appendChild(input);
    
        // Lista (resto de tareas, orden alfabético)
        const list = pcEl('div','pc-list');
        list.dataset.list = name.toLowerCase();
        list.appendChild(pcEl('div','pc-row pc-label','<div>Tarea</div><div class="pc-xp">XP</div><div class="pc-right">Semanal</div>'));
    
        const rest = items.filter(x=>!top3.includes(x)).sort((a,b)=>a.task.localeCompare(b.task,'es'));
        rest.forEach(t=>{
          const row = pcEl('div','pc-row');
          row.innerHTML = `
            <div>${pcEsc(t.task)}</div>
            <div class="pc-xp">+${t.xp}</div>
            <div class="pc-right">
              <div class="pc-stack">
                <span class="pc-mini pc-max">Max ${u1}×/sem = ${t.weeklyMax[u1]||0}</span>
                <span class="pc-mini pc-now">Ahora ${u1}×/sem = ${t.weeklyNow[u1]||0}</span>
              </div>
            </div>`;
          // agrego segundo umbral apilado debajo (misma columna)
          const extra = pcEl('div','pc-stack');
          extra.innerHTML = `
            <span class="pc-mini pc-max">Max ${u2}×/sem = ${t.weeklyMax[u2]||0}</span>
            <span class="pc-mini pc-now">Ahora ${u2}×/sem = ${t.weeklyNow[u2]||0}</span>`;
          const firstStack = row.lastElementChild.querySelector('.pc-stack');
          const wrap = pcEl('div'); 
          wrap.style.display='flex'; wrap.style.flexDirection='column'; wrap.style.alignItems='flex-end'; wrap.style.gap='4px';
          wrap.appendChild(firstStack); wrap.appendChild(extra);
          row.lastElementChild.replaceChildren(wrap);
    
          list.appendChild(row);
        });
        sec.appendChild(list);
    
        // handler filtro
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
        root.classList.add('pc'); // activa tipografía/colores namespaced
        root.innerHTML = '';
    
        const mode = (modeInput || 'FLOW').toUpperCase();
        const rows = (Array.isArray(bbddRaw) ? bbddRaw : []).map(normalizeRow);
        const groups = { Body:[], Mind:[], Soul:[] };
        rows.forEach(x => groups[x.pillar]?.push(x));
    
        // topbar
        const top = pcEl('div','pc-topbar');
        const tabs = pcEl('div','pc-tabs');
        ['Body','Mind','Soul'].forEach((p,i)=>{
          const b = pcEl('button','pc-tab'+(i===0?' pc-active':''),(p==='Body'?'🫀 ':p==='Mind'?'🧠 ':'🏵️ ')+p);
          b.dataset.tab = p.toLowerCase();
          b.addEventListener('click', ()=>{
            root.querySelectorAll('.pc-tab').forEach(x=>x.classList.remove('pc-active'));
            b.classList.add('pc-active');
            root.querySelectorAll('.pc-section').forEach(s=>s.classList.toggle('pc-active', s.dataset.section===b.dataset.tab));
          });
          tabs.appendChild(b);
        });
        const infoHTML = '<div class="pc-info-btn">ℹ️</div><div class="pc-info-bubble"><b>Cómo leer:</b><br/>• 🔥 + <b>xN</b> = días de racha real (col I) en Top‑3.<br/>• <b>XP</b> = experiencia total (col H).<br/>• <b>Max/Ahora</b>: ecuación por umbral (p.ej. 2×/sem = 5).<br/>• Game Mode: LOW (1,2) · CHILL/FLOW (2,3) · EVOL (3,4).</div>';
        const info = pcEl('div','pc-info', infoHTML);
        top.appendChild(tabs); top.appendChild(info); root.appendChild(top);
    
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


    // AVATAR
    const avatarURL = data.avatar_url || "";
    const avatarImg = document.getElementById("avatar");
    if (avatarImg) avatarImg.src = avatarURL;
  
    // ESTADO DIARIO: barras
    const setProgress = (id, value) => {
      const bar = document.getElementById(id);
      if (!bar) return;
      const percent = Math.round((Number(value) || 0) * 100);
      bar.style.width = `${percent}%`;
      bar.textContent = `${percent}%`;
    };
    setProgress("bar-hp", data.hp ?? 0);
    setProgress("bar-mood", data.mood ?? 0);
    setProgress("bar-focus", data.focus ?? 0);
  
    // XP Y NIVEL
    document.getElementById("xp-actual").textContent = data.xp;
    document.getElementById("nivel-actual").textContent = data.nivel;
    document.getElementById("xp-faltante").textContent = data.xp_faltante;
    const progresoNivel = Math.round((data.xp / data.exp_objetivo) * 100);
    const barNivel = document.getElementById("bar-nivel");
    barNivel.style.width = `${progresoNivel}%`;
    barNivel.textContent = `${progresoNivel}%`;
  
    // 🧿 RADAR DE RASGOS
    function calcularXPporRasgoDesdeBBDD(bbdd) {
      const xpPorRasgo = {};
      bbdd.forEach(row => {
        const rasgo = row["rasgo"];
        const exp = Number(row["exp"]) || 0;
        if (!rasgo) return;
        if (!xpPorRasgo[rasgo]) xpPorRasgo[rasgo] = 0;
        xpPorRasgo[rasgo] += exp;
      });
      const labels = Object.keys(xpPorRasgo);
      const values = labels.map(r => xpPorRasgo[r]);
      return { labels, values };
    }
  
    const radarCanvas = document.getElementById("radarChart");
    const radarData = data.bbdd ? calcularXPporRasgoDesdeBBDD(data.bbdd) : { labels: [], values: [] };
  
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
            suggestedMax: Math.max(...radarData.values, 10),
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
      const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
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
  
    // ========================
    // 💖 EMOTION CHART (Neutral -> Cansancio, sin registro en gris)
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
  
      const parseDate = (str) => {
        const [day, month, year] = str.split("/");
        return new Date(`${year}-${month}-${day}`);
      };
      const iso = (d) => d.toISOString().split("T")[0];
  
      // Mapa fecha -> clave emoción
      const emotionMap = {};
      dailyEmotion.forEach(entry => {
        const d = parseDate(entry.fecha);
        const k = emotionKey[ normalize(entry.emocion) ];
        if (!isNaN(d) && k) emotionMap[iso(d)] = k;
      });
  
      const sortedDates = Object.keys(emotionMap).sort();
      if (sortedDates.length === 0) return;
  
      const startDate = new Date(sortedDates[0]);
      startDate.setDate(startDate.getDate() - startDate.getDay());
  
      const NUM_WEEKS = 26;
      const DAYS_IN_WEEK = 7;
  
      const emotionChart = document.getElementById("emotionChart");
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
          ? labelDate.toLocaleString("es-ES", { month: "long" })
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
          const key = emotionMap[iso(cellDate)] || "NONE";
  
          const cell = document.createElement("div");
          cell.className = "emotion-cell";
          cell.style.backgroundColor = keyToColor[key] || "#555";
          cell.title = `${iso(cellDate)} – ${keyToName[key]}`;
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
  
      // Normalizamos "Neutral" -> "Cansancio"
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



// ===== Avatar: abrir/cerrar + subir a ImgBB + persistir en Sheet =====
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
