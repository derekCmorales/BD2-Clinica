// Seeds sintéticos — Centro pediátrico (Redis como sistema de registro).
// Usa el usuario admin solo para el seed; la app usa pediatrico_app con ACL.
import Redis from 'ioredis';

const cliente = new Redis({
  host: process.env.REDIS_PEDIATRICO_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PEDIATRICO_PORT ?? '6390'),
  username: process.env.REDIS_ADMIN_USER ?? 'redis_admin',
  password: process.env.REDIS_ADMIN_PASSWORD ?? 'redis_admin_dev',
  maxRetriesPerRequest: 2,
  enableReadyCheck: false,
});

const ana = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
const archivado = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';

const mediciones = [
  { fecha: '2026-01-10', pesoKg: 10.2, tallaCm: 78 },
  { fecha: '2026-02-10', pesoKg: 10.8, tallaCm: 80 },
  { fecha: '2026-03-10', pesoKg: 11.3, tallaCm: 82 },
  { fecha: '2026-04-10', pesoKg: 11.9, tallaCm: 84 },
  { fecha: '2026-05-10', pesoKg: 12.4, tallaCm: 86 },
  { fecha: '2026-06-10', pesoKg: 13.0, tallaCm: 88 },
];

const vacunas = [
  { codigo: 'SRP', proximaEn: '2026-01-15', aplicadaEn: '2025-01-15' },
  { codigo: 'DPT', proximaEn: '2026-12-01', aplicadaEn: '2025-12-01' },
];

const documentoAna = {
  pacienteId: ana,
  expedienteId: 'e4444444-4444-4444-4444-444444444444',
  version: 12,
  estado: 'activo',
  datos: {
    dpi: '4099887766554',
    nombres: 'Ana',
    apellidos: 'Hernández Demo',
    fechaNacimiento: '2020-05-02',
    sexo: 'F',
    telefono: '5025554001',
    direccion: 'Zona 12, Ciudad Demo',
    tutorNombre: 'Marta Hernández Demo',
    tutorTelefono: '5025554002',
  },
  consultas: [
    {
      id: 'a4444444-aaaa-4444-4444-444444444444',
      medicoId: '44444444-4444-4444-4444-444444444444',
      ocurridaEn: '2026-06-10T09:00:00.000Z',
      motivo: 'Control de crecimiento',
      notas: 'Datos sintéticos de demostración.',
      diagnosticos: [
        {
          id: 'b4444444-bbbb-4444-4444-444444444444',
          textoLibre: 'Crecimiento dentro de parámetros',
          esPrincipal: true,
        },
      ],
      recetas: [
        {
          id: 'c4444444-cccc-4444-4444-444444444444',
          textoLibre: 'Vitamina sintética',
          dosis: '5 ml',
          frecuencia: 'cada 24 horas',
          duracionDias: 30,
        },
      ],
    },
  ],
  citas: [],
  examenes: [],
  mediciones,
  vacunas,
  piezas: [],
  procedimientos: [],
};

const documentoArchivado = {
  pacienteId: archivado,
  expedienteId: 'e5555555-5555-5555-5555-555555555555',
  version: 2,
  estado: 'archivado',
  motivoArchivo: 'Traslado a otra institución',
  datos: {
    dpi: '4099887766555',
    nombres: 'Jorge',
    apellidos: 'Archivado Demo',
    fechaNacimiento: '2016-03-03',
    sexo: 'M',
  },
  consultas: [],
  citas: [],
  examenes: [],
  mediciones: [],
  vacunas: [],
  piezas: [],
  procedimientos: [],
};

await cliente.flushdb();
await cliente.call('JSON.SET', `paciente:${ana}`, '$', JSON.stringify(documentoAna));
await cliente.call('JSON.SET', `paciente:${archivado}`, '$', JSON.stringify(documentoArchivado));
await cliente.hset('indice:pacientes', ana, 'Ana Hernández Demo 4099887766554');
await cliente.hset('indice:pacientes', archivado, 'Jorge Archivado Demo 4099887766555');

for (const medicion of mediciones) {
  await cliente.zadd(`curva:${ana}`, Date.parse(medicion.fecha), JSON.stringify(medicion));
}

for (const vacuna of vacunas) {
  await cliente.zadd(`vacunas:${ana}`, Date.parse(vacuna.proximaEn), vacuna.codigo);
  await cliente.zadd('vacunas:pendientes', Date.parse(vacuna.proximaEn), `${ana}|${vacuna.codigo}`);
}

await cliente.xadd(
  `auditoria:${ana}`,
  '*',
  'actorId',
  '44444444-4444-4444-4444-444444444444',
  'accion',
  'lectura',
  'recurso',
  'expediente',
  'ocurridoEn',
  '2026-06-10T09:00:00.000Z',
);

console.log(`Redis: 2 pacientes, ${mediciones.length} mediciones y ${vacunas.length} vacunas sintéticas.`);
await cliente.quit();
