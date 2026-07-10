// mobile/src/components/auth/GoogleSignInButton.tsx
import React, { useState, useCallback } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/authStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';

// Dynamically import Google Sign-In for native platforms
let GoogleSignin: any = null;

if (Platform.OS !== 'web') {
  try {
    const module = require('@react-native-google-signin/google-signin');
    GoogleSignin = module.GoogleSignin;
  } catch (e) {
    console.warn('Google Sign-In module not available:', e);
  }
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const configureGoogleSignIn = () => {
  if (GoogleSignin && process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
    try {
      GoogleSignin.configure({
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
    } catch (e) {
      console.warn('Failed to configure Google Sign-In:', e);
    }
  }
};

interface GoogleSignInButtonProps {
  onSuccess?: (role: string) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  label?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  label = 'Continue with Google',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { colors: c, radius, spacing, type } = useTheme();
  const { showError, showSuccess } = useToast();
  const navigation = useNavigation<Nav>();

  const handlePress = useCallback(async () => {
    // Check if Google Sign-In is available
    if (!GoogleSignin) {
      showError('Google Sign-In is not available in this build. Please use email/password.');
      return;
    }

    setIsLoading(true);
    try {
      // Check Play Services (Android only, safe to call on iOS)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Sign in with Google
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('Failed to get Google ID token');
      }

      // Send token to your backend
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const result = await response.json();

      if (result.success && result.data?.user && result.data?.token) {
        // Store auth data
        const { setAuth } = useAuthStore.getState();
        setAuth(result.data.user, result.data.token, result.data.user.role);
        
        showSuccess(`Welcome ${result.data.user.name || 'back'}!`);
        onSuccess?.(result.data.user.role);
        
        // Navigate to role-based dashboard
        const dashboardRoute = getDashboardRoute(result.data.user.role);
        navigation.reset({ index: 0, routes: [{ name: dashboardRoute }] });
      } else {
        showError(result.message || 'Google Sign-In failed');
        onError?.(new Error(result.message));
      }
    } catch (error: any) {
      // Handle user cancellation
      if (error.code === 'SIGN_IN_CANCELLED') {
        // User cancelled - no error needed
        return;
      }
      
      const errorMessage = error.message || 'Google Sign-In failed';
      showError(errorMessage);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [navigation, showError, showSuccess, onSuccess, onError]);

  // Don't render on iOS if module not available
  if (Platform.OS === 'ios' && !GoogleSignin) {
    return null;
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={isLoading || disabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: c.bgCard,
          borderColor: c.border,
          borderRadius: radius.md,
          opacity: pressed ? 0.7 : isLoading ? 0.6 : 1,
          height: 48,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={c.primary} />
      ) : (
        <Ionicons name="logo-google" size={20} color="#EA4335" />
      )}
      <Text
        style={[
          type.body,
          {
            color: c.textSecondary,
            fontWeight: '600',
            marginLeft: spacing.sm,
          },
        ]}
        numberOfLines={1}
      >
        {isLoading ? 'Signing in...' : label}
      </Text>
    </Pressable>
  );
};

const getDashboardRoute = (role: string): keyof RootStackParamList => {
  const map: Record<string, keyof RootStackParamList> = {
    candidate: 'CandidateRoot',
    freelancer: 'FreelancerRoot',
    company: 'CompanyRoot',
    organization: 'OrganizationRoot',
    admin: 'CandidateRoot',
  };
  return map[role] ?? 'CandidateRoot';
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    gap: 10,
  },
});