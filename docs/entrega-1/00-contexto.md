# Contexto: red de instituciones y motores

```mermaid
flowchart LR
  subgraph plataforma [Plataforma compartida]
    API[API NestJS]
    WEB[Cliente web idéntico]
  end

  WEB --> API

  API --> PG[(PostgreSQL<br/>Hospital general)]
  API --> MY[(MySQL<br/>Clínica odontológica)]
  API --> MO[(MongoDB<br/>Laboratorio clínico)]
  API --> RD[(Redis DB0<br/>Centro pediátrico)]
  API --> RC[(Redis caché<br/>TTL / sin persistencia)]
```

| Institución | Motor | Entrega I |
|---|---|---|
| Hospital general | PostgreSQL | ER + DDL 3NF |
| Clínica odontológica | MySQL | ER + DDL 3NF + odontograma |
| Laboratorio clínico | MongoDB | Análisis completo (entidades, atributos, ops) |
| Centro pediátrico | Redis | Análisis completo (entidades, atributos, ops) |

Cada institución es dueña de su infraestructura. Un mismo motor no se repite.
