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

  setProgress("bar-hp", data.hp);
  setProgress("bar-mood", data.mood);
  setProgress("bar-focus", data.focus);

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

  //🪴 DAILY CULTIVATION
  function formatMonthName(monthStr) {
    const [year, month] = monthStr.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
      "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  }

  function renderMonthSelector(data) {
    const monthSelector = document.getElementById("monthSelector");
    monthSelector.innerHTML = "";

    const uniqueMonths = [...new Set(data.map(item => item.fecha.slice(0, 7)))];

    uniqueMonths.forEach(month => {
      const option = document.createElement("option");
      option.value = month;
      option.textContent = formatMonthName(month);
      monthSelector.appendChild(option);
    });

    monthSelector.addEventListener("change", () => {
      const selectedMonth = monthSelector.value;
      const filteredData = data.filter(item => item.fecha.startsWith(selectedMonth));
      renderXPChart(filteredData);
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    monthSelector.value = currentMonth;
    const filteredData = data.filter(item => item.fecha.startsWith(currentMonth));
    renderXPChart(filteredData);
  }

  let xpChart;
  function renderXPChart(data) {
    const ctx = document.getElementById('xpChart').getContext('2d');
    if (xpChart) xpChart.destroy();

    const fechas = data.map(entry => entry.fecha);
    const xp = data.map(entry => entry.xp);

    xpChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fechas,
        datasets: [{
          label: 'XP',
          data: xp,
          borderColor: '#B17EFF',
          backgroundColor: 'rgba(177,126,255,0.2)',
          borderWidth: 2,
          tension: 0.3,
          fill: true,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: 'white',
              font: { size: 13, weight: 'normal' }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: 'white',
              font: { size: 13, weight: 'normal' }
            }
          },
          y: {
            ticks: {
              color: 'white',
              font: { size: 13, weight: 'normal' },
              beginAtZero: true
            }
          }
        }
      }
    });
  }

  if (data.daily_cultivation) {
    renderMonthSelector(data.daily_cultivation);
  }

  // ========================
  // 💖 EMOTION CHART
  // ========================
  function renderEmotionChart(dailyEmotion) {
    // 1. Crear mapa de emociones por fecha
    const emotionMap = {};
    dailyEmotion.forEach(entry => {
      const fecha = entry.fecha;
      const emocion = entry.emocion;
      if (fecha && emocion) {
        emotionMap[fecha] = emocion;
      }
    });
  
    // 2. Definir colores por emoción (podés sumar más)
    const emotionColors = {
      "Felicidad": "#F8E473",
      "Tristeza": "#96C5F7",
      "Ansiedad": "#FFDAC1",
      "Motivación": "#D5AAFF",
      "Calma": "#A7FFEB",
      "Frustración": "#FFABAB"
    };
  
    // 3. Seleccionar contenedor y limpiar contenido previo
    const emotionChart = document.getElementById("emotionChart");
    emotionChart.innerHTML = "";
  
    // 4. Generar cuadrícula de 371 días (último año)
    for (let i = 370; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const isoDate = date.toISOString().split("T")[0];
      const emotion = emotionMap[isoDate];
      const color = emotionColors[emotion] || "#2e2e2e"; // gris oscuro por defecto
  
      const square = document.createElement("div");
      square.className = "emotion-square";
      square.style.backgroundColor = color;
      square.title = `${isoDate}${emotion ? " – " + emotion : " – Sin registro"}`;
  
      emotionChart.appendChild(square);
    }
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
