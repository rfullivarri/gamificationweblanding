
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

        let avatarURL = data.avatar_url || "";
        if (avatarURL.includes("imgur.com") && !avatarURL.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            avatarURL += ".jpg";
        }

        document.getElementById("avatar").src = avatarURL;
        document.getElementById("welcome-msg").textContent = `Hola ${data.nombre || "usuario"} 👋`;
        document.getElementById("xp").textContent = data.xp;
        document.getElementById("level").textContent = data.level;
        document.getElementById("journey-days").textContent = data.journey_days;

        const xpPercent = (data.xp / data.next_level_xp) * 100;
        document.getElementById("xp-bar").style.width = `${xpPercent}%`;

        document.getElementById("edit-bbdd").href = data.link_bbdd;
        document.getElementById("dashboard").href = data.link_dashboard;
        document.getElementById("daily-form").href = data.link_formulario;
        document.getElementById("edit-form").href = data.link_form_editable;
    } catch (error) {
        console.error("Error al obtener datos:", error);
        alert("Ocurrió un error al cargar los datos del usuario.");
    }

    document.getElementById("menu-toggle").addEventListener("click", () => {
        document.getElementById("dashboard-menu").classList.toggle("active");
    });
});

