/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/Input';
import Button from '@/components/forms/Button';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
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
  const { getTouchTargetSize } = useResponsive();

  useAuthRedirect();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (authService.isAuthenticated()) {
      const userRole = localStorage.getItem('role') || 'candidate';
      router.push(`/dashboard/${userRole}`);
      return;
    }

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

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ SUCCESS STATE
  if (isSuccess) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${colorClasses.bg.secondary}`}>
        <div className={`w-full max-w-md text-center rounded-2xl shadow-lg p-6 sm:p-8 ${colorClasses.bg.primary}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colorClasses.bg.tealLight}`}>
            <CheckCircle className={`w-8 h-8 ${colorClasses.text.teal}`} />
          </div>

          <h2 className={`text-xl sm:text-3xl font-bold mb-4 ${colorClasses.text.primary}`}>
            Password Reset Successfully!
          </h2>

          <p className={colorClasses.text.secondary}>
            Your password has been successfully reset. Redirecting...
          </p>

          <Link href="/login" className={`block mt-6 text-sm font-medium ${colorClasses.text.goldenMustard}`}>
            Go to Login immediately
          </Link>
        </div>
      </div>
    );
  }

  // ❌ INVALID TOKEN
  if (!isValidToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${colorClasses.bg.secondary}`}>
        <div className={`w-full max-w-md text-center rounded-2xl shadow-lg p-6 sm:p-8 ${colorClasses.bg.primary}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colorClasses.bg.orangeLight}`}>
            <AlertCircle className={`w-8 h-8 ${colorClasses.text.orange}`} />
          </div>

          <h2 className={`text-xl sm:text-3xl font-bold mb-4 ${colorClasses.text.primary}`}>
            Invalid Reset Link
          </h2>

          <p className={colorClasses.text.secondary}>
            This link is invalid, expired, or already used.
          </p>

          <div className="mt-6 space-y-4">
            <Button
              onClick={() => router.push('/forgot-password')}
              className={`w-full h-12 ${getTouchTargetSize('md')}`}
            >
              Request New Link
            </Button>

            <Link href="/login" className={`block text-sm font-medium ${colorClasses.text.goldenMustard}`}>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 🟢 MAIN FORM
  return (
    <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${colorClasses.bg.secondary}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-lg p-6 sm:p-8 ${colorClasses.bg.primary}`}>
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className={`text-xl sm:text-3xl font-bold mb-2 ${colorClasses.text.primary}`}>
            Set New Password
          </h2>

          <p className={`text-sm break-all ${colorClasses.text.secondary}`}>
            {userEmail}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
          {/* Password */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colorClasses.text.primary}`}>
              New Password
            </label>

            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                {...form.register('password')}
                className="w-full h-12 pr-12"
              />

              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${colorClasses.text.muted} ${getTouchTargetSize('sm')}`}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {form.formState.errors.password && (
              <p className={`text-sm mt-1 ${colorClasses.text.error}`}>
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${colorClasses.text.primary}`}>
              Confirm Password
            </label>

            <div className="relative">
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm password"
                {...form.register('confirmPassword')}
                className="w-full h-12 pr-12"
              />

              <button
                type="button"
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${colorClasses.text.muted} ${getTouchTargetSize('sm')}`}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {form.formState.errors.confirmPassword && (
              <p className={`text-sm mt-1 ${colorClasses.text.error}`}>
                {form.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className={`w-full h-12 ${getTouchTargetSize('md')}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className={`text-center pt-6 mt-6 border-t ${colorClasses.border.primary}`}>
          <p className={`text-sm ${colorClasses.text.secondary}`}>
            Remember your password?{' '}
            <Link href="/login" className={`font-medium ${colorClasses.text.goldenMustard}`}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}