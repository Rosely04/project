import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, ChartBar as BarChart3, School, MoreHorizontal } from 'lucide-react-native';

// Props que recibe automáticamente de Expo Router/React Navigation
interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  onToggleMenu: () => void;
}

export const CustomTabBar = ({ state, descriptors, navigation, onToggleMenu }: CustomTabBarProps) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        
        // Rutas ocultas en la barra principal
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
        onPress={onToggleMenu}
      >
        <MoreHorizontal size={24} color="#6B7280" />
        <Text style={[styles.tabLabel, { color: '#6B7280' }]}>Más</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});