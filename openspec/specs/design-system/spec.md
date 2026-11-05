# design-system Specification

## Purpose
Define el lenguaje visual y las primitivas del cliente web para que las cuatro instituciones vean exactamente la misma interfaz, clara, minimalista y accesible.

## Requirements

### Requirement: Tokens como única fuente de estilo
El cliente SHALL definir colores, tipografía, espaciado, radios, sombras y duraciones como variables CSS en `:root`, y los componentes MUST consumir esos tokens en lugar de valores literales.

#### Scenario: Cambio de acento
- **WHEN** se modifica `--accent` en `:root`
- **THEN** foco, selección y enlaces cambian en todas las pantallas sin tocar componentes

### Requirement: Blanco como superficie primaria y tinta como acción primaria
La superficie base SHALL ser blanca y la acción principal de cada vista MUST usar la variante `primary` (tinta sobre blanco). Cada vista MUST tener como máximo una acción `primary` visible por región.

#### Scenario: Sección con acción de registro
- **WHEN** el usuario abre una sección del expediente que admite registros
- **THEN** ve un único botón `primary` para registrar y las acciones secundarias en `secondary` o `ghost`

### Requirement: Color semántico reservado para estado y clasificación
Los colores success, warning, danger e info SHALL usarse solo para comunicar estado, y los niveles de clasificación de datos MUST mostrarse con ícono y texto, nunca solo con color.

#### Scenario: Dato restringido
- **WHEN** una sección muestra diagnósticos, resultados de laboratorio o datos de un menor
- **THEN** su encabezado incluye la etiqueta «Restringido» con ícono de escudo

### Requirement: Accesibilidad AA
Todo texto SHALL cumplir contraste ≥ 4.5:1 sobre su fondo, todo control interactivo MUST tener foco visible con el anillo de foco del sistema, y los diálogos MUST atrapar el foco y cerrarse con `Esc`.

#### Scenario: Navegación por teclado en pestañas
- **WHEN** el foco está en una pestaña del expediente y el usuario pulsa flecha derecha
- **THEN** se activa y enfoca la pestaña siguiente

#### Scenario: Movimiento reducido
- **WHEN** el sistema operativo pide `prefers-reduced-motion`
- **THEN** las animaciones de entrada, toasts y diálogos se desactivan

### Requirement: Estados de carga, vacío y error uniformes
Toda lista SHALL mostrar esqueleto durante la carga, el componente `Vacio` cuando no hay datos y una `Alerta` de tono danger ante un error, con un mensaje en lenguaje del médico.

#### Scenario: Conflicto de concurrencia
- **WHEN** el API responde `ConflictoDeConcurrencia`
- **THEN** la UI muestra un mensaje que explica que otra persona modificó el expediente y recarga la versión vigente

### Requirement: Gráficas de serie única
Las gráficas SHALL mostrar una sola medida por gráfica (sin doble eje), con línea de 2px, marcadores ≥ 8px, tooltip al pasar el puntero y una vista equivalente en tabla.

#### Scenario: Ver datos de crecimiento en tabla
- **WHEN** el usuario pulsa «Ver tabla» en Crecimiento
- **THEN** ve las mismas mediciones en una tabla accesible
