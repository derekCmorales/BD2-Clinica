# Historiales clínicos — Bases de Datos II (URL)

Plataforma de historiales para cuatro instituciones, cada una con un motor distinto.
La misma lógica de negocio y la misma UI corren sobre los cuatro; el JWT decide el motor.

| Institución | Motor | Rol |
|---|---|---|
| Hospital general | PostgreSQL | Event store + read model, integridad fuerte |
| Clínica odontológica | MySQL | CRUD InnoDB, odontograma |
| Laboratorio clínico | MongoDB | Resultados con estructura variable por tipo |
| Centro pediátrico | Redis | Sistema de registro (RedisJSON + ZSET), no caché |

## Arranque en 5 comandos

```bash
pnpm install
pnpm preparar          # .env + keyfile de Mongo (ninguno se versiona)
pnpm demo              # motores + migraciones + seeds + API + cliente
```

Abre `http://localhost:5173`, elige institución y usa la clave **`demo`**.
OpenAPI: `http://localhost:3000/docs`.

`pnpm demo` deja los contenedores arriba al salir; para apagarlos:
`docker compose down`.

### Arranque manual

```bash
pnpm preparar
docker compose up -d --wait postgres mysql mongo redis-pediatrico redis-cache
docker compose up -d mongo-init-replica
pnpm db:migrate
pnpm db:seed
PERSISTENCIA=motores pnpm dev:api
pnpm dev:web
```

Sin Docker, `PERSISTENCIA=memoria` (default) usa los cuatro adaptadores en proceso.

## Verificación

```bash
pnpm test                    # unitarias (sin Docker)
pnpm test:contrato           # 35 escenarios contra los 4 motores reales
pnpm e2e:rapido              # Playwright en memoria, escritorio y móvil
pnpm e2e:motores             # Playwright contra los 4 motores reales
pnpm verificar:arquitectura  # dominio/ sin imports de infraestructura
pnpm verificar:privilegios   # privilegios mínimos y auditoría append-only
pnpm hospital:reproyectar    # reconstruye el read model desde clinico.eventos
pnpm build
```

Evidencia de contrato: [`docs/entrega-2/evidencia-contrato.md`](docs/entrega-2/evidencia-contrato.md).
Capturas e2e: [`docs/entrega-2/capturas/`](docs/entrega-2/capturas/).

## Documento comparativo

- Índice: [`docs/entrega-2/README.md`](docs/entrega-2/README.md)
- HTML listo para Word/Google Docs: [`docs/entrega-2/ENTREGA-II.html`](docs/entrega-2/ENTREGA-II.html)
- Regenerar: `pnpm docs:entrega-2:full`
- Guion de demo: [`docs/entrega-2/11-guion-demo.md`](docs/entrega-2/11-guion-demo.md)
- Matriz de cobertura: [`docs/entrega-2/10-matriz-cobertura.md`](docs/entrega-2/10-matriz-cobertura.md)

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
apps/web/          Cliente React (misma UI para las cuatro instituciones)
e2e/               Playwright: flujo ×4, aislamiento, sesión, concurrencia, axe
docs/entrega-1/    Entregable académico anterior
docs/entrega-2/    Documento comparativo, evidencia y capturas
docs/design-system/ Tokens, componentes y capturas del cliente
openspec/          Changes de la Entrega II
infra/             Init de Compose (roles, charset, redis)
scripts/           demo, migrate, seed, contrato, e2e, verificación
```

## OpenSpec

```bash
npx @fission-ai/openspec@1.16.0 list
npx @fission-ai/openspec@1.16.0 validate --all
```

| Fase | Change | Estado |
|---|---|---|
| 1 | `fase-1-design-system` | Archivado |
| 2 | `fase-2-pantallas-clinicas` | Archivado |
| 3 | `fase-3-seguridad-visible` | Aplicado y archivado |
| 4 | `fase-4-contrato-adaptadores` | Aplicado y archivado |
| 5 | `fase-5-proyector-read-model` | Aplicado y archivado |
| 6 | `fase-6-laboratorio-por-tipo` | Aplicado y archivado |
| 7 | `fase-7-pruebas-e2e` | Aplicado y archivado |
| 8 | `fase-8-documento-comparativo` | Andamiaje completo; redacción del estudiante pendiente (3.1–3.4) |
| 9 | `fase-9-entrega-final` | Aplicado y archivado |

Checklist de cierre: [`docs/CHECKLIST-ENTREGA.md`](docs/CHECKLIST-ENTREGA.md).

## Nota Redis vs Firebase

Firebase del enunciado se sustituye por Redis para pediatría. Pendiente de autorización
del catedrático; el rollback es un adaptador.
