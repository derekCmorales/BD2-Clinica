# Evidencia de la suite de contrato

Generado: 2026-11-06T22:13:35.721Z
Resultado global: 30 pasan, 0 fallan, 0 pendientes.

| Motor | Institución | Escenario | Estado | ms |
|---|---|---|---|---|
| memoria | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 4 |
| memoria | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 1 |
| memoria | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 0 |
| memoria | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 1 |
| memoria | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 0 |
| memoria | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 1 |
| PostgreSQL | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 251 |
| PostgreSQL | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 80 |
| PostgreSQL | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 20 |
| PostgreSQL | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 62 |
| PostgreSQL | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 18 |
| PostgreSQL | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 70 |
| MySQL | odontologia | crea un paciente y lo devuelve por su id | ✅ passed | 95 |
| MySQL | odontologia | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 45 |
| MySQL | odontologia | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 19 |
| MySQL | odontologia | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 37 |
| MySQL | odontologia | rechaza la segunda escritura sobre la misma versión | ✅ passed | 13 |
| MySQL | odontologia | deja una entrada de auditoría por lectura restringida | ✅ passed | 20 |
| MongoDB | laboratorio | crea un paciente y lo devuelve por su id | ✅ passed | 64 |
| MongoDB | laboratorio | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 41 |
| MongoDB | laboratorio | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 19 |
| MongoDB | laboratorio | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 29 |
| MongoDB | laboratorio | rechaza la segunda escritura sobre la misma versión | ✅ passed | 20 |
| MongoDB | laboratorio | deja una entrada de auditoría por lectura restringida | ✅ passed | 29 |
| Redis | pediatrico | crea un paciente y lo devuelve por su id | ✅ passed | 23 |
| Redis | pediatrico | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 5 |
| Redis | pediatrico | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 3 |
| Redis | pediatrico | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 3 |
| Redis | pediatrico | rechaza la segunda escritura sobre la misma versión | ✅ passed | 3 |
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
