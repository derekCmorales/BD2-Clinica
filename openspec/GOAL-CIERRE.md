# /goal — Cierre del proyecto con OpenSpec

Copiar el bloque siguiente como prompt (o `/goal`) para el agente de cierre.

```text
/goal Cerrar el proyecto BD2-Clinica al 100 % para la Entrega II usando OpenSpec, hasta que
`openspec list` no tenga changes activos y docs/CHECKLIST-ENTREGA.md esté completo con evidencia.

Contexto obligatorio (léelo antes de tocar nada):
- AGENTS.md (reglas de arquitectura, temas reservados al estudiante, seguridad, convenciones)
- LINEAMIENTOS.md (enunciado; sección Entrega II)
- openspec/config.yaml, openspec/specs/ (design-system e interfaz-clinica ya aprobados y archivados)
- openspec/changes/fase-3 … fase-9 (proposal, design, tasks, specs)
- docs/design-system/README.md (toda UI nueva usa estos tokens y primitivas de apps/web/src/ui.tsx)
- docs/CHECKLIST-ENTREGA.md

CLI: `npx -y @fission-ai/openspec@1.16.0 <cmd>` con OPENSPEC_TELEMETRY=0.

Flujo por cada change, en este orden: fase-4 → fase-7 → fase-3 → fase-6 → fase-5 → fase-8 → fase-9.
1. Propose: relee proposal/design/specs; si el código cambió, ajusta el change y corre
   `openspec validate <change>`.
2. Apply: implementa las tareas una por una, marcando `- [x]` en tasks.md solo cuando haya
   evidencia (test verde, comando, archivo). Un commit por grupo de tareas, en español,
   imperativo (ej. "agrega suite de contrato de adaptadores").
3. Verifica: `pnpm test`, `pnpm build`, `pnpm verificar:arquitectura`, y desde que existan
   `pnpm test:contrato` y `pnpm e2e:rapido`. No avances con algo en rojo.
4. Archive: `openspec archive <change> -y` solo con todas las tareas en [x]; luego
   `openspec validate --all`.

Regla dura sobre [DECISIÓN]: las tareas marcadas [DECISIÓN] son temas reservados al
estudiante (AGENTS.md §2: esquema, embeber/referenciar, estructuras Redis, reconstrucción
desde eventos, concurrencia optimista, proyector, idempotencia, aislamiento). NO las decidas.
Al llegar a una, detente y pregunta al usuario presentando las alternativas que ya están en
el design.md del change, con sus consecuencias. Solo si el usuario responde con la frase
exacta "dame la solución" puedes implementarla tú. Mientras esperas, avanza con las tareas
que no dependen de esa decisión (andamiaje, DTOs, controllers, tests, CI, docs, seeds).

Restricciones:
- dominio/ sin imports de infraestructura; casos de uso sin `if` por motor.
- Ningún dato restringido en logs; datos de prueba 100 % sintéticos; no versionar .env.
- Fuera de alcance: Kafka, gRPC, microservicios, sagas, Firebase, Kubernetes.
- UI: misma pantalla para las cuatro instituciones, solo primitivas y tokens del design system.

Cierre:
- Recorre docs/CHECKLIST-ENTREGA.md y marca cada ítem con la evidencia al lado
  (ruta de archivo, comando o captura). Lo de la sección C solo se marca cuando el
  usuario lo haya decidido o redactado.
- Push a la rama de trabajo y abre UN PR hacia main titulado
  "Cierre Entrega II: fases 3–9 aplicadas y archivadas", con la checklist en el cuerpo
  y lo que quedó pendiente de decisión, si algo quedó.
- No hagas merge, no crees el tag `entrega-2` sin confirmación del usuario.

Terminado = `openspec list` vacío, `openspec validate --all` verde, CI verde, checklist
completo y PR abierto.
```
