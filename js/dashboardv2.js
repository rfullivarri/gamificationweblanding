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
    bar.style.width = `${value}%`;
    bar.textContent = `${value}%`;
  };

  setProgress("bar-hp", data.estado_diario.hp);
  setProgress("bar-mood", data.estado_diario.mood);
  setProgress("bar-focus", data.estado_diario.focus);

  // XP Y NIVEL
  document.getElementById("xp-actual").textContent = data.xp;
  document.getElementById("nivel-actual").textContent = data.nivel;
  document.getElementById("xp-faltante").textContent = data.xp_faltante;
  document.getElementById("bar-nivel").style.width = `${data.progreso_nivel}%`;
  document.getElementById("bar-nivel").textContent = `${data.progreso_nivel}%`;

  // RADAR DE RASGOS
  const radarCanvas = document.getElementById("radarChart");
  new Chart(radarCanvas, {
    type: "radar",
    data: {
      labels: data.radar.labels,
      datasets: [{
        label: "Stats",
        data: data.radar.values,
        fill: true,
        borderColor: "rgba(102, 0, 204, 1)",
        backgroundColor: "rgba(102, 0, 204, 0.2)",
        pointBackgroundColor: "rgba(102, 0, 204, 1)",
      }]
    },
    options: {
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 1
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
  const emotions = data.daily_emotion; // { "2025-07-01": "🟨", ... }
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
  data.misiones.forEach((m) => {
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
});
