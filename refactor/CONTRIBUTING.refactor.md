# Cómo contribuir en la carpeta `refactor/`

1. **No toques los originales.** Toda mejora vive dentro de `refactor/` con el mismo nombre + `.refactor` si es una vista.
2. **Mantén los comentarios amigables.** Explica qué hace cada bloque y por qué, evitando tecnicismos innecesarios.
3. **Respeta la estructura.** CSS en `refactor/css`, JS en `refactor/js`, HTML en `refactor/views`.
4. **Documenta el módulo.** Cada archivo JS necesita encabezado con propósito, API pública, dependencias, efectos secundarios y notas de accesibilidad.
5. **Patrón `CONFIG + state`.** Los features nuevos siguen la dupla `const CONFIG = {…}` / `const state = {…}` para agrupar endpoints y cachés. Si un valor se comparte, muévelo a `utils/constants.js`.
6. **Secciones con `// =====`.** Divide bloques largos (helpers, eventos, boot) usando el formato `// ===== [Nombre] =====` para ubicar rápidamente cambios.
7. **Registra inicialización segura.** Usa `document.addEventListener('DOMContentLoaded', ...)` o `init(root)` para no romper al abrir el HTML directo.
8. **Pruebas manuales.** Al terminar, abre la vista en el navegador y sigue el flujo original para evitar regresiones. Deja constancia en el PR de los pasos ejecutados.
9. **TODOs priorizados.** Si detectas un riesgo, anótalo en la sección "Backlog priorizado" de `DOCUMENTATION.refactor.md` con etiqueta P0/P1/P2 y marca el punto exacto en el código con `// TODO:` si aplica.
10. **PWA y assets.** Si modificas el login o sus dependencias, valida también el `service worker` para que los assets refactorizados se precachen correctamente.
11. **Conflictos de merge.** Cuando sincronices con `main`, resuelve conflictos editando el archivo completo (sin dejar marcadores `<<<<<<<`) y vuelve a correr la revisión manual de vistas afectadas.
