-- El entrypoint oficial de mysql:8.4 crea MYSQL_USER con ALL PRIVILEGES sobre MYSQL_DATABASE
-- (incluye DROP, ALTER, DELETE). El GRANT de 001 era aditivo y no restringía nada.
-- Aquí se deja el mínimo: lectura/inserción en toda la base, UPDATE tabla por tabla.
--
-- MySQL no permite "UPDATE en toda la base excepto una tabla": los privilegios se suman entre
-- niveles. Por eso UPDATE se otorga explícitamente y auditoria_acceso queda fuera (append-only).
-- Consecuencia operativa: toda tabla nueva necesita su GRANT UPDATE en su propia migración.

REVOKE ALL PRIVILEGES ON odontologia.* FROM 'odontologia_app'@'%';

GRANT SELECT, INSERT ON odontologia.* TO 'odontologia_app'@'%';

GRANT UPDATE ON odontologia.usuario              TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.paciente             TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.expediente           TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.catalogo_diagnostico TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.catalogo_medicamento TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.cita                 TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.consulta             TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.diagnostico          TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.receta               TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.pieza_dental         TO 'odontologia_app'@'%';
GRANT UPDATE ON odontologia.procedimiento_dental TO 'odontologia_app'@'%';
