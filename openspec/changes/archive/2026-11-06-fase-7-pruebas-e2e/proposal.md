# Proposal

## Why

La Entrega II se evalúa con la aplicación funcionando de punta a punta: «consultas
funcionando de forma equivalente en los cuatro motores» y «enrutamiento por usuario».
Hoy no hay ninguna prueba que lo demuestre desde el navegador ni CI que la ejecute.

## What Changes

- Paquete `e2e/` con Playwright (el navegador ya está disponible en el entorno).
- Un único archivo de flujo parametrizado por institución: ingresar → crear paciente →
  consulta → diagnóstico → receta → cita → extensión de la institución → archivar →
  solo lectura. Corre 4 veces (una por motor) sin `if` por motor.
- Pruebas de enrutamiento: un token de Odontología no ve pacientes del Hospital.
- Verificación de accesibilidad con `@axe-core/playwright` en cada pantalla.
- Capturas de referencia (desktop 1440, móvil 390) como evidencia para el documento.
- GitHub Actions: `pnpm test` + build + contrato (fase 4) + e2e con Compose.

**Fuera de alcance:** pruebas de carga, pruebas visuales por píxel.

## Capabilities

### New Capabilities
- `pruebas-e2e`: verificación de flujos completos en navegador contra los cuatro motores.

### Modified Capabilities

## Impact

- Nuevo `e2e/`, `pnpm-workspace.yaml`, `.github/workflows/ci.yml`, scripts raíz.
