# Implementación en motores relacionales

## Artefactos

| Motor | Migración | Seed |
|---|---|---|
| PostgreSQL / Hospital | `apps/api/src/infraestructura/postgres/migrations/001_clinico.sql` | `.../seeds/001_demo.sql` |
| MySQL / Odontología | `apps/api/src/infraestructura/mysql/migrations/001_clinico.sql` | `.../seeds/001_demo.sql` |

## Cómo aplicar

```bash
pnpm preparar
docker compose up -d
pnpm db:migrate   # 001 + 002 + 003, registradas en schema_migrations
pnpm db:seed
pnpm verificar:entrega-1
```

## Usuarios de aplicación

| Motor | Usuario | Privilegios |
|---|---|---|
| PostgreSQL | `hospital_app` | CONNECT + SELECT/INSERT/UPDATE en schema `clinico`; `auditoria_acceso` solo SELECT/INSERT (002) |
| MySQL | `odontologia_app` | SELECT/INSERT en `odontologia.*`; UPDATE tabla por tabla, excepto `auditoria_acceso` (002) |

Sin SUPERUSER / sin DROP / sin DELETE en el usuario de app. La auditoría es append-only.

> El entrypoint oficial de `mysql:8.4` otorga `ALL PRIVILEGES` a `MYSQL_USER`. Un `GRANT` posterior
> es aditivo y no restringe nada: hace falta `REVOKE` explícito (migración `002_privilegios.sql`).

## Fuera de esta entrega

MongoDB y Redis están arriba en Compose (infra lista). El **análisis de negocio** de laboratorio y pediátrico está documentado en esta entrega; el esquema/código de adaptadores llega en Entrega II junto con JWT, UI clínica, casos de uso y Event Sourcing del Hospital.
