import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { initDatabase } from '@/lib/database';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        await initDatabase();
        console.log('Base de datos SQLite inicializada');
      } catch (error) {
        console.error('Error inicializando base de datos:', error);
      }
    };

    setupDatabase();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
