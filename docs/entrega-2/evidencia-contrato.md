# Evidencia de la suite de contrato

Generado: 2026-11-06T22:25:23.452Z
Resultado global: 35 pasan, 0 fallan, 0 pendientes.

| Motor | Institución | Escenario | Estado | ms |
|---|---|---|---|---|
| memoria | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 2 |
| memoria | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 1 |
| memoria | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 1 |
| memoria | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 0 |
| memoria | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 0 |
| memoria | hospital | reconstruye el read model desde los eventos (si el adaptador lo soporta) | ✅ passed | 1 |
| memoria | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 0 |
| PostgreSQL | hospital | crea un paciente y lo devuelve por su id | ✅ passed | 226 |
| PostgreSQL | hospital | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 72 |
| PostgreSQL | hospital | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 16 |
| PostgreSQL | hospital | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 44 |
| PostgreSQL | hospital | rechaza la segunda escritura sobre la misma versión | ✅ passed | 15 |
| PostgreSQL | hospital | reconstruye el read model desde los eventos (si el adaptador lo soporta) | ✅ passed | 261 |
| PostgreSQL | hospital | deja una entrada de auditoría por lectura restringida | ✅ passed | 65 |
| MySQL | odontologia | crea un paciente y lo devuelve por su id | ✅ passed | 64 |
| MySQL | odontologia | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 47 |
| MySQL | odontologia | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 12 |
| MySQL | odontologia | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 25 |
| MySQL | odontologia | rechaza la segunda escritura sobre la misma versión | ✅ passed | 12 |
| MySQL | odontologia | reconstruye el read model desde los eventos (si el adaptador lo soporta) | ✅ passed | 0 |
| MySQL | odontologia | deja una entrada de auditoría por lectura restringida | ✅ passed | 16 |
| MongoDB | laboratorio | crea un paciente y lo devuelve por su id | ✅ passed | 56 |
| MongoDB | laboratorio | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 39 |
| MongoDB | laboratorio | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 19 |
| MongoDB | laboratorio | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 36 |
| MongoDB | laboratorio | rechaza la segunda escritura sobre la misma versión | ✅ passed | 17 |
| MongoDB | laboratorio | reconstruye el read model desde los eventos (si el adaptador lo soporta) | ✅ passed | 0 |
| MongoDB | laboratorio | deja una entrada de auditoría por lectura restringida | ✅ passed | 22 |
| Redis | pediatrico | crea un paciente y lo devuelve por su id | ✅ passed | 23 |
| Redis | pediatrico | registra consulta, diagnóstico y receta en el mismo expediente | ✅ passed | 23 |
| Redis | pediatrico | archiva el expediente y rechaza escrituras posteriores | ✅ passed | 6 |
| Redis | pediatrico | rechaza dos citas del mismo médico en el mismo intervalo | ✅ passed | 6 |
| Redis | pediatrico | rechaza la segunda escritura sobre la misma versión | ✅ passed | 4 |
| Redis | pediatrico | reconstruye el read model desde los eventos (si el adaptador lo soporta) | ✅ passed | 1 |
| Redis | pediatrico | deja una entrada de auditoría por lectura restringida | ✅ passed | 4 |

## Resumen por motor

| Motor | Pasan | Fallan | Total |
|---|---|---|---|
| memoria | 7 | 0 | 7 |
| PostgreSQL | 7 | 0 | 7 |
| MySQL | 7 | 0 | 7 |
| MongoDB | 7 | 0 | 7 |
| Redis | 7 | 0 | 7 |

> Redis valida el solape de citas dentro del mismo expediente; el solape entre pacientes
> distintos queda documentado como limitación en el documento comparativo (fase 8).
