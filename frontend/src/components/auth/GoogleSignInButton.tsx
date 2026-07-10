/* eslint-disable @typescript-eslint/no-explicit-any */
// frontend/src/components/auth/GoogleSignInButton.tsx
import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { googleAuthService } from '@/services/googleAuthService';
import { colors, lightTheme } from '@/utils/color';

// Google G icon SVG (inline so no external dependency needed)
const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.75h3.57c2.08-1.92 3.28-4.74 3.28-8.08z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.75c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

interface GoogleSignInButtonProps {
  /** Text shown on the button */
  text?: string;
  /** Called when login starts */
  onStart?: () => void;
  /** Called on success with user role (for redirect) */
  onSuccess?: (role: string) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
  /** Disable the button */
  disabled?: boolean;
}

export default function GoogleSignInButton({
  text = 'Continue with Google',
  onStart,
  onSuccess,
  onError,
  className = '',
  disabled = false,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = useCallback(async () => {
    if (typeof window === 'undefined' || !window.google) {
      toast({
        title: 'Google Sign-In Unavailable',
        description: 'Please try again or use email/password to sign in.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    onStart?.();

    try {
      // Use Google One Tap / Sign In With Google
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        scope: 'email profile',
        callback: async (response: any) => {
          if (response.error) {
            // User closed the popup or there was an error
            setIsLoading(false);
            if (response.error !== 'popup_closed_by_user') {
              const error = new Error(
                response.error_description || 'Google sign-in was cancelled'
              );
              onError?.(error);
              toast({
                title: 'Google Sign-In Failed',
                description: error.message,
                variant: 'destructive',
              });
            }
            return;
          }

          try {
            // Send the access token to our backend for verification
            const result = await googleAuthService.authenticateWithGoogle(
              response.access_token
            );

            const userRole = result.data.user.role;

            // Call onSuccess callback
            onSuccess?.(userRole);

            // Redirect based on role (same pattern as login.tsx)
            if (userRole === 'admin') {
              toast({
                variant: 'success',
                title: 'Welcome Admin!',
                description: 'Redirecting to admin dashboard',
              });
              router.push('/dashboard/admin');
            } else {
              toast({
                variant: 'success',
                title: 'Welcome!',
                description: 'Signed in with Google successfully',
              });
              router.push(`/dashboard/${userRole}`);
            }
          } catch (error: any) {
            onError?.(error);
          } finally {
            setIsLoading(false);
          }
        },
      });

      // Request access token (this triggers the Google popup)
      client.requestAccessToken();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      onError?.(error);
      toast({
        title: 'Google Sign-In Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  }, [router, toast, onStart, onSuccess, onError]);

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading || disabled}
      className={`w-full flex items-center justify-center gap-3 px-6 py-3 
        rounded-xl text-base font-semibold
        border transition-all duration-200
        shadow-sm hover:shadow-md
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}`}
      style={{
        backgroundColor: lightTheme.bg.primary,
        borderColor: lightTheme.border.secondary,
        color: lightTheme.text.primary,
        minHeight: '48px',
      }}
      onMouseEnter={(e) => {
        if (!isLoading && !disabled) {
          e.currentTarget.style.backgroundColor = lightTheme.bg.surface;
          e.currentTarget.style.borderColor = colors.goldenMustard;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = lightTheme.bg.primary;
        e.currentTarget.style.borderColor = lightTheme.border.secondary;
      }}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: colors.goldenMustard }} />
      ) : (
        <GoogleIcon />
      )}
      <span>{isLoading ? 'Signing in...' : text}</span>
    </button>
  );
}

// Add Google types for TypeScript
declare global {
  interface Window {
    google: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string; error_description?: string }) => void;
          }) => {
            requestAccessToken: () => void;
          };
          initCodeClient: (config: any) => any;
        };
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
      };
    };
  }
}