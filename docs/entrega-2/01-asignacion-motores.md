# Asignación institución → motor

La restricción del enunciado exige un motor distinto por institución y al menos cuatro
motores. La asignación implementada es:

| Institución | Motor | Hecho técnico verificable |
|---|---|---|
| Hospital general | PostgreSQL | Event store `clinico.eventos` con `UNIQUE(aggregate_id, version)`, read model 3NF, `btree_gist` para citas sin solape |
| Clínica odontológica | MySQL | InnoDB `utf8mb4`, `SELECT ... FOR UPDATE` para reservar citas, odontograma en `pieza_dental` |
| Laboratorio clínico | MongoDB | Colección `examenes` referenciada, `$jsonSchema` por tipo, índice `{ pacienteId: 1, fecha: -1 }` |
| Centro pediátrico | Redis | RedisJSON `paciente:{id}`, ZSET `curva:{id}` y `vacunas:pendientes`, Lua para atomicidad |

## Justificación (Redacción del estudiante — 3.1)

> **Pendiente.** El estudiante redacta aquí por qué cada institución encaja con su motor
> a partir del volumen, la estructura de la información y la necesidad de transacciones
> estrictas. Los hechos técnicos de la tabla anterior son la evidencia disponible.

Preguntas que la justificación debería responder:

1. ¿Por qué el Hospital necesita transacciones fuertes y trazabilidad médico-legal?
2. ¿Por qué la Clínica prioriza operabilidad sobre capacidades avanzadas?
3. ¿Por qué la estructura variable del Laboratorio hace incómodo un modelo relacional?
4. ¿Por qué el Pediátrico accede siempre por clave conocida y tolera una ventana de 1 s?
