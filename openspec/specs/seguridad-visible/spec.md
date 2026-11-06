# seguridad-visible Specification

## Purpose
Hacer visible en la aplicación la clasificación de datos y la bitácora de accesos exigidas por AGENTS.md §8, sin exponer datos restringidos.

## Requirements

### Requirement: Clasificación visible
Toda sección que muestre datos restringidos SHALL mostrar la etiqueta «Restringido» y todo identificador confidencial (DPI) MUST mostrarse enmascarado hasta que el usuario lo revele.

#### Scenario: DPI en la cabecera
- **WHEN** se abre un expediente
- **THEN** el DPI muestra solo sus últimos 4 dígitos y un botón «Mostrar DPI»

### Requirement: Consulta de bitácora por paciente
El sistema SHALL exponer la bitácora de accesos de un paciente con actor, acción, recurso y fecha, y MUST NOT incluir valores clínicos en esa respuesta.

#### Scenario: Ver accesos
- **WHEN** el usuario abre «Accesos» en un expediente
- **THEN** ve una lista cronológica de quién leyó o escribió qué recurso y cuándo, idéntica en los cuatro motores

### Requirement: Logs sin datos restringidos
Ningún log de la aplicación SHALL contener diagnósticos, resultados, valores de examen ni datos de menores.

#### Scenario: Error de driver
- **WHEN** un adaptador lanza un error con el payload en el mensaje
- **THEN** el log registra solo el nombre de la clase del error
