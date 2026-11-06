# Seguridad

## Clasificación de datos (AGENTS.md §8)

| Nivel | Ejemplos | Tratamiento |
|---|---|---|
| Público | Nombre de la institución, especialidades, horarios | Sin restricción |
| Confidencial | Nombre del paciente, teléfono, dirección, DPI | DPI enmascarado por defecto en la UI; no se escribe en logs |
| Restringido | Diagnósticos, resultados de laboratorio, datos de menores, VIH, salud mental | Toda lectura queda auditada; nunca se escribe en logs |

La UI muestra `EtiquetaClasificacion` en las secciones restringidas y una insignia
«Menor de edad» cuando corresponde. El DPI usa `DatoProtegido` con botón mostrar/ocultar.
Revelar el DPI **no** genera auditoría: es confidencial, no restringido (decisión 2 de la
fase 3).

## Usuarios y privilegios por motor

| Motor | Usuario de app | Privilegios | Verificación |
|---|---|---|---|
| PostgreSQL | `hospital_app` | `SELECT/INSERT/UPDATE` en `clinico.*`; `UPDATE/DELETE/TRUNCATE` revocados en `auditoria_acceso` y `eventos` | `pnpm verificar:privilegios` |
| MySQL | `odontologia_app` | `SELECT/INSERT` en toda la base; `UPDATE` tabla por tabla; sin `DELETE` ni DDL | `pnpm verificar:privilegios` |
| MongoDB | `laboratorio_app` | `readWrite` solo sobre `laboratorio`; sin `dbAdmin` ni `root` | `pnpm verificar:privilegios` |
| Redis | `pediatrico_app` | `+@all -@dangerous`; `FLUSHALL`, `CONFIG` y `KEYS` denegados | `pnpm verificar:privilegios` |

Evidencia local:

```text
==> PostgreSQL · hospital_app
   ✓ auditoría append-only: UPDATE denegado
   ✓ auditoría append-only: DELETE denegado
==> MySQL · odontologia_app
   ✓ auditoría append-only: UPDATE denegado
   ✓ auditoría append-only: DELETE denegado
==> MongoDB · laboratorio_app
   ✓ rol readWrite limitado a su base (sin dbAdmin ni root)
==> Redis · pediatrico_app
   ✓ FLUSHALL denegado por ACL
   ✓ CONFIG denegado por ACL
privilegios: mínimo por institución verificado
```

## Auditoría consultable

- Puerto de escritura `AuditLog` y puerto de lectura `ConsultaDeAuditoria` (decisión 1 de
  la fase 3: puerto nuevo, separado como `ExpedienteQueryService`).
- Endpoint `GET /pacientes/:pacienteId/auditoria` devuelve solo metadatos: actor, acción,
  recurso y fecha. Nunca el payload clínico.
- Panel «Accesos» en el expediente, con la bitácora ordenada de más reciente a más antigua.
- La lectura de la auditoría no se audita para no crear recursión: la bitácora no es un
  dato clínico restringido.

## Logs

- El filtro de errores registra solo el nombre de la clase, nunca el mensaje ni el payload.
- Un test intercepta `Logger` y falla si una llamada interpola campos restringidos:
  [`registro-seguro.spec.ts`](../../apps/api/src/infraestructura/http/registro-seguro.spec.ts).
- Los datos de prueba son 100 % sintéticos; `.env` e `infra/mongo/keyfile` están ignorados
  por git.
