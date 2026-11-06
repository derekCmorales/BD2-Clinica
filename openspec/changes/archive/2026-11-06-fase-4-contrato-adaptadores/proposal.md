# Proposal

## Why

AGENTS.md §10: «el mismo caso de uso corre contra los cuatro adaptadores». Hoy
`casos-de-uso.spec.ts` corre cuatro instancias de `MemoriaExpedienteRepository`: prueba
el dominio, no los adaptadores. El corazón del proyecto (cuatro estrategias de `guardar()`)
no tiene evidencia automatizada.

## What Changes

- Suite de contrato `contrato-repositorio.spec.ts` parametrizada por adaptador real
  (Postgres, MySQL, Mongo, Redis) + memoria, contra los contenedores de Compose.
- Escenarios: crear, registrar consulta, diagnóstico, receta, archivar, rechazo en
  archivado, cita solapada, y **escritura concurrente** (dos `guardar()` sobre la misma versión).
- Script `pnpm test:contrato` que levanta/espera los motores, migra, y corre la suite.
- Salida tabular por motor para pegar en el documento comparativo (fase 8).

**Fuera de alcance:** benchmarks de rendimiento.

## Capabilities

### New Capabilities
- `contrato-adaptadores`: suite que garantiza comportamiento equivalente de los cuatro adaptadores.

### Modified Capabilities

## Impact

- `apps/api/src/**/*.spec.ts`, `apps/api/jest.config.cjs` (proyecto de integración separado), `package.json` raíz, `scripts/`.
