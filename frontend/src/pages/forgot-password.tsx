/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/Input';
import Button from '@/components/forms/Button';
import { authService } from '@/services/authService';
import ResetPasswordOTP from '@/components/auth/ResetPasswordOTP';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  // Use the auth redirect hook
  useAuthRedirect();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  // Check if user is already authenticated
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const userRole = localStorage.getItem('role') || 'candidate';
      router.push(`/dashboard/${userRole}`);
    }
  }, [router]);

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(values);
      setUserEmail(values.email);
      setEmailSent(true);
      setShowOTP(true);
      toast({
        title: 'OTP Sent',
        description: 'Check your email for verification code',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send reset email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = (token: string, email: string) => {
    setResetToken(token);
    // Redirect to reset password page with token
    router.push(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
  };

  if (showOTP && userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <ResetPasswordOTP 
          email={userEmail}
          onBack={() => setShowOTP(false)}
          onSuccess={handleOTPSuccess}
        />
      </div>
    );
  }

  if (emailSent && !showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check Your Email</h2>
          <p className="text-gray-600">
            We`ve sent password reset instructions to your email address
          </p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium block mt-4">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link href="/login" className="flex items-center text-gray-600 hover:text-gray-800 mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to login
          </Link>
          <h2 className="text-2xl font-bold text-gray-900 text-center">Reset Password</h2>
          <p className="text-gray-600 text-center mt-2">
            Enter your email to receive reset instructions
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="email"
                placeholder="Enter your email"
                {...form.register('email')}
                className="pl-10 pr-4 py-3 w-full"
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Remember your password?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}