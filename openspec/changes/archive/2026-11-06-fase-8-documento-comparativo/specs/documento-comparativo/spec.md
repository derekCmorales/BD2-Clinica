# Spec Delta

## Purpose

Entregable escrito que compara modelado, consistencia y seguridad de los cuatro motores con evidencia del sistema funcionando.

## ADDED Requirements

### Requirement: Cobertura del enunciado
El documento SHALL cubrir, para cada motor, modelado, consistencia y seguridad, y MUST justificar la asignación de cada institución a su motor por volumen, estructura y necesidad transaccional.

#### Scenario: Revisión contra LINEAMIENTOS
- **WHEN** se recorre la lista de resultados esperados de la Entrega II
- **THEN** cada punto tiene una sección y una evidencia enlazada

### Requirement: Decisión documental explícita
El documento SHALL declarar qué se embebe y qué se referencia en MongoDB y en Redis, con la razón.

#### Scenario: Exámenes del laboratorio
- **WHEN** el lector busca por qué los exámenes no están embebidos en el paciente
- **THEN** encuentra el argumento de cardinalidad, patrón de acceso y límite de 16 MB

### Requirement: Limitaciones declaradas
El documento SHALL incluir las limitaciones conocidas de cada motor tal como están implementadas.

#### Scenario: Redis
- **WHEN** se lee la sección del Centro pediátrico
- **THEN** se declara la ventana de pérdida de hasta 1 s y la ausencia de consultas ad-hoc
