import { useState } from 'react';
import { useRouter } from 'expo-router';

export const useNavigationMenu = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const handleNavigation = (route: string) => {
    closeMenu();
    // @ts-ignore: Expo Router maneja las rutas como strings
    router.push(route);
  };

  return {
    menuVisible,
    toggleMenu,
    closeMenu,
    handleNavigation
  };
};