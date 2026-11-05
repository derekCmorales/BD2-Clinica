import type { ActorId, CitaId, ConsultaId, PacienteId } from '../../compartido/tipos';
import type { EventoDeDominio } from '../eventos/eventos';
import {
  CitaSolapada,
  ConsultaNoEncontrada,
  DatosInvalidos,
  ExpedienteArchivado,
  HistorialInconsistente,
} from '../errores/errores-dominio';
import type {
  Cita,
  Consulta,
  DatosPaciente,
  Diagnostico,
  EstadoExpediente,
  Medicion,
  MotivoCierreCita,
  PiezaDental,
  ProcedimientoDental,
  Receta,
  ResultadoExamen,
  Vacuna,
} from './tipos-clinicos';

interface Props {
  readonly pacienteId: PacienteId;
  readonly expedienteId: string;
  readonly datos: DatosPaciente;
  readonly estado: EstadoExpediente;
  readonly motivoArchivo?: string;
  readonly version: number;
  readonly consultas: readonly Consulta[];
  readonly citas: readonly Cita[];
  readonly examenes: readonly ResultadoExamen[];
  readonly mediciones: readonly Medicion[];
  readonly vacunas: readonly Vacuna[];
  readonly piezas: readonly PiezaDental[];
  readonly procedimientos: readonly ProcedimientoDental[];
  readonly eventosPendientes: readonly EventoDeDominio[];
}

/**
 * Aggregate del historial. Cada cambio devuelve una copia y acumula eventos;
 * la versión persistida no avanza hasta `confirmado()` (después de un guardado exitoso).
 */
export class Expediente {
  private constructor(private readonly props: Props) {}

  get pacienteId(): PacienteId {
    return this.props.pacienteId;
  }

  get expedienteId(): string {
    return this.props.expedienteId;
  }

  get datos(): DatosPaciente {
    return this.props.datos;
  }

  get estado(): EstadoExpediente {
    return this.props.estado;
  }

  get motivoArchivo(): string | undefined {
    return this.props.motivoArchivo;
  }

  /** Versión ya persistida. Los eventos pendientes usan version+1, version+2, … */
  get version(): number {
    return this.props.version;
  }

  get versionNueva(): number {
    return this.props.version + this.props.eventosPendientes.length;
  }

  get consultas(): readonly Consulta[] {
    return this.props.consultas;
  }

  get citas(): readonly Cita[] {
    return this.props.citas;
  }

  get examenes(): readonly ResultadoExamen[] {
    return this.props.examenes;
  }

  get mediciones(): readonly Medicion[] {
    return this.props.mediciones;
  }

  get vacunas(): readonly Vacuna[] {
    return this.props.vacunas;
  }

  get piezas(): readonly PiezaDental[] {
    return this.props.piezas;
  }

  get procedimientos(): readonly ProcedimientoDental[] {
    return this.props.procedimientos;
  }

  get eventosPendientes(): readonly EventoDeDominio[] {
    return this.props.eventosPendientes;
  }

  static crear(entrada: {
    readonly pacienteId: PacienteId;
    readonly expedienteId: string;
    readonly datos: DatosPaciente;
    readonly actorId: ActorId;
    readonly ahora: string;
  }): Expediente {
    const vacio = new Expediente({
      pacienteId: entrada.pacienteId,
      expedienteId: entrada.expedienteId,
      datos: entrada.datos,
      estado: 'activo',
      version: 0,
      consultas: [],
      citas: [],
      examenes: [],
      mediciones: [],
      vacunas: [],
      piezas: [],
      procedimientos: [],
      eventosPendientes: [],
    });
    return vacio.emitir(entrada.actorId, entrada.ahora, {
      tipo: 'ExpedienteCreado',
      payload: { expedienteId: entrada.expedienteId, datos: entrada.datos },
    }, vacio.props);
  }

  /** Reconstrucción del aggregate desde el event store (Hospital). */
  static desdeEventos(pacienteId: PacienteId, eventos: readonly EventoDeDominio[]): Expediente {
    return eventos.reduce<Expediente | undefined>((actual, evento) => {
      if (!actual) {
        if (evento.tipo !== 'ExpedienteCreado' || evento.version !== 1) {
          throw new HistorialInconsistente(pacienteId);
        }
        const creado = new Expediente({
          pacienteId,
          expedienteId: evento.payload.expedienteId,
          datos: evento.payload.datos,
          estado: 'activo',
          version: 1,
          consultas: [],
          citas: [],
          examenes: [],
          mediciones: [],
          vacunas: [],
          piezas: [],
          procedimientos: [],
          eventosPendientes: [],
        });
        return creado;
      }
      if (evento.version !== actual.version + 1) {
        throw new HistorialInconsistente(pacienteId);
      }
      return actual.aplicar(evento).confirmado();
    }, undefined) ?? (() => {
      throw new HistorialInconsistente(pacienteId);
    })();
  }

  /** Snapshot ya persistido (read model, documento, JSON). Sin eventos pendientes. */
  static rehidratar(props: Omit<Props, 'eventosPendientes' | 'procedimientos'> & { procedimientos?: readonly ProcedimientoDental[] }): Expediente {
    return new Expediente({ ...props, procedimientos: props.procedimientos ?? [], eventosPendientes: [] });
  }

  confirmado(): Expediente {
    if (this.props.eventosPendientes.length === 0) {
      return this;
    }
    return new Expediente({
      ...this.props,
      version: this.versionNueva,
      eventosPendientes: [],
    });
  }

  registrarConsulta(
    consulta: Omit<Consulta, 'diagnosticos' | 'recetas'>,
    actorId: ActorId,
    ahora: string,
  ): Expediente {
    this.exigirActivo();
    const completa: Consulta = { ...consulta, diagnosticos: [], recetas: [] };
    const citas = consulta.citaId ? atenderCitaDe(consulta.citaId, this.props.citas) : this.props.citas;
    return this.emitir(actorId, ahora, {
      tipo: 'ConsultaRegistrada',
      payload: { consulta },
    }, {
      ...this.props,
      consultas: [...this.props.consultas, completa],
      citas,
    });
  }

  agregarDiagnostico(consultaId: ConsultaId, diagnostico: Diagnostico, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    return this.emitir(actorId, ahora, {
      tipo: 'DiagnosticoAgregado',
      payload: { consultaId, diagnostico },
    }, {
      ...this.props,
      consultas: this.mapConsulta(consultaId, (consulta) => ({
        ...consulta,
        diagnosticos: [...consulta.diagnosticos, diagnostico],
      })),
    });
  }

  recetar(consultaId: ConsultaId, receta: Receta, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    return this.emitir(actorId, ahora, {
      tipo: 'MedicamentoRecetado',
      payload: { consultaId, receta },
    }, {
      ...this.props,
      consultas: this.mapConsulta(consultaId, (consulta) => ({
        ...consulta,
        recetas: [...consulta.recetas, receta],
      })),
    });
  }

  archivar(motivo: string, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    return this.emitir(actorId, ahora, {
      tipo: 'ExpedienteArchivado',
      payload: { motivo },
    }, {
      ...this.props,
      estado: 'archivado',
      motivoArchivo: motivo,
    });
  }

  reservarCita(cita: Cita, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    if (!rangoValido(cita.inicio, cita.fin)) {
      throw new CitaSolapada();
    }
    const choca = this.props.citas.some(
      (existente) =>
        existente.medicoId === cita.medicoId &&
        existente.estado !== 'cancelada' &&
        existente.estado !== 'inasistencia' &&
        rangosChocan(existente.inicio, existente.fin, cita.inicio, cita.fin),
    );
    if (choca) {
      throw new CitaSolapada();
    }
    return this.emitir(actorId, ahora, {
      tipo: 'CitaReservada',
      payload: { cita },
    }, {
      ...this.props,
      citas: [...this.props.citas, cita],
    });
  }

  registrarExamen(examen: ResultadoExamen, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    const completo: ResultadoExamen = { ...examen, estado: examen.estado ?? 'registrado' };
    return this.emitir(actorId, ahora, {
      tipo: 'ResultadoExamenRegistrado',
      payload: { examen: completo },
    }, {
      ...this.props,
      examenes: [...this.props.examenes, completo],
    });
  }

  registrarMedicion(medicion: Medicion, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    return this.emitir(actorId, ahora, {
      tipo: 'MedicionRegistrada',
      payload: { medicion },
    }, {
      ...this.props,
      mediciones: [...this.props.mediciones, medicion],
    });
  }

  registrarVacuna(vacuna: Vacuna, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    const sinDuplicado = this.props.vacunas.filter((item) => item.codigo !== vacuna.codigo);
    return this.emitir(actorId, ahora, {
      tipo: 'VacunaRegistrada',
      payload: { vacuna },
    }, {
      ...this.props,
      vacunas: [...sinDuplicado, vacuna],
    });
  }

  cerrarCita(citaId: CitaId, estado: MotivoCierreCita, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    const cita = this.props.citas.find((item) => item.id === citaId);
    if (!cita || cita.estado !== 'programada') {
      throw new DatosInvalidos('citaId');
    }
    return this.emitir(actorId, ahora, {
      tipo: 'CitaCerrada',
      payload: { citaId, estado },
    }, {
      ...this.props,
      citas: this.props.citas.map((item) => (item.id === citaId ? { ...item, estado } : item)),
    });
  }

  registrarProcedimiento(procedimiento: ProcedimientoDental, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    if (!this.props.consultas.some((consulta) => consulta.id === procedimiento.consultaId)) {
      throw new ConsultaNoEncontrada(procedimiento.consultaId);
    }
    return this.emitir(actorId, ahora, {
      tipo: 'ProcedimientoRegistrado',
      payload: { procedimiento },
    }, {
      ...this.props,
      procedimientos: [...this.props.procedimientos, procedimiento],
    });
  }

  dictaminarExamen(examenId: string, estado: 'validado' | 'anulado', actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    const examen = this.props.examenes.find((item) => item.id === examenId);
    if (!examen || examen.estado === 'anulado' || (estado === 'validado' && examen.estado !== 'registrado')) {
      throw new DatosInvalidos('examenId');
    }
    return this.emitir(actorId, ahora, {
      tipo: 'ResultadoExamenDictaminado',
      payload: { examenId, estado },
    }, {
      ...this.props,
      examenes: this.props.examenes.map((item) => (item.id === examenId ? { ...item, estado } : item)),
    });
  }

  actualizarPieza(pieza: PiezaDental, actorId: ActorId, ahora: string): Expediente {
    this.exigirActivo();
    const resto = this.props.piezas.filter((item) => item.codigoFdi !== pieza.codigoFdi);
    return this.emitir(actorId, ahora, {
      tipo: 'PiezaActualizada',
      payload: { pieza },
    }, {
      ...this.props,
      piezas: [...resto, pieza],
    });
  }

  private exigirActivo(): void {
    if (this.props.estado === 'archivado') {
      throw new ExpedienteArchivado(this.props.pacienteId);
    }
  }

  private mapConsulta(consultaId: ConsultaId, cambiar: (consulta: Consulta) => Consulta): readonly Consulta[] {
    let encontrada = false;
    const consultas = this.props.consultas.map((consulta) => {
      if (consulta.id !== consultaId) {
        return consulta;
      }
      encontrada = true;
      return cambiar(consulta);
    });
    if (!encontrada) {
      throw new ConsultaNoEncontrada(consultaId);
    }
    return consultas;
  }

  private emitir(
    actorId: ActorId,
    ahora: string,
    cuerpo: Omit<EventoDeDominio, 'version' | 'ocurridoEn' | 'actorId'>,
    siguiente: Props,
  ): Expediente {
    const evento = {
      ...cuerpo,
      version: this.versionNueva + 1,
      ocurridoEn: ahora,
      actorId,
    } as EventoDeDominio;
    return new Expediente({
      ...siguiente,
      version: this.props.version,
      eventosPendientes: [...this.props.eventosPendientes, evento],
    });
  }

  /** Aplica un evento ya numerado sobre el estado (replay). No acumula pendientes. */
  private aplicar(evento: EventoDeDominio): Expediente {
    const actorId = evento.actorId;
    const ahora = evento.ocurridoEn;
    switch (evento.tipo) {
      case 'ExpedienteCreado':
        return this;
      case 'ConsultaRegistrada':
        return this.registrarConsulta(evento.payload.consulta, actorId, ahora);
      case 'DiagnosticoAgregado':
        return this.agregarDiagnostico(
          evento.payload.consultaId as ConsultaId,
          evento.payload.diagnostico,
          actorId,
          ahora,
        );
      case 'MedicamentoRecetado':
        return this.recetar(evento.payload.consultaId as ConsultaId, evento.payload.receta, actorId, ahora);
      case 'ExpedienteArchivado':
        return this.archivar(evento.payload.motivo, actorId, ahora);
      case 'CitaReservada':
        return this.reservarCita({ ...evento.payload.cita, id: evento.payload.cita.id as CitaId }, actorId, ahora);
      case 'ResultadoExamenRegistrado':
        return this.registrarExamen(evento.payload.examen, actorId, ahora);
      case 'MedicionRegistrada':
        return this.registrarMedicion(evento.payload.medicion, actorId, ahora);
      case 'VacunaRegistrada':
        return this.registrarVacuna(evento.payload.vacuna, actorId, ahora);
      case 'PiezaActualizada':
        return this.actualizarPieza(evento.payload.pieza, actorId, ahora);
      case 'CitaCerrada':
        return this.cerrarCita(evento.payload.citaId as CitaId, evento.payload.estado, actorId, ahora);
      case 'ProcedimientoRegistrado':
        return this.registrarProcedimiento(evento.payload.procedimiento, actorId, ahora);
      case 'ResultadoExamenDictaminado':
        return this.dictaminarExamen(evento.payload.examenId, evento.payload.estado, actorId, ahora);
      default: {
        const nunca: never = evento;
        return nunca;
      }
    }
  }
}

function atenderCitaDe(citaId: CitaId, citas: readonly Cita[]): readonly Cita[] {
  const cita = citas.find((item) => item.id === citaId);
  if (!cita || cita.estado !== 'programada') {
    throw new DatosInvalidos('citaId');
  }
  return citas.map((item) => (item.id === citaId ? { ...item, estado: 'atendida' as const } : item));
}

function rangoValido(inicio: string, fin: string): boolean {
  return new Date(fin).getTime() > new Date(inicio).getTime();
}

function rangosChocan(inicioA: string, finA: string, inicioB: string, finB: string): boolean {
  return new Date(inicioA).getTime() < new Date(finB).getTime() && new Date(inicioB).getTime() < new Date(finA).getTime();
}
