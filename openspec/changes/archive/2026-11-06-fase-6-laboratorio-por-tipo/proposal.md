# Proposal

## Why

La razón para usar MongoDB en el Laboratorio es que «la estructura del resultado varía
por tipo de examen». Hoy cada tipo tiene solo 2 campos (1 en «otro»), y la lista vive
duplicada en tres sitios: `CAMPOS_POR_TIPO_EXAMEN` (dominio), el `$jsonSchema` de Mongo y
el cliente web. Con dos campos la variación no se nota y la justificación del motor se debilita.

## What Changes

- Una sola fuente de los campos por tipo, servida al cliente por
  `GET /catalogos/examenes` (tipo, campos, etiqueta, unidad, requerido, rango de referencia).
- El cliente renderiza el formulario y la tarjeta del examen desde ese catálogo
  (elimina la copia `TIPOS_EXAMEN` de `Hoja.tsx`).
- Valores fuera de rango de referencia marcados en la tarjeta (alto/bajo).
- Migración `002` del `$jsonSchema` alineada con el catálogo.

**Fuera de alcance:** catálogo administrable desde la UI.

## Capabilities

### New Capabilities
- `laboratorio-resultados`: estructura por tipo de examen y su presentación.

### Modified Capabilities

## Impact

- `dominio/modelo/tipos-clinicos.ts`, `aplicacion/validacion.ts`, `infraestructura/mongo/migrations/`, nuevo controller de catálogos, `apps/web/src/Hoja.tsx`.
