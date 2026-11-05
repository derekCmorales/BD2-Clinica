/** 23505 = unique_violation (event store). 23P01 = exclusion_violation (citas). */
export function codigoPg(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string') {
    return error.code;
  }
  return undefined;
}

export function esViolacionUnica(error: unknown): boolean {
  return codigoPg(error) === '23505';
}

export function esSolape(error: unknown): boolean {
  return codigoPg(error) === '23P01';
}
