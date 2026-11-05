// Usuario de aplicación del Laboratorio (privilegios mínimos): readWrite solo sobre su base.
// Credenciales desde .env vía Compose. Se ejecuta solo en el primer arranque del volumen.
// Sin dbAdmin: crear colecciones con $jsonSchema e índices lo hacen las migraciones con el root.
const baseDeDatos = process.env.MONGO_APP_DATABASE;
const laboratorio = db.getSiblingDB(baseDeDatos);

if (!laboratorio.getUser(process.env.MONGO_APP_USER)) {
  laboratorio.createUser({
    user: process.env.MONGO_APP_USER,
    pwd: process.env.MONGO_APP_PASSWORD,
    roles: [{ role: 'readWrite', db: baseDeDatos }],
  });
}
