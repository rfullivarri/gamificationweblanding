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

  // RADAR DE RASGOS (XP por Rasgo desde BBDD)
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
        pointBackgroundColor: "rgba(102, 0, 204, 1)",
      }]
    },
    options: {
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: Math.max(...radarData.values, 10),
        }
      }
    }
  });

  // GRÁFICO DE XP POR DÍA
  const xpCanvas = document.getElementById("xpChart");
  new Chart(xpCanvas, {
    type: "line",
    data: {
      labels: data.daily_cultivation.map(d => d.fecha),
      datasets: [{
        label: "XP",
        data: data.daily_cultivation.map(d => d.xp),
        borderColor: "rgba(102, 0, 204, 1)",
        backgroundColor: "rgba(102, 0, 204, 0.2)",
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });

  // EMOTION CHART (estilo GitHub)
  const emotions = data.daily_emotion || {};
  const emotionContainer = document.getElementById("emotionChartContainer");

  Object.entries(emotions).forEach(([date, emoji]) => {
    const cell = document.createElement("div");
    cell.className = "emotion-cell";
    cell.title = `${date} - ${emoji}`;
    cell.textContent = emoji;
    emotionContainer.appendChild(cell);
  });

  // REWARDS (placeholder)
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
  // 🔗 Enlaces
  document.getElementById("edit-bbdd").href = data.bbdd_editor_url || "#";
  document.getElementById("dashboard").href = data.dashboard_url || "#";
  document.getElementById("daily-form").href = data.daily_form_url || "#";
  document.getElementById("edit-form").href = data.daily_form_edit_url || "#";

  
  // ☰ Menú hamburguesa
  document.getElementById("menu-toggle").addEventListener("click", () => {
      document.getElementById("dashboard-menu").classList.toggle("active");
    });
});
