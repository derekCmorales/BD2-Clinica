# Matriz de cobertura — Entrega I (y más)

Comparación entre lo mínimo del enunciado y lo entregado. El proyecto busca **sobrecumplir** el análisis para que Entrega II no reabra levantamiento.

| Resultado esperado (enunciado) | Cobertura | Evidencia |
|---|---|---|
| ER de instituciones en motores relacionales | Completo | Hospital + Odontología |
| Modelo relacional de esas instituciones | Completo | Tablas/FK + DDL Postgres/MySQL |
| Entidades identificadas | Completo + extensiones | Núcleo + odonto + lab + pediátrico |
| Atributos por entidad | Completo + extensiones | Doc entidades + docs por institución |
| Público / confidencial / restringido | Completo | Clasificación + matriz 4 instituciones |
| BD normalizada (relacional) | Completo | 1NF–3NF + dependencias funcionales |
| Operaciones en lenguaje sencillo | Completo | 23 operaciones (núcleo + 3 extensiones) |
| Implementación en motores relacionales | Completo | Migraciones + seeds + verificación |
| Análisis de las cuatro instituciones | Completo (más allá del mínimo) | Lab y pediátrico con entidades/atributos/ops |

## Extra respecto al enunciado (deliberado)

| Extra | Para qué |
|---|---|
| Diagrama de contexto 4 motores | Enmarcar el análisis |
| Arquitectura hexagonal (contexto) | Alinear con el mecanismo habilitador del curso |
| Análisis documental laboratorio (embeber vs referenciar) | Anticipar Entrega II sin implementarlo |
| Análisis Redis pediátrico (estructuras + trade-off 1s) | Idem; Redis como registro |
| Nota Firebase → Redis | Transparencia académica |
| Auditoría en el modelo desde Entrega I | Seguridad transversal |
| Odontograma 3NF (32 piezas + procedimientos) | Extensión de dominio real |
| Diagnóstico/medicamento híbrido | Flexibilidad sin romper normalización |
| Compose con 4 motores arriba | Infra lista; negocio solo en 2 |

## Qué queda explícitamente para Entrega II

- App cliente-servidor funcional y UI idéntica
- JWT / enrutamiento por institución
- Casos de uso sobre los cuatro adaptadores
- Schema validation Mongo, Lua/RedisJSON, Event Sourcing Hospital
- Documento comparativo de modelado / consistencia / seguridad
