# Tasks

## 1. Decisión

- [ ] 1.1 [DECISIÓN] Elegir A, B o C (design.md) y escribir la justificación en una línea

## 2. Si A — síncrono

- [ ] 2.1 Eliminar `XADD` del adaptador de Postgres o documentarlo como no usado
- [ ] 2.2 Script `pnpm hospital:reproyectar` (reconstrucción desde `eventos`)

## 3. Si B — asíncrono

- [ ] 3.1 Módulo `proyector/` con grupo de consumo y arranque en `main.ts`
- [ ] 3.2 [DECISIÓN] Mecanismo de idempotencia (lo implementas tú o pides «dame la solución»)
- [ ] 3.3 Reintentos con `XPENDING`/`XCLAIM`
- [ ] 3.4 Ajustar la UI: lectura tras escritura desde el agregado

## 4. Si C — híbrido

- [ ] 4.1 Consumidor que invalida `cache:expediente:{id}` en Redis DB 1
- [ ] 4.2 Script de reconstrucción (igual que 2.2)

## 5. Común

- [ ] 5.1 Test de reconstrucción en la suite de contrato
- [ ] 5.2 Sección en el documento comparativo (consistencia fuerte vs eventual)
