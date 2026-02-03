import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { UserCheck, Droplets, CreditCard } from 'lucide-react-native';

interface FloatingMenuProps {
  visible: boolean;
  onClose: () => void;
  onNavigate: (route: string) => void;
}

export const FloatingMenu = ({ visible, onClose, onNavigate }: FloatingMenuProps) => {
  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <View style={styles.menuContainer}>
        
        {/* Nuevo Item: Personal (Workers) */}
        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('/workers')}>
          <UserCheck size={20} color="#3B82F6" />
          <Text style={styles.menuText}>Personal</Text>
        </TouchableOpacity>
        
        <View style={styles.divider} />

        {/* Item: Aseo */}
        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('/aseo')}>
          <Droplets size={20} color="#3B82F6" />
          <Text style={styles.menuText}>Aseo</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
        
        {/* Item: Pagos */}
        <TouchableOpacity style={styles.menuItem} onPress={() => onNavigate('/payments')}>
          <CreditCard size={20} color="#3B82F6" />
          <Text style={styles.menuText}>Pagos</Text>
        </TouchableOpacity>

      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 100,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 160,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  menuText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 4,
  }
});