-- Seeds sintéticos — Hospital (PostgreSQL). Datos ficticios; jamás clínicos reales.
-- Incluye: paciente activo con historial, paciente archivado y paciente menor de edad.
-- También inserta los eventos correspondientes para que `pnpm hospital:reproyectar`
-- reconstruya exactamente este read model.

TRUNCATE TABLE
  clinico.proyeccion_aplicada,
  clinico.eventos,
  clinico.auditoria_acceso,
  clinico.receta,
  clinico.diagnostico,
  clinico.consulta,
  clinico.cita,
  clinico.catalogo_medicamento,
  clinico.catalogo_diagnostico,
  clinico.expediente,
  clinico.paciente,
  clinico.usuario
RESTART IDENTITY CASCADE;

INSERT INTO clinico.usuario (id, nombre, correo, rol, especialidad) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dra. Ana Méndez', 'ana.mendez@hospital.demo', 'medico', 'Medicina interna'),
  ('22222222-2222-2222-2222-222222222222', 'Enf. Luis Soto', 'luis.soto@hospital.demo', 'enfermeria', NULL);

INSERT INTO clinico.paciente (id, dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '1234567890101', 'Carlos', 'Ruiz Demo', '1988-03-14', 'M', '5025551001', 'Zona 10, Ciudad Demo'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1234567890102', 'María', 'López Demo', '1995-11-02', 'F', '5025551002', 'Zona 4, Ciudad Demo'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '1234567890103', 'Jorge', 'Archivado Demo', '1970-05-05', 'M', '5025551003', 'Zona 2, Ciudad Demo'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '1234567890104', 'Lucía', 'Menor Demo', '2018-06-15', 'F', '5025551004', 'Zona 6, Ciudad Demo');

INSERT INTO clinico.expediente (id, paciente_id, estado, motivo_archivo, archivado_en, version, extensiones) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'activo', NULL, NULL, 9,
   '{"examenes":[
      {"id":"e1111111-0001-1111-1111-111111111111","tipoExamen":"hematologia","fecha":"2026-09-01","estado":"validado","valores":{"hemoglobina":"13.5","hematocrito":"40","leucocitos":"7.2","plaquetas":"250","eritrocitos":"4.8"}},
      {"id":"e1111111-0002-1111-1111-111111111111","tipoExamen":"orina","fecha":"2026-09-02","estado":"validado","valores":{"color":"amarillo","aspecto":"claro","ph":"6.2","densidad":"1.015","proteinas":"negativo","glucosa":"negativo","leucocitos":"2"}},
      {"id":"e1111111-0003-1111-1111-111111111111","tipoExamen":"cultivo","fecha":"2026-09-03","estado":"registrado","valores":{"muestra":"orina","organismo":"Escherichia coli","recuentoUfc":"100000","antibiograma":[{"antibiotico":"Nitrofurantoína","sensibilidad":"S"},{"antibiotico":"Ciprofloxacino","sensibilidad":"R"}]}}
   ]}'::jsonb),
  ('e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'activo', NULL, NULL, 1, '{}'::jsonb),
  ('e5555555-5555-5555-5555-555555555555', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'archivado', 'Traslado a otra institución', '2026-08-15 10:00:00+00', 2, '{}'::jsonb),
  ('e6666666-6666-6666-6666-666666666666', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'activo', NULL, NULL, 4,
   '{"tutorNombre":"Marta Demo","tutorTelefono":"5025551005"}'::jsonb);

INSERT INTO clinico.catalogo_diagnostico (id, codigo, descripcion, sensible) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'J06.9', 'Infección aguda de las vías respiratorias superiores', FALSE),
  ('d2222222-2222-2222-2222-222222222222', 'F32.9', 'Episodio depresivo, no especificado', TRUE);

INSERT INTO clinico.catalogo_medicamento (id, codigo, nombre, presentacion) VALUES
  ('11111111-aaaa-1111-1111-111111111111', 'PARA500', 'Paracetamol', '500 mg tableta'),
  ('22222222-bbbb-2222-2222-222222222222', 'IBU400', 'Ibuprofeno', '400 mg tableta');

INSERT INTO clinico.cita (id, expediente_id, medico_id, inicio, fin, estado, motivo) VALUES
  ('c1111111-1111-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   '2026-09-01 09:00:00+00', '2026-09-01 09:30:00+00', 'atendida', 'Control general'),
  ('c2222222-2222-2222-2222-222222222222',
   'e1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   '2026-12-01 10:00:00+00', '2026-12-01 10:30:00+00', 'programada', 'Control de seguimiento');

INSERT INTO clinico.consulta (id, expediente_id, medico_id, cita_id, ocurrida_en, motivo, notas) VALUES
  ('a1111111-aaaa-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   '2026-09-01 09:05:00+00', 'Control general', 'Paciente estable. Datos sintéticos.'),
  ('a6666666-aaaa-6666-6666-666666666666',
   'e6666666-6666-6666-6666-666666666666',
   '11111111-1111-1111-1111-111111111111',
   NULL,
   '2026-09-10 11:00:00+00', 'Control pediátrico', 'Paciente menor de edad: dato restringido.');

UPDATE clinico.cita
SET consulta_id = 'a1111111-aaaa-1111-1111-111111111111'
WHERE id = 'c1111111-1111-1111-1111-111111111111';

INSERT INTO clinico.diagnostico (id, consulta_id, catalogo_diagnostico_id, texto_libre, es_principal) VALUES
  ('b1111111-bbbb-1111-1111-111111111111',
   'a1111111-aaaa-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'Infección aguda de las vías respiratorias superiores',
   TRUE),
  ('b6666666-bbbb-6666-6666-666666666666',
   'a6666666-aaaa-6666-6666-666666666666',
   NULL,
   'Control de crecimiento y desarrollo',
   TRUE);

INSERT INTO clinico.receta (id, consulta_id, catalogo_medicamento_id, texto_libre, dosis, frecuencia, duracion_dias) VALUES
  ('c1111111-cccc-1111-1111-111111111111',
   'a1111111-aaaa-1111-1111-111111111111',
   '11111111-aaaa-1111-1111-111111111111',
   'Paracetamol 500 mg',
   '1 tableta', 'cada 8 horas', 3),
  ('c6666666-cccc-6666-6666-666666666666',
   'a6666666-aaaa-6666-6666-666666666666',
   NULL,
   'Solución oral sintética',
   '5 ml', 'cada 12 horas', 5);

INSERT INTO clinico.auditoria_acceso (id, actor_id, paciente_id, accion, recurso, detalle) VALUES
  ('f1111111-ffff-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'lectura', 'expediente', 'Apertura de expediente (seed)'),
  ('f2222222-ffff-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   'ffffffff-ffff-ffff-ffff-ffffffffffff',
   'lectura', 'expediente', 'Apertura de expediente de menor (seed)');

-- ───────────── Event store: mismos hechos que el read model ─────────────

INSERT INTO clinico.eventos (aggregate_id, version, tipo, payload, ocurrido_en, actor_id) VALUES
  -- Carlos: creado, cita atendida, consulta, diagnóstico, receta, cita futura
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 'ExpedienteCreado',
   '{"expedienteId":"e1111111-1111-1111-1111-111111111111","datos":{"dpi":"1234567890101","nombres":"Carlos","apellidos":"Ruiz Demo","fechaNacimiento":"1988-03-14","sexo":"M","telefono":"5025551001","direccion":"Zona 10, Ciudad Demo"}}'::jsonb,
   '2026-08-01 08:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 'CitaReservada',
   '{"cita":{"id":"c1111111-1111-1111-1111-111111111111","medicoId":"11111111-1111-1111-1111-111111111111","inicio":"2026-09-01T09:00:00.000Z","fin":"2026-09-01T09:30:00.000Z","motivo":"Control general","estado":"programada"}}'::jsonb,
   '2026-08-20 08:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 'ConsultaRegistrada',
   '{"consulta":{"id":"a1111111-aaaa-1111-1111-111111111111","medicoId":"11111111-1111-1111-1111-111111111111","ocurridaEn":"2026-09-01T09:05:00.000Z","motivo":"Control general","notas":"Paciente estable. Datos sintéticos.","citaId":"c1111111-1111-1111-1111-111111111111"}}'::jsonb,
   '2026-09-01 09:05:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 4, 'DiagnosticoAgregado',
   '{"consultaId":"a1111111-aaaa-1111-1111-111111111111","diagnostico":{"id":"b1111111-bbbb-1111-1111-111111111111","textoLibre":"Infección aguda de las vías respiratorias superiores","esPrincipal":true,"catalogoCodigo":"J06.9"}}'::jsonb,
   '2026-09-01 09:10:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, 'MedicamentoRecetado',
   '{"consultaId":"a1111111-aaaa-1111-1111-111111111111","receta":{"id":"c1111111-cccc-1111-1111-111111111111","textoLibre":"Paracetamol 500 mg","dosis":"1 tableta","frecuencia":"cada 8 horas","duracionDias":3}}'::jsonb,
   '2026-09-01 09:15:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 6, 'CitaReservada',
   '{"cita":{"id":"c2222222-2222-2222-2222-222222222222","medicoId":"11111111-1111-1111-1111-111111111111","inicio":"2026-12-01T10:00:00.000Z","fin":"2026-12-01T10:30:00.000Z","motivo":"Control de seguimiento","estado":"programada"}}'::jsonb,
   '2026-09-20 08:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 7, 'ResultadoExamenRegistrado',
   '{"examen":{"id":"e1111111-0001-1111-1111-111111111111","tipoExamen":"hematologia","fecha":"2026-09-01","estado":"validado","valores":{"hemoglobina":"13.5","hematocrito":"40","leucocitos":"7.2","plaquetas":"250","eritrocitos":"4.8"}}}'::jsonb,
   '2026-09-01 10:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8, 'ResultadoExamenRegistrado',
   '{"examen":{"id":"e1111111-0002-1111-1111-111111111111","tipoExamen":"orina","fecha":"2026-09-02","estado":"validado","valores":{"color":"amarillo","aspecto":"claro","ph":"6.2","densidad":"1.015","proteinas":"negativo","glucosa":"negativo","leucocitos":"2"}}}'::jsonb,
   '2026-09-02 10:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 9, 'ResultadoExamenRegistrado',
   '{"examen":{"id":"e1111111-0003-1111-1111-111111111111","tipoExamen":"cultivo","fecha":"2026-09-03","estado":"registrado","valores":{"muestra":"orina","organismo":"Escherichia coli","recuentoUfc":"100000","antibiograma":[{"antibiotico":"Nitrofurantoína","sensibilidad":"S"},{"antibiotico":"Ciprofloxacino","sensibilidad":"R"}]}}}'::jsonb,
   '2026-09-03 10:00:00+00', '11111111-1111-1111-1111-111111111111'),
  -- María: solo creada
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 'ExpedienteCreado',
   '{"expedienteId":"e2222222-2222-2222-2222-222222222222","datos":{"dpi":"1234567890102","nombres":"María","apellidos":"López Demo","fechaNacimiento":"1995-11-02","sexo":"F","telefono":"5025551002","direccion":"Zona 4, Ciudad Demo"}}'::jsonb,
   '2026-08-02 08:00:00+00', '11111111-1111-1111-1111-111111111111'),
  -- Jorge: creado y archivado
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 1, 'ExpedienteCreado',
   '{"expedienteId":"e5555555-5555-5555-5555-555555555555","datos":{"dpi":"1234567890103","nombres":"Jorge","apellidos":"Archivado Demo","fechaNacimiento":"1970-05-05","sexo":"M","telefono":"5025551003","direccion":"Zona 2, Ciudad Demo"}}'::jsonb,
   '2026-07-01 08:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, 'ExpedienteArchivado',
   '{"motivo":"Traslado a otra institución"}'::jsonb,
   '2026-08-15 10:00:00+00', '11111111-1111-1111-1111-111111111111'),
  -- Lucía: menor, creada, consulta, diagnóstico y receta
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 1, 'ExpedienteCreado',
   '{"expedienteId":"e6666666-6666-6666-6666-666666666666","datos":{"dpi":"1234567890104","nombres":"Lucía","apellidos":"Menor Demo","fechaNacimiento":"2018-06-15","sexo":"F","telefono":"5025551004","direccion":"Zona 6, Ciudad Demo","tutorNombre":"Marta Demo","tutorTelefono":"5025551005"}}'::jsonb,
   '2026-09-10 08:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 2, 'ConsultaRegistrada',
   '{"consulta":{"id":"a6666666-aaaa-6666-6666-666666666666","medicoId":"11111111-1111-1111-1111-111111111111","ocurridaEn":"2026-09-10T11:00:00.000Z","motivo":"Control pediátrico","notas":"Paciente menor de edad: dato restringido."}}'::jsonb,
   '2026-09-10 11:00:00+00', '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 3, 'DiagnosticoAgregado',
   '{"consultaId":"a6666666-aaaa-6666-6666-666666666666","diagnostico":{"id":"b6666666-bbbb-6666-6666-666666666666","textoLibre":"Control de crecimiento y desarrollo","esPrincipal":true}}'::jsonb,
   '2026-09-10 11:05:00+00', '11111111-1111-1111-1111-111111111111'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 4, 'MedicamentoRecetado',
   '{"consultaId":"a6666666-aaaa-6666-6666-666666666666","receta":{"id":"c6666666-cccc-6666-6666-666666666666","textoLibre":"Solución oral sintética","dosis":"5 ml","frecuencia":"cada 12 horas","duracionDias":5}}'::jsonb,
   '2026-09-10 11:10:00+00', '11111111-1111-1111-1111-111111111111');

INSERT INTO clinico.proyeccion_aplicada (aggregate_id, version)
SELECT aggregate_id, version FROM clinico.eventos;
