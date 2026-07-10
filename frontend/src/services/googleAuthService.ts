// frontend/src/services/googleAuthService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

export interface GoogleAuthResponse {
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
      bio?: string;
      location?: string;
      skills: string[];
      referralCode?: string;
      rewardPoints: number;
      rewardBalance: number;
    };
    token: string;
  };
}

export const googleAuthService = {
  /**
   * Send Google credential token to backend for verification
   * Works for both web (Google One Tap) and mobile (React Native)
   */
  authenticateWithGoogle: async (credential: string): Promise<GoogleAuthResponse> => {
    try {
      const response = await api.post<GoogleAuthResponse>(
        '/auth/google/verify',
        { credential },
        { timeout: 15000 }
      );

      if (response.data.success && response.data.data) {
        // Destructure from response.data.data (the nested data object)
        const { user, token } = response.data.data;

        // Store auth data (same pattern as regular login)
        localStorage.setItem('token', token);
        localStorage.setItem('userId', user._id);
        localStorage.setItem('role', user.role);
        localStorage.setItem('user', JSON.stringify(user));

        handleSuccess('Signed in with Google successfully!');
        return response.data;
      } else {
        throw new Error(response.data.message || 'Google authentication failed');
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to authenticate with Google';
      handleError(message);
      throw error;
    }
  },
};