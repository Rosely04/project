//Dashboard principal
// correr :npx.cmd expo start
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Para recargar al volver
import { getChildren, getWorkers, getClassrooms, getFinancialSummary } from '../../lib/storage';
import { Users, CreditCard, DollarSign, UserCheck, Droplets, School } from 'lucide-react-native';

interface Stats {
  totalChildren: number;
  childrenPaid: number;
  childrenUnpaid: number;
  childrenWithAseo: number;
  childrenWithoutAseo: number;
  totalRevenue: number;
  totalWorkers: number;
  totalSalaries: number; // Esto ahora es el gasto ACUMULADO calculado
  totalClassrooms: number;
  childrenWithoutClassroom: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalChildren: 0,
    childrenPaid: 0,
    childrenUnpaid: 0,
    childrenWithAseo: 0,
    childrenWithoutAseo: 0,
    totalRevenue: 0,
    totalWorkers: 0,
    totalSalaries: 0,
    totalClassrooms: 0,
    childrenWithoutClassroom: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // LOGICA NUEVA INYECTADA EN TU DISEÑO ANTIGUO
  const loadStats = async () => {
    try {
      const [children, workers, classrooms, finances] = await Promise.all([
        getChildren(),    // Valida fechas de 30 días automáticamente
        getWorkers(),
        getClassrooms(),
        getFinancialSummary(), // Trae la data financiera acumulada histórica
      ]);

      const childrenPaid = children.filter(child => child.has_paid).length;
      const childrenUnpaid = children.length - childrenPaid;
      const childrenWithAseo = children.filter(child => child.has_aseo).length;
      const childrenWithoutAseo = children.length - childrenWithAseo;
      const childrenWithoutClassroom = children.filter(child => !child.classroom_id).length;

      setStats({
        totalChildren: children.length,
        childrenPaid,
        childrenUnpaid,
        childrenWithAseo,
        childrenWithoutAseo,
        totalRevenue: finances.totalRevenue,          // USAMOS LA LOGICA FINANCIERA NUEVA
        totalWorkers: workers.length,
        totalSalaries: finances.totalSalariesExpenses, // USAMOS LA LOGICA FINANCIERA NUEVA
        totalClassrooms: classrooms.length,
        childrenWithoutClassroom,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // Se ejecuta al entrar a la pantalla para actualizar datos inmediatamente
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const StatCard = ({ icon, title, value, color = '#3B82F6' }: { icon: React.ReactNode; title: string; value: string | number; color?: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIcon}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  );

  // Cálculo del Balance Neto para mostrar en colores
  const balance = stats.totalRevenue - stats.totalSalaries;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen del Círculo Infantil</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatCard
          icon={<Users size={24} color="#3B82F6" />}
          title="Total de Niños"
          value={stats.totalChildren}
          color="#3B82F6"
        />
        
        <StatCard
          icon={<UserCheck size={24} color="#10B981" />}
          title="Niños que Pagaron (Mes)"
          value={stats.childrenPaid}
          color="#10B981"
        />
        
        <StatCard
          icon={<Users size={24} color="#EF4444" />}
          title="Niños sin Pagar"
          value={stats.childrenUnpaid}
          color="#EF4444"
        />
        
        <StatCard
          icon={<Droplets size={24} color="#06B6D4" />}
          title="Niños con Aseo"
          value={stats.childrenWithAseo}
          color="#06B6D4"
        />
        
        <StatCard
          icon={<Droplets size={24} color="#F59E0B" />}
          title="Niños sin Aseo"
          value={stats.childrenWithoutAseo}
          color="#F59E0B"
        />
        
        {/* FINANZAS ACUMULADAS */}
        <StatCard
          icon={<DollarSign size={24} color="#10B981" />}
          title="Total Recaudado (Histórico)"
          value={`$${stats.totalRevenue.toLocaleString()}`}
          color="#10B981"
        />
        
        <StatCard
          icon={<DollarSign size={24} color="#F59E0B" />}
          title="Total Gastos Salarios (Histórico)"
          value={`$${stats.totalSalaries.toLocaleString()}`}
          color="#F59E0B"
        />

        <StatCard
          icon={<CreditCard size={24} color="#3B82F6" />}
          title="Trabajadores Activos"
          value={stats.totalWorkers}
          color="#3B82F6"
        />

        <StatCard
          icon={<School size={24} color="#8B5CF6" />}
          title="Total de Aulas"
          value={stats.totalClassrooms}
          color="#8B5CF6"
        />

        <StatCard
          icon={<Users size={24} color="#EF4444" />}
          title="Niños sin Aula"
          value={stats.childrenWithoutClassroom}
          color="#EF4444"
        />
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Resumen Financiero Global</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Ingresos:</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              +${stats.totalRevenue.toLocaleString()}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gastos (Salarios):</Text>
            <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
              -${stats.totalSalaries.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Balance:</Text>
            <Text style={[styles.summaryTotalValue, { 
              color: balance >= 0 ? '#10B981' : '#EF4444' 
            }]}>
              ${balance.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// TU ESTILO ORIGINAL INTACTO
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#3B82F6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#E0E7FF',
  },
  statsContainer: {
    padding: 16,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    marginRight: 16,
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  summary: {
    padding: 16,
    paddingTop: 0,
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});