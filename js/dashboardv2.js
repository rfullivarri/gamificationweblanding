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
    const xp_objetivo = parseInt(data.xp_objetivo) || 1;
    const xp_faltante = Math.max(0, xp_objetivo - xp_actual);

    // 👉 Progreso de nivel (porcentaje)
    const progreso_nivel = Math.min(1, xp_actual / xp_objetivo);

    const estado = {
      HP: parseFloat(data.hp),
      Mood: parseFloat(data.mood),document.addEventListener("DOMContentLoaded", async () => {
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
    const xp_objetivo = parseInt(data.xp_objetivo) || 1;
    const xp_actual = xp_total;
    const xp_faltante = Math.max(0, xp_objetivo - xp_actual); // ✨ Diferencia entre objetivo y actual
    const progreso_nivel = Math.min(1, xp_actual / xp_objetivo); // % hacia el siguiente nivel

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

    // 🎨 Columna izquierda
    const col1 = document.createElement("div");
    col1.className = "column";
    col1.innerHTML = `
      <img src="${avatarURL}" class="dashboard-avatar-rectv2" />
      <h2>💠 Estado diario</h2>
    `;
    col1.appendChild(createProgressBar("🫀 HP", estado.HP));
    col1.appendChild(createProgressBar("🏵️ Mood", estado.Mood));
    col1.appendChild(createProgressBar("🧠 Focus", estado.Focus));

    // 📊 Columna central
    const col2 = document.createElement("div");
    col2.className = "column";
    col2.innerHTML = `
      <h2>📊 Radar de Rasgos</h2>
      <canvas id="radarChart" height="250"></canvas>
      <h2>🪴 Daily Cultivation</h2>
      <canvas id="xpChart" height="150"></canvas>
    `;

    // 🏆 Columna derecha
    const col3 = document.createElement("div");
    col3.className = "column";
    col3.innerHTML = `
      <h2>🏆 Total XP: ${xp_total}</h2>
      <h2>🎯 Nivel actual: ${nivel_actual}</h2>
      <p>✨ Te faltan <strong>${xp_faltante} XP</strong> para el próximo nivel.</p>
    `;

    // 📈 Barra de progreso al siguiente nivel
    col3.appendChild(createProgressBar("📈 Progreso al siguiente nivel", progreso_nivel));

    col3.innerHTML += `
      <h2>💠 Emotion Chart</h2>
      <div id="emotionChartContainer"></div>
      <h2>🎁 Rewards</h2>
      <div id="rewardsContainer"></div>
    `;

    dashboardRoot.appendChild(col1);
    dashboardRoot.appendChild(col2);
    dashboardRoot.appendChild(col3);

    // 🔹 Radar Chart de rasgos
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

    // 📈 Línea de XP por día
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

    // 🟩 Emotion Chart estilo GitHub
    const emotionChart = document.getElementById("emotionChartContainer");
    const daily_log = data.daily_log || [];
    const emotionColors = {
      "🟩": "#B2FF59",
      "🟨": "#FFEB3B",
      "🟪": "#CE93D8",
      "🟥": "#EF5350",
      "🟫": "#8D6E63",
      "⬛": "#424242"
    };

    const emotionData = {};
    daily_log.forEach(row => {
      const fecha = row["Marca temporal"].split(" ")[0];
      const emo = row.Emociones?.trim()?.substring(0, 2) || "⬛";
      emotionData[fecha] = emo;
    });

    Object.entries(emotionData).forEach(([fecha, emo]) => {
      const div = document.createElement("div");
      div.className = "emotion-cell";
      div.style.backgroundColor = emotionColors[emo] || "#555";
      div.title = `${fecha}: ${emo}`;
      emotionChart.appendChild(div);
    });

    // 🧩 Recompensas
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

    // ✅ Misiones en la parte inferior
    const missions = document.createElement("div");
    missions.className = "missions-wrapper";

    const rewards = data.rewards || [];
    rewards.forEach(r => {
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
