# Proposal

## Why

AGENTS.md §8 exige tres niveles de clasificación y auditoría de todo acceso a datos
restringidos. Hoy la auditoría se escribe (puerto `AuditLog`, append-only en los cuatro
motores) pero **no se puede consultar**: el evaluador no tiene forma de ver «quién, qué,
cuándo» desde la aplicación. La clasificación tampoco se mostraba en la UI.

## What Changes

- UI (ya implementado en fases 1–2): etiquetas `Confidencial` / `Restringido`, DPI
  enmascarado por defecto, insignia «Menor de edad».
- Nuevo puerto de lectura `consultarAuditoria(pacienteId)` y endpoint
  `GET /pacientes/:pacienteId/auditoria` (solo metadatos: actor, acción, recurso, fecha;
  nunca payload).
- Pestaña o panel «Accesos» en la cabecera del expediente con la bitácora.
- Revelar el DPI genera entrada de auditoría `lectura/dpi` (opcional, ver Decisión 2).
- Verificación automatizada: ningún log contiene campos restringidos (test que intercepta `Logger`).

**Fuera de alcance:** roles y permisos por usuario (RBAC), cifrado a nivel de campo.

## Capabilities

### New Capabilities
- `seguridad-visible`: clasificación de datos en la UI y consulta de la bitácora de auditoría.

### Modified Capabilities

## Impact

- `dominio/puertos/audit-log.ts` (nuevo método de lectura), los cuatro adaptadores, `pacientes.controller.ts`, cliente web.
- Usuarios de BD: el usuario de app ya tiene SELECT sobre auditoría en Postgres/MySQL; revisar Mongo y ACL de Redis.
