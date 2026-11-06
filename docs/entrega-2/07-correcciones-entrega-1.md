# Correcciones a partir de la retroalimentación de Entrega I

La retroalimentación de la Entrega I apuntó a tres frentes: validación real en los
motores, privilegios y consistencia. Las correcciones se hicieron en el esquema y en el
código, no solo en el documento.

**Validación en MongoDB.** El `$jsonSchema` original usaba `const`, una palabra que el
validador de MongoDB no soporta; la migración fallaba y la colección quedaba sin
validación. Se reemplazó por `enum` y se agregó la migración `002`, que alinea el
esquema con el catálogo del dominio: hematología y orina con sus campos requeridos,
cultivo con antibiograma embebido. Se usa `validationLevel: moderate` para no invalidar
documentos viejos al endurecer el esquema.

**Privilegios en MySQL.** El entrypoint oficial crea el usuario de app con `ALL
PRIVILEGES` sobre la base, así que el `GRANT` de la primera migración no restringía nada.
La migración `002_privilegios.sql` revoca todo y deja `SELECT/INSERT` en toda la base,
`UPDATE` tabla por tabla y ningún `DELETE`; la auditoría queda fuera de `UPDATE`. En
PostgreSQL se hizo lo equivalente: `REVOKE UPDATE, DELETE, TRUNCATE` sobre
`auditoria_acceso` y `eventos`.

**Odontograma.** La restricción `codigo_fdi BETWEEN 11 AND 48` aceptaba códigos que no
existen en FDI (19, 20, 29, 30, 39, 40). La migración `003_check_fdi.sql` valida
cuadrante 1–4 y posición 1–8, que es la regla real.

**Consistencia en PostgreSQL.** La Entrega I no tenía event store ni una garantía de
exclusión para citas. La migración `003_event_store.sql` agrega `clinico.eventos` con
`UNIQUE(aggregate_id, version)`, `proyeccion_aplicada` y la restricción `citas_sin_solape`
con `btree_gist`. El read model sigue en 3NF; el expediente se enmienda con eventos.

**Duplicación en el cliente.** La lista de campos por tipo de examen estaba copiada en el
dominio, en el `$jsonSchema` y en el cliente. Ahora hay una sola fuente
(`CATALOGO_EXAMENES`) servida por `GET /catalogos/examenes`; el formulario y la tarjeta se
construyen desde ahí.

**Redis en lugar de Firebase.** La sustitución está pendiente de autorización del
catedrático. Si se rechaza, Firebase vuelve para el Pediátrico y Redis queda como caché;
el cambio debe ser de un adaptador.

**Datos de demostración.** Los seeds ahora incluyen un expediente archivado, un paciente
menor, una dosis vencida, tres tipos de examen y un odontograma con estados. Así la
defensa no depende de crear datos a mano.

| Corrección | Dónde |
|---|---|
| `$jsonSchema` de Mongo usaba `const`, palabra no soportada; se reemplazó por `enum` y se alineó con el catálogo | `apps/api/src/infraestructura/mongo/migrations/001_esquema.js`, `002_examenes_catalogo.js` |
| MySQL otorgaba `ALL PRIVILEGES` por el entrypoint; se redujo a DML mínimo y auditoría append-only | `apps/api/src/infraestructura/mysql/migrations/002_privilegios.sql` |
| `chk_pieza_fdi` aceptaba 19, 20, 29, 30, 39 y 40; ahora valida cuadrante 1–4 y posición 1–8 | `apps/api/src/infraestructura/mysql/migrations/003_check_fdi.sql` |
| PostgreSQL no tenía event store ni exclusión de citas; se agregaron `clinico.eventos` y `citas_sin_solape` | `apps/api/src/infraestructura/postgres/migrations/003_event_store.sql` |
| Redis sustituyó a Firebase para el centro pediátrico (pendiente de autorización del catedrático) | `docker-compose.yml`, `AGENTS.md` §3 |
| La UI duplicaba los campos de examen; ahora los consume del catálogo | `apps/web/src/Hoja.tsx`, `GET /catalogos/examenes` |
