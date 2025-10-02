# Guía final de la carpeta `refactor/`

> Esta guía explica cómo navegar la "carpeta sombra" sin modificar los archivos originales.

## Mapa final · Vista → módulos → estilos → endpoints

### `views/indexv2.refactor.html` — Landing principal
- **JS principal:** `../js/features/landing.js` → usa `utils/dom` para selectores seguros y `utils/a11y` para anuncios accesibles.
- **Hojas de estilo:** `../css/base.css`, `../css/stylesv3.css`.
- **Endpoints / rutas externas:** no invoca APIs; sólo enlaza a `formsintrov3.html`, `signupv2.html`, `loginv2.html` y assets alojados en i.ibb.co.

### `views/loginv2.refactor.html` — Portal de acceso
- **JS principal:** `../js/features/login.js` → depende de `utils/dom`, `utils/a11y` y `utils/constants`.
- **Hojas de estilo:** `../css/base.css`, `../css/layout.css`.
- **Endpoints / rutas:**
  - `CHECK_ENDPOINT` (`utils/constants`) para conocer el estado del bundle.
  - `WORKER_BASE` (`utils/constants`) con `/bundle` para prefetchear datos.
  - `OLD_WEBAPP_URL` (`utils/constants`) como fallback legacy.
  - `REFRESH_ENDPOINT` (`utils/constants`) para despertar al worker de refresco.
  - `DASHBOARD_ROUTE` (`utils/constants`) para redirigir cuando todo está listo.
  - Registra `../../sw.js` (scope `../../`) para compatibilidad con la PWA original.

### `views/signupv2.refactor.html` — Alta de usuarios
- **JS principal:** `../js/features/signupv2.js` → depende de `utils/dom` y `utils/net`.
- **Hojas de estilo:** `../css/base.css`, `../css/signupv2.css`.
- **Endpoints / rutas:** definidos dentro de `CONFIG` del módulo.
  - `formAction`: Google Form que recibe la data cruda.
  - `statusEndpoint`: Apps Script que informa si la base fue procesada.
  - `imgbbEndpoint`: servicio de carga de avatares.
  - `formPublicUrl`: enlace público al formulario detallado.
  - `loginUrl`: reutiliza `loginv2.html` para volver al flujo principal.

### `views/formsintrov3.refactor.html` — Wizard gamificado
- **JS principal:** `../js/features/formsintrov2.js` → usa `utils/dom` (selectores, delegación) y `utils/net` (POST JSON).
- **Hojas de estilo:** `../css/base.css`, `../css/formsintrov2.css`.
- **Endpoints / rutas:**
  - `WORKER_URL`: worker de onboarding que guarda el payload completo.
  - `REDIRECT_URL`: envía al usuario a `loginv2.html?await=1` después del envío.
  - `https://rfullivarri.github.io/gamificationweblanding/indexv2.html`: fallback manual del HUD para reiniciar el recorrido.

## Utilidades JS disponibles
- `js/utils/dom.js` — Selectores seguros, delegación de eventos, helpers de foco y serialización de formularios.
- `js/utils/net.js` — Wrapper de `fetch` con timeout, POST JSON y reintentos.
- `js/utils/a11y.js` — Helpers para trap focus y anuncios aria-live.
- `js/utils/constants.js` — Endpoints compartidos por el flujo de login.

## Cómo probar una vista refactorizada
1. Abrí el archivo `.refactor.html` directo en el navegador (doble clic o `Live Server`).
2. Verificá que los enlaces sigan apuntando a las rutas originales (`signupv2.html`, `dashboardv3.html`, etc.).
3. Revisá la consola: no debe haber errores nuevos. Si aparece alguno, anotarlo en TODO.
4. Compará visualmente con la versión original para asegurar que la UI/UX no cambió.

## Convenciones de código
- Comentarios con tono sencillo, como si se lo explicáramos a alguien de 5 años.
- Archivos CSS con encabezado `/* ==========================================================================`.
- Módulos JS con encabezado detallando propósito, API pública, dependencias y notas de accesibilidad.
- Secciones largas en JS separadas por comentarios `// ===== [Bloque] =====` para ubicar rápidamente el código.

## Backlog priorizado
- **P0 — Service worker dedicado:** el login refactor registra `sw.js`, que sigue precacheando assets viejos (`css/loginv2.css`) y genera 404 en las vistas refactorizadas. Crear `sw.refactor.js` con un manifiesto propio y actualizar `wireServiceWorker()` para usarlo.
- **P1 — Centralizar endpoints compartidos:** `signupv2.js` y `formsintrov2.js` conservan URLs incrustadas. Moverlas a `utils/constants.js` (o un `config.refactor.json`) para versionarlas sin tocar cada módulo.
- **P2 — Dividir el wizard en submódulos:** `formsintrov2.js` supera las 800 líneas. Separar listas estáticas, helpers de XP y capa de envío en archivos individuales para facilitar pruebas y mantenibilidad.

## Resumen ejecutivo del refactor
- Vistas críticas (`landing`, `login`, `signup`, `wizard`) migradas a HTML modular con CSS/JS dedicados en `refactor/` sin tocar los originales.
- Utilidades compartidas (`dom`, `net`, `a11y`, `constants`) homogenizan la forma de seleccionar nodos, lanzar fetchs y anunciar estados accesibles.
- Flujo de autenticación replica la lógica legacy (polling, modales, PWA) pero con módulos claros y configuraciones centralizadas.
- Formularios (`signup`, `wizard`) envían datos a los endpoints productivos preservando IDs y timers, listos para pruebas A/B antes de reemplazar la versión pública.
