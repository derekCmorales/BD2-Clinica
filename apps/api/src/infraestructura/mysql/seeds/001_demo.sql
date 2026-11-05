-- Seeds sintéticos — Clínica odontológica (MySQL).
-- UUIDs solo con hex (0-9a-f): el mismo PacienteId debe ser válido en los cuatro motores.

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE auditoria_acceso;
TRUNCATE TABLE procedimiento_dental;
TRUNCATE TABLE pieza_dental;
TRUNCATE TABLE receta;
TRUNCATE TABLE diagnostico;
TRUNCATE TABLE consulta;
TRUNCATE TABLE cita;
TRUNCATE TABLE catalogo_medicamento;
TRUNCATE TABLE catalogo_diagnostico;
TRUNCATE TABLE expediente;
TRUNCATE TABLE paciente;
TRUNCATE TABLE usuario;
SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO usuario (id, nombre, correo, rol, especialidad) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Dr. Pedro Aguilar', 'pedro.aguilar@odonto.demo', 'medico', 'Odontología general'),
  ('22222222-2222-2222-2222-222222222222', 'Sec. Elena Cruz', 'elena.cruz@odonto.demo', 'secretaria', NULL);

INSERT INTO paciente (id, dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2987654321098', 'Sofía', 'García Demo', '1992-07-21', 'F', '5025552001', 'Zona 15, Ciudad Demo'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2987654321099', 'Diego', 'Morales Demo', '1985-01-09', 'M', '5025552002', 'Zona 7, Ciudad Demo');

INSERT INTO expediente (id, paciente_id, estado) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'activo'),
  ('e2222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'activo');

INSERT INTO catalogo_diagnostico (id, codigo, descripcion, sensible) VALUES
  ('d1111111-1111-1111-1111-111111111111', 'K02.1', 'Caries de la dentina', 0),
  ('d2222222-2222-2222-2222-222222222222', 'K05.1', 'Gingivitis crónica', 0);

INSERT INTO catalogo_medicamento (id, codigo, nombre, presentacion) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'AMOX500', 'Amoxicilina', '500 mg cápsula'),
  ('f2222222-2222-2222-2222-222222222222', 'IBU400', 'Ibuprofeno', '400 mg tableta');

INSERT INTO cita (id, expediente_id, medico_id, inicio, fin, estado, motivo) VALUES
  ('c1111111-1111-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   '2026-09-02 10:00:00', '2026-09-02 10:45:00', 'atendida', 'Revisión odontograma');

INSERT INTO consulta (id, expediente_id, medico_id, cita_id, ocurrida_en, motivo, notas) VALUES
  ('a1111111-aaaa-1111-1111-111111111111',
   'e1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'c1111111-1111-1111-1111-111111111111',
   '2026-09-02 10:05:00', 'Revisión odontograma', 'Datos sintéticos de demostración.');

UPDATE cita
SET consulta_id = 'a1111111-aaaa-1111-1111-111111111111'
WHERE id = 'c1111111-1111-1111-1111-111111111111';

INSERT INTO diagnostico (id, consulta_id, catalogo_diagnostico_id, texto_libre, es_principal) VALUES
  ('b1111111-bbbb-1111-1111-111111111111',
   'a1111111-aaaa-1111-1111-111111111111',
   'd1111111-1111-1111-1111-111111111111',
   'Caries de la dentina en pieza 16',
   1);

INSERT INTO receta (id, consulta_id, catalogo_medicamento_id, texto_libre, dosis, frecuencia, duracion_dias) VALUES
  ('c1111111-cccc-1111-1111-111111111111',
   'a1111111-aaaa-1111-1111-111111111111',
   'f2222222-2222-2222-2222-222222222222',
   'Ibuprofeno 400 mg',
   '1 tableta', 'cada 8 horas', 2);

INSERT INTO pieza_dental (id, expediente_id, codigo_fdi, estado) VALUES
  ('11000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 11, 'sano'),
  ('12000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 12, 'sano'),
  ('13000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 13, 'sano'),
  ('14000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 14, 'sano'),
  ('15000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 15, 'sano'),
  ('16000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 16, 'caries'),
  ('17000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 17, 'sano'),
  ('18000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 18, 'ausente'),
  ('21000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 21, 'sano'),
  ('22000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 22, 'sano'),
  ('23000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 23, 'sano'),
  ('24000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 24, 'sano'),
  ('25000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 25, 'sano'),
  ('26000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 26, 'sano'),
  ('27000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 27, 'sano'),
  ('28000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 28, 'ausente'),
  ('31000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 31, 'sano'),
  ('32000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 32, 'sano'),
  ('33000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 33, 'sano'),
  ('34000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 34, 'sano'),
  ('35000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 35, 'sano'),
  ('36000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 36, 'obturado'),
  ('37000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 37, 'sano'),
  ('38000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 38, 'ausente'),
  ('41000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 41, 'sano'),
  ('42000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 42, 'sano'),
  ('43000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 43, 'sano'),
  ('44000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 44, 'sano'),
  ('45000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 45, 'sano'),
  ('46000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 46, 'sano'),
  ('47000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 47, 'sano'),
  ('48000000-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 48, 'ausente');

INSERT INTO procedimiento_dental (id, pieza_dental_id, consulta_id, tipo, descripcion, realizado_en) VALUES
  ('d1111111-dddd-1111-1111-111111111111',
   '16000000-1111-1111-1111-111111111111',
   'a1111111-aaaa-1111-1111-111111111111',
   'evaluacion',
   'Detección de caries oclusal — pendiente obturación',
   '2026-09-02 10:20:00');

INSERT INTO auditoria_acceso (id, actor_id, paciente_id, accion, recurso, detalle) VALUES
  ('a1111111-1111-1111-1111-111111111111',
   '11111111-1111-1111-1111-111111111111',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'lectura', 'odontograma', 'Apertura de odontograma (seed)');
