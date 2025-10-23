// src/pages/register.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, EyeOff, Loader2, Briefcase, ArrowRight, 
  CheckCircle, Shield, Zap
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
      role: undefined, // Don't auto-select any role
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
      // Validate that role is selected
      if (!values.role) {
        toast({
          title: 'Role Required',
          description: 'Please select what you want to do on our platform',
          variant: 'destructive',
        });
        return;
      }

      const result = await registerUser(values);
      
      // Check if OTP verification is required
      if (result.data?.requiresVerification) {
        setVerificationEmail(values.email);
        setRequiresVerification(true);
        toast({
          title: 'Verification Required',
          description: 'Please check your email for the verification code',
        });
        return; // Stop here, don't redirect
      }

      // If we get here, it means registration was successful and user is logged in
      toast({
        variant: "success",
        title: 'Welcome to Banana!',
        description: 'Account created successfully',
      });

      if (values.role === 'company') {
        router.push('/dashboard/company/profile');
      } else {
        const dashboardPath = `/dashboard/${values.role}`;
        router.push(dashboardPath);
      }

    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific error cases with toast
      if (error.message.includes('already exists')) {
        toast({
          title: 'Account Exists',
          description: 'An account with this email already exists. Please sign in instead.',
          variant: 'destructive',
        });
      } else if (error.message.includes('verification')) {
        // This should be handled by the success case above, but just in case
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <OTPVerification 
          email={verificationEmail} 
          onBack={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-white via-blue-900 to-yellow-900">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-between items-center px-16 py-12">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Banana"
              width={120}
              height={120}
              className="rounded-lg object-contain"
            />
            <span className="text-3xl font-bold text-yellow-500">Banana</span>
          </div>

          {/* Content */}
          <div className="flex-1 flex pl-12 flex-col justify-center items-center text-center">
            <div className="mb-12">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20 shadow-sm">
                <Zap className="w-4 h-4 mr-2 text-yellow-300" />
                <span className="text-white text-sm font-medium">Fastest growing platform</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Launch Your <br />
                <span className="bg-gradient-to-r from-cyan-400 to-yellow-300 bg-clip-text text-transparent">
                  Career Journey
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-12 max-w-md leading-relaxed font-light">
                Join professionals who are shaping the future of work
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6 mb-12 max-w-md">
              {[
                { icon: CheckCircle, text: 'Empowering You To Work, Win and Shine', color: 'text-yellow-300' },
                { icon: CheckCircle, text: 'Global network of companies', color: 'text-yellow-300' },
                { icon: CheckCircle, text: 'Personalized career coaching', color: 'text-yellow-300' },
                { icon: CheckCircle, text: 'Skill development resources', color: 'text-yellow-300' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-4 group">
                  <benefit.icon className={`w-6 h-6 ${benefit.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className="text-lg text-white group-hover:text-yellow-200 transition-colors font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">Your data is always secure</span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex pt-9 justify-between items-center text-sm">
              <p className="text-blue-300">© 2024 Banana. All rights reserved.</p>
              <div className="flex space-x-4">
                <span className="text-blue-300 hover:text-white cursor-pointer transition-colors font-medium">Privacy</span>
                <span className="text-blue-300 hover:text-white cursor-pointer transition-colors font-medium">Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-16 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center space-x-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Image
                  src="/logo.png"
                  alt="Banana"
                  width={24}
                  height={24}
                  className="rounded-md"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">Banana</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Join Banana</h1>
            <p className="text-gray-600 font-medium">Create your account and unlock new opportunities</p>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900">Full Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Enter your full name"
                            disabled={isLoading}
                            className="pl-12 pr-4 py-3 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            className="pl-12 pr-4 py-3 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900">Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Create a strong password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className="pl-12 pr-12 py-3 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setPasswordStrength(checkPasswordStrength(e.target.value));
                            }}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
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
                                className={`h-2 flex-1 rounded-full ${
                                  i <= passwordStrength 
                                    ? passwordStrength === 1 ? 'bg-red-400' 
                                      : passwordStrength === 2 ? 'bg-orange-400' 
                                      : passwordStrength === 3 ? 'bg-yellow-400' 
                                      : 'bg-green-400'
                                    : 'bg-gray-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-gray-600 font-medium">
                            {passwordStrength === 0 ? 'Very weak' 
                              : passwordStrength === 1 ? 'Weak' 
                              : passwordStrength === 2 ? 'Fair' 
                              : passwordStrength === 3 ? 'Good' 
                              : 'Strong'}
                          </p>
                        </div>
                      )}
                      <FormMessage className="text-red-500 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900">Confirm Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          </div>
                          <Input
                            placeholder="Confirm your password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className="pl-12 pr-12 py-3 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-500 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-900">
                        I want to be a... <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                              <Briefcase className="h-5 w-5 text-gray-500" />
                            </div>
                            <SelectTrigger className="pl-12 pr-4 py-3 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 text-base bg-white/50 backdrop-blur-sm">
                              <SelectValue placeholder="Choose Your Role" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                          <SelectItem value="candidate" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-50">
                            Candidate
                          </SelectItem>
                          <SelectItem value="freelancer" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-50">
                            Freelancer
                          </SelectItem>
                          <SelectItem value="company" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-50">
                            Company 
                          </SelectItem>
                          <SelectItem value="organization" className="text-base py-3 hover:bg-blue-50 focus:bg-blue-50">
                            Organization
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 flex-shrink-0"
                    required
                  />
                  <label htmlFor="terms" className="text-gray-700 text-sm font-medium">
                    I agree to the{' '}
                    <Link href="/terms" className="text-blue-600 hover:text-blue-800 font-semibold">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-800 font-semibold">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <SleekButton 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] transform"
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
                      <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                    </>
                  )}
                </SleekButton>
              </form>
            </Form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 font-medium">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
            <p className="text-sm text-gray-500 font-medium">
              © 2024 Banana. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}