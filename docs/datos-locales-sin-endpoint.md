# Datos locales sin consumo de backend y endpoints sugeridos

> Todos los valores listados a continuación están hardcodeados en el front. Para cumplir el requisito de que provengan de GETs del backend se proponen endpoints REST (nombres orientativos) que entreguen exactamente los mismos catálogos.

## Editor de BBDD (`index-bbdd.html`)
- **Pilares, rasgos y dificultades**: `PILARES_OPTS`, `RASGOS_POR_PILAR` y `DIFICULTAD_OPTS` alimentan los selects del editor sin consultar al servidor. 【F:js/bbdd.js†L3-L16】
  - *Propuesta:* `GET /api/catalogs/foundations` que devuelva `{ pillars: [...], traits: {...}, difficulties: [...] }`.
- **Combinación de rasgos (`RASGOS_COMBO`)**: se recalcula localmente para autocompletar, pero depende del mismo catálogo fijo. 【F:js/bbdd.js†L15-L16】
  - *Propuesta:* incluir el mismo array en la respuesta anterior (`combo_labels`).

## Wizard de onboarding (`formsintrov3.html`)
- **Listas LOW/CHILL/FLOW/EVOLVE y Foundations**: las opciones de micro-acciones, motivaciones, obstáculos, compromisos y foundations provienen de `FORM_LABELS` / `LISTS` sin llamada externa. 【F:js/formsintrov2.js†L1-L215】
  - *Propuesta:* `GET /api/onboarding/options` que entregue los mismos bloques, por ejemplo `{ low: {...}, chill: {...}, flow: {...}, foundations: {...} }`.
- **Mapeo de modos a etiquetas**: `MODE_LABELS` replica el texto oficial del formulario; hoy vive en el JS. 【F:js/formsintrov2.js†L110-L115】
  - *Propuesta:* incluir `modes` en el endpoint anterior o exponer `GET /api/catalogs/modes` reutilizable en otras vistas.
- **Reglas de XP**: los multiplicadores están codificados (+13 XP por checklist, +21 XP por texto abierto) y no se consultan. 【F:js/formsintrov2.js†L364-L539】
  - *Propuesta:* `GET /api/onboarding/xp-rules` que especifique `{ checklist: 13, open_answer: 21, ... }` para mantener consistencia con el backend.

## Catálogos globales documentados
- **Game modes, micro-acciones y taxonomías**: el archivo `docs/catalogos-globales.md` lista modos, pilares, rasgos, motivaciones, obstáculos y dificultades que coinciden con la UI, pero no se sirven vía API. 【F:docs/catalogos-globales.md†L1-L140】
  - *Propuesta:* consolidar todo en `GET /api/catalogs/global` o dividir en recursos (`/api/catalogs/game-modes`, `/api/catalogs/micro-actions`, `/api/catalogs/traits`) según consumo.

Garantizar estos endpoints permitirá que cualquier ajuste futuro se orqueste desde el backend sin editar múltiples archivos estáticos.
