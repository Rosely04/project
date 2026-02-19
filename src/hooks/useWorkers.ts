import { useState, useCallback } from 'react'; // Solo agregamos useCallback
import { Alert, Linking } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // Solo agregamos useFocusEffect
import { getWorkers, saveWorker, deleteWorker } from '../../lib/storage';
import { Worker } from '../types';
import { validateWorkerForm } from '../utils/validators';

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

  // --- LOGICA DE CARGA ---
  // Envolvemos esto en useCallback para que funcione con el refresco de pantalla
  const loadWorkers = useCallback(async () => {
    const data = await getWorkers();
    setWorkers(data);
  }, []);

  // --- EFECTOS ---
  // Cambiamos useEffect por useFocusEffect para que refresque al volver
  useFocusEffect(
    useCallback(() => {
      loadWorkers();
    }, [loadWorkers])
  );

  const getTotalSalaries = (): number => {
    return workers.reduce((sum: number, worker: Worker) => sum + worker.salary, 0);
  };

  // --- LOGICA DEL FORMULARIO (Sin cambios) ---
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
    // Usamos la función externa que ya probamos con Jest
    const validation = validateWorkerForm(
      formData.name,
      formData.position,
      formData.phone,
      formData.email,
      formData.salary,
      formData.hire_date
    );

    setErrors(validation.errors);
    return validation.isValid;
  };

  // --- ACCIONES (Sin cambios en lógica interna) ---
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

   try {
         await saveWorker(workerData); 
         await loadWorkers(); 
         closeModal();         
         
       } catch (error: any) {
         Alert.alert('Error al guardar', 'El trabajador ya está registrado.');
       }
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