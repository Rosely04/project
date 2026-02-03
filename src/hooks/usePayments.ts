import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getChildren, getPayments, savePayment } from '../../lib/storage';
import { Child, Payment } from '../types';

export type PaymentFilter = 'all' | 'paid' | 'unpaid';

export const usePayments = () => {
  // --- ESTADOS ---
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [standardPayment, setStandardPayment] = useState(2500);

  // --- EFECTOS ---
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterChildren();
  }, [children, filter]);

  // --- LOGICA DE DATOS ---
  const loadData = async () => {
    // Al cargar, getChildren verifica internamente las fechas
    const [childrenData, paymentsData] = await Promise.all([
      getChildren(),
      getPayments(),
    ]);
    setChildren(childrenData);
    setPayments(paymentsData);
  };

  const filterChildren = () => {
    let filtered = children;
    switch (filter) {
      case 'paid': filtered = filtered.filter(child => child.has_paid); break;
      case 'unpaid': filtered = filtered.filter(child => !child.has_paid); break;
      default: break;
    }
    setFilteredChildren(filtered);
  };

  // --- LOGICA DE TRANSACCION ---
  const handlePayment = async (child: Child) => {
    if (child.has_paid) {
      Alert.alert(
        'Pago ya registrado',
        `El pago de ${child.name} ya está registrado y no se puede modificar hasta el próximo mes.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    try {
      const payment: Payment = {
        id: Date.now().toString(),
        child_id: child.id,
        child_name: child.name,
        amount: standardPayment, 
        payment_date: new Date().toISOString().split('T')[0],
        description: 'Pago mensual estándar',
        created_at: new Date().toISOString(),
      };
      
      // savePayment arrojará error si ya pagó en los últimos 30 días
      await savePayment(payment);
      await loadData(); // Recargamos la UI
    } catch (error: any) {
      Alert.alert('No permitido', error.message);
    }
  };

  // --- CALCULOS Y ESTADISTICAS ---
  const stats = {
    paid: children.filter(child => child.has_paid).length,
    unpaid: children.filter(child => !child.has_paid).length,
    total: children.length
  };
  
  const potentialRevenue = stats.paid * standardPayment;

  return {
    children,
    payments,
    filteredChildren,
    filter,
    setFilter,
    standardPayment,
    handlePayment,
    stats,
    potentialRevenue
  };
};