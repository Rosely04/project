//Gestion de aulas 

//Gestion de aulas 

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { getClassrooms, saveClassroom, deleteClassroom, getWorkers, getChildren, updateChildClassroom } from '../../lib/storage';
import { Classroom, Worker, Child } from '../../types';
import { Plus, Pencil, Trash2, Users, School, GraduationCap } from 'lucide-react-native';

export default function ClassroomsScreen() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
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

  useEffect(() => {
    loadData();
  }, []);

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

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    // Validación adicional para asegurar que esté entre 1 y 15
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

  const getChildrenInClassroom = (classroomId: string) => {
    return children.filter(c => c.classroom_id === classroomId);
  };

  const ClassroomCard = ({ classroom }: { classroom: Classroom }) => {
    const childrenInClassroom = getChildrenInClassroom(classroom.id);
    const capacityPercentage = (childrenInClassroom.length / classroom.max_capacity) * 100;

    return (
      <TouchableOpacity
        style={styles.classroomCard}
        onPress={() => openDetailModal(classroom)}
      >
        <View style={styles.classroomHeader}>
          <View style={styles.classroomInfo}>
            <Text style={styles.classroomName}>{classroom.name}</Text>
            <View style={styles.teacherInfo}>
              <GraduationCap size={16} color="#8B5CF6" />
              <Text style={styles.teacherName}>
                {classroom.teacher_name || 'Sin maestra asignada'}
              </Text>
            </View>
          </View>
          <View style={styles.classroomActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                openModal(classroom);
              }}
            >
              <Pencil size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={(e) => {
                e.stopPropagation();
                handleDelete(classroom);
              }}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.capacityContainer}>
          <View style={styles.capacityInfo}>
            <Users size={16} color="#6B7280" />
            <Text style={styles.capacityText}>
              {childrenInClassroom.length} / {classroom.max_capacity} niños
            </Text>
          </View>
          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${Math.min(capacityPercentage, 100)}%`,
                  backgroundColor: 
                    capacityPercentage > 100 ? '#EF4444' :
                    capacityPercentage > 80 ? '#F59E0B' :
                    capacityPercentage > 50 ? '#10B981' :
                    '#3B82F6'
                }
              ]}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Gestión de Aulas</Text>
          <Text style={styles.subtitle}>{classrooms.length} Aulas Registradas</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {classrooms.length === 0 ? (
          <View style={styles.emptyState}>
            <School size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay aulas registradas</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar la primera aula</Text>
          </View>
        ) : (
          classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingClassroom ? 'Editar Aula' : 'Agregar Aula'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del Aula</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({...formData, name: text});
                  if (errors.name) setErrors({...errors, name: ''});
                }}
                placeholder="Ej: Aula 1, Preescolar A, etc."
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Maestra a Cargo</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setTeacherDropdownVisible(!teacherDropdownVisible)}
              >
                <View style={styles.dropdownButtonContent}>
                  <Text style={styles.dropdownButtonText}>
                    {formData.teacher_id
                      ? workers.find(w => w.id === formData.teacher_id)?.name || 'Seleccionar maestra'
                      : 'Seleccionar maestra'}
                  </Text>
                </View>
                <Text style={styles.dropdownArrow}>
                  {teacherDropdownVisible ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {teacherDropdownVisible && (
                <View style={styles.dropdownList}>
                  <ScrollView style={styles.teacherList}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownListItem,
                        !formData.teacher_id && styles.dropdownListItemSelected
                      ]}
                      onPress={() => {
                        setFormData({...formData, teacher_id: ''});
                        setTeacherDropdownVisible(false);
                      }}
                    >
                      <View style={styles.dropdownListItemContent}>
                        <Text style={[
                          styles.dropdownListItemPosition,
                          !formData.teacher_id && styles.dropdownListItemTextSelected
                        ]}>
                          Se asignará más tarde
                        </Text>
                      </View>
                      {!formData.teacher_id && (
                        <Text style={styles.dropdownCheckmark}>✓</Text>
                      )}
                    </TouchableOpacity>

                    {workers.map((worker) => (
                      <TouchableOpacity
                        key={worker.id}
                        style={[
                          styles.dropdownListItem,
                          formData.teacher_id === worker.id && styles.dropdownListItemSelected
                        ]}
                        onPress={() => {
                          setFormData({...formData, teacher_id: worker.id});
                          setTeacherDropdownVisible(false);
                        }}
                      >
                        <View style={styles.dropdownListItemContent}>
                          <Text style={[
                            styles.dropdownListItemName,
                            formData.teacher_id === worker.id && styles.dropdownListItemTextSelected
                          ]}>
                            {worker.name}
                          </Text>
                          <Text style={[
                            styles.dropdownListItemPosition,
                            formData.teacher_id === worker.id && styles.dropdownListItemTextSelected
                          ]}>
                            {worker.position}
                          </Text>
                        </View>
                        {formData.teacher_id === worker.id && (
                          <Text style={styles.dropdownCheckmark}>✓</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Capacidad Máxima</Text>
              <TextInput
                style={[styles.input, errors.max_capacity && styles.inputError]}
                value={formData.max_capacity}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  if (numericText) {
                    const num = parseInt(numericText);
                    if (num > 15) {
                      setFormData({...formData, max_capacity: '15'});
                    } else {
                      setFormData({...formData, max_capacity: numericText});
                    }
                  } else {
                    setFormData({...formData, max_capacity: numericText});
                  }
                  if (errors.max_capacity) setErrors({...errors, max_capacity: ''});
                }}
                placeholder="Entre 1 y 15 niños"
                keyboardType="numeric"
                maxLength={2}
              />
              {errors.max_capacity ? (
                <Text style={styles.errorText}>{errors.max_capacity}</Text>
              ) : (
                <Text style={styles.helperText}>Máximo 15 niños por aula</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeDetailModal}>
              <Text style={styles.cancelButton}>Cerrar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Detalles del Aula</Text>
            <View style={{ width: 60 }} />
          </View>

          {selectedClassroom && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Información del Aula</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailValue}>{selectedClassroom.name}</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Maestra a Cargo:</Text>
                  <Text style={styles.detailValue}>
                    {selectedClassroom.teacher_name || 'Sin maestra asignada'}
                  </Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Capacidad:</Text>
                  <Text style={styles.detailValue}>
                    {getChildrenInClassroom(selectedClassroom.id).length} / {selectedClassroom.max_capacity} niños
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Niños en el Aula ({getChildrenInClassroom(selectedClassroom.id).length})
                </Text>
                {getChildrenInClassroom(selectedClassroom.id).length === 0 ? (
                  <View style={styles.emptyChildrenState}>
                    <Users size={32} color="#D1D5DB" />
                    <Text style={styles.emptyChildrenText}>No hay niños en esta aula</Text>
                  </View>
                ) : (
                  getChildrenInClassroom(selectedClassroom.id).map((child) => (
                    <View key={child.id} style={styles.childInClassroomCard}>
                      <View style={styles.childInClassroomInfo}>
                        <Text style={styles.childInClassroomName}>{child.name}</Text>
                        <Text style={styles.childInClassroomAge}>{child.age} años</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => {
                          Alert.alert(
                            'Remover niño',
                            `¿Deseas remover a ${child.name} de esta aula?`,
                            [
                              { text: 'Cancelar', style: 'cancel' },
                              {
                                text: 'Remover',
                                style: 'destructive',
                                onPress: async () => {
                                  await handleRemoveChildFromClassroom(child.id);
                                  closeDetailModal();
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <Text style={styles.removeButtonText}>Remover</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#F59E0B',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FEF3C7',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
    marginLeft: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  classroomCard: {
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
  classroomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teacherName: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginLeft: 4,
  },
  classroomActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  capacityContainer: {
    marginTop: 8,
  },
  capacityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  capacityText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  capacityBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dropdownButtonContent: {
    flex: 1,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  dropdownArrow: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: '#FFFFFF',
    marginTop: -1,
    overflow: 'hidden',
    zIndex: 10,
  },
  teacherList: {
    maxHeight: 200,
  },
  dropdownListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownListItemSelected: {
    backgroundColor: '#FEF3C7',
  },
  dropdownListItemContent: {
    flex: 1,
  },
  dropdownListItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  dropdownListItemTextSelected: {
    color: '#F59E0B',
  },
  dropdownListItemPosition: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  dropdownCheckmark: {
    fontSize: 18,
    color: '#F59E0B',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  emptyChildrenState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyChildrenText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
  },
  childInClassroomCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  childInClassroomInfo: {
    flex: 1,
  },
  childInClassroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  childInClassroomAge: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  removeButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
});