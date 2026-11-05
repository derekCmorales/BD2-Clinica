# Design

## Context

Compose ya levanta los cuatro motores con usuarios de privilegio mínimo y puertos fuera de los default.

## Goals / Non-Goals

**Goals:** un solo archivo de escenarios, cero `if` por motor en los tests.
**Non-Goals:** mocks de drivers; Testcontainers (Compose ya existe).

## Decisions

- Proyecto Jest separado (`unit` vs `contrato`) para que `pnpm test` siga sin Docker.
- Aislamiento por test: `pacienteId` aleatorio por caso en lugar de truncar tablas (el usuario de app no tiene `DELETE`, y así debe seguir).
- El test de concurrencia solo **observa** el resultado (`ConflictoDeConcurrencia` en la segunda escritura). Cómo lo garantiza cada motor es decisión del estudiante y ya está implementado; el test no prescribe el mecanismo.

## Risks / Trade-offs

- [Riesgo] Mongo necesita replica set listo: esperar `rs.status().ok` antes de correr.
- [Trade-off] Tests más lentos (~10–20 s); se corren en CI y antes de entregar, no en cada guardado.
