-- Hospital — event store (Entrega II) + read model ya existente en clinico.*.
-- La versión optimista vive en UNIQUE(aggregate_id, version): un UPDATE del pasado no cabe.
-- btree_gist evita dos citas del mismo médico en el mismo intervalo.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS clinico.eventos (
  aggregate_id UUID NOT NULL,
  version      INTEGER NOT NULL,
  tipo         VARCHAR(80) NOT NULL,
  payload      JSONB NOT NULL,
  ocurrido_en  TIMESTAMPTZ NOT NULL,
  actor_id     UUID NOT NULL,
  PRIMARY KEY (aggregate_id, version)
);

CREATE TABLE IF NOT EXISTS clinico.proyeccion_aplicada (
  aggregate_id UUID NOT NULL,
  version      INTEGER NOT NULL,
  PRIMARY KEY (aggregate_id, version)
);

ALTER TABLE clinico.expediente
  ADD COLUMN IF NOT EXISTS extensiones JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'citas_sin_solape') THEN
    ALTER TABLE clinico.cita
      ADD CONSTRAINT citas_sin_solape
      EXCLUDE USING gist (
        medico_id WITH =,
        tstzrange(inicio, fin) WITH &&
      ) WHERE (estado IN ('programada', 'atendida'));
  END IF;
END $$;

GRANT SELECT, INSERT ON clinico.eventos TO hospital_app;
GRANT SELECT, INSERT ON clinico.proyeccion_aplicada TO hospital_app;
REVOKE UPDATE, DELETE, TRUNCATE ON clinico.eventos FROM hospital_app;
REVOKE UPDATE, DELETE, TRUNCATE ON clinico.proyeccion_aplicada FROM hospital_app;
