document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (!email) {
        alert("No se proporcionó un correo electrónico.");
        return;
    }

    try {
        const response = await fetch(`https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec?email=${encodeURIComponent(email)}`);
        const data = await response.json();

        // 👉 Avatar directo desde ImgBB
        const avatarURL = data.avatar_url?.trim();
        if (avatarURL) {
            document.getElementById("avatar").src = avatarURL;
        } else {
            // Opción: mostrar imagen por defecto si no hay avatar
            document.getElementById("avatar").src = "https://imgur.com/EELiQop";
        }

        document.getElementById("welcome-msg").textContent = `Hola ${data.nombre || ""} 👋`;
        document.getElementById("xp").textContent = data.xp || "—";
        document.getElementById("nivel").textContent = data.nivel || "—";
        document.getElementById("journey-days").textContent = data.dias_journey || "—";

        
        // 🔶 Mostrar advertencia si NO completó su base
        if ((data.estado !== "PROCESADO ✅")) {
            const warningContainer = document.getElementById("journey-warning");
            if (warningContainer) warningContainer.style.display = "block";
        }

        // 👉 XP Progress bar solo si hay datos
        if (data.xp && data.exp_objetivo) {
            const xpPercent = (data.xp / data.exp_objetivo) * 100;
            document.getElementById("xp-bar").style.width = `${xpPercent}%`;
        } else {
            document.getElementById("xp-bar").style.width = `0%`;
            const mensaje = document.createElement("p");
            mensaje.textContent = "⚠️ Falta crear tu base de datos.";
            mensaje.style.color = "orange";
            mensaje.style.fontSize = "0.9rem";
            document.getElementById("xp-bar").parentElement.appendChild(mensaje);
        }

        document.getElementById("edit-bbdd").href = data.bbdd_editor_url || "#";
        document.getElementById("dashboard").href = data.dashboard_url || "#";
        document.getElementById("daily-form").href = data.daily_form_url || "#";
        document.getElementById("edit-form").href = data.daily_form_edit_url || "#";
    } catch (error) {
        console.error("Error al obtener datos:", error);
        alert("Ocurrió un error al cargar los datos del usuario.");
    }

    document.getElementById("menu-toggle").addEventListener("click", () => {
        document.getElementById("dashboard-menu").classList.toggle("active");
    });
});
