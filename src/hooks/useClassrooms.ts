import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
// 1. IMPORTAR useFocusEffect de React Navigation
import { useFocusEffect } from '@react-navigation/native';
import { getClassrooms, saveClassroom, deleteClassroom, getWorkers, getChildren, updateChildClassroom } from '../../lib/storage';
import { Classroom, Worker, Child } from '../types';

export const useClassrooms = () => {
  // --- ESTADOS ---
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  
  // Estados de UI
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [teacherDropdownVisible, setTeacherDropdownVisible] = useState(false);
  
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    teacher_id: '',
    max_capacity: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // --- LOGICA DE DATOS (Estable con useCallback) ---
  const loadData = useCallback(async () => {
    try {
      const [classroomsData, workersData, childrenData] = await Promise.all([
        getClassrooms(),
        getWorkers(),
        getChildren(),
      ]);
      setClassrooms(classroomsData);
      setWorkers(workersData);
      setChildren(childrenData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  }, []);

  // --- SOLUCION AL REFRESCO: useFocusEffect ---
  // Esto hace que se recargue CADA VEZ que la pantalla aparece
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const getChildrenInClassroom = (classroomId: string) => {
    return children.filter(c => c.classroom_id === classroomId);
  };

  // --- FORMULARIOS ---
  const resetForm = () => {
    setFormData({
      name: '',
      teacher_id: '',
      max_capacity: '',
    });
    setEditingClassroom(null);
  };

  const openModal = (classroom?: Classroom) => {
    if (classroom) {
      setEditingClassroom(classroom);
      // Al abrir, nos aseguramos de traer el teacher_id aunque sea null
      setFormData({
        name: classroom.name,
        teacher_id: classroom.teacher_id || '', // Convertimos null a '' para el input visual
        max_capacity: classroom.max_capacity.toString(),
      });
    } else {
      resetForm();
    }
    setTeacherDropdownVisible(false);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setTeacherDropdownVisible(false);
    resetForm();
    setErrors({});
  };

  const openDetailModal = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setDetailModalVisible(true);
  };

  const closeDetailModal = () => {
    setDetailModalVisible(false);
    setSelectedClassroom(null);
  };

  // --- VALIDACIONES ---
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.name.trim()) newErrors.name = 'Nombre requerido';
    
    // Validación de número
    if (!formData.max_capacity.trim()) {
      newErrors.max_capacity = 'Capacidad requerida';
    } else {
      const cap = parseInt(formData.max_capacity);
      if (isNaN(cap) || cap < 1 || cap > 20) newErrors.max_capacity = 'Debe ser entre 1 y 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- SOLUCION AL FOREIGN KEY CONSTRAINT FAILED ---
  const handleSave = async () => {
    if (!validateForm()) return;

    // 1. Obtenemos el Teacher (Objeto completo)
    let teacherName = '';
    // Corrección importante: Si el string está vacío, es NULL (no existe profesor).
    // Si dejamos un string vacío "", SQLite busca un profesor con ID "" y crashea.
    const cleanTeacherId = formData.teacher_id.trim() === '' ? null : formData.teacher_id;

    if (cleanTeacherId) {
      const selectedTeacher = workers.find(w => w.id === cleanTeacherId);
      teacherName = selectedTeacher ? selectedTeacher.name : '';
    }

    const classroomData: Classroom = {
      id: editingClassroom?.id || Date.now().toString(),
      name: formData.name.trim(),
      // Aquí usamos cleanTeacherId (que es ID válido o null)
      // Usamos "as any" o "string" según tu definición de tipos para evitar que TS se queje si Classroom espera string estricto.
      teacher_id: cleanTeacherId as string, 
      teacher_name: teacherName,
      max_capacity: parseInt(formData.max_capacity),
      created_at: editingClassroom?.created_at || new Date().toISOString(),
    };

    try {
      await saveClassroom(classroomData);
      
      // Actualización optimista o recarga
      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error guardando aula:", error);
      Alert.alert('Error al guardar', 'Verifica que el nombre no esté repetido o intente nuevamente.');
    }
  };

  const handleDelete = (classroom: Classroom) => {
    Alert.alert(
      'Eliminar Aula',
      `¿Borrar "${classroom.name}"? Los niños quedarán sin aula asignada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClassroom(classroom.id);
              loadData();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar');
            }
          }
        },
      ]
    );
  };

  const handleRemoveChildFromClassroom = async (childId: string) => {
    try {
      await updateChildClassroom(childId, undefined);
      loadData();
    } catch (e) { console.error(e); }
  };

  return {
    classrooms,
    workers,
    modalVisible,
    detailModalVisible,
    teacherDropdownVisible,
    setTeacherDropdownVisible,
    editingClassroom,
    selectedClassroom,
    formData,
    setFormData,
    errors,
    setErrors,
    openModal,
    closeModal,
    openDetailModal,
    closeDetailModal,
    handleSave,
    handleDelete,
    handleRemoveChildFromClassroom,
    getChildrenInClassroom
  };
};