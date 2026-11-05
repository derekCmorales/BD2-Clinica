# Design

## Context

Cliente React 19 + Vite sin librería de UI. Un solo archivo CSS global. La UI debe ser
idéntica para las cuatro instituciones; el motor solo aparece como etiqueta informativa.

## Goals / Non-Goals

**Goals:**
- Blanco como superficie primaria; minimalista; jerarquía por peso y espacio, no por color.
- Un acento único (teal) reservado para foco, selección y gráficas.
- Color semántico solo para estado (éxito, advertencia, peligro, info) y para la
  clasificación de datos de AGENTS.md §8.
- WCAG 2.2 AA: contraste ≥ 4.5:1 en texto, foco visible, objetivos ≥ 28px, teclado completo.

**Non-Goals:**
- Tema oscuro, theming por institución, i18n.

## Decisions

| Decisión | Elegida | Descartada y por qué |
|---|---|---|
| Acción primaria | Tinta `#18181b` sobre blanco | Teal como primario: compite con los estados y cansa en una app de uso intensivo |
| Tipografía | Inter 400/500/600, cuerpo 14px, cifras tabulares | Fraunces + Public Sans (anterior): serif decorativa resta claridad en datos clínicos |
| Componentes | Primitivas propias delgadas + CSS con tokens | Tailwind/shadcn: agrega build y dependencias a un cliente que se evalúa por consistencia, no por stack |
| Diálogos | `<dialog>` nativo con `showModal()` | Modal con portal propio: el nativo da foco atrapado, `Esc` y fondo inerte gratis |
| Formularios | En diálogos, invocados desde la sección | Formularios siempre visibles bajo cada lista (anterior): ruido visual y estado compartido entre formularios (bug de receta) |
| Gráfica de crecimiento | Dos gráficas de serie única + tabla | Doble eje peso/talla: anti-patrón; barras horizontales (anterior): no muestran tendencia en el tiempo |
| Acento de gráfica | `#0d9488` | `#0f766e`: falla el piso de croma del validador de paleta |
| Clasificación de datos | Etiqueta con ícono + texto (`Público`, `Confidencial`, `Restringido`) | Solo color: no accesible para daltonismo |

### Tokens (resumen)

- Superficie `#fff` / sutil `#fafafa` / muted `#f4f4f5`; borde `#e4e4e7` / fuerte `#d4d4d8`.
- Texto `#18181b` / secundario `#52525b` / muted `#71717a`.
- Acento `#0f766e` (texto, 5.4:1), gráfica `#0d9488`, anillo de foco teal 25 %.
- Estados: success `#15803d`, warning `#b45309`, danger `#b91c1c`, info `#1d4ed8` (cada uno con `-soft` y `-border`).
- Espaciado 4/8/12/16/20/24/32/40/48. Radios 6/8/12. Control 36px (44px en acciones principales).

## Risks / Trade-offs

- [Riesgo] Inter se carga desde Google Fonts → sin red cae a `system-ui`. Aceptable.
- [Trade-off] CSS global en un archivo: simple para el tamaño del cliente; si crece, dividir por sección.
- [Riesgo] `:has()` en tarjetas de institución y segmented: soportado en navegadores actuales; en uno viejo el radio sigue funcionando sin el resaltado.
