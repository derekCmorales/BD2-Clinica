import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsNumber, IsObject, IsOptional, IsString, Length, Min } from 'class-validator';

const INSTITUCIONES = ['hospital', 'odontologia', 'laboratorio', 'pediatrico'] as const;

export class IniciarSesionDto {
  @ApiProperty({ enum: INSTITUCIONES })
  @IsIn(INSTITUCIONES)
  institucionId!: (typeof INSTITUCIONES)[number];

  @ApiProperty({ example: 'demo' })
  @IsString()
  @Length(1, 80)
  clave!: string;
}

export class CrearPacienteDto {
  @ApiProperty({ example: '1234567890101' })
  @IsString()
  @Length(13, 13)
  dpi!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  nombres!: string;

  @ApiProperty()
  @IsString()
  @Length(1, 120)
  apellidos!: string;

  @ApiProperty({ example: '1990-01-01' })
  @IsString()
  fechaNacimiento!: string;

  @ApiProperty({ enum: ['M', 'F', 'X'] })
  @IsIn(['M', 'F', 'X'])
  sexo!: 'M' | 'F' | 'X';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  direccion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  correo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  codigoReferencia?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tutorNombre?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tutorTelefono?: string;
}

export class ConsultaDto {
  @ApiProperty()
  @IsString()
  @Length(1, 250)
  motivo!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notas?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  citaId?: string;
}

export class DiagnosticoDto {
  @ApiProperty()
  @IsString()
  @Length(1, 350)
  textoLibre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  esPrincipal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  catalogoCodigo?: string;
}

export class RecetaDto {
  @ApiProperty()
  @IsString()
  textoLibre!: string;

  @ApiProperty()
  @IsString()
  dosis!: string;

  @ApiProperty()
  @IsString()
  frecuencia!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  duracionDias?: number;
}

export class ArchivarDto {
  @ApiProperty()
  @IsString()
  @Length(1, 250)
  motivo!: string;
}

export class CitaDto {
  @ApiProperty()
  @IsString()
  inicio!: string;

  @ApiProperty()
  @IsString()
  fin!: string;

  @ApiProperty()
  @IsString()
  motivo!: string;
}

export class ExamenDto {
  @ApiProperty({ enum: ['hematologia', 'orina', 'cultivo', 'otro'] })
  @IsIn(['hematologia', 'orina', 'cultivo', 'otro'])
  tipoExamen!: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsString()
  fecha!: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsObject()
  valores!: Record<string, string>;
}

export class MedicionDto {
  @ApiProperty()
  @IsString()
  fecha!: string;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  pesoKg!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0.1)
  tallaCm!: number;
}

export class VacunaDto {
  @ApiProperty()
  @IsString()
  codigo!: string;

  @ApiProperty()
  @IsString()
  proximaEn!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  aplicadaEn?: string;
}

export class CerrarCitaDto {
  @ApiProperty({ enum: ['cancelada', 'inasistencia'] })
  @IsIn(['cancelada', 'inasistencia'])
  estado!: 'cancelada' | 'inasistencia';
}

export class DictamenDto {
  @ApiProperty({ enum: ['validado', 'anulado'] })
  @IsIn(['validado', 'anulado'])
  estado!: 'validado' | 'anulado';
}

export class ProcedimientoDto {
  @ApiProperty()
  @IsInt()
  codigoFdi!: number;

  @ApiProperty()
  @IsString()
  consultaId!: string;

  @ApiProperty()
  @IsString()
  tipo!: string;

  @ApiProperty()
  @IsString()
  descripcion!: string;
}

export class PiezaDto {
  @ApiProperty({ example: 11 })
  @IsInt()
  codigoFdi!: number;

  @ApiProperty()
  @IsString()
  estado!: string;
}

/** Metadatos de la bitácora: nunca incluye payload clínico. */
export class EntradaAuditoriaDto {
  @ApiProperty()
  actorId!: string;

  @ApiProperty({ enum: ['lectura', 'escritura'] })
  accion!: 'lectura' | 'escritura';

  @ApiProperty({ example: 'expediente' })
  recurso!: string;

  @ApiProperty({ example: '2026-11-05T12:00:00.000Z' })
  ocurridoEn!: string;
}
