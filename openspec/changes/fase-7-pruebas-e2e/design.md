# Design

## Context

API con `PERSISTENCIA=memoria|motores`; cliente Vite con proxy. Compose con 5 servicios de datos.

## Goals / Non-Goals

**Goals:** un flujo, cuatro ejecuciones; selectores por rol y nombre accesible (los mismos que usa un lector de pantalla).
**Non-Goals:** cubrir cada validación de formulario (eso es unitario).

## Decisions

- Selectores `getByRole`/`getByLabel` en lugar de `data-testid`: obliga a que la UI sea accesible.
- Datos: cada ejecución crea su paciente con DPI aleatorio; no depende de seeds.
- Dos perfiles: `e2e:rapido` (memoria, sin Docker, para desarrollo) y `e2e:motores` (Compose, para CI y entrega).
- CI: `services` no sirve para el replica set de Mongo con keyfile → usar `docker compose up --wait`.

## Risks / Trade-offs

- [Riesgo] Tiempos de arranque de MySQL/Mongo en CI: `--wait` + healthchecks ya definidos.
- [Trade-off] e2e contra motores reales es lento (~2–3 min); se corre en PR, no en cada commit local.
