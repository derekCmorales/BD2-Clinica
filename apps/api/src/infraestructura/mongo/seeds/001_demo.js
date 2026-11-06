// Seeds sintéticos — Laboratorio clínico (MongoDB). Datos ficticios; jamás clínicos reales.
// Un paciente demo con tres tipos de examen para mostrar la variación estructural.
const nombre = process.env.MONGO_APP_DATABASE || 'laboratorio';
const base = db.getSiblingDB(nombre);
const pacienteId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const expedienteId = 'e3333333-3333-3333-3333-333333333333';

base.expedientes.deleteMany({ pacienteId });
base.examenes.deleteMany({ pacienteId });
base.auditoria.deleteMany({ pacienteId });

base.expedientes.insertOne({
  pacienteId,
  expedienteId,
  version: 4,
  estado: 'activo',
  datos: {
    dpi: '3011223344556',
    nombres: 'Luis',
    apellidos: 'Pérez Demo',
    fechaNacimiento: '1979-01-20',
    sexo: 'M',
    telefono: '5025553001',
    direccion: 'Zona 11, Ciudad Demo',
  },
  consultas: [
    {
      id: 'a3333333-aaaa-3333-3333-333333333333',
      medicoId: '33333333-3333-3333-3333-333333333333',
      ocurridaEn: '2026-09-03T10:00:00.000Z',
      motivo: 'Control de laboratorio',
      notas: 'Datos sintéticos de demostración.',
      diagnosticos: [
        {
          id: 'b3333333-bbbb-3333-3333-333333333333',
          textoLibre: 'Anemia leve sintética',
          esPrincipal: true,
        },
      ],
      recetas: [
        {
          id: 'c3333333-cccc-3333-3333-333333333333',
          textoLibre: 'Sulfato ferroso',
          dosis: '1 tableta',
          frecuencia: 'cada 24 horas',
          duracionDias: 30,
        },
      ],
    },
  ],
  citas: [],
  mediciones: [],
  vacunas: [],
  piezas: [],
  procedimientos: [],
});

base.examenes.insertMany([
  {
    id: 'e3333333-0001-3333-3333-333333333333',
    pacienteId,
    tipoExamen: 'hematologia',
    fecha: '2026-09-03',
    estado: 'validado',
    valores: {
      hemoglobina: '10.2',
      hematocrito: '31',
      leucocitos: '6.8',
      plaquetas: '240',
      eritrocitos: '4.1',
    },
  },
  {
    id: 'e3333333-0002-3333-3333-333333333333',
    pacienteId,
    tipoExamen: 'orina',
    fecha: '2026-09-04',
    estado: 'validado',
    valores: {
      color: 'amarillo',
      aspecto: 'claro',
      ph: '6.2',
      densidad: '1.015',
      proteinas: 'negativo',
      glucosa: 'negativo',
      leucocitos: '2',
    },
  },
  {
    id: 'e3333333-0003-3333-3333-333333333333',
    pacienteId,
    tipoExamen: 'cultivo',
    fecha: '2026-09-05',
    estado: 'registrado',
    valores: {
      muestra: 'orina',
      organismo: 'Escherichia coli',
      recuentoUfc: '100000',
      antibiograma: [
        { antibiotico: 'Nitrofurantoína', sensibilidad: 'S' },
        { antibiotico: 'Ciprofloxacino', sensibilidad: 'R' },
      ],
    },
  },
]);

base.auditoria.insertOne({
  id: 'a3333333-0001-3333-3333-333333333333',
  actorId: '33333333-3333-3333-3333-333333333333',
  pacienteId,
  accion: 'lectura',
  recurso: 'expediente',
  ocurridoEn: '2026-09-03T10:00:00.000Z',
});
