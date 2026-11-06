# Design

## Context

Cada adaptador ya persiste auditoría append-only: tabla `auditoria_acceso` (Postgres, MySQL),
colección `auditoria` (Mongo), stream `auditoria:{pacienteId}` (Redis).

## Goals / Non-Goals

**Goals:** consultar la bitácora por paciente desde la UI sin exponer datos restringidos.
**Non-Goals:** búsqueda global de auditoría, exportación, alertas.

## Decisions

### Decisión 1 — ¿Dónde vive la lectura de auditoría? `[DECISIÓN DEL ESTUDIANTE]`

| Opción | Consecuencia |
|---|---|
| A. Ampliar `AuditLog` con `porPaciente()` | Un puerto con escritura y lectura; simple; mezcla responsabilidades |
| B. Puerto nuevo `ConsultaDeAuditoria` | Separa CQRS igual que `ExpedienteQueryService`; un archivo más por motor |
| C. Incluirla en `ExpedienteVistaDTO` | Cero endpoints nuevos; infla cada lectura del expediente y audita la lectura de la auditoría |

### Decisión 2 — ¿Revelar el DPI se audita? `[DECISIÓN DEL ESTUDIANTE]`

El DPI es confidencial, no restringido. Auditarlo es más estricto que lo exigido;
no auditarlo mantiene la regla tal cual está escrita en §8.

## Risks / Trade-offs

- [Riesgo] Leer la auditoría es en sí un acceso: definir si genera entrada (recursión acotada a 1 nivel).
- [Riesgo] En Redis, `XRANGE` sobre un stream largo: limitar con `COUNT`.
