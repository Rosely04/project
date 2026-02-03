//Gestion de niño

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Linking } from 'react-native';
import { getChildren, saveChild, deleteChild, getClassrooms } from '../../lib/storage';
import { Child, Classroom } from '../../src/types';
import { Plus, Pencil, Trash2, User, Phone, MapPin, Search, School, MessageCircleMore, AlertCircle } from 'lucide-react-native';

export default function ChildrenScreen() {
  const [children, setChildren] = useState<Child[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    classroom_id: '',
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadChildren();
  }, []);

  useEffect(() => {
    filterChildren();
  }, [children, searchQuery]);

  const loadChildren = async () => {
    const [childrenData, classroomsData] = await Promise.all([
      getChildren(),
      getClassrooms(),
    ]);
    setChildren(childrenData);
    setClassrooms(classroomsData);
  };

  // Función para obtener el número de niños en un aula
  const getChildrenInClassroom = (classroomId: string) => {
    return children.filter(c => c.classroom_id === classroomId).length;
  };

  // Función para verificar si un aula está llena
  const isClassroomFull = (classroom: Classroom) => {
    const currentChildren = getChildrenInClassroom(classroom.id);
    return currentChildren >= classroom.max_capacity;
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

  const resetForm = () => {
    setFormData({
      name: '',
      age: '',
      parent_name: '',
      parent_phone: '',
      address: '',
      classroom_id: '',
    });
    setEditingChild(null);
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
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nombre obligatorio';
    } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(formData.name)) {
      newErrors.name = 'El nombre solo puede contener letras';
    }

    if (!formData.age.trim()) {
      newErrors.age = 'Edad obligatoria';
    } else if (!/^[1-5]$/.test(formData.age)) { // CAMBIADO: Solo números 1-5
      newErrors.age = 'La edad debe ser un número entre 1 y 5 años'; // CAMBIADO
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

    // Validación para aula seleccionada
    if (formData.classroom_id) {
      const selectedClassroom = classrooms.find(c => c.id === formData.classroom_id);
      if (selectedClassroom) {
        const currentChildren = getChildrenInClassroom(selectedClassroom.id);
        
        // Si estamos editando un niño que ya está en esta aula, no contarlo
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

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }
    
    if (!formData.name.trim() || !formData.age.trim() || !formData.parent_name.trim() || !formData.parent_phone.trim() || !formData.address.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
      return;
    }

    // Validación final para asegurar que el aula no esté llena
    if (formData.classroom_id) {
      const selectedClassroom = classrooms.find(c => c.id === formData.classroom_id);
      if (selectedClassroom) {
        const currentChildren = getChildrenInClassroom(selectedClassroom.id);
        const childrenInThisClassroomExcludingCurrent = editingChild && editingChild.classroom_id === selectedClassroom.id 
          ? currentChildren - 1 
          : currentChildren;
        
        if (childrenInThisClassroomExcludingCurrent >= selectedClassroom.max_capacity) {
          Alert.alert('Error', 'Esta aula ya ha alcanzado su capacidad máxima. Por favor selecciona otra aula o déjalo sin aula asignada.');
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

    await saveChild(childData);
    await loadChildren();
    closeModal();
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
            await loadChildren();
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
              if (supported) {
                return Linking.openURL(whatsappUrl);
              } else {
                return Linking.openURL(`https://wa.me/${phoneNumber}`);
              }
            }).catch(err => {
              console.error('Error al abrir WhatsApp:', err);
              Alert.alert('Error', 'No se pudo abrir WhatsApp. Asegúrate de tener la app instalada.');
            });
          }
        }
      ]
    );
  };

  const ChildCard = ({ child }: { child: Child }) => {
    const classroom = classrooms.find(c => c.id === child.classroom_id);

    return (
      <View style={styles.childCard}>
        <View style={styles.childHeader}>
          <View style={styles.childInfo}>
            <Text style={styles.childName}>{child.name}</Text>
            <Text style={styles.childAge}>{child.age} años</Text>
          </View>
          <View style={styles.childActions}>
            {/* Botón de editar */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openModal(child)}
            >
              <Pencil size={18} color="#3B82F6" />
            </TouchableOpacity>
            
            {/* Botón de WhatsApp */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openWhatsApp(child)}
              disabled={!child.parent_phone || child.parent_phone === '+53'}
            >
              <MessageCircleMore size={18} color="#25D366" />
            </TouchableOpacity>
            
            {/* Botón de eliminar */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleDelete(child)}
            >
              <Trash2 size={18} color="#EF4444" />
            </TouchableOpacity>
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
          {classroom && (
            <View style={styles.detailRow}>
              <School size={16} color="#F59E0B" />
              <Text style={[styles.detailText, { color: '#F59E0B', fontWeight: '600' }]}>
                {classroom.name} ({getChildrenInClassroom(classroom.id)}/{classroom.max_capacity})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.paymentStatus}>
          <Text style={[
            styles.statusText,
            { color: child.has_paid ? '#10B981' : '#EF4444' }
          ]}>
            {child.has_paid ? 'Pagado' : 'Pendiente de pago'}
          </Text>
          <Text style={[
            styles.statusText,
            { color: child.has_aseo ? '#06B6D4' : '#F59E0B' }
          ]}>
            {child.has_aseo ? 'Con aseo' : 'Sin aseo'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Niños</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar niño o padre..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        {filteredChildren.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay niños registrados</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar el primer niño</Text>
          </View>
        ) : (
          filteredChildren.map((child) => (
            <ChildCard key={child.id} child={child} />
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
              {editingChild ? 'Editar Niño' : 'Agregar Niño'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del Niño</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}  
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({...formData, name: text});
                  if (errors.name) setErrors({...errors, name: ''}); 
                }}
                placeholder="Nombre y Apellidos "
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>} 
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={[styles.input, errors.age && styles.inputError]}
                value={formData.age}
                onChangeText={(text) => {
                  // Solo permite números 1-5
                  const numericText = text.replace(/[^1-5]/g, '');
                  // Limita a un solo dígito (1-5)
                  const limitedText = numericText.slice(0, 1);
                  setFormData({...formData, age: limitedText});
                  if (errors.age) setErrors({...errors, age: ''});
                }}
                placeholder="Edad en años (1-5)" // CAMBIADO
                keyboardType="numeric"
                maxLength={1}
              />
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del Padre/Madre</Text>
              <TextInput
                style={[styles.input, errors.parent_name && styles.inputError]}
                value={formData.parent_name}
                onChangeText={(text) => {
                  setFormData({...formData, parent_name: text});
                  if (errors.parent_name) setErrors({...errors, parent_name: ''});
                }}
                placeholder="Nombre del padre/madre"
              />
              {errors.parent_name && <Text style={styles.errorText}>{errors.parent_name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, errors.parent_phone && styles.inputError]}
                value={formData.parent_phone}
                onChangeText={(text) => {
                  let formattedText = text;
                  if (text) {
                    if (text.startsWith('+53')) {
                      const numbersOnly = text.slice(3).replace(/[^0-9]/g, '');
                      formattedText = '+53' + numbersOnly.slice(0, 8);
                    } else {
                      const numbersOnly = text.replace(/[^0-9]/g, '');
                      formattedText = '+53' + numbersOnly.slice(0, 8);
                    }
                  } else {
                    formattedText = '+53';
                  }
                  
                  setFormData({...formData, parent_phone: formattedText});
                  if (errors.parent_phone) setErrors({...errors, parent_phone: ''});
                }}
                placeholder="+53 xxxxxxxx"
                keyboardType="phone-pad"
                maxLength={11}
              />
              {errors.parent_phone && <Text style={styles.errorText}>{errors.parent_phone}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.address && styles.inputError]}
                value={formData.address}
                onChangeText={(text) => {
                  setFormData({...formData, address: text});
                  if (errors.address) setErrors({...errors, address: ''});
                }}
                placeholder="Dirección"
                multiline
                numberOfLines={3}
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Aula</Text>
              <View style={styles.pickerContainer}>
                {classrooms.length === 0 ? (
                  <Text style={styles.noClassroomsText}>No hay aulas registradas</Text>
                ) : (
                  <ScrollView style={styles.classroomList}>
                    <TouchableOpacity
                      style={[
                        styles.classroomOption,
                        formData.classroom_id === '' && styles.classroomOptionSelected
                      ]}
                      onPress={() => setFormData({...formData, classroom_id: ''})}
                    >
                      <Text style={[
                        styles.classroomOptionName,
                        formData.classroom_id === '' && styles.classroomOptionTextSelected
                      ]}>
                        Sin aula asignada
                      </Text>
                      {formData.classroom_id === '' && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                    {classrooms.map((classroom) => {
                      const currentChildren = getChildrenInClassroom(classroom.id);
                      const childrenExcludingCurrent = editingChild && editingChild.classroom_id === classroom.id 
                        ? currentChildren - 1 
                        : currentChildren;
                      const isFull = childrenExcludingCurrent >= classroom.max_capacity;
                      
                      return (
                        <TouchableOpacity
                          key={classroom.id}
                          style={[
                            styles.classroomOption,
                            formData.classroom_id === classroom.id && styles.classroomOptionSelected,
                            isFull && !(editingChild && editingChild.classroom_id === classroom.id) && styles.classroomOptionDisabled
                          ]}
                          onPress={() => {
                            if (isFull && !(editingChild && editingChild.classroom_id === classroom.id)) {
                              Alert.alert(
                                'Aula llena',
                                `El aula "${classroom.name}" ya ha alcanzado su capacidad máxima (${classroom.max_capacity} niños).\n\nActual: ${currentChildren}/${classroom.max_capacity} niños`
                              );
                              return;
                            }
                            setFormData({...formData, classroom_id: classroom.id});
                          }}
                          disabled={isFull && !(editingChild && editingChild.classroom_id === classroom.id)}
                        >
                          <View style={styles.classroomOptionInfo}>
                            <View style={styles.classroomHeaderRow}>
                              <Text style={[
                                styles.classroomOptionName,
                                formData.classroom_id === classroom.id && styles.classroomOptionTextSelected,
                                isFull && !(editingChild && editingChild.classroom_id === classroom.id) && styles.classroomOptionTextDisabled
                              ]}>
                                {classroom.name}
                              </Text>
                              {isFull && !(editingChild && editingChild.classroom_id === classroom.id) && (
                                <View style={styles.fullIndicator}>
                                  <AlertCircle size={14} color="#EF4444" />
                                  <Text style={styles.fullText}>LLENA</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[
                              styles.classroomOptionTeacher,
                              formData.classroom_id === classroom.id && styles.classroomOptionTextSelected,
                              isFull && !(editingChild && editingChild.classroom_id === classroom.id) && styles.classroomOptionTextDisabled
                            ]}>
                              {classroom.teacher_name || 'Sin maestra'}
                            </Text>
                            <Text style={[
                              styles.classroomCapacity,
                              isFull ? styles.classroomCapacityFull : styles.classroomCapacityAvailable
                            ]}>
                              {currentChildren}/{classroom.max_capacity} niños
                            </Text>
                          </View>
                          {formData.classroom_id === classroom.id && !isFull && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                          {isFull && editingChild && editingChild.classroom_id === classroom.id && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
              {errors.classroom_id && (
                <Text style={styles.errorText}>{errors.classroom_id}</Text>
              )}
            </View>
          </ScrollView>
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
    backgroundColor: '#3B82F6',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 12,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
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
  childActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
  paymentStatus: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
  },
  classroomList: {
    maxHeight: 200,
  },
  classroomOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  classroomOptionSelected: {
    backgroundColor: '#FEF3C7',
  },
  classroomOptionDisabled: {
    backgroundColor: '#F3F4F6',
  },
  classroomOptionInfo: {
    flex: 1,
  },
  classroomHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  classroomOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  classroomOptionTextSelected: {
    color: '#F59E0B',
  },
  classroomOptionTextDisabled: {
    color: '#9CA3AF',
  },
  classroomOptionTeacher: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  classroomCapacity: {
    fontSize: 12,
    fontWeight: '600',
  },
  classroomCapacityAvailable: {
    color: '#10B981',
  },
  classroomCapacityFull: {
    color: '#EF4444',
  },
  checkmark: {
    fontSize: 18,
    color: '#F59E0B',
    fontWeight: 'bold',
  },
  noClassroomsText: {
    padding: 16,
    textAlign: 'center',
    color: '#6B7280',
  },
  fullIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  fullText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
    marginLeft: 4,
  },
});