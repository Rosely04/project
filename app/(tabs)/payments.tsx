//Gestión de pagos 

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { getChildren, getPayments, savePayment, updateChildPaymentStatus } from '../../lib/storage';
import { Child, Payment } from '../../types';
import { DollarSign, CreditCard } from 'lucide-react-native';

type PaymentFilter = 'all' | 'paid' | 'unpaid';

export default function PaymentsScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<PaymentFilter>('all');
  const [standardPayment, setStandardPayment] = useState(2500); // Pago estándar de $2500

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterChildren();
  }, [children, filter]);

  const loadData = async () => {
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
      case 'paid':
        filtered = filtered.filter(child => child.has_paid);
        break;
      case 'unpaid':
        filtered = filtered.filter(child => !child.has_paid);
        break;
      default:
        break;
    }
    
    setFilteredChildren(filtered);
  };

  const handlePayment = async (child: Child) => {
    if (!child.has_paid) {
      // Si NO ha pagado, registrar pago estándar
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
    } else {
      // Si YA pagó, solo cambiar estado (para deshacer)
      await updateChildPaymentStatus(child.id, false);
    }
    await loadData();
  };

  const getCurrentMonthRevenue = () => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  return payments.reduce((sum, payment) => {
    const paymentDate = new Date(payment.payment_date);
    if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
      return sum + payment.amount;
    }
    return sum;
  }, 0);
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
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const childPayments = payments.filter(p => p.child_id === child.id);
  const currentMonthPayments = childPayments.filter(payment => {
    const paymentDate = new Date(payment.payment_date);
    return paymentDate.getMonth() === currentMonth &&  paymentDate.getFullYear() === currentYear;
  });
  const totalPaid = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    return (
      <View style={styles.childCard}>
        <View style={styles.childHeader}>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childParent}>{child.parent_name}</Text>
          </View>
          <View style={styles.paymentStatusBadge}>
            <Text style={[
              styles.statusText,
              { color: child.has_paid ? '#10B981' : '#EF4444' }
            ]}>
              {child.has_paid ? 'Pagado' : 'Pendiente'}
            </Text>
          </View>
        </View>

        {childPayments.length > 0 && (
          <View style={styles.paymentsSection}>
            <Text style={styles.paymentsTitle}>Últimos pagos:</Text>
            {childPayments.slice(-3).map((payment) => ( // Solo últimos 3 pagos
              <View key={payment.id} style={styles.paymentItem}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentAmount}>${payment.amount}</Text>
                  <Text style={styles.paymentDate}>{payment.payment_date}</Text>
                </View>
              </View>
            ))}
            <Text style={styles.totalPaid}>Total mes actual: ${totalPaid}</Text>
          </View>
        )}

        {/* SOLO UN BOTÓN COMO EN ASEO */}
        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[
              styles.paymentButton,
              { backgroundColor: child.has_paid ? '#EF4444' : '#10B981' }
            ]}
            onPress={() => handlePayment(child)}
          >
            <Text style={styles.paymentButtonText}>
              {child.has_paid ? 'Marcar sin pagar' : `Marcar como pagado ($${standardPayment})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Pagos</Text>
        <View style={styles.totalRevenue}>
  <DollarSign size={20} color="#FFFFFF" />
  <Text style={styles.totalRevenueText}>${getCurrentMonthRevenue().toLocaleString()}</Text>
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
              {filter === 'paid' ? 'No hay niños que hayan pagado' : filter === 'unpaid' ? 'Todos los niños han pagado' :'No hay niños registrados'}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#10B981',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalRevenue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  totalRevenueText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  childHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  childParent: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paymentsSection: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  paymentItem: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
  paymentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  totalPaid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'right',
    marginTop: 4,
  },
  cardActions: {
    marginTop: 12,
  },
  paymentButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  paymentButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
});