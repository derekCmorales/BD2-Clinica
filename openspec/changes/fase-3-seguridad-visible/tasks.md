# Tasks

## 1. UI de clasificación

- [x] 1.1 `EtiquetaClasificacion` en secciones restringidas
- [x] 1.2 `DatoProtegido` para el DPI
- [x] 1.3 Insignia «Menor de edad»

## 2. Bitácora

- [ ] 2.1 [DECISIÓN] Elegir dónde vive la lectura de auditoría (Decisión 1)
- [ ] 2.2 [DECISIÓN] ¿Revelar el DPI se audita? (Decisión 2)
- [ ] 2.3 Implementar lectura en los 4 adaptadores + memoria
- [ ] 2.4 Endpoint `GET /pacientes/:pacienteId/auditoria` + DTO + OpenAPI
- [ ] 2.5 Panel «Accesos» en el cliente
- [ ] 2.6 Revisar privilegios mínimos de lectura en Mongo y ACL de Redis

## 3. Verificación

- [ ] 3.1 Test que intercepta `Logger` y falla si aparece un campo restringido
- [ ] 3.2 Caso e2e: abrir expediente → aparece entrada en «Accesos»
