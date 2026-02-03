import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getClassrooms, saveClassroom, deleteClassroom, getWorkers, getChildren, updateChildClassroom } from '../../lib/storage';
import { Classroom, Worker, Child } from '../types';

export const useClassrooms = () => {
  // --- ESTADOS ---
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  
  // Estados de UI (Modales y Dropdowns)
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [teacherDropdownVisible, setTeacherDropdownVisible] = useState(false);
  
  // Estados de Selección y Edición
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  
  // Estado del Formulario
  const [formData, setFormData] = useState({
    name: '',
    teacher_id: '',
    max_capacity: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // --- EFECTOS ---
  useEffect(() => {
    loadData();
  }, []);

  // --- LOGICA DE DATOS ---
  const loadData = async () => {
    const [classroomsData, workersData, childrenData] = await Promise.all([
      getClassrooms(),
      getWorkers(),
      getChildren(),
    ]);
    setClassrooms(classroomsData);
    setWorkers(workersData);
    setChildren(childrenData);
  };

  const getChildrenInClassroom = (classroomId: string) => {
    return children.filter(c => c.classroom_id === classroomId);
  };

  // --- LOGICA DE FORMULARIO Y MODALES ---
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
      setFormData({
        name: classroom.name,
        teacher_id: classroom.teacher_id,
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

  // --- VALIDACIONES (Intactas) ---
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre del aula es obligatorio';
    } else if (!/^[A-Za-z0-9ÁáÉéÍíÓóÚúÑñ\s]+$/.test(formData.name)) {
      newErrors.name = 'El nombre solo puede contener letras y números';
    }

    if (!formData.max_capacity.trim()) {
      newErrors.max_capacity = 'Capacidad máxima es obligatoria';
    } else if (!/^\d+$/.test(formData.max_capacity)) {
      newErrors.max_capacity = 'Solo puede contener números';
    } else {
      const capacity = parseInt(formData.max_capacity);
      if (capacity < 1) {
        newErrors.max_capacity = 'La capacidad debe ser mayor a 0';
      } else if (capacity > 15) {
        newErrors.max_capacity = 'La capacidad máxima es 15 niños';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- ACCIONES (Guardar, Borrar, Remover niño) ---
  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    const capacity = parseInt(formData.max_capacity);
    if (capacity < 1 || capacity > 15) {
      Alert.alert('Error', 'La capacidad debe estar entre 1 y 15 niños');
      return;
    }

    let teacherName = '';
    if (formData.teacher_id && formData.teacher_id.trim() !== '') {
      const selectedTeacher = workers.find(w => w.id === formData.teacher_id);
      teacherName = selectedTeacher ? selectedTeacher.name : '';
    }

    const classroomData: Classroom = {
      id: editingClassroom?.id || Date.now().toString(),
      name: formData.name.trim(),
      teacher_id: formData.teacher_id || '',
      teacher_name: teacherName,
      max_capacity: parseInt(formData.max_capacity),
      created_at: editingClassroom?.created_at || new Date().toISOString(),
    };

    await saveClassroom(classroomData);
    await loadData();
    closeModal();
  };

  const handleDelete = (classroom: Classroom) => {
    const childrenInClassroom = children.filter(c => c.classroom_id === classroom.id).length;

    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar el aula "${classroom.name}"?${childrenInClassroom > 0 ? `\n\nEsto removerá ${childrenInClassroom} niño(s) del aula.` : ''}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteClassroom(classroom.id);
            await loadData();
          }
        },
      ]
    );
  };

  const handleRemoveChildFromClassroom = async (childId: string) => {
    await updateChildClassroom(childId, undefined);
    await loadData();
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