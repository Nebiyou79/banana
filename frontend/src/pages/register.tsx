/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye, EyeOff, Loader2, Briefcase, ArrowRight,
  CheckCircle, Shield, Zap, User, Mail, Lock, Check
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
import { colorClasses, colors } from '@/utils/color';

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${colorClasses.bg.gray100} dark:${colorClasses.bg.darkNavy}`}>
        <OTPVerification
          email={verificationEmail}
          onBack={() => setRequiresVerification(false)}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${colorClasses.bg.gray100} dark:${colorClasses.bg.darkNavy}`}>
      {/* Left Side - Brand Showcase */}
      <div className={`hidden lg:flex lg:w-1/2 relative overflow-hidden ${colorClasses.bg.darkNavy}`}>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

        <div className="relative z-10 flex flex-col justify-between items-center px-16 py-12">
          {/* Logo */}
          <div className="pl-12 flex items-center space-x-3">
            <div className={`${colorClasses.bg.white} rounded-xl flex items-center justify-center shadow-lg`}>
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
              <div className={`inline-flex items-center backdrop-blur-sm rounded-full px-4 py-2 mb-6 border shadow-sm ${colorClasses.bg.darkNavy} ${colorClasses.border.gold}`}>
                <Zap className="w-4 h-4 mr-2" style={{ color: colors.gold }} />
                <span className={`text-sm font-medium ${colorClasses.text.white}`}>
                  Fastest growing platform
                </span>
              </div>
              <h1 className={`text-5xl font-bold mb-6 leading-tight ${colorClasses.text.white}`}>
                Launch Your <br />
                <span className={colorClasses.text.gold}>
                  Career Journey
                </span>
              </h1>
              <p className={`text-xl mb-12 max-w-md leading-relaxed font-light ${colorClasses.text.gray400}`}>
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
                  <benefit.icon className={`w-6 h-6 ${colorClasses.text.gold} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                  <span className={`text-lg group-hover:${colorClasses.text.gold} transition-colors font-medium ${colorClasses.text.white}`}>
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>

            {/* Security Badge */}
            <div className={`flex items-center space-x-2 backdrop-blur-sm rounded-2xl p-4 border shadow-sm ${colorClasses.bg.darkNavy} ${colorClasses.border.teal}`}>
              <Shield className="w-5 h-5" style={{ color: colors.teal }} />
              <span className={`text-sm font-medium ${colorClasses.text.teal}`}>
                Your data is always secure
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="w-full">
            <div className="flex pt-9 justify-between items-center text-sm">
              <p className={colorClasses.text.gray400}>© 2024 Banana. All rights reserved.</p>
              <div className="flex space-x-4">
                <span className={`${colorClasses.text.gray400} hover:${colorClasses.text.white} cursor-pointer transition-colors font-medium`}>
                  Privacy
                </span>
                <span className={`${colorClasses.text.gray400} hover:${colorClasses.text.white} cursor-pointer transition-colors font-medium`}>
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
            <div
              className={`
                rounded-2xl 
                px-6 py-5 
                shadow-lg 
                border 
                backdrop-blur-sm
                flex items-center space-x-4
                ${colorClasses.bg.white} 
                ${colorClasses.border.gray100}
                dark:${colorClasses.bg.darkNavy}
                dark:${colorClasses.border.gray700}
              `}
            >
              {/* Logo Container */}
              <div
                className={`
                  w-16 h-16 
                  rounded-xl 
                  flex items-center justify-center 
                  shadow-md 
                  ${colorClasses.bg.white}
                  dark:${colorClasses.bg.darkNavy}
                `}
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
                <span className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white}`}>
                  Banana
                </span>
                <span className={`text-sm font-medium ${colorClasses.text.gray400}`}>
                  Connect • Grow • Succeed
                </span>
              </div>
            </div>
          </div>
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold mb-3 ${colorClasses.text.darkNavy} dark:${colorClasses.text.white}`}>
              Join Banana
            </h1>
            <p className={`font-medium ${colorClasses.text.gray800} dark:${colorClasses.text.gray300}`}>
              Create your account and unlock new opportunities
            </p>
          </div>

          {/* Form Container */}
          <div className={`
            rounded-2xl p-8 shadow-xl border backdrop-blur-sm
            ${colorClasses.bg.white} ${colorClasses.border.gray100}
            dark:${colorClasses.bg.darkNavy} dark:${colorClasses.border.gray700}
          `}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={`font-semibold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white}`}>
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your full name"
                            disabled={isLoading}
                            className={`
                              pl-12 pr-4 py-3 h-12 rounded-xl transition-all duration-200 
                              text-base backdrop-blur-sm
                              ${colorClasses.border.gray400} ${colorClasses.bg.white}
                              dark:${colorClasses.border.gray700} dark:${colorClasses.bg.darkNavy}
                              dark:${colorClasses.text.white}
                              focus:${colorClasses.border.goldenMustard}
                              dark:focus:${colorClasses.border.gold}
                            `}
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
                      <FormLabel className={`font-semibold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white}`}>
                        Email Address
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Enter your email address"
                            type="email"
                            autoComplete="email"
                            disabled={isLoading}
                            className={`
                              pl-12 pr-4 py-3 h-12 rounded-xl transition-all duration-200 
                              text-base backdrop-blur-sm
                              ${colorClasses.border.gray400} ${colorClasses.bg.white}
                              dark:${colorClasses.border.gray700} dark:${colorClasses.bg.darkNavy}
                              dark:${colorClasses.text.white}
                              focus:${colorClasses.border.goldenMustard}
                              dark:focus:${colorClasses.border.gold}
                            `}
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
                      <FormLabel className={`font-semibold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white}`}>
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Create a strong password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className={`
                              pl-12 pr-12 py-3 h-12 rounded-xl transition-all duration-200 
                              text-base backdrop-blur-sm
                              ${colorClasses.border.gray400} ${colorClasses.bg.white}
                              dark:${colorClasses.border.gray700} dark:${colorClasses.bg.darkNavy}
                              dark:${colorClasses.text.white}
                              focus:${colorClasses.border.goldenMustard}
                              dark:focus:${colorClasses.border.gold}
                            `}
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
                              <EyeOff className={`h-5 w-5 ${colorClasses.text.gray400}`} />
                            ) : (
                              <Eye className={`h-5 w-5 ${colorClasses.text.gray400}`} />
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
                                className={`h-2 flex-1 rounded-full ${i <= passwordStrength
                                  ? passwordStrength === 1 ? 'bg-red-400'
                                    : passwordStrength === 2 ? 'bg-orange-400'
                                      : passwordStrength === 3 ? 'bg-yellow-400'
                                        : 'bg-green-400'
                                  : `${colorClasses.bg.gray400} dark:${colorClasses.bg.gray800}`
                                  }`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${colorClasses.text.gray800} dark:${colorClasses.text.gray300}`}>
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
                      <FormLabel className={`font-semibold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white}`}>
                        Confirm Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Confirm your password"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            disabled={isLoading}
                            className={`
                              pl-12 pr-12 py-3 h-12 rounded-xl transition-all duration-200 
                              text-base backdrop-blur-sm
                              ${colorClasses.border.gray400} ${colorClasses.bg.white}
                              dark:${colorClasses.border.gray700} dark:${colorClasses.bg.darkNavy}
                              dark:${colorClasses.text.white}
                              focus:${colorClasses.border.goldenMustard}
                              dark:focus:${colorClasses.border.gold}
                            `}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className={`h-5 w-5 ${colorClasses.text.gray400}`} />
                            ) : (
                              <Eye className={`h-5 w-5 ${colorClasses.text.gray400}`} />
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
                      <FormLabel className={`font-semibold ${colorClasses.text.darkNavy} dark:${colorClasses.text.white}`}>
                        I want to be a... <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                              <Briefcase className={`h-5 w-5 ${colorClasses.text.gray400}`} />
                            </div>
                            <SelectTrigger className={`
                              pl-12 pr-4 py-3 h-12 rounded-xl text-base backdrop-blur-sm
                              ${colorClasses.border.gray400} ${colorClasses.bg.white}
                              dark:${colorClasses.border.gray700} dark:${colorClasses.bg.darkNavy}
                              dark:${colorClasses.text.white}
                              focus:${colorClasses.border.goldenMustard}
                              dark:focus:${colorClasses.border.gold}
                            `}>
                              <SelectValue placeholder="Choose Your Role" />
                            </SelectTrigger>
                          </div>
                        </FormControl>
                        <SelectContent className={`
                          border rounded-xl shadow-lg
                          ${colorClasses.bg.white} ${colorClasses.border.gray400}
                          dark:${colorClasses.bg.darkNavy} dark:${colorClasses.border.gray700}
                        `}>
                          <SelectItem value="candidate" className={`
                            text-base py-3 hover:${colorClasses.bg.gray100} focus:${colorClasses.bg.gray100}
                            dark:hover:${colorClasses.bg.gray800} dark:focus:${colorClasses.bg.gray800}
                          `}>
                            Candidate
                          </SelectItem>
                          <SelectItem value="freelancer" className={`
                            text-base py-3 hover:${colorClasses.bg.gray100} focus:${colorClasses.bg.gray100}
                            dark:hover:${colorClasses.bg.gray800} dark:focus:${colorClasses.bg.gray800}
                          `}>
                            Freelancer
                          </SelectItem>
                          <SelectItem value="company" className={`
                            text-base py-3 hover:${colorClasses.bg.gray100} focus:${colorClasses.bg.gray100}
                            dark:hover:${colorClasses.bg.gray800} dark:focus:${colorClasses.bg.gray800}
                          `}>
                            Company
                          </SelectItem>
                          <SelectItem value="organization" className={`
                            text-base py-3 hover:${colorClasses.bg.gray100} focus:${colorClasses.bg.gray100}
                            dark:hover:${colorClasses.bg.gray800} dark:focus:${colorClasses.bg.gray800}
                          `}>
                            Organization
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500 text-sm font-medium" />
                    </FormItem>
                  )}
                />

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
                      className={`
        w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 cursor-pointer
        ${acceptedTerms ? `${colorClasses.bg.goldenMustard} ${colorClasses.border.goldenMustard}` : `${colorClasses.border.gray400} ${colorClasses.bg.white}`}
        dark:${colorClasses.border.gray700} dark:${colorClasses.bg.darkNavy}
      `}
                    >
                      {acceptedTerms && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </label>
                  </div>
                  <label htmlFor="terms" className={`text-sm font-medium ${colorClasses.text.gray800} dark:${colorClasses.text.gray300} cursor-pointer`}>
                    I agree to the{' '}
                    <Link href="/terms" className={`font-semibold ${colorClasses.text.blue} hover:${colorClasses.text.darkNavy}`}>
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className={`font-semibold ${colorClasses.text.blue} hover:${colorClasses.text.darkNavy}`}>
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <SleekButton
                  type="submit"
                  className={`
                    w-full h-12 rounded-xl text-base font-semibold 
                    transition-all duration-300 shadow-lg hover:shadow-xl 
                    hover:scale-[1.02] transform
                    ${colorClasses.bg.goldenMustard} 
                    hover:${colorClasses.bg.gold}
                    ${colorClasses.text.white}
                  `}
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
            <p className={`font-medium ${colorClasses.text.gray800} dark:${colorClasses.text.gray300}`}>
              Already have an account?{' '}
              <Link
                href="/login"
                className={`font-semibold transition-colors ${colorClasses.text.goldenMustard} hover:${colorClasses.text.gold}`}
              >
                Sign in
              </Link>
            </p>
          </div>

          {/* Mobile Footer */}
          <div className="lg:hidden mt-12 text-center">
            <p className={`text-sm font-medium ${colorClasses.text.gray400}`}>
              © 2024 Banana. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}