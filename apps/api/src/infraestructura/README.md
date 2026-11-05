# Adaptadores de infraestructura

- `postgres/` — Hospital. Event store `clinico.eventos` + proyector al read model 3NF.
- `mysql/` — Odontología. Transacción InnoDB, `REPEATABLE READ`, `SELECT ... FOR UPDATE` en citas.
- `mongo/` — Laboratorio. `replaceOne` con versión; exámenes referenciados.
- `redis/` — Pediátrico. Lua atómico sobre RedisJSON + ZSET.
- `routing/` — `EnrutadorDeMotor`.
- `cache/` — Caché transversal, instancia distinta al registro pediátrico.
- `memoria/` — Los cuatro almacenes en proceso cuando `PERSISTENCIA=memoria`.
