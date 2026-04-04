/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Loader2,
  ArrowRight, Users, Briefcase,
  Award, Sparkles, Shield,
  Mail, Lock, Check
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
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import OTPVerification from '@/components/auth/OTPVerification';
import { SleekButton } from '@/components/ui/SleekButton';
import { colors, lightTheme, darkTheme } from '@/utils/color';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const response = await login(values);
      console.log('[LoginPage] login response:', response);

      const userData = response.data?.user || response.user;
      console.log('[LoginPage] userData:', userData);

      if (!userData) {
        throw new Error('No user data received from login');
      }

      console.log('[LoginPage] userData.role:', userData.role);

      if (userData.role === 'admin') {
        toast({
          variant: "success",
          title: 'Welcome Admin!',
          description: 'Redirecting to admin dashboard',
        });
        console.log('[LoginPage] Redirecting to /dashboard/admin');
        router.push('/dashboard/admin');
      } else {
        toast({
          variant: "success",
          title: 'Welcome Back!',
          description: 'Logged in successfully',
        });
        console.log(`[LoginPage] Redirecting to /dashboard/${userData.role}`);
        router.push(`/dashboard/${userData.role}`);
      }
    } catch (error: any) {
      console.error('[LoginPage] Login error:', error);

      if (error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        setVerificationEmail(values.email);
        setRequiresVerification(true);
        toast({
          title: 'Verification Required',
          description: 'Please verify your email first',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: error.message || 'An error occurred during login. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  if (requiresVerification) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
        style={{ backgroundColor: lightTheme.bg.secondary }}
      >
        <OTPVerification
          email={verificationEmail}
          onBack={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  // Theme-based styles
  const theme = {
    bg: {
      primary: lightTheme.bg.primary,
      secondary: lightTheme.bg.secondary,
      surface: lightTheme.bg.surface,
      card: lightTheme.bg.primary,
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
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>

        {/* Main Container - Fixed flex structure */}
        <div className="relative z-10 flex flex-col h-full w-full px-16 py-2">
          {/* Logo - Top aligned with proper spacing */}
          <div className="flex justify-center py-12">
            <div
              className="rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300"
              style={{ backgroundColor: colors.white }}
            >
              <Image
                src="/logo.png"
                alt="Banana"
                width={120}
                height={120}
                className="rounded-lg object-contain"
              />
            </div>
          </div>

          {/* Content - Centered vertically with flex-grow */}
          <div className="flex-1 flex flex-col justify-center items-center -mt-8">
            {/* Badge */}
            <div
              className="inline-flex items-center rounded-full px-4 py-2 mb-6 border shadow-sm backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(10, 37, 64, 0.8)',
                borderColor: colors.gold
              }}
            >
              <Sparkles className="w-4 h-4 mr-2" style={{ color: colors.gold }} />
              <span className="text-sm font-medium" style={{ color: colors.white }}>
                Trusted by 100K+ professionals
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-5xl font-bold mb-4 leading-tight text-center"
              style={{ color: colors.white }}
            >
              Connect with Your{' '}
              <span style={{ color: colors.gold }}>Dream Career</span>
            </h1>

            {/* Subheadline */}
            <p
              className="text-xl mb-10 max-w-md text-center leading-relaxed font-light"
              style={{ color: colors.gray400 }}
            >
              Where talent meets opportunity in the world's most innovative platform
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6 mb-10">
              {[
                { icon: Users, value: '100K+', label: 'Professionals', color: colors.teal },
                { icon: Briefcase, value: '50K+', label: 'Active Jobs', color: colors.blue },
                { icon: Award, value: '95%', label: 'Success Rate', color: colors.gold }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3 border backdrop-blur-sm transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:scale-105"
                    style={{
                      backgroundColor: 'rgba(10, 37, 64, 0.8)',
                      borderColor: colors.gray800
                    }}
                  >
                    <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                  </div>
                  <div
                    className="text-2xl font-bold mb-1 group-hover:scale-105 transition-transform"
                    style={{ color: colors.white }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: colors.gray400 }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div
              className="flex items-center space-x-2 rounded-2xl px-5 py-3 border backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300"
              style={{
                backgroundColor: 'rgba(10, 37, 64, 0.8)',
                borderColor: colors.teal
              }}
            >
              <Shield className="w-5 h-5" style={{ color: colors.teal }} />
              <span className="text-sm font-medium" style={{ color: colors.teal }}>
                Enterprise-grade security
              </span>
            </div>
          </div>

          {/* Footer - Bottom aligned */}
          <div className="pt-6">
            <div className="flex justify-between items-center text-sm">
              <p style={{ color: colors.gray400 }}>
                © 2024 Banana. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <button
                  className="cursor-pointer transition-colors font-medium hover:text-white"
                  style={{ color: colors.gray400 }}
                >
                  Privacy
                </button>
                <button
                  className="cursor-pointer transition-colors font-medium hover:text-white"
                  style={{ color: colors.gray400 }}
                >
                  Terms
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-16 py-12">
        <div className="w-full max-w-md">
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
              Welcome Back
            </h1>
            <p
              className="font-medium"
              style={{ color: theme.text.secondary }}
            >
              Sign in to continue your professional journey
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
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
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
                      <FormMessage
                        className="text-sm font-medium mt-1"
                        style={{ color: colors.red }}
                      />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className="w-4 h-4 rounded border flex items-center justify-center transition-all duration-200"
                        style={{
                          backgroundColor: rememberMe ? colors.goldenMustard : theme.bg.surface,
                          borderColor: rememberMe ? colors.goldenMustard : theme.border.default
                        }}
                      >
                        {rememberMe && (
                          <Check className="w-3 h-3" style={{ color: colors.white }} />
                        )}
                      </div>
                    </div>
                    <span
                      className="ml-3 text-sm font-medium"
                      style={{ color: theme.text.secondary }}
                    >
                      Remember me
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold transition-colors hover:underline"
                    style={{ color: colors.blue }}
                  >
                    Forgot password?
                  </Link>
                </div>

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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight
                        className={`ml-2 h-5 w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`}
                        style={{ color: colors.white }}
                      />
                    </>
                  )}
                </SleekButton>
              </form>
            </Form>
          </div>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p style={{ color: theme.text.secondary }}>
              Don't have an account?{' '}
              <Link
                href="/register"
                className="font-semibold transition-colors hover:underline"
                style={{ color: colors.goldenMustard }}
              >
                Join now
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
        input::placeholder {
          color: ${lightTheme.text.muted};
          opacity: 0.7;
        }

        input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Dark mode overrides */
        @media (prefers-color-scheme: dark) {
          input {
            background-color: ${darkTheme.bg.secondary} !important;
            border-color: ${darkTheme.border.secondary} !important;
            color: ${darkTheme.text.primary} !important;
          }

          input::placeholder {
            color: ${darkTheme.text.muted} !important;
            opacity: 0.7;
          }

          input:focus {
            border-color: ${colors.gold} !important;
            box-shadow: 0 0 0 2px ${colors.gold}40 !important;
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