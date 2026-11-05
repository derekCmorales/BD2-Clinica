# Plan: Init + Entrega I (modelo relacional)

**Source**: `LINEAMIENTOS.md` + `AGENTS.md`
**Selected Milestone**: Entrega I + andamiaje del repositorio
**Complexity**: Large

## Summary

Levantar el repositorio (Docker Compose, NestJS hexagonal vacío, cliente placeholder) y producir el entregable académico de Entrega I: análisis del historial clínico para las cuatro instituciones, ER + modelo relacional + 3NF solo para Hospital (PostgreSQL) y Odontología (MySQL), clasificación de datos, catálogo de operaciones, y DDL + seeds sintéticos en los dos motores relacionales.

Los diagramas van en Mermaid embebido (se renderizan en GitHub/VS Code/Cursor) y además se exportan a SVG para el PDF/impreso.

---

## Requirements Restatement

1. **Init del repo** (boilerplate; lo implemento yo): monorepo `apps/api` + `apps/web`, Docker Compose con los cuatro motores, usuarios de BD con privilegios mínimos, `.env.example`, README de arranque.
2. **Análisis de las cuatro instituciones** (tú decides el modelo; yo documento y traduzco a DDL cuando apruebes): entidades, atributos, clasificación público/confidencial/restringido.
3. **ER + modelo relacional + 3NF** de Hospital y Clínica odontológica (las únicas en motores relacionales).
4. **Diagramas iniciales de las cuatro** en Mermaid renderizado: conceptual común + ER relacionales + preview documental (Mongo) y de estructuras Redis (no son modelo relacional; el enunciado no los pide como ER, pero cubren “el análisis debe cubrir las cuatro”).
5. **Operaciones en lenguaje sencillo** (punto de partida de Entrega II): sin SQL, sin endpoints, sin drivers.
6. **Implementación en motores relacionales**: PostgreSQL y MySQL arriba, migraciones aplicadas, seeds sintéticos, verificación con queries de humo.

**Fuera de esta entrega (Entrega II):** UI funcional, JWT/enrutamiento, casos de uso reales, Mongo schema validation, RedisJSON/ZSET, Event Sourcing físico del Hospital, documento comparativo.

---

## Patterns to Mirror

El repositorio no tiene código. No hay naming, errors, logging, data access ni tests que espejar.

| Category | Source | Pattern |
|---|---|---|
| Naming | `AGENTS.md` §10 | Dominio en español (`Expediente`, `Consulta`); términos técnicos en inglés (`repository`, `event store`) |
| Architecture | `AGENTS.md` §5 | Hexagonal: `dominio/` no importa infraestructura ni NestJS |
| Data access | `AGENTS.md` §6 | Puertos `ExpedienteRepository` / `ExpedienteQueryService`; `guardar()` con estrategia distinta por motor |
| Security | `AGENTS.md` §8 | Público / confidencial / restringido; sin datos restringidos en logs; seeds sintéticos |
| NestJS layout | *descartado* | El esqueleto `modules/users/entities` del skill NestJS mezcla ORM con dominio. No se usa. |

**Descartado:** init con Prisma/TypeORM entities en el dominio. El modelo de dominio no lleva anotaciones de ORM. Las migraciones SQL viven en `infraestructura/postgres` y `infraestructura/mysql`.

---

## Decisión previa (bloqueante): Hospital conceptual vs event store

El enunciado pide **base de datos normalizada de un historial clínico**. `AGENTS.md` decide Event Sourcing para el Hospital (tabla `eventos`, read model proyectado). Si Entrega I entrega solo el event store, el catedrático puede rechazarlo: eso no es un ER de historial clínico.

Tres enfoques. Tú eliges.

| | Qué se entrega en Entrega I para Hospital | Consecuencia | Riesgo académico |
|---|---|---|---|
| **A — Dual (recomendada para la nota)** | ER conceptual del historial (3NF) **y** esquema físico `event_store` + `read_model` vacío, explicando que el expediente se enmienda, no se UPDATE | Cumple “modelo relacional del historial” y deja sentada la decisión de ES | Trabajo extra de documentar dos capas |
| **B — Solo conceptual ahora** | ER + tablas 3NF clásicas. Event store se introduce en Entrega II | Entrega I “se ve” como lo que el curso espera. Choca un poco con `AGENTS.md` | Hay que migrar el físico en Entrega II |
| **C — Solo event store** | Tabla `eventos` + UNIQUE(aggregate_id, version) | Fiel a ES desde el día 1 | Alto: no parece historial clínico normalizado |

No implemento DDL del Hospital hasta que elijas A, B o C.

**Descartada por mí como consejo (no como decisión tuya):** C. El enunciado evalúa modelado relacional del historial, no el patrón ES.

---

## Decisiones de modelado que NO tomo yo

Hasta que las marques, el DDL y los ER oficiales no se escriben. Cada una tiene alternativas; no hay “la” solución.

### 1. ¿Un núcleo compartido o cuatro modelos sueltos?

- **Núcleo + extensiones:** `Paciente`, `Expediente`, `Consulta`, `Diagnostico`, `Receta`, `Cita`, `Usuario` comunes; Odontología añade odontograma; Laboratorio añade examen; Pediatría añade curva/vacunas. El análisis de las cuatro arranca del mismo levantamiento.
- **Cuatro modelos independientes:** más “fiel” a instituciones aisladas; duplica entidades y complica el enunciado de “mismas reglas de negocio”.
- **Un solo ER gigante para las cuatro:** niega el aislamiento de datos que el caso exige.

### 2. Odontograma (32 piezas)

- **Tabla `pieza_dental` (32 filas/paciente) + `procedimiento_dental`:** 3NF clara, historial consultable. Más JOINs.
- **JSON/JSONB de 32 entradas en el expediente:** simple de leer; rompe 1NF; en MySQL se puede pero es un hallazgo comparativo débil si el resto es relacional.
- **32 columnas `pieza_11` … `pieza_48`:** anti-modelo; no soporta historial de procedimientos.

### 3. Diagnóstico y medicamento: catálogo vs texto libre

- **Catálogos `diagnostico_cie` / `medicamento` + FK:** 3NF, evita sinónimos, exige seed de catálogo (CIE-10 completo es excesivo; un subconjunto sintético basta).
- **Texto libre en la consulta:** 1NF pero no 3NF si el mismo diagnóstico se repite como string; peor para “agregar diagnóstico” como regla de negocio.
- **Híbrido:** FK opcional + `texto_libre` para lo que no está en catálogo.

### 4. Citas y solapamiento

- **Tablas `cita(medico_id, inicio, fin)` + exclusion constraint en Postgres / `SELECT FOR UPDATE` en MySQL:** el enunciado del Hospital pide integridad de agenda.
- **Sin entidad Cita, solo Consulta:** mezcla “turno reservado” con “atención ocurrida”; pierde el caso de cancelación/inasistencia.

### 5. Expediente vs Paciente

- **1:1 Paciente–Expediente:** un paciente, un historial por institución (el caso es multi-institución aislada, así que 1:1 *dentro de cada motor*).
- **Expediente 1:N Consulta, Paciente embebido en Expediente:** el paciente deja de ser entidad y no puedes “paciente nuevo” vs “ya registrado” con claridad.

### 6. Auditoría

- **Tabla `auditoria_acceso` en cada motor relacional desde Entrega I:** el requisito de “todo acceso a restringido genera entrada” queda visible en el modelo.
- **Dejarla para Entrega II:** el modelo de Entrega I queda más “clínico puro” y omitiría un requisito transversal de `AGENTS.md` §8.

---

## Diagramas Mermaid previstos (todos renderizados)

Ubicación: `docs/entrega-1/` (Markdown con bloques `mermaid`) + `docs/entrega-1/render/` (SVG exportados con `@mermaid-js/mermaid-cli`).

| # | Archivo | Tipo | Cubierto |
|---|---|---|---|
| D0 | `00-contexto.md` | flowchart | Red de 4 instituciones → 4 motores |
| D1 | `01-dominio-conceptual.md` | erDiagram | Núcleo compartido (análisis, no físico) |
| D2 | `04-hospital-er.md` | erDiagram | Hospital — modelo conceptual 3NF |
| D3 | `04-hospital-fisico.md` | erDiagram o flowchart | Hospital — físico (según A/B/C) |
| D4 | `05-odontologia-er.md` | erDiagram | Odontología — ER + odontograma |
| D5 | `05-odontologia-relacional.md` | erDiagram | Odontología — tablas/FK |
| D6 | `06-laboratorio-preview.md` | flowchart | Lab — paciente ⟂ exámenes referenciados (preview Entrega II) |
| D7 | `07-pediatrico-preview.md` | flowchart | Pediatría — RedisJSON + ZSET (preview Entrega II) |
| D8 | `03-clasificacion.md` | flowchart | Público / confidencial / restringido |
| D9 | `08-operaciones.md` | flowchart | Operaciones de la app (sin implementación) |
| D10 | `00-hexagonal.md` | flowchart | Puertos/adaptadores (contexto, no se evalúa) |

Mermaid `erDiagram` no dibuja cardinalidad tan rica como Chen; en el documento se anota verbalmente 1:1 / 1:N / N:M y dependencias funcionales para la prueba de 3NF.

---

## Catálogo candidato de entidades (para que lo apruebes o recortes)

Núcleo (las cuatro instituciones, lenguaje del médico):

| Entidad | Para qué existe | Motor(es) Entrega I |
|---|---|---|
| Institucion | Datos públicos del establecimiento | no persiste en 4 copias; metadato de routing |
| Usuario | Quién actúa (médico, secretaria, laboratorista) | PG, MySQL |
| Paciente | Persona atendida; alta de nuevo ingreso | PG, MySQL |
| Expediente | Contenedor del historial; se archiva | PG, MySQL |
| Cita | Reserva de agenda (no es la consulta ocurrida) | PG, MySQL |
| Consulta | Atención ocurrida | PG, MySQL |
| Diagnostico | Hallazgo clínico ligado a una consulta | PG, MySQL |
| Receta | Indicación de medicamento ligada a una consulta | PG, MySQL |
| Medicamento | Catálogo (si eliges catálogo) | PG, MySQL |
| AuditoriaAcceso | Quién leyó/escribió dato restringido | PG, MySQL |

Extensiones (análisis Entrega I; físico no relacional hasta Entrega II):

| Entidad | Institución |
|---|---|
| PiezaDental, ProcedimientoDental | Odontología (sí va a MySQL en Entrega I) |
| TipoExamen, ResultadoExamen | Laboratorio (Mongo; solo conceptual ahora) |
| MedicionCrecimiento, DosisVacuna | Pediatría (Redis; solo conceptual ahora) |

---

## Clasificación de datos (transversal; no es decisión de esquema)

| Nivel | Ejemplos | Tratamiento Entrega I |
|---|---|---|
| Público | Nombre de institución, especialidades, horarios | Visible sin auth en docs; tabla o seed `institucion` |
| Confidencial | Nombre del paciente, teléfono, dirección, DPI | Columnas en `paciente`; usuario de BD no es `root` |
| Restringido | Diagnósticos, resultados de lab, VIH, salud mental, **todo dato de menor** | Documentado; seeds sintéticos; **nunca** en logs |

Pediátrico: el expediente completo de un menor es restringido por edad, no solo el diagnóstico. Eso hay que decirlo explícito en `03-clasificacion.md`.

---

## Operaciones (lenguaje sencillo; semilla de Entrega II)

Sin SQL, sin HTTP, sin “cómo”.

1. Registrar paciente de nuevo ingreso.
2. Buscar paciente ya registrado (nombre, DPI, o identificador interno).
3. Abrir el expediente de un paciente.
4. Agendar una cita (sin solapar con otra del mismo médico).
5. Registrar una consulta ocurrida.
6. Agregar un diagnóstico a una consulta.
7. Recetar un medicamento.
8. Consultar el historial (consultas, diagnósticos, recetas).
9. Archivar un expediente (traslado, fallecimiento, baja administrativa) — no borrar.
10. Registrar acceso a información restringida (auditoría).
11. *Odontología:* actualizar estado de una pieza y agregar procedimiento.
12. *Laboratorio:* registrar resultado de examen (estructura según tipo) — no se implementa en Entrega I.
13. *Pediatría:* registrar medición de crecimiento y dosis de vacuna — no se implementa en Entrega I.

---

## Files to Change

| File | Action | Why |
|---|---|---|
| `docker-compose.yml` | CREATE | Postgres, MySQL, Mongo replica set, Redis (DB0 persistente + DB1 volátil) |
| `.env.example` | CREATE | Hosts, puertos, usuarios de app (sin secretos reales) |
| `.gitignore` | CREATE | `node_modules`, `.env`, datos de volúmenes |
| `package.json` (root) | CREATE | Workspaces `apps/api`, `apps/web`; script `docs:mermaid` |
| `apps/api/` | CREATE | NestJS: `dominio/`, `aplicacion/`, `infraestructura/` vacíos + health |
| `apps/web/` | CREATE | Vite placeholder (UI idéntica llega en Entrega II) |
| `apps/api/infraestructura/postgres/migrations/` | CREATE | DDL Hospital (según A/B/C) |
| `apps/api/infraestructura/mysql/migrations/` | CREATE | DDL Odontología |
| `apps/api/infraestructura/postgres/seeds/` | CREATE | Datos sintéticos |
| `apps/api/infraestructura/mysql/seeds/` | CREATE | Datos sintéticos |
| `docs/entrega-1/*.md` | CREATE | Entregable académico |
| `docs/entrega-1/render/*.svg` | CREATE | Diagramas exportados |
| `README.md` | CREATE | Cómo levantar Compose y dónde está Entrega I |
| `AGENTS.md` / `LINEAMIENTOS.md` | KEEP | Ya existen |

---

## Implementation Phases

### Fase 0 — Init (boilerplate; no espera tus decisiones de modelo)

- `package.json` workspaces; NestJS en `apps/api` con capas hexagonales **vacías** (puertos como interfaces, cero adaptadores de negocio).
- `apps/web` Vite + React placeholder (“Entrega II”).
- Docker Compose:
  - `postgres` 16, DB `hospital`, user `hospital_app` (CONNECT + DML en schemas de app, sin SUPERUSER).
  - `mysql` 8, DB `odontologia`, user `odontologia_app`, `utf8mb4`, InnoDB.
  - `mongo` replica set de 1 nodo (exigencia de transacciones; no se usa aún).
  - `redis`: AOF `appendfsync everysec` + RDB; comentar en compose el trade-off de 1s. DB 0 persistente, DB 1 sin persistencia — **dos instancias**, no `SELECT` entre DBs con políticas mezcladas. Descartado: un solo Redis y `SELECT 1` para caché, porque AOF persistiría también la caché “volátil”.
- Healthcheck HTTP `GET /salud` que solo confirma que el proceso Nest está vivo (no ping a motores todavía: eso filtraría infraestructura al borde sin puerto).
- README: `docker compose up`, `pnpm i`, puertos.

**Validate:** `docker compose ps` healthy; `curl localhost:3000/salud` → 200.

### Fase 1 — Documento Entrega I (después de tus decisiones 1–6 y A/B/C)

- Redactar `docs/entrega-1/` con entidades, atributos, clasificación, operaciones, prueba de 3NF (dependencias funcionales escritas, no solo “está en 3NF”).
- Mermaid de D0–D10 según la tabla.
- Export SVG: `npx @mermaid-js/mermaid-cli`.
- Párrafo explícito: Firebase sustituido por Redis, pendiente de autorización; rollback = un adaptador.

**Validate:** los `.md` renderizan mermaid en preview; cada SVG existe y corresponde a un diagrama.

### Fase 2 — DDL relacional (traduce TUS decisiones; no inventa esquema)

- Migraciones SQL crudas (sin ORM). Postgres: schemas `event_store` / `read_model` si elegiste A; o schema `clinico` si B.
- MySQL: tablas InnoDB utf8mb4; odontograma según tu elección del punto 2.
- Constraints: PK, FK, UNIQUE. Exclusion `btree_gist` en citas Postgres **solo si** confirmas Citas (punto 4). En MySQL no hay exclusion constraint: documentar que el equivalente es `SELECT … FOR UPDATE` en Entrega II, no una constraint de tabla.
- Grants al usuario de aplicación: SELECT/INSERT/UPDATE sobre tablas de app; sin DROP/CREATE.
- Seeds sintéticos (nombres ficticios, DPI inventado). Cero datos clínicos reales.

**Validate:** `docker compose up` aplica migraciones; `\dt` / `SHOW TABLES` coinciden con el modelo relacional documentado; un `INSERT` de paciente + consulta de humo funciona en ambos motores.

### Fase 3 — Cierre Entrega I (no es la app)

- Script `scripts/verificar-entrega-1.sh`: espera healthy, corre 2–3 SELECTs de conteo, sale 0.
- Nota en el documento: Mongo y Redis están *arriba* en Compose para no rehacer infra, pero **no** hay implementación de negocio ahí.

---

## Qué implemento yo vs qué decides tú

| Yo (sin preguntar) | Tú (si no dices “dame la solución”, no lo cierro) |
|---|---|
| Compose, NestJS vacío, Vite, health, README, scripts, usuarios de BD, OpenAPI vacío | ER, 3NF, odontograma, catálogos vs texto, citas, expediente 1:1, A/B/C del Hospital |
| Estructura de `docs/entrega-1/` y export SVG | Contenido de atributos y cardinalidades |
| Traducir a SQL **después** de que elijas | Normalización y “embeber vs tabla” |

Si en la confirmación marcas las decisiones, Fase 1–2 avanzan. Si dices “dame la solución” en un punto, ese punto lo cierro yo con una de las alternativas y lo dejo justificado en el doc.

---

## Dependencies

- Docker Desktop
- Node 22 + pnpm
- NestJS CLI / scaffold manual
- `@mermaid-js/mermaid-cli` (headless Chromium) para SVG
- No Kafka, no Firebase, no Prisma

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Catedrático rechaza Redis en lugar de Firebase | Media | Nota en Entrega I; rollback = un adaptador. No bloquear init. |
| Entrega I del Hospital se ve “no relacional” por ES | Alta si eliges C | Elige A o B |
| Mermaid `erDiagram` insuficiente para Chen | Media | Complementar con cardinalidad escrita + 3NF por dependencias funcionales |
| Exclusion constraint vs MySQL | Baja | Documentar la asimetría; no fingir un equivalente de tabla |
| Scope creep a Entrega II (JWT, UI, Mongo) | Alta | Fase 3 es el corte: Compose enciende 4 motores, solo 2 tienen DDL |
| Init NestJS con ORM “por costumbre” | Media | SQL crudo en migraciones; cero decoradores en `dominio/` |

---

## Estimated Complexity: LARGE

- Init / Compose: 2–3 h
- Documento + Mermaid + SVG: 4–6 h (tras tus decisiones)
- DDL + seeds + verificación: 3–4 h
- Total: ~10–13 h de calendario, no de “una sesión”

---

## Acceptance

- [ ] `docker compose up` deja Postgres, MySQL, Mongo, Redis healthy
- [ ] NestJS responde `/salud`; `dominio/` no importa Nest ni drivers
- [ ] `docs/entrega-1/` cubre los 8 bullets del enunciado
- [ ] 10 diagramas Mermaid + SVG
- [ ] Hospital y Odontología tienen DDL aplicado y seed sintético
- [ ] Clasificación público/confidencial/restringido escrita, con menores = restringido
- [ ] Lista de operaciones sin implementación
- [ ] Mongo/Redis sin esquema de negocio (solo infra)
- [ ] Nota Firebase→Redis visible

---

## Decisiones cerradas (2026-09-03)

| # | Decisión | Elección |
|---|---|---|
| 1 | Hospital Entrega I | **B** — ER + tablas 3NF clásicas ahora; event store en Entrega II |
| 2 | Alcance del modelo | **Núcleo compartido + extensiones** |
| 3 | Odontograma | **`pieza_dental` (32/paciente) + `procedimiento_dental`** (3NF; JSON y 32 columnas descartados) |
| 4 | Diagnóstico / medicamento | **Híbrido** — catálogo con FK opcional + `texto_libre` |
| 5 | Cita vs Consulta | **Aparte pero conectadas** (`cita.consulta_id` nullable) |
| 6 | Paciente–Expediente | **1:1** dentro de cada motor |
| 7 | Auditoría | **Sí** — tabla `auditoria_acceso` en Entrega I |
| 8 | Ejecución | **Todo e2e** (Fases 0–3) |

**Descartado en odontograma:** JSON (rompe 1NF en un entregable de normalización) y 32 columnas (sin historial de procedimientos).
