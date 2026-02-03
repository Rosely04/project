import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Pencil, Trash2, Users, GraduationCap } from 'lucide-react-native';
import { Classroom, Child } from '../../types';

interface ClassroomCardProps {
  classroom: Classroom;
  childrenInClassroom: Child[];
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
  onViewDetails: (classroom: Classroom) => void;
}

export const ClassroomCard = ({ 
  classroom, 
  childrenInClassroom, 
  onEdit, 
  onDelete, 
  onViewDetails 
}: ClassroomCardProps) => {
  
  const capacityPercentage = (childrenInClassroom.length / classroom.max_capacity) * 100;

  return (
    <TouchableOpacity
      style={styles.classroomCard}
      onPress={() => onViewDetails(classroom)}
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
              onEdit(classroom);
            }}
          >
            <Pencil size={18} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete(classroom);
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

const styles = StyleSheet.create({
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
  classroomInfo: { flex: 1 },
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
  classroomActions: { flexDirection: 'row' },
  actionButton: { padding: 8, marginLeft: 8 },
  capacityContainer: { marginTop: 8 },
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
});