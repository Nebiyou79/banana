// frontend/src/components/auth/GoogleSignIn.tsx
import { useEffect } from 'react';
import Script from 'next/script';
import GoogleSignInButton from './GoogleSignInButton';
import { lightTheme } from '@/utils/color';

interface GoogleSignInProps {
  /** 'login' or 'register' - changes button text */
  type: 'login' | 'register';
  /** Called when Google sign-in succeeds with the user's role */
  onSuccess?: (role: string) => void;
  /** Called when Google sign-in fails */
  onError?: (error: Error) => void;
}

export default function GoogleSignIn({ type, onSuccess, onError }: GoogleSignInProps) {
  return (
    <>
      {/* Load Google Identity Services script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={() => console.log('Google Identity Services loaded')}
        onError={() => console.error('Failed to load Google Identity Services')}
      />

      <div className="mt-6">
        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div
              className="w-full border-t"
              style={{ borderColor: lightTheme.border.secondary }}
            />
          </div>
          <div className="relative flex justify-center text-sm">
            <span
              className="px-4 font-medium"
              style={{
                backgroundColor: lightTheme.bg.primary,
                color: lightTheme.text.muted,
              }}
            >
              Or continue with
            </span>
          </div>
        </div>

        {/* Google Sign-In Button */}
        <div className="flex justify-center">
          <GoogleSignInButton
            text={
              type === 'register'
                ? 'Sign up with Google'
                : 'Continue with Google'
            }
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
      </div>
    </>
  );
}