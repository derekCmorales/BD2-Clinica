# Evidencia

## Comandos

| Comando | Qué demuestra | Último resultado |
|---|---|---|
| `pnpm test` | Unitarias del dominio, casos de uso, validación y logs | 3 suites, 15 tests verdes |
| `pnpm test:contrato` | 35 escenarios contra memoria, PostgreSQL, MySQL, MongoDB y Redis | 35/35 verdes; ver `evidencia-contrato.md` |
| `pnpm e2e:rapido` | Flujo completo en navegador con los adaptadores en memoria, escritorio y móvil | 14/14 verdes |
| `pnpm e2e:motores` | El mismo flujo contra los cuatro motores reales | 14/14 verdes; reporte en `e2e/reporte/` |
| `pnpm verificar:arquitectura` | `dominio/` sin imports de infraestructura | verde |
| `pnpm verificar:privilegios` | Privilegios mínimos y auditoría append-only por motor | verde |
| `pnpm hospital:reproyectar` | Reconstrucción del read model desde `clinico.eventos` | verde |
| `pnpm build` | API y cliente compilan | verde |

## Archivos

- [`evidencia-contrato.md`](evidencia-contrato.md) — tabla por motor y escenario.
- [`capturas/`](capturas/) — capturas de escritorio y móvil para las cuatro instituciones.
- [`../../apps/api/src/infraestructura/contrato/contrato-repositorio.contrato.spec.ts`](../../apps/api/src/infraestructura/contrato/contrato-repositorio.contrato.spec.ts) — suite de contrato.
- [`../../e2e/pruebas/flujo-clinico.spec.ts`](../../e2e/pruebas/flujo-clinico.spec.ts) — flujo parametrizado ×4.
- [`../../.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — CI con unitarias, contrato y e2e.

## Cómo regenerar

```bash
pnpm preparar
pnpm db:migrate
pnpm db:seed
pnpm test:contrato
pnpm e2e:motores
pnpm docs:entrega-2:full
```
