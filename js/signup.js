document.addEventListener("DOMContentLoaded", () => {
  const avatarInput = document.getElementById("avatar");
  const avatarPreview = document.getElementById("avatar-preview");
  const filenamePreview = document.getElementById("filename-preview");
  const form = document.getElementById("signup-form");

  avatarInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      avatarPreview.src = imageUrl;
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
    const avatarFile = avatarInput.files[0];

    if (!email || !nombre) {
      alert("Por favor, completá al menos tu email y nombre.");
      return;
    }

    const subirA0x0 = async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("https://0x0.st", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("No se pudo subir la imagen a 0x0.st");
      }

      const url = await response.text();
      return url.trim();
    };

    const enviarFormulario = async (avatar_url_final) => {
      try {
        const formData = new FormData();
        formData.append("entry.978262299", email);             // ✅ Email
        formData.append("entry.268921631", nombre);            // ✅ Nombre
        formData.append("entry.1084572637", apellido);         // ✅ Apellido
        formData.append("entry.2109129788", edad);             // ✅ Edad
        formData.append("entry.1142848287", avatar_url_final); // ✅ Avatar URL
        formData.append("entry.902905747", sexo);              // ✅ Sexo

        console.log("👉 Enviando al formulario");
        console.log("Nombre:", nombre);
        console.log("Apellido:", apellido);
        console.log("Edad:", edad);
        console.log("Avatar (URL):", avatar_url_final);
        console.log("Sexo:", sexo);
        console.log("Email:", email);

        await fetch("https://docs.google.com/forms/u/0/d/e/1FAIpQLSeXmBXfo0dw3srvcLzazcwW67K5Gv-dsvmdRDXVd78MRMjNLA/formResponse", {
          method: "POST",
          mode: "no-cors",
          body: formData
        });

        const popup = document.getElementById("popup");
        if (popup) {
          popup.classList.remove("hidden");
          form.style.display = "none";
        }

      } catch (error) {
        alert("Ocurrió un error al registrar: " + error);
      }
    };

    if (avatarFile) {
      try {
        const avatarUrl = await subirA0x0(avatarFile);
        await enviarFormulario(avatarUrl);
      } catch (err) {
        alert("No se pudo subir el avatar: " + err.message);
      }
    } else {
      const defaultAvatar = "https://i.imgur.com/EELiQop.jpg";
      await enviarFormulario(defaultAvatar);
    }
  });
});
