# Normalización (modelos relacionales)

## 1NF
Cada atributo es atómico. El odontograma **no** es un JSON ni 32 columnas: es `pieza_dental` (una fila por pieza) + `procedimiento_dental`.

## 2NF
No hay atributos que dependan solo de parte de una clave compuesta. Las claves son UUID surrogadas; `pieza_dental` tiene UNIQUE `(expediente_id, codigo_fdi)` pero el estado depende de la pieza completa, no solo del código FDI.

## 3NF — dependencias funcionales relevantes

| Determinante | Depende |
|---|---|
| `paciente.id` | dpi, nombres, apellidos, fecha_nacimiento, contacto |
| `expediente.id` | paciente_id, estado, version |
| `consulta.id` | expediente_id, medico_id, ocurrida_en, motivo, notas |
| `catalogo_diagnostico.id` | codigo, descripcion, sensible |
| `diagnostico.id` | consulta_id, catalogo opcional, texto_libre |
| `pieza_dental.id` | expediente_id, codigo_fdi, estado |

Los datos de catálogo **no** se repiten como única fuente en diagnóstico/receta: el texto_libre cubre lo no catalogado; el código vive en el catálogo (híbrido).

**Descartado:** guardar solo el string del diagnóstico en la consulta (sinónimo, sin 3NF clara). **Descartado:** EAV para resultados de laboratorio en SQL (anti-solución; por eso Laboratorio va a Mongo).
