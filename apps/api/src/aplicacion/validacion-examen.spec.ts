import { DatosInvalidos } from '../dominio/errores/errores-dominio';
import { exigirValoresExamen } from './validacion';

describe('validación de exámenes por tipo', () => {
  it('acepta el conjunto completo de hematología', () => {
    const valores = exigirValoresExamen('hematologia', {
      hemoglobina: '13.5',
      hematocrito: '40',
      leucocitos: '7200',
      plaquetas: '250',
      eritrocitos: '4.8',
    });
    expect(Object.keys(valores)).toHaveLength(5);
    expect(valores.hemoglobina).toBe('13.5');
  });

  it('acepta el antibiograma embebido del cultivo', () => {
    const valores = exigirValoresExamen('cultivo', {
      muestra: 'orina',
      organismo: 'Escherichia coli',
      recuentoUfc: '100000',
      antibiograma: [
        { antibiotico: 'Nitrofurantoína', sensibilidad: 'S' },
        { antibiotico: 'Ciprofloxacino', sensibilidad: 'R' },
      ],
    });
    expect(valores.antibiograma).toEqual([
      { antibiotico: 'Nitrofurantoína', sensibilidad: 'S' },
      { antibiotico: 'Ciprofloxacino', sensibilidad: 'R' },
    ]);
  });

  it('rechaza una sensibilidad que no sea S, I o R', () => {
    expect(() =>
      exigirValoresExamen('cultivo', {
        muestra: 'orina',
        organismo: 'Escherichia coli',
        recuentoUfc: '100000',
        antibiograma: [{ antibiotico: 'Ciprofloxacino', sensibilidad: 'X' }],
      }),
    ).toThrow(DatosInvalidos);
  });

  it('rechaza un campo requerido ausente', () => {
    expect(() => exigirValoresExamen('orina', { color: 'amarillo' })).toThrow(DatosInvalidos);
  });
});
