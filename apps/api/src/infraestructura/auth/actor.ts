import type { Request } from 'express';
import type { ActorId, InstitucionId } from '../../compartido/tipos';

export interface ActorAutenticado {
  readonly actorId: ActorId;
  readonly institucionId: InstitucionId;
  readonly correo: string;
  readonly nombre: string;
}

export interface SolicitudAutenticada extends Request {
  actor?: ActorAutenticado;
}

export const USUARIOS_DEMO: Record<InstitucionId, { actorId: string; correo: string; nombre: string }> = {
  hospital: {
    actorId: '11111111-1111-1111-1111-111111111111',
    correo: 'ana.mendez@hospital.demo',
    nombre: 'Dra. Ana Méndez',
  },
  odontologia: {
    actorId: '11111111-1111-1111-1111-111111111111',
    correo: 'pedro.aguilar@odonto.demo',
    nombre: 'Dr. Pedro Aguilar',
  },
  laboratorio: {
    actorId: '33333333-3333-3333-3333-333333333333',
    correo: 'lucia.ramos@lab.demo',
    nombre: 'Lic. Lucía Ramos',
  },
  pediatrico: {
    actorId: '44444444-4444-4444-4444-444444444444',
    correo: 'marta.quezada@pedia.demo',
    nombre: 'Dra. Marta Quezada',
  },
};
