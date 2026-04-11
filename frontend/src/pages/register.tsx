/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Loader2, Briefcase, ArrowRight,
  CheckCircle, Shield, Zap, User, Mail, Lock, Check,
  Gift, Percent, Coins, Clock, XCircle, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { Input } from '@/components/ui/Input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import OTPVerification from '@/components/auth/OTPVerification';
import { SleekButton } from '@/components/ui/SleekButton';
import { colors, lightTheme, darkTheme, colorClasses } from '@/utils/color';
import { promoCodeService } from '@/services/promoCodeService';
import { motion, AnimatePresence } from 'framer-motion';

// Updated schema with promoCode field
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  role: z.enum(['candidate', 'freelancer', 'company', 'organization']),
  promoCode: z.string().optional().nullable(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface PromoCodeBenefits {
  discountPercentage: number;
  rewardPoints: number;
  cashback: number;
  freeMonths: number;
  customReward?: string;
}

interface ValidatedPromo {
  code: string;
  benefits: PromoCodeBenefits;
  referrer: {
    id: string;
    name: string;
    code: string;
  };
  expiresAt: string;
}

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // NEW: Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [validatedPromo, setValidatedPromo] = useState<ValidatedPromo | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoTouched, setPromoTouched] = useState(false);
  const [showPromoBenefits, setShowPromoBenefits] = useState(false);

  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const { toast } = useToast();

  // Theme-based styles
  const theme = {
    bg: {
      primary: lightTheme.bg.primary,
      secondary: lightTheme.bg.secondary,
      surface: lightTheme.bg.surface,
      card: lightTheme.bg.primary,
      input: lightTheme.bg.secondary,
    },
    text: {
      primary: lightTheme.text.primary,
      secondary: lightTheme.text.secondary,
      muted: lightTheme.text.muted,
      inverse: lightTheme.text.inverse,
    },
    border: {
      default: lightTheme.border.secondary,
      primary: lightTheme.border.primary,
    }
  };

  // Check URL for promo code on mount
  useEffect(() => {
    const urlPromoCode = router.query.ref as string;
    if (urlPromoCode) {
      setPromoCode(urlPromoCode);
      validatePromoCode(urlPromoCode);
    }
  }, [router.query.ref]);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  // NEW: Validate promo code
  const validatePromoCode = async (code: string) => {
    if (!code || code.length < 3) {
      setPromoError(null);
      setValidatedPromo(null);
      return;
    }

    setValidatingPromo(true);
    setPromoError(null);
    setPromoTouched(true);

    try {
      const result = await promoCodeService.validatePromoCode(code);

      if (result.success && result.data) {
        setValidatedPromo({
          code: result.data.code,
          benefits: result.data.benefits,
          referrer: result.data.referrer,
          expiresAt: result.data.expiresAt
        });
        setPromoError(null);

        // Show success toast
        toast({
          title: 'Valid Promo Code! 🎉',
          description: `You'll get ${result.data.benefits.discountPercentage}% off and ${result.data.benefits.rewardPoints} bonus points!`,
          variant: 'success',
        });
      } else {
        setValidatedPromo(null);
        setPromoError(result.message || 'Invalid promo code');
      }
    } catch (error: any) {
      setValidatedPromo(null);
      setPromoError(error.message || 'Error validating promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  // Debounced promo code validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (promoCode && promoTouched) {
        validatePromoCode(promoCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [promoCode, promoTouched]);

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      if (!values.role) {
        toast({
          title: 'Role Required',
          description: 'Please select what you want to do on our platform',
          variant: 'destructive',
        });
        return;
      }

      if (!acceptedTerms) {
        toast({
          title: 'Terms Required',
          description: 'Please accept the Terms of Service and Privacy Policy',
          variant: 'destructive',
        });
        return;
      }

      // Include validated promo code in registration
      const registrationData = {
        ...values,
        promoCode: validatedPromo?.code || promoCode || null
      };

      const result = await registerUser(registrationData);

      if (result.data?.requiresVerification) {
        setVerificationEmail(values.email);
        setRequiresVerification(true);
        toast({
          title: 'Verification Required',
          description: 'Please check your email for the verification code',
        });
        return;
      }

      toast({
        variant: "success",
        title: 'Welcome to Banana!',
        description: validatedPromo
          ? `Account created successfully with promo code benefits!`
          : 'Account created successfully',
      });

      if (values.role === 'company') {
        router.push('/dashboard/company/profile');
      } else {
        const dashboardPath = `/dashboard/${values.role}`;
        router.push(dashboardPath);
      }

    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message.includes('already exists')) {
        toast({
          title: 'Account Exists',
          description: 'An account with this email already exists. Please sign in instead.',
          variant: 'destructive',
        });
      } else if (error.message.includes('verification')) {
        setVerificationEmail(form.getValues('email'));
        setRequiresVerification(true);
        toast({
          title: 'Verification Required',
          description: 'Please check your email for the verification code',
        });
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        toast({
          title: 'Connection Error',
          description: 'Cannot connect to server. Please check your internet connection.',
          variant: 'destructive',
        });
      } else if (error.message.includes('promo code')) {
        toast({
          title: 'Promo Code Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Failed',
          description: error.message || 'Failed to create account. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
      promoCode: '',
    },
  });

if (requiresVerification) {
  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 sm:px-6 ${colorClasses.bg.secondary}`}
    >
      <div className="w-full">
        <OTPVerification
          email={verificationEmail}
          onBack={() => setRequiresVerification(false)}
        />
      </div>
    </div>
  );
}

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: theme.bg.secondary }}
    >
      {/* Left Side - Brand Showcase */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: colors.darkNavy }}
      >
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-between items-center px-16 py-18 w-full">          {/* Logo */}
          <div className="w-full flex justify-center">
            <div
              className="rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: colors.white }}
            >
              <Image
                src="/logo.png"
                alt="Banana"
                width={140}
                height={140}
                className="rounded-lg object-contain"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center items-center text-center max-w-2xl">
            <div className="mb-12">
              <div
                className="inline-flex items-center backdrop-blur-sm rounded-full px-4 py-2 mb-6 border shadow-sm"
                style={{
                  backgroundColor: 'rgba(10, 37, 64, 0.8)',
                  borderColor: colors.gold
                }}
              >
                <Zap className="w-4 h-4 mr-2" style={{ color: colors.gold }} />
                <span className="text-sm font-medium" style={{ color: colors.white }}>
                  Fastest growing platform
                </span>
              </div>
              <h1
                className="text-5xl font-bold mb-6 leading-tight"
                style={{ color: colors.white }}
              >
                Launch Your <br />
                <span style={{ color: colors.gold }}>Career Journey</span>
              </h1>
              <p
                className="text-xl mb-12 max-w-md leading-relaxed font-light"
                style={{ color: colors.gray400 }}
              >
                Join professionals who are shaping the future of work
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6 mb-12 max-w-md">
              {[
                { icon: CheckCircle, text: 'Empowering You To Work, Win and Shine' },
                { icon: CheckCircle, text: 'Global network of companies' },
                { icon: CheckCircle, text: 'Personalized career coaching' },
                { icon: CheckCircle, text: 'Skill development resources' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-4 group">
                  <benefit.icon
                    className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform"
                    style={{ color: colors.gold }}
                  />
                  <span
                    className="text-lg group-hover:text-gold transition-colors font-medium"
                    style={{ color: colors.white }}
                  >
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div
              className="flex items-center space-x-2 backdrop-blur-sm rounded-2xl p-4 border shadow-sm"
              style={{
                backgroundColor: 'rgba(10, 37, 64, 0.8)',
                borderColor: colors.teal
              }}
            >
              <Shield className="w-5 h-5" style={{ color: colors.teal }} />
              <span className="text-sm font-medium" style={{ color: colors.teal }}>
                Your data is always secure
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex pt-9 justify-between items-center text-sm">
              <p style={{ color: colors.gray400 }}>© 2024 Banana. All rights reserved.</p>
              <div className="flex space-x-4">
                <span
                  className="cursor-pointer transition-colors font-medium hover:text-white"
                  style={{ color: colors.gray400 }}
                >
                  Privacy
                </span>
                <span
                  className="cursor-pointer transition-colors font-medium hover:text-white"
                  style={{ color: colors.gray400 }}
                >
                  Terms
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-start justify-center px-4 sm:px-6 lg:px-16 py-12 overflow-y-auto min-h-screen">
        <div className="w-full max-w-2xl">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center items-center mt-4 mb-10">
            <div
              className="rounded-2xl px-6 py-5 shadow-lg border backdrop-blur-sm flex items-center space-x-4"
              style={{
                backgroundColor: theme.bg.card,
                borderColor: theme.border.default
              }}
            >
              {/* Logo Container */}
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shadow-md"
                style={{ backgroundColor: theme.bg.primary }}
              >
                <Image
                  src="/logo.png"
                  alt="Banana"
                  width={60}
                  height={60}
                  className="object-contain rounded-xl"
                />
              </div>

              {/* Brand Text */}
              <div className="flex flex-col">
                <span
                  className="text-2xl font-bold"
                  style={{ color: theme.text.primary }}
                >
                  Banana
                </span>
                <span
                  className="text-sm font-medium"
                  style={{ color: theme.text.muted }}
                >
                  Connect • Grow • Succeed
                </span>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-3"
              style={{ color: theme.text.primary }}
            >
              Join Banana
            </h1>
            <p
              className="font-medium"
              style={{ color: theme.text.secondary }}
            >
              Create your account and unlock new opportunities
            </p>
          </div>

          {/* Form Card */}
          <div
            className="rounded-2xl p-8 shadow-xl border backdrop-blur-sm"
            style={{
              backgroundColor: theme.bg.card,
              borderColor: theme.border.default
            }}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: theme.text.secondary }}
                      >
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                            style={{ color: theme.text.muted }}
                          />
                          <Input
                            placeholder="Enter your full name"
                            disabled={isLoading}
                            style={{
                              backgroundColor: theme.bg.surface,
                              borderColor: theme.border.default,
                              color: theme.text.primary,
                              paddingLeft: '2.75rem',
                              paddingRight: '1rem',
                              paddingTop: '0.75rem',
                              paddingBottom: '0.75rem',
                              height: '3rem',
                              borderRadius: '0.75rem',
                              fontSize: '1rem',
                              width: '100%',
                              outline: 'none',
                              transition: 'all 0.2s'
                            }}
                            className="focus:ring-2 focus:ring-offset-0"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors.goldenMustard;
                              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.goldenMustard}40`;
                            }}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage
                        className="text-sm font-medium mt-1"
                        style={{ color: colors.red }}
                      />
                    </FormItem>
                  )}
                />

                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: theme.text.secondary }}
                      >
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                            style={{ color: theme.text.muted }}
                          />
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            style={{
                              backgroundColor: theme.bg.surface,
                              borderColor: theme.border.default,
                              color: theme.text.primary,
                              paddingLeft: '2.75rem',
                              paddingRight: '1rem',
                              paddingTop: '0.75rem',
                              paddingBottom: '0.75rem',
                              height: '3rem',
                              borderRadius: '0.75rem',
                              fontSize: '1rem',
                              width: '100%',
                              outline: 'none',
                              transition: 'all 0.2s'
                            }}
                            className="focus:ring-2 focus:ring-offset-0"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors.goldenMustard;
                              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.goldenMustard}40`;
                            }}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage
                        className="text-sm font-medium mt-1"
                        style={{ color: colors.red }}
                      />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: theme.text.secondary }}
                      >
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                            style={{ color: theme.text.muted }}
                          />
                          <Input
                            placeholder="Create a strong password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            style={{
                              backgroundColor: theme.bg.surface,
                              borderColor: theme.border.default,
                              color: theme.text.primary,
                              paddingLeft: '2.75rem',
                              paddingRight: '2.75rem',
                              paddingTop: '0.75rem',
                              paddingBottom: '0.75rem',
                              height: '3rem',
                              borderRadius: '0.75rem',
                              fontSize: '1rem',
                              width: '100%',
                              outline: 'none',
                              transition: 'all 0.2s'
                            }}
                            className="focus:ring-2 focus:ring-offset-0"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors.goldenMustard;
                              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.goldenMustard}40`;
                            }}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setPasswordStrength(checkPasswordStrength(e.target.value));
                            }}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" style={{ color: theme.text.muted }} />
                            ) : (
                              <Eye className="h-5 w-5" style={{ color: theme.text.muted }} />
                            )}
                          </button>
                        </div>
                      </FormControl>

                      {/* Password Strength Indicator */}
                      {form.watch('password') && (
                        <div className="mt-3">
                          <div className="flex space-x-1 mb-2">
                            {[1, 2, 3, 4].map((i) => {
                              const strengthColors = [
                                colors.red,
                                colors.orange,
                                colors.amber,
                                colors.green
                              ];
                              return (
                                <div
                                  key={i}
                                  className="h-2 flex-1 rounded-full transition-all duration-300"
                                  style={{
                                    backgroundColor: i <= passwordStrength
                                      ? strengthColors[passwordStrength - 1]
                                      : theme.border.default,
                                    opacity: i <= passwordStrength ? 1 : 0.3
                                  }}
                                />
                              );
                            })}
                          </div>
                          <p
                            className="text-xs font-medium"
                            style={{ color: theme.text.muted }}
                          >
                            {passwordStrength === 0 && 'Very weak'}
                            {passwordStrength === 1 && 'Weak'}
                            {passwordStrength === 2 && 'Fair'}
                            {passwordStrength === 3 && 'Good'}
                            {passwordStrength === 4 && 'Strong'}
                          </p>
                        </div>
                      )}
                      <FormMessage
                        className="text-sm font-medium mt-1"
                        style={{ color: colors.red }}
                      />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: theme.text.secondary }}
                      >
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                            style={{ color: theme.text.muted }}
                          />
                          <Input
                            placeholder="Confirm your password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            style={{
                              backgroundColor: theme.bg.surface,
                              borderColor: theme.border.default,
                              color: theme.text.primary,
                              paddingLeft: '2.75rem',
                              paddingRight: '2.75rem',
                              paddingTop: '0.75rem',
                              paddingBottom: '0.75rem',
                              height: '3rem',
                              borderRadius: '0.75rem',
                              fontSize: '1rem',
                              width: '100%',
                              outline: 'none',
                              transition: 'all 0.2s'
                            }}
                            className="focus:ring-2 focus:ring-offset-0"
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = colors.goldenMustard;
                              e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.goldenMustard}40`;
                            }}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" style={{ color: theme.text.muted }} />
                            ) : (
                              <Eye className="h-5 w-5" style={{ color: theme.text.muted }} />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage
                        className="text-sm font-medium mt-1"
                        style={{ color: colors.red }}
                      />
                    </FormItem>
                  )}
                />

                {/* Promo Code Field */}
                <FormItem>
                  <FormLabel
                    className="text-sm font-semibold flex items-center justify-between mb-2"
                    style={{ color: theme.text.secondary }}
                  >
                    <span>Promo Code (Optional)</span>
                    {validatingPromo && (
                      <Loader2
                        className="h-4 w-4 animate-spin"
                        style={{ color: colors.goldenMustard }}
                      />
                    )}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Gift
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                        style={{ color: theme.text.muted }}
                      />
                      <Input
                        placeholder="Enter promo code"
                        value={promoCode}
                        onChange={(e) => {
                          setPromoCode(e.target.value.toUpperCase());
                          setPromoTouched(true);
                          if (!e.target.value) {
                            setValidatedPromo(null);
                            setPromoError(null);
                          }
                        }}
                        disabled={isLoading || validatingPromo}
                        style={{
                          backgroundColor: theme.bg.surface,
                          borderColor: promoError
                            ? colors.red
                            : validatedPromo
                              ? colors.green
                              : theme.border.default,
                          color: theme.text.primary,
                          paddingLeft: '2.75rem',
                          paddingRight: '2.75rem',
                          paddingTop: '0.75rem',
                          paddingBottom: '0.75rem',
                          height: '3rem',
                          borderRadius: '0.75rem',
                          fontSize: '1rem',
                          width: '100%',
                          outline: 'none',
                          transition: 'all 0.2s'
                        }}
                        className="focus:ring-2 focus:ring-offset-0"
                        onFocus={(e) => {
                          if (!promoError && !validatedPromo) {
                            e.currentTarget.style.borderColor = colors.goldenMustard;
                            e.currentTarget.style.boxShadow = `0 0 0 2px ${colors.goldenMustard}40`;
                          }
                        }}
                        onBlur={(e) => {
                          if (!promoError && !validatedPromo) {
                            e.currentTarget.style.borderColor = theme.border.default;
                            e.currentTarget.style.boxShadow = 'none';
                          }
                        }}
                      />
                      {validatedPromo && (
                        <Check
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                          style={{ color: colors.green }}
                        />
                      )}
                      {promoError && (
                        <XCircle
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5"
                          style={{ color: colors.red }}
                        />
                      )}
                    </div>
                  </FormControl>

                  {/* Promo Code Validation Result */}
                  <AnimatePresence>
                    {validatedPromo && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-4 rounded-xl border"
                        style={{
                          backgroundColor: `${colors.green}10`,
                          borderColor: colors.green
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center">
                            <Gift
                              className="h-5 w-5 mr-2"
                              style={{ color: colors.green }}
                            />
                            <span
                              className="font-bold"
                              style={{ color: colors.green }}
                            >
                              Valid Promo Code!
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowPromoBenefits(!showPromoBenefits)}
                            className="text-sm font-medium hover:underline"
                            style={{ color: colors.blue }}
                          >
                            {showPromoBenefits ? 'Hide details' : 'View benefits'}
                          </button>
                        </div>

                        <AnimatePresence>
                          {showPromoBenefits && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 mt-3 overflow-hidden"
                            >
                              <div className="grid grid-cols-2 gap-2">
                                {validatedPromo.benefits.discountPercentage > 0 && (
                                  <div
                                    className="p-2 rounded-lg"
                                    style={{
                                      backgroundColor: theme.bg.surface,
                                      borderColor: theme.border.default
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <Percent
                                        className="h-4 w-4 mr-2"
                                        style={{ color: colors.goldenMustard }}
                                      />
                                      <div>
                                        <div
                                          className="text-xs"
                                          style={{ color: theme.text.muted }}
                                        >
                                          Discount
                                        </div>
                                        <div
                                          className="font-bold"
                                          style={{ color: theme.text.primary }}
                                        >
                                          {validatedPromo.benefits.discountPercentage}% OFF
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {validatedPromo.benefits.rewardPoints > 0 && (
                                  <div
                                    className="p-2 rounded-lg"
                                    style={{
                                      backgroundColor: theme.bg.surface,
                                      borderColor: theme.border.default
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <Coins
                                        className="h-4 w-4 mr-2"
                                        style={{ color: colors.goldenMustard }}
                                      />
                                      <div>
                                        <div
                                          className="text-xs"
                                          style={{ color: theme.text.muted }}
                                        >
                                          Bonus Points
                                        </div>
                                        <div
                                          className="font-bold"
                                          style={{ color: theme.text.primary }}
                                        >
                                          +{validatedPromo.benefits.rewardPoints} pts
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {validatedPromo.benefits.cashback > 0 && (
                                  <div
                                    className="p-2 rounded-lg"
                                    style={{
                                      backgroundColor: theme.bg.surface,
                                      borderColor: theme.border.default
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <Gift
                                        className="h-4 w-4 mr-2"
                                        style={{ color: colors.goldenMustard }}
                                      />
                                      <div>
                                        <div
                                          className="text-xs"
                                          style={{ color: theme.text.muted }}
                                        >
                                          Cashback
                                        </div>
                                        <div
                                          className="font-bold"
                                          style={{ color: theme.text.primary }}
                                        >
                                          ${validatedPromo.benefits.cashback}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {validatedPromo.benefits.freeMonths > 0 && (
                                  <div
                                    className="p-2 rounded-lg"
                                    style={{
                                      backgroundColor: theme.bg.surface,
                                      borderColor: theme.border.default
                                    }}
                                  >
                                    <div className="flex items-center">
                                      <Clock
                                        className="h-4 w-4 mr-2"
                                        style={{ color: colors.goldenMustard }}
                                      />
                                      <div>
                                        <div
                                          className="text-xs"
                                          style={{ color: theme.text.muted }}
                                        >
                                          Free Months
                                        </div>
                                        <div
                                          className="font-bold"
                                          style={{ color: theme.text.primary }}
                                        >
                                          {validatedPromo.benefits.freeMonths} months
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div
                                className="text-xs mt-2"
                                style={{ color: theme.text.muted }}
                              >
                                Referred by: <span className="font-semibold" style={{ color: theme.text.secondary }}>{validatedPromo.referrer.name}</span>
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: theme.text.muted }}
                              >
                                Expires: {new Date(validatedPromo.expiresAt).toLocaleDateString()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}

                    {promoError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-3 p-3 rounded-xl border"
                        style={{
                          backgroundColor: `${colors.red}10`,
                          borderColor: colors.red
                        }}
                      >
                        <div className="flex items-center">
                          <AlertCircle
                            className="h-5 w-5 mr-2"
                            style={{ color: colors.red }}
                          />
                          <span
                            className="text-sm font-medium"
                            style={{ color: colors.red }}
                          >
                            {promoError}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </FormItem>

                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        className="text-sm font-semibold mb-2 block"
                        style={{ color: theme.text.secondary }}
                      >
                        I want to be a... <span style={{ color: colors.red }}>*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <div className="relative">
                            <Briefcase
                              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 h-5 w-5"
                              style={{ color: theme.text.muted }}
                            />
                            <SelectTrigger
                              className="w-full h-12 rounded-xl text-base backdrop-blur-sm"
                              style={{
                                backgroundColor: theme.bg.surface,
                                borderColor: theme.border.default,
                                color: theme.text.primary,
                                paddingLeft: '2.75rem',
                                paddingRight: '1rem'
                              }}
                            >
                              <SelectValue placeholder="Choose Your Role" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent
                          className="border rounded-xl shadow-lg"
                          style={{
                            backgroundColor: theme.bg.card,
                            borderColor: theme.border.default
                          }}
                        >
                          {['candidate', 'freelancer', 'company', 'organization'].map((role) => (
                            <SelectItem
                              key={role}
                              value={role}
                              className="text-base py-3 cursor-pointer"
                              style={{
                                color: theme.text.primary,
                                backgroundColor: 'transparent'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = theme.bg.surface;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage
                        className="text-sm font-medium mt-1"
                        style={{ color: colors.red }}
                      />
                    </FormItem>
                  )}
                />

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-3">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="sr-only"
                      required
                    />
                    <label
                      htmlFor="terms"
                      className="w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 cursor-pointer"
                      style={{
                        backgroundColor: acceptedTerms ? colors.goldenMustard : theme.bg.surface,
                        borderColor: acceptedTerms ? colors.goldenMustard : theme.border.default
                      }}
                    >
                      {acceptedTerms && (
                        <Check className="w-3 h-3" style={{ color: colors.white }} />
                      )}
                    </label>
                  </div>
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium cursor-pointer"
                    style={{ color: theme.text.secondary }}
                  >
                    I agree to the{' '}
                    <Link
                      href="/terms"
                      className="font-semibold hover:underline"
                      style={{ color: colors.blue }}
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link
                      href="/privacy"
                      className="font-semibold hover:underline"
                      style={{ color: colors.blue }}
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <SleekButton
                  type="submit"
                  className="w-full h-12 rounded-xl text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
                  style={{
                    backgroundColor: colors.goldenMustard,
                    color: colors.white,
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                  disabled={isLoading}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      {validatedPromo ? 'Create Account with Benefits' : 'Create Account'}
                      <ArrowRight
                        className={`ml-2 h-5 w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`}
                        style={{ color: colors.white }}
                      />
                    </>
                  )}
                </SleekButton>

                {validatedPromo && (
                  <p
                    className="text-xs text-center mt-2"
                    style={{ color: colors.green }}
                  >
                    ✓ Promo code applied! You`ll receive {validatedPromo.benefits.rewardPoints} bonus points after verification.
                  </p>
                )}
              </form>
            </Form>
          </div>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p style={{ color: theme.text.secondary }}>
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold transition-colors hover:underline"
                style={{ color: colors.goldenMustard }}
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
            <p
              className="text-sm font-medium"
              style={{ color: theme.text.muted }}
            >
              © 2024 Banana. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* Placeholder styles for dark mode */
        input::placeholder, textarea::placeholder {
          color: ${lightTheme.text.muted};
          opacity: 0.7;
        }

        input:disabled, textarea:disabled, select:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Dark mode overrides */
        @media (prefers-color-scheme: dark) {
          input, textarea, select {
            background-color: ${darkTheme.bg.secondary} !important;
            border-color: ${darkTheme.border.secondary} !important;
            color: ${darkTheme.text.primary} !important;
          }

          input::placeholder, textarea::placeholder {
            color: ${darkTheme.text.muted} !important;
            opacity: 0.7;
          }

          input:focus, textarea:focus, select:focus {
            border-color: ${colors.gold} !important;
            box-shadow: 0 0 0 2px ${colors.gold}40 !important;
          }

          select option {
            background-color: ${darkTheme.bg.secondary};
            color: ${darkTheme.text.primary};
          }

          [data-radix-popper-content-wrapper] {
            background-color: ${darkTheme.bg.green} !important;
            border-color: ${darkTheme.border.secondary} !important;
          }

          [data-radix-select-item][data-highlighted] {
            background-color: ${darkTheme.bg.surface} !important;
          }

          .dark-bg-secondary {
            background-color: ${darkTheme.bg.secondary} !important;
          }

          .dark-text-primary {
            color: ${darkTheme.text.primary} !important;
          }

          .dark-text-secondary {
            color: ${darkTheme.text.secondary} !important;
          }

          .dark-text-muted {
            color: ${darkTheme.text.muted} !important;
          }

          .dark-border {
            border-color: ${darkTheme.border.secondary} !important;
          }
        }
      `}</style>
    </div>
  );
}