window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (!email) {
        document.getElementById("saludo").innerText = "❌ Falta el email en la URL.";
        return;
    }

    try {
        const response = await fetch("https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec?email=" + email);
        const data = await response.json();

        // Validar que data.bbdd esté presente y sea un array
        if (!Array.isArray(data.bbdd)) {
            document.getElementById("saludo").innerText = "⚠️ No se encontraron tareas para este correo.";
            return;
        }

        document.getElementById("saludo").innerText = "Hola, " + data.nombre + " 👋";

        const tabla = document.createElement("table");
        tabla.style.marginTop = "20px";

        // Crear encabezado
        const header = tabla.insertRow();
        ["Pilar", "Rasgo", "Stat", "Task", "Dificultad"].forEach(t => {
            const th = document.createElement("th");
            th.innerText = t;
            header.appendChild(th);
        });

        // Llenar tabla con data.bbdd
        data.bbdd.forEach(row => {
            const tr = tabla.insertRow();
            ["pilar", "rasgo", "stat", "task", "dificultad"].forEach(key => {
                const td = tr.insertCell();
                td.innerText = row[key];
            });
        });

        document.getElementById("contenedor-tabla").appendChild(tabla);

        // Acción del botón de confirmación
        document.getElementById("confirmar-btn").onclick = async () => {
            await fetch("https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec", {
                method: "POST",
                body: JSON.stringify({ email }),
                headers: { "Content-Type": "application/json" }
            });
            alert("✅ Base confirmada. Recibirás tu formulario diario 📝");
        };

        // Cargar links útiles
        const links = document.getElementById("links-utiles");
        links.innerHTML = `
            <p>📋 <a href="${data.bbdd_editor_url}" target="_blank">Editar Base de Datos</a></p>
            <p>📊 <a href="${data.dashboard_url}" target="_blank">Ver Dashboard</a></p>
            <p>📝 <a href="${data.daily_form_url}" target="_blank">Completar Form Diario</a></p>
        `;
    } catch (error) {
        console.error("❌ Error al obtener los datos:", error);
        document.getElementById("saludo").innerText = "❌ Error al cargar los datos. Revisá la consola.";
    }
};
