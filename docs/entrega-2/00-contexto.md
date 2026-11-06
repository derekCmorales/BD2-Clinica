# Entrega II — Aplicación cliente-servidor

Plataforma de historiales clínicos para cuatro instituciones independientes. La misma
lógica de negocio corre sobre cuatro motores distintos; el JWT decide a cuál se enruta
cada operación.

| Institución | Motor | Rol del motor |
|---|---|---|
| Hospital general | PostgreSQL | Event store + read model, integridad transaccional fuerte |
| Clínica odontológica | MySQL | CRUD InnoDB, operabilidad y hosting gestionado |
| Laboratorio clínico | MongoDB | Resultados con estructura variable por tipo de examen |
| Centro pediátrico | Redis | Sistema de registro (RedisJSON + ZSET), no caché |

**Cómo leer este documento.** Las secciones técnicas (modelado, consistencia, seguridad,
evidencia) están completas y enlazan al código. Las secciones marcadas
**«Redacción del estudiante»** son las que decide y escribe el estudiante; el agente
dejó la estructura, los hechos verificables y la evidencia, pero no redactó la
justificación en su lugar.

## Alcance

- Aplicación funcional cliente-servidor con los cuatro motores.
- Enrutamiento por institución sin `if` por motor en los casos de uso.
- Consultas equivalentes verificadas por la suite de contrato.
- UI idéntica para las cuatro instituciones.
- Seguridad: clasificación, auditoría consultable y privilegios mínimos.

## Fuera de alcance

Kafka, gRPC, microservicios, sagas, Firebase, Kubernetes. Redis Streams se evaluó en la
fase 5 y se descartó para el proyector del Hospital (decisión A: proyector síncrono).
