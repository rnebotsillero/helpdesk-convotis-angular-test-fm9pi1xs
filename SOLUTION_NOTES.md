# Solution Notes

> Escribe con tus palabras. Respuestas concretas y referidas a ESTE proyecto valen más que explicaciones genéricas.

## 1. Problemas detectados

| # | Síntoma / problema | Causa raíz | ¿Arreglado? | Archivo(s) |
|---|--------------------|------------|-------------|------------|
| 1 | Búsqueda inconsistente al escribir rápido | Las búsquedas se lanzaban en paralelo al escribir; como cada respuesta tarda distinto, una petición antigua podía llegar después que una nueva y la lista se quedaba con esa respuesta vieja | Sí | `ticket-list.ts` |
| 2 | Errores invisibles / lista engañosa al fallar (`boom`) | No llegué a reproducir el “Cargando…” infinito; lo que sí vi es que al buscar un término nuevo no se borraban los tickets anteriores mientras cargaban los nuevos, así que si la búsqueda fallaba se mantenían los anteriores y daba una falsa sensación de respuesta correcta | Sí | `ticket-list.ts`, `ticket-list.html` |
| 3 | Cambio de estado poco fiable (T-1007) | Al actualizar el estado se cambiaba primero la UI antes de recibir la respuesta del servidor; si fallaba hacía como un rollback de estado, dando confusión al usuario sin ningún tipo de información | Sí | `ticket-detail.ts`, `ticket-detail.html` |
| 4 | SLA incorrecto | La tabla de horas de critical y high estaban intercambiadas, no se tenía en cuenta el horario laboral para la contabilidad del tiempo y los tickets cerrados seguían mostrando SLA cuando no correspondía | Sí | `sla.ts`, `ticket-row.ts`, `ticket-detail.html` |
| 5 | Anterior/Siguiente cambian la URL pero no el contenido | El id del ticket se leía únicamente una vez; al cambiar la ruta ese valor no se volvía a evaluar y no recargaba el ticket nuevo | Sí | `ticket-detail.ts`, `ticket-detail.html` |
| 6 | Consola saturada de peticiones `[fake-api]` | Se mantenía activo un `setInterval` que no se cerraba nunca cada vez que se accedía a un ticket (entiendo que para detectar cambios); esto se debe cancelar al salir de la vista del detalle | Sí | `ticket-detail.ts` |
| 7 | Tickets cerrados editables / transiciones libres | La UI permitía la transición de un estado a otros sin seguir las reglas de negocio de `BUSINESS_RULES.md`, incluido el poder reabrir solo si no han pasado más de 7 días | Sí | `status-transitions.ts`, `ticket-detail.ts`, `ticket-detail.html`, `tickets-api.ts` |

## 2. Problemas NO reportados por QA que has encontrado

- **XSS en comentarios (T-1002):** Al acceder al ticket se ejecutaba código del comentario. Se estaba usando `bypassSecurityTrustHtml`, quitando la seguridad nativa de Angular que evita justamente la inyección de código. Arreglado quitando el bypass (`ticket-detail.ts` / `.html`). Se podría añadir DOMPurify para un control más exhaustivo, pero no lo veo necesario en este proyecto.

## 3. Decisiones técnicas

Explica las 2–3 decisiones más importantes y qué alternativa descartaste en cada una.

1. **Reglas de negocio en dominio puro (`domain/`)**  
   Aislé las reglas de `BUSINESS_RULES` a funciones de dominio en `domain/` para un mejor control único, poder meter tests aislados y así que `ticket-list` y `ticket-detail` compartan las mismas lógicas sin duplicidades. Descarté mantener la lógica de negocio dentro de los componentes para evitar duplicidades, complicaciones a la hora de añadir tests y malas praxis: no se debería meter lógica de negocio dentro de componentes.

2. **Cancelar trabajo en vuelo (debounce + cancelación)**  
   Añadí un debounce al search para no sobrecargar la API con llamadas que el usuario no está buscando, y cancelo las peticiones anteriores para evitar errores de datos que confundan al usuario. Descarté lanzar un `subscribe` por cada tecla (o solo debounce sin cancelar): el debounce reduce ruido, pero sin cancelar la petición en curso una respuesta antigua todavía puede llegar tarde y pisar la lista. En el detalle, la misma idea: descarté el `setInterval` sin cleanup, que dejaba peticiones vivas al salir.

## 4. Gestión de estado

¿Dónde vive el estado de filtros, listado, detalle y formulario? ¿Por qué?

Los filtros viven en la URL porque así se mantienen al recargar y con el historial. El listado y el detalle guardan en signals de su componente lo que necesitan pintar (tickets, loading, ticket actual, errores). El formulario de comentario también es local al detalle. No metí un store global porque no aportaba con este tamaño de app.

## 5. Tests añadidos

| Test | Qué protege | Por qué lo elegiste |
|------|-------------|---------------------|
| `sla.spec.ts` | Tabla de horas, horario laborable, umbrales `ok` / `at_risk` / `breached`, cerrados sin indicador | El README pide al menos un test de SLA; es la regla más fácil de romper en silencio |
| `status-transitions.spec.ts` | Transiciones permitidas y reopen ≤ / > 7 días | Cubre el bug QA 7 y evita regresiones en la matriz de estados |
| `comments.spec.ts` | Longitud 10–500 (con trim), no comentar en `closed` | Protege feat B y las reglas de comentarios de BUSINESS_RULES |
| `ticket-filters.spec.ts` | Parseo de `q` / `status` / `priority` desde la URL | Asegura que feat A interpreta bien los query params |
| `tickets-api.spec.ts` | Mapeo snake_case → dominio y orden de comentarios | Evita bugs de fechas/`closedAt` y del orden cronológico |

Prioricé dominio y mapeo API frente a tests de componente: dan más cobertura de reglas de negocio con menos setup, y con el tiempo de la prueba era el mejor equilibrio.

## 6. Qué NO has hecho y por qué

- **Tests de componente** (listado/detalle): prioricé tests de dominio y mapeo API porque cubren las reglas de negocio con menos setup. Los de componente (mocks de HTTP, router, timers) los dejé para más adelante.
- **Anterior/Siguiente según el filtro de búsqueda:** hoy navegan por id secuencial (`T-N ± 1`), no por los resultados filtrados. Lo detecté; estoy esperando confirmación del responsable de si debe limitarse al resultado de la búsqueda antes de implementarlo.
- **DOMPurify:** con quitar `bypassSecurityTrustHtml` el sanitizado nativo de Angular ya evita el XSS de T-1002. DOMPurify sería un control más exhaustivo (allowlist), pero no lo vi necesario en el alcance de este proyecto.

## 7. Uso de IA

- Herramienta(s): Cursor (asistente en el IDE).
- Para qué la usaste: diagnosticar bugs a partir de los síntomas de QA, proponer y aplicar fixes, extraer lógica a dominio, escribir tests y redactar estas notes paso a paso para dar exactitud de archivos y ayudarme a señalizar los cambios realizados.
- Una sugerencia de la IA que descartaste o corregiste, y por qué: en el XSS planteó usar DOMPurify; lo descarté porque quitando `bypassSecurityTrustHtml` el sanitizado nativo de Angular ya cubría el caso. También en el QA 2 no me limité al “Cargando infinito” (no lo reproduje) y corregí el enfoque a vaciar la lista cuando falla o cambia la búsqueda, que era el problema real que sí veía.

## 8. Con un día más...

Con un día más habría añadido Anterior/Siguiente según los resultados filtrados de la búsqueda (no por id secuencial), junto con un store/caché del listado filtrado para no repetir llamadas ya hechas y poder navegar entre esos ids. También habría mejorado la accesibilidad del listado y cerrado con tests de componente del detalle/listado.
