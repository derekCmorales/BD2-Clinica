# Correcciones a partir de la retroalimentación de Entrega I

> **Redacción del estudiante — 3.4.** El estudiante redacta la narrativa de qué se corrigió
> y por qué. Los cambios técnicos ya implementados son:

| Corrección | Dónde |
|---|---|
| `$jsonSchema` de Mongo usaba `const`, palabra no soportada; se reemplazó por `enum` y se alineó con el catálogo | `apps/api/src/infraestructura/mongo/migrations/001_esquema.js`, `002_examenes_catalogo.js` |
| MySQL otorgaba `ALL PRIVILEGES` por el entrypoint; se redujo a DML mínimo y auditoría append-only | `apps/api/src/infraestructura/mysql/migrations/002_privilegios.sql` |
| `chk_pieza_fdi` aceptaba 19, 20, 29, 30, 39 y 40; ahora valida cuadrante 1–4 y posición 1–8 | `apps/api/src/infraestructura/mysql/migrations/003_check_fdi.sql` |
| PostgreSQL no tenía event store ni exclusión de citas; se agregaron `clinico.eventos` y `citas_sin_solape` | `apps/api/src/infraestructura/postgres/migrations/003_event_store.sql` |
| Redis sustituyó a Firebase para el centro pediátrico (pendiente de autorización del catedrático) | `docker-compose.yml`, `AGENTS.md` §3 |
| La UI duplicaba los campos de examen; ahora los consume del catálogo | `apps/web/src/Hoja.tsx`, `GET /catalogos/examenes` |
