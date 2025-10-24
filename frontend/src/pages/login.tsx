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
      
      // Handle redirect based on user role - check the actual response structure
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
        <OTPVerification 
          email={verificationEmail} 
          onBack={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="pl-10 min-h-screen flex bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex pl-10 lg:w-1/2 relative overflow-hidden bg-white">
        <div className="absolute pl-10 inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
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
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="mb-12 pt-10">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20 shadow-sm">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-300" />
                <span className="text-white text-sm font-medium">Trusted by 100K+ professionals</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Connect with Your <br />
                <span className="bg-gradient-to-r from-cyan-400 to-yellow-300 bg-clip-text text-transparent">
                  Dream Career
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-12 max-w-md leading-relaxed font-light">
                Where talent meets opportunity in the world`s most innovative platform
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              {[
                { icon: Users, value: '100K+', label: 'Professionals', color: 'text-cyan-400' },
                { icon: Briefcase, value: '50K+', label: 'Active Jobs', color: 'text-emerald-400' },
                { icon: Award, value: '95%', label: 'Success Rate', color: 'text-yellow-300' }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/20 group-hover:border-white/40 transition-all duration-300 shadow-lg">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{stat.value}</div>
                  <div className="text-sm mt-1 text-blue-200 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-sm">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">Enterprise-grade security</span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex justify-between pt-7 items-center text-sm">
              <p className="text-blue-300">© 2024 Banana. All rights reserved.</p>
              <div className="flex space-x-4">
                <span className="text-blue-300 hover:text-white cursor-pointer transition-colors font-medium">Privacy</span>
                <span className="text-blue-300 hover:text-white cursor-pointer transition-colors font-medium">Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-600 font-medium">Sign in to continue your professional journey</p>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="pl-12 pr-12 py-3 h-12 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-200 text-base bg-white/50 backdrop-blur-sm"
                            {...field}
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
                      <FormMessage className="text-red-500 text-sm font-medium" />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-gray-700 font-medium">Remember me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className={`ml-2 h-5 w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                    </>
                  )}
                </SleekButton>
              </form>
            </Form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 font-medium">
              Don`t have an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Join now
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