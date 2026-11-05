import type { VacunaPendienteDTO } from '../dominio/puertos/expediente-query.service';

export function dosisPendientes(
  expedientes: readonly {
    readonly pacienteId: string;
    readonly datos: { readonly nombres: string; readonly apellidos: string };
    readonly vacunas: readonly { readonly codigo: string; readonly proximaEn: string }[];
  }[],
  hasta: string,
): VacunaPendienteDTO[] {
  return expedientes.flatMap((expediente) =>
    expediente.vacunas
      .filter((vacuna) => vacuna.proximaEn <= hasta)
      .map((vacuna) => ({
        pacienteId: expediente.pacienteId,
        nombres: expediente.datos.nombres,
        apellidos: expediente.datos.apellidos,
        codigo: vacuna.codigo,
        proximaEn: vacuna.proximaEn,
      })),
  );
}
