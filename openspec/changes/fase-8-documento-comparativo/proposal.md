# Proposal

## Why

LINEAMIENTOS (Entrega II) exige un «documento comparativo breve explicando, para cada
motor, las decisiones de modelado, cómo se garantiza consistencia (transacciones en SQL
y NoSQL), y cómo se aplica seguridad», más la justificación de la asignación institución→motor
y la decisión explícita de embeber vs referenciar. Es lo que más pesa en la nota y no existe.

## What Changes

- `docs/entrega-2/` con el documento comparativo y un generador a HTML/Word como el de Entrega I.
- Secciones: asignación y justificación; modelado por motor; tabla de estrategias de
  `guardar()`; consistencia (transacciones, aislamiento, concurrencia); seguridad (usuarios,
  privilegios, auditoría, clasificación, logs); embeber vs referenciar (Mongo y Redis);
  hallazgos comparativos; limitaciones conocidas (Redis sin consultas ad-hoc, pérdida ≤ 1 s con AOF everysec);
  correcciones respecto a la retroalimentación de Entrega I; nota Firebase→Redis.
- Evidencia: salida de la suite de contrato (fase 4), capturas e2e (fase 7), diagramas.

**Fuera de alcance:** el texto de las decisiones lo redacta el estudiante; aquí se deja la estructura, la evidencia y los diagramas.

## Capabilities

### New Capabilities
- `documento-comparativo`: entregable escrito de la Entrega II.

### Modified Capabilities

## Impact

- `docs/entrega-2/`, `scripts/build-entrega-2-doc.mjs`, `package.json`.
