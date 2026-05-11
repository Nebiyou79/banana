import React, { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';

import { queryClient } from './src/lib/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useAuthStore } from './src/store/authStore';
import { useThemeStore } from './src/store/themeStores';
import { useTheme } from './src/hooks/useTheme';
import { SplashScreen } from './src/screens/auth/SplashScreen';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const { hydrateFromStorage } = useAuthStore();
  const { colors, isDark } = useTheme();
  const { theme, setDark, setLight } = useThemeStore();
  const deviceTheme = useColorScheme();

  // Sync theme with device preference only when mode is 'system'
  useEffect(() => {
    if (theme.mode === 'system' && deviceTheme) {
      if (deviceTheme === 'dark') {
        setDark();
      } else {
        setLight();
      }
    }
  }, [deviceTheme, theme.mode, setDark, setLight]);

  useEffect(() => {
    const init = async () => {
      await hydrateFromStorage();
      await new Promise((r) => setTimeout(r, 1800));
      setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  const navTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background:   colors.bg,
      card:         colors.bgCard,
      text:         colors.text,
      border:       colors.border,
      primary:      colors.primary,
      notification: colors.primary,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer theme={navTheme}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <RootNavigator />
            <Toast />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}