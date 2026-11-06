# Guion de demo — 10 minutos

## Antes de empezar (1 min)

```bash
pnpm install
pnpm demo
```

Abrir `http://localhost:5173` y `http://localhost:3000/docs`. Clave: `demo`.

## 1. Hospital general — PostgreSQL (2 min)

- Ingresar como **Hospital general**.
- Abrir **Carlos Ruiz Demo**: 3 exámenes (hematología, orina, cultivo), una consulta con
  diagnóstico y receta, y dos citas.
- Mostrar la pestaña **Accesos**: la lectura del expediente quedó auditada.
- Abrir **Lucía Menor Demo**: insignia «Menor de edad» y tutor.
- Abrir **Jorge Archivado Demo**: solo lectura y motivo de archivo.
- Mencionar: el expediente se enmienda con eventos; `pnpm hospital:reproyectar` reconstruye
  el read model desde `clinico.eventos`.

## 2. Clínica odontológica — MySQL (2 min)

- Ingresar como **Clínica odontológica**.
- Abrir **Sofía García Demo** → **Odontograma**: 32 piezas con estados (caries, obturado,
  ausente).
- Cambiar una pieza y registrar un procedimiento.
- Mencionar: `SELECT ... FOR UPDATE` evita dos citas del mismo médico a la misma hora.

## 3. Laboratorio clínico — MongoDB (2 min)

- Ingresar como **Laboratorio clínico**.
- Abrir **Luis Pérez Demo** → **Laboratorio**: tres tipos con estructuras distintas.
- Registrar una hematología nueva; mostrar que el formulario sale del catálogo
  `GET /catalogos/examenes`.
- Mostrar la tarjeta con un valor fuera de rango marcado **alto/bajo** y el antibiograma
  embebido del cultivo.
- Mencionar: exámenes referenciados, no embebidos (16 MB de BSON).

## 4. Centro pediátrico — Redis (2 min)

- Ingresar como **Centro pediátrico**.
- Abrir **Ana Hernández Demo** → **Crecimiento**: 6 mediciones y gráfica.
- **Vacunas**: una dosis vencida (SRP) y una próxima (DPT).
- Registrar una medición nueva.
- Mencionar: Redis es sistema de registro (AOF everysec + RDB); se puede perder hasta ~1 s.

## 5. Contraste y cierre (1 min)

- Mostrar la tabla de `guardar()` en [`03-consistencia.md`](03-consistencia.md): eventos,
  transacción con `FOR UPDATE`, `replaceOne` con versión y Lua atómico.
- Mostrar `pnpm test:contrato` y el reporte por motor.
- Cerrar con la limitación de Redis (sin consultas ad-hoc) y la nota Firebase→Redis.
