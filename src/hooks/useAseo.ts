import { useState, useEffect, useCallback } from 'react'; // <--- Agrega useCallback
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // <--- Agrega este import
import { getChildren, updateChildAseoStatus } from '../../lib/storage';
import { Child } from '../types';

export type AseoFilter = 'all' | 'with_aseo' | 'without_aseo';

export const useAseo = () => {
  // --- ESTADOS ---
  const [children, setChildren] = useState<Child[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [filter, setFilter] = useState<AseoFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  // --- LÓGICA DE CARGA ---
  const loadChildren = async () => {
    try {
      const data = await getChildren();
      setChildren(data);
    } catch (error) {
      console.error("Error cargando niños en aseo:", error);
    }
  };

  // --- EFECTOS ---
  
  // CAMBIO PRINCIPAL: Usamos useFocusEffect en lugar de useEffect
  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  // Este se mantiene igual (filtrar cuando cambia la data)
  useEffect(() => {
    filterChildren();
  }, [children, filter]);

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

  // --- ACCIONES ---
  const handleAseoAction = async (child: Child) => {
    if (!child.has_aseo) {
      try {
        await updateChildAseoStatus(child.id, true);
        await loadChildren(); // Recarga después de actualizar
      } catch (error: any) {
        Alert.alert('No permitido', error.message, [{ text: 'Entendido' }]);
      }
    } else {
      Alert.alert(
        'Aseo ya asignado',
        `El aseo de ${child.name} ya está asignado.`,
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