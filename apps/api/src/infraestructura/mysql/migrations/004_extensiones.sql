-- Extensiones que no son el núcleo odontológico (examen, curva, vacunas) viven en JSON.
-- Las piezas siguen en pieza_dental. El usuario de app ya puede actualizar expediente.

ALTER TABLE expediente
  ADD COLUMN extensiones JSON NULL;
