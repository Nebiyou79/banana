// mobile/src/services/googleAuthService.ts
import { apiPost } from '../lib/api';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const TOKEN_KEY = 'auth_token';

export interface GoogleAuthResult {
  success: boolean;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    emailVerified: boolean;
    avatar: string | null;
  };
}

export const googleAuthService = {
  authenticateWithGoogle: async (idToken: string): Promise<GoogleAuthResult> => {
    const res = await apiPost<{
      success: boolean;
      message: string;
      data: {
        user: {
          _id: string;
          name: string;
          email: string;
          role: string;
          emailVerified: boolean;
          verificationStatus: string;
          profileCompleted: boolean;
          avatar: string | null;
        };
        token: string;
      };
    }>('/auth/google/verify', { credential: idToken });

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Google authentication failed');
    }

    const { user, token } = res.data.data;

    // Store auth data (matching your existing auth pattern)
    await SecureStore.setItemAsync(TOKEN_KEY, token);

    return { success: true, user };
  },

  handleError: (error: any): string => {
    if (!error.response) return 'Cannot reach the server. Check your network connection.';
    return error.response?.data?.message || 'Failed to sign in with Google';
  },
};