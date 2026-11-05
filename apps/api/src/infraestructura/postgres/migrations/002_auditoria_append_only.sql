-- La auditoría es append-only: si el usuario de app puede hacer UPDATE, puede reescribir
-- "quién vio qué" y la bitácora deja de ser evidencia. 001 le otorgaba UPDATE.
REVOKE UPDATE, DELETE, TRUNCATE ON clinico.auditoria_acceso FROM hospital_app;
