-- 001 validaba codigo_fdi BETWEEN 11 AND 48, que acepta 19, 20, 29, 30, 39 y 40:
-- códigos que no existen en la notación FDI de dentición permanente.
-- FDI = cuadrante (1–4) seguido de posición (1–8).
ALTER TABLE pieza_dental
  DROP CHECK chk_pieza_fdi,
  ADD CONSTRAINT chk_pieza_fdi CHECK (
    codigo_fdi DIV 10 BETWEEN 1 AND 4
    AND codigo_fdi MOD 10 BETWEEN 1 AND 8
  );
