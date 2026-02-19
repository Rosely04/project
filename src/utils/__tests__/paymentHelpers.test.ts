// src/utils/__tests__/paymentHelpers.test.ts
import { 
  calculateTotalRevenue, 
  filterChildrenByPaymentStatus, 
  calculatePaymentStats 
} from '../paymentHelpers';

// Datos falsos para probar
const mockChildren = [
  { id: '1', name: 'Juan', has_paid: true },
  { id: '2', name: 'Maria', has_paid: false },
  { id: '3', name: 'Pedro', has_paid: true }
];

const mockPayments = [
  { id: '1', amount: 1000, child_id: '1', child_name: 'Juan', payment_date: '', description: '', created_at: '' },
  { id: '2', amount: 2000, child_id: '3', child_name: 'Pedro', payment_date: '', description: '', created_at: '' }
];

describe('Pruebas de Pagos (PaymentHelpers)', () => {

  it('Calcula total recaudado correctamente (1000 + 2000 = 3000)', () => {
    const total = calculateTotalRevenue(mockPayments as any);
    expect(total).toBe(3000);
  });

  it('Filtra niños que ya pagaron', () => {
    const result = filterChildrenByPaymentStatus(mockChildren as any, 'paid');
    expect(result.length).toBe(2); // Juan y Pedro
    expect(result[0].name).toBe('Juan');
  });

  it('Calcula estadísticas (cuántos pagaron vs total)', () => {
    const stats = calculatePaymentStats(mockChildren as any);
    
    expect(stats.paid).toBe(2);   // 2 pagaron
    expect(stats.unpaid).toBe(1); // 1 no pagó
    expect(stats.total).toBe(3);  // 3 total
  });

});