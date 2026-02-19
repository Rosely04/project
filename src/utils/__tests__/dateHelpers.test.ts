// src/utils/__tests__/dateHelpers.test.ts
import { hasPassed30Days, getMonthsWorked } from '../dateHelpers';

describe('Pruebas Unitarias de Fechas', () => {

  // PRUEBA 1: hasPassed30Days
  describe('hasPassed30Days', () => {
    it('Debe ser TRUE si la fecha es null', () => {
      expect(hasPassed30Days(null)).toBe(true);
    });

    it('Debe ser TRUE si pasaron muchos años', () => {
      // Fecha muy antigua
      const fechaVieja = '2000-01-01'; 
      expect(hasPassed30Days(fechaVieja)).toBe(true);
    });

    it('Debe ser FALSE si la fecha fue ayer', () => {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1); // Restamos 1 día
      expect(hasPassed30Days(ayer.toISOString())).toBe(false);
    });
  });

  // PRUEBA 2: getMonthsWorked
  describe('getMonthsWorked', () => {
    it('Debe devolver 0 si la fecha es futura o inválida', () => {
      const futuro = '2099-01-01';
      expect(getMonthsWorked(futuro)).toBe(0);
    });

    it('Debe devolver al menos 1 si la fecha es hoy', () => {
      const hoy = new Date().toISOString();
      expect(getMonthsWorked(hoy)).toBe(1);
    });
  });

});