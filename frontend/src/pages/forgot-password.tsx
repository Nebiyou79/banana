/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/Input';
import Button from '@/components/forms/Button';
import { authService } from '@/services/authService';
import ResetPasswordOTP from '@/components/auth/ResetPasswordOTP';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const { toast } = useToast();
  const router = useRouter();
  const { getTouchTargetSize } = useResponsive();

  useAuthRedirect();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

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
        description: error.message || 'Failed to send reset email.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPSuccess = (token: string, email: string) => {
    router.push(`/reset-password?token=${token}&email=${encodeURIComponent(email)}`);
  };

  if (showOTP && userEmail) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${colorClasses.bg.secondary}`}>
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
      <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${colorClasses.bg.secondary}`}>
        <div className="max-w-md w-full text-center px-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colorClasses.bg.tealLight}`}>
            <CheckCircle className={`w-8 h-8 ${colorClasses.text.teal}`} />
          </div>

          <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${colorClasses.text.primary}`}>
            Check Your Email
          </h2>

          <p className={`${colorClasses.text.secondary}`}>
            We`ve sent password reset instructions to your email address
          </p>

          <Link href="/login" className={`block mt-4 font-medium ${colorClasses.text.goldenMustard}`}>
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${colorClasses.bg.secondary}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-lg p-6 sm:p-8 ${colorClasses.bg.primary}`}>
        {/* Back */}
        <Link
          href="/login"
          className={`flex items-center mb-6 ${colorClasses.text.secondary} hover:${colorClasses.text.primary} ${getTouchTargetSize('md')}`}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to login
        </Link>

        {/* Header */}
        <h2 className={`text-xl sm:text-2xl font-bold text-center ${colorClasses.text.primary}`}>
          Reset Password
        </h2>

        <p className={`text-center mt-2 ${colorClasses.text.secondary}`}>
          Enter your email to receive reset instructions
        </p>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6 mt-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${colorClasses.text.primary}`}>
              Email Address
            </label>

            <Input
              type="email"
              placeholder="Enter your email"
              {...form.register('email')}
              className="w-full h-12"
            />

            {form.formState.errors.email && (
              <p className={`text-sm mt-1 ${colorClasses.text.error}`}>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className={`w-full h-12 ${getTouchTargetSize('md')}`}
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

        {/* Footer */}
        <div className="text-center mt-6">
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