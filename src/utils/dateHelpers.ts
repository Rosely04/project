// src/utils/dateHelpers.ts

export const DAYS_30_IN_MS = 30 * 24 * 60 * 60 * 1000;

// Función para verificar si pasaron 30 días
export const hasPassed30Days = (dateString: string | null | undefined): boolean => {
  if (!dateString) return true; 
  const date = new Date(dateString);
  const now = new Date();
  // Si la fecha es inválida, retornamos true para evitar errores
  if (isNaN(date.getTime())) return true;
  return (now.getTime() - date.getTime()) >= DAYS_30_IN_MS;
};

// Función para calcular meses trabajados
export const getMonthsWorked = (hireDateStr: string): number => {
  const hireDate = new Date(hireDateStr);
  const now = new Date();
  
  if (isNaN(hireDate.getTime()) || hireDate > now) return 0;
  
  const diffTime = Math.abs(now.getTime() - hireDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Tu lógica original: cada 30 días cuenta como un mes
  return Math.floor(diffDays / 30) + 1; 
};