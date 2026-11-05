# Hospital general — PostgreSQL

## Modelo entidad-relación

```mermaid
erDiagram
  USUARIO ||--o{ CITA : agenda
  USUARIO ||--o{ CONSULTA : atiende
  PACIENTE ||--|| EXPEDIENTE : posee
  EXPEDIENTE ||--o{ CITA : tiene
  EXPEDIENTE ||--o{ CONSULTA : acumula
  CITA |o--o| CONSULTA : conecta
  CONSULTA ||--o{ DIAGNOSTICO : tiene
  CONSULTA ||--o{ RECETA : emite
  CATALOGO_DIAGNOSTICO ||--o{ DIAGNOSTICO : tipifica
  CATALOGO_MEDICAMENTO ||--o{ RECETA : tipifica
  USUARIO ||--o{ AUDITORIA_ACCESO : deja
  PACIENTE ||--o{ AUDITORIA_ACCESO : afecta

  USUARIO {
    uuid id PK
    string nombre
    string correo
    string rol
  }
  PACIENTE {
    uuid id PK
    string dpi
    string nombres
    date fecha_nacimiento
  }
  EXPEDIENTE {
    uuid id PK
    uuid paciente_id UK
    string estado
    int version
  }
  CITA {
    uuid id PK
    timestamptz inicio
    timestamptz fin
    uuid consulta_id FK
  }
  CONSULTA {
    uuid id PK
    timestamptz ocurrida_en
    uuid cita_id FK
  }
  DIAGNOSTICO {
    uuid id PK
    string texto_libre
    uuid catalogo_diagnostico_id FK
  }
  RECETA {
    uuid id PK
    string texto_libre
    string dosis
  }
```

## Modelo relacional (físico Entrega I)

Schema `clinico` en la base `hospital`:

- `usuario`, `paciente`, `expediente`
- `cita`, `consulta` (FK cruzadas opcionales)
- `catalogo_diagnostico`, `catalogo_medicamento`
- `diagnostico`, `receta`
- `auditoria_acceso`

DDL: `apps/api/src/infraestructura/postgres/migrations/001_clinico.sql`

## Decisión diferida: Event Sourcing

En Entrega II el Hospital migrará a event store + read model (el expediente se **enmienda**, no se UPDATE). Entrega I entrega el historial en 3NF para cumplir el enunciado de modelo relacional normalizado.
