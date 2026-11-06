# Design

## Context

`exigirValoresExamen` descarta cualquier campo que no esté en `CAMPOS_POR_TIPO_EXAMEN`; agregar campos en la UI hoy no tiene efecto.

## Goals / Non-Goals

**Goals:** una sola definición; la UI no sabe de tipos de examen.
**Non-Goals:** EAV en los motores relacionales (anti-solución, AGENTS.md §3).

## Decisions

### Decisión 1 — Campos de cada tipo `[DECISIÓN DEL ESTUDIANTE]`

Es diseño de esquema. Punto de partida para discutir (no es una propuesta cerrada):

| Tipo | Candidatos |
|---|---|
| Hematología | hemoglobina, hematocrito, leucocitos, plaquetas, eritrocitos |
| Orina | color, aspecto, pH, densidad, proteínas, glucosa, leucocitos |
| Cultivo | muestra, organismo, recuento UFC, antibiograma (¿arreglo de {antibiótico, S/I/R}?) |

Pregunta clave: ¿el antibiograma es un arreglo embebido en el resultado o documentos aparte? Mismo criterio que usaste para exámenes vs paciente.

### Decisión 2 — ¿Dónde vive el catálogo? `[DECISIÓN DEL ESTUDIANTE]`

| Opción | Consecuencia |
|---|---|
| A. Constante en dominio, servida por endpoint | Simple; el `$jsonSchema` se genera desde ella en la migración |
| B. Colección `tipos_examen` en Mongo | Datos, no código; pero el catálogo deja de ser común a las cuatro instituciones |

## Risks / Trade-offs

- [Riesgo] Cambiar campos requeridos invalida exámenes existentes en el `$jsonSchema`: usar `validationLevel: moderate` o migrar datos semilla.
