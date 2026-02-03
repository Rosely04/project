import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getChildren, updateChildAseoStatus } from '../../lib/storage';
import { Child } from '../types';

export type AseoFilter = 'all' | 'with_aseo' | 'without_aseo';

export const useAseo = () => {
  // --- ESTADOS ---
  const [children, setChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<AseoFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    filterChildren();
  }, [children, filter]);

  // --- LÓGICA DE CARGA ---
  const loadChildren = async () => {
    // Al cargar, storage.ts revisará automáticamente las fechas
    const data = await getChildren();
    setChildren(data);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
    setRefreshing(false);
  };

  // --- LÓGICA DE FILTRADO ---
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

  // --- ACCIONES (Validaciones y Base de Datos) ---
  const handleAseoAction = async (child: Child) => {
    if (!child.has_aseo) {
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

  // --- CÁLCULOS ---
  const stats = {
    withAseo: children.filter(child => child.has_aseo).length,
    withoutAseo: children.filter(child => !child.has_aseo).length,
    total: children.length
  };

  return {
    children,
    filteredChildren,
    filter,
    setFilter,
    refreshing,
    onRefresh,
    handleAseoAction,
    stats
  };
};