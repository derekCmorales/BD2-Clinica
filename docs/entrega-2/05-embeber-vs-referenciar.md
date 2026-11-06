# Embeber vs referenciar

## MongoDB — Laboratorio

| Dato | Decisión | Razón técnica |
|---|---|---|
| Expediente, consultas, diagnósticos, recetas, citas, mediciones, vacunas, piezas | Embebido en el documento `expedientes` | Se leen juntos al abrir el expediente y son un conjunto acotado |
| Resultados de examen | Referenciados en la colección `examenes` | Un paciente acumula cientos; embeberlos choca con el límite de 16 MB de BSON y casi nunca se leen todos juntos |
| Antibiograma | Embebido dentro del resultado de cultivo | Es pequeño y se lee siempre con el cultivo; se modela como arreglo de `{ antibiotico, sensibilidad }` |
| Auditoría | Colección aparte `auditoria` | Append-only, no forma parte del agregado clínico |

Índice mínimo: `{ pacienteId: 1, fecha: -1 }`. Validación por tipo con `$jsonSchema` y
`validationLevel: moderate` para no invalidar documentos viejos al endurecer el esquema.

## Redis — Centro pediátrico

| Dato | Estructura | Razón técnica |
|---|---|---|
| Expediente | RedisJSON `paciente:{id}` | Acceso siempre por clave conocida; lectura completa en una operación |
| Curva de crecimiento | ZSET `curva:{id}` con score = fecha | Orden cronológico y rangos por fecha sin ordenar en la aplicación |
| Esquema de vacunación | ZSET `vacunas:{id}` con score = próxima dosis | `ZRANGEBYSCORE` devuelve dosis vencidas |
| Dosis pendientes globales | ZSET `vacunas:pendientes` con member `pacienteId|codigo` | Una sola operación para todas las dosis vencidas |
| Índice de búsqueda | HASH `indice:pacientes` | Búsqueda por nombre sin consultas ad-hoc nativas |
| Auditoría | STREAM `auditoria:{id}` | Append-only y lectura por rango |

## Justificación

**MongoDB.** El criterio fue el patrón de lectura y el límite del motor. El expediente
—datos del paciente, consultas, diagnósticos, recetas, citas, mediciones, vacunas y
piezas— se lee junto cuando el médico abre la hoja, y su tamaño está acotado por la
atención de una institución; por eso se embebe. Los exámenes son lo contrario: un
paciente puede acumular cientos a lo largo de años, casi nunca se necesitan todos a la
vez y el documento crecería hasta chocar con el límite de 16 MB de BSON; por eso se
referencian en `examenes` con `pacienteId` e índice por fecha. El antibiograma es un
caso intermedio: es pequeño, se lee siempre con el cultivo y no tiene vida propia; se
embebe como arreglo de `{ antibiotico, sensibilidad }`. La auditoría queda en una
colección aparte porque es append-only y no forma parte del agregado clínico.

**Redis.** Aquí el criterio fue la operación que se quiere resolver. El expediente se
guarda como un solo documento RedisJSON porque el acceso es por clave y la lectura es
completa; separarlo en varias claves obligaría a varias idas y vueltas. La curva y las
vacunas sí necesitan orden y rangos, y un JSON no da eso: por eso viven en ZSET con
score = fecha y score = próxima dosis. `vacunas:pendientes` es un ZSET global que
duplica el `pacienteId` en el member para responder «todas las dosis vencidas» en una
operación. `indice:pacientes` es un HASH denormalizado para buscar por nombre; se
reescribe en el mismo script Lua que guarda el expediente, así que no puede quedar
desincronizado. El precio de este diseño es que no hay consultas ad-hoc: cualquier
pregunta que no sea «por paciente» o «por rango de fecha» exige reindexar o RediSearch.
Ese es el trade-off que se documenta en `08-limitaciones.md`.
