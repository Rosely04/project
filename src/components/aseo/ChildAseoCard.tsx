import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Droplets, Check } from 'lucide-react-native';
import { Child } from '../../types';

interface ChildAseoCardProps {
  child: Child;
  onAction: (child: Child) => void;
}

export const ChildAseoCard = ({ child, onAction }: ChildAseoCardProps) => {
  return (
    <View style={styles.childCard}>
      <View style={styles.cardContentRow}>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.parentName}>Padre: {child.parent_name}</Text>
        </View>
        <TouchableOpacity 
          style={[
            styles.aseoButton,
            child.has_aseo ? styles.aseoButtonAssigned : styles.aseoButtonUnassigned
          ]}
          onPress={() => onAction(child)}
        >
          {child.has_aseo ? (
            <><Check size={20} color="#FFFFFF" /><Text style={styles.aseoButtonText}>OK</Text></>
          ) : (
            <><Droplets size={20} color="#FFFFFF" /><Text style={styles.aseoButtonText}>Asignar</Text></>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  childCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  childInfo: {
    flex: 1,
    paddingRight: 10,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  parentName: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  aseoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 100,
  },
  aseoButtonAssigned: {
    backgroundColor: '#10B981', // Verde
  },
  aseoButtonUnassigned: {
    backgroundColor: '#06B6D4', // Azul
  },
  aseoButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
});