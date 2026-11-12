# Plan de trabajo — HelpDesk Lite

Fuente de verdad funcional: `BUSINESS_RULES.md`.  
Alcance y reglas de la prueba: `README.md`.  
Notas de entrega: `SOLUTION_NOTES.md`.

**Criterio:** bugs críticos primero. Mejor menos cosas bien hechas que tocarlo todo sin criterio.  
**Commits:** `fix: <nº QA> <descripción breve>` (o `feat:` / `test:` según corresponda).

---

## P0 — Bugs críticos de funcionamiento

| QA | Estado | Problema | Notas |
|----|--------|----------|-------|
| 6 | ✅ Hecho | Consola saturada (polling sin cancelar) | `fix: 6 cancelar polling del detalle al salir` |
| 2 | ✅ Hecho | Errores invisibles (`boom` → “Cargando…” infinito) | Cubierto con el fix de #1 (loading + mensaje de error) |
| 3 | ✅ Hecho | Cambio de estado poco fiable (T-1007) | Espera al server; error visible; sin mutación optimista |
| 7 | ✅ Hecho | Tickets cerrados editables | Solo transiciones permitidas; reopen ≤ 7 días |

## P1 — Bugs funcionales

| QA | Estado | Problema | Notas |
|----|--------|----------|-------|
| 4 | ✅ Hecho | SLA incorrecto | Tabla, horario laborable, umbral ≥75 %, cerrados sin indicador |
| 5 | ✅ Hecho | Navegación Anterior / Siguiente | Resuelto con el fix de #6 (`paramMap` + `prevId`/`nextId` reactivos) |
| 1 | ✅ Hecho | Búsqueda inconsistente | `debounceTime` + `switchMap` |

## P2 — Funcionalidades obligatorias

| ID | Estado | Funcionalidad | Notas |
|----|--------|---------------|-------|
| A | ✅ Hecho | Filtros en la URL (`q`, `status`, `priority`) | URL como fuente de verdad; API filtra los 3 params |
| B | ✅ Hecho | Añadir comentario | Validación 10–500, no en `closed`, anti-doble envío, conservar texto si falla |

## P3 — Tests y documentación

| ID | Estado | Tarea | Notas |
|----|--------|-------|-------|
| T | ✅ Hecho | ≥3 tests útiles (uno de SLA) | SLA, transiciones, comentarios, filtros URL, mapeo API (~40 tests) |
| N | ⬜ Pendiente | Completar `SOLUTION_NOTES.md` | Decisiones, IA, deuda no arreglada |

## P4 — Bonus / deuda (solo si sobra tiempo)

| ID | Estado | Tarea |
|----|--------|-------|
| S | ✅ Hecho (sanitizado Angular) | XSS T-1002 — ver incidente abajo |
| Acc | ⬜ Opcional | Accesibilidad del listado |
| Store | ⬜ Opcional | Facade/store si aporta |
| Scale | ⬜ Documentar | Cómo escalar a 50.000 tickets |

### Incidente de seguridad — XSS en comentarios (T-1002)

- **No reportado por QA**; detectado al abrir el detalle (`BUSINESS_RULES.md` §4).
- **Síntoma:** consola con `⚠️ XSS ejecutado desde un comentario (T-1002)` y cambio de `document.title`.
- **Causa:** el fake-db incluye un `<img onerror="...">` y el detalle usaba `bypassSecurityTrustHtml`, desactivando el sanitizado de Angular.
- **Fix:** quitar el bypass; `[innerHTML]` usa el sanitizado nativo. Commit: `fix: seguridad evitar XSS en comentarios del detalle`.
- **Pendiente para SOLUTION_NOTES:** DOMPurify como endurecimiento futuro (allowlist más estricta).

---

## Orden de ataque sugerido

1. P0 restante: **2 → 3 → 7**
2. P1: **4 → 5 (verificar) → 1**
3. P2: **A → B**
4. P3: tests + `SOLUTION_NOTES.md`
5. P4 solo si queda tiempo

## Convención de commits

- Bugs QA: `fix: <nº> <descripción breve>`
- Features: `feat: <A|B> <descripción breve>`
- Tests: `test: <descripción breve>`
- Docs: `docs: <descripción breve>`
