document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  if (!email) {
    alert("No se proporcionó un correo electrónico.");
    return;
  }

  const response = await fetch(
    `https://script.google.com/macros/s/AKfycbzbigb7y9Hcwbo1O8A8mnLRM5zFt0JaOApAJnVyh7HZbl0XmeSdGWgj1pJ3twDwctK9Qw/exec?email=${encodeURIComponent(email)}`
  );

  const data = await response.json();

  // ENLACES
  document.getElementById("edit-bbdd").href = data.bbdd_editor_url || "#";
  document.getElementById("daily-quest").href = data.daily_form_url || "#";
  const editFormEl = document.getElementById("edit-form");
  if (editFormEl) editFormEl.href = data.daily_form_edit_url || "#";

  // WARNING SIN PROCESAR
  if (data.estado !== "PROCESADO ✅") {
    const warningContainer = document.getElementById("journey-warning");
    if (warningContainer) warningContainer.style.display = "block";
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
});
