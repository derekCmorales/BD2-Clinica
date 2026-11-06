# Matriz de cobertura — Entrega II

| Resultado esperado (LINEAMIENTOS) | Evidencia |
|---|---|
| Aplicación funcional | `pnpm e2e:rapido` (14/14) y `pnpm e2e:motores` (14/14); capturas en `capturas/` |
| Conexión cliente-servidor | [`apps/web/src/api.ts`](../../apps/web/src/api.ts), [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts), [`sesion.controller.ts`](../../apps/api/src/infraestructura/http/sesion.controller.ts) |
| Modelado corregido según retroalimentación | [`07-correcciones-entrega-1.md`](07-correcciones-entrega-1.md); migraciones `postgres/003`, `mysql/002-004`, `mongo/001-002` |
| Consultas equivalentes en los 4 motores | `pnpm test:contrato` → [`evidencia-contrato.md`](evidencia-contrato.md) (35 escenarios) |
| Modelo documental Mongo/Redis justificado | [`05-embeber-vs-referenciar.md`](05-embeber-vs-referenciar.md), [`02-modelado-por-motor.md`](02-modelado-por-motor.md) |
| UI ordenada e idéntica para los 4 motores | [`docs/design-system/README.md`](../design-system/README.md); `e2e/pruebas/flujo-clinico.spec.ts` ×4 |
| Registro de paciente nuevo | `e2e/pruebas/flujo-clinico.spec.ts`; [`crear-paciente-nuevo.ts`](../../apps/api/src/aplicacion/crear-paciente-nuevo.ts) |
| Mantenimiento: consultas, diagnósticos, tratamientos, recetas | `e2e` flujo ×4; `aplicacion/registrar-consulta.ts`, `agregar-diagnostico.ts`, `recetar-medicamento.ts`, `casos-seguimiento.ts` |
| Archivo/desactivación con motivo | `e2e` flujo ×4; [`archivar-expediente.ts`](../../apps/api/src/aplicacion/archivar-expediente.ts) |
| Enrutamiento por usuario sin reescribir lógica | [`enrutador-de-motor.ts`](../../apps/api/src/infraestructura/routing/enrutador-de-motor.ts); `e2e/pruebas/aislamiento.spec.ts` |
| Documento comparativo | [`ENTREGA-II.html`](ENTREGA-II.html) / [`README.md`](README.md) |

## Reglas de AGENTS.md

| Regla | Evidencia |
|---|---|
| `dominio/` sin infraestructura | `pnpm verificar:arquitectura` |
| Sin `if` por institución/motor en `aplicacion/` | revisión de `apps/api/src/aplicacion/`; el enrutamiento vive en `infraestructura/routing/` |
| Cada `guardar()` documenta su estrategia | comentarios de los cuatro adaptadores + [`03-consistencia.md`](03-consistencia.md) |
| Ningún dato restringido en logs | `registro-seguro.spec.ts` |
| Acceso restringido auditado y consultable | `GET /pacientes/:id/auditoria`, panel «Accesos», `e2e` |
| Privilegios mínimos por institución | `pnpm verificar:privilegios` |
| Redis AOF `everysec` + RDB y trade-off de 1 s | `docker-compose.yml`, [`08-limitaciones.md`](08-limitaciones.md) |
| Datos sintéticos, sin secretos versionados | seeds de los 4 motores; `.env` e `infra/mongo/keyfile` en `.gitignore` |
| Nada fuera de alcance | sin Kafka, gRPC, sagas, Firebase ni Kubernetes |

## Calidad y CI

| Ítem | Evidencia |
|---|---|
| `pnpm test` | 3 suites, 15 tests |
| `pnpm test:contrato` | 35/35 |
| `pnpm e2e:motores` | 14/14, escritorio y móvil |
| axe sin violaciones serias/críticas | `revisarAccesibilidad` en ingreso, censo, pestañas y diálogos |
| `pnpm build` | API + web |
| GitHub Actions | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |

## Pendiente de confirmación

- Tag `entrega-2`: se crea solo con confirmación del estudiante.
