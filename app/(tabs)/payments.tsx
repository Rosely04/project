import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { CreditCard } from 'lucide-react-native';
import { usePayments, PaymentFilter } from '../../src/hooks/usePayments';
import { ChildPaymentCard } from '../../src/components/payments/ChildPaymentCard';

export default function PaymentsScreen() {
  const {
    payments,
    filteredChildren,
    filter,
    setFilter,
    standardPayment,
    handlePayment,
    stats,
    potentialRevenue
  } = usePayments();

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

  return (
    <View style={styles.container}>
      {/* HEADER */}
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

      {/* FILTROS */}
      <View style={styles.filtersContainer}>
        <FilterButton filterType="all" label="Todos" />
        <FilterButton filterType="paid" label="Pagaron" />
        <FilterButton filterType="unpaid" label="Sin pagar" />
      </View>

      {/* LISTA */}
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
            <ChildPaymentCard 
              key={child.id} 
              child={child} 
              allPayments={payments}
              standardPayment={standardPayment}
              onPayment={handlePayment}
            />
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