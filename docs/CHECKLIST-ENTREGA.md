# Checklist de entrega final — Entrega II

Se marca solo con evidencia (comando que pasa, archivo o captura). Lo ejecuta el agente
de cierre (`openspec/GOAL-CIERRE.md`) y lo revisa el estudiante.

## A. Enunciado (LINEAMIENTOS.md · Entrega II)

- [ ] Aplicación funcional cliente-servidor con los 4 motores (`PERSISTENCIA=motores`)
- [ ] Conexión cliente-servidor (web → API → motor según JWT)
- [ ] Modelado corregido según retroalimentación de Entrega I
- [ ] Consultas equivalentes en los 4 motores (suite de contrato, fase 4)
- [ ] Modelo documental Mongo/Redis: embeber vs referenciar justificado (fase 8)
- [ ] UI ordenada e idéntica para los 4 motores (fases 1–2 ✓, e2e fase 7)
- [ ] Registro de paciente nuevo (e2e ×4)
- [ ] Mantenimiento: consultas, diagnósticos, tratamientos, recetas (e2e ×4)
- [ ] Archivo/desactivación con motivo (e2e ×4)
- [ ] Enrutamiento por usuario sin reescribir la lógica (e2e de aislamiento)
- [ ] Documento comparativo: modelado, consistencia, seguridad, justificación por motor

## B. Reglas de AGENTS.md

- [ ] `pnpm verificar:arquitectura` verde (dominio sin infraestructura)
- [ ] Ningún `if` por institución/motor en `aplicacion/`
- [ ] Cada `guardar()` documenta su estrategia de consistencia en el código
- [ ] Ningún dato restringido en logs (test de fase 3)
- [ ] Todo acceso restringido auditado y consultable (fase 3)
- [ ] Usuarios de BD con privilegio mínimo, uno por institución
- [ ] Redis: AOF `everysec` + RDB y trade-off de 1 s documentado
- [ ] Datos 100 % sintéticos; sin secretos versionados (`.env` ignorado)
- [ ] Nada fuera de alcance (Kafka, gRPC, sagas, Firebase, K8s)

## C. Decisiones del estudiante (no las toma un agente)

- [ ] Fase 3 · dónde vive la lectura de auditoría; ¿revelar DPI se audita?
- [ ] Fase 5 · forma del proyector (A síncrono / B asíncrono / C híbrido) e idempotencia
- [ ] Fase 6 · campos por tipo de examen y ubicación del catálogo
- [ ] Fase 8 · redacción de justificaciones, embeber vs referenciar y hallazgos

## D. Calidad y CI

- [ ] `pnpm test` (unitarias) verde
- [ ] `pnpm test:contrato` verde en los 4 motores
- [ ] `pnpm e2e:motores` verde ×4 instituciones, desktop y móvil
- [ ] axe sin violaciones serias/críticas
- [ ] `pnpm build` verde
- [ ] GitHub Actions verde en el último commit

## E. Empaquetado

- [ ] `pnpm demo` levanta todo desde un clon limpio
- [ ] Seeds ricos (archivado, menor, dosis vencida, 3 tipos de examen, odontograma con estados)
- [ ] README de entrega + guion de demo de 10 min
- [ ] Matriz de cobertura Entrega II con enlaces a evidencia
- [ ] `openspec list` sin changes activos (todo archivado) y `openspec validate --all` verde
- [ ] Tag `entrega-2`
