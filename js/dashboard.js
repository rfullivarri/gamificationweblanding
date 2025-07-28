let data = null;

window.onload = async () => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");

    if (!email) {
        alert("❌ Falta el email");
        return;
    }

    const res = await fetch(`https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec?email=${email}`);
    data = await res.json();

    document.getElementById("avatar").src = convertirDriveLink(data.avatar_url);
    document.getElementById("nivel").innerText = data.nivel;
    document.getElementById("xp").innerText = data.xp;
    document.getElementById("xp-objetivo").innerText = data.exp_objetivo;
    document.getElementById("dias").innerText = data.dias_journey;

    const xpPorcentaje = Math.round((data.xp / data.exp_objetivo) * 100);
    document.getElementById("xp-bar").style.width = `${xpPorcentaje}%`;
};

function convertirDriveLink(link) {
    if (!link.includes("drive.google.com/file/d/")) return link;
    const match = link.match(/\/d\/(.*?)\//);
    return match ? `https://drive.google.com/uc?export=view&id=${match[1]}` : link;
}

function ir(url) {
    if (url) window.open(url, "_blank");
}
