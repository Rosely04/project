// src/utils/validators.ts

export interface WorkerValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export const validateWorkerForm = (
  name: string,
  position: string,
  phone: string,
  email: string,
  salary: string,
  hire_date: string
): WorkerValidationResult => {
  const errors: { [key: string]: string } = {};

  // Validación Nombre
  if (!name.trim()) {
    errors.name = 'Nombre es obligatorio';
  } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(name)) {
    errors.name = 'El nombre solo puede contener letras y espacios';
  }

  // Validación Cargo
  if (!position.trim()) {
    errors.position = 'Cargo es obligatorio';
  } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(position)) {
    errors.position = 'El cargo solo puede contener letras';
  }

  // Validación Teléfono (+53 seguido de 8 dígitos)
  if (!phone.trim()) {
    errors.phone = 'El teléfono es obligatorio';
  } else if (!/^\+53\d{8}$/.test(phone)) {
    errors.phone = 'Formato: +53xxxxxxxx (8 números)';
  }

  // Validación Email (Opcional pero si existe debe ser válido)
  if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Formato de email inválido';
  }

  // Validación Salario
  if (!salary.trim()) {
    errors.salary = 'Salario es obligatorio';
  } else if (!/^\d+$/.test(salary)) {
    errors.salary = 'El salario solo puede contener números';
  } else if (parseFloat(salary) <= 0) {
    errors.salary = 'El salario debe ser mayor a 0';
  }

  // Validación Fecha
  if (!hire_date.trim()) {
    errors.hire_date = 'Fecha obligatoria';
  } else {
    const date = new Date(hire_date);
    if (isNaN(date.getTime())) {
      errors.hire_date = 'Fecha inválida';
    } else if (date > new Date()) {
      errors.hire_date = 'La fecha no puede ser futura';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};