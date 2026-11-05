# Spec Delta

## Purpose

Garantizar que el proyecto se puede levantar, recorrer y verificar de punta a punta por un tercero sin asistencia.

## ADDED Requirements

### Requirement: Arranque reproducible
Desde un clon limpio con Docker y Node 20+, `pnpm demo` SHALL dejar API y cliente funcionando con los cuatro motores y datos sintéticos.

#### Scenario: Clon limpio
- **WHEN** un evaluador ejecuta `pnpm install && pnpm demo`
- **THEN** puede ingresar a las cuatro instituciones con la clave demo y ver pacientes en cada una

### Requirement: Matriz de cobertura
El repositorio SHALL incluir una matriz que relacione cada resultado esperado de la Entrega II con su evidencia (código, prueba, captura o sección del documento).

#### Scenario: Revisión del catedrático
- **WHEN** el catedrático busca «Desactivación o archivo de historiales»
- **THEN** la matriz enlaza el caso de uso, la prueba e2e y la captura

### Requirement: Verificación final verde
Antes de entregar, todas las verificaciones (arquitectura, unitarias, contrato, e2e, build) SHALL pasar en CI.

#### Scenario: Tag de entrega
- **WHEN** se crea el tag `entrega-2`
- **THEN** el último run de CI sobre ese commit está en verde
