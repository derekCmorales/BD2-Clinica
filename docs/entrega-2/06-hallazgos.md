# Hallazgos comparativos y conclusiones

| # | Hallazgo | Motor(es) | Evidencia |
|---|---|---|---|
| 1 | La consistencia fuerte no es exclusiva de SQL, pero el mecanismo y el costo cambian: eventos + `UNIQUE`, `FOR UPDATE`, filtro por `version` y Lua atómico resuelven el mismo problema con distinta maquinaria | PostgreSQL, MySQL, MongoDB, Redis | `pnpm test:contrato`; `03-consistencia.md` |
| 2 | El modelo documental gana cuando la estructura varía: el catálogo por tipo y `$jsonSchema` hacen explícita la diferencia entre hematología, orina y cultivo; un EAV relacional sería peor | MongoDB | `GET /catalogos/examenes`; migración `002_examenes_catalogo.js` |
| 3 | Redis es un sistema de registro legítimo para acceso por clave conocida, pero no sustituye un motor analítico: la ausencia de consultas ad-hoc es una limitación real, no un detalle | Redis | `08-limitaciones.md`; `ZRANGEBYSCORE` de vacunas |
| 4 | La UI puede ser idéntica en los cuatro motores si los puertos hablan el lenguaje del dominio; el motor es una etiqueta, no un tema visual | Todos | `docs/design-system/README.md`; capturas `capturas/` |
| 5 | La seguridad no es solo cifrado: privilegios mínimos, auditoría append-only y no escribir datos restringidos en logs son controles igual de importantes y verificables | Todos | `pnpm verificar:privilegios`; `registro-seguro.spec.ts`; panel «Accesos» |
| 6 | CQRS no obliga a consistencia eventual: el proyector síncrono en la misma transacción mantiene el read model fuerte y elimina el stream sin consumidor | PostgreSQL | `03-consistencia.md`; `pnpm hospital:reproyectar` |
| 7 | El costo operativo también es un criterio de modelado: MySQL es el más simple de operar, PostgreSQL el más exigente, MongoDB necesita replica set y Redis necesita persistencia configurada | Todos | `docker-compose.yml`; `01-asignacion-motores.md` |

## Conclusión

La comparación no produce un «motor ganador». Produce un mapa de trade-offs: el Hospital
paga complejidad operativa por trazabilidad; la Clínica paga menos capacidades por
operabilidad; el Laboratorio paga una lectura adicional por flexibilidad estructural; el
Pediátrico paga una ventana de pérdida de 1 s y la falta de consultas ad-hoc por latencia
y acceso por clave. La arquitectura hexagonal permitió que esa decisión fuera de
infraestructura: los casos de uso y la UI no cambiaron entre motores.

## Evidencia disponible para citar

- [`evidencia-contrato.md`](evidencia-contrato.md) — 35 escenarios verdes por motor,
  incluida la escritura concurrente y la reconstrucción del read model.
- [`capturas/`](capturas/) — flujo completo en escritorio y móvil para las cuatro
  instituciones.
- `pnpm verificar:privilegios` — privilegios mínimos por motor.
- `pnpm hospital:reproyectar` — reconstrucción desde `clinico.eventos`.
