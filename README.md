# Historiales clínicos — Bases de Datos II (URL)

Plataforma de historiales para cuatro instituciones, cada una con un motor distinto.

| Institución | Motor |
|---|---|
| Hospital general | PostgreSQL |
| Clínica odontológica | MySQL |
| Laboratorio clínico | MongoDB |
| Centro pediátrico | Redis (registro; no caché) |

## Arranque rápido

```bash
pnpm preparar           # .env + keyfile de Mongo (ninguno se versiona)
pnpm install
docker compose up -d
pnpm db:migrate         # aplica solo las migraciones pendientes (tabla schema_migrations)
pnpm db:seed            # destructivo: datos sintéticos
pnpm verificar:entrega-1
pnpm verificar:arquitectura   # dominio/ sin imports de infraestructura
pnpm dev:api   # http://localhost:3000/salud  (PERSISTENCIA=memoria por defecto)
pnpm dev:web   # http://localhost:5173  — misma UI para las cuatro instituciones
pnpm test
```

OpenAPI: `http://localhost:3000/docs`. Clave de laboratorio: `demo` (`DEMO_CLAVE`).

Con los motores reales: `PERSISTENCIA=motores` en `.env`, Docker arriba, y `pnpm db:migrate`.

Documentación Entrega I: [`docs/entrega-1/`](docs/entrega-1/).

Documento único listo para copiar/pegar a Word: [`docs/entrega-1/ENTREGA-I.html`](docs/entrega-1/ENTREGA-I.html)

```bash
pnpm docs:entrega-1:full   # regenera PNG + HTML
open docs/entrega-1/ENTREGA-I.html
```

## Puertos (solo 127.0.0.1)

Fuera de los default a propósito: si hay motores instalados en el host (Homebrew, Postgres.app),
`localhost:5432` llegaría a ellos y no al contenedor, sin ningún error.

| Servicio | Host | Usuario de app |
|---|---|---|
| PostgreSQL · Hospital | `localhost:5433` | `hospital_app` |
| MySQL · Odontología | `localhost:3307` | `odontologia_app` |
| MongoDB · Laboratorio | `localhost:27018` (`directConnection=true`) | `laboratorio_app` |
| Redis · Pediátrico (registro) | `localhost:6390` | `pediatrico_app` (ACL, sin `@dangerous`) |
| Redis · Caché | `localhost:6391` | `cache_app` |

Los usuarios de init (`01-roles.sh`, `01-usuario-app.js`) solo se crean con volumen nuevo:
`docker compose down -v` para reinicializar.

## Estructura

```
apps/api/          NestJS hexagonal (dominio / aplicacion / infraestructura)
apps/web/          Cliente placeholder
docs/entrega-1/    Entregable académico
infra/             Init de Compose (roles, charset, redis)
scripts/           migrate, seed, verificar, mermaid
```

## Nota Redis vs Firebase

Firebase del enunciado se sustituye por Redis para pediatría. Pendiente de autorización del catedrático; el rollback es un adaptador.
