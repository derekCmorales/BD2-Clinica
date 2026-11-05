import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { PacienteId } from '../../compartido/tipos';
import { ActualizarPieza, RegistrarMedicion, RegistrarResultadoExamen, RegistrarVacuna, ReservarCita } from '../../aplicacion/casos-extension';
import { CerrarCita, DictaminarExamen, ListarVacunasPendientes, RegistrarProcedimiento } from '../../aplicacion/casos-seguimiento';
import { AgregarDiagnostico } from '../../aplicacion/agregar-diagnostico';
import { ArchivarExpediente } from '../../aplicacion/archivar-expediente';
import { BuscarExpedientes, ObtenerExpediente } from '../../aplicacion/consultas-expediente';
import { CrearPacienteNuevo } from '../../aplicacion/crear-paciente-nuevo';
import { RecetarMedicamento } from '../../aplicacion/recetar-medicamento';
import { RegistrarConsulta } from '../../aplicacion/registrar-consulta';
import { exigirPacienteId, exigirTexto } from '../../aplicacion/validacion';
import type { SolicitudAutenticada } from '../auth/actor';
import { GuardiaJwt } from '../auth/guardia-jwt';
import {
  ArchivarDto,
  CerrarCitaDto,
  CitaDto,
  ConsultaDto,
  DictamenDto,
  ProcedimientoDto,
  CrearPacienteDto,
  DiagnosticoDto,
  ExamenDto,
  MedicionDto,
  PiezaDto,
  RecetaDto,
  VacunaDto,
} from './dto';

@ApiTags('pacientes')
@ApiBearerAuth()
@UseGuards(GuardiaJwt)
@Controller('pacientes')
export class PacientesController {
  constructor(
    private readonly crear: CrearPacienteNuevo,
    private readonly buscar: BuscarExpedientes,
    private readonly obtener: ObtenerExpediente,
    private readonly registrarConsulta: RegistrarConsulta,
    private readonly agregarDiagnostico: AgregarDiagnostico,
    private readonly recetar: RecetarMedicamento,
    private readonly archivar: ArchivarExpediente,
    private readonly reservarCita: ReservarCita,
    private readonly registrarExamen: RegistrarResultadoExamen,
    private readonly registrarMedicion: RegistrarMedicion,
    private readonly registrarVacuna: RegistrarVacuna,
    private readonly actualizarPieza: ActualizarPieza,
    private readonly cerrarCita: CerrarCita,
    private readonly registrarProcedimiento: RegistrarProcedimiento,
    private readonly dictaminarExamen: DictaminarExamen,
    private readonly vacunasPendientes: ListarVacunasPendientes,
  ) {}

  @Get()
  listar(@Query('texto') texto = '') {
    return this.buscar.ejecutar(texto);
  }

  @Get('vacunas-pendientes')
  pendientes(@Query('hasta') hasta = new Date().toISOString().slice(0, 10)) {
    return this.vacunasPendientes.ejecutar(hasta);
  }

  @Post()
  crearPaciente(@Body() dto: CrearPacienteDto, @Req() solicitud: SolicitudAutenticada) {
    return this.crear.ejecutar(dto, this.actor(solicitud));
  }

  @Get(':pacienteId')
  ver(@Param('pacienteId') pacienteId: string, @Req() solicitud: SolicitudAutenticada) {
    return this.obtener.ejecutar(this.id(pacienteId), this.actor(solicitud));
  }

  @Post(':pacienteId/consultas')
  consulta(@Param('pacienteId') pacienteId: string, @Body() dto: ConsultaDto, @Req() solicitud: SolicitudAutenticada) {
    return this.registrarConsulta.ejecutar(this.id(pacienteId), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/consultas/:consultaId/diagnosticos')
  diagnostico(
    @Param('pacienteId') pacienteId: string,
    @Param('consultaId') consultaId: string,
    @Body() dto: DiagnosticoDto,
    @Req() solicitud: SolicitudAutenticada,
  ) {
    return this.agregarDiagnostico.ejecutar(this.id(pacienteId), exigirTexto(consultaId, 'consultaId'), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/consultas/:consultaId/recetas')
  receta(
    @Param('pacienteId') pacienteId: string,
    @Param('consultaId') consultaId: string,
    @Body() dto: RecetaDto,
    @Req() solicitud: SolicitudAutenticada,
  ) {
    return this.recetar.ejecutar(this.id(pacienteId), exigirTexto(consultaId, 'consultaId'), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/archivar')
  archivarExpediente(@Param('pacienteId') pacienteId: string, @Body() dto: ArchivarDto, @Req() solicitud: SolicitudAutenticada) {
    return this.archivar.ejecutar(this.id(pacienteId), dto.motivo, this.actor(solicitud));
  }

  @Post(':pacienteId/citas')
  cita(@Param('pacienteId') pacienteId: string, @Body() dto: CitaDto, @Req() solicitud: SolicitudAutenticada) {
    return this.reservarCita.ejecutar(this.id(pacienteId), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/citas/:citaId/cerrar')
  cerrar(
    @Param('pacienteId') pacienteId: string,
    @Param('citaId') citaId: string,
    @Body() dto: CerrarCitaDto,
    @Req() solicitud: SolicitudAutenticada,
  ) {
    return this.cerrarCita.ejecutar(this.id(pacienteId), citaId, dto.estado, this.actor(solicitud));
  }

  @Post(':pacienteId/examenes/:examenId/dictamen')
  dictamen(
    @Param('pacienteId') pacienteId: string,
    @Param('examenId') examenId: string,
    @Body() dto: DictamenDto,
    @Req() solicitud: SolicitudAutenticada,
  ) {
    return this.dictaminarExamen.ejecutar(this.id(pacienteId), examenId, dto.estado, this.actor(solicitud));
  }

  @Post(':pacienteId/procedimientos')
  procedimiento(@Param('pacienteId') pacienteId: string, @Body() dto: ProcedimientoDto, @Req() solicitud: SolicitudAutenticada) {
    return this.registrarProcedimiento.ejecutar(this.id(pacienteId), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/examenes')
  examen(@Param('pacienteId') pacienteId: string, @Body() dto: ExamenDto, @Req() solicitud: SolicitudAutenticada) {
    return this.registrarExamen.ejecutar(this.id(pacienteId), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/mediciones')
  medicion(@Param('pacienteId') pacienteId: string, @Body() dto: MedicionDto, @Req() solicitud: SolicitudAutenticada) {
    return this.registrarMedicion.ejecutar(this.id(pacienteId), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/vacunas')
  vacuna(@Param('pacienteId') pacienteId: string, @Body() dto: VacunaDto, @Req() solicitud: SolicitudAutenticada) {
    return this.registrarVacuna.ejecutar(this.id(pacienteId), dto, this.actor(solicitud));
  }

  @Post(':pacienteId/piezas')
  pieza(@Param('pacienteId') pacienteId: string, @Body() dto: PiezaDto, @Req() solicitud: SolicitudAutenticada) {
    return this.actualizarPieza.ejecutar(this.id(pacienteId), dto, this.actor(solicitud));
  }

  private id(valor: string): PacienteId {
    return exigirPacienteId(valor);
  }

  private actor(solicitud: SolicitudAutenticada) {
    const actor = solicitud.actor;
    if (!actor) {
      throw new Error('Solicitud sin actor');
    }
    return actor;
  }
}
