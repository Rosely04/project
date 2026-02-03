import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, Trash2, Phone, Mail as MailIcon, DollarSign, Calendar, MessageCircleMore, Mail } from 'lucide-react-native';
import { Worker } from '../../types';

interface WorkerCardProps {
  worker: Worker;
  onEdit: (worker: Worker) => void;
  onDelete: (worker: Worker) => void;
  onWhatsApp: (worker: Worker) => void;
  onEmail: (worker: Worker) => void;
}

export const WorkerCard = ({ worker, onEdit, onDelete, onWhatsApp, onEmail }: WorkerCardProps) => {
  
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
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
            onPress={() => onWhatsApp(worker)}
            disabled={!worker.phone || worker.phone === '+53'}
          >
            <MessageCircleMore size={18} color="#25D366" />
          </TouchableOpacity>
          
          {/* Botón de Email */}
          {worker.email && worker.email.includes('@') && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onEmail(worker)}
            >
              <Mail size={18} color="#EA4335" />
            </TouchableOpacity>
          )}
          
          {/* Botón de editar */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onEdit(worker)}
          >
            <Pencil size={18} color="#3B82F6" />
          </TouchableOpacity>
          
          {/* Botón de eliminar */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onDelete(worker)}
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
};

const styles = StyleSheet.create({
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
  workerInfo: { flex: 1 },
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
  workerActions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 8 },
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
});