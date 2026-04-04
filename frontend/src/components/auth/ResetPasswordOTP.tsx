// src/components/auth/ResetPasswordOTP.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Loader2, ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/services/authService';
import Button from '@/components/forms/Button';
import { Input } from '@/components/ui/Input';
import { colors } from '@/utils/color';

interface ResetPasswordOTPProps {
  email: string;
  onBack: () => void;
  onSuccess: (resetToken: string, email: string) => void;
}

export default function ResetPasswordOTP({ email, onBack, onSuccess }: ResetPasswordOTPProps) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
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
      const result = await authService.verifyResetOTP({ email, otp });
      
      if (result.success && result.data) {
        onSuccess(result.data.resetToken, result.data.email);
        toast({
          title: 'OTP Verified!',
          description: 'You can now reset your password',
        });
      }
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
      await authService.forgotPassword({ email });
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

  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg">
      <button
        onClick={onBack}
        className="flex items-center mb-6 transition-colors"
        style={{ color: colors.gray800 }}
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to reset password
      </button>

      <div className="text-center mb-8">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: colors.blue + '20' }}
        >
          <Mail className="w-8 h-8" style={{ color: colors.blue }} />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.darkNavy }}>Verify Your Identity</h2>
        <p style={{ color: colors.gray800 }}>
          Enter the 6-digit code sent to{' '}
          <span className="font-semibold" style={{ color: colors.blue }}>{email}</span>
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: colors.darkNavy }}>
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
            style={{ borderColor: colors.gray400 }}
            required
            disabled={isLoading}
          />
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-lg font-semibold"
          style={{ 
            backgroundColor: colors.goldenMustard,
            color: colors.darkNavy
          }}
          disabled={isLoading || otp.length !== 6}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Verifying...
            </>
          ) : (
            'Verify Identity'
          )}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm" style={{ color: colors.gray800 }}>
          Didn`t receive the code?{' '}
          {countdown > 0 ? (
            <span style={{ color: colors.gray400 }}>
              Resend in {countdown}s
            </span>
          ) : (
            <button
              onClick={handleResendOTP}
              disabled={isResending}
              className="font-medium disabled:opacity-50"
              style={{ color: colors.goldenMustard }}
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