# Proposal

## Why

Las pantallas funcionaban pero tenían problemas de producto: formularios siempre
visibles bajo cada lista, el formulario de receta reutilizaba el texto del diagnóstico
(bug: el medicamento recetado era el texto del último diagnóstico tecleado), fechas por
defecto fijas en octubre 2026, campo «Clave de laboratorio» ambiguo, búsqueda solo por
botón, sin filtro activos/archivados, sin manejo de sesión expirada ni de conflicto de
concurrencia, y la curva de crecimiento como barras sin eje temporal.

## What Changes

Rediseño de todas las pantallas sobre el design system de la fase 1:

- **Ingreso**: tarjeta centrada, selector de institución 2×2 con el motor visible, clave
  de acceso con pista, recuerda la última institución, aviso de sesión expirada.
- **Shell**: topbar (institución + motor + usuario + salir) y censo lateral.
- **Censo**: búsqueda con debounce por nombre/DPI, filtro Activos/Archivados/Todos,
  esqueleto de carga, estado vacío, panel plegable de dosis pendientes.
- **Cabecera del expediente**: avatar, nombre, estado, insignia «Menor de edad», edad,
  sexo, nacimiento, DPI enmascarado con botón mostrar, versión del agregado, archivar
  con diálogo de confirmación y motivo.
- **Pestañas** con conteos y navegación por teclado (flechas, Home, End).
- **Resumen**: 4 indicadores, diagnósticos (restringido), próximo (citas y dosis), actividad reciente en línea de tiempo.
- **Consultas**: tarjeta por consulta; acciones «Diagnóstico» y «Receta» por consulta en diálogo (corrige el bug de estado compartido).
- **Agenda**: tabla con duración y estado; reserva por inicio + duración.
- **Laboratorio**: tarjetas por examen con campos etiquetados y unidades, validar/anular; registro con campos según tipo.
- **Crecimiento**: gráficas de peso y talla + vista tabla.
- **Vacunas**: tabla ordenada por próxima dosis, estado relativo (vencida / en N días).
- **Odontograma**: 32 piezas con marca de color + leyenda + resumen; panel de pieza con estado y procedimientos.
- **Errores**: mensajes de dominio traducidos (`ConflictoDeConcurrencia`, `CitaSolapada`, …); 401 cierra sesión.
- **Responsive**: censo y expediente en una columna bajo 860px.

**Fuera de alcance:** enrutamiento por URL (deep links), edición/enmienda de registros
existentes (la enmienda es decisión de modelado del Hospital, ver fase 5).

## Capabilities

### New Capabilities
- `interfaz-clinica`: pantallas y flujos del cliente para consultar y administrar el expediente.

### Modified Capabilities

## Impact

- `apps/web/src/App.tsx`, `Clinica.tsx`, `Hoja.tsx`, `api.ts`, `formato.ts`.
- Sin cambios de contrato con el API (mismos endpoints y DTOs).
