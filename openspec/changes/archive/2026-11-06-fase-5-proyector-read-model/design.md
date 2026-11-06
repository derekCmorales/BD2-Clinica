# Design

## Context

- Event store: `clinico.eventos(aggregate_id, version, tipo, payload, ocurrido_en, actor_id)` con `UNIQUE(aggregate_id, version)`.
- Read model 3NF en `clinico.*`, escrito en la misma transacción.
- `XADD` posterior al commit con el id del evento (sin payload). Sin consumidor.

## Goals / Non-Goals

**Goals:** que el diseño escrito y el código digan lo mismo; poder explicar el trade-off en la defensa.
**Non-Goals:** cambiar el contrato de `ExpedienteRepository`.

## Decisions

### Decisión única — Forma del proyector `[DECISIÓN DEL ESTUDIANTE]`

| | A. Síncrono en la transacción (estado actual) y eliminar el `XADD` | B. Asíncrono: consumidor de Redis Streams (`XREADGROUP`) | C. Híbrido: síncrono + stream como notificación para la caché DB 1 |
|---|---|---|---|
| Consistencia del read model | Fuerte | Eventual (ms–s) | Fuerte |
| Qué demuestra | Que ES no obliga a consistencia eventual | CQRS «de libro» y el uso de Redis Streams | Uso honesto del stream: invalidar caché transversal |
| Preguntas que te harán | ¿Para qué ES si proyectas en la misma transacción? | ¿Qué pasa si el consumidor cae? ¿Cómo evitas proyectar dos veces el mismo evento? | ¿Por qué no invalidas la caché directo? |
| Idempotencia | Implícita (misma tx) | Obligatoria: tú decides el mecanismo | Solo para la caché |
| Lectura inmediata tras escribir | Sí | Requiere leer del agregado o esperar | Sí |
| Costo | Ninguno | Consumidor, grupo, reintentos, `XPENDING` | Bajo |

Preguntas para decidir:
1. ¿El médico que acaba de registrar un diagnóstico debe verlo en la lista al instante?
2. Si el read model se corrompe, ¿cómo lo reconstruyes desde `eventos`? ¿Ese camino ya existe?
3. ¿Qué evaluará más el catedrático: coherencia transaccional o el patrón CQRS completo?

## Risks / Trade-offs

- [Riesgo] Mantener el estado actual sin justificar: el stream parece código muerto.
- [Riesgo] Opción B sin idempotencia: un reintento duplica filas del read model.
