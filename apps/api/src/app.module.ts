import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActualizarPieza, RegistrarMedicion, RegistrarResultadoExamen, RegistrarVacuna, ReservarCita } from './aplicacion/casos-extension';
import { AgregarDiagnostico } from './aplicacion/agregar-diagnostico';
import { ArchivarExpediente } from './aplicacion/archivar-expediente';
import { BuscarExpedientes, ObtenerExpediente } from './aplicacion/consultas-expediente';
import { ConsultarAuditoria } from './aplicacion/consultar-auditoria';
import { CrearPacienteNuevo } from './aplicacion/crear-paciente-nuevo';
import { RecetarMedicamento } from './aplicacion/recetar-medicamento';
import { CerrarCita, DictaminarExamen, ListarVacunasPendientes, RegistrarProcedimiento } from './aplicacion/casos-seguimiento';
import { RegistrarConsulta } from './aplicacion/registrar-consulta';
import { PacientesController } from './infraestructura/http/pacientes.controller';
import { SesionController } from './infraestructura/http/sesion.controller';
import { PersistenciaModule } from './infraestructura/persistencia.module';
import { SaludController } from './salud.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),
    PersistenciaModule,
  ],
  controllers: [SaludController, SesionController, PacientesController],
  providers: [
    CrearPacienteNuevo,
    RegistrarConsulta,
    AgregarDiagnostico,
    RecetarMedicamento,
    ArchivarExpediente,
    ReservarCita,
    RegistrarResultadoExamen,
    RegistrarMedicion,
    RegistrarVacuna,
    ActualizarPieza,
    ObtenerExpediente,
    BuscarExpedientes,
    ConsultarAuditoria,
    CerrarCita,
    DictaminarExamen,
    RegistrarProcedimiento,
    ListarVacunasPendientes,
  ],
})
export class AppModule {}
