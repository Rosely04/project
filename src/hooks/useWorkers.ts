import { useState, useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { getWorkers, saveWorker, deleteWorker } from '../../lib/storage';
import { Worker } from '../types';

export const useWorkers = () => {
  // --- ESTADOS ---
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  
  // Estado del Formulario
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    salary: '',
    hire_date: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // --- EFECTOS ---
  useEffect(() => {
    loadWorkers();
  }, []);

  // --- LOGICA DE CARGA ---
  const loadWorkers = async () => {
    const data = await getWorkers();
    setWorkers(data);
  };

  const getTotalSalaries = (): number => {
    return workers.reduce((sum: number, worker: Worker) => sum + worker.salary, 0);
  };

  // --- LOGICA DEL FORMULARIO ---
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
    setErrors({});
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

  // --- VALIDACIONES (Intactas) ---
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

    // Validación Email (OPCIONAL)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }

    // Validación Salario
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

  // --- ACCIONES (Guardar, Borrar, Contactar) ---
  const handleSave = async () => {
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
              if (supported) return Linking.openURL(whatsappUrl);
              else return Linking.openURL(`https://wa.me/${phoneNumber}`);
            }).catch(err => {
              console.error('Error al abrir WhatsApp:', err);
              Alert.alert('Error', 'No se pudo abrir WhatsApp.');
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
            Linking.canOpenURL(emailUrl).catch(err => {
              console.error('Error al abrir email:', err);
              Alert.alert('Error', 'No se pudo abrir la aplicación de correo.');
            });
          }
        }
      ]
    );
  };

  return {
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
  };
};