-- Seeds sintéticos — Hospital (PostgreSQL). Datos ficticios; jamás clínicos reales.
-- UUIDs solo con hex (0-9a-f).

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
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '1234567890102', 'María', 'López Demo', '1995-11-02', 'F', '5025551002', 'Zona 4, Ciudad Demo');

INSERT INTO clinico.expediente (id, paciente_id, estado) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'activo'),
  ('e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'activo');

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
   '2026-09-01 09:00:00+00', '2026-09-01 09:30:00+00', 'atendida', 'Control general');

INSERT INTO clinico.consulta (id, expediente_id, medico_id, cita_id, ocurrida_en, motivo, notas) VALUES
  ('a1111111-aaaa-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   '2026-09-01 09:05:00+00', 'Control general', 'Paciente estable. Datos sintéticos.');

UPDATE clinico.cita
SET consulta_id = 'a1111111-aaaa-1111-1111-111111111111'
WHERE id = 'c1111111-1111-1111-1111-111111111111';

INSERT INTO clinico.diagnostico (id, consulta_id, catalogo_diagnostico_id, texto_libre, es_principal) VALUES
  ('b1111111-bbbb-1111-1111-111111111111',
   'a1111111-aaaa-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'Infección aguda de las vías respiratorias superiores',
   TRUE);

INSERT INTO clinico.receta (id, consulta_id, catalogo_medicamento_id, texto_libre, dosis, frecuencia, duracion_dias) VALUES
  ('c1111111-cccc-1111-1111-111111111111',
   'a1111111-aaaa-1111-1111-111111111111',
   '11111111-aaaa-1111-1111-111111111111',
   'Paracetamol 500 mg',
   '1 tableta', 'cada 8 horas', 3);

INSERT INTO clinico.auditoria_acceso (id, actor_id, paciente_id, accion, recurso, detalle) VALUES
  ('f1111111-ffff-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'lectura', 'expediente', 'Apertura de expediente (seed)');
