# Tasks

## 1. Decisión

- [x] 1.1 [DECISIÓN] Elegir A, B o C (design.md) y escribir la justificación en una línea — A: proyector síncrono en la misma transacción; el read model tiene consistencia fuerte y se elimina el stream sin consumidor

## 2. Si A — síncrono

- [x] 2.1 Eliminar `XADD` del adaptador de Postgres o documentarlo como no usado
- [x] 2.2 Script `pnpm hospital:reproyectar` (reconstrucción desde `eventos`)

## 3. Si B — asíncrono

- [x] 3.1 No aplica: se eligió A
- [x] 3.2 [DECISIÓN] No aplica: se eligió A
- [x] 3.3 No aplica: se eligió A
- [x] 3.4 No aplica: se eligió A

## 4. Si C — híbrido

- [x] 4.1 No aplica: se eligió A
- [x] 4.2 No aplica: se eligió A

## 5. Común

- [x] 5.1 Test de reconstrucción en la suite de contrato
- [ ] 5.2 Sección en el documento comparativo (consistencia fuerte vs eventual)
