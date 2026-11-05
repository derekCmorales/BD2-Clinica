export function parsearFecha(valor: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return new Date(`${valor}T12:00:00`);
  }
  return new Date(valor);
}

export function fechaLegible(valor: string): string {
  const fecha = parsearFecha(valor);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }
  return new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(fecha);
}

export function fechaHora(valor: string): string {
  const fecha = parsearFecha(valor);
  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }
  return new Intl.DateTimeFormat('es-GT', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export function edad(fechaNacimiento: string): string {
  const nacio = parsearFecha(fechaNacimiento);
  if (Number.isNaN(nacio.getTime())) {
    return '';
  }
  const hoy = new Date();
  let meses = (hoy.getFullYear() - nacio.getFullYear()) * 12 + (hoy.getMonth() - nacio.getMonth());
  if (hoy.getDate() < nacio.getDate()) {
    meses -= 1;
  }
  if (meses < 0) {
    return '';
  }
  if (meses < 24) {
    return `${meses} meses`;
  }
  return `${Math.floor(meses / 12)} años`;
}

export function iniciales(nombres: string, apellidos: string): string {
  const primera = nombres.trim().charAt(0);
  const segunda = apellidos.trim().charAt(0);
  return `${primera}${segunda}`.toUpperCase();
}

export function vencida(fecha: string): boolean {
  const objetivo = parsearFecha(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return objetivo.getTime() < hoy.getTime();
}

/** Fecha local de hoy en formato ISO (YYYY-MM-DD), para valores por defecto de formularios. */
export function hoyIso(desplazamientoDias = 0): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + desplazamientoDias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/** datetime-local de hoy a la hora indicada. */
export function hoyHora(hora: number, minutos = 0, desplazamientoDias = 1): string {
  return `${hoyIso(desplazamientoDias)}T${String(hora).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

export function esMenor(fechaNacimiento: string): boolean {
  const nacio = parsearFecha(fechaNacimiento);
  const limite = new Date();
  limite.setFullYear(limite.getFullYear() - 18);
  return nacio.getTime() > limite.getTime();
}

export function fechaRelativa(valor: string): string {
  const objetivo = parsearFecha(valor);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  objetivo.setHours(0, 0, 0, 0);
  const dias = Math.round((objetivo.getTime() - hoy.getTime()) / 86_400_000);
  if (dias === 0) return 'hoy';
  if (dias === -1) return 'ayer';
  if (dias === 1) return 'mañana';
  if (dias < 0) return `hace ${-dias} d`;
  return `en ${dias} d`;
}
