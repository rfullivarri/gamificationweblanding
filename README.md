# Gamification Web Landing

## Resumen Ejecutivo
- `indexv2.html` entrega la landing “Innerbloom” con secciones de overview, modos, features, testimonios, FAQ y CTA hacia signup/login.
- `signupv2.html` + `js/signupv2.js` componen el alta con carga opcional de avatar y polling al Apps Script antes de redirigir al login.
- `formsintrov3.html` guía al usuario por el journey inicial sumando XP y genera el payload enviado al worker de onboarding.
- `loginv2.html` verifica el estado de la base vía worker/WebApp, muestra modales await/not-found y lleva al dashboard cuando está listo.
- `dashboardv3.html` consume el bundle del worker, pinta métricas, notificaciones, panel de rachas y scheduler, apoyado por los módulos en `js/`.
- `index-bbdd.html` + `js/bbdd.js` ofrecen la edición detallada de hábitos con controles móviles y soporte de IA.
- PWA: `manifest.json` define la app “GJ” y `sw.js` precachea la shell aplicando estrategia network-first para HTML.

## Inventario de archivos raíz

| Archivo | Tipo | Acción sugerida | Resumen (≤140) | Interacciones |
|---------|------|-----------------|----------------|---------------|
| README.md | Markdown | Mantener | Inventario técnico y roadmap de refactor para la landing gamificada. | — |
| dashboardv3.html | HTML + JS inline | Refactorizar | Dashboard SPA con métricas, energía, misiones y popups; inicializa panel rachas y worker. | css/dashboardv3.css, css/panel-rachas.overrides.css, css/popups.css, js/dashboardv3.js, js/scheduler-controller.js, js/noti-client.js, js/panel-rachas.js, js/popups.js, sw.js, manifest.json |
| formsintrov3.html | HTML + JS inline | Refactorizar | Wizard gamificado para captar base inicial y XP; construye payload y envía onboarding al worker. | css/formsintrov2.css, loginv2.html |
| index-bbdd.html | HTML + CSS/JS inline | Refactorizar | Editor responsivo de BBDD con UI glassmórfica, helpers móviles y extensión de aiApplyResults. | js/bbdd.js, dashboardv3.html, manifest.json |
| indexv2.html | HTML + JS inline | Refactorizar | Landing Innerbloom con secciones de modos, features, testimonios y carrusel accesible. | css/stylesv3.css, formsintrov3.html, loginv2.html, signupv2.html |
| loginv2.html | HTML + CSS/JS inline | Refactorizar | Pantalla login con estilo glass, modales await/not-found y flujo polling hacia dashboard worker. | sw.js, manifest.json, dashboardv3.html, signupv2.html, indexv2.html |
| offline.html | HTML + CSS inline | Refactorizar | Página offline mínima que enlaza dashboard en caché y reutiliza CSS principal. | css/dashboardv3.css, dashboardv3.html |
| signupv2.html | HTML puro | Ordenar en bloques | Formulario de alta con avatar opcional y modal de estado; delega lógica a signupv2.js. | css/signupv2.css, js/signupv2.js, indexv2.html, loginv2.html, formsintrov3.html |
| sw.js | JS puro | Ordenar en bloques | Service worker que precachea shell, aplica network-first para HTML y stale-while-revalidate para assets. | loginv2.html, dashboardv3.html, index-bbdd.html, offline.html, css/dashboardv3.css, css/bbdd.css, js/dashboardv3.js, js/scheduler-controller.js, js/scheduler-modal.js, js/scheduler-api.js, js/bbdd.js |
| manifest.json | JSON | Ordenar en bloques | Manifest PWA que inicia en loginv2, define colores y assets maskable. | loginv2.html, dashboardv3.html, icons/ |

## Carpeta `js/`

| Archivo | Tipo | Acción sugerida | Resumen (≤140) | Interacciones |
|---------|------|-----------------|----------------|---------------|
| bbdd.js | JS puro | Ordenar en bloques | Renderiza y sincroniza la tabla de hábitos: fetch API, drag-drop, banderas AI y confirmaciones. | index-bbdd.html, dashboardv3.html, API Worker BBDD |
| dashboardv3.js | JS puro | Ordenar en bloques | Carga bundle del worker, pinta métricas, maneja flags locales y emite eventos de estado. | dashboardv3.html, js/scheduler-controller.js, js/panel-rachas.js, js/popups.js, sw.js |
| formsintrov2.js | JS puro | Ordenar en bloques | Versión JS del journey form: rutas por modo, toasts XP y builder de payload GJPayload. | formsintrov3.html, onboarding worker |
| noti-client.js | JS puro | Ordenar en bloques | Cliente ligero que sincroniza notificaciones del worker, cachea local y maneja dropdown. | dashboardv3.html, meta gj-worker-base |
| panel-rachas.js | JS puro | Ordenar en bloques | Componente global para panel de rachas con filtros, barras semanales y adaptadores de datos. | dashboardv3.html, css/panel-rachas.overrides.css |
| popups.js | JS puro | Ordenar en bloques | Gestiona popups gamificados: historial visto, estilos recap, confeti y ACK al backend. | dashboardv3.html, css/popups.css, POPUPS_API |
| scheduler-api.js | JS puro | Ordenar en bloques | API helper del scheduler: Workers, mark_first_programmed y carga de contexto usuario. | js/scheduler-controller.js, dashboardv3.js |
| scheduler-controller.js | JS puro | Ordenar en bloques | Orquesta el modal scheduler: obtiene contexto, guarda programación y sincroniza UI/dots. | js/scheduler-modal.js, js/scheduler-api.js, dashboardv3.html |
| scheduler-modal.js | JS puro | Ordenar en bloques | Web component `<scheduler-modal>` con layout, inputs y eventos open/save/pause/test. | js/scheduler-controller.js |
| signupv2.js | JS puro | Ordenar en bloques | Gestiona alta: sube avatar a ImgBB, envía Google Form y pollinga estado para redirigir. | signupv2.html, formsintrov3.html, loginv2.html, Google Form |

## Carpeta `css/`

| Archivo | Tipo | Acción sugerida | Resumen (≤140) | Interacciones |
|---------|------|-----------------|----------------|---------------|
| bbdd.css | CSS puro | Ordenar en bloques | Hoja canónica del editor BBDD: tokens glass, columnas sticky y tablas accesibles. | index-bbdd.html, sw.js |
| dashboardv3.css | CSS puro | Ordenar en bloques | Estilos del dashboard: header sticky, columnas flex, cards glass y charts temáticos. | dashboardv3.html, offline.html |
| formsintrov2.css | CSS puro | Ordenar en bloques | Define HUD fijo, tarjetas hero y chips checklist para el journey onboarding. | formsintrov3.html |
| panel-rachas.overrides.css | CSS puro | Ordenar en bloques | Overrides para integrar panel de rachas al dashboard: tokens glass y grids responsivas. | dashboardv3.html, js/panel-rachas.js |
| popups.css | CSS puro | Ordenar en bloques | Estilos del overlay de popups con blur, CTA animado, confeti y layout responsive. | dashboardv3.html, js/popups.js |
| signupv2.css | CSS puro | Ordenar en bloques | Estiliza signup glass con grid responsiva, modal de estado y spinner reutilizable. | signupv2.html |
| stylesv3.css | CSS puro | Ordenar en bloques | Hoja de la landing: nav sticky, hero con glows, grids de cards y timeline de pasos. | indexv2.html |

## Flujo sugerido
1. **Descubrimiento:** La landing presenta el producto, modos de juego y llamadas a crear cuenta o iniciar sesión.
2. **Signup:** El formulario envía datos al Google Form, sube el avatar y monitorea el procesamiento antes de confirmar al usuario.
3. **Journey inicial:** El wizard recopila preferencias, calcula XP y envía el payload al worker de onboarding.
4. **Login:** Se consulta el estado de la base (ready / pending / not found) y se redirige al dashboard cuando corresponde.
5. **Dashboard:** Se renderiza la experiencia gamificada (XP, energía, radar, misiones, notificaciones, scheduler) usando datos del worker.
6. **Edición de hábitos:** Desde el dashboard se accede al editor BBDD con controles drag & drop, AI helpers y confirmación de cambios.

## Capacidades PWA
- `manifest.json` fija start_url, tema y assets maskable para instalación como app.
- `sw.js` precachea HTML, CSS y JS clave, maneja fallback offline y actualiza cachés obsoletos.
- Las vistas principales registran el service worker y exponen metadatos de instalación en el login.

## Desarrollo y siguientes pasos
- Modularizar los archivos HTML con JS inline para facilitar mantenimiento y pruebas.
- Agrupar estilos reutilizables en utilidades compartidas y documentar tokens visuales.
- Mantener sincronizados `sw.js` y `manifest.json` al renombrar rutas o assets.
- Completar la documentación técnica de los workers y endpoints externos usados (Google Forms, Apps Script, POPUPS_API).

