# Spec Delta

## Purpose

Que la estructura variable de los resultados de laboratorio tenga una sola definición y que la UI se construya a partir de ella.

## ADDED Requirements

### Requirement: Catálogo único de tipos de examen
El sistema SHALL exponer los campos de cada tipo de examen desde una sola definición, y la validación del caso de uso, el `$jsonSchema` y el cliente MUST derivar de ella.

#### Scenario: Nuevo campo
- **WHEN** se agrega «plaquetas» a hematología en la definición
- **THEN** el formulario del cliente muestra el campo sin cambiar código del cliente y el caso de uso lo persiste

### Requirement: Rango de referencia visible
Si un campo tiene rango de referencia, la tarjeta del examen SHALL marcar el valor como alto o bajo con texto, no solo con color.

#### Scenario: Hemoglobina baja
- **WHEN** la hemoglobina registrada está bajo el rango
- **THEN** la tarjeta muestra el valor con la marca «Bajo»
