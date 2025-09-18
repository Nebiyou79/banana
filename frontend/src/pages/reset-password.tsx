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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Password Reset Successfully!</h2>
          <p className="text-gray-600 mt-4">
            Your password has been successfully reset. Redirecting to login...
          </p>
          <div className="mt-6">
            <Link 
              href="/login" 
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Invalid Reset Link</h2>
          <p className="text-gray-600 mt-4">
            This password reset link is invalid, expired, or has already been used.
          </p>
          <div className="mt-6 space-y-4">
            <Button
              onClick={() => router.push('/forgot-password')}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Request New Reset Link
            </Button>
            <Link 
              href="/login" 
              className="block text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Set New Password</h2>
          <p className="text-gray-600 mt-2 flex items-center justify-center">
            <Mail className="w-4 h-4 mr-2" />
            {userEmail}
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your new password"
                {...form.register('password')}
                className="pl-10 pr-10 py-3 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your new password"
                {...form.register('confirmPassword')}
                className="pl-10 pr-10 py-3 w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full py-3 rounded-lg text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
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

        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            Remember your password?{' '}
            <Link 
              href="/login" 
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}