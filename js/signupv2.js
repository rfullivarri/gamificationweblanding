document.addEventListener("DOMContentLoaded", () => {
  // 🔧 CONFIGURAR:
  
  const FORM_ACTION = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSeXmBXfo0dw3srvcLzazcwW67K5Gv-dsvmdRDXVd78MRMjNLA/formResponse"; // tu form TRIGGER
  const CHECK_STATUS_ENDPOINT = "https://script.google.com/macros/s/AKfycbxOaMmRvEUweOyfXxj93ERX-ls8yvovoU5B_jjDg7qDeWLPhn70-0ClahMyOg69zJhf/exec"; // Apps Script columna E
  const FORM_PUBLIC_URL = "https://rfullivarri.github.io/gamificationweblanding/formsintro.html";     // link que abrís si falta completar
  const LOGIN_URL = "loginv2.html";                                   // a dónde mandás si ya está listo
  const POLL_MS = 10000;

  // Selectores
  const avatarInput = document.getElementById("avatar");
  const avatarPreview = document.getElementById("avatar-preview");
  const filenamePreview = document.getElementById("filename-preview");
  const form = document.getElementById("signup-form");
  const $status = document.getElementById("status");

  // Modal
  const $modal = document.getElementById("modal");
  const $modalTitle = document.getElementById("modalTitle");
  const $modalBody = document.getElementById("modalBody");
  const $modalActions = document.getElementById("modalActions");
  const $modalClose = document.getElementById("modalClose");

  let lastEmail = "";
  let pollTimer = null;

  function setStatus(msg, spin=false){
    $status.innerHTML = spin ? `${msg} <span class="spinner"></span>` : msg;
  }
  function showModal(){ $modal.classList.add("visible"); $modal.setAttribute("aria-hidden","false"); }
  function hideModal(){ $modal.classList.remove("visible"); $modal.setAttribute("aria-hidden","true"); }
  function setModal(title, html, actions){
    $modalTitle.textContent = title;
    $modalBody.innerHTML = html;
    $modalActions.innerHTML = "";
    actions.forEach(a => {
      const el = document.createElement(a.tag || "button");
      el.className = a.className || "btn";
      if (a.href) { el.setAttribute("href", a.href); el.setAttribute("target", a.target||"_self"); el.setAttribute("rel","noopener"); }
      el.innerHTML = a.html || a.text || "OK";
      if (a.onClick) el.addEventListener("click", a.onClick);
      $modalActions.appendChild(el);
    });
  }

  // Preview avatar
  avatarInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      avatarPreview.src = imageUrl;
      filenamePreview.textContent = file.name;
    }
  });

  // Enviar al Google Form + luego chequear estado
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const sexo = document.getElementById("sexo").value.trim();
    const edad = document.getElementById("edad").value.trim();
    const avatarFile = avatarInput.files[0];

    if (!email || !nombre) {
      alert("Por favor, completá al menos tu email y nombre.");
      return;
    }
    lastEmail = email;

    // Función que envía al Form y luego inicia el chequeo
    const enviarFormulario = async (avatar_url_final) => {
      try {
        const formData = new FormData();
        // 👇 respeta tus entry.* actuales
        formData.append("entry.978262299", email);
        formData.append("entry.268921631", nombre);
        formData.append("entry.1084572637", apellido);
        formData.append("entry.2109129788", edad);
        formData.append("entry.1142848287", avatar_url_final);
        formData.append("entry.902905747", sexo);

        setStatus("Registrando…", true);

        await fetch(FORM_ACTION, { method: "POST", mode: "no-cors", body: formData });

        // Mostrar modal con spinner mientras verificamos estado en Col E
        showWaitingState();

        // Primer chequeo inmediato + empezar polling
        await checkAndRender();
        startPolling();
      } catch (error) {
        alert("Ocurrió un error al registrar: " + error);
      }
    };

    if (avatarFile) {
      // Subir imagen a ImgBB
      const reader = new FileReader();
      reader.onloadend = async function () {
        const base64 = reader.result.split(',')[1];
        try {
          const response = await fetch("https://api.imgbb.com/1/upload?key=b78f6fa1f849b2c8fcc41ba4b195864f", {
            method: "POST",
            body: new URLSearchParams({ image: base64 })
          });
          const data = await response.json();
          const finalUrl = data?.data?.url || "https://i.ibb.co/Mxf30SX5/Whats-App-Image-2025-07-29-at-10-17-40.jpg";
          enviarFormulario(finalUrl);
        } catch (error) {
          enviarFormulario("https://i.ibb.co/Mxf30SX5/Whats-App-Image-2025-07-29-at-10-17-40.jpg"); // fallback
        }
      };
      reader.readAsDataURL(avatarFile);
    } else {
      enviarFormulario("https://i.ibb.co/Mxf30SX5/Whats-App-Image-2025-07-29-at-10-17-40.jpg");
    }
  });

  $modalClose.addEventListener("click", ()=> hideModal());

  // ----- Estado / Polling -----
  function showWaitingState(){
    showModal();
    setModal(
      "Creando tu cuenta…",
      `<p>Guardamos tus datos. Estamos preparando tu base con IA <span class="spinner"></span></p>`,
      [
        { tag:"a", className:"btn ghost", href:"indexv2.html", text:"Más tarde" },
        { tag:"a", className:"btn", href:FORM_PUBLIC_URL, target:"_blank", text:"Completar formulario" }
      ]
    );
  }

  async function fetchStatus(email){
    const url = `${CHECK_STATUS_ENDPOINT}?email=${encodeURIComponent(email)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("Estado no disponible");
    return res.json(); // { ok, processed, status, found }
  }

  async function checkAndRender(){
    try {
      const data = await fetchStatus(lastEmail);
      if (data.ok && data.processed){
        // ✅ Ya está PROCESADO en col E
        setModal(
          "¡Todo listo! 🎉",
          `<p>Tu cuenta está activa. Ya podés entrar al Dashboard.</p>`,
          [
            { tag:"a", className:"btn", href:`${LOGIN_URL}?email=${encodeURIComponent(lastEmail)}`, text:"Ir al Login" },
            { tag:"a", className:"btn ghost", href:"indexv2.html", text:"Volver al inicio" }
          ]
        );
        stopPolling();
      } else {
        // ⏳ Aún no procesado: mantiene el modal de espera con acceso al Form
        setModal(
          "Falta un paso",
          `<p>Completá el formulario para terminar la configuración. Apenas esté, te avisamos acá.</p>`,
          [
            { tag:"a", className:"btn", href:FORM_PUBLIC_URL, target:"_blank", text:"Completar formulario" },
            { tag:"a", className:"btn ghost", href:"indexv2.html", text:"Más tarde" }
          ]
        );
      }
    } catch (_e) {
      // Error silencioso; mantener modal y volver a intentar en el próximo polling
    }
  }

  function startPolling(){
    stopPolling();
    pollTimer = setInterval(checkAndRender, POLL_MS);
  }
  function stopPolling(){
    if (pollTimer){ clearInterval(pollTimer); pollTimer = null; }
  }
});
