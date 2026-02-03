//Gestión de pagos 

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getChildren, getPayments, savePayment, updateChildPaymentStatus } from '../../lib/storage';
import { Child, Payment } from '../../src/types';
import { DollarSign, CreditCard, Check } from 'lucide-react-native';

type PaymentFilter = 'all' | 'paid' | 'unpaid';

export default function PaymentsScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [standardPayment, setStandardPayment] = useState(2500);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterChildren();
  }, [children, filter]);

  const loadData = async () => {
    // Al cargar, getChildren verificará internamente las fechas y actualizará el status a 'false' si pasó el mes
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

  const handlePayment = async (child: Child) => {
    if (child.has_paid) {
      Alert.alert(
        'Pago ya registrado',
        `El pago de ${child.name} ya está registrado y no se puede modificar hasta el próximo mes.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    // LOGICA CORREGIDA: Intentar pagar
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

  // Función local para mostrar stats de pago del mes, aunque el dinero en Dashboard se acumula histórico
  const getPotentialRevenue = () => {
    const childrenPaid = children.filter(child => child.has_paid).length;
    return childrenPaid * standardPayment;
  };

  const FilterButton = ({ filterType, label }: { filterType: PaymentFilter; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ChildPaymentCard = ({ child }: { child: Child }) => {
    const childPayments = payments.filter(p => p.child_id === child.id);
    return (
      <View style={styles.childCard}>
        <View style={styles.cardContentRow}>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.parentName}>Padre: {child.parent_name}</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.paymentButton,
              child.has_paid ? styles.paymentButtonPaid : styles.paymentButtonUnpaid
            ]}
            onPress={() => handlePayment(child)}
          >
            {child.has_paid ? (
              <><Check size={20} color="#FFFFFF" /><Text style={styles.paymentButtonText}>OK</Text></>
            ) : (
              <><DollarSign size={20} color="#FFFFFF" /><Text style={styles.paymentButtonText}>Pagar ${standardPayment}</Text></>
            )}
          </TouchableOpacity>
        </View>
        {childPayments.length > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.paymentsTitle}>Historial de pagos:</Text>
            {childPayments.slice().reverse().slice(0, 3).map((payment) => (
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentAmount}>${payment.amount}</Text>
                  <Text style={styles.paymentDate}>{payment.payment_date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const stats = {
    paid: children.filter(child => child.has_paid).length,
    unpaid: children.filter(child => !child.has_paid).length,
    total: children.length
  };
  const potentialRevenue = stats.paid * standardPayment;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Pagos</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>${potentialRevenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total ({stats.paid} niños)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.paid}/{stats.total}</Text>
            <Text style={styles.statLabel}>Pagados</Text>
          </View>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <FilterButton filterType="all" label="Todos" />
        <FilterButton filterType="paid" label="Pagaron" />
        <FilterButton filterType="unpaid" label="Sin pagar" />
      </View>

      <ScrollView style={styles.content}>
        {filteredChildren.length === 0 ? (
          <View style={styles.emptyState}>
            <CreditCard size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {filter === 'paid' ? 'No hay niños que hayan pagado' : 
               filter === 'unpaid' ? 'Todos los niños han pagado' :
               'No hay niños registrados'}
            </Text>
          </View>
        ) : (
          filteredChildren.map((child) => (
            <ChildPaymentCard key={child.id} child={child} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  header: { 
    padding: 20, 
    paddingTop: 60, 
    backgroundColor: '#10B981' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#FFFFFF', 
    marginBottom: 12 
  }, 
  statsContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
    borderRadius: 12, 
    padding: 16 
  },
  statItem: { 
    flex: 1, 
    alignItems: 'center' 
  },
  statNumber: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#FFFFFF' 
  }, 
  statLabel: { 
    fontSize: 12, 
    color: '#E0F7FA', 
    marginTop: 2, 
    textAlign: 'center' 
  },
  statDivider: { 
    width: 1, 
    height: 30, 
    backgroundColor: 'rgba(255, 255, 255, 0.3)', 
    marginHorizontal: 16 
  },
  filtersContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    backgroundColor: '#FFFFFF' 
  },
  filterButton: { 
    flex: 1, 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    marginHorizontal: 4, 
    borderRadius: 8, 
    backgroundColor: '#F3F4F6', 
    alignItems: 'center' 
  },
  filterButtonActive: { 
    backgroundColor: '#10B981'
  },
  filterButtonText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#6B7280' 
  },
  filterButtonTextActive: { 
    color: '#FFFFFF' 
  },
  content: { 
    flex: 1, 
    padding: 16 
  },
  childCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 10, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2 
  },
  cardContentRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  childInfo: { 
    flex: 1, 
    paddingRight: 10 
  },
  childName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    marginBottom: 4 
  },
  parentName: { 
    fontSize: 14, 
    color: '#6B7280', 
    fontStyle: 'italic' 
  },
  paymentButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 8, 
    minWidth: 120 
  },
  paymentButtonPaid: { 
    backgroundColor: '#10B981' 
  },
  paymentButtonUnpaid: { 
    backgroundColor: '#3B82F6' 
  },
  paymentButtonText: { 
    color: '#FFFFFF', 
    fontWeight: '600', 
    marginLeft: 6, 
    fontSize: 13 
  },
  paymentsSection: 
  { marginTop: 12, 
    paddingTop: 12, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB' 
  },
  paymentsTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151', 
    marginBottom: 8 
  },
  paymentItem: { 
    backgroundColor: '#F9FAFB', 
    padding: 8, 
    borderRadius: 6, 
    marginBottom: 6 
  },
  paymentInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  paymentAmount: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#10B981' 
  },
  paymentDate: { 
    fontSize: 12, 
    color: '#6B7280' 
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 40 },
  emptyText: { 
    fontSize: 16, 
    color: '#6B7280', 
    marginTop: 16, 
    textAlign: 'center' 
  },
});