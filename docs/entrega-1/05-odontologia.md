# Clínica odontológica — MySQL

## Modelo entidad-relación

```mermaid
erDiagram
  PACIENTE ||--|| EXPEDIENTE : posee
  EXPEDIENTE ||--o{ CITA : agenda
  EXPEDIENTE ||--o{ CONSULTA : registra
  EXPEDIENTE ||--o{ PIEZA_DENTAL : odontograma
  PIEZA_DENTAL ||--o{ PROCEDIMIENTO_DENTAL : historial
  CONSULTA ||--o{ PROCEDIMIENTO_DENTAL : documenta
  CONSULTA ||--o{ DIAGNOSTICO : incluye
  CONSULTA ||--o{ RECETA : genera
  USUARIO ||--o{ CITA : reserva
  USUARIO ||--o{ CONSULTA : realiza

  PIEZA_DENTAL {
    uuid id PK
    smallint codigo_fdi
    string estado
  }
  PROCEDIMIENTO_DENTAL {
    uuid id PK
    string tipo
    string descripcion
    datetime realizado_en
  }
```

## Odontograma

32 filas por expediente (códigos FDI 11–48). **Descartado:** JSON (rompe 1NF en un entregable de normalización) y 32 columnas (sin historial).

Cada intervención queda en `procedimiento_dental` ligada a la pieza y a la consulta.

## Modelo relacional

Tablas InnoDB `utf8mb4` en base `odontologia`. Sin Event Sourcing: simplicidad deliberada (hallazgo comparativo).

DDL: `apps/api/src/infraestructura/mysql/migrations/001_clinico.sql`

## Solapamiento de citas

MySQL no tiene exclusion constraint como PostgreSQL `btree_gist`. En Entrega II el equivalente operativo es `SELECT … FOR UPDATE` dentro de transacción `REPEATABLE READ`. Documentado; no se finge una constraint de tabla.
