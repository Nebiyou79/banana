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
import { colors } from '@/utils/color';

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
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: colors.gray100 }}
      >
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
      <div 
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: colors.gray100 }}
      >
        <div className="max-w-md w-full space-y-8 text-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: colors.teal + '20' }}
          >
            <CheckCircle className="w-8 h-8" style={{ color: colors.teal }} />
          </div>
          <h2 className="text-2xl font-bold" style={{ color: colors.darkNavy }}>Check Your Email</h2>
          <p style={{ color: colors.gray800 }}>
            We`ve sent password reset instructions to your email address
          </p>
          <Link 
            href="/login" 
            className="font-medium block mt-4"
            style={{ color: colors.goldenMustard }}
          >
            Back to Login
          </Link>
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
        <div>
          <Link 
            href="/login" 
            className="flex items-center mb-6"
            style={{ color: colors.gray800 }}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to login
          </Link>
          <h2 className="text-2xl font-bold text-center" style={{ color: colors.darkNavy }}>Reset Password</h2>
          <p className="text-center mt-2" style={{ color: colors.gray800 }}>
            Enter your email to receive reset instructions
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.darkNavy }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5" style={{ color: colors.gray400 }} />
              <Input
                type="email"
                placeholder="Enter your email"
                {...form.register('email')}
                className="pl-10 pr-4 py-3 w-full"
                style={{ borderColor: colors.gray400 }}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm mt-1" style={{ color: colors.orange }}>
                {form.formState.errors.email.message}
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
                Sending...
              </>
            ) : (
              'Send Reset Instructions'
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm" style={{ color: colors.gray800 }}>
            Remember your password?{' '}
            <Link 
              href="/login" 
              className="font-medium"
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