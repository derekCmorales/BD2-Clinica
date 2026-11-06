# Limitaciones conocidas

| Limitación | Motor | Impacto | Mitigación |
|---|---|---|---|
| Sin consultas ad-hoc nativas; «todos los niños con percentil bajo 3» requiere reindexar o RediSearch | Redis | Consultas analíticas fuera del acceso por clave | Índice `indice:pacientes` para búsqueda por nombre; documentado como trade-off |
| AOF `appendfsync everysec` puede perder hasta ~1 s de escrituras ante un crash | Redis | Ventana de pérdida acotada | RDB + AOF; trade-off documentado en Compose y AGENTS.md |
| El solape de citas entre pacientes distintos solo se valida en Postgres, MySQL y Mongo | Redis | Dos pacientes del Pediátrico podrían reservar el mismo horario del mismo médico | La suite de contrato lo marca como capacidad no soportada; se documenta en la evidencia |
| Las transacciones multi-documento requieren replica set | MongoDB | Sin replica set no hay transacción | Compose configura `rs0` con un nodo y keyfile |
| El event store crece sin snapshots | PostgreSQL | Reconstrucción más lenta con muchos eventos | `pnpm hospital:reproyectar`; snapshots fuera de alcance |
| Sin RBAC por roles | Todos | El JWT identifica institución, no permisos finos | Fuera de alcance de la Entrega II |
| Sin cifrado a nivel de campo | Todos | Datos en reposo dependen del motor/host | Fuera de alcance de la Entrega II |
