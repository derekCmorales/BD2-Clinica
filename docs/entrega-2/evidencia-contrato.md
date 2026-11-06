# Evidencia de la suite de contrato

Generado: 2026-11-06T22:20:43.822Z
Resultado global: 30 pasan, 0 fallan, 0 pendientes.

| Motor | Institución | Escenario | Estado | ms |
|---|---|---|---|---|
| memoria | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 2 |
| memoria | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 0 |
| memoria | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 1 |
| memoria | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 2 |
| memoria | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 0 |
| memoria | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 0 |
| PostgreSQL | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 230 |
| PostgreSQL | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 67 |
| PostgreSQL | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 13 |
| PostgreSQL | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 38 |
| PostgreSQL | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 12 |
| PostgreSQL | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 60 |
| MySQL | odontologia | crea un paciente y lo devuelve por su id | ✅ passed | 41 |
| MySQL | odontologia | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 37 |
| MySQL | odontologia | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 15 |
| MySQL | odontologia | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 32 |
| MySQL | odontologia | rechaza la segunda escritura sobre la misma versión | ✅ passed | 18 |
| MySQL | odontologia | deja una entrada de auditoría por lectura restringida | ✅ passed | 15 |
| MongoDB | laboratorio | crea un paciente y lo devuelve por su id | ✅ passed | 31 |
| MongoDB | laboratorio | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 28 |
| MongoDB | laboratorio | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 13 |
| MongoDB | laboratorio | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 23 |
| MongoDB | laboratorio | rechaza la segunda escritura sobre la misma versión | ✅ passed | 12 |
| MongoDB | laboratorio | deja una entrada de auditoría por lectura restringida | ✅ passed | 17 |
| Redis | pediatrico | crea un paciente y lo devuelve por su id | ✅ passed | 19 |
| Redis | pediatrico | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 4 |
| Redis | pediatrico | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 2 |
| Redis | pediatrico | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 2 |
| Redis | pediatrico | rechaza la segunda escritura sobre la misma versión | ✅ passed | 2 |
| Redis | pediatrico | deja una entrada de auditoría por lectura restringida | ✅ passed | 2 |

## Resumen por motor

| Motor | Pasan | Fallan | Total |
|---|---|---|---|
| memoria | 6 | 0 | 6 |
| PostgreSQL | 6 | 0 | 6 |
| MySQL | 6 | 0 | 6 |
| MongoDB | 6 | 0 | 6 |
| Redis | 6 | 0 | 6 |

> Redis valida el solape de citas dentro del mismo expediente; el solape entre pacientes
> distintos queda documentado como limitación en el documento comparativo (fase 8).
