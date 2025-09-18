/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Eye, EyeOff, Loader2, Briefcase, Building2, ArrowRight, 
  CheckCircle, Shield, Zap
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Button from '@/components/forms/Button';
import GoogleSignIn from '@/components/auth/GoogleSignIn';
import OTPVerification from '@/components/auth/OTPVerification';

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
  const { register, isLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'candidate',
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
      const result = await register(values);
      
      // FIXED: Check for the custom error message
      if (result.data?.requiresVerification) {
        setVerificationEmail(values.email);
        setRequiresVerification(true);
        toast({
          title: 'Verification Required',
          description: 'Please check your email for the verification code',
        });
      } else {
        toast({
          title: 'Welcome to Banana Jobs!',
          description: 'Account created successfully',
        });

        if (values.role === 'company') {
          router.push('/dashboard/company/profile');
        } else {
          const dashboardPath = `/dashboard/${values.role}`;
          router.push(dashboardPath);
        }
      }

    } catch (error: any) {
      // FIXED: Handle the custom error for email verification
      if (error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        setVerificationEmail(form.getValues('email'));
        setRequiresVerification(true);
        toast({
          title: 'Verification Required',
          description: 'Please check your email for the verification code',
        });
      } else {
        toast({
          title: 'Registration failed',
          description: error.message || 'Failed to create account. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  if (requiresVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 py-12 px-4 sm:px-6 lg:px-8">
        <OTPVerification 
          email={verificationEmail} 
          onBack={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-green-50">
      {/* Left Side - Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-900 via-green-900 to-teal-900 relative overflow-hidden">
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
                <Zap className="w-4 h-4 text-yellow-400 mr-2" />
                <span className="text-white text-sm">Fastest growing platform</span>
              </div>
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                Launch Your <br />
                <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  Career Journey
                </span>
              </h1>
              <p className="text-xl text-green-100 mb-12 max-w-md leading-relaxed">
                Join professionals who are shaping the future of work
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6 mb-12 max-w-md">
              {[
                { icon: CheckCircle, text: 'AI-powered job matching', color: 'text-green-400' },
                { icon: CheckCircle, text: 'Global network of companies', color: 'text-green-400' },
                { icon: CheckCircle, text: 'Personalized career coaching', color: 'text-green-400' },
                { icon: CheckCircle, text: 'Skill development resources', color: 'text-green-400' }
              ].map((benefit, index) => (
                <div key={index} className="flex items-center space-x-4 group">
                  <benefit.icon className={`w-6 h-6 ${benefit.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className="text-lg text-white group-hover:text-green-200 transition-colors">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className="flex items-center space-x-2 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
              <Shield className="w-5 h-5 text-green-400" />
              <span className="text-green-200 text-sm">Your data is always secure</span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex justify-between items-center text-sm">
              <p className="text-green-200">© 2024 Banana Jobs. All rights reserved.</p>
              <div className="flex space-x-4">
                <span className="text-green-200 hover:text-white cursor-pointer transition-colors">Privacy</span>
                <span className="text-green-200 hover:text-white cursor-pointer transition-colors">Terms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-20 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-12">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Banana Jobs</span>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Join Banana Jobs</h1>
            <p className="text-gray-600">Create your account and unlock new opportunities</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Full Name</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        {/* <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-green-500" /> */}
                        <Input
                          placeholder="Enter your full name"
                          disabled={isLoading}
                          className="pl-12 pr-4 py-4 h-14 rounded-xl border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-base shadow-sm"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        {/* <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-green-500" /> */}
                        <Input
                          placeholder="Enter your email address"
                          type="email"
                          autoComplete="email"
                          disabled={isLoading}
                          className="pl-12 pr-4 py-4 h-14 rounded-xl border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-base shadow-sm"
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
                        {/* <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-green-500" /> */}
                        <Input
                          placeholder="Create a strong password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          disabled={isLoading}
                          className="pl-12 pr-12 py-4 h-14 rounded-xl border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-base shadow-sm"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setPasswordStrength(checkPasswordStrength(e.target.value));
                          }}
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
                    {form.watch('password') && (
                      <div className="mt-2">
                        <div className="flex space-x-1 mb-1">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full ${
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
                        <p className="text-xs text-gray-500">
                          {passwordStrength === 0 ? 'Very weak' 
                            : passwordStrength === 1 ? 'Weak' 
                            : passwordStrength === 2 ? 'Fair' 
                            : passwordStrength === 3 ? 'Good' 
                            : 'Strong'}
                        </p>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        {/* <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 transition-colors group-focus-within:text-green-500" /> */}
                        <Input
                          placeholder="Confirm your password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          disabled={isLoading}
                          className="pl-12 pr-12 py-4 h-14 rounded-xl border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 text-base shadow-sm"
                          {...field}
                        />
                        <button
                          type="button"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">I am a</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <div className="relative group">
                          <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10 transition-colors group-focus-within:text-green-500" />
                          <SelectTrigger className="pl-12 pr-4 py-4 h-14 rounded-xl border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-base shadow-sm">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </div>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="candidate">Job Seeker</SelectItem>
                        <SelectItem value="freelancer">Freelancer</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 rounded border-gray-300 text-green-600 focus:ring-green-500 h-5 w-5 flex-shrink-0"
                  required
                />
                <label htmlFor="terms" className="text-gray-600 text-sm">
                  I agree to the{' '}
                  <Link href="/terms" className="text-green-600 hover:text-green-800 font-medium">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-green-600 hover:text-green-800 font-medium">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 rounded-xl text-base font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                disabled={isLoading}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className={`ml-3 h-5 w-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                  </>
                )}
              </Button>
            </form>
          </Form>

          {/* Google Sign-In */}
          <GoogleSignIn type="register" />

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-green-600 hover:text-green-800 font-semibold transition-colors"
              >
                Sign in
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