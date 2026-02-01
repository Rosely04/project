//Navegación con 6 pestañas
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Users, CreditCard, UserCheck, ChartBar as BarChart3, Droplets, School, MoreHorizontal } from 'lucide-react-native';

// Este componente dibuja TU propia barra de navegación
function CustomTabBar({ state, descriptors, navigation, toggleMenu }: any) {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        
        // 1. AQUI: Agregamos 'workers' a la lista de rutas ocultas en la barra principal
        if (['aseo', 'payments', 'workers'].includes(route.name)) return null;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Renderizar iconos según la ruta visible
        let IconComponent;
        let label = options.title;
        const color = isFocused ? '#3B82F6' : '#6B7280';

        switch (route.name) {
          case 'index': IconComponent = <BarChart3 size={24} color={color} />; break;
          case 'children': IconComponent = <Users size={24} color={color} />; break;
          case 'classrooms': IconComponent = <School size={24} color={color} />; break;
          default: IconComponent = <View />;
        }

        return (
          <TouchableOpacity
            key={index}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            {IconComponent}
            <Text style={[styles.tabLabel, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}

      {/* --- BOTÓN MANUAL DE "MÁS" --- */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={toggleMenu}
      >
        <MoreHorizontal size={24} color="#6B7280" />
        <Text style={[styles.tabLabel, { color: '#6B7280' }]}>Más</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const handleNavigation = (route: any) => {
    setMenuVisible(false);
    router.push(route);
  };

  return (
    <>
      {/* 2. MENÚ FLOTANTE ACTUALIZADO */}
      {menuVisible && (
        <Pressable style={styles.overlay} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuContainer}>
            
            {/* Nuevo Item: Personal (Workers) */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/workers')}>
              <UserCheck size={20} color="#3B82F6" />
              <Text style={styles.menuText}>Personal</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />

            {/* Item: Aseo */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/aseo')}>
              <Droplets size={20} color="#3B82F6" />
              <Text style={styles.menuText}>Aseo</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            
            {/* Item: Pagos */}
            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigation('/payments')}>
              <CreditCard size={20} color="#3B82F6" />
              <Text style={styles.menuText}>Pagos</Text>
            </TouchableOpacity>

          </View>
        </Pressable>
      )}

      {/* TABS CONFIGURACIÓN */}
      <Tabs
        tabBar={props => <CustomTabBar {...props} toggleMenu={() => setMenuVisible(!menuVisible)} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="children" options={{ title: 'Niños' }} />
        <Tabs.Screen name="classrooms" options={{ title: 'Aulas' }} />
        
        {/* Rutas ocultas de la barra principal (aparecen en el menú o son auxiliares) */}
        <Tabs.Screen name="workers" options={{ title: 'Personal' }} />
        <Tabs.Screen name="payments" options={{ title: 'Pagos' }} />
        <Tabs.Screen name="aseo" options={{ title: 'Aseo' }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  // Estilos de la Barra
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    height: 80,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 10,
    paddingTop: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  // Estilos del Menú Flotante
  overlay: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 100,
    // Opcional: un fondo semitransparente para ver mejor el menú
    // backgroundColor: 'rgba(0,0,0,0.05)', 
  },
  menuContainer: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    width: 160, // Aumenté un poco el ancho
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