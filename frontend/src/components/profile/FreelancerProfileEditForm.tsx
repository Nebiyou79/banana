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
  Zap,
  Camera,
  Cloud,
  RefreshCw,
  X,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Calendar,
  Hash,
  ChevronDown,
  ChevronUp,
  Users,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Services
import { profileService, type Profile } from '@/services/profileService';
import { freelancerService, type ProfileData, type UserProfile } from '@/services/freelancerService';
import { roleProfileService, type UpdateFreelancerProfileData } from '@/services/roleProfileService';

// Components
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/social/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/Form';
import { Switch } from '@/components/ui/Switch';
import { Separator } from '@/components/ui/Separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/Accordian';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';

// Validation schemas
const freelancerProfileSchema = z.object({
  // Basic Info
  name: z.string().min(2, 'Name must be at least 2 characters'),
  headline: z.string().min(5, 'Headline must be at least 5 characters').optional(),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
  location: z.string().optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number').optional().or(z.literal('')),
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

// Service form schema
const serviceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  priceType: z.enum(['fixed', 'hourly']),
  price: z.number().min(1, 'Price must be at least $1'),
  deliveryTime: z.number().min(1, 'Delivery time must be at least 1 day'),
  revisions: z.number().min(0, 'Revisions cannot be negative').max(10, 'Maximum 10 revisions'),
  tags: z.array(z.string()).min(1, 'At least one tag is required').max(5, 'Maximum 5 tags'),
  features: z.array(z.string()).min(1, 'At least one feature is required').max(10, 'Maximum 10 features')
});

type ServiceFormData = z.infer<typeof serviceSchema>;

// Privacy settings schema
const privacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'connections', 'private']),
  showEmail: z.boolean(),
  showPhone: z.boolean(),
  showLocation: z.boolean(),
  showAge: z.boolean(),
  allowMessages: z.boolean(),
  allowConnections: z.boolean(),
  showOnlineStatus: z.boolean(),
  showLastSeen: z.boolean(),
  showProfileViews: z.boolean()
});

type PrivacySettingsData = z.infer<typeof privacySettingsSchema>;

export const FreelancerProfileEditForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [professionalData, setProfessionalData] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isUploading, setIsUploading] = useState({
    avatar: false,
    cover: false
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState<Partial<ServiceFormData>>({});
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettingsData>({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showAge: false,
    allowMessages: true,
    allowConnections: true,
    showOnlineStatus: true,
    showLastSeen: true,
    showProfileViews: true
  });
  const [skillInput, setSkillInput] = useState('');
  const [serviceTagInput, setServiceTagInput] = useState('');
  const [serviceFeatureInput, setServiceFeatureInput] = useState('');

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

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      priceType: 'fixed',
      price: 100,
      deliveryTime: 7,
      revisions: 3,
      tags: [],
      features: []
    }
  });

  // Get optimized image URLs
  const getOptimizedAvatar = () => {
    if (!profile) return profileService.getPlaceholderAvatar('User');
    if (profile.avatar?.secure_url) {
      return profileService.getOptimizedAvatarUrl(profile.avatar, 'large');
    }
    return profile.user.avatar || profileService.getPlaceholderAvatar(profile.user.name);
  };

  const getOptimizedCover = () => {
    if (!profile) return '';
    if (profile.cover?.secure_url) {
      return profileService.getOptimizedCoverUrl(profile.cover);
    }
    return '';
  };

  const getAvatarWithCacheBust = () => {
    const avatarUrl = getOptimizedAvatar();
    if (!avatarUrl) return profileService.getPlaceholderAvatar(profile?.user.name || 'User');
    const separator = avatarUrl.includes('?') ? '&' : '?';
    return `${avatarUrl}${separator}_t=${refreshKey}`;
  };

  const getCoverWithCacheBust = () => {
    const coverUrl = getOptimizedCover();
    if (!coverUrl) return '';
    const separator = coverUrl.includes('?') ? '&' : '?';
    return `${coverUrl}${separator}_t=${refreshKey}`;
  };

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

      // Load services
      const freelancerServices = await freelancerService.getServices();
      setServices(freelancerServices);

      // Load privacy settings
      if (mainProfile.privacySettings) {
        setPrivacySettings(mainProfile.privacySettings);
      }

      // Populate forms
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
        phone: mainProfile.phone || '',
        website: mainProfile.website || '',
        dateOfBirth: freelancerData.dateOfBirth,
        gender: freelancerData.gender,
        freelancerProfile: sanitizedFreelancerProfile,
        socialLinks: mainProfile.socialLinks || {}
      });

      professionalForm.reset({
        skills: (roleProfileData.skills || []).map((s: any) => typeof s === 'string' ? {
          name: s,
          level: 'intermediate' as const,
          yearsOfExperience: 2
        } : s),
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

  const handleAvatarUpload = async (file: File) => {
    try {
      setIsUploading(prev => ({ ...prev, avatar: true }));
      const validation = profileService.validateAvatarFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      await profileService.uploadAvatar(file);
      setRefreshKey(prev => prev + 1);
      toast.success('Profile picture updated successfully!');

      // Refresh profile data
      await loadProfileData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload profile picture');
      console.error('Avatar upload error:', error);
    } finally {
      setIsUploading(prev => ({ ...prev, avatar: false }));
    }
  };

  const handleCoverUpload = async (file: File) => {
    try {
      setIsUploading(prev => ({ ...prev, cover: true }));
      const validation = profileService.validateCoverFile(file);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      await profileService.uploadCoverPhoto(file);
      setRefreshKey(prev => prev + 1);
      toast.success('Cover photo updated successfully!');

      // Refresh profile data
      await loadProfileData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload cover photo');
      console.error('Cover upload error:', error);
    } finally {
      setIsUploading(prev => ({ ...prev, cover: false }));
    }
  };

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp,image/gif';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleAvatarUpload(file);
      }
    };
    input.click();
  };

  const handleCoverClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        await handleCoverUpload(file);
      }
    };
    input.click();
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
          employmentType: 'full-time',
          achievements: []
        })),
        education: data.education,
        certifications: data.certifications,
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

  const handleServiceSubmit = async (data: ServiceFormData) => {
    try {
      setSaving(true);
      await freelancerService.addService(data);
      toast.success('Service created successfully');
      setShowServiceForm(false);
      serviceForm.reset();

      // Refresh services
      const updatedServices = await freelancerService.getServices();
      setServices(updatedServices);
    } catch (error) {
      toast.error('Failed to create service');
      console.error('Service creation error:', error);
    } finally {
      setSaving(false);
    }
  };

  // const handleDeleteService = async (serviceId: string) => {
  //   try {
  //     await freelancerService.deleteService(serviceId);
  //     toast.success('Service deleted successfully');

  //     // Refresh services
  //     const updatedServices = await freelancerService.getFreelancerServices();
  //     setServices(updatedServices);
  //   } catch (error) {
  //     toast.error('Failed to delete service');
  //     console.error('Service deletion error:', error);
  //   }
  // };

  const handlePrivacySettingsUpdate = async () => {
    try {
      setSaving(true);
      await profileService.updatePrivacySettings(privacySettings);
      toast.success('Privacy settings updated successfully');
    } catch (error) {
      toast.error('Failed to update privacy settings');
      console.error('Privacy settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationPreferencesUpdate = async () => {
    try {
      setSaving(true);
      await profileService.updateNotificationPreferences({
        email: {
          messages: true,
          connectionRequests: true,
          postInteractions: true,
          jobMatches: true,
          newFollowers: true,
          jobAlerts: true,
          newsletter: true
        },
        push: {
          messages: true,
          connectionRequests: true,
          postInteractions: true,
          newFollowers: true,
          jobAlerts: true
        },
        inApp: {
          messages: true,
          connectionRequests: true,
          postInteractions: true,
          newFollowers: true,
          jobMatches: true
        }
      });
      toast.success('Notification preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update notification preferences');
      console.error('Notification preferences error:', error);
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      const currentSkills = professionalForm.getValues('skills');
      professionalForm.setValue('skills', [
        ...currentSkills,
        {
          name: skillInput.trim(),
          level: 'intermediate',
          yearsOfExperience: 2
        }
      ]);
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    const currentSkills = professionalForm.getValues('skills');
    professionalForm.setValue('skills', currentSkills.filter((_, i) => i !== index));
  };

  const addServiceTag = () => {
    if (serviceTagInput.trim()) {
      const currentTags = serviceForm.getValues('tags');
      if (currentTags.length < 5) {
        serviceForm.setValue('tags', [...currentTags, serviceTagInput.trim()]);
        setServiceTagInput('');
      } else {
        toast.error('Maximum 5 tags allowed');
      }
    }
  };

  const removeServiceTag = (index: number) => {
    const currentTags = serviceForm.getValues('tags');
    serviceForm.setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  const addServiceFeature = () => {
    if (serviceFeatureInput.trim()) {
      const currentFeatures = serviceForm.getValues('features');
      if (currentFeatures.length < 10) {
        serviceForm.setValue('features', [...currentFeatures, serviceFeatureInput.trim()]);
        setServiceFeatureInput('');
      } else {
        toast.error('Maximum 10 features allowed');
      }
    }
  };

  const removeServiceFeature = (index: number) => {
    const currentFeatures = serviceForm.getValues('features');
    serviceForm.setValue('features', currentFeatures.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Profile Header with Stats */}
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
        {/* Cover Photo */}
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-500">
          {getOptimizedCover() ? (
            <div className="relative w-full h-full">
              <img
                src={getCoverWithCacheBust()}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              {isUploading.cover && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
              <button
                onClick={handleCoverClick}
                className="absolute bottom-4 right-4 p-2 bg-black/60 text-white rounded-lg hover:bg-black/80 transition-colors flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">Change cover</span>
              </button>
              {profile.cover && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm">
                  <Cloud className="w-3 h-3" />
                  <span>Cloud Storage</span>
                </div>
              )}
            </div>
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleCoverClick}
            >
              {isUploading.cover ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-white animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Camera className="w-8 h-8 text-white/60 mb-2" />
                  <p className="text-white/80 text-sm">Add cover photo</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative p-6">
          <div className="flex items-center justify-between -mt-16 mb-4">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                  <div className="relative w-full h-full">
                    {getOptimizedAvatar() ? (
                      <img
                        src={getAvatarWithCacheBust()}
                        alt="Profile"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={handleAvatarClick}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={handleAvatarClick}
                      >
                        <User className="w-10 h-10 text-purple-400" />
                      </div>
                    )}
                    {isUploading.avatar && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 bg-purple-600 text-white p-1.5 rounded-full shadow-lg">
                  <Zap className="w-3 h-3" />
                </div>
                {profile.avatar && (
                  <div className="absolute -bottom-2 -left-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Cloud className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.user.name}
                </h1>
                <p className="text-gray-600">{profile.headline}</p>
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
                  {/* Media Upload Section */}
                  <div className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Avatar Upload */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">Profile Picture</h3>
                          <button
                            type="button"
                            onClick={handleAvatarClick}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Change
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
                              {getOptimizedAvatar() ? (
                                <img
                                  src={getAvatarWithCacheBust()}
                                  alt="Profile"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                                  <User className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            {profile.avatar && (
                              <div className="absolute -top-1 -right-1">
                                <Cloud className="w-3 h-3 text-blue-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              JPG, PNG, WebP, or GIF • Max 5MB
                            </p>
                            <p className="text-xs text-gray-500">
                              Click the Change button to upload a new photo
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Cover Upload */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">Cover Photo</h3>
                          <button
                            type="button"
                            onClick={handleCoverClick}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Change
                          </button>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200">
                              {getOptimizedCover() ? (
                                <img
                                  src={getCoverWithCacheBust()}
                                  alt="Cover"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center">
                                  <Camera className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            {profile.cover && (
                              <div className="absolute -top-1 -right-1">
                                <Cloud className="w-3 h-3 text-blue-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">
                              JPG, PNG, or WebP • Max 10MB
                            </p>
                            <p className="text-xs text-gray-500">
                              Recommended size: 1200x400 pixels
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
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
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                        {professionalForm.watch('skills')?.length || 0} skills
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      {/* Add Skill Input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill (e.g., React, Python, UI/UX Design)"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        />
                        <Button type="button" onClick={addSkill}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Skills List */}
                      <div className="flex flex-wrap gap-2">
                        {professionalForm.watch('skills').map((skill, index) => (
                          <Badge key={index} variant="secondary" className="px-3 py-1 flex items-center gap-2">
                            {skill.name}
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Experience Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Work Experience
                    </h3>

                    <Accordion type="single" collapsible className="w-full">
                      {professionalForm.watch('experience').map((exp, index) => (
                        <AccordionItem key={index} value={`exp-${index}`}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">{exp.position}</p>
                                <p className="text-sm text-gray-500">{exp.company}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pl-12">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-gray-500">Start Date</label>
                                  <p className="text-sm">{format(new Date(exp.startDate), 'MMM yyyy')}</p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">End Date</label>
                                  <p className="text-sm">
                                    {exp.current ? 'Present' : (exp.endDate ? format(new Date(exp.endDate), 'MMM yyyy') : 'N/A')}
                                  </p>
                                </div>
                              </div>
                              {exp.description && (
                                <div>
                                  <label className="text-xs text-gray-500">Description</label>
                                  <p className="text-sm">{exp.description}</p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentExp = professionalForm.getValues('experience');
                        professionalForm.setValue('experience', [
                          ...currentExp,
                          {
                            company: '',
                            position: '',
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: '',
                            current: false,
                            description: '',
                            skills: []
                          }
                        ]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Experience
                    </Button>
                  </div>

                  <Separator />

                  {/* Education Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h3>

                    <Accordion type="single" collapsible className="w-full">
                      {professionalForm.watch('education').map((edu, index) => (
                        <AccordionItem key={index} value={`edu-${index}`}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                <GraduationCap className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">{edu.degree}</p>
                                <p className="text-sm text-gray-500">{edu.institution}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pl-12">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-gray-500">Field of Study</label>
                                  <p className="text-sm">{edu.field}</p>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500">Period</label>
                                  <p className="text-sm">
                                    {format(new Date(edu.startDate), 'MMM yyyy')} -{' '}
                                    {edu.current ? 'Present' : (edu.endDate ? format(new Date(edu.endDate), 'MMM yyyy') : 'N/A')}
                                  </p>
                                </div>
                              </div>
                              {edu.description && (
                                <div>
                                  <label className="text-xs text-gray-500">Description</label>
                                  <p className="text-sm">{edu.description}</p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentEdu = professionalForm.getValues('education');
                        professionalForm.setValue('education', [
                          ...currentEdu,
                          {
                            institution: '',
                            degree: '',
                            field: '',
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: '',
                            current: false,
                            description: ''
                          }
                        ]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Education
                    </Button>
                  </div>

                  <Separator />

                  {/* Certifications Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Certifications
                    </h3>

                    <Accordion type="single" collapsible className="w-full">
                      {professionalForm.watch('certifications').map((cert, index) => (
                        <AccordionItem key={index} value={`cert-${index}`}>
                          <AccordionTrigger>
                            <div className="flex items-center gap-3 text-left">
                              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Award className="w-5 h-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="font-medium">{cert.name}</p>
                                <p className="text-sm text-gray-500">{cert.issuer}</p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-4 pl-12">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-gray-500">Issue Date</label>
                                  <p className="text-sm">{format(new Date(cert.issueDate), 'MMM yyyy')}</p>
                                </div>
                                {cert.expiryDate && (
                                  <div>
                                    <label className="text-xs text-gray-500">Expiry Date</label>
                                    <p className="text-sm">{format(new Date(cert.expiryDate), 'MMM yyyy')}</p>
                                  </div>
                                )}
                              </div>
                              {cert.credentialId && (
                                <div>
                                  <label className="text-xs text-gray-500">Credential ID</label>
                                  <p className="text-sm">{cert.credentialId}</p>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentCerts = professionalForm.getValues('certifications');
                        professionalForm.setValue('certifications', [
                          ...currentCerts,
                          {
                            name: '',
                            issuer: '',
                            issueDate: new Date().toISOString().split('T')[0],
                            expiryDate: '',
                            credentialId: '',
                            credentialUrl: '',
                            skills: []
                          }
                        ]);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certification
                    </Button>
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
                    <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Project
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Portfolio Project</DialogTitle>
                          <DialogDescription>
                            Showcase your best work to attract potential clients
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
                            <Input placeholder="E-commerce Website Redesign" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <Textarea placeholder="Describe the project, your role, and the results achieved..." />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                            <Input placeholder="React, Node.js, MongoDB, AWS" />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                              <Input type="number" placeholder="5000" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                              <Input placeholder="3 months" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                            <Input placeholder="Company Name" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project URL</label>
                            <Input placeholder="https://project-demo.com" />
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowServiceForm(false)}>
                              Cancel
                            </Button>
                            <Button>
                              <Save className="w-4 h-4 mr-2" />
                              Save Project
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900 truncate">{project.title}</h4>
                            <p className="text-sm text-gray-500 truncate">{project.description}</p>
                            {project.budget && (
                              <p className="text-sm font-medium text-gray-700 mt-2">
                                ${project.budget.toLocaleString()}
                              </p>
                            )}
                          </div>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(project._id!)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button> */}
                        </div>
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
                {/* Add Service Button */}
                <div className="flex justify-end">
                  <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Service</DialogTitle>
                        <DialogDescription>
                          Define your service offering to attract clients
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...serviceForm}>
                        <form onSubmit={serviceForm.handleSubmit(handleServiceSubmit)} className="space-y-4">
                          <FormField
                            control={serviceForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Service Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Professional Website Development" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={serviceForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe what you'll deliver..."
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={serviceForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Category *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="web-development">Web Development</SelectItem>
                                      <SelectItem value="mobile-development">Mobile Development</SelectItem>
                                      <SelectItem value="ui-ux-design">UI/UX Design</SelectItem>
                                      <SelectItem value="graphic-design">Graphic Design</SelectItem>
                                      <SelectItem value="content-writing">Content Writing</SelectItem>
                                      <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                                      <SelectItem value="seo">SEO</SelectItem>
                                      <SelectItem value="video-editing">Video Editing</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={serviceForm.control}
                              name="priceType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price Type *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select price type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="fixed">Fixed Price</SelectItem>
                                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={serviceForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price ($) *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={serviceForm.control}
                              name="deliveryTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Delivery (days) *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={serviceForm.control}
                              name="revisions"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Revisions *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Tags */}
                          <div className="space-y-2">
                            <FormLabel>Tags (Max 5)</FormLabel>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a tag"
                                value={serviceTagInput}
                                onChange={(e) => setServiceTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceTag())}
                              />
                              <Button type="button" onClick={addServiceTag}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {serviceForm.watch('tags').map((tag, index) => (
                                <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center gap-1">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeServiceTag(index)}
                                    className="text-gray-500 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Features */}
                          <div className="space-y-2">
                            <FormLabel>Features (Max 10)</FormLabel>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Add a feature"
                                value={serviceFeatureInput}
                                onChange={(e) => setServiceFeatureInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceFeature())}
                              />
                              <Button type="button" onClick={addServiceFeature}>
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="space-y-1 mt-2">
                              {serviceForm.watch('features').map((feature, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                  <span className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                    {feature}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeServiceFeature(index)}
                                    className="text-gray-500 hover:text-red-500"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowServiceForm(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              <Save className="w-4 h-4 mr-2" />
                              Create Service
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Services Grid */}
                {services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <Card key={service._id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-lg">{service.title}</CardTitle>
                            {/* <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteService(service._id)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button> */}
                          </div>
                          <CardDescription className="line-clamp-2">{service.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Price:</span>
                              <span className="font-bold text-lg">
                                ${service.price} {service.priceType === 'hourly' ? '/hr' : ''}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Delivery:</span>
                              <span className="font-medium">{service.deliveryTime} days</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Revisions:</span>
                              <span className="font-medium">{service.revisions}</span>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600 mb-2 block">Tags:</span>
                              <div className="flex flex-wrap gap-1">
                                {service.tags?.slice(0, 3).map((tag: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined, index: React.Key | null | undefined) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {service.tags?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{service.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Create your first service to start attracting clients
                    </p>
                    <Button onClick={() => setShowServiceForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Service
                    </Button>
                  </div>
                )}
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
              <CardContent className="space-y-6">
                {/* Profile Visibility */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Profile Visibility</h4>
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value: any) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>Public (Anyone can view)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="connections">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Connections Only</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="private">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Private</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Information Visibility */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Information Visibility</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Email Address</span>
                        </div>
                        <Switch
                          checked={privacySettings.showEmail}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showEmail: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Phone Number</span>
                        </div>
                        <Switch
                          checked={privacySettings.showPhone}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showPhone: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Location</span>
                        </div>
                        <Switch
                          checked={privacySettings.showLocation}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showLocation: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Age</span>
                        </div>
                        <Switch
                          checked={privacySettings.showAge}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showAge: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Interaction Settings */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Interaction Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Allow Messages</span>
                        </div>
                        <Switch
                          checked={privacySettings.allowMessages}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowMessages: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Allow Connection Requests</span>
                        </div>
                        <Switch
                          checked={privacySettings.allowConnections}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowConnections: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Activity Settings */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Activity Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Show Online Status</span>
                        </div>
                        <Switch
                          checked={privacySettings.showOnlineStatus}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showOnlineStatus: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Show Last Seen</span>
                        </div>
                        <Switch
                          checked={privacySettings.showLastSeen}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showLastSeen: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">Show Profile Views</span>
                        </div>
                        <Switch
                          checked={privacySettings.showProfileViews}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showProfileViews: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePrivacySettingsUpdate}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Privacy Settings
                  </Button>
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
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Messages</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection Requests</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Job Matches</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Followers</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Newsletter</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Push Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Messages</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection Requests</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Job Alerts</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Followers</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                {/* In-App Notifications */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">In-App Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Messages</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connection Requests</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Post Interactions</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Job Matches</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleNotificationPreferencesUpdate}
                  disabled={saving}
                  className="w-full"
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Notification Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FreelancerProfileEditForm;