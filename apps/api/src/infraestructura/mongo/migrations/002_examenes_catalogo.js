// Alinea el $jsonSchema con CATALOGO_EXAMENES del dominio (fase 6).
// - Hematología y orina: campos numéricos/listas requeridos.
// - Cultivo: muestra, organismo y recuento UFC; antibiograma embebido como arreglo.
// validationLevel "moderate" evita invalidar documentos viejos al endurecer el esquema.
const nombre = process.env.MONGO_APP_DATABASE || 'laboratorio';
const base = db.getSiblingDB(nombre);

const texto = { bsonType: 'string' };

const validator = {
  $jsonSchema: {
    bsonType: 'object',
    required: ['pacienteId', 'tipoExamen', 'fecha', 'valores'],
    properties: {
      pacienteId: texto,
      tipoExamen: { enum: ['hematologia', 'orina', 'cultivo', 'otro'] },
      fecha: texto,
      estado: { enum: ['registrado', 'validado', 'anulado'] },
      valores: { bsonType: 'object' },
    },
    oneOf: [
      {
        properties: {
          tipoExamen: { enum: ['hematologia'] },
          valores: {
            bsonType: 'object',
            required: ['hemoglobina', 'hematocrito', 'leucocitos', 'plaquetas', 'eritrocitos'],
            properties: {
              hemoglobina: texto,
              hematocrito: texto,
              leucocitos: texto,
              plaquetas: texto,
              eritrocitos: texto,
            },
          },
        },
      },
      {
        properties: {
          tipoExamen: { enum: ['orina'] },
          valores: {
            bsonType: 'object',
            required: ['color', 'aspecto', 'ph', 'densidad', 'proteinas', 'glucosa', 'leucocitos'],
            properties: {
              color: texto,
              aspecto: texto,
              ph: texto,
              densidad: texto,
              proteinas: texto,
              glucosa: texto,
              leucocitos: texto,
            },
          },
        },
      },
      {
        properties: {
          tipoExamen: { enum: ['cultivo'] },
          valores: {
            bsonType: 'object',
            required: ['muestra', 'organismo', 'recuentoUfc'],
            properties: {
              muestra: texto,
              organismo: texto,
              recuentoUfc: texto,
              antibiograma: {
                bsonType: 'array',
                items: {
                  bsonType: 'object',
                  required: ['antibiotico', 'sensibilidad'],
                  properties: {
                    antibiotico: texto,
                    sensibilidad: { enum: ['S', 'I', 'R'] },
                  },
                },
              },
            },
          },
        },
      },
      {
        properties: {
          tipoExamen: { enum: ['otro'] },
          valores: {
            bsonType: 'object',
            required: ['descripcion'],
            properties: { descripcion: texto },
          },
        },
      },
    ],
  },
};

base.runCommand({ collMod: 'examenes', validator, validationLevel: 'moderate', validationAction: 'error' });
