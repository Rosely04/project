import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { Plus, DollarSign, Briefcase } from 'lucide-react-native';
import { useWorkers } from '../../src/hooks/useWorkers';
import { WorkerCard } from '../../src/components/workers/WorkerCard';

export default function WorkersScreen() {
  const {
    workers,
    modalVisible,
    editingWorker,
    formData,
    setFormData,
    errors,
    setErrors,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
    openWhatsApp,
    openEmail,
    getTotalSalaries
  } = useWorkers();

  return (
    <View style={styles.container}>
      {}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Trabajadores</Text>
          <View style={styles.totalSalaries}>
            <DollarSign size={20} color="#FFFFFF" />
            <Text style={styles.totalSalariesText}>
              ${getTotalSalaries().toLocaleString()}/mes
            </Text>
          </View>
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
        {workers.length === 0 ? (
          <View style={styles.emptyState}>
            <Briefcase size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay trabajadores registrados</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar el primer trabajador</Text>
          </View>
        ) : (
          workers.map((worker) => (
            <WorkerCard 
              key={worker.id} 
              worker={worker} 
              onEdit={openModal}
              onDelete={handleDelete}
              onWhatsApp={openWhatsApp}
              onEmail={openEmail}
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
              {editingWorker ? 'Editar Trabajador' : 'Agregar Trabajador'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Guardar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre Completo</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({...formData, name: text});
                  if (errors.name) setErrors({...errors, name: ''});
                }}
                placeholder="Nombre y apellidos"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Cargo</Text>
              <TextInput
                style={[styles.input, errors.position && styles.inputError]}
                value={formData.position}
                onChangeText={(text) => {
                  setFormData({...formData, position: text});
                  if (errors.position) setErrors({...errors, position: ''});
                }}
                placeholder="Ej: Educadora, Directora, Auxiliar"
              />
              {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
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
                  setFormData({...formData, phone: formattedText});
                  if (errors.phone) setErrors({...errors, phone: ''});
                }}
                placeholder="+53 xxxxxxxx"
                keyboardType="phone-pad"
                maxLength={11}
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Email (Opcional)</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({...formData, email: text});
                  if (errors.email) setErrors({...errors, email: ''});
                }}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Salario Mensual</Text>
              <TextInput
                style={[styles.input, errors.salary && styles.inputError]}
                value={formData.salary}
                onChangeText={(text) => {
                  const numericText = text.replace(/[^0-9]/g, '');
                  setFormData({...formData, salary: numericText});
                  if (errors.salary) setErrors({...errors, salary: ''});
                }}
                placeholder="0.00"
                keyboardType="numeric"
              />
              {errors.salary && <Text style={styles.errorText}>{errors.salary}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Fecha de Contratación</Text>
              <TextInput
                style={[styles.input, errors.hire_date && styles.inputError]}
                value={formData.hire_date}
                onChangeText={(text) => {
                  setFormData({...formData, hire_date: text});
                  if (errors.hire_date) setErrors({...errors, hire_date: ''});
                }}
                placeholder="YYYY-MM-DD"
              />
              {errors.hire_date && <Text style={styles.errorText}>{errors.hire_date}</Text>}
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
    backgroundColor: '#8B5CF6',
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
  totalSalaries: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalSalariesText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#E0E7FF',
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
});