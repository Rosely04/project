import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getChildren, getPayments, savePayment } from '../../lib/storage';
import { Child, Payment } from '../types';
// IMPORTAMOS LA LÓGICA DE PAGOS
import { filterChildrenByPaymentStatus, calculatePaymentStats } from '../utils/paymentHelpers';

export type PaymentFilter = 'all' | 'paid' | 'unpaid';

export const usePayments = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [standardPayment, setStandardPayment] = useState(2500);

  const loadData = useCallback(async () => {
    try {
      const [childrenData, paymentsData] = await Promise.all([
        getChildren(),
        getPayments(),
      ]);
      setChildren(childrenData);
      setPayments(paymentsData);
      
      // Aplicamos filtro inicial
      setFilteredChildren(filterChildrenByPaymentStatus(childrenData, filter));
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  }, [filter]); // Dependencia filter para recargar si cambia (aunque lo manejamos abajo)

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Efecto para filtrar cuando cambia la data o el filtro
  useFocusEffect(
    useCallback(() => {
      const filtered = filterChildrenByPaymentStatus(children, filter);
      setFilteredChildren(filtered);
    }, [children, filter])
  );

  const handlePayment = async (child: Child) => {
    if (child.has_paid) {
      Alert.alert('Aviso', `El pago de ${child.name} ya está registrado.`);
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
      
      await savePayment(payment);
      await loadData(); // Recargamos la UI
      Alert.alert('Éxito', 'Pago registrado correctamente');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  // Usamos la función helper para estadísticas
  const stats = calculatePaymentStats(children);
  
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
    potentialRevenue,
    refreshData: loadData
  };
};