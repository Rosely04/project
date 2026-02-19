// src/utils/paymentHelpers.ts
import { Payment, Child } from '../types';

// Función 1: Calcular total de dinero
export const calculateTotalRevenue = (payments: Payment[]): number => {
  if (!payments || payments.length === 0) return 0;
  return payments.reduce((total, payment) => total + payment.amount, 0);
};

// Función 2: Filtrar niños (pagaron / no pagaron)
export const filterChildrenByPaymentStatus = (
  children: Child[], 
  filter: 'all' | 'paid' | 'unpaid'
): Child[] => {
  if (filter === 'all') return children;
  if (filter === 'paid') return children.filter(c => c.has_paid);
  if (filter === 'unpaid') return children.filter(c => !c.has_paid);
  return children;
};

// Función 3: Estadísticas (ESTA ES LA QUE TE FALTABA)
export const calculatePaymentStats = (children: Child[]) => {
  return {
    paid: children.filter(c => c.has_paid).length,
    unpaid: children.filter(c => !c.has_paid).length,
    total: children.length
  };
};