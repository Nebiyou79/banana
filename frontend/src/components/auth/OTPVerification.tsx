/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2, ArrowLeft, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import Button from '@/components/forms/Button';
import { Input } from '@/components/ui/Input';

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
      
      // Redirect to login after successful verification
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
      <div className="w-full max-w-md mx-auto text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
        <p className="text-gray-600 mb-6">
          Your email has been successfully verified. Redirecting to login...
        </p>
        <Button onClick={() => router.push('/login')}>
          Go to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </button>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
        <p className="text-gray-600">
          Enter the 6-digit code sent to{' '}
          <span className="font-semibold text-blue-600">{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="text-center text-xl tracking-widest font-mono h-16"
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12"
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

      <div className="mt-6 text-center">
        <p className="text-gray-600 text-sm">
          Didn`t receive the code?{' '}
          {countdown > 0 ? (
            <span className="text-gray-400">
              Resend in {countdown}s
            </span>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
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