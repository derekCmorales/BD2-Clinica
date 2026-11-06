# Spec Delta

## Purpose

Demostrar automáticamente, desde el navegador, que las reglas de negocio funcionan igual en las cuatro instituciones y que el enrutamiento por usuario aísla sus datos.

## ADDED Requirements

### Requirement: Flujo clínico equivalente en los cuatro motores
La suite e2e SHALL ejecutar el mismo flujo (alta, consulta, diagnóstico, receta, cita, archivo) para cada institución y MUST NOT ramificar por motor.

#### Scenario: Flujo en Centro pediátrico
- **WHEN** el flujo corre con la institución «pediatrico» y `PERSISTENCIA=motores`
- **THEN** cada paso termina con el toast de confirmación y los datos persisten tras recargar

### Requirement: Aislamiento por institución
Un usuario autenticado en una institución MUST NOT ver ni modificar expedientes de otra.

#### Scenario: Acceso cruzado
- **WHEN** un usuario de Odontología solicita un `pacienteId` creado en el Hospital
- **THEN** recibe «No se encontró el paciente»

### Requirement: Accesibilidad verificada
Cada pantalla principal SHALL pasar axe sin violaciones de severidad «serious» o «critical».

#### Scenario: Diálogo de alta
- **WHEN** se abre el diálogo «Nuevo paciente»
- **THEN** axe no reporta violaciones serias

### Requirement: Integración continua
Cada PR SHALL ejecutar pruebas unitarias, build del cliente, suite de contrato y e2e, y MUST bloquear el merge si alguna falla.

#### Scenario: PR con regresión
- **WHEN** un cambio rompe el registro de recetas en MySQL
- **THEN** el job e2e de odontología falla y el PR queda en rojo
