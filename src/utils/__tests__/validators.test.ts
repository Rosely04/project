// src/utils/__tests__/validators.test.ts
import { validateWorkerForm } from '../validators';

describe('Pruebas de Validación (Workers)', () => {

  // Caso 1: Todo correcto
  it('Debe pasar si todos los datos son válidos', () => {
    const resultado = validateWorkerForm(
      'Maria Perez',    // Nombre
      'Educadora',      // Cargo
      '+5355555555',    // Teléfono
      'maria@test.com', // Email
      '3000',           // Salario
      '2023-01-01'      // Fecha
    );
    expect(resultado.isValid).toBe(true);
    expect(resultado.errors).toEqual({});
  });

  // Caso 2: Nombre inválido
  it('Debe fallar si el nombre tiene números', () => {
    const resultado = validateWorkerForm(
      'Maria 123',      // <-- Nombre con números
      'Educadora',
      '+5355555555',
      '',
      '3000',
      '2023-01-01'
    );
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors.name).toBeDefined(); // Debe haber error en 'name'
  });

  // Caso 3: Teléfono mal formato
  it('Debe fallar si el teléfono no empieza con +53', () => {
    const resultado = validateWorkerForm(
      'Maria Perez',
      'Educadora',
      '55555555',       // <-- Falta el +53
      '',
      '3000',
      '2023-01-01'
    );
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors.phone).toContain('Formato');
  });

  // Caso 4: Salario negativo
  it('Debe fallar si el salario es negativo o cero', () => {
    const resultado = validateWorkerForm(
      'Maria Perez',
      'Educadora',
      '+5355555555',
      '',
      '-500',           // <-- Negativo
      '2023-01-01'
    );
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors.salary).toBeDefined();
  });

  // Caso 5: Email incorrecto
  it('Debe fallar si el email no tiene @', () => {
    const resultado = validateWorkerForm(
      'Maria Perez',
      'Educadora',
      '+5355555555',
      'mariatest.com',  // <-- Falta @
      '3000',
      '2023-01-01'
    );
    expect(resultado.isValid).toBe(false);
    expect(resultado.errors.email).toBeDefined();
  });
});