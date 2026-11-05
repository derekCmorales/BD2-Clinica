// Validación por tipo de examen. Los exámenes van en su propia colección (referenciados):
// un paciente acumula cientos y embeberlos choca con el límite de 16MB.
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
      valores: { bsonType: 'object' },
    },
    oneOf: [
      { properties: { tipoExamen: { const: 'hematologia' }, valores: { required: ['hemoglobina', 'leucocitos'] } } },
      { properties: { tipoExamen: { const: 'orina' }, valores: { required: ['color', 'ph'] } } },
      { properties: { tipoExamen: { const: 'cultivo' }, valores: { required: ['organismo', 'sensibleA'] } } },
      { properties: { tipoExamen: { const: 'otro' }, valores: { required: ['descripcion'] } } },
    ],
  },
};

if (base.getCollectionInfos({ name: 'examenes' }).length === 0) {
  base.createCollection('examenes', { validator });
} else {
  base.runCommand({ collMod: 'examenes', validator });
}

base.examenes.createIndex({ pacienteId: 1, fecha: -1 });
base.expedientes.createIndex({ pacienteId: 1 }, { unique: true });
