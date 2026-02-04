import React from 'react';
import { Tabs } from 'expo-router';
import { useNavigationMenu } from '../../src/hooks/useNavigationMenu';
import { CustomTabBar } from '../../src/components/navigation/CustomTabBar';
import { FloatingMenu } from '../../src/components/navigation/FloatingMenu';

export default function TabLayout() {
  const { menuVisible, toggleMenu, closeMenu, handleNavigation } = useNavigationMenu();

  return (
    <>
      {}
      <FloatingMenu 
        visible={menuVisible} 
        onClose={closeMenu} 
        onNavigate={handleNavigation} 
      />

      {}
      <Tabs
        tabBar={props => (
        
          <CustomTabBar {...props} onToggleMenu={toggleMenu} />
        )}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="children" options={{ title: 'Niños' }} />
        <Tabs.Screen name="classrooms" options={{ title: 'Aulas' }} />
        
        {/* Rutas ocultas */}
        <Tabs.Screen name="workers" options={{ title: 'Personal' }} />
        <Tabs.Screen name="payments" options={{ title: 'Pagos' }} />
        <Tabs.Screen name="aseo" options={{ title: 'Aseo' }} />
      </Tabs>
    </>
  );
}