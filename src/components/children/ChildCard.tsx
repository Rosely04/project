import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, MessageCircleMore, Trash2, User, Phone, MapPin, School } from 'lucide-react-native';
import { Child, Classroom } from '../../types';

interface ChildCardProps {
  child: Child;
  classrooms: Classroom[];
  getChildrenInClassroom: (id: string) => number;
  onEdit: (child: Child) => void;
  onWhatsApp: (child: Child) => void;
  onDelete: (child: Child) => void;
}

export const ChildCard = ({ 
  child, 
  classrooms, 
  getChildrenInClassroom, 
  onEdit, 
  onWhatsApp, 
  onDelete 
}: ChildCardProps) => {
  
  const classroom = classrooms.find(c => c.id === child.classroom_id);

  return (
    <View style={styles.childCard}>
      <View style={styles.childHeader}>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childAge}>{child.age} años</Text>
        </View>
        <View style={styles.childActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onEdit(child)}>
            <Pencil size={18} color="#3B82F6" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onWhatsApp(child)}
            disabled={!child.parent_phone || child.parent_phone === '+53'}
          >
            <MessageCircleMore size={18} color="#25D366" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(child)}>
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
        <Text style={[styles.statusText, { color: child.has_paid ? '#10B981' : '#EF4444' }]}>
          {child.has_paid ? 'Pagado' : 'Pendiente de pago'}
        </Text>
        <Text style={[styles.statusText, { color: child.has_aseo ? '#06B6D4' : '#F59E0B' }]}>
          {child.has_aseo ? 'Con aseo' : 'Sin aseo'}
        </Text>
      </View>
    </View>
  );
};

// He copiado los estilos específicos de la tarjeta aquí para que sea independiente
const styles = StyleSheet.create({
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
  childInfo: { flex: 1 },
  childName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 2 },
  childAge: { fontSize: 14, color: '#6B7280' },
  childActions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 8 },
  childDetails: { marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailText: { marginLeft: 8, fontSize: 14, color: '#4B5563' },
  paymentStatus: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  statusText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});