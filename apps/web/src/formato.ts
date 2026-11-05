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
