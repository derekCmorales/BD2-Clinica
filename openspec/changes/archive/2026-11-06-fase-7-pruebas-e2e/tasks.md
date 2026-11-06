# Tasks

## 1. Andamiaje

- [x] 1.1 Paquete `e2e/` con Playwright y config (baseURL, proyectos desktop/móvil)
- [x] 1.2 Scripts `e2e:rapido` y `e2e:motores`
- [x] 1.3 Helper de ingreso por institución

## 2. Flujos

- [x] 2.1 Flujo clínico parametrizado ×4
- [x] 2.2 Extensión por institución (agenda, examen, medición+vacuna, pieza+procedimiento) recorrida en las 4 (la UI es idéntica)
- [x] 2.3 Archivo y solo lectura
- [x] 2.4 Aislamiento entre instituciones
- [x] 2.5 Sesión expirada → vuelve al ingreso
- [x] 2.6 Conflicto de concurrencia (dos pestañas) → mensaje y recarga

## 3. Calidad

- [x] 3.1 axe en ingreso, censo, cada pestaña y cada diálogo (incluye contraste; heredado de fase-1 3.4)
- [x] 3.3 Cubrir los flujos de la fase 2 (heredado de fase-2 4.4)
- [x] 3.2 Capturas de evidencia a `docs/entrega-2/capturas/`

## 4. CI

- [x] 4.1 `.github/workflows/ci.yml`: install, test, build, verificar:arquitectura
- [x] 4.2 Job de contrato + e2e con `docker compose up --wait`
- [x] 4.3 Artefactos: reporte HTML de Playwright y trazas en fallo
