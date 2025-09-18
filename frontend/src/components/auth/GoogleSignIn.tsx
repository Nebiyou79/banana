/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleSignInProps {
  type: 'login' | 'register';
}

export default function GoogleSignIn({ type }: GoogleSignInProps) {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleGoogleSignIn,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { 
          theme: 'outline', 
          size: 'large',
          width: 300,
          text: type === 'login' ? 'signin_with' : 'signup_with'
        }
      );
    }
  }, [type]);

  const handleGoogleSignIn = async (response: any) => {
    try {
      const result = await authService.googleAuth({ token: response.credential });
      
      toast({
        title: 'Success!',
        description: `Signed in with Google successfully`,
      });

      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Failed to sign in with Google',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <div id="googleSignInButton" />
      </div>
    </div>
  );
}