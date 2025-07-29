document.addEventListener("DOMContentLoaded", () => {
  const avatarInput = document.getElementById("avatar");
  const avatarPreview = document.getElementById("avatar-preview");
  const filenamePreview = document.getElementById("filename-preview");
  const form = document.getElementById("signup-form");

  avatarInput.addEventListener("change", function () {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      avatarPreview.src = e.target.result;
    };
    if (file) {
      reader.readAsDataURL(file);
      filenamePreview.textContent = file.name;
    }
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const sexo = document.getElementById("sexo").value;
    const edad = document.getElementById("edad").value;
    const avatarFile = document.getElementById("avatar").files[0];

    if (!email || !nombre) {
      alert("Por favor, completá al menos tu email y nombre.");
      return;
    }

    let avatar_url = "https://i.imgur.com/EELiQop.jpg";
    if (avatarFile) {
      const formData = new FormData();
      formData.append("image", avatarFile);
      try {
        const res = await fetch("https://api.imgur.com/3/image", {
          method: "POST",
          headers: { Authorization: "Client-ID 546b2de8f7f69f1" },
          body: formData
        });
        const data = await res.json();
        if (!data.success) throw new Error("Imgur error");
        avatar_url = data.data.link;
      } catch (err) {
        alert("Error subiendo imagen. Se usará un avatar por defecto.");
      }
    }

    const payload = {
      action: "registerUser",
      email,
      nombre,
      apellido,
      sexo,
      edad,
      avatar_url
    };

    try {
      const response = await fetch(
        "https://script.google.com/macros/s/AKfycbzje0wco71mNea1v2WClcpQkvz0Ep3ZIJ8guBONQLvI3G3AXxfpdH0ECaCNMbHHcyJ3Gw/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.text();

    if (result === "redirigir_a_formulario" || result === "redirigir_a_dashboard") {
        // Mostrar popup de éxito
        const popup = document.getElementById("popup");
        if (popup) {
            popup.classList.remove("hidden");

            // Ocultar el formulario si querés
            const form = document.getElementById("signup-form");
            if (form) {
                form.style.display = "none";
            }
        }
    } else {
        alert("Respuesta inesperada del servidor: " + result);
    }
    } catch (error) {
  alert("Ocurrió un error al registrar: " + error);
    }
  });
});
