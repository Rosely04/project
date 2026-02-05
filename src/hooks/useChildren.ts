import { useState, useEffect, useCallback } from 'react'; // <--- Agrega useCallback
import { Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // <--- Importante
import { getChildren, saveChild, deleteChild, getClassrooms } from '../../lib/storage';
import { Child, Classroom } from '../types';
import { WorkerCard } from '../components/workers/WorkerCard';

export const useChildren = () => {
  // --- ESTADOS ---
  const [children, setChildren] = useState<Child[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    parent_name: '',
    parent_phone: '+53',
    address: '',
    classroom_id: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // --- LÓGICA DE CARGA ---
  const loadChildren = async () => {
    try {
      const [childrenData, classroomsData] = await Promise.all([
        getChildren(),
        getClassrooms(),
      ]);
      setChildren(childrenData);
      setClassrooms(classroomsData);
    } catch (error) {
      console.error("Error cargando datos de niños:", error);
    }
  };

  // --- EFECTOS ---
  
  // CAMBIO PRINCIPAL: Usamos useFocusEffect
  // Esto garantiza que si agregaste un Aula nueva en otra pantalla, 
  // aparezca aquí al regresar.
  useFocusEffect(
    useCallback(() => {
      loadChildren();
    }, [])
  );

  // Este se mantiene igual (filtro local)
  useEffect(() => {
    filterChildren();
  }, [children, searchQuery]);

  // --- LÓGICA DE NEGOCIO ---
  const getChildrenInClassroom = (classroomId: string) => {
    return children.filter(c => c.classroom_id === classroomId).length;
  };

  const filterChildren = () => {
    let filtered = children;
    if (searchQuery) {
      filtered = filtered.filter(child =>
        child.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        child.parent_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredChildren(filtered);
  };

  // --- LÓGICA DEL FORMULARIO Y MODAL ---
  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      parent_name: '',
      parent_phone: '+53',
      address: '',
      classroom_id: '',
    });
    setEditingChild(null);
    setErrors({});
  };

  const openModal = (child?: Child) => {
    if (child) {
      setEditingChild(child);
      setFormData({
        name: child.name,
        age: child.age.toString(),
        parent_name: child.parent_name,
        parent_phone: child.parent_phone,
        address: child.address,
        classroom_id: child.classroom_id || '',
      });
    } else {
      resetForm();
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  // --- VALIDACIONES ---
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre obligatorio';
    } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(formData.name)) {
      newErrors.name = 'El nombre solo puede contener letras';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Edad obligatoria';
    } else if (!/^[1-5]$/.test(formData.age)) {
      newErrors.age = 'La edad debe ser un número entre 1 y 5 años';
    }

    if (!formData.parent_name.trim()) {
      newErrors.parent_name = 'Nombre del padre/madre obligatorio';
    } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(formData.parent_name)) {
      newErrors.parent_name = 'El nombre solo puede contener letras';
    }

    if (!formData.parent_phone.trim()) {
      newErrors.parent_phone = 'El teléfono es obligatorio';
    } else if (!/^\+53\d{8}$/.test(formData.parent_phone)) {
      newErrors.parent_phone = 'Formato: +53xxxxxxxx (8 números)';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es obligatoria';
    }

    // Validación de Capacidad de Aula
    if (formData.classroom_id) {
      const selectedClassroom = classrooms.find(c => c.id === formData.classroom_id);
      if (selectedClassroom) {
        const currentChildren = getChildrenInClassroom(selectedClassroom.id);
        // Si estamos editando y el niño YA estaba en esta aula, no contamos su propio cupo como "nuevo"
        const childrenInThisClassroomExcludingCurrent = editingChild && editingChild.classroom_id === selectedClassroom.id 
          ? currentChildren - 1 
          : currentChildren;
        
        if (childrenInThisClassroomExcludingCurrent >= selectedClassroom.max_capacity) {
          newErrors.classroom_id = 'Esta aula ya ha alcanzado su capacidad máxima';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- ACCIONES ---
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }
    
    // Doble chequeo de capacidad al guardar
    if (formData.classroom_id) {
      const selectedClassroom = classrooms.find(c => c.id === formData.classroom_id);
      if (selectedClassroom) {
        const currentChildren = getChildrenInClassroom(selectedClassroom.id);
        const childrenInThisClassroomExcludingCurrent = editingChild && editingChild.classroom_id === selectedClassroom.id 
          ? currentChildren - 1 
          : currentChildren;
        
        if (childrenInThisClassroomExcludingCurrent >= selectedClassroom.max_capacity) {
          Alert.alert('Error', 'Esta aula ya ha alcanzado su capacidad máxima.');
          return;
        }
      }
    }

    const childData: Child = {
      id: editingChild?.id || Date.now().toString(),
      name: formData.name.trim(),
      age: parseInt(formData.age),
      parent_name: formData.parent_name.trim(),
      parent_phone: formData.parent_phone.trim(),
      address: formData.address.trim(),
      classroom_id: formData.classroom_id || undefined,
      has_paid: editingChild?.has_paid || false,
      has_aseo: editingChild?.has_aseo || false,
      created_at: editingChild?.created_at || new Date().toISOString(),
    };

  try {
      await saveChild(childData); 
      await loadChildren(); 
      closeModal();         
      
    } catch (error: any) {
      Alert.alert('Atención', error.message);
    }
  }; 

  const handleDelete = (child: Child) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar a ${child.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deleteChild(child.id);
            await loadChildren(); // Recargamos lista local
          }
        },
      ]
    );
  };

  const openWhatsApp = (child: Child) => {
    if (!child.parent_phone || child.parent_phone === '+53') {
      Alert.alert('Error', 'Número de teléfono no válido');
      return;
    }
    const phoneNumber = child.parent_phone.replace(/\s+/g, '').replace('+', '');
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    
    Alert.alert(
      'Enviar WhatsApp',
      `¿Deseas enviar un mensaje a ${child.parent_name} (${child.parent_phone})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir WhatsApp',
          onPress: () => {
            Linking.canOpenURL(whatsappUrl).then(supported => {
              if (supported) return Linking.openURL(whatsappUrl);
              else return Linking.openURL(`https://wa.me/${phoneNumber}`);
            }).catch(err => {
              Alert.alert('Error', 'No se pudo abrir WhatsApp.');
            });
          }
        }
      ]
    );
  };

  return {
    children,
    classrooms,
    filteredChildren,
    searchQuery,
    setSearchQuery,
    modalVisible,
    editingChild,
    formData,
    setFormData,
    errors,
    setErrors,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    openWhatsApp,
    getChildrenInClassroom,
  };
};