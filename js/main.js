window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (!email) {
        document.getElementById("saludo").innerText = "❌ Falta el email en la URL.";
        return;
    }

    const response = await fetch("https://script.google.com/macros/s/WEBAPP_URL/exec?email=" + email);
    const data = await response.json();

    document.getElementById("saludo").innerText = "Hola, " + data.nombre + " 👋";

    const tabla = document.createElement("table");
    const header = tabla.insertRow();
    ["Pilar", "Rasgo", "Stat", "Task", "Dificultad"].forEach(t => {
        const th = document.createElement("th");
        th.innerText = t;
        header.appendChild(th);
    });

    data.bbdd.forEach(row => {
        const tr = tabla.insertRow();
        ["pilar", "rasgo", "stat", "task", "dificultad"].forEach(key => {
            const td = tr.insertCell();
            td.innerText = row[key];
        });
    });

    document.getElementById("contenedor-tabla").appendChild(tabla);

    document.getElementById("confirmar-btn").onclick = async () => {
        await fetch("https://script.google.com/macros/s/WEBAPP_URL/exec", {
            method: "POST",
            body: JSON.stringify({ email }),
            headers: { "Content-Type": "application/json" }
        });
        alert("Base confirmada. Recibirás tu formulario diario 📝");
    };

    const links = document.getElementById("links-utiles");
    links.innerHTML = `
        <p>📋 <a href="${data.bbdd_editor_url}" target="_blank">Editar Base de Datos</a></p>
        <p>📊 <a href="${data.dashboard_url}" target="_blank">Ver Dashboard</a></p>
        <p>📝 <a href="${data.daily_form_url}" target="_blank">Completar Form Diario</a></p>
    `;
};
