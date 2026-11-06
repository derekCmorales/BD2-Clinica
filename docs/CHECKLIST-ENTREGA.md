# Checklist de entrega final — Entrega II

Se marca solo con evidencia (comando que pasa, archivo o captura). Lo ejecuta el agente
de cierre (`openspec/GOAL-CIERRE.md`) y lo revisa el estudiante.

## A. Enunciado (LINEAMIENTOS.md · Entrega II)

- [x] Aplicación funcional cliente-servidor con los 4 motores (`PERSISTENCIA=motores`) — `pnpm demo`; `pnpm e2e:motores` 14/14
- [x] Conexión cliente-servidor (web → API → motor según JWT) — `apps/web/src/api.ts`, `apps/web/vite.config.ts`, `apps/api/src/infraestructura/http/sesion.controller.ts`
- [x] Modelado corregido según retroalimentación de Entrega I — `docs/entrega-2/07-correcciones-entrega-1.md`; migraciones `postgres/003`, `mysql/002-004`, `mongo/001-002`
- [x] Consultas equivalentes en los 4 motores (suite de contrato, fase 4) — `pnpm test:contrato` 35/35; `docs/entrega-2/evidencia-contrato.md`
- [x] Modelo documental Mongo/Redis: embeber vs referenciar justificado (fase 8) — `docs/entrega-2/05-embeber-vs-referenciar.md` y `02-modelado-por-motor.md` (tablas técnicas; justificación 3.2 pendiente del estudiante)
- [x] UI ordenada e idéntica para los 4 motores (fases 1–2 ✓, e2e fase 7) — `docs/design-system/README.md`; `docs/entrega-2/capturas/`
- [x] Registro de paciente nuevo (e2e ×4) — `e2e/pruebas/flujo-clinico.spec.ts`
- [x] Mantenimiento: consultas, diagnósticos, tratamientos, recetas (e2e ×4) — `e2e/pruebas/flujo-clinico.spec.ts`; `apps/api/src/aplicacion/`
- [x] Archivo/desactivación con motivo (e2e ×4) — `e2e/pruebas/flujo-clinico.spec.ts`; `apps/api/src/aplicacion/archivar-expediente.ts`
- [x] Enrutamiento por usuario sin reescribir la lógica (e2e de aislamiento) — `apps/api/src/infraestructura/routing/enrutador-de-motor.ts`; `e2e/pruebas/aislamiento.spec.ts`
- [x] Documento comparativo: modelado, consistencia, seguridad, justificación por motor — `docs/entrega-2/ENTREGA-II.html` (justificación 3.1 pendiente del estudiante)

## B. Reglas de AGENTS.md

- [x] `pnpm verificar:arquitectura` verde (dominio sin infraestructura) — comando verde
- [x] Ningún `if` por institución/motor en `aplicacion/` — el enrutamiento vive en `infraestructura/routing/enrutador-de-motor.ts`
- [x] Cada `guardar()` documenta su estrategia de consistencia en el código — comentarios en los cuatro adaptadores; `docs/entrega-2/03-consistencia.md`
- [x] Ningún dato restringido en logs (test de fase 3) — `apps/api/src/infraestructura/http/registro-seguro.spec.ts`
- [x] Todo acceso restringido auditado y consultable (fase 3) — `GET /pacientes/:id/auditoria`; panel «Accesos»; `e2e` flujo
- [x] Usuarios de BD con privilegio mínimo, uno por institución — `pnpm verificar:privilegios` (Postgres, MySQL, Mongo, Redis)
- [x] Redis: AOF `everysec` + RDB y trade-off de 1 s documentado — `docker-compose.yml`; `docs/entrega-2/08-limitaciones.md`
- [x] Datos 100 % sintéticos; sin secretos versionados (`.env` ignorado) — seeds de los 4 motores; `.gitignore`
- [x] Nada fuera de alcance (Kafka, gRPC, sagas, Firebase, K8s) — sin dependencias ni código de esos sistemas

## C. Decisiones del estudiante (no las toma un agente)

- [x] Fase 3 · dónde vive la lectura de auditoría; ¿revelar DPI se audita? — decidido: puerto nuevo `ConsultaDeAuditoria`; el DPI no se audita
- [x] Fase 5 · forma del proyector (A síncrono / B asíncrono / C híbrido) e idempotencia — decidido: A síncrono, sin stream; reconstrucción desde `clinico.eventos`
- [x] Fase 6 · campos por tipo de examen y ubicación del catálogo — decidido: conjunto completo, antibiograma embebido, catálogo constante en dominio
- [ ] Fase 8 · redacción de justificaciones, embeber vs referenciar y hallazgos — **pendiente: la redacta el estudiante** (3.1–3.4)

## D. Calidad y CI

- [x] `pnpm test` (unitarias) verde — 3 suites, 15 tests
- [x] `pnpm test:contrato` verde en los 4 motores — 35/35; `docs/entrega-2/evidencia-contrato.md`
- [x] `pnpm e2e:motores` verde ×4 instituciones, desktop y móvil — 14/14; `e2e/reporte/`
- [x] axe sin violaciones serias/críticas — `revisarAccesibilidad` en ingreso, censo, pestañas y diálogos
- [x] `pnpm build` verde — API + web
- [ ] GitHub Actions verde en el último commit — pendiente del push/PR

## E. Empaquetado

- [x] `pnpm demo` levanta todo desde un clon limpio — `scripts/demo.sh` (prepara `.env`, keyfile, migra, siembra, API y web)
- [x] Seeds ricos (archivado, menor, dosis vencida, 3 tipos de examen, odontograma con estados) — `postgres/seeds/001_demo.sql`, `mysql/seeds/001_demo.sql`, `mongo/seeds/001_demo.js`, `apps/api/scripts/seed-redis.mjs`
- [x] README de entrega + guion de demo de 10 min — `README.md`; `docs/entrega-2/11-guion-demo.md`
- [x] Matriz de cobertura Entrega II con enlaces a evidencia — `docs/entrega-2/10-matriz-cobertura.md`
- [ ] `openspec list` sin changes activos (todo archivado) y `openspec validate --all` verde — **bloqueado por la redacción de fase 8**
- [ ] Tag `entrega-2` — **no se crea sin confirmación del estudiante**
