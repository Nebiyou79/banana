/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/Input';
import Button from '@/components/forms/Button';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { colors } from '@/utils/color';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isValidToken, setIsValidToken] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Use the auth redirect hook
  useAuthRedirect();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    // Check if user is already authenticated
    if (authService.isAuthenticated()) {
      const userRole = localStorage.getItem('role') || 'candidate';
      router.push(`/dashboard/${userRole}`);
      return;
    }

    // Get token and email from URL parameters
    const urlToken = router.query.token as string;
    const urlEmail = router.query.email as string;
    
    if (urlToken && urlEmail) {
      setToken(urlToken);
      setUserEmail(decodeURIComponent(urlEmail));
      setIsValidToken(true);
    } else {
      setIsValidToken(false);
      toast({
        title: 'Invalid Link',
        description: 'This reset link is invalid or incomplete',
        variant: 'destructive',
      });
    }
  }, [router.query, router, toast]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast({
        title: 'Invalid Request',
        description: 'Reset token is missing',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPasswordWithToken({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword
      });
      setIsSuccess(true);
      toast({
        title: 'Password Reset Successfully!',
        description: 'Your password has been reset successfully',
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: colors.gray100 }}
      >
        <div className="max-w-md w-full space-y-8 text-center bg-white p-8 rounded-2xl shadow-lg">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: colors.teal + '20' }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: colors.teal }} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: colors.darkNavy }}>Password Reset Successfully!</h2>
          <p style={{ color: colors.gray800 }}>
            Your password has been successfully reset. Redirecting to login...
          </p>
          <div className="mt-6">
            <Link 
              href="/login" 
              className="font-medium text-sm"
              style={{ color: colors.goldenMustard }}
            >
              Go to Login immediately
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: colors.gray100 }}
      >
        <div className="max-w-md w-full space-y-8 text-center bg-white p-8 rounded-2xl shadow-lg">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: colors.orange + '20' }}
          >
            <AlertCircle className="w-8 h-8" style={{ color: colors.orange }} />
          </div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: colors.darkNavy }}>Invalid Reset Link</h2>
          <p style={{ color: colors.gray800 }}>
            This password reset link is invalid, expired, or has already been used.
          </p>
          <div className="mt-6 space-y-4">
            <Button
              onClick={() => router.push('/forgot-password')}
              className="w-full py-3 rounded-lg font-semibold"
              style={{ 
                backgroundColor: colors.goldenMustard,
                color: colors.darkNavy
              }}
            >
              Request New Reset Link
            </Button>
            <Link 
              href="/login" 
              className="block font-medium text-sm"
              style={{ color: colors.goldenMustard }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{ backgroundColor: colors.gray100 }}
    >
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: colors.blue + '20' }}
          >
            <Lock className="w-8 h-8" style={{ color: colors.blue }} />
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ color: colors.darkNavy }}>Set New Password</h2>
          <p className="flex items-center justify-center" style={{ color: colors.gray800 }}>
            <Mail className="w-4 h-4 mr-2" />
            {userEmail}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.darkNavy }}>
              New Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 z-10" style={{ color: colors.gray400 }} />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                {...form.register('password')}
                className="pl-10 pr-10 py-3 w-full rounded-lg"
                style={{ borderColor: colors.gray400 }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                style={{ color: colors.gray400 }}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm mt-1" style={{ color: colors.orange }}>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.darkNavy }}>
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 z-10" style={{ color: colors.gray400 }} />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                {...form.register('confirmPassword')}
                className="pl-10 pr-10 py-3 w-full rounded-lg"
                style={{ borderColor: colors.gray400 }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                style={{ color: colors.gray400 }}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {form.formState.errors.confirmPassword && (
              <p className="text-sm mt-1" style={{ color: colors.orange }}>
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full py-3 rounded-lg font-semibold transition-all duration-300"
            style={{ 
              backgroundColor: colors.goldenMustard,
              color: colors.darkNavy
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>

        <div className="text-center pt-4 border-t" style={{ borderColor: colors.gray400 }}>
          <p className="text-sm" style={{ color: colors.gray800 }}>
            Remember your password?{' '}
            <Link 
              href="/login" 
              className="font-medium transition-colors"
              style={{ color: colors.goldenMustard }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}