# Contexto del proyecto

> Colocar este archivo en la raíz del repositorio.
> Funciona como `CLAUDE.md` (Claude Code), `.cursorrules` (Cursor) o
> instrucciones de proyecto en cualquier agente. Ajusta el nombre según tu herramienta.

---

## 1. Qué es este proyecto

Plataforma de historiales clínicos para una red de cuatro instituciones médicas
independientes. Cada institución es dueña de su propia infraestructura de datos y
usa un **motor de base de datos distinto**. La lógica de negocio es idéntica para
las cuatro y no depende de ningún motor.

Proyecto académico — Bases de Datos II, Universidad Rafael Landívar.

**Lo que se evalúa:** decisiones de modelado, consistencia y seguridad.
**Lo que NO se evalúa:** la implementación de la arquitectura en sí (es un medio,
no un fin).

---

## 2. Modo de trabajo — LEER ANTES DE RESPONDER

Estoy usando este proyecto para aprender. La regla general:

> **Tú nunca tomas decisiones de modelado. Yo nunca escribo boilerplate.**

### Temas donde NO debes dar código

En estos temas responde con preguntas socráticas, pistas, alternativas y sus
trade-offs. **Nunca con la implementación**, aunque yo la pida directamente,
a menos que use la frase exacta **"dame la solución"**:

1. Diseño de esquemas y decisiones de normalización
2. Embeber vs. referenciar en MongoDB
3. Elección de estructuras de datos en Redis
4. Reconstrucción de agregados desde eventos (Event Sourcing)
5. Chequeo de concurrencia optimista
6. El proyector del read model
7. El chequeo de idempotencia
8. Elección de nivel de aislamiento transaccional

Si te pido código en estos temas, responde algo como:
*"Este es uno de los temas centrales del proyecto. Te doy tres enfoques posibles
y sus consecuencias — decide tú. Si quieres que lo implemente igual, dime
'dame la solución'."*

### Temas donde SÍ debes implementar directamente, sin preguntar

Docker Compose, migraciones, DTOs, controllers, módulos de NestJS, configuración,
seeds, scripts, tests de andamiaje, tipos de TypeScript, manejo de errores HTTP,
documentación OpenAPI.

### Cómo quiero las revisiones

Cuando yo escriba código y te pida revisión: **señala el problema, no lo arregles.**
Si hay una race condition, dime dónde y por qué, no me des el parche.

### Formato de respuesta

- Español. Términos técnicos en inglés cuando sea lo estándar (event store,
  read model, aggregate). No traduzcas nombres de patrones.
- Directa. Sin preámbulos ni resúmenes de lo que acabo de decir.
- Cuando hay una decisión relevante, di explícitamente qué alternativa descartaste
  y por qué.
- Si detectas que estoy a punto de cometer un error de modelado, dilo antes de
  escribir cualquier código.

---

## 3. Asignación de motores

| Institución | Motor | Justificación |
|---|---|---|
| **Hospital general** | PostgreSQL | Integridad transaccional fuerte, trazabilidad médico-legal. Único que justifica Event Sourcing. Constraints de exclusión para agenda, JSONB para lo variable |
| **Clínica odontológica** | MySQL | Sin personal técnico propio → prioriza operabilidad: hosting gestionado barato, herramientas gráficas, ecosistema amplio. Dominio CRUD simple. Justificación **operativa**, no técnica |
| **Laboratorio clínico** | MongoDB | Estructura del resultado varía por tipo de examen. Modelarlo relacional lleva a EAV, que es la anti-solución |
| **Centro pediátrico** | Redis | Consultas frecuentes y cortas; acceso siempre por clave conocida. Curva de crecimiento → sorted set. Esquema de vacunación → ZSET por fecha. Expediente → RedisJSON |

**Redis es sistema de registro, no caché**, para el centro pediátrico.
Requiere AOF (`appendfsync everysec`) + RDB. Documentar esto siempre.

Redis tiene **doble rol** y hay que mantenerlo explícito:
- **DB 0** — sistema de registro del centro pediátrico. Persistencia activada.
- **DB 1** — caché transversal a los cuatro motores. Volátil, con TTL, sin persistencia.

> **Nota:** Firebase fue sustituido por Redis. Esta sustitución está pendiente de
> autorización del catedrático. Si se rechaza, Firebase vuelve para el centro
> pediátrico y Redis queda solo como caché — debe ser un cambio de un adaptador.

---

## 4. Stack y alcance

**Incluido:**
- NestJS + TypeScript, un solo backend modular
- PostgreSQL, MySQL, MongoDB, Redis
- Arquitectura hexagonal (puertos y adaptadores)
- Event Sourcing + CQRS **solo en el Hospital general**
- Redis Streams como bus de eventos interno (proyector)
- Cliente web con UI **idéntica** para las cuatro instituciones
- Docker Compose para toda la infraestructura

**Explícitamente FUERA de alcance — no lo propongas:**
- Kafka (Redis Streams cubre la necesidad a una fracción del costo operativo)
- gRPC y microservicios (el enunciado pide cliente-servidor, singular)
- Saga / transacciones distribuidas (no hay: cada institución vive aislada en su
  motor, nunca se escribe en dos a la vez)
- Firebase, Cassandra, SQLite, Realm, LiteDB
- Kubernetes, service mesh, cualquier cosa de infraestructura avanzada

Si crees que algo de esta lista resuelve un problema, **dilo pero no lo implementes.**

---

## 5. Estructura del repositorio

```
apps/
  api/                    NestJS, único servicio
  web/                    cliente

src/
  dominio/                CERO imports de infraestructura. Regla inviolable.
    modelo/               Expediente, Consulta, Diagnostico, Receta,
                          ResultadoExamen, EsquemaVacunacion, CurvaCrecimiento
    eventos/              ConsultaRegistrada, DiagnosticoAgregado,
                          MedicamentoRecetado, ExpedienteArchivado
    puertos/              ExpedienteRepository, ExpedienteQueryService,
                          AuditLog, UnitOfWork

  aplicacion/             Casos de uso. UNO por regla de negocio,
                          compartido por las cuatro instituciones.
                          RegistrarConsulta, AgregarDiagnostico,
                          RecetarMedicamento, ArchivarExpediente,
                          CrearPacienteNuevo

  infraestructura/
    postgres/             event store + proyecciones      (Hospital)
    mysql/                adaptadores CRUD                (Odontológica)
    mongo/                adaptadores documentales        (Laboratorio)
    redis/                RedisJSON + ZSET + Lua          (Pediátrico)
    routing/              ResolvedorDeMotor: institución → adaptador
    cache/                Redis DB 1, transversal

  compartido/             tipos, errores, utilidades sin dependencias
```

### Reglas de arquitectura no negociables

1. `dominio/` no importa nada de `infraestructura/` ni de NestJS ni de ningún
   driver. Si necesitas un import ahí, el diseño está mal — **avísame en vez de
   hacerlo.**
2. Los casos de uso dependen de **interfaces** (puertos), nunca de clases concretas.
3. Los puertos hablan el lenguaje del médico, no del motor. `buscarPorQueryDeMongo()`
   es un error de diseño; `obtenerExpediente(pacienteId)` es correcto.
4. Un caso de uso funciona con los cuatro adaptadores sin un solo `if` por motor.
5. Los adaptadores traducen entre el modelo de dominio y el modelo de persistencia.
   El modelo de dominio nunca lleva anotaciones de ORM.

---

## 6. Contrato de los puertos

```typescript
export interface ExpedienteRepository {
  obtener(pacienteId: PacienteId): Promise<Expediente | null>;
  guardar(expediente: Expediente): Promise<void>;   // lanza ConflictoDeConcurrencia
}

export interface ExpedienteQueryService {
  porPaciente(pacienteId: PacienteId): Promise<ExpedienteVistaDTO | null>;
  buscar(criterio: CriterioBusqueda): Promise<ResumenExpedienteDTO[]>;
}
```

Cada adaptador implementa `guardar()` con una estrategia de consistencia distinta.
**Ese contraste es el corazón del proyecto y debe quedar documentado en el código:**

| Motor | Estrategia en `guardar()` |
|---|---|
| PostgreSQL | `INSERT` de eventos nuevos; `UNIQUE(aggregate_id, version)` para concurrencia optimista |
| MySQL | `UPDATE` dentro de transacción InnoDB; `SELECT ... FOR UPDATE` donde haga falta |
| MongoDB | `replaceOne` con `version` en el filtro (concurrencia optimista sobre documento) |
| Redis | Script Lua para read-modify-write atómico |

---

## 7. Enrutamiento por institución

El JWT contiene `institucionId`. Un provider con **scope de request** resuelve qué
implementación de `ExpedienteRepository` inyectar. Los casos de uso nunca se enteran
de qué motor están usando.

Prohibido: `if (institucion === 'hospital') { ... }` dentro de un caso de uso.
Si aparece algo así, es señal de que el puerto está mal diseñado — **avísame.**

---

## 8. Seguridad y clasificación de datos

Tres niveles, aplicables en los cuatro motores:

- **Público** — nombre de la institución, especialidades, horarios
- **Confidencial** — nombre del paciente, teléfono, dirección, DPI
- **Restringido** — diagnósticos, resultados de laboratorio, y con especial
  sensibilidad: VIH, salud mental, y todo dato de menores de edad

Requisitos transversales:
- Ningún dato restringido en logs. Nunca. Ni en desarrollo.
- Todo acceso a datos restringidos genera entrada de auditoría (quién, qué, cuándo).
- Usuarios de base de datos con privilegios mínimos, uno por institución.
- Los datos de prueba son sintéticos. Jamás datos clínicos reales.

---

## 9. Detalles por motor

### PostgreSQL — Hospital general
- Event store: `eventos(aggregate_id, version, tipo, payload JSONB, ocurrido_en, actor_id)`
  con `UNIQUE(aggregate_id, version)`
- Read model en schema separado, alimentado por el proyector
- `btree_gist` + constraint de exclusión para evitar solapamiento de citas
- El expediente se **enmienda**, nunca se modifica: un `UPDATE` destruye evidencia
  médico-legal. Esta es la razón de dominio que justifica el Event Sourcing.

### MySQL — Clínica odontológica
- CRUD directo, InnoDB, `utf8mb4`
- `REPEATABLE READ` (default) con `SELECT ... FOR UPDATE` para reservas de cita
- Odontograma: 32 piezas dentales, cada una con estado e historial de procedimientos
- Sin Event Sourcing. **La simplicidad aquí es deliberada** y es parte del hallazgo
  comparativo del proyecto.

### MongoDB — Laboratorio clínico
- Exámenes **referenciados**, no embebidos: un paciente acumula cientos y casi
  nunca se necesitan juntos. Embeberlos choca contra el límite de 16MB de BSON.
- Schema validation por tipo de examen (hematología, orina, cultivo tienen
  estructuras distintas). Sin esquema ≠ sin validación.
- Índice `{ pacienteId: 1, fecha: -1 }` como mínimo
- Transacciones multi-documento requieren replica set — configurar en Compose

### Redis — Centro pediátrico
- Expediente en **RedisJSON**: `paciente:{id}`
- Curva de crecimiento en **sorted set**: score = timestamp, member = medición
- Esquema de vacunación en **ZSET**: score = fecha próxima dosis
  → `ZRANGEBYSCORE vacunas:pendientes -inf {hoy}` da todos los vencidos en una operación
- Atomicidad con scripts **Lua**
- AOF `appendfsync everysec` + RDB. Se puede perder hasta 1s de datos: **documentar
  ese trade-off explícitamente**
- **Limitación conocida y a documentar:** sin consultas ad-hoc. "Todos los niños
  con percentil de peso bajo 3" requiere reindexar manualmente o RediSearch.

---

## 10. Convenciones

- Nombres del dominio en **español** (`Expediente`, `Consulta`, `Diagnostico`),
  porque el dominio es en español y así hablan los usuarios reales.
- Términos técnicos en **inglés** (`repository`, `event store`, `read model`).
- Sin abreviaturas crípticas: `pacienteId`, no `pid`.
- Errores de dominio como clases propias: `ConflictoDeConcurrencia`,
  `ExpedienteArchivado`, `PacienteNoEncontrado`. Nunca `throw new Error("...")`.
- Tests: el mismo caso de uso corre contra los cuatro adaptadores. Si un test
  necesita saber qué motor está debajo, algo está mal.
- Commits en español, imperativo: "agrega proyector de expediente".
