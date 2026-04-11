import React, { useEffect, useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { darkTheme, lightTheme } from './src/constants/theme';
import { queryClient } from './src/lib/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStore';
import { SplashScreen } from './src/screens/auth/SplashScreen';


export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { hydrateFromStorage } = useAuthStore();
  const { mode } = useThemeStore();

  const theme = mode === 'dark' ? darkTheme : lightTheme;

  useEffect(() => {
    const init = async () => {
      await hydrateFromStorage();
      // Brief delay for splash animation
      await new Promise((r) => setTimeout(r, 1800));
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
            <Toast />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}