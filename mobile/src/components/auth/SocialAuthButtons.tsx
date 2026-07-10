// src/components/auth/SocialAuthButtons.tsx
import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useAuthStore } from '../../store/authStore';

const getDashboardRoute = (role: string) => {
  const map: Record<string, string> = {
    candidate: 'CandidateRoot',
    freelancer: 'FreelancerRoot',
    company: 'CompanyRoot',
    organization: 'OrganizationRoot',
  };
  return map[role] || 'CandidateRoot';
};

export const SocialAuthButtons: React.FC = () => {
  const { spacing } = useTheme();
  const navigation = useNavigation<any>();

  const handleGoogleSuccess = useCallback((role: string) => {
    // Force refresh current user after Google sign-in
    // The token is already stored in SecureStore by googleAuthService
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: getDashboardRoute(role) }],
      });
    }, 300);
  }, [navigation]);

  return (
    <View style={{ gap: spacing.sm }}>
      <GoogleSignInButton
        onSuccess={handleGoogleSuccess}
        onError={(error) => console.log('Google sign-in error:', error.message)}
      />
    </View>
  );
};

export default SocialAuthButtons;