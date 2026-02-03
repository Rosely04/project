//Gestión de Trabajadores

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Linking } from 'react-native';
import { getWorkers, saveWorker, deleteWorker } from '../../lib/storage';
import { Worker } from '../../src/types';
import { Plus, Pencil, Trash2, User, Phone, Mail as MailIcon, DollarSign, Calendar, Briefcase, MessageCircleMore, Mail } from 'lucide-react-native';

export default function WorkersScreen() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    salary: '',
    hire_date: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    const data = await getWorkers();
    setWorkers(data);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      position: '',
      phone: '',
      email: '',
      salary: '',
      hire_date: '',
    });
    setEditingWorker(null);
  };

  const openModal = (worker?: Worker) => {
    if (worker) {
      setEditingWorker(worker);
      setFormData({
        name: worker.name,
        position: worker.position,
        phone: worker.phone,
        email: worker.email || '',
        salary: worker.salary.toString(),
        hire_date: worker.hire_date,
      });
    } else {
      resetForm();
      // Set today's date as default hire date
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, hire_date: today }));
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    resetForm();
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Validación Nombre Completo 
    if (!formData.name.trim()) {
      newErrors.name = 'Nombre es obligatorio';
    } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(formData.name)) {
      newErrors.name = 'El nombre solo puede contener letras y espacios';
    }

    // Validación Cargo 
    if (!formData.position.trim()) {
      newErrors.position = 'Cargo es obligatorio';
    } else if (!/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(formData.position)) {
      newErrors.position = 'El cargo solo puede contener letras';
    }

    // Validación Teléfono 
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^\+53\d{8}$/.test(formData.phone)) {
      newErrors.phone = 'Formato: +53xxxxxxxx (8 números después del +53)';
    }

    // Validación Email (OPCIONAL, solo si está presente)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    // Validación Salario (solo números positivos)
    if (!formData.salary.trim()) {
      newErrors.salary = 'Salario es obligatorio';
    } else if (!/^\d+$/.test(formData.salary)) {
      newErrors.salary = 'El salario solo puede contener números';
    } else if (parseFloat(formData.salary) <= 0) {
      newErrors.salary = 'El salario debe ser mayor a 0';
    }

    // Validación Fecha
    if (!formData.hire_date.trim()) {
      newErrors.hire_date = 'Fecha de contratación es obligatoria';
    } else {
      const date = new Date(formData.hire_date);
      if (isNaN(date.getTime())) {
        newErrors.hire_date = 'Fecha inválida';
      } else if (date > new Date()) {
        newErrors.hire_date = 'La fecha no puede ser futura';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // Validar antes de guardar
    if (!validateForm()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    const workerData: Worker = {
      id: editingWorker?.id || Date.now().toString(),
      name: formData.name.trim(),
      position: formData.position.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || '',
      salary: parseFloat(formData.salary),
      hire_date: formData.hire_date,
      created_at: editingWorker?.created_at || new Date().toISOString(),
    };

    await saveWorker(workerData);
    await loadWorkers();
    closeModal();
  };

  const handleDelete = (worker: Worker) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar a ${worker.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            await deleteWorker(worker.id);
            await loadWorkers();
          }
        },
      ]
    );
  };

  const openWhatsApp = (worker: Worker) => {
    if (!worker.phone || worker.phone === '+53') {
      Alert.alert('Error', 'Número de teléfono no válido');
      return;
    }
    
    const phoneNumber = worker.phone.replace(/\s+/g, '').replace('+', '');
    
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}`;
    
    Alert.alert(
      'Enviar WhatsApp',
      `¿Deseas enviar un mensaje a ${worker.name} (${worker.phone})?`,
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

  const openEmail = (worker: Worker) => {
    if (!worker.email || !worker.email.includes('@')) {
      Alert.alert('Error', 'El trabajador no tiene una dirección de email registrada');
      return;
    }
    
    const emailUrl = `mailto:${worker.email}`;
    
    Alert.alert(
      'Enviar Email',
      `¿Deseas enviar un correo a ${worker.name} (${worker.email})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir Correo',
          onPress: () => {
            Linking.canOpenURL(emailUrl).then(supported => {
              if (supported) {
                return Linking.openURL(emailUrl);
              } else {
                Alert.alert('Error', 'No se pudo abrir la aplicación de correo.');
              }
            }).catch(err => {
              console.error('Error al abrir email:', err);
              Alert.alert('Error', 'No se pudo abrir la aplicación de correo.');
            });
          }
        }
      ]
    );
  };

  const getTotalSalaries = (): number => {
    return workers.reduce((sum: number, worker: Worker) => sum + worker.salary, 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return 'Fecha no disponible';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha inválida';
    }
  };

  const WorkerCard = ({ worker }: { worker: Worker }) => (
    <View style={styles.workerCard}>
      <View style={styles.workerHeader}>
        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{worker.name || 'Sin nombre'}</Text>
          <Text style={styles.workerPosition}>{worker.position || 'Sin cargo'}</Text>
        </View>
        <View style={styles.workerActions}>
          {/* Botón de WhatsApp */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openWhatsApp(worker)}
            disabled={!worker.phone || worker.phone === '+53'}
          >
            <MessageCircleMore size={18} color="#25D366" />
          </TouchableOpacity>
          
          {/* Botón de Email - SOLO si tiene email */}
          {worker.email && worker.email.includes('@') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => openEmail(worker)}
            >
              <Mail size={18} color="#EA4335" />
            </TouchableOpacity>
          )}
          
          {/* Botón de editar */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openModal(worker)}
          >
            <Pencil size={18} color="#3B82F6" />
          </TouchableOpacity>
          
          {/* Botón de eliminar */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDelete(worker)}
          >
            <Trash2 size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.workerDetails}>
        {worker.phone && (
          <View style={styles.detailRow}>
            <Phone size={16} color="#6B7280" />
            <Text style={styles.detailText}>{worker.phone || 'Sin teléfono'}</Text>
          </View>
        )}
        {worker.email && worker.email.includes('@') && (
          <View style={styles.detailRow}>
            <MailIcon size={16} color="#6B7280" />
            <Text style={styles.detailText}>{worker.email}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <DollarSign size={16} color="#10B981" />
          <Text style={styles.salaryText}>
            ${worker.salary ? worker.salary.toLocaleString() : '0'}/mes
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Desde: {worker.hire_date ? formatDate(worker.hire_date) : 'No disponible'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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

      <ScrollView style={styles.content}>
        {workers.length === 0 ? (
          <View style={styles.emptyState}>
            <Briefcase size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No hay trabajadores registrados</Text>
            <Text style={styles.emptySubtext}>Presiona el botón + para agregar el primer trabajador</Text>
          </View>
        ) : (
          workers.map((worker) => (
            <WorkerCard key={worker.id} worker={worker} />
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
                placeholder="Ej: Maestra, Directora, Auxiliar"
              />
              {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => {
                  // Forzar formato +53
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
  workerCard: {
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
  workerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  workerPosition: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  workerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  workerDetails: {},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4B5563',
  },
  salaryText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
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