// Validación base. La estructura completa por tipo vive en 002_examenes_catalogo.js.
// Los exámenes van en su propia colección (referenciados): un paciente acumula cientos
// y embeberlos choca con el límite de 16MB.
const nombre = process.env.MONGO_APP_DATABASE || 'laboratorio';
const base = db.getSiblingDB(nombre);

const validator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['pacienteId', 'tipoExamen', 'fecha', 'valores'],
    properties: {
      pacienteId: { bsonType: 'string' },
      tipoExamen: { enum: ['hematologia', 'orina', 'cultivo', 'otro'] },
      fecha: { bsonType: 'string' },
      estado: { enum: ['registrado', 'validado', 'anulado'] },
      valores: { bsonType: 'object' },
    },
  },
};

if (base.getCollectionInfos({ name: 'examenes' }).length === 0) {
  base.createCollection('examenes', { validator, validationLevel: 'moderate' });
} else {
  base.runCommand({ collMod: 'examenes', validator, validationLevel: 'moderate' });
}

base.examenes.createIndex({ pacienteId: 1, fecha: -1 });
base.expedientes.createIndex({ pacienteId: 1 }, { unique: true });
