# Arquitectura hexagonal (contexto, no se evalúa)

```mermaid
flowchart TB
  UI[Cliente web] --> CTRL[Adapters HTTP]
  CTRL --> UC[Casos de uso]
  UC --> DOM[Dominio]
  UC --> PORT[Puertos]
  PORT --> PG[Adapter Postgres]
  PORT --> MY[Adapter MySQL]
  PORT --> MO[Adapter Mongo]
  PORT --> RD[Adapter Redis]
```

Regla: `dominio/` no importa NestJS ni drivers. Los casos de uso no tienen `if` por motor. El JWT (Entrega II) lleva `institucionId` y un provider de request scope elige el adaptador.
