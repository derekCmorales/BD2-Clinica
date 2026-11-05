# Entidades y atributos identificados

Levantamiento completo del historial clínico para las **cuatro** instituciones. El núcleo es compartido; cada institución añade extensiones.

## Núcleo compartido (todas las instituciones)

### Usuario
| Atributo | Tipo lógico | Notas |
|---|---|---|
| id | UUID / string | PK |
| nombre | texto | |
| correo | texto | único |
| rol | enum | médico, secretaria/enfermería/laboratorista, admin |
| especialidad | texto | nullable |
| activo | booleano | |
| creado_en | timestamp | |

### Paciente
| Atributo | Tipo lógico | Clasificación |
|---|---|---|
| id | identificador | — |
| dpi | texto nullable | confidencial |
| nombres, apellidos | texto | confidencial (*restringido* si menor) |
| fecha_nacimiento | fecha | confidencial / restringido si menor |
| sexo | enum | confidencial / restringido si menor |
| telefono, dirección, correo | texto | confidencial |
| codigo_referencia | texto nullable | confidencial — referidos (laboratorio) |

### Expediente
| Atributo | Tipo lógico | Notas |
|---|---|---|
| id | identificador | PK |
| paciente_id | ref | UNIQUE → 1:1 por institución |
| estado | activo \| archivado | no se borra |
| motivo_archivo | texto | nullable |
| archivado_en | timestamp | nullable |
| version | entero | concurrencia optimista |

### Cita
| Atributo | Tipo lógico | Notas |
|---|---|---|
| id | identificador | |
| expediente_id, medico_id | ref | |
| inicio, fin | timestamp | fin > inicio |
| estado | programada / atendida / cancelada / inasistencia | |
| motivo | texto | |
| consulta_id | ref nullable | enlace a consulta ocurrida |

### Consulta
| Atributo | Tipo lógico | Clasificación |
|---|---|---|
| id | identificador | |
| expediente_id, medico_id | ref | |
| cita_id | ref nullable único | |
| ocurrida_en | timestamp | |
| motivo | texto | restringido |
| notas | texto | restringido |

### Diagnostico (híbrido)
| Atributo | Tipo lógico | Clasificación |
|---|---|---|
| id | identificador | |
| consulta_id | ref | |
| catalogo_diagnostico_id | ref nullable | |
| texto_libre | texto | restringido (obligatorio) |
| es_principal | booleano | |

### Receta (híbrido)
| Atributo | Tipo lógico | Clasificación |
|---|---|---|
| id | identificador | |
| consulta_id | ref | |
| catalogo_medicamento_id | ref nullable | |
| texto_libre, dosis, frecuencia | texto | restringido |
| duracion_dias | entero | |

### CatalogoDiagnostico / CatalogoMedicamento
Códigos y descripciones de referencia (subconjunto sintético).

### AuditoriaAcceso
| Atributo | Tipo lógico | Notas |
|---|---|---|
| id | identificador | |
| actor_id, paciente_id | ref | |
| accion, recurso | texto | quién / qué |
| ocurrido_en | timestamp | cuándo |
| detalle | texto | sin volcar datos clínicos a logs |

---

## Extensión — Clínica odontológica

### PiezaDental
| Atributo | Tipo lógico | Notas |
|---|---|---|
| id | identificador | |
| expediente_id | ref | |
| codigo_fdi | entero 11–48 | UNIQUE con expediente |
| estado | enum | sano, caries, obturado, corona, ausente, … |
| notas | texto | |
| actualizado_en | timestamp | |

### ProcedimientoDental
| Atributo | Tipo lógico | Clasificación |
|---|---|---|
| id | identificador | |
| pieza_dental_id | ref | |
| consulta_id | ref | |
| tipo | texto | |
| descripcion | texto | restringido |
| realizado_en | timestamp | |

Detalle ER: documento de odontología.

---

## Extensión — Laboratorio clínico

### TipoExamen
codigo, nombre, categoria (hematologia / orina / cultivo / otro), campos_esperados.

### ResultadoExamen
pacienteId (referencia), tipoExamen, fecha, estado, valores (estructura **variable** según tipo), observaciones, version.

Detalle completo: documento de laboratorio.

---

## Extensión — Centro pediátrico

### Paciente (menor) — atributos adicionales
tutor_nombre, tutor_telefono, tutor_dpi, alergias_conocidas. Identidad del menor = **restringido**.

### MedicionCrecimiento
fecha, peso_kg, talla_cm, perimetro_cefalico_cm, percentil_peso, percentil_talla.

### TipoVacuna / DosisVacuna
código de vacuna, número de dosis, aplicada_en, proxima_en, lote.

Detalle completo: documento de pediatría.

---

## Mapa institución → entidades propias

| Institución | Motor | Extensiones |
|---|---|---|
| Hospital general | PostgreSQL | Núcleo completo (citas, diagnósticos, recetas) |
| Clínica odontológica | MySQL | PiezaDental, ProcedimientoDental |
| Laboratorio clínico | MongoDB | TipoExamen, ResultadoExamen |
| Centro pediátrico | Redis | MedicionCrecimiento, TipoVacuna, DosisVacuna, tutor |
