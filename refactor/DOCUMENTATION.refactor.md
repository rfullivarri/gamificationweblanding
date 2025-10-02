# Mapa inicial de la carpeta `refactor/`

> Esta guía explica cómo navegar la "carpeta sombra" sin modificar los archivos originales.

## Vistas
- `views/indexv2.refactor.html` — Landing principal. Usa `css/stylesv3.css` para visuales y `js/features/landing.js` para el carrusel accesible.
- `views/loginv2.refactor.html` — Portal de acceso. Usa `css/layout.css` y el módulo `js/features/login.js`.
- `views/index-bbdd.refactor.html` — Editor BBDD compacto con overlay. Depende de `css/bbdd.css` y `js/features/bbdd.js`.
- `views/offline.refactor.html` — Pantalla offline reducida que comparte paleta con la vista BBDD.

## Utilidades JS
- `js/utils/dom.js` — Selectores seguros, escucha de eventos y helpers para manipular atributos sin repetir código.
- `js/utils/net.js` — Capa muy simple sobre `fetch` para llamadas JSON con timeouts.
- `js/utils/a11y.js` — Rutinas para foco, anuncios en `aria-live` y ayuda de accesibilidad.
- `js/utils/constants.js` — Endpoints, claves de almacenamiento y flags compartidos.

## Cómo probar una vista refactorizada
1. Abrí el archivo `.refactor.html` directo en el navegador (doble clic o `Live Server`).
2. Verificá que los enlaces sigan apuntando a las rutas originales (`signupv2.html`, `dashboardv3.html`, etc.).
3. Revisá la consola: no debe haber errores nuevos. Si aparece alguno, anotarlo en TODO.
4. Compará visualmente con la versión original para asegurar que la UI/UX no cambió.

### Manifest + Service Worker refactor
- `manifest.refactor.json` replica el manifiesto sin tocar `manifest.json`. Para probarlo, cargá la vista refactor desde un servidor local y, en DevTools → Application → Manifest, usá “Update on reload” y forzá el campo `Start URL` a `refactor/views/index-bbdd.refactor.html`.
- `sw.refactor.js` se registra automáticamente al cargar `index-bbdd.refactor.html` gracias al módulo `js/features/bbdd.js`. Si querés probar otra variante, desregistrá con `navigator.serviceWorker.getRegistration()?.unregister()` y volvé a registrar manualmente con `navigator.serviceWorker.register('/refactor/sw.refactor.js', { scope: '/' })`.

## Convenciones
- Comentarios con tono sencillo, como si se lo explicáramos a alguien de 5 años.
- Archivos CSS con encabezado `/* ==========================================================================`.
- Módulos JS con encabezado detallando propósito, API pública, dependencias y notas de accesibilidad.

Más vistas y módulos se irán sumando en los siguientes lotes.
