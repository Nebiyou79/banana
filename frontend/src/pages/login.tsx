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
  Mail, Lock
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
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

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
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const { theme, systemTheme } = useTheme();
  const currentTheme = theme === 'system' ? systemTheme : theme;

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
          title: 'Welcome back!',
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
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <OTPVerification
          email={verificationEmail}
          onBack={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900 dark:bg-gray-950">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-between items-center px-16 py-12">
          {/* Logo */}
          <div className="pl-12 flex items-center space-x-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center shadow-lg transition-colors duration-200">
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
          <div className="pt-5 pl-15 flex-1 flex flex-col justify-center items-center text-center">
            <div className="mb-12">
              <div className="inline-flex items-center rounded-full px-4 py-2 mb-6 border shadow-sm backdrop-blur-sm bg-gray-900/50 dark:bg-gray-800/50 border-amber-500/30 dark:border-amber-400/30">
                <Sparkles className="w-4 h-4 mr-2 text-amber-500 dark:text-amber-400" />
                <span className="text-sm font-medium text-white">Trusted by 100K+ professionals</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Connect with Your <br />
                <span className="text-amber-500 dark:text-amber-400">
                  Dream Career
                </span>
              </h1>
              <p className="text-xl mb-12 max-w-md leading-relaxed font-light text-gray-400">
                Where talent meets opportunity in the world's most innovative platform
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              {[
                { icon: Users, value: '100K+', label: 'Professionals', color: 'text-emerald-500' },
                { icon: Briefcase, value: '50K+', label: 'Active Jobs', color: 'text-blue-500' },
                { icon: Award, value: '95%', label: 'Success Rate', color: 'text-amber-500' }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3",
                      "border backdrop-blur-sm transition-all duration-300 shadow-lg",
                      "bg-gray-900/50 dark:bg-gray-800/50 border-gray-700 dark:border-gray-600",
                      "group-hover:border-emerald-500/30 dark:group-hover:border-emerald-400/30"
                    )}
                  >
                    <stat.icon className={cn("w-6 h-6 transition-colors", stat.color)} />
                  </div>
                  <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-sm mt-1 font-medium text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div
              className={cn(
                "flex items-center space-x-2 rounded-2xl p-4",
                "border backdrop-blur-sm shadow-sm",
                "bg-gray-900/50 dark:bg-gray-800/50",
                "border-emerald-500/30 dark:border-emerald-400/30"
              )}
            >
              <Shield className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400">
                Enterprise-grade security
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full pt-5">
            <div className="flex justify-between items-center text-sm">
              <p className="text-gray-400">© 2024 Banana. All rights reserved.</p>
              <div className="flex space-x-4">
                <span className="text-gray-400 hover:text-white cursor-pointer transition-colors font-medium">
                  Privacy
                </span>
                <span className="text-gray-400 hover:text-white cursor-pointer transition-colors font-medium">
                  Terms
                </span>
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
              className={cn(
                "rounded-2xl px-6 py-5 shadow-lg border backdrop-blur-sm",
                "flex items-center space-x-4",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700",
                "transition-colors duration-200"
              )}
            >
              {/* Logo Container */}
              <div
                className={cn(
                  "w-16 h-16 rounded-xl flex items-center justify-center shadow-md",
                  "bg-white dark:bg-gray-700 transition-colors duration-200"
                )}
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
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  Banana
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Connect • Grow • Succeed
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Sign in to continue your professional journey
            </p>
          </div>

          {/* Form Container */}
          <div
            className={cn(
              "rounded-2xl p-8 shadow-xl border backdrop-blur-sm",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700",
              "transition-colors duration-200"
            )}
          >
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900 dark:text-white">
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            className={cn(
                              "pl-12 pr-4 py-3 h-12 rounded-xl",
                              "focus:ring-2 transition-all duration-200 text-base",
                              "backdrop-blur-sm",
                              "bg-white dark:bg-gray-700",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                              "focus:border-amber-500 dark:focus:border-amber-400",
                              "focus:ring-amber-500/20 dark:focus:ring-amber-400/20",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 dark:text-red-400 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900 dark:text-white">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            disabled={isLoading}
                            className={cn(
                              "pl-12 pr-12 py-3 h-12 rounded-xl",
                              "focus:ring-2 transition-all duration-200 text-base",
                              "backdrop-blur-sm",
                              "bg-white dark:bg-gray-700",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                              "focus:border-amber-500 dark:focus:border-amber-400",
                              "focus:ring-amber-500/20 dark:focus:ring-amber-400/20",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 dark:text-red-400 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className={cn(
                        "rounded h-4 w-4 focus:ring-2 focus:ring-offset-2",
                        "border-gray-300 dark:border-gray-600",
                        "bg-white dark:bg-gray-700",
                        "text-amber-600 dark:text-amber-500",
                        "focus:ring-amber-500 dark:focus:ring-amber-400",
                        "focus:ring-offset-white dark:focus:ring-offset-gray-800"
                      )}
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Remember me
                    </span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <SleekButton
                  type="submit"
                  className={cn(
                    "w-full h-12 rounded-xl text-base font-semibold",
                    "text-white transition-all duration-300",
                    "shadow-lg hover:shadow-xl",
                    "bg-amber-600 hover:bg-amber-700",
                    "dark:bg-amber-500 dark:hover:bg-amber-600",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transform hover:scale-[1.02] active:scale-[0.98]"
                  )}
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
                      <ArrowRight className={cn(
                        "ml-2 h-5 w-5 transition-transform",
                        isHovered ? 'translate-x-1' : ''
                      )} />
                    </>
                  )}
                </SleekButton>
              </form>
            </Form>
          </div>

          <div className="mt-8 text-center">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Don't have an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                Join now
              </Link>
            </p>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              © 2024 Banana. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}