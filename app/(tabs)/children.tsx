import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Plus, Search, User, AlertCircle } from 'lucide-react-native';
import { useChildren } from '../../src/hooks/useChildren';
import { ChildCard } from '../../src/components/children/ChildCard';

export default function ChildrenScreen() {

  const {
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
  } = useChildren();

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Niños</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {}
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

      {}
      <ScrollView style={styles.content}>
        {filteredChildren.length === 0 ? (
          <View style={styles.emptyState}>
            <User size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay niños registrados</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar el primer niño</Text>
          </View>
        ) : (
          filteredChildren.map((child) => (
            <ChildCard 
              key={child.id} 
              child={child} 
              classrooms={classrooms}
              getChildrenInClassroom={getChildrenInClassroom}
              onEdit={openModal}
              onWhatsApp={openWhatsApp}
              onDelete={handleDelete}
            />
          ))
        )}
      </ScrollView>

      {}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
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
            {}
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

            {}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Edad</Text>
              <TextInput
                style={[styles.input, errors.age && styles.inputError]}
                value={formData.age}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^1-5]/g, '');
                  const limitedText = numericText.slice(0, 1);
                  setFormData({...formData, age: limitedText});
                  if (errors.age) setErrors({...errors, age: ''});
                }}
                placeholder="Edad en años (1-5)"
                keyboardType="numeric"
                maxLength={1}
              />
              {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            {}
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

            {}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, errors.parent_phone && styles.inputError]}
                value={formData.parent_phone}
                onChangeText={(text) => {
                  let formattedText = text;
                  if (text && !text.startsWith('+53')) {
                    if(text.length < 3) formattedText = '+53';
                  } else if (text) {
                    const prefix = text.substring(0, 3);
                    const numbers = text.substring(3).replace(/[^0-9]/g, '');
                    formattedText = prefix + numbers.slice(0, 8);
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

            {}
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

            {}
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
                      {formData.classroom_id === '' && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                    
                    {classrooms.map((classroom) => {
                      const currentChildren = getChildrenInClassroom(classroom.id);
                      const childrenExcludingCurrent = editingChild && editingChild.classroom_id === classroom.id 
                        ? currentChildren - 1 
                        : currentChildren;
                      const isFull = childrenExcludingCurrent >= classroom.max_capacity;
                      const isSelected = formData.classroom_id === classroom.id;
                      
                      return (
                        <TouchableOpacity
                          key={classroom.id}
                          style={[
                            styles.classroomOption,
                            isSelected && styles.classroomOptionSelected,
                            isFull && !isSelected && styles.classroomOptionDisabled
                          ]}
                          onPress={() => {
                            if (isFull && !isSelected) {
                              Alert.alert(
                                'Aula llena',
                                `El aula "${classroom.name}" ya ha alcanzado su capacidad máxima.`
                              );
                              return;
                            }
                            setFormData({...formData, classroom_id: classroom.id});
                          }}
                          disabled={isFull && !isSelected}
                        >
                          <View style={styles.classroomOptionInfo}>
                            <View style={styles.classroomHeaderRow}>
                              <Text style={[
                                styles.classroomOptionName,
                                isSelected && styles.classroomOptionTextSelected,
                                isFull && !isSelected && styles.classroomOptionTextDisabled
                              ]}>
                                {classroom.name}
                              </Text>
                              {isFull && !isSelected && (
                                <View style={styles.fullIndicator}>
                                  <AlertCircle size={14} color="#EF4444" />
                                  <Text style={styles.fullText}>LLENA</Text>
                                </View>
                              )}
                            </View>
                            <Text style={[
                              styles.classroomOptionTeacher,
                              isSelected && styles.classroomOptionTextSelected,
                              isFull && !isSelected && styles.classroomOptionTextDisabled
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
                          {isSelected && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
              {errors.classroom_id && <Text style={styles.errorText}>{errors.classroom_id}</Text>}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60, backgroundColor: '#3B82F6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  addButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: 12, borderRadius: 12 },
  searchContainer: { padding: 16, backgroundColor: '#FFFFFF' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#1F2937' },
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
  textArea: { height: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#EF4444', borderWidth: 2 },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  pickerContainer: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, backgroundColor: '#FFFFFF', maxHeight: 200 },
  classroomList: { maxHeight: 200 },
  classroomOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  classroomOptionSelected: { backgroundColor: '#FEF3C7' },
  classroomOptionDisabled: { backgroundColor: '#F3F4F6' },
  classroomOptionInfo: { flex: 1 },
  classroomHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  classroomOptionName: { fontSize: 16, fontWeight: '600', color: '#1F2937', flex: 1 },
  classroomOptionTextSelected: { color: '#F59E0B' },
  classroomOptionTextDisabled: { color: '#9CA3AF' },
  classroomOptionTeacher: { fontSize: 14, color: '#6B7280', marginBottom: 2 },
  classroomCapacity: { fontSize: 12, fontWeight: '600' },
  classroomCapacityAvailable: { color: '#10B981' },
  classroomCapacityFull: { color: '#EF4444' },
  checkmark: { fontSize: 18, color: '#F59E0B', fontWeight: 'bold' },
  noClassroomsText: { padding: 16, textAlign: 'center', color: '#6B7280' },
  fullIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  fullText: { fontSize: 10, fontWeight: 'bold', color: '#EF4444', marginLeft: 4 },
});