/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, EyeOff, Loader2,
  Building2, ArrowRight, Users, Briefcase, 
  Award, Sparkles, Shield
} from 'lucide-react';
import Link from 'next/link';

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
import Button from '@/components/forms/Button';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import OTPVerification from '@/components/auth/OTPVerification';

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
      await login(values);
      
      toast({
        title: 'Welcome back!',
        description: 'Logged in successfully',
      });

      const userRole = localStorage.getItem('role');
      const dashboardPath = `/dashboard/${userRole}`;
      router.push(dashboardPath);

    } catch (error: any) {
      // FIXED: Check for the custom error message instead of response data
      if (error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        setVerificationEmail(values.email);
        setRequiresVerification(true);
        toast({
          title: 'Verification Required',
          description: 'Please verify your email first',
        });
      } else {
        toast({
          title: 'Login failed',
          description: error.message || 'Failed to login. Please check your credentials.',
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        
        <div className="relative z-10 flex flex-col justify-between items-center px-20 py-12">
          {/* Logo */}
          <div className="w-full">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">Banana Jobs</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="mb-8">
              <div className="inline-flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-white text-sm">Trusted by 100K+ professionals</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Connect with Your <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Dream Career
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-12 max-w-md leading-relaxed">
                Where talent meets opportunity in the world`s most innovative platform
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mb-12">
              {[
                { icon: Users, value: '100K+', label: 'Professionals', color: 'text-blue-300' },
                { icon: Briefcase, value: '50K+', label: 'Active Jobs', color: 'text-green-300' },
                { icon: Award, value: '95%', label: 'Success Rate', color: 'text-purple-300' }
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/20 group-hover:border-white/40 transition-all duration-300">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white group-hover:scale-105 transition-transform">{stat.value}</div>
                  <div className="text-blue-200 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-200 text-sm">Enterprise-grade security</span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex justify-between items-center text-sm">
              <p className="text-blue-200">© 2024 Banana Jobs. All rights reserved.</p>
              <div className="flex space-x-4">
                <span className="text-blue-200 hover:text-white cursor-pointer transition-colors">Privacy</span>
                <span className="text-blue-200 hover:text-white cursor-pointer transition-colors">Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-20 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-12">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Banana Jobs</span>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome Back</h1>
            <p className="text-gray-600">Sign in to continue your professional journey</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        {/* <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-blue-500" /> */}
                        <Input
                          placeholder="Enter your email address"
                          type="email"
                          autoComplete="email"
                          disabled={isLoading}
                          className="pl-12 pr-4 py-4 h-14 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-base shadow-sm"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        {/* <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-blue-500" /> */}
                        <Input
                          placeholder="Enter your password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          disabled={isLoading}
                          className="pl-12 pr-12 py-4 h-14 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-base shadow-sm"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5"
                  />
                  <span className="ml-3 text-gray-600 text-sm">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                disabled={isLoading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className={`ml-3 h-5 w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Google Sign-In */}
          <GoogleSignIn type="login" />

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Don`t have an account?{' '}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                Join now
              </Link>
            </p>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 Banana Jobs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}