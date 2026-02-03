import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Droplets } from 'lucide-react-native';
import { useAseo, AseoFilter } from '../../src/hooks/useAseo';
import { ChildAseoCard } from '../../src/components/aseo/ChildAseoCard';

export default function AseoScreen() {
  // Instanciamos el ViewModel
  const {
    filteredChildren,
    filter,
    setFilter,
    refreshing,
    onRefresh,
    handleAseoAction,
    stats
  } = useAseo();

  // Componente interno pequeño para los botones de filtro
  const FilterButton = ({ filterType, label }: { filterType: AseoFilter; label: string }) => (
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
      {/* HEADER con Estadísticas */}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Aseo</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.withAseo}</Text>
            <Text style={styles.statLabel}>Con aseo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.withoutAseo}</Text>
            <Text style={styles.statLabel}>Sin aseo</Text>
          </View>
        </View>
      </View>

      {/* FILTROS */}
      <View style={styles.filtersContainer}>
        <FilterButton filterType="all" label="Todos" />
        <FilterButton filterType="with_aseo" label="Con aseo" />
        <FilterButton filterType="without_aseo" label="Sin aseo" />
      </View>

      {/* LISTA */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredChildren.length === 0 ? (
          <View style={styles.emptyState}>
            <Droplets size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {filter === 'with_aseo' ? 'No hay niños con aseo registrado' :
              filter === 'without_aseo' ? 'Todos los niños tienen aseo' :
              'No hay niños registrados'}
            </Text>
          </View>
        ) : (
          filteredChildren.map((child) => (
            <ChildAseoCard 
              key={child.id} 
              child={child} 
              onAction={handleAseoAction} 
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Estilos de la pantalla (layout, header, filtros, empty state)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#06B6D4',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#E0F7FA',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 16,
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
    backgroundColor: '#06B6D4',
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