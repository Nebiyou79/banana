/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  Mail,
  Phone,
  MapPin,
  Upload,
  Save,
  Loader2,
  Shield,
  Bell,
  Link as LinkIcon,
  DollarSign,
  Clock,
  Globe as GlobeIcon,
  Target,
  Sparkles,
  Building,
  Layers,
  TrendingUp,
  CheckCircle,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Services
import { profileService, type Profile } from '@/services/profileService';
import { freelancerService, type ProfileData, type UserProfile } from '@/services/freelancerService';
import { roleProfileService, type UpdateFreelancerProfileData } from '@/services/roleProfileService';

// Components
import AvatarUploader from '@/components/profile/AvatarUploader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/social/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';

// Validation schemas
const freelancerProfileSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'Name must be at least 2 characters'),
  headline: z.string().min(5, 'Headline must be at least 5 characters').optional(),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
  location: z.string().optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),

  // Personal Info
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),

  // Freelancer Specific
  freelancerProfile: z.object({
    hourlyRate: z.number().min(5, 'Hourly rate must be at least $5').optional(),
    availability: z.enum(['available', 'not-available', 'part-time']).optional(),
    experienceLevel: z.enum(['entry', 'intermediate', 'expert']).optional(),
    englishProficiency: z.enum(['basic', 'conversational', 'fluent', 'native']).optional(),
    timezone: z.string().optional(),
    specialization: z.array(z.string()).optional()
  }).optional(),

  // Social Links
  socialLinks: z.object({
    linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
    twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
    tiktok: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
    telegram: z.string().url('Invalid Telegram URL').optional().or(z.literal(''))
  }).optional(),
});

type FreelancerProfileFormData = z.infer<typeof freelancerProfileSchema>;

const freelancerProfessionalSchema = z.object({
  skills: z.array(z.object({
    name: z.string().min(1, 'Skill name required'),
    level: z.enum(['beginner', 'intermediate', 'expert']),
    yearsOfExperience: z.number().min(0)
  })),
  experience: z.array(z.object({
    company: z.string().min(1, 'Company name required'),
    position: z.string().min(1, 'Position required'),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean(),
    description: z.string().optional(),
    skills: z.array(z.string())
  })),
  education: z.array(z.object({
    institution: z.string().min(1, 'Institution name required'),
    degree: z.string().min(1, 'Degree required'),
    field: z.string().min(1, 'Field of study required'),
    startDate: z.string(),
    endDate: z.string().optional(),
    current: z.boolean(),
    description: z.string().optional()
  })),
  certifications: z.array(z.object({
    name: z.string().min(1, 'Certification name required'),
    issuer: z.string().min(1, 'Issuer required'),
    issueDate: z.string(),
    expiryDate: z.string().optional(),
    credentialId: z.string().optional(),
    credentialUrl: z.string().url().optional(),
    skills: z.array(z.string()).optional()
  })),
  portfolio: z.array(z.object({
    title: z.string().min(1, 'Project title required'),
    description: z.string().optional(),
    mediaUrls: z.array(z.string()).optional(),
    projectUrl: z.string().url().optional(),
    category: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    budget: z.number().optional(),
    duration: z.string().optional(),
    client: z.string().optional()
  }))
});

type FreelancerProfessionalFormData = z.infer<typeof freelancerProfessionalSchema>;

export const FreelanceProfileForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [professionalData, setProfessionalData] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Forms
  const profileForm = useForm<FreelancerProfileFormData>({
    resolver: zodResolver(freelancerProfileSchema),
    defaultValues: {
      freelancerProfile: {},
      socialLinks: {}
    }
  });

  const professionalForm = useForm<FreelancerProfessionalFormData>({
    resolver: zodResolver(freelancerProfessionalSchema),
    defaultValues: {
      skills: [],
      experience: [],
      education: [],
      certifications: [],
      portfolio: []
    }
  });

  // Load profile data
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);

      // Load main profile
      const mainProfile = await profileService.getProfile();
      setProfile(mainProfile);
      setAvatarUrl(mainProfile.user.avatar || '');
      setCoverUrl(mainProfile.coverPhoto || '');

      // Load freelancer-specific profile
      const freelancerData = await freelancerService.getProfile();
      setFreelancerProfile(freelancerData);

      // Load professional data
      const roleProfileData = await roleProfileService.getFreelancerProfile();
      setProfessionalData(roleProfileData);

      // Load stats
      const freelancerStats = await freelancerService.getFreelancerStats();
      setStats(freelancerStats);

      // Load profile completion
      const completion = await profileService.getProfileCompletion();
      setProfileCompletion(completion.percentage);

      // Populate forms
            // Sanitize freelancer profile fields to match the form schema enums and types
            const sanitizedFreelancerProfile: FreelancerProfileFormData['freelancerProfile'] = (() => {
              const fp = (freelancerData.freelancerProfile || {}) as Partial<NonNullable<FreelancerProfileFormData['freelancerProfile']>>;
              const availability = (fp.availability && ['available', 'not-available', 'part-time'].includes(fp.availability))
                ? fp.availability as 'available' | 'not-available' | 'part-time'
                : undefined;
              const experienceLevel = (fp.experienceLevel && ['entry', 'intermediate', 'expert'].includes(fp.experienceLevel))
                ? fp.experienceLevel as 'entry' | 'intermediate' | 'expert'
                : undefined;
              const englishProficiency = (fp.englishProficiency && ['basic', 'conversational', 'fluent', 'native'].includes(fp.englishProficiency))
                ? fp.englishProficiency as 'basic' | 'conversational' | 'fluent' | 'native'
                : undefined;
      
              return {
                hourlyRate: fp.hourlyRate,
                availability,
                experienceLevel,
                englishProficiency,
                timezone: fp.timezone,
                specialization: fp.specialization
              };
            })();
      
            profileForm.reset({
              name: mainProfile.user.name,
              headline: mainProfile.headline,
              bio: mainProfile.bio,
              location: mainProfile.location,
              phone: mainProfile.phone,
              website: mainProfile.website,
              dateOfBirth: freelancerData.dateOfBirth,
              gender: freelancerData.gender,
              freelancerProfile: sanitizedFreelancerProfile,
              socialLinks: mainProfile.socialLinks || {}
            });

      professionalForm.reset({
        skills: (roleProfileData.skills || []).map((s: any) => typeof s === 'string' ? { name: s } : s),
        experience: roleProfileData.experience || [],
        education: roleProfileData.education || [],
        certifications: roleProfileData.certifications || [],
        portfolio: roleProfileData.portfolio || []
      });

    } catch (error) {
      toast.error('Failed to load profile data');
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url);
    try {
      await profileService.updateProfile({ avatar: url });
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error('Failed to update profile picture');
    }
  };

  const handleCoverUpload = async (url: string) => {
    setCoverUrl(url);
    try {
      await profileService.updateProfile({ coverPhoto: url });
      toast.success('Cover photo updated');
    } catch (error) {
      toast.error('Failed to update cover photo');
    }
  };

  const handleProfileSubmit = async (data: FreelancerProfileFormData) => {
    try {
      setSaving(true);

      // Prepare freelancer profile data
      const freelancerData: ProfileData = {
        name: data.name,
        bio: data.bio,
        location: data.location,
        phone: data.phone,
        website: data.website,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        skills: professionalForm.getValues('skills'),
        freelancerProfile: data.freelancerProfile,
        socialLinks: data.socialLinks
      };

      // Update through freelancer service
      await freelancerService.updateProfile(freelancerData);

      // Update main profile
      await profileService.updateProfile({
        headline: data.headline,
        bio: data.bio,
        location: data.location,
        phone: data.phone,
        website: data.website,
        socialLinks: data.socialLinks
      });

      // Refresh data
      await loadProfileData();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleProfessionalSubmit = async (data: FreelancerProfessionalFormData) => {
    try {
      setSaving(true);

      const updateData: UpdateFreelancerProfileData = {
        skills: data.skills.map(s => s.name),
        experience: data.experience.map((e) => ({
          company: e.company,
          position: e.position,
          startDate: e.startDate,
          endDate: e.endDate,
          current: e.current,
          description: e.description,
          skills: e.skills,
          // provide sensible defaults for missing properties expected by the backend type
          employmentType: 'full-time',
          achievements: []
        })),
        education: data.education,
        certifications: data.certifications,
        // Ensure technologies is always a string[] to satisfy the backend type
        portfolio: data.portfolio.map(p => ({
          ...p,
          technologies: p.technologies || []
        }))
      };

      await roleProfileService.updateFreelancerProfile(updateData);

      // Also update through profile service for consistency
      await profileService.updateProfessionalInfo({
        skills: data.skills.map(s => s.name),
        education: data.education,
        experience: data.experience.map((e) => ({
          company: e.company,
          position: e.position,
          startDate: e.startDate,
          endDate: e.endDate,
          current: e.current,
          description: e.description,
          skills: e.skills,
          // keep defaults consistent with the role profile update
          employmentType: 'full-time',
          achievements: []
        })),
        certifications: data.certifications,
        portfolio: data.portfolio.map(p => ({
          ...p,
          technologies: p.technologies || []
        }))
      });

      toast.success('Professional information updated successfully');
    } catch (error) {
      toast.error('Failed to update professional information');
      console.error('Professional update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePortfolioUpload = async (files: File[]) => {
    try {
      const uploadedFiles = await freelancerService.uploadPortfolioFiles(files);
      toast.success(`${uploadedFiles.length} files uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload files');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header with Stats */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
        <div className="relative p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-purple-400" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-1.5 rounded-full shadow-lg">
                  <Zap className="w-3 h-3" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.user.name}
                </h1>
                <p className="text-gray-600">{profile?.headline}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Freelancer
                  </Badge>
                  {stats?.profileStrength && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {stats.profileStrength}% Profile Strength
                    </Badge>
                  )}
                  <Badge variant={profile?.isVerified ? "default" : "outline"}>
                    {profile?.isVerified ? 'Verified' : 'Not Verified'}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Progress value={profileCompletion} className="w-32 h-2" />
                <span className="text-sm font-medium text-gray-700">
                  {profileCompletion}%
                </span>
              </div>
              <p className="text-xs text-gray-500">Profile Completion</p>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Job Success</p>
                    <p className="text-lg font-bold text-gray-900">{stats.jobSuccessScore}%</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Total Earnings</p>
                    <p className="text-lg font-bold text-gray-900">${stats.totalEarnings?.toLocaleString()}</p>
                  </div>
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">On Time</p>
                    <p className="text-lg font-bold text-gray-900">{stats.onTimeDelivery}%</p>
                  </div>
                  <CheckCircle className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Response Rate</p>
                    <p className="text-lg font-bold text-gray-900">{stats.responseRate}%</p>
                  </div>
                  <Clock className="w-4 h-4 text-purple-500" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Form */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Professional
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Portfolio
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Services
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your personal information and freelancer details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  {/* Media Upload */}
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <AvatarUploader
                      currentAvatar={avatarUrl}
                      currentCover={coverUrl}
                      onAvatarComplete={handleAvatarUpload}
                      onCoverComplete={handleCoverUpload}
                      type="both"
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Personal Information
                      </h3>

                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="headline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Freelancer Headline</FormLabel>
                            <FormControl>
                              <Input placeholder="Senior Full-Stack Developer" {...field} />
                            </FormControl>
                            <FormDescription>
                              Your professional tagline (appears in search results)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Freelancer Details */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Freelancer Details
                      </h3>

                      <FormField
                        control={profileForm.control}
                        name="freelancerProfile.hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Rate ($/hr)</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                                <Input
                                  type="number"
                                  placeholder="50"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="freelancerProfile.availability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Availability</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select availability" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="available">Available</SelectItem>
                                <SelectItem value="part-time">Part-time</SelectItem>
                                <SelectItem value="not-available">Not Available</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="freelancerProfile.experienceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Experience Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="entry">Entry Level</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="freelancerProfile.englishProficiency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>English Proficiency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select proficiency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="conversational">Conversational</SelectItem>
                                <SelectItem value="fluent">Fluent</SelectItem>
                                <SelectItem value="native">Native</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Contact Information
                      </h3>

                      <FormField
                        control={profileForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                                <Input placeholder="City, Country" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                                <Input placeholder="+1 (555) 123-4567" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <GlobeIcon className="w-4 h-4" />
                        Online Presence
                      </h3>

                      <FormField
                        control={profileForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website/Portfolio</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Globe className="w-4 h-4 text-gray-400 mr-2" />
                                <Input placeholder="https://yourportfolio.com" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="freelancerProfile.timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="UTC-5">EST (UTC-5)</SelectItem>
                                <SelectItem value="UTC-8">PST (UTC-8)</SelectItem>
                                <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                                <SelectItem value="UTC+1">CET (UTC+1)</SelectItem>
                                <SelectItem value="UTC+5.5">IST (UTC+5:30)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About Me</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your skills, experience, and what makes you a great freelancer..."
                              className="min-h-[140px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Share your story and expertise with potential clients
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Social Links
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="socialLinks.linkedin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LinkedIn</FormLabel>
                            <FormControl>
                              <Input placeholder="https://linkedin.com/in/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="socialLinks.github"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GitHub</FormLabel>
                            <FormControl>
                              <Input placeholder="https://github.com/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="socialLinks.twitter"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Twitter</FormLabel>
                            <FormControl>
                              <Input placeholder="https://twitter.com/username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Professional Information
              </CardTitle>
              <CardDescription>
                Your skills, experience, education, and certifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...professionalForm}>
                <form onSubmit={professionalForm.handleSubmit(handleProfessionalSubmit)} className="space-y-6">
                  {/* Skills Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Skills & Expertise
                      </h3>
                      <Badge variant="outline">
                        {professionalData?.skills?.length || 0} skills
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      Skills management UI would be implemented here with level and years
                    </div>
                  </div>

                  {/* Experience Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Work Experience
                    </h3>
                    <div className="text-sm text-gray-500">
                      Experience management UI would be implemented here
                    </div>
                  </div>

                  {/* Education Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h3>
                    <div className="text-sm text-gray-500">
                      Education management UI would be implemented here
                    </div>
                  </div>

                  {/* Certifications Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certifications
                    </h3>
                    <div className="text-sm text-gray-500">
                      Certification management UI would be implemented here
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" />
                      Save Professional Information
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab */}
        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Portfolio
              </CardTitle>
              <CardDescription>
                Showcase your best work to attract clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Portfolio Stats */}
                {freelancerProfile?.portfolio && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                      <p className="text-2xl font-bold text-blue-700">{freelancerProfile.portfolio.length}</p>
                      <p className="text-sm text-blue-600">Total Projects</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                      <p className="text-2xl font-bold text-green-700">
                        {freelancerProfile.portfolio.filter(p => p.featured).length}
                      </p>
                      <p className="text-sm text-green-600">Featured</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                      <p className="text-2xl font-bold text-purple-700">
                        {freelancerProfile.portfolio.filter(p => p.visibility === 'public').length}
                      </p>
                      <p className="text-sm text-purple-600">Public</p>
                    </div>
                  </div>
                )}

                {/* Portfolio Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Upload Portfolio Files</h3>
                      <p className="text-sm text-gray-500">Images, PDFs, or documents • Max 10MB each</p>
                    </div>
                    <Button onClick={() => {/* Implement portfolio upload */ }}>
                      <Upload className="w-4 h-4 mr-2" />
                      Add Project
                    </Button>
                  </div>

                  {/* Portfolio projects grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {freelancerProfile?.portfolio?.map((project) => (
                      <div key={project._id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="aspect-video bg-gray-100 rounded mb-3 overflow-hidden">
                          {project.mediaUrls?.[0] ? (
                            <img
                              src={project.mediaUrls[0]}
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Layers className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <h4 className="font-medium text-gray-900 truncate">{project.title}</h4>
                        <p className="text-sm text-gray-500 truncate">{project.description}</p>
                        {project.budget && (
                          <p className="text-sm font-medium text-gray-700 mt-2">
                            ${project.budget.toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Services
              </CardTitle>
              <CardDescription>
                Define and manage your freelance services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Services management UI would be implemented here */}
                <div className="text-center text-gray-500">
                  Services management UI would be implemented here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Privacy settings controls would go here */}
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Notification settings controls would go here */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FreelanceProfileForm;