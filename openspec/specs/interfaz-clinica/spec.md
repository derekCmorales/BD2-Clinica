# interfaz-clinica Specification

## Purpose
Pantallas del cliente web para consultar y administrar el historial clínico, idénticas para las cuatro instituciones independientemente del motor que las respalde.

## Requirements

### Requirement: Interfaz independiente del motor
El cliente SHALL renderizar las mismas pantallas, secciones y pestañas para las cuatro instituciones; el motor MUST aparecer solo como etiqueta informativa en el ingreso y en la barra superior.

#### Scenario: Cambio de institución
- **WHEN** un usuario ingresa como Hospital y luego como Centro pediátrico
- **THEN** ve la misma estructura de censo, cabecera y pestañas, cambiando solo los datos y la etiqueta del motor

### Requirement: Ingreso con selección de institución
La pantalla de ingreso SHALL permitir elegir institución y clave, MUST recordar la última institución usada y MUST informar cuando la sesión expiró.

#### Scenario: Token expirado
- **WHEN** el API responde 401 a una petición autenticada
- **THEN** el cliente borra la sesión y muestra el ingreso con el aviso «Tu sesión expiró»

### Requirement: Censo con búsqueda y filtro
El censo SHALL buscar por nombre o DPI mientras se escribe (debounce ≤ 300 ms) y MUST filtrar por estado del expediente.

#### Scenario: Ver archivados
- **WHEN** el usuario elige «Archivados»
- **THEN** la lista muestra solo expedientes archivados con su insignia

### Requirement: Registro de paciente nuevo
El cliente SHALL ofrecer un diálogo de alta con validación del DPI (13 dígitos) y datos de tutor, y MUST abrir el expediente creado.

#### Scenario: DPI inválido
- **WHEN** el usuario intenta crear un paciente con un DPI de 12 dígitos
- **THEN** el diálogo muestra «El DPI tiene 13 dígitos» y no envía la petición

### Requirement: Mantenimiento del expediente
El cliente SHALL permitir registrar consultas, diagnósticos y recetas asociados a una consulta específica, citas, resultados de examen, mediciones, dosis y estado de piezas dentales, cada uno desde un diálogo dedicado.

#### Scenario: Recetar desde una consulta
- **WHEN** el usuario pulsa «Receta» en una consulta y completa medicamento, dosis y frecuencia
- **THEN** la receta queda registrada en esa consulta con el medicamento ingresado y aparece un toast de confirmación

### Requirement: Archivo de expediente
El cliente SHALL pedir confirmación y motivo antes de archivar, y un expediente archivado MUST quedar en solo lectura en todas las secciones.

#### Scenario: Expediente archivado
- **WHEN** el usuario abre un expediente archivado
- **THEN** ve el motivo de archivo, una alerta de solo lectura y ningún botón de registro

### Requirement: Diseño adaptable
El cliente SHALL ser utilizable desde 360px de ancho sin desplazamiento horizontal de la página.

#### Scenario: Teléfono
- **WHEN** el viewport mide 390px y hay un expediente abierto
- **THEN** el censo se oculta, aparece «← Pacientes» y las tablas desplazan solo su propio contenedor
