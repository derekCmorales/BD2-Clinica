# Tasks

## 1. Andamiaje

- [x] 1.1 Proyecto Jest `contrato` separado del unitario
- [x] 1.2 Fábrica de adaptadores reales leyendo `.env` (sin `if` en los escenarios)
- [x] 1.3 Script `pnpm test:contrato` (compose up, espera de salud, migrate, jest)

## 2. Escenarios

- [x] 2.1 Crear paciente + obtener
- [x] 2.2 Consulta, diagnóstico, receta
- [x] 2.3 Archivar y rechazo posterior
- [x] 2.4 Cita solapada (Hospital por exclusión, MySQL por `FOR UPDATE`, Mongo y Redis según su adaptador)
- [x] 2.5 Escritura concurrente → `ConflictoDeConcurrencia`
- [x] 2.6 Auditoría: cada lectura restringida deja una entrada

## 3. Salida

- [x] 3.1 Reporte por motor (pasa/falla por escenario) en `docs/entrega-2/evidencia-contrato.md`
