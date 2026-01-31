//gestión de aseo

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { getChildren, updateChildAseoStatus } from '../../lib/storage';
import { Child } from '../../types';
import { Droplets, User, Phone, MapPin, ListFilter as Filter } from 'lucide-react-native';

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

  const toggleAseoStatus = async (child: Child) => {
    const newStatus = !child.has_aseo;
    await updateChildAseoStatus(child.id, newStatus);
    await loadChildren();
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
      <View style={styles.childHeader}>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childAge}>{child.age} años</Text>
        </View>
        <View style={styles.aseoStatusBadge}>
          <Droplets 
            size={16} 
            color={child.has_aseo ? '#06B6D4' : '#F59E0B'} 
          />
          <Text style={[
            styles.statusText,
            { color: child.has_aseo ? '#06B6D4' : '#F59E0B' }
          ]}>
            {child.has_aseo ? 'Con aseo' : 'Sin aseo'}
          </Text>
        </View>
      </View>
      
      <View style={styles.childDetails}>
        <View style={styles.detailRow}>
          <User size={16} color="#6B7280" />
          <Text style={styles.detailText}>{child.parent_name}</Text>
        </View>
        <View style={styles.detailRow}>
          <Phone size={16} color="#6B7280" />
          <Text style={styles.detailText}>{child.parent_phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText}>{child.address}</Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity 
          style={[
            styles.aseoButton,
            { backgroundColor: child.has_aseo ? '#F59E0B' : '#06B6D4' }
          ]}
          onPress={() => toggleAseoStatus(child)}
        >
          <Droplets size={16} color="#FFFFFF" />
          <Text style={styles.aseoButtonText}>
            {child.has_aseo ? 'Marcar sin aseo' : 'Marcar con aseo'}
          </Text>
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
  childAge: {
    fontSize: 14,
    color: '#6B7280',
  },
  aseoStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  childDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  cardActions: {
    marginTop: 12,
  },
  aseoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  aseoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
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