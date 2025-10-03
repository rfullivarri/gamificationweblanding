# Inventario de TODOs / FIXME / NOTES

| Archivo | Línea | Texto | Tipo | Riesgo | Acción recomendada |
| --- | --- | --- | --- | --- | --- |
| js/features/login.js | 437 | usar sw.refactor.js en Lote 4 | TODO | P0 | Coordinar migración del service worker original a la versión refactorizada garantizando mismo scope. |
| js/features/signupv2.js | 277 | mover a constantes compartidas los IDs entry.* si se reutilizan en otro flujo | TODO | P1 | Revisar futuros flujos que usen los mismos IDs y crear constantes en utils/constants. |
| js/features/formsintrov2.js | 889 | dividir el módulo en submódulos (HUD, rutas, envío) para seguir limpiando responsabilidades | TODO | P2 | Planificar refactor por etapas separando responsabilidades en archivos dedicados. |
| css/dashboardv3.css | 929 | OVERRIDE: que entre TODO sin scroll ni recortes | NOTE | P2 | Mantener monitoreo visual; si se cambia layout revisar que las tarjetas sigan entrando sin overflow. |

## TODOs resueltos en esta corrida
- Ninguno (solo se documentaron y referenciaron los pendientes).
