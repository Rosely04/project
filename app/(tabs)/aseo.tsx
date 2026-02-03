//Gestion de aseo

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { getChildren, updateChildAseoStatus } from '../../lib/storage';
import { Child } from '../../src/types';
import { Droplets, Check } from 'lucide-react-native';

type AseoFilter = 'all' | 'with_aseo' | 'without_aseo';

export default function AseoScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<AseoFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    filterChildren();
  }, [children, filter]);

  const loadChildren = async () => {
    // Al cargar, storage.ts revisará automáticamente las fechas y reseteará si pasaron 30 días
    const data = await getChildren();
    setChildren(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  const filterChildren = () => {
    let filtered = children;
    switch (filter) {
      case 'with_aseo':
        filtered = filtered.filter(child => child.has_aseo);
        break;
      case 'without_aseo':
        filtered = filtered.filter(child => !child.has_aseo);
        break;
      default:
        break;
    }
    setFilteredChildren(filtered);
  };

  const handleAseoAction = async (child: Child) => {
    if (!child.has_aseo) {
      // LOGICA CORREGIDA: Intentamos guardar, si storage dice "no" (porque no pasaron 30 dias), mostramos error
      try {
        await updateChildAseoStatus(child.id, true);
        await loadChildren();
      } catch (error: any) {
        Alert.alert(
          'No permitido',
          error.message, // "Ya se registró el aseo en los últimos 30 días"
          [{ text: 'Entendido' }]
        );
      }
    } else {
      Alert.alert(
        'Aseo ya asignado',
        `El aseo de ${child.name} ya está asignado y no se puede modificar hasta el próximo mes.`,
        [{ text: 'Entendido' }]
      );
    }
  };

  const getAseoStats = () => {
    const withAseo = children.filter(child => child.has_aseo).length;
    const withoutAseo = children.length - withAseo;
    return { withAseo, withoutAseo, total: children.length };
  };

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

  const ChildAseoCard = ({ child }: { child: Child }) => (
    <View style={styles.childCard}>
      <View style={styles.cardContentRow}>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.parentName}>Padre: {child.parent_name}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.aseoButton,
            child.has_aseo ? styles.aseoButtonAssigned : styles.aseoButtonUnassigned
          ]}
          onPress={() => handleAseoAction(child)}
        >
          {child.has_aseo ? (
            <><Check size={20} color="#FFFFFF" /><Text style={styles.aseoButtonText}>OK</Text></>
          ) : (
            <><Droplets size={20} color="#FFFFFF" /><Text style={styles.aseoButtonText}>Asignar</Text></>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const stats = getAseoStats();

  return (
    <View style={styles.container}>
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

      <View style={styles.filtersContainer}>
        <FilterButton filterType="all" label="Todos" />
        <FilterButton filterType="with_aseo" label="Con aseo" />
        <FilterButton filterType="without_aseo" label="Sin aseo" />
      </View>

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
            <ChildAseoCard key={child.id} child={child} />
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
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
    paddingRight: 10,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  parentName: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  aseoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  aseoButtonAssigned: {
    backgroundColor: '#10B981', // Verde para "OK"
  },
  aseoButtonUnassigned: {
    backgroundColor: '#06B6D4', // Azul para "Asignar"
  },
  aseoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
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