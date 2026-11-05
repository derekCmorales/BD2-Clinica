-- Hospital general — schema clinico (Entrega I, opción B).
-- Event store / CQRS se introduce en Entrega II; aquí el historial es 3NF clásico.

CREATE SCHEMA IF NOT EXISTS clinico;

CREATE TABLE clinico.usuario (
  id              UUID PRIMARY KEY,
  nombre          VARCHAR(120) NOT NULL,
  correo          VARCHAR(180) NOT NULL UNIQUE,
  rol             VARCHAR(40) NOT NULL CHECK (rol IN ('medico', 'enfermeria', 'admin')),
  especialidad    VARCHAR(80),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clinico.paciente (
  id              UUID PRIMARY KEY,
  dpi             VARCHAR(20) NOT NULL UNIQUE,
  nombres         VARCHAR(120) NOT NULL,
  apellidos       VARCHAR(120) NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo            CHAR(1) NOT NULL CHECK (sexo IN ('M', 'F', 'X')),
  telefono        VARCHAR(30),
  direccion       VARCHAR(250),
  correo          VARCHAR(180),
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Relación 1:1 Paciente–Expediente dentro del motor del hospital.
CREATE TABLE clinico.expediente (
  id              UUID PRIMARY KEY,
  paciente_id     UUID NOT NULL UNIQUE REFERENCES clinico.paciente(id),
  estado          VARCHAR(20) NOT NULL DEFAULT 'activo'
                    CHECK (estado IN ('activo', 'archivado')),
  motivo_archivo  VARCHAR(250),
  archivado_en    TIMESTAMPTZ,
  version         INTEGER NOT NULL DEFAULT 1,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clinico.catalogo_diagnostico (
  id              UUID PRIMARY KEY,
  codigo          VARCHAR(20) NOT NULL UNIQUE,
  descripcion     VARCHAR(250) NOT NULL,
  sensible        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE clinico.catalogo_medicamento (
  id              UUID PRIMARY KEY,
  codigo          VARCHAR(40) NOT NULL UNIQUE,
  nombre          VARCHAR(180) NOT NULL,
  presentacion    VARCHAR(120)
);

-- Cita aparte de Consulta; consulta_id se llena cuando la cita se concreta.
CREATE TABLE clinico.cita (
  id              UUID PRIMARY KEY,
  expediente_id   UUID NOT NULL REFERENCES clinico.expediente(id),
  medico_id       UUID NOT NULL REFERENCES clinico.usuario(id),
  inicio          TIMESTAMPTZ NOT NULL,
  fin             TIMESTAMPTZ NOT NULL,
  estado          VARCHAR(20) NOT NULL DEFAULT 'programada'
                    CHECK (estado IN ('programada', 'atendida', 'cancelada', 'inasistencia')),
  motivo          VARCHAR(250),
  consulta_id     UUID,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (fin > inicio)
);

CREATE INDEX idx_cita_medico_inicio ON clinico.cita (medico_id, inicio);

CREATE TABLE clinico.consulta (
  id              UUID PRIMARY KEY,
  expediente_id   UUID NOT NULL REFERENCES clinico.expediente(id),
  medico_id       UUID NOT NULL REFERENCES clinico.usuario(id),
  cita_id         UUID UNIQUE REFERENCES clinico.cita(id),
  ocurrida_en     TIMESTAMPTZ NOT NULL,
  motivo          VARCHAR(250) NOT NULL,
  notas           TEXT,
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE clinico.cita
  ADD CONSTRAINT fk_cita_consulta
  FOREIGN KEY (consulta_id) REFERENCES clinico.consulta(id);

-- Híbrido: FK de catálogo opcional + texto_libre obligatorio para lo no catalogado.
CREATE TABLE clinico.diagnostico (
  id                      UUID PRIMARY KEY,
  consulta_id             UUID NOT NULL REFERENCES clinico.consulta(id),
  catalogo_diagnostico_id UUID REFERENCES clinico.catalogo_diagnostico(id),
  texto_libre             VARCHAR(350) NOT NULL,
  es_principal            BOOLEAN NOT NULL DEFAULT FALSE,
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clinico.receta (
  id                      UUID PRIMARY KEY,
  consulta_id             UUID NOT NULL REFERENCES clinico.consulta(id),
  catalogo_medicamento_id UUID REFERENCES clinico.catalogo_medicamento(id),
  texto_libre             VARCHAR(250) NOT NULL,
  dosis                   VARCHAR(80) NOT NULL,
  frecuencia              VARCHAR(80) NOT NULL,
  duracion_dias           INTEGER,
  creado_en               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clinico.auditoria_acceso (
  id              UUID PRIMARY KEY,
  actor_id        UUID NOT NULL REFERENCES clinico.usuario(id),
  paciente_id     UUID NOT NULL REFERENCES clinico.paciente(id),
  accion          VARCHAR(40) NOT NULL,
  recurso         VARCHAR(80) NOT NULL,
  ocurrido_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  detalle         VARCHAR(250)
);

CREATE INDEX idx_auditoria_paciente ON clinico.auditoria_acceso (paciente_id, ocurrido_en DESC);

GRANT USAGE ON SCHEMA clinico TO hospital_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA clinico TO hospital_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA clinico
  GRANT SELECT, INSERT, UPDATE ON TABLES TO hospital_app;
