import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Plus, Users, School } from 'lucide-react-native';
import { useClassrooms } from '../../src/hooks/useClassrooms';
import { ClassroomCard } from '../../src/components/classrooms/ClassroomCard';

export default function ClassroomsScreen() {
  const {
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
  } = useClassrooms();

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Control de Salón</Text>
          <Text style={styles.subtitle}>{classrooms.length} Salones Registrados</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => openModal()}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {}
      <ScrollView style={styles.content}>
        {classrooms.length === 0 ? (
          <View style={styles.emptyState}>
            <School size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay salones registrados</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar el primer salón</Text>
          </View>
        ) : (
          classrooms.map((classroom) => (
            <ClassroomCard 
              key={classroom.id} 
              classroom={classroom}
              childrenInClassroom={getChildrenInClassroom(classroom.id)}
              onEdit={openModal}
              onDelete={handleDelete}
              onViewDetails={openDetailModal}
            />
          ))
        )}
      </ScrollView>

      {}
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
              {editingClassroom ? 'Editar Salón' : 'Agregar Salón'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del Salón</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({...formData, name: text});
                  if (errors.name) setErrors({...errors, name: ''});
                }}
                placeholder="Ej: Salón 1, Preescolar A, etc."
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Educadora a Cargo</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setTeacherDropdownVisible(!teacherDropdownVisible)}
              >
                <View style={styles.dropdownButtonContent}>
                  <Text style={styles.dropdownButtonText}>
                    {formData.teacher_id
                      ? workers.find(w => w.id === formData.teacher_id)?.name || 'Seleccionar educadora'
                      : 'Seleccionar educadora'}
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
                <Text style={styles.helperText}>Máximo 15 niños por salón</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {}
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
            <Text style={styles.modalTitle}>Detalles del Salón</Text>
            <View style={{ width: 60 }} />
          </View>

          {selectedClassroom && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Información del Salón</Text>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailValue}>{selectedClassroom.name}</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Educadora a Cargo:</Text>
                  <Text style={styles.detailValue}>
                    {selectedClassroom.teacher_name || 'Sin educadora asignada'}
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
                  Niños en el Salón ({getChildrenInClassroom(selectedClassroom.id).length})
                </Text>
                {getChildrenInClassroom(selectedClassroom.id).length === 0 ? (
                  <View style={styles.emptyChildrenState}>
                    <Users size={32} color="#D1D5DB" />
                    <Text style={styles.emptyChildrenText}>No hay niños en este salón</Text>
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
                            `¿Deseas remover a ${child.name} de este salón?`,
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
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#F59E0B' },
  headerContent: { flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#FEF3C7' },
  addButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 12, borderRadius: 12, marginLeft: 16 },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7280', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  cancelButton: { fontSize: 16, color: '#6B7280' },
  saveButton: { fontSize: 16, fontWeight: '600', color: '#3B82F6' },
  modalContent: { flex: 1, padding: 16 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16, color: '#1F2937', backgroundColor: '#FFFFFF' },
  inputError: { borderColor: '#EF4444', borderWidth: 2 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  helperText: { color: '#6B7280', fontSize: 12, marginTop: 4, marginLeft: 4, fontStyle: 'italic' },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  dropdownButtonContent: { flex: 1 },
  dropdownButtonText: { fontSize: 16, color: '#1F2937', fontWeight: '500' },
  dropdownArrow: { fontSize: 14, color: '#6B7280', marginLeft: 8, fontWeight: 'bold' },
  dropdownList: { borderWidth: 1, borderColor: '#D1D5DB', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#FFFFFF', marginTop: -1, overflow: 'hidden', zIndex: 10 },
  teacherList: { maxHeight: 200 },
  dropdownListItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  dropdownListItemSelected: { backgroundColor: '#FEF3C7' },
  dropdownListItemContent: { flex: 1 },
  dropdownListItemName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  dropdownListItemTextSelected: { color: '#F59E0B' },
  dropdownListItemPosition: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  dropdownCheckmark: { fontSize: 18, color: '#F59E0B', fontWeight: 'bold', marginLeft: 8 },
  detailSection: { marginBottom: 24 },
  detailSectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  detailCard: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 8 },
  detailLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  detailValue: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  emptyChildrenState: { alignItems: 'center', padding: 32 },
  emptyChildrenText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  childInClassroomCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 8 },
  childInClassroomInfo: { flex: 1 },
  childInClassroomName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  childInClassroomAge: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  removeButton: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  removeButtonText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});