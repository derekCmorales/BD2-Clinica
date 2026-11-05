-- Clínica odontológica — InnoDB utf8mb4 (Entrega I).
-- Núcleo compartido + extensión odontograma (pieza_dental + procedimiento_dental).

CREATE TABLE usuario (
  id              CHAR(36) PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  correo          VARCHAR(180) NOT NULL UNIQUE,
  rol             VARCHAR(40) NOT NULL,
  especialidad    VARCHAR(80) NULL,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_usuario_rol CHECK (rol IN ('medico', 'secretaria', 'admin'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE paciente (
  id              CHAR(36) PRIMARY KEY,
  dpi             VARCHAR(20) NOT NULL UNIQUE,
  nombres         VARCHAR(120) NOT NULL,
  apellidos       VARCHAR(120) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo            CHAR(1) NOT NULL,
  telefono        VARCHAR(30) NULL,
  direccion       VARCHAR(250) NULL,
  correo          VARCHAR(180) NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_paciente_sexo CHECK (sexo IN ('M', 'F', 'X'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE expediente (
  id              CHAR(36) PRIMARY KEY,
  paciente_id     CHAR(36) NOT NULL UNIQUE,
  estado          VARCHAR(20) NOT NULL DEFAULT 'activo',
  motivo_archivo  VARCHAR(250) NULL,
  archivado_en    TIMESTAMP NULL,
  version         INT NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_expediente_paciente FOREIGN KEY (paciente_id) REFERENCES paciente(id),
  CONSTRAINT chk_expediente_estado CHECK (estado IN ('activo', 'archivado'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE catalogo_diagnostico (
  id              CHAR(36) PRIMARY KEY,
  codigo          VARCHAR(20) NOT NULL UNIQUE,
  descripcion     VARCHAR(250) NOT NULL,
  sensible        TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE catalogo_medicamento (
  id              CHAR(36) PRIMARY KEY,
  codigo          VARCHAR(40) NOT NULL UNIQUE,
  nombre          VARCHAR(180) NOT NULL,
  presentacion    VARCHAR(120) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cita (
  id              CHAR(36) PRIMARY KEY,
  expediente_id   CHAR(36) NOT NULL,
  medico_id       CHAR(36) NOT NULL,
  inicio          DATETIME NOT NULL,
  fin             DATETIME NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'programada',
  motivo          VARCHAR(250) NULL,
  consulta_id     CHAR(36) NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cita_expediente FOREIGN KEY (expediente_id) REFERENCES expediente(id),
  CONSTRAINT fk_cita_medico FOREIGN KEY (medico_id) REFERENCES usuario(id),
  CONSTRAINT chk_cita_estado CHECK (estado IN ('programada', 'atendida', 'cancelada', 'inasistencia')),
  CONSTRAINT chk_cita_rango CHECK (fin > inicio)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_cita_medico_inicio ON cita (medico_id, inicio);

CREATE TABLE consulta (
  id              CHAR(36) PRIMARY KEY,
  expediente_id   CHAR(36) NOT NULL,
  medico_id       CHAR(36) NOT NULL,
  cita_id         CHAR(36) NULL UNIQUE,
  ocurrida_en     DATETIME NOT NULL,
  motivo          VARCHAR(250) NOT NULL,
  notas           TEXT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_consulta_expediente FOREIGN KEY (expediente_id) REFERENCES expediente(id),
  CONSTRAINT fk_consulta_medico FOREIGN KEY (medico_id) REFERENCES usuario(id),
  CONSTRAINT fk_consulta_cita FOREIGN KEY (cita_id) REFERENCES cita(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE cita
  ADD CONSTRAINT fk_cita_consulta FOREIGN KEY (consulta_id) REFERENCES consulta(id);

CREATE TABLE diagnostico (
  id                      CHAR(36) PRIMARY KEY,
  consulta_id             CHAR(36) NOT NULL,
  catalogo_diagnostico_id CHAR(36) NULL,
  texto_libre             VARCHAR(350) NOT NULL,
  es_principal            TINYINT(1) NOT NULL DEFAULT 0,
  creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_diagnostico_consulta FOREIGN KEY (consulta_id) REFERENCES consulta(id),
  CONSTRAINT fk_diagnostico_catalogo FOREIGN KEY (catalogo_diagnostico_id) REFERENCES catalogo_diagnostico(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE receta (
  id                      CHAR(36) PRIMARY KEY,
  consulta_id             CHAR(36) NOT NULL,
  catalogo_medicamento_id CHAR(36) NULL,
  texto_libre             VARCHAR(250) NOT NULL,
  dosis                   VARCHAR(80) NOT NULL,
  frecuencia              VARCHAR(80) NOT NULL,
  duracion_dias           INT NULL,
  creado_en               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_receta_consulta FOREIGN KEY (consulta_id) REFERENCES consulta(id),
  CONSTRAINT fk_receta_catalogo FOREIGN KEY (catalogo_medicamento_id) REFERENCES catalogo_medicamento(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Extensión odontología: 32 piezas FDI por expediente + historial de procedimientos.
CREATE TABLE pieza_dental (
  id              CHAR(36) PRIMARY KEY,
  expediente_id   CHAR(36) NOT NULL,
  codigo_fdi      SMALLINT NOT NULL,
  estado          VARCHAR(40) NOT NULL DEFAULT 'sano',
  notas           VARCHAR(250) NULL,
  actualizado_en  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_pieza_expediente FOREIGN KEY (expediente_id) REFERENCES expediente(id),
  CONSTRAINT uq_pieza_expediente_fdi UNIQUE (expediente_id, codigo_fdi),
  CONSTRAINT chk_pieza_fdi CHECK (codigo_fdi BETWEEN 11 AND 48),
  CONSTRAINT chk_pieza_estado CHECK (estado IN (
    'sano', 'caries', 'obturado', 'corona', 'ausente', 'implante', 'endodoncia', 'otro'
  ))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE procedimiento_dental (
  id              CHAR(36) PRIMARY KEY,
  pieza_dental_id CHAR(36) NOT NULL,
  consulta_id     CHAR(36) NOT NULL,
  tipo            VARCHAR(80) NOT NULL,
  descripcion     VARCHAR(350) NOT NULL,
  realizado_en    DATETIME NOT NULL,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_proc_pieza FOREIGN KEY (pieza_dental_id) REFERENCES pieza_dental(id),
  CONSTRAINT fk_proc_consulta FOREIGN KEY (consulta_id) REFERENCES consulta(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE auditoria_acceso (
  id              CHAR(36) PRIMARY KEY,
  actor_id        CHAR(36) NOT NULL,
  paciente_id     CHAR(36) NOT NULL,
  accion          VARCHAR(40) NOT NULL,
  recurso         VARCHAR(80) NOT NULL,
  ocurrido_en     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detalle         VARCHAR(250) NULL,
  CONSTRAINT fk_aud_actor FOREIGN KEY (actor_id) REFERENCES usuario(id),
  CONSTRAINT fk_aud_paciente FOREIGN KEY (paciente_id) REFERENCES paciente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_auditoria_paciente ON auditoria_acceso (paciente_id, ocurrido_en DESC);

-- Privilegio mínimo: el usuario de app ya existe vía Compose; refuerza DML sin DDL.
GRANT SELECT, INSERT, UPDATE ON odontologia.* TO 'odontologia_app'@'%';
FLUSH PRIVILEGES;
