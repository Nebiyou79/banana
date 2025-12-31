/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Loader2, Briefcase, ArrowRight,
  CheckCircle, Shield, Zap, User, Mail, Lock, Users, Building
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
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string(),
  role: z.enum(['candidate', 'freelancer', 'company', 'organization']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: undefined,
    },
  });

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

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

      const result = await registerUser(values);

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
        description: 'Account created successfully',
      });

      if (values.role === 'company') {
        router.push('/dashboard/company/profile');
      } else {
        router.push(`/dashboard/${values.role}`);
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
      } else {
        toast({
          title: 'Registration Failed',
          description: error.message || 'Failed to create account. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  if (requiresVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

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
          <div className="flex-1 flex pl-16 flex-col justify-center items-center text-center">
            <div className="mb-12">
              <div className={cn(
                "inline-flex items-center backdrop-blur-sm rounded-full px-4 py-2 mb-6",
                "border shadow-sm",
                "bg-gray-900/50 dark:bg-gray-800/50",
                "border-yellow-300/30 dark:border-yellow-400/30"
              )}>
                <Zap className="w-4 h-4 mr-2 text-yellow-300 dark:text-yellow-400" />
                <span className="text-white text-sm font-medium">Fastest growing platform</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Launch Your <br />
                <span className="bg-gradient-to-r from-cyan-400 to-yellow-300 dark:from-cyan-300 dark:to-yellow-200 bg-clip-text text-transparent">
                  Career Journey
                </span>
              </h1>
              <p className="text-xl text-gray-300 mb-12 max-w-md leading-relaxed font-light">
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
                  <benefit.icon className="w-6 h-6 text-yellow-300 dark:text-yellow-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="text-lg text-white group-hover:text-yellow-200 transition-colors font-medium">
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className={cn(
              "flex items-center space-x-2 backdrop-blur-sm rounded-2xl p-4",
              "border shadow-sm",
              "bg-gray-900/50 dark:bg-gray-800/50",
              "border-emerald-500/30 dark:border-emerald-400/30"
            )}>
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">Your data is always secure</span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex pt-9 justify-between items-center text-sm">
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

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-16 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center items-center mt-4 mb-10">
            <div className={cn(
              "rounded-2xl px-6 py-5 shadow-lg border backdrop-blur-sm",
              "flex items-center space-x-4",
              "bg-white dark:bg-gray-800",
              "border-gray-200 dark:border-gray-700",
              "transition-colors duration-200"
            )}>
              {/* Logo Container */}
              <div className={cn(
                "w-16 h-16 rounded-xl flex items-center justify-center shadow-md",
                "bg-white dark:bg-gray-700 transition-colors duration-200"
              )}>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Join Banana
            </h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Create your account and unlock new opportunities
            </p>
          </div>

          {/* Form Container */}
          <div className={cn(
            "rounded-2xl p-8 shadow-xl border backdrop-blur-sm",
            "bg-white dark:bg-gray-800",
            "border-gray-200 dark:border-gray-700",
            "transition-colors duration-200"
          )}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900 dark:text-white">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Enter your full name"
                            disabled={isLoading}
                            className={cn(
                              "pl-12 pr-4 py-3 h-12 rounded-xl",
                              "focus:ring-2 transition-all duration-200 text-base",
                              "backdrop-blur-sm",
                              "bg-white dark:bg-gray-700",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                              "focus:border-blue-500 dark:focus:border-blue-400",
                              "focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
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
                              "focus:border-blue-500 dark:focus:border-blue-400",
                              "focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
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
                            placeholder="Create a strong password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className={cn(
                              "pl-12 pr-12 py-3 h-12 rounded-xl",
                              "focus:ring-2 transition-all duration-200 text-base",
                              "backdrop-blur-sm",
                              "bg-white dark:bg-gray-700",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                              "focus:border-blue-500 dark:focus:border-blue-400",
                              "focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setPasswordStrength(checkPasswordStrength(e.target.value));
                            }}
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
                      {form.watch('password') && (
                        <div className="mt-3">
                          <div className="flex space-x-1 mb-2">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-2 flex-1 rounded-full transition-colors duration-300",
                                  i <= passwordStrength
                                    ? passwordStrength === 1 ? 'bg-red-400'
                                      : passwordStrength === 2 ? 'bg-orange-400'
                                        : passwordStrength === 3 ? 'bg-yellow-400'
                                          : 'bg-green-400'
                                    : 'bg-gray-200 dark:bg-gray-600'
                                )}
                              />
                            ))}
                          </div>
                          <p className={cn(
                            "text-xs font-medium",
                            passwordStrength === 0 ? 'text-red-500 dark:text-red-400'
                              : passwordStrength === 1 ? 'text-red-500 dark:text-red-400'
                                : passwordStrength === 2 ? 'text-orange-500 dark:text-orange-400'
                                  : passwordStrength === 3 ? 'text-yellow-500 dark:text-yellow-400'
                                    : 'text-green-500 dark:text-green-400'
                          )}>
                            {passwordStrength === 0 ? 'Very weak'
                              : passwordStrength === 1 ? 'Weak'
                                : passwordStrength === 2 ? 'Fair'
                                  : passwordStrength === 3 ? 'Good'
                                    : 'Strong'}
                          </p>
                        </div>
                      )}
                      <FormMessage className="text-red-500 dark:text-red-400 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900 dark:text-white">
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Confirm your password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className={cn(
                              "pl-12 pr-12 py-3 h-12 rounded-xl",
                              "focus:ring-2 transition-all duration-200 text-base",
                              "backdrop-blur-sm",
                              "bg-white dark:bg-gray-700",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
                              "focus:border-blue-500 dark:focus:border-blue-400",
                              "focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
                              "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
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

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900 dark:text-white">
                        I want to be a... <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                              <Briefcase className="h-5 w-5 text-gray-400" />
                            </div>
                            <SelectTrigger className={cn(
                              "pl-12 pr-4 py-3 h-12 rounded-xl text-base",
                              "bg-white dark:bg-gray-700",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "focus:border-blue-500 dark:focus:border-blue-400",
                              "focus:ring-blue-500/20 dark:focus:ring-blue-400/20",
                              "data-[placeholder]:text-gray-500 dark:data-[placeholder]:text-gray-400"
                            )}>
                              <SelectValue placeholder="Choose Your Role" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent className={cn(
                          "bg-white dark:bg-gray-800",
                          "border border-gray-200 dark:border-gray-700",
                          "rounded-xl shadow-lg"
                        )}>
                          {[
                            { value: 'candidate', label: 'Candidate', icon: User },
                            { value: 'freelancer', label: 'Freelancer', icon: Users },
                            { value: 'company', label: 'Company', icon: Building },
                            { value: 'organization', label: 'Organization', icon: Users }
                          ].map((role) => (
                            <SelectItem
                              key={role.value}
                              value={role.value}
                              className={cn(
                                "text-base py-3",
                                "text-gray-900 dark:text-gray-200",
                                "hover:bg-blue-50 dark:hover:bg-gray-700",
                                "focus:bg-blue-50 dark:focus:bg-gray-700",
                                "flex items-center gap-2"
                              )}
                            >
                              <role.icon className="w-4 h-4" />
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 dark:text-red-400 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className={cn(
                      "mt-1 rounded border-gray-300 dark:border-gray-600",
                      "text-blue-600 dark:text-blue-400",
                      "focus:ring-blue-500 dark:focus:ring-blue-400",
                      "h-4 w-4 flex-shrink-0",
                      "bg-white dark:bg-gray-700"
                    )}
                    required
                  />
                  <label htmlFor="terms" className="text-gray-700 dark:text-gray-300 text-sm font-medium">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <SleekButton
                  type="submit"
                  className={cn(
                    "w-full h-12 rounded-xl text-base font-semibold",
                    "text-white transition-all duration-300",
                    "shadow-lg hover:shadow-xl",
                    "bg-gradient-to-r from-blue-600 to-purple-600",
                    "dark:from-blue-500 dark:to-purple-500",
                    "hover:from-blue-700 hover:to-purple-700",
                    "dark:hover:from-blue-600 dark:hover:to-purple-600",
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
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
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              © 2024 Banana. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}