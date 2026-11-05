# Entrega I — Modelo relacional y levantamiento completo

Universidad Rafael Landívar · Bases de Datos II

## Contenido

| Doc | Contenido |
|---|---|
| [00-contexto](00-contexto.md) | Cuatro instituciones → cuatro motores |
| [00-hexagonal](00-hexagonal.md) | Arquitectura hexagonal (contexto) |
| [01-dominio-conceptual](01-dominio-conceptual.md) | Núcleo compartido |
| [02-entidades-atributos](02-entidades-atributos.md) | Entidades y atributos (4 instituciones) |
| [03-clasificacion](03-clasificacion.md) | Público / confidencial / restringido |
| [04-hospital](04-hospital.md) | ER + relacional (PostgreSQL) |
| [05-odontologia](05-odontologia.md) | ER + relacional + odontograma (MySQL) |
| [06-laboratorio-preview](06-laboratorio-preview.md) | Análisis laboratorio (MongoDB) |
| [07-pediatrico-preview](07-pediatrico-preview.md) | Análisis pediátrico (Redis) |
| [08-operaciones](08-operaciones.md) | Operaciones de la aplicación |
| [09-normalizacion](09-normalizacion.md) | Dependencias funcionales y 3NF |
| [10-implementacion](10-implementacion.md) | DDL relacional aplicado |
| [11-matriz-cobertura](11-matriz-cobertura.md) | Qué pide el enunciado vs qué entregamos |

**Documento único (copiar/pegar):** [`ENTREGA-I.html`](ENTREGA-I.html) — abre en el navegador, Cmd+A, Cmd+C, pega en Word/Docs.

SVG/PNG: carpeta [`render/`](render/). Regenerar: `pnpm docs:entrega-1:full`

## Decisiones de esta entrega

- Hospital: modelo **3NF clásico** ahora; Event Sourcing en Entrega II.
- Núcleo compartido + extensiones por institución.
- Odontograma: `pieza_dental` + `procedimiento_dental`.
- Diagnóstico/medicamento: **híbrido** (catálogo opcional + texto libre).
- Cita y Consulta: entidades **aparte pero conectadas**.
- Paciente–Expediente: **1:1**.
- Auditoría de acceso: incluida.
- Laboratorio: exámenes **referenciados** (análisis; implementación en Entrega II).
- Pediátrico: Redis como **registro** con curva ZSET + vacunas ZSET (análisis; implementación en Entrega II).

## Nota Firebase → Redis

El enunciado lista Firebase. Este proyecto sustituye Firebase por Redis para el centro pediátrico. **Pendiente de autorización del catedrático.** Si se rechaza, Firebase vuelve y Redis queda solo como caché: cambio de un adaptador.
