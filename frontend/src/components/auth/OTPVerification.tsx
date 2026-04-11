/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, ArrowLeft, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import Button from '@/components/forms/Button';
import { Input } from '@/components/ui/Input';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';

interface OTPVerificationProps {
  email: string;
  onBack: () => void;
}

export default function OTPVerification({ email, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isVerified, setIsVerified] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { getTouchTargetSize } = useResponsive();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOTP({ email, otp });
      setIsVerified(true);

      toast({
        title: 'Email Verified!',
        description: 'Your account has been successfully verified',
      });

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      await authService.resendOTP(email);
      setCountdown(60);

      toast({
        title: 'OTP Sent',
        description: 'A new verification code has been sent to your email',
      });
    } catch (error: any) {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Please try again later',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return (
      <div className="w-full max-w-md mx-auto px-4 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colorClasses.bg.greenLight}`}>
          <CheckCircle className={`w-8 h-8 ${colorClasses.text.success}`} />
        </div>

        <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${colorClasses.text.primary}`}>
          Email Verified!
        </h2>

        <p className={`text-sm sm:text-base mb-6 ${colorClasses.text.secondary}`}>
          Your email has been successfully verified. Redirecting to login...
        </p>

        <Button onClick={() => router.push('/login')} className="w-full sm:w-auto">
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 sm:px-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className={`flex items-center mb-6 transition-colors ${colorClasses.text.secondary} hover:${colorClasses.text.primary} ${getTouchTargetSize('md')}`}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${colorClasses.bg.blueLight}`}>
          <Mail className={`w-6 h-6 sm:w-8 sm:h-8 ${colorClasses.text.blue}`} />
        </div>

        <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${colorClasses.text.primary}`}>
          Verify Your Email
        </h2>

        <p className={`text-sm sm:text-base ${colorClasses.text.secondary}`}>
          Enter the 6-digit code sent to{' '}
          <span className={`font-semibold break-all ${colorClasses.text.blue}`}>
            {email}
          </span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleVerify} className="space-y-5 sm:space-y-6">
        <div>
          <label className={`block text-sm font-medium mb-2 ${colorClasses.text.primary}`}>
            Verification Code
          </label>

          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit code"
            className="text-center text-lg sm:text-xl tracking-widest font-mono h-14 sm:h-16"
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className={`w-full h-12 ${getTouchTargetSize('md')}`}
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            'Verify Account'
          )}
        </Button>
      </form>

      {/* Resend */}
      <div className="mt-6 text-center">
        <p className={`text-sm ${colorClasses.text.secondary}`}>
          Didn`t receive the code?{' '}
          {countdown > 0 ? (
            <span className={colorClasses.text.muted}>
              Resend in {countdown}s
            </span>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className={`font-medium ${colorClasses.text.blue} hover:opacity-80 disabled:opacity-50 ${getTouchTargetSize('sm')}`}
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin inline mr-1" />
                  Sending...
                </>
              ) : (
                'Resend OTP'
              )}
            </button>
          )}
        </p>
      </div>
    </div>
  );
}