document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");

  if (!email) {
    alert("No se proporcionó un correo electrónico.");
    return;
  }

  try {
    const response = await fetch(
      `https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec?email=${encodeURIComponent(email)}`
    );
    const data = await response.json();

    // AVATAR
    let avatarURL = data.avatar_url || "";
    if (avatarURL.includes("imgur.com") && !avatarURL.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      avatarURL += ".jpg";
    }
    document.getElementById("avatar").src = avatarURL;

    // ESTADO DIARIO
    const setProgress = (id, value) => {
      const bar = document.getElementById(id);
      if (bar && typeof value === "number") {
        bar.style.width = `${value}%`;
        bar.textContent = `${value}%`;
      }
    };

    if (data.estado_diario) {
      setProgress("bar-hp", data.estado_diario.hp || 0);
      setProgress("bar-mood", data.estado_diario.mood || 0);
      setProgress("bar-focus", data.estado_diario.focus || 0);
    }

    // XP Y NIVEL
    document.getElementById("xp-actual").textContent = data.xp || 0;
    document.getElementById("nivel-actual").textContent = data.nivel || 0;
    document.getElementById("xp-faltante").textContent = data.xp_faltante || 0;

    const progreso = data.progreso_nivel || 0;
    const barNivel = document.getElementById("bar-nivel");
    barNivel.style.width = `${progreso}%`;
    barNivel.textContent = `${progreso}%`;

    // RADAR DE RASGOS
    if (data.radar && data.radar.labels && data.radar.values) {
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
    }

    // GRÁFICO DE XP POR DÍA
    if (Array.isArray(data.daily_cultivation)) {
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
    }

    // EMOTION CHART
    if (data.daily_emotion) {
      const emotionContainer = document.getElementById("emotionChartContainer");
      emotionContainer.innerHTML = ""; // Limpiar por si recarga
      Object.entries(data.daily_emotion).forEach(([date, emoji]) => {
        const cell = document.createElement("div");
        cell.className = "emotion-cell";
        cell.title = `${date} - ${emoji}`;
        cell.textContent = emoji;
        emotionContainer.appendChild(cell);
      });
    }

    // REWARDS (placeholder)
    document.getElementById("rewardsContainer").innerHTML = "<p>(Recompensas por implementar...)</p>";

    // MISIONES
    if (Array.isArray(data.misiones)) {
      const missionsWrapper = document.getElementById("missions-wrapper");
      missionsWrapper.innerHTML = ""; // Limpiar si recarga
      data.misiones.forEach((m) => {
        const card = document.createElement("div");
        card.className = "mission-card";
        card.innerHTML = `
          <h4>🎯 ${m.nombre}</h4>
          <p><strong>Pilar:</strong> ${m.pilar}</p>
          <p><strong>Rasgo:</strong> ${m.rasgo}</p>
          <p><strong>Tasks:</strong> ${m.tasks?.join(", ") || "N/A"}</p>
          <p><strong>Semanas necesarias:</strong> ${m.constancia_semanas}</p>
          <p><strong>XP:</strong> ${m.xp}</p>
          <button>Activar</button>
        `;
        missionsWrapper.appendChild(card);
      });
    }

  } catch (error) {
    console.error("Error al cargar el dashboard:", error);
    alert("Hubo un error al cargar tus datos. Por favor, intentá más tarde.");
  }
});
