# contrato-adaptadores Specification

## Purpose
Garantizar con pruebas automatizadas que los cuatro adaptadores de `ExpedienteRepository` cumplen el mismo contrato observable.

## Requirements

### Requirement: Mismos escenarios para todos los adaptadores
La suite de contrato SHALL ejecutar exactamente los mismos escenarios contra Postgres, MySQL, Mongo, Redis y memoria, y MUST NOT contener ramas condicionales por motor.

#### Scenario: Registrar consulta
- **WHEN** se crea un paciente y se registra una consulta en cualquier adaptador
- **THEN** `obtener()` devuelve el expediente con una consulta y versión incrementada

### Requirement: Concurrencia optimista observable
Cuando dos escrituras parten de la misma versión del expediente, el adaptador SHALL aceptar la primera y MUST rechazar la segunda con `ConflictoDeConcurrencia`.

#### Scenario: Doble escritura
- **WHEN** dos copias del expediente en versión N registran consultas distintas y ambas llaman `guardar()`
- **THEN** exactamente una tiene éxito y la otra lanza `ConflictoDeConcurrencia`

### Requirement: Expediente archivado inmutable
Ningún adaptador SHALL persistir registros nuevos en un expediente archivado.

#### Scenario: Consulta sobre archivado
- **WHEN** se intenta registrar una consulta en un expediente archivado
- **THEN** el caso de uso lanza `ExpedienteArchivado` y la versión no cambia
