# Asignación institución → motor

La restricción del enunciado exige un motor distinto por institución y al menos cuatro
motores. La asignación implementada es:

| Institución | Motor | Hecho técnico verificable |
|---|---|---|
| Hospital general | PostgreSQL | Event store `clinico.eventos` con `UNIQUE(aggregate_id, version)`, read model 3NF, `btree_gist` para citas sin solape |
| Clínica odontológica | MySQL | InnoDB `utf8mb4`, `SELECT ... FOR UPDATE` para reservar citas, odontograma en `pieza_dental` |
| Laboratorio clínico | MongoDB | Colección `examenes` referenciada, `$jsonSchema` por tipo, índice `{ pacienteId: 1, fecha: -1 }` |
| Centro pediátrico | Redis | RedisJSON `paciente:{id}`, ZSET `curva:{id}` y `vacunas:pendientes`, Lua para atomicidad |

## Justificación

**Hospital general → PostgreSQL.** El Hospital es la única institución donde un
diagnóstico perdido a medias tiene consecuencias médico-legales. PostgreSQL permite
resolver tres cosas en la misma transacción: insertar el evento en `clinico.eventos`,
actualizar el read model y dejar la evidencia en `auditoria_acceso`. La restricción
`UNIQUE(aggregate_id, version)` convierte la concurrencia optimista en una garantía del
motor, no en una convención de la aplicación; `btree_gist` impide dos citas del mismo
médico en el mismo intervalo; y `JSONB` absorbe las extensiones que no son el núcleo
(mediciones, vacunas, exámenes) sin crear una tabla por cada una. El costo es operativo:
es el motor que exige más cuidado (roles, migraciones, respaldo, extensiones). Para este
dominio, ese costo se justifica porque la trazabilidad es el requisito, no un adorno.

**Clínica odontológica → MySQL.** La Clínica no tiene personal técnico propio y su
prioridad es que las secretarias atiendan rápido. MySQL ofrece hosting gestionado barato,
herramientas gráficas y un ecosistema amplio; el modelo es un CRUD directo sobre InnoDB
con `utf8mb4`. No se necesita Event Sourcing: el odontograma es un estado actual por
pieza y un historial de procedimientos, no una bitácora médico-legal. `SELECT ... FOR
UPDATE` sobre la fila del médico y la del expediente es suficiente para que dos
secretarias no reserven el mismo horario. La simplicidad es deliberada: menos piezas
móviles para una institución sin soporte técnico.

**Laboratorio clínico → MongoDB.** La estructura del resultado cambia por tipo de
examen: una hematología tiene cinco campos numéricos, una orina mezcla listas y números,
y un cultivo agrega un antibiograma. Modelarlo en tablas relacionales llevaría a una
tabla de atributos por examen (EAV), que es exactamente la anti-solución que el proyecto
quiere evitar. MongoDB permite validar cada tipo con `$jsonSchema` y `oneOf`, y el
catálogo del dominio alimenta tanto la validación como el formulario. Los exámenes se
referencian porque un paciente acumula cientos y casi nunca se leen todos juntos; el
índice `{ pacienteId: 1, fecha: -1 }` cubre la consulta real.

**Centro pediátrico → Redis.** El Pediátrico atiende consultas frecuentes y cortas, y
siempre entra por una clave conocida: el paciente. RedisJSON guarda el expediente como
un documento que se lee completo en una operación; los ZSET resuelven la curva de
crecimiento (score = fecha) y el esquema de vacunación (score = próxima dosis), incluida
la consulta global `ZRANGEBYSCORE vacunas:pendientes -inf hoy`. Redis es sistema de
registro, no caché: AOF `appendfsync everysec` + RDB. El trade-off es explícito: se puede
perder hasta ~1 s de escrituras ante un crash, y no hay consultas ad-hoc nativas. Para
este volumen y este patrón de acceso, el intercambio es razonable.

**Nota Firebase → Redis.** El enunciado menciona Firebase; el proyecto usa Redis para el
Pediátrico. La sustitución está pendiente de autorización del catedrático. Si se rechaza,
Firebase vuelve para el Pediátrico y Redis queda solo como caché: el cambio debe ser de un
adaptador, no de los casos de uso.
