# Proposal

## Why

AGENTS.md §4 declara «Redis Streams como bus de eventos interno (proyector)». Hoy el
adaptador de Postgres actualiza el read model **dentro de la misma transacción** del
event store (proyector síncrono) y después publica el id del evento con `XADD`, pero
**ningún consumidor lee ese stream**. O el stream sobra, o el proyector debe moverse a
un consumidor. Es una incoherencia que el catedrático puede señalar, y su resolución es
una decisión de modelado reservada al estudiante (temas 4, 6 y 7 de AGENTS.md §2).

## What Changes

Este change **no implementa nada** hasta que el estudiante decida. Deja planteadas las
alternativas, sus consecuencias y las tareas de cada camino.

**Fuera de alcance:** Kafka, outbox con worker externo, snapshots (salvo que se elija).

## Capabilities

### New Capabilities
- `proyector-read-model`: cómo y cuándo el read model del Hospital refleja el event store.

### Modified Capabilities

## Impact

- `infraestructura/postgres/postgres-expediente.repository.ts`, posible módulo `proyector/`, documentación comparativa (consistencia eventual vs fuerte).
