# Proposal

## Why

Cerrar el proyecto al 100 %: que cualquier evaluador clone, levante y vea las cuatro
instituciones funcionando en minutos, con una matriz que mapee cada resultado esperado
del enunciado a su evidencia.

## What Changes

- README de entrega: requisitos, arranque en 5 comandos, credenciales demo, recorrido sugerido.
- `pnpm demo`: compose up --wait → migrate → seed → api (motores) → web.
- Seeds sintéticos ricos y coherentes en los cuatro motores (varios pacientes, un archivado, un menor, exámenes de 3 tipos, curva con 6+ mediciones, dosis vencida, odontograma con estados).
- Matriz de cobertura Entrega II (como `docs/entrega-1/11-matriz-cobertura.md`).
- Guion de demo para la defensa (10 minutos, una institución por motor, el contraste de `guardar()`).
- Checklist final: `verificar:arquitectura`, unitarias, contrato, e2e, build, sin datos reales, sin secretos versionados.
- Archivar los changes de OpenSpec completados (`openspec archive`).

**Fuera de alcance:** despliegue en nube.

## Capabilities

### New Capabilities
- `entrega-final`: empaquetado, demo y verificación final del proyecto.

### Modified Capabilities

## Impact

- `README.md`, `scripts/`, seeds de los cuatro motores, `docs/entrega-2/`.
