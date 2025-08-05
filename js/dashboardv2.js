document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  if (!email) {
    alert("No se proporcionó un correo electrónico.");
    return;
  }

  const response = await fetch(
    `https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec?email=${encodeURIComponent(email)}`
  );

  const data = await response.json();

  // WARNING SIN PROCESAR
  // 🔶 Mostrar advertencia si NO completó su base
    if (data.estado !== "PROCESADO ✅") {
        const warningContainer = document.getElementById("journey-warning");
        if (warningContainer) warningContainer.style.display = "block";
      }

  // AVATAR
  const avatarURL = data.avatar_url || "";
  document.getElementById("avatar").src = avatarURL;

  // ESTADO DIARIO: barras
  const setProgress = (id, value) => {
    const bar = document.getElementById(id);
    const percent = Math.round(value * 100);
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
  document.getElementById("bar-nivel").style.width = `${progresoNivel}%`;
  document.getElementById("bar-nivel").textContent = `${progresoNivel}%`;

  // 🧿RADAR DE RASGOS
  function calcularXPporRasgoDesdeBBDD(bbdd) {
    const xpPorRasgo = {};
    bbdd.forEach(row => {
      const rasgo = row["rasgo"];
      const exp = Number(row["exp"]) || 0;
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
        label: "XP por Rasgo",
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
        title: { display: false }
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
    }
  });

  // 🪴 DAILY CULTIVATION
  function formatMonthName(monthStr) {
    const [year, month] = monthStr.split("-");
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${meses[parseInt(month, 10) - 1]} ${year}`;
  }
  
  function renderMonthSelector(data) {
    const monthSelector = document.getElementById("month-select");
    if (!monthSelector) {
      console.error("❌ No se encontró el elemento #month-select");
      return;
    }
  
    // Extraer meses únicos
    const uniqueMonths = [...new Set(data.map(item => {
      const date = new Date(item.fecha);
      if (isNaN(date)) {
        console.warn("⚠️ Fecha inválida:", item.fecha);
        return null;
      }
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }))].filter(Boolean);
  
    // Limpiar y cargar las opciones
    monthSelector.innerHTML = "";
    uniqueMonths.forEach(month => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = formatMonthName(month);
      monthSelector.appendChild(option);
    });
  
    // Seleccionar mes actual por defecto
    const currentMonth = new Date().toISOString().slice(0, 7);
    const isCurrentMonthAvailable = uniqueMonths.includes(currentMonth);
    monthSelector.value = isCurrentMonthAvailable ? currentMonth : uniqueMonths[0];
  
    // Render inicial
    const selected = monthSelector.value;
    const filteredData = data.filter(item => item.fecha.startsWith(selected));
    renderXPChart(filteredData);
  
    // Listener de cambios
    monthSelector.addEventListener("change", () => {
      const selectedMonth = monthSelector.value;
      const filteredData = data.filter(item => item.fecha.startsWith(selectedMonth));
      renderXPChart(filteredData);
    });
  }
  
  let xpChart;
  function renderXPChart(data) {
    const ctx = document.getElementById("xpChart").getContext("2d");
    if (xpChart) xpChart.destroy();
  
    const fechas = data.map(entry => entry.fecha);
    const xp = data.map(entry => entry.xp);
  
    xpChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: fechas,
        datasets: [{
          label: "XP",
          data: xp,
          borderColor: "#B17EFF",
          backgroundColor: "rgba(177,126,255,0.2)",
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: "white",
              font: { size: 13, weight: "normal" }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: "white",
              font: { size: 13 }
            }
          },
          y: {
            ticks: {
              color: "white",
              beginAtZero: true
            }
          }
        }
      }
    });
  }
  
  // Lanzar desde data global
  if (data.daily_cultivation && Array.isArray(data.daily_cultivation)) {
    renderMonthSelector(data.daily_cultivation);
  } else {
    console.warn("⚠️ No hay datos válidos para Daily Cultivation");
  }

  // ========================
  // 💖 EMOTION CHART
  // ========================
  function renderEmotionChart(dailyEmotion) {
    const emotionToEmoji = {
      "Calma": "🟩",
      "Felicidad": "🟨",
      "Motivación": "🟪",
      "Tristeza": "🟦",
      "Ansiedad": "🟥",
      "Neutral": "⬜",
      "Frustración": "🟫"
    };
  
    const emojiNames = {
      "🟩": "Calma",
      "🟨": "Felicidad",
      "🟪": "Motivación",
      "🟦": "Tristeza",
      "🟥": "Ansiedad",
      "⬜": "Neutral",
      "🟫": "Frustración"
    };
  
    const parseDate = (str) => {
      const [day, month, year] = str.split("/");
      return new Date(`${year}-${month}-${day}`);
    };
  
    const formatDate = (date) => {
      return date.toISOString().split("T")[0];
    };
  
    const emotionMap = {};
    dailyEmotion.forEach(entry => {
      const date = parseDate(entry.fecha);
      const isoDate = formatDate(date);
      const emoji = emotionToEmoji[entry.emocion.trim()] || entry.emocion.trim();
      emotionMap[isoDate] = emoji;
    });
  
    const sortedDates = Object.keys(emotionMap).sort();
    if (sortedDates.length === 0) return;
  
    const startDate = new Date(sortedDates[0]);
    startDate.setDate(startDate.getDate() - startDate.getDay());
  
    const squareSize = 12;
    const gap = 2;
    const NUM_WEEKS = 26; // Cambiar a 13 para mostrar solo 3 meses
    const DAYS_IN_WEEK = 7;
  
    const emotionColors = {
      "🟩": "#81c784",
      "🟨": "#fff176",
      "🟪": "#ba68c8",
      "🟦": "#64b5f6",
      "🟥": "#e57373",
      "🟫": "#a1887f",
      "⬜": "#ccc"
    };
  
    const emotionChart = document.getElementById("emotionChart");
    emotionChart.innerHTML = "";
  
    const monthLabelsContainer = document.createElement("div");
    monthLabelsContainer.className = "month-labels";
  
    const gridContainer = document.createElement("div");
    gridContainer.className = "emotion-grid";
  
    // Etiquetas de los meses alineadas con cada columna (una por semana)
    let currentMonth = -1;
    for (let col = 0; col < NUM_WEEKS; col++) {
      const labelDate = new Date(startDate);
      labelDate.setDate(startDate.getDate() + col * 7);
      const month = labelDate.getMonth();
      const year = labelDate.getFullYear();
  
      const label = document.createElement("div");
      label.className = "month-label";
  
      if (month !== currentMonth) {
        label.textContent = labelDate.toLocaleString("es-ES", { month: "long" });
        currentMonth = month;
      } else {
        label.textContent = "";
      }
  
      // 👉 Alineamos con el ancho real de la columna (una semana)
      label.style.width = `18px`;
      monthLabelsContainer.appendChild(label);
    }
  
    // Crear 7 filas (una por día de la semana)
    for (let row = 0; row < DAYS_IN_WEEK; row++) {
      const rowDiv = document.createElement("div");
      rowDiv.className = "emotion-row";
  
      for (let col = 0; col < NUM_WEEKS; col++) {
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + row + col * 7);
        const iso = formatDate(cellDate);
        const emoji = emotionMap[iso] || "⬜";
        const emotionName = emojiNames[emoji] || "Sin registro";
  
        const cell = document.createElement("div");
        cell.className = "emotion-cell";
        cell.style.backgroundColor = emotionColors[emoji] || "#ccc";
        cell.title = `${iso} – ${emotionName}`;
        rowDiv.appendChild(cell);
      }
  
      gridContainer.appendChild(rowDiv);
    }
  
    emotionChart.appendChild(monthLabelsContainer);
    emotionChart.appendChild(gridContainer);
  }
  // Ejecutar si hay datos
  if (data.daily_emotion) {
    console.log("💖 Emotions cargadas:", data.daily_emotion);
    renderEmotionChart(data.daily_emotion);
  } else {
    console.warn("⚠️ No hay datos válidos para Emotion Chart");
  }
  
  // REWARDS
  document.getElementById("rewardsContainer").innerHTML = "<p>(Recompensas por implementar...)</p>";

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

  // ENLACES
  document.getElementById("edit-bbdd").href = data.bbdd_editor_url || "#";
  document.getElementById("dashboard").href = data.dashboard_url || "#";
  document.getElementById("daily-form").href = data.daily_form_url || "#";
  document.getElementById("edit-form").href = data.daily_form_edit_url || "#";

  // MENÚ HAMBURGUESA
  document.getElementById("menu-toggle").addEventListener("click", () => {
    document.getElementById("dashboard-menu").classList.toggle("active");
  });
});
