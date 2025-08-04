document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get("email");
  const dashboardRoot = document.getElementById("dashboard-root");

  if (!email) {
    dashboardRoot.innerHTML = "<p>❌ No se proporcionó un correo electrónico válido.</p>";
    return;
  }

  try {
    const response = await fetch(`https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    // 👉 Datos del usuario
    const avatarURL = data.avatar_url;
    const xp_total = parseInt(data.xp) || 0;
    const nivel_actual = parseInt(data.nivel) || 0;
    const xp_objetivo = parseInt(data.exp_objetivo) || 1;
    const xp_faltante = parseInt(data.xp_faltante) || (xp_objetivo - xp_total);
    const progreso_nivel = xp_total / xp_objetivo; // 🎯 Cálculo de progreso
    const estado = {
      HP: parseFloat(data.hp),
      Mood: parseFloat(data.mood),
      Focus: parseFloat(data.focus)
    };

    const createProgressBar = (label, value) => {
      const container = document.createElement("div");
      container.className = "progress-bar";
      const inner = document.createElement("div");
      inner.className = "progress-bar-inner";
      inner.style.width = (value * 100) + "%";
      inner.textContent = `${label} – ${(value * 100).toFixed(0)}%`;
      container.appendChild(inner);
      return container;
    };

    // 🎨 Columna izquierda: Avatar + Estado
    const col1 = document.createElement("div");
    col1.className = "column";

    const avatarImg = document.createElement("img");
    avatarImg.id = "avatar";
    avatarImg.src = avatarURL || "https://imgur.com/EELiQop.jpg";
    avatarImg.alt = "Avatar";
    avatarImg.style.width = "120px";
    avatarImg.style.height = "180px";
    avatarImg.style.objectFit = "cover";
    avatarImg.style.borderRadius = "12px";
    avatarImg.style.display = "block";
    avatarImg.style.marginBottom = "1rem";

    col1.appendChild(avatarImg);
    col1.innerHTML += `<h2>💠 Estado diario</h2>`;
    col1.appendChild(createProgressBar("🫀 HP", estado.HP));
    col1.appendChild(createProgressBar("🏵️ Mood", estado.Mood));
    col1.appendChild(createProgressBar("🧠 Focus", estado.Focus));

    // 📊 Columna central: Radar + XP
    const col2 = document.createElement("div");
    col2.className = "column";
    col2.innerHTML = `
      <h2>📊 Radar de Rasgos</h2>
      <canvas id="radarChart" height="250"></canvas>
      <h2>🪴 Daily Cultivation</h2>
      <canvas id="xpChart" height="150"></canvas>
    `;

    // 🏆 Columna derecha: Nivel + Progreso + Emoción + Recompensas
    const col3 = document.createElement("div");
    col3.className = "column";
    col3.innerHTML = `
      <h2>🏆 Total XP: ${xp_total}</h2>
      <h2>🎯 Nivel actual: ${nivel_actual}</h2>
      <p>✨ Te faltan <strong>${xp_faltante} XP</strong> para el próximo nivel.</p>
    `;
    col3.appendChild(createProgressBar("📈 Progreso al siguiente nivel", progreso_nivel));
    col3.innerHTML += `
      <h2>💠 Emotion Chart</h2>
      <div id="emotionChartContainer" class="emotion-grid"></div>
      <h2>🎁 Rewards</h2>
      <div id="rewardsContainer"></div>
    `;

    // Agregar columnas al root
    dashboardRoot.appendChild(col1);
    dashboardRoot.appendChild(col2);
    dashboardRoot.appendChild(col3);

    // 🔹 Radar Chart
    const rasgos = data.acumulados_subconjunto || [];
    const labels = rasgos.map(r => r.Rasgo);
    const valores = rasgos.map(r => parseInt(r.TotalXP) || 0);
    new Chart(document.getElementById("radarChart"), {
      type: "radar",
      data: {
        labels,
        datasets: [{
          label: "XP por Rasgo",
          data: valores,
          fill: true,
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)"
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { r: { ticks: { color: "#ccc" } } }
      }
    });

    // 📈 Línea de XP
    const daily = data.daily_cultivation || [];
    const fechas = daily.map(row => row.Fecha);
    const valoresXP = daily.map(row => parseInt(row.XP) || 0);
    new Chart(document.getElementById("xpChart"), {
      type: "line",
      data: {
        labels: fechas,
        datasets: [{
          label: "XP diaria",
          data: valoresXP,
          fill: false,
          borderColor: "#6C63FF",
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: "#aaa" } },
          y: { ticks: { color: "#aaa" } }
        }
      }
    });

    // 💠 Emotion Chart estilo GitHub
    const emotionChart = document.getElementById("emotionChartContainer");
    const emotionColors = {
      "Motivación": "#CE93D8",
      "Felicidad": "#FFEB3B",
      "Calma": "#B2FF59",
      "Frustración": "#EF5350",
      "Tristeza": "#8D6E63",
      "Neutro": "#424242"
    };

    const dailyEmotion = data.daily_emotion || [];
    dailyEmotion.forEach(({ fecha, emocion }) => {
      const cell = document.createElement("div");
      cell.className = "emotion-cell";
      cell.style.backgroundColor = emotionColors[emocion] || "#666";
      cell.title = `${fecha}: ${emocion}`;
      emotionChart.appendChild(cell);
    });

    // 🎁 Recompensas
    const rewardsDiv = document.getElementById("rewardsContainer");
    (data.rewards || []).forEach(r => {
      const div = document.createElement("div");
      div.className = "reward-card";
      div.innerHTML = `
        <p><strong>${r.Nombre}</strong> (${r.Tier})</p>
        <p>${r.Descripción}</p>
        <p><small>🎯 Requiere: ${r.Semanas || 0} semanas</small></p>
      `;
      rewardsDiv.appendChild(div);
    });

    // ✅ Misiones
    const missions = document.createElement("div");
    missions.className = "missions-wrapper";
    (data.rewards || []).forEach(r => {
      const card = document.createElement("div");
      card.className = "mission-card";
      card.innerHTML = `
        <h3>${r.Nombre}</h3>
        <p>🎯 Pilar: ${r.Pilar} — ${r.Rasgo}</p>
        <p>✅ Task: ${r.Task}</p>
        <p>🕒 Constancia: ${r.Semanas} semanas</p>
        <p>⭐ XP: ${r.XP} | 🎁 ${r.Reward}</p>
        <button>Activar</button>
      `;
      missions.appendChild(card);
    });
    document.body.appendChild(missions);

  } catch (error) {
    console.error("Error al cargar los datos del dashboard:", error);
    dashboardRoot.innerHTML = "<p>❌ Error al conectar con los datos del usuario.</p>";
  }
});
