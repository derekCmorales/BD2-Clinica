# Consistencia y concurrencia

## Estrategia de `guardar()` por motor

| Motor | Estrategia | Archivo |
|---|---|---|
| PostgreSQL | `INSERT` de eventos nuevos; `UNIQUE(aggregate_id, version)` rechaza la versión repetida | [`postgres-expediente.repository.ts`](../../apps/api/src/infraestructura/postgres/postgres-expediente.repository.ts) |
| MySQL | `UPDATE` dentro de transacción InnoDB; `SELECT ... FOR UPDATE` sobre la fila del expediente y del médico | [`mysql-expediente.repository.ts`](../../apps/api/src/infraestructura/mysql/mysql-expediente.repository.ts) |
| MongoDB | `replaceOne` con `version` en el filtro (concurrencia optimista sobre el documento) | [`mongo-expediente.repository.ts`](../../apps/api/src/infraestructura/mongo/mongo-expediente.repository.ts) |
| Redis | Script Lua para read-modify-write atómico del JSON y los ZSET | [`redis-expediente.repository.ts`](../../apps/api/src/infraestructura/redis/redis-expediente.repository.ts) |

La suite de contrato ejecuta el mismo escenario contra los cuatro adaptadores y verifica
que la segunda escritura sobre la misma versión lanza `ConflictoDeConcurrencia`:
[`contrato-repositorio.contrato.spec.ts`](../../apps/api/src/infraestructura/contrato/contrato-repositorio.contrato.spec.ts).

## Proyector del Hospital — decisión A

El read model se actualiza **en la misma transacción** que el event store. No hay
consumidor de Redis Streams; el `XADD` se eliminó para que el código y el diseño digan lo
mismo. Consecuencias:

- Consistencia fuerte: el médico ve el cambio inmediatamente después del commit.
- La idempotencia es implícita: si la transacción falla, no se escribe ni el evento ni la
  proyección.
- La reconstrucción se hace desde `clinico.eventos` con `pnpm hospital:reproyectar`
  ([`scripts/hospital-reproyectar.sh`](../../scripts/hospital-reproyectar.sh)).
- El test de reconstrucción vive en la suite de contrato y limpia las tablas derivadas
  antes de reproyectar.

## Aislamiento y transacciones

- **PostgreSQL**: cada `guardar()` abre `BEGIN`/`COMMIT`; la exclusión de citas y la
  unicidad de eventos son constraints de la base, no lógica de aplicación.
- **MySQL**: `REPEATABLE READ` (default de InnoDB) y `SELECT ... FOR UPDATE` para la fila
  del expediente y la del médico al reservar una cita.
- **MongoDB**: transacciones multi-documento sobre replica set de un nodo; el filtro por
  `version` evita pisar una escritura concurrente.
- **Redis**: el script Lua se ejecuta atómicamente en el servidor; no hay lectura y
  escritura separadas desde el cliente.

## Trade-offs documentados

| Motor | Trade-off |
|---|---|
| PostgreSQL | El event store crece sin límite; no hay snapshots en esta entrega |
| MySQL | La simplicidad CRUD es deliberada; no hay historial de eventos |
| MongoDB | Las transacciones requieren replica set (configurado en Compose) |
| Redis | AOF `everysec` puede perder hasta ~1 s de escrituras ante un crash del proceso |
