# Spec Delta

## Purpose

Definir cómo el read model del Hospital se mantiene coherente con el event store y qué papel cumple Redis Streams.

## ADDED Requirements

### Requirement: Read model reconstruible
El read model del Hospital SHALL poder reconstruirse por completo reproduciendo `clinico.eventos` en orden de versión por agregado.

#### Scenario: Reconstrucción
- **WHEN** se vacía el read model y se ejecuta la reconstrucción
- **THEN** `ExpedienteQueryService` devuelve las mismas vistas que antes de vaciarlo

### Requirement: Proyección sin duplicados
Procesar el mismo evento más de una vez MUST NOT alterar el read model.

#### Scenario: Evento reentregado
- **WHEN** el proyector recibe dos veces el evento de versión N de un agregado
- **THEN** el read model refleja el evento una sola vez

### Requirement: Rol explícito del stream
Si el sistema publica en Redis Streams, SHALL existir al menos un consumidor documentado de ese stream.

#### Scenario: Auditoría de código
- **WHEN** se revisa el adaptador de Postgres
- **THEN** cada `XADD` tiene un consumidor identificado o fue eliminado
