# Proposal

## Why

El cliente web usaba una estética "papel y carpeta" (fondo beige, serif Fraunces, rojo
carpeta) con estilos ad-hoc por pantalla: tamaños de fuente inconsistentes, sin tokens,
sin componentes reutilizables y sin estados de carga, vacío o error uniformes. El
enunciado pide "visualización de toda la información de manera ordenada, sin que la
interfaz cambie según el motor". Un design system explícito es la forma de garantizar
esa uniformidad y de que el producto se perciba terminado.

## What Changes

- Tokens de diseño en `apps/web/src/styles.css` (§1): superficies, bordes, texto,
  acción primaria (tinta sobre blanco), acento único teal, semánticos de estado,
  colores de clasificación de datos, tipografía (Inter), escala de 4px, radios,
  sombras, movimiento y layout.
- Primitivas React en `apps/web/src/ui.tsx`: `Boton`, `Campo`, `Insignia`,
  `EtiquetaClasificacion`, `Alerta`, `Avatar`, `Vacio`, `Esqueleto`, `Dialogo`
  (`<dialog>` nativo), `ProveedorToast`/`useToast`, `DatoProtegido`, `Icono`.
- Gráfica de serie única `apps/web/src/Grafica.tsx` (peso / talla) siguiendo reglas
  de dataviz: una gráfica por medida, sin doble eje, tooltip, alternativa en tabla.
- Documentación en `docs/design-system/README.md` y vista previa navegable.
- **BREAKING (visual)**: se elimina la paleta beige/serif anterior.

**Fuera de alcance:** modo oscuro (la directriz es "blanco primary"), librería de
componentes externa (Tailwind, MUI, shadcn), Storybook.

## Capabilities

### New Capabilities
- `design-system`: tokens, primitivas y reglas de uso visual y accesibilidad del cliente web.

### Modified Capabilities

## Impact

- `apps/web/src/styles.css`, `apps/web/src/ui.tsx`, `apps/web/src/Grafica.tsx`, `apps/web/index.html` (fuente Inter, favicon).
- Sin cambios en API ni dominio. Sin dependencias nuevas.
