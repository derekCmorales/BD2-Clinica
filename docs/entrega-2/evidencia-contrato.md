# Evidencia de la suite de contrato

Generado: 2026-11-05T07:35:51.276Z
Resultado global: 30 pasan, 0 fallan, 0 pendientes.

| Motor | Institución | Escenario | Estado | ms |
|---|---|---|---|---|
| memoria | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 2 |
| memoria | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 1 |
| memoria | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 0 |
| memoria | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 0 |
| memoria | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 0 |
| memoria | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 1 |
| PostgreSQL | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 215 |
| PostgreSQL | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 68 |
| PostgreSQL | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 16 |
| PostgreSQL | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 43 |
| PostgreSQL | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 16 |
| PostgreSQL | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 61 |
| MySQL | odontologia | crea un paciente y lo devuelve por su id | ✅ passed | 30 |
| MySQL | odontologia | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 24 |
| MySQL | odontologia | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 13 |
| MySQL | odontologia | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 23 |
| MySQL | odontologia | rechaza la segunda escritura sobre la misma versión | ✅ passed | 11 |
| MySQL | odontologia | deja una entrada de auditoría por lectura restringida | ✅ passed | 12 |
| MongoDB | laboratorio | crea un paciente y lo devuelve por su id | ✅ passed | 31 |
| MongoDB | laboratorio | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 26 |
| MongoDB | laboratorio | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 17 |
| MongoDB | laboratorio | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 28 |
| MongoDB | laboratorio | rechaza la segunda escritura sobre la misma versión | ✅ passed | 15 |
| MongoDB | laboratorio | deja una entrada de auditoría por lectura restringida | ✅ passed | 19 |
| Redis | pediatrico | crea un paciente y lo devuelve por su id | ✅ passed | 15 |
| Redis | pediatrico | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 6 |
| Redis | pediatrico | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 2 |
| Redis | pediatrico | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 3 |
| Redis | pediatrico | rechaza la segunda escritura sobre la misma versión | ✅ passed | 2 |
| Redis | pediatrico | deja una entrada de auditoría por lectura restringida | ✅ passed | 3 |

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
