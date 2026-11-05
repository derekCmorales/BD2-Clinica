# Tasks

## 1. Andamiaje

- [ ] 1.1 Proyecto Jest `contrato` separado del unitario
- [ ] 1.2 Fábrica de adaptadores reales leyendo `.env` (sin `if` en los escenarios)
- [ ] 1.3 Script `pnpm test:contrato` (compose up, espera de salud, migrate, jest)

## 2. Escenarios

- [ ] 2.1 Crear paciente + obtener
- [ ] 2.2 Consulta, diagnóstico, receta
- [ ] 2.3 Archivar y rechazo posterior
- [ ] 2.4 Cita solapada (Hospital por exclusión, MySQL por `FOR UPDATE`, Mongo y Redis según su adaptador)
- [ ] 2.5 Escritura concurrente → `ConflictoDeConcurrencia`
- [ ] 2.6 Auditoría: cada lectura restringida deja una entrada

## 3. Salida

- [ ] 3.1 Reporte por motor (pasa/falla por escenario) en `docs/entrega-2/evidencia-contrato.md`
