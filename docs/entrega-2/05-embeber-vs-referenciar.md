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

## Justificación (Redacción del estudiante — 3.2)

> **Pendiente.** El estudiante redacta aquí el criterio explícito de embeber vs referenciar
> y lo conecta con el volumen, la frecuencia de lectura y los límites del motor. Los
> hechos técnicos de las tablas anteriores son la evidencia disponible.
