/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';

// Services
import {  profileService, type Profile, type Experience as ProfileExperience, type PortfolioProject as ProfilePortfolioProject } from '@/services/profileService';
import { freelancerService, type ProfileData, type UserProfile, type PortfolioItem, type Service, Certification, type PortfolioFormData, type ServiceData } from '@/services/freelancerService';
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import AvatarUploader from '@/components/profile/AvatarUploader';
import PortfolioCard from '@/components/freelancer/PortfolioCard';
import PortfolioForm from '@/components/freelancer/PortfolioForm';

// Theme and colors
import {  getTheme } from '@/utils/color';
import {
  Linkedin, Github, Twitter, Instagram, Facebook, Youtube, Music,
  MessageCircle, MessageSquare, PenTool, Palette, BookOpen, Code2,
  Share2, Loader2, Building2, CheckCircle2, User, Briefcase, Layers,
  Target, Shield, DollarSign, Save, Sparkles, X, Plus,
  Award, Edit3, Trash2, ExternalLink, MapPin, Phone, Globe, PlusCircle,
  Users, Mail, Calendar, UserPlus, Bell, Send, Gitlab as GitlabIcon
} from 'lucide-react';

// Type definitions for form data
interface FormSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  yearsOfExperience: number;
}

interface FormCertification {
  _id?: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[];
}

// Validation schemas
const phoneRegex = /^(\+?\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}$|^09\d{8}$/;

const freelancerProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  headline: z.string().min(5, 'Headline must be at least 5 characters').optional(),
  bio: z.string().max(2000, 'Bio must be less than 2000 characters').optional(),
  dateOfBirth: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
    message: 'Invalid date format'
  }).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer-not-to-say']).optional(),

  freelancerProfile: z.object({
    hourlyRate: z.number().min(5, 'Hourly rate must be at least $5').optional(),
    availability: z.enum(['available', 'not-available', 'part-time']).optional(),
    experienceLevel: z.enum(['entry', 'intermediate', 'expert']).optional(),
    englishProficiency: z.enum(['basic', 'conversational', 'fluent', 'native']).optional(),
    specialization: z.array(z.string()).optional()
  }).optional()
});

type FreelancerProfileFormData = z.infer<typeof freelancerProfileSchema>;

const professionalInfoSchema = z.object({
  skills: z.array(z.object({
    name: z.string().min(1, 'Skill name required'),
    level: z.enum(['beginner', 'intermediate', 'expert']),
    yearsOfExperience: z.number().min(0)
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
  location: z.string().optional(),
  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  timezone: z.string().optional(),
  socialLinks: z.object({
    linkedin: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
    github: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
    twitter: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
    instagram: z.string().url('Invalid Instagram URL').optional().or(z.literal('')),
    facebook: z.string().url('Invalid Facebook URL').optional().or(z.literal('')),
    youtube: z.string().url('Invalid YouTube URL').optional().or(z.literal('')),
    tiktok: z.string().url('Invalid TikTok URL').optional().or(z.literal('')),
    telegram: z.string().url('Invalid Telegram URL').optional().or(z.literal('')),
    whatsapp: z.string().url('Invalid WhatsApp URL').optional().or(z.literal('')),
    discord: z.string().url('Invalid Discord URL').optional().or(z.literal('')),
    behance: z.string().url('Invalid Behance URL').optional().or(z.literal('')),
    dribbble: z.string().url('Invalid Dribbble URL').optional().or(z.literal('')),
    medium: z.string().url('Invalid Medium URL').optional().or(z.literal('')),
    devto: z.string().url('Invalid Dev.to URL').optional().or(z.literal('')),
    stackoverflow: z.string().url('Invalid Stack Overflow URL').optional().or(z.literal('')),
    codepen: z.string().url('Invalid CodePen URL').optional().or(z.literal('')),
    gitlab: z.string().url('Invalid GitLab URL').optional().or(z.literal(''))
  }).optional()
});

type ProfessionalInfoFormData = z.infer<typeof professionalInfoSchema>;

const serviceSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  priceType: z.enum(['fixed', 'hourly']),
  price: z.number().min(1, 'Price must be at least $1'),
  deliveryTime: z.number().min(1, 'Delivery time must be at least 1 day')
});

type ServiceFormData = z.infer<typeof serviceSchema>;

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

// Helper functions
const transformFormSkillsToProfileSkills = (skills: FormSkill[]): ProfileData['skills'] => {
  return skills.map(skill => ({
    name: skill.name,
    level: skill.level,
    yearsOfExperience: skill.yearsOfExperience
  }));
};

const transformFormCertificationToRoleCertification = (certifications: FormCertification[]): Certification[] => {
  return certifications.map(cert => ({
    _id: cert._id,
    name: cert.name,
    issuer: cert.issuer,
    issueDate: cert.issueDate,
    expiryDate: cert.expiryDate,
    credentialId: cert.credentialId,
    credentialUrl: cert.credentialUrl,
    description: '',
    skills: cert.skills || []
  }));
};

// Social media platforms
const socialPlatforms = [
  { name: 'linkedin', icon: Linkedin, placeholder: 'https://linkedin.com/in/username', color: '#0077B5' },
  { name: 'github', icon: Github, placeholder: 'https://github.com/username', color: '#333' },
  { name: 'twitter', icon: Twitter, placeholder: 'https://twitter.com/username', color: '#1DA1F2' },
  { name: 'instagram', icon: Instagram, placeholder: 'https://instagram.com/username', color: '#E4405F' },
  { name: 'facebook', icon: Facebook, placeholder: 'https://facebook.com/username', color: '#1877F2' },
  { name: 'youtube', icon: Youtube, placeholder: 'https://youtube.com/@channel', color: '#FF0000' },
  { name: 'tiktok', icon: Music, placeholder: 'https://tiktok.com/@username', color: '#000000' },
  { name: 'telegram', icon: Send, placeholder: 'https://t.me/username', color: '#26A5E4' },
  { name: 'whatsapp', icon: MessageCircle, placeholder: 'https://wa.me/1234567890', color: '#25D366' },
  { name: 'discord', icon: MessageSquare, placeholder: 'https://discord.gg/invite', color: '#5865F2' },
  { name: 'behance', icon: PenTool, placeholder: 'https://behance.net/username', color: '#1769FF' },
  { name: 'dribbble', icon: Palette, placeholder: 'https://dribbble.com/username', color: '#EA4C89' },
  { name: 'medium', icon: BookOpen, placeholder: 'https://medium.com/@username', color: '#12100E' },
  { name: 'devto', icon: Code2, placeholder: 'https://dev.to/username', color: '#0A0A0A' },
  { name: 'stackoverflow', icon: Share2, placeholder: 'https://stackoverflow.com/users/12345', color: '#F48024' },
  { name: 'codepen', icon: PenTool, placeholder: 'https://codepen.io/username', color: '#000000' },
  { name: 'gitlab', icon: GitlabIcon, placeholder: 'https://gitlab.com/username', color: '#FC6D26' }
];

const calculateAge = (dateOfBirth: string): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

export const FreelancerProfileEditForm: React.FC = () => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [professionalData, setProfessionalData] = useState<any>(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [editingPortfolioItem, setEditingPortfolioItem] = useState<PortfolioItem | null>(null);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingCertification, setEditingCertification] = useState<{cert: FormCertification, index: number} | null>(null);
  const [showCertificationForm, setShowCertificationForm] = useState(false);
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
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [calculatedAge, setCalculatedAge] = useState<number | null>(null);
  const [newCertification, setNewCertification] = useState<FormCertification>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    credentialId: '',
    credentialUrl: '',
    skills: []
  });
  
  const isMounted = useRef(true);

  // Theme detection
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeQuery.addEventListener('change', handleChange);

    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  const theme = getTheme(isDarkMode ? 'dark' : 'light');

  // Forms
  const profileForm = useForm<FreelancerProfileFormData>({
    resolver: zodResolver(freelancerProfileSchema),
    defaultValues: { freelancerProfile: {} }
  });

  const professionalForm = useForm<ProfessionalInfoFormData>({
    resolver: zodResolver(professionalInfoSchema),
    defaultValues: {
      skills: [],
      certifications: [],
      socialLinks: {}
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
      deliveryTime: 7
    }
  });

  // Calculate age when dateOfBirth changes
  useEffect(() => {
    const subscription = profileForm.watch((value, { name }) => {
      if (name === 'dateOfBirth') {
        const age = calculateAge(value.dateOfBirth as string);
        setCalculatedAge(age);
      }
    });
    return () => subscription.unsubscribe();
  }, [profileForm]);

  // Load profile data
  useEffect(() => {
    isMounted.current = true;
    loadProfileData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      const [
        mainProfile,
        freelancerData,
        roleProfileData,
        freelancerServices,
        portfolioData,
        completion
      ] = await Promise.all([
        profileService.getProfile(),
        freelancerService.getProfile(),
        roleProfileService.getFreelancerProfile(),
        freelancerService.getServices(),
        freelancerService.getPortfolio({ limit: 100 }).catch(() => ({ items: [] })),
        profileService.getProfileCompletion()
      ]);

      if (!isMounted.current) return;

      setProfile(mainProfile);
      setFreelancerProfile(freelancerData);
      setProfessionalData(roleProfileData);
      setServices(freelancerServices);
      setProfileCompletion(completion.percentage);

      if (freelancerData.dateOfBirth) {
        setCalculatedAge(calculateAge(freelancerData.dateOfBirth));
      }

      const cloudinaryItems = portfolioData.items.filter(item => 
        item.mediaUrls?.some(url => url?.includes('cloudinary.com'))
      );
      setPortfolioItems(cloudinaryItems);

      if (mainProfile.privacySettings) {
        setPrivacySettings(mainProfile.privacySettings as PrivacySettingsData);
      }

      profileForm.reset({
        name: mainProfile.user.name,
        headline: mainProfile.headline,
        bio: mainProfile.bio,
        dateOfBirth: freelancerData.dateOfBirth ? formatDateForInput(freelancerData.dateOfBirth) : '',
        gender: freelancerData.gender as any,
        freelancerProfile: {
          hourlyRate: freelancerData.freelancerProfile?.hourlyRate,
          availability: freelancerData.freelancerProfile?.availability as any,
          experienceLevel: freelancerData.freelancerProfile?.experienceLevel as any,
          englishProficiency: freelancerData.freelancerProfile?.englishProficiency as any,
          specialization: freelancerData.freelancerProfile?.specialization
        }
      });

      // Transform skills
      const transformSkills = (skills: any[]): FormSkill[] => {
        if (!skills || skills.length === 0) return [];
        return skills.map(skill => {
          if (typeof skill === 'string') {
            return { name: skill, level: 'intermediate', yearsOfExperience: 2 };
          }
          return {
            name: skill.name || skill,
            level: skill.level || 'intermediate',
            yearsOfExperience: skill.yearsOfExperience || 2
          };
        });
      };

      // Transform certifications
      const transformCertifications = (certs: any[]): FormCertification[] => {
        if (!certs || certs.length === 0) return [];
        return certs.map(cert => ({
          _id: cert._id,
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issueDate ? formatDateForInput(cert.issueDate) : '',
          expiryDate: cert.expiryDate ? formatDateForInput(cert.expiryDate) : '',
          credentialId: cert.credentialId || '',
          credentialUrl: cert.credentialUrl || '',
          skills: cert.skills || []
        }));
      };

      professionalForm.reset({
        skills: transformSkills(roleProfileData.skills || []),
        certifications: transformCertifications(roleProfileData.certifications || []),
        location: mainProfile.location || '',
        phone: mainProfile.phone || '',
        website: mainProfile.website || '',
        timezone: freelancerData.freelancerProfile?.timezone || '',
        socialLinks: freelancerData.freelancerProfile?.socialLinks || freelancerData.socialLinks || {}
      });

    } catch (error) {
      if (isMounted.current) {
        toast.error('Failed to load profile data');
        console.error('Error loading profile:', error);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleProfileSubmit = async (data: FreelancerProfileFormData) => {
    try {
      setSaving(true);

      await profileService.updateProfile({
        headline: data.headline,
        bio: data.bio
      });

      await freelancerService.updateProfile({
        name: data.name,
        bio: data.bio,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        freelancerProfile: data.freelancerProfile,
        skills: []
      });

      toast.success('Basic information updated successfully');
      
      if (data.dateOfBirth) {
        setCalculatedAge(calculateAge(data.dateOfBirth));
      }
      
      await loadProfileData();
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Profile update error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleProfessionalSubmit = async (data: ProfessionalInfoFormData) => {
    try {
      setSaving(true);

      await roleProfileService.updateFreelancerProfile({
        skills: data.skills.map(s => s.name),
        certifications: transformFormCertificationToRoleCertification(data.certifications)
      });

      await freelancerService.updateProfile({
        skills: transformFormSkillsToProfileSkills(data.skills),
        socialLinks: data.socialLinks,
        freelancerProfile: {
          timezone: data.timezone
        }
      });

      await profileService.updateProfile({
        location: data.location,
        phone: data.phone,
        website: data.website
      });

      toast.success('Professional information updated successfully');
      await loadProfileData();
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
      
      const serviceData: ServiceData = {
        title: data.title,
        description: data.description,
        price: data.price,
        priceType: data.priceType,
        deliveryTime: data.deliveryTime,
        category: data.category
      };

      if (editingService) {
        await freelancerService.addService(serviceData);
        toast.success('Service updated successfully');
      } else {
        await freelancerService.addService(serviceData);
        toast.success('Service created successfully');
      }
      
      setShowServiceForm(false);
      setEditingService(null);
      serviceForm.reset();

      const updatedServices = await freelancerService.getServices();
      setServices(updatedServices);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service');
      console.error('Service save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      setServices(services.filter(s => s._id !== id));
      toast.success('Service deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete service');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
      title: service.title,
      description: service.description,
      category: service.category || '',
      priceType: service.priceType,
      price: service.price,
      deliveryTime: service.deliveryTime
    });
    setShowServiceForm(true);
  };

  // Certification handlers - FIXED
  const handleAddCertification = () => {
    setEditingCertification(null);
    setNewCertification({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
      skills: []
    });
    setShowCertificationForm(true);
  };

  const handleEditCertification = (cert: FormCertification, index: number) => {
    setEditingCertification({ cert, index });
    setNewCertification({ ...cert });
    setShowCertificationForm(true);
  };

  const handleDeleteCertification = (index: number) => {
    if (!window.confirm('Are you sure you want to delete this certification?')) return;
    const currentCerts = professionalForm.getValues('certifications');
    professionalForm.setValue('certifications', currentCerts.filter((_, i) => i !== index));
  };

  const handleSaveCertification = () => {
    const { name, issuer, issueDate } = newCertification;
    if (!name || !issuer || !issueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const currentCerts = professionalForm.getValues('certifications');
    
    if (editingCertification) {
      const updatedCerts = [...currentCerts];
      updatedCerts[editingCertification.index] = newCertification;
      professionalForm.setValue('certifications', updatedCerts);
    } else {
      professionalForm.setValue('certifications', [...currentCerts, newCertification]);
    }

    setShowCertificationForm(false);
    setEditingCertification(null);
    setNewCertification({
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialId: '',
      credentialUrl: '',
      skills: []
    });
  };

  const handleCertificationSkillAdd = (skill: string) => {
    if (!skill.trim()) return;
    setNewCertification(prev => ({
      ...prev,
      skills: [...(prev.skills || []), skill.trim()]
    }));
  };

  const handleCertificationSkillRemove = (index: number) => {
    setNewCertification(prev => ({
      ...prev,
      skills: (prev.skills || []).filter((_, i) => i !== index)
    }));
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

  const handlePrivacySettingsUpdate = async () => {
    try {
      setSaving(true);
      await profileService.updatePrivacySettings(privacySettings);
      toast.success('Privacy settings updated successfully');
      await loadProfileData();
    } catch (error) {
      toast.error('Failed to update privacy settings');
      console.error('Privacy settings error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUploadComplete = async () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Profile picture updated successfully');
    await loadProfileData();
  };

  const handleCoverUploadComplete = async () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Cover photo updated successfully');
    await loadProfileData();
  };

  const handleAddPortfolioItem = async (data: PortfolioFormData) => {
    try {
      setSaving(true);
      
      const cloudinaryUrls = data.mediaUrls.filter(url => url.includes('cloudinary.com'));
      if (cloudinaryUrls.length === 0) {
        throw new Error('Please upload images to Cloudinary first');
      }

      await freelancerService.addPortfolioItem({
        ...data,
        mediaUrls: cloudinaryUrls
      });
      
      toast.success('Portfolio item added successfully');
      await loadProfileData();
      setShowPortfolioForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add portfolio item');
      console.error('Portfolio add error:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleEditPortfolioItem = async (data: PortfolioFormData) => {
    if (!editingPortfolioItem) return;
    
    try {
      setSaving(true);
      
      const cloudinaryUrls = data.mediaUrls.filter(url => url.includes('cloudinary.com'));
      if (cloudinaryUrls.length === 0) {
        throw new Error('Please upload images to Cloudinary first');
      }

      await freelancerService.updatePortfolioItem(editingPortfolioItem._id, {
        ...data,
        mediaUrls: cloudinaryUrls
      });
      
      toast.success('Portfolio item updated successfully');
      await loadProfileData();
      setEditingPortfolioItem(null);
      setShowPortfolioForm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update portfolio item');
      console.error('Portfolio update error:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePortfolioItem = async (id: string) => {
    try {
      await freelancerService.deletePortfolioItem(id);
      toast.success('Portfolio item deleted successfully');
      await loadProfileData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete portfolio item');
      console.error('Portfolio delete error:', error);
    }
  };

  const handleEditPortfolioClick = (item: PortfolioItem) => {
    setEditingPortfolioItem(item);
    setShowPortfolioForm(true);
  };

  const handlePortfolioFormClose = () => {
    setShowPortfolioForm(false);
    setEditingPortfolioItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.bg.gold }} />
      </div>
    );
  }

  if (!profile || !freelancerProfile) return null;

  return (
    <div className="space-y-6">
      {/* Branding Card */}
      <Card
        className="border overflow-hidden"
        style={{
          backgroundColor: theme.bg.surface,
          borderColor: theme.border.primary
        }}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2" style={{ color: theme.text.primary }}>
            <Building2 className="w-5 h-5" />
            Profile Branding
          </CardTitle>
          <CardDescription style={{ color: theme.text.secondary }}>
            Update your profile picture and cover photo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AvatarUploader
            currentAvatar={profile.avatar}
            currentCover={profile.cover}
            onAvatarComplete={handleAvatarUploadComplete}
            onCoverComplete={handleCoverUploadComplete}
            type="both"
            aspectRatio={{ avatar: '1:1', cover: '16:9' }}
            maxFileSize={{ avatar: 5, cover: 10 }}
            showHelperText={true}
            userId={profile.user._id}
          />

          <div className="pt-4 border-t" style={{ borderColor: theme.border.primary }}>
            <h4 className="text-sm font-medium mb-3" style={{ color: theme.text.secondary }}>
              Profile Status
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: theme.text.muted }}>Avatar Uploaded</span>
                {profile.avatar ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: theme.text.success }} />
                ) : (
                  <span className="text-xs" style={{ color: theme.text.muted }}>Pending</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: theme.text.muted }}>Cover Photo</span>
                {profile.cover ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: theme.text.success }} />
                ) : (
                  <span className="text-xs" style={{ color: theme.text.muted }}>Optional</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: theme.text.muted }}>Age</span>
                <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
                  {calculatedAge ? `${calculatedAge} years` : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: theme.text.muted }}>Profile Completion</span>
                <div className="flex items-center gap-2">
                  <Progress value={profileCompletion} className="w-16 h-2" />
                  <span className="text-sm font-medium" style={{ color: theme.text.primary }}>
                    {profileCompletion}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList
          className="grid grid-cols-2 md:grid-cols-5 w-full"
          style={{ backgroundColor: theme.bg.secondary, borderColor: theme.border.primary }}
        >
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden md:inline">Basic Info</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            <span className="hidden md:inline">Professional</span>
          </TabsTrigger>
          <TabsTrigger value="portfolio" className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Portfolio</span>
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span className="hidden md:inline">Services</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden md:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Basic Info Tab - unchanged */}
        <TabsContent value="basic" className="space-y-6">
          <Card style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: theme.text.primary }}>
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
              <CardDescription style={{ color: theme.text.secondary }}>
                Update your personal information and freelancer details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  {/* Basic Info form fields - keep as is */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text.primary }}>
                        <User className="w-4 h-4" />
                        Personal Information
                      </h3>

                      <FormField
                        control={profileForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: theme.text.secondary }}>Full Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John Doe"
                                {...field}
                                style={{
                                  backgroundColor: theme.bg.gray100,
                                  borderColor: theme.border.primary,
                                  color: theme.text.primary
                                }}
                              />
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
                            <FormLabel style={{ color: theme.text.secondary }}>Freelancer Headline</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Senior Full-Stack Developer"
                                {...field}
                                style={{
                                  backgroundColor: theme.bg.gray100,
                                  borderColor: theme.border.primary,
                                  color: theme.text.primary
                                }}
                              />
                            </FormControl>
                            <FormDescription style={{ color: theme.text.muted }}>
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
                            <FormLabel style={{ color: theme.text.secondary }}>Date of Birth</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ''}
                                onChange={(e) => {
                                  field.onChange(e);
                                  const age = calculateAge(e.target.value);
                                  setCalculatedAge(age);
                                }}
                                style={{
                                  backgroundColor: theme.bg.gray100,
                                  borderColor: theme.border.primary,
                                  color: theme.text.primary
                                }}
                              />
                            </FormControl>
                            {calculatedAge && (
                              <FormDescription style={{ color: theme.text.muted }}>
                                Age: {calculatedAge} years
                              </FormDescription>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: theme.text.secondary }}>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                >
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent style={{ backgroundColor: theme.bg.surface }}>
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
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text.primary }}>
                        <Briefcase className="w-4 h-4" />
                        Freelancer Details
                      </h3>

                      <FormField
                        control={profileForm.control}
                        name="freelancerProfile.hourlyRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: theme.text.secondary }}>Hourly Rate ($/hr)</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-2" style={{ color: theme.text.muted }} />
                                <Input
                                  type="number"
                                  placeholder="50"
                                  {...field}
                                  value={field.value || ''}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
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
                            <FormLabel style={{ color: theme.text.secondary }}>Availability</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                >
                                  <SelectValue placeholder="Select availability" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent style={{ backgroundColor: theme.bg.surface }}>
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
                            <FormLabel style={{ color: theme.text.secondary }}>Experience Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                >
                                  <SelectValue placeholder="Select experience level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent style={{ backgroundColor: theme.bg.surface }}>
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
                            <FormLabel style={{ color: theme.text.secondary }}>English Proficiency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                >
                                  <SelectValue placeholder="Select proficiency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent style={{ backgroundColor: theme.bg.surface }}>
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

                  {/* Bio */}
                  <div>
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel style={{ color: theme.text.secondary }}>About Me</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your skills, experience, and what makes you a great freelancer..."
                              className="min-h-[140px]"
                              {...field}
                              value={field.value || ''}
                              style={{
                                backgroundColor: theme.bg.gray100,
                                borderColor: theme.border.primary,
                                color: theme.text.primary
                              }}
                            />
                          </FormControl>
                          <FormDescription style={{ color: theme.text.muted }}>
                            Share your story and expertise with potential clients
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end pt-4 border-t" style={{ borderColor: theme.border.primary }}>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full md:w-auto"
                      style={{
                        background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                        color: theme.text.inverse
                      }}
                    >
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" />
                      Save Basic Information
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Tab - Removed Experience & Education */}
        <TabsContent value="professional" className="space-y-6">
          <Card style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: theme.text.primary }}>
                <Briefcase className="w-5 h-5" />
                Professional Information
              </CardTitle>
              <CardDescription style={{ color: theme.text.secondary }}>
                Your skills, certifications, contact information, and social links
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...professionalForm}>
                <form onSubmit={professionalForm.handleSubmit(handleProfessionalSubmit)} className="space-y-8">
                  {/* Skills Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text.primary }}>
                        <Sparkles className="w-4 h-4" />
                        Skills & Expertise
                      </h3>
                      <Badge variant="outline" style={{ borderColor: theme.border.primary }}>
                        {professionalForm.watch('skills')?.length || 0} skills
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a skill (e.g., React, Python, UI/UX Design)"
                          value={skillInput}
                          onChange={(e) => setSkillInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          style={{
                            backgroundColor: theme.bg.gray100,
                            borderColor: theme.border.primary,
                            color: theme.text.primary
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addSkill}
                          style={{
                            background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                            color: theme.text.inverse
                          }}
                        >
                          Add
                        </Button>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {professionalForm.watch('skills').map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="px-3 py-1 flex items-center gap-2"
                            style={{
                              backgroundColor: isDarkMode ? `${theme.bg.gold}20` : `${theme.bg.gold}10`,
                              color: theme.bg.gold,
                              borderColor: isDarkMode ? `${theme.bg.gold}30` : `${theme.bg.gold}20`
                            }}
                          >
                            {skill.name}
                            <button
                              type="button"
                              onClick={() => removeSkill(index)}
                              className="hover:opacity-70"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator style={{ backgroundColor: theme.border.primary }} />

                  {/* Certifications Section - FIXED */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text.primary }}>
                        <Award className="w-4 h-4" />
                        Certifications
                      </h3>
                      <Badge variant="outline" style={{ borderColor: theme.border.primary }}>
                        {professionalForm.watch('certifications')?.length || 0} certifications
                      </Badge>
                    </div>

                    {professionalForm.watch('certifications').length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg" style={{ borderColor: theme.border.secondary }}>
                        <Award className="w-12 h-12 mx-auto mb-3" style={{ color: theme.text.muted }} />
                        <p className="text-sm mb-4" style={{ color: theme.text.secondary }}>No certifications added yet</p>
                      </div>
                    ) : (
                      professionalForm.watch('certifications').map((cert, index) => (
                        <Card key={index} className="relative" style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}>
                          <div className="absolute top-2 right-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditCertification(cert, index)}
                              className="p-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteCertification(index)}
                              className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                          </div>
                          <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs" style={{ color: theme.text.muted }}>Name</label>
                                <p className="text-sm font-medium" style={{ color: theme.text.primary }}>{cert.name}</p>
                              </div>
                              <div>
                                <label className="text-xs" style={{ color: theme.text.muted }}>Issuer</label>
                                <p className="text-sm" style={{ color: theme.text.secondary }}>{cert.issuer}</p>
                              </div>
                              <div>
                                <label className="text-xs" style={{ color: theme.text.muted }}>Issue Date</label>
                                <p className="text-sm" style={{ color: theme.text.secondary }}>
                                  {cert.issueDate ? format(new Date(cert.issueDate), 'MMM yyyy') : 'N/A'}
                                </p>
                              </div>
                              {cert.expiryDate && (
                                <div>
                                  <label className="text-xs" style={{ color: theme.text.muted }}>Expiry Date</label>
                                  <p className="text-sm" style={{ color: theme.text.secondary }}>
                                    {format(new Date(cert.expiryDate), 'MMM yyyy')}
                                  </p>
                                </div>
                              )}
                              {cert.credentialId && (
                                <div className="col-span-2">
                                  <label className="text-xs" style={{ color: theme.text.muted }}>Credential ID</label>
                                  <p className="text-sm" style={{ color: theme.text.secondary }}>{cert.credentialId}</p>
                                </div>
                              )}
                              {cert.credentialUrl && (
                                <div className="col-span-2">
                                  <label className="text-xs" style={{ color: theme.text.muted }}>Credential URL</label>
                                  <a
                                    href={cert.credentialUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm flex items-center gap-1 hover:underline"
                                    style={{ color: theme.bg.gold }}
                                  >
                                    View Credential
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                              {cert.skills && cert.skills.length > 0 && (
                                <div className="col-span-2">
                                  <label className="text-xs" style={{ color: theme.text.muted }}>Skills</label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {cert.skills.map((skill, i) => (
                                      <Badge
                                        key={i}
                                        variant="outline"
                                        className="text-xs"
                                        style={{
                                          borderColor: theme.border.primary,
                                          color: theme.text.secondary
                                        }}
                                      >
                                        {skill}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCertification}
                      className="w-full"
                      style={{
                        borderColor: theme.border.primary,
                        color: theme.text.primary
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Certification
                    </Button>
                  </div>

                  <Separator style={{ backgroundColor: theme.border.primary }} />

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text.primary }}>
                      <MapPin className="w-4 h-4" />
                      Contact Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={professionalForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: theme.text.secondary }}>Location</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2" style={{ color: theme.text.muted }} />
                                <Input
                                  placeholder="Addis Ababa, Ethiopia"
                                  {...field}
                                  value={field.value || ''}
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={professionalForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: theme.text.secondary }}>Phone Number</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Phone className="w-4 h-4 mr-2" style={{ color: theme.text.muted }} />
                                <Input
                                  placeholder="0977809831"
                                  {...field}
                                  value={field.value || ''}
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription style={{ color: theme.text.muted }}>
                              Enter local format (e.g., 0977809831) or international
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={professionalForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: theme.text.secondary }}>Website/Portfolio</FormLabel>
                            <FormControl>
                              <div className="flex items-center">
                                <Globe className="w-4 h-4 mr-2" style={{ color: theme.text.muted }} />
                                <Input
                                  placeholder="https://yourportfolio.com"
                                  {...field}
                                  value={field.value || ''}
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={professionalForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel style={{ color: theme.text.secondary }}>Timezone</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger
                                  style={{
                                    backgroundColor: theme.bg.gray100,
                                    borderColor: theme.border.primary,
                                    color: theme.text.primary
                                  }}
                                >
                                  <SelectValue placeholder="Select timezone" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent style={{ backgroundColor: theme.bg.surface }}>
                                <SelectItem value="UTC-5">EST (UTC-5)</SelectItem>
                                <SelectItem value="UTC-8">PST (UTC-8)</SelectItem>
                                <SelectItem value="UTC+0">GMT (UTC+0)</SelectItem>
                                <SelectItem value="UTC+1">CET (UTC+1)</SelectItem>
                                <SelectItem value="UTC+2">EET (UTC+2)</SelectItem>
                                <SelectItem value="UTC+3">EAT (UTC+3)</SelectItem>
                                <SelectItem value="UTC+5.5">IST (UTC+5:30)</SelectItem>
                                <SelectItem value="UTC+8">CST (UTC+8)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator style={{ backgroundColor: theme.border.primary }} />

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: theme.text.primary }}>
                      <Share2 className="w-4 h-4" />
                      Social Links
                    </h3>
                    <p className="text-xs mb-2" style={{ color: theme.text.muted }}>
                      Connect your social media profiles to build trust with clients
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {socialPlatforms.map((platform) => {
                        const Icon = platform.icon;
                        return (
                          <FormField
                            key={platform.name}
                            control={professionalForm.control}
                            name={`socialLinks.${platform.name}` as any}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2" style={{ color: theme.text.secondary }}>
                                  <Icon className="w-4 h-4" style={{ color: platform.color }} />
                                  {platform.name.charAt(0).toUpperCase() + platform.name.slice(1)}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={platform.placeholder}
                                    {...field}
                                    value={field.value || ''}
                                    style={{
                                      backgroundColor: theme.bg.gray100,
                                      borderColor: theme.border.primary,
                                      color: theme.text.primary
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t" style={{ borderColor: theme.border.primary }}>
                    <Button
                      type="submit"
                      disabled={saving}
                      className="w-full md:w-auto"
                      style={{
                        background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                        color: theme.text.inverse
                      }}
                    >
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Save className="w-4 h-4 mr-2" />
                      Save Professional Info
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portfolio Tab - Updated with new card and single column */}
        <TabsContent value="portfolio">
          <Card style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: theme.text.primary }}>
                <Layers className="w-5 h-5" />
                Portfolio
              </CardTitle>
              <CardDescription style={{ color: theme.text.secondary }}>
                Showcase your best work to attract clients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Add Portfolio Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={() => setShowPortfolioForm(true)}
                    style={{
                      background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                      color: theme.text.inverse
                    }}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add New Project
                  </Button>
                </div>

                {/* Portfolio Grid - Single column */}
                {portfolioItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
                    {portfolioItems.map((item) => (
                      <PortfolioCard
                        key={item._id}
                        item={item}
                        onEdit={handleEditPortfolioClick}
                        onDelete={handleDeletePortfolioItem}
                        isOwnProfile={true}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    className="text-center py-12 border-2 border-dashed rounded-lg"
                    style={{ borderColor: isDarkMode ? `${theme.bg.gold}30` : `${theme.bg.gold}20` }}
                  >
                    <Layers className="w-12 h-12 mx-auto mb-4" style={{ color: theme.bg.gold }} />
                    <h3 className="text-lg font-medium mb-2" style={{ color: theme.text.primary }}>
                      No Portfolio Items Yet
                    </h3>
                    <p className="mb-6" style={{ color: theme.text.secondary }}>
                      Showcase your work to attract more clients
                    </p>
                    <Button
                      onClick={() => setShowPortfolioForm(true)}
                      style={{
                        background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                        color: theme.text.inverse
                      }}
                    >
                      Add Your First Project
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab - unchanged */}
        <TabsContent value="services">
          <Card style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: theme.text.primary }}>
                <Target className="w-5 h-5" />
                Services
              </CardTitle>
              <CardDescription style={{ color: theme.text.secondary }}>
                Define and manage your freelance services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex justify-end">
                  <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
                    <DialogTrigger asChild>
                      <Button
                        style={{
                          background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                          color: theme.text.inverse
                        }}
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Add New Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl" style={{ backgroundColor: theme.bg.surface }}>
                      <DialogHeader>
                        <DialogTitle style={{ color: theme.text.primary }}>
                          {editingService ? 'Edit Service' : 'Create New Service'}
                        </DialogTitle>
                        <DialogDescription style={{ color: theme.text.secondary }}>
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
                                <FormLabel style={{ color: theme.text.secondary }}>Service Title *</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Professional Website Development"
                                    {...field}
                                    style={{
                                      backgroundColor: theme.bg.gray100,
                                      borderColor: theme.border.primary,
                                      color: theme.text.primary
                                    }}
                                  />
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
                                <FormLabel style={{ color: theme.text.secondary }}>Description *</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Describe what you'll deliver..."
                                    className="min-h-25"
                                    {...field}
                                    style={{
                                      backgroundColor: theme.bg.gray100,
                                      borderColor: theme.border.primary,
                                      color: theme.text.primary
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={serviceForm.control}
                              name="category"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ color: theme.text.secondary }}>Category *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger
                                        style={{
                                          backgroundColor: theme.bg.gray100,
                                          borderColor: theme.border.primary,
                                          color: theme.text.primary
                                        }}
                                      >
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent style={{ backgroundColor: theme.bg.surface }}>
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
                                  <FormLabel style={{ color: theme.text.secondary }}>Price Type *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger
                                        style={{
                                          backgroundColor: theme.bg.gray100,
                                          borderColor: theme.border.primary,
                                          color: theme.text.primary
                                        }}
                                      >
                                        <SelectValue placeholder="Select price type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent style={{ backgroundColor: theme.bg.surface }}>
                                      <SelectItem value="fixed">Fixed Price</SelectItem>
                                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={serviceForm.control}
                              name="price"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel style={{ color: theme.text.secondary }}>Price ($) *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                      style={{
                                        backgroundColor: theme.bg.gray100,
                                        borderColor: theme.border.primary,
                                        color: theme.text.primary
                                      }}
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
                                  <FormLabel style={{ color: theme.text.secondary }}>Delivery (days) *</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      value={field.value || ''}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      style={{
                                        backgroundColor: theme.bg.gray100,
                                        borderColor: theme.border.primary,
                                        color: theme.text.primary
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowServiceForm(false);
                                setEditingService(null);
                                serviceForm.reset();
                              }}
                              style={{
                                borderColor: theme.border.primary,
                                color: theme.text.primary
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={saving}
                              style={{
                                background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                                color: theme.text.inverse
                              }}
                            >
                              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              <Save className="w-4 h-4 mr-2" />
                              {editingService ? 'Update Service' : 'Create Service'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>

                {services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <Card
                        key={service._id}
                        className="hover:shadow-lg transition-shadow relative group"
                        style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}
                      >
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            onClick={() => handleEditService(service)}
                            className="p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:bg-amber-50 dark:hover:bg-amber-900/30"
                          >
                            <Edit3 className="w-4 h-4 text-amber-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteService(service._id)}
                            className="p-2 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-lg hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg pr-16" style={{ color: theme.text.primary }}>
                            {service.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2" style={{ color: theme.text.secondary }}>
                            {service.description}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm" style={{ color: theme.text.muted }}>Price:</span>
                              <span className="font-bold text-lg" style={{ color: theme.bg.gold }}>
                                ${service.price} {service.priceType === 'hourly' ? '/hr' : ''}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm" style={{ color: theme.text.muted }}>Delivery:</span>
                              <span className="font-medium" style={{ color: theme.text.primary }}>
                                {service.deliveryTime} days
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm" style={{ color: theme.text.muted }}>Category:</span>
                              <Badge variant="outline" style={{ borderColor: theme.border.primary, color: theme.text.secondary }}>
                                {service.category?.replace('-', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: isDarkMode ? `${theme.bg.gold}30` : `${theme.bg.gold}20` }}>
                    <Target className="w-12 h-12 mx-auto mb-4" style={{ color: theme.bg.gold }} />
                    <h3 className="text-lg font-medium mb-2" style={{ color: theme.text.primary }}>No Services Yet</h3>
                    <p className="mb-6" style={{ color: theme.text.secondary }}>Create your first service to start attracting clients</p>
                    <Button
                      onClick={() => {
                        setEditingService(null);
                        serviceForm.reset();
                        setShowServiceForm(true);
                      }}
                      style={{
                        background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                        color: theme.text.inverse
                      }}
                    >
                      Create Your First Service
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab - unchanged */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Privacy Settings */}
            <Card style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <Shield className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription style={{ color: theme.text.secondary }}>
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2" style={{ color: theme.text.secondary }}>Profile Visibility</h4>
                    <Select
                      value={privacySettings.profileVisibility}
                      onValueChange={(value: any) => setPrivacySettings(prev => ({ ...prev, profileVisibility: value }))}
                    >
                      <SelectTrigger
                        style={{
                          backgroundColor: theme.bg.gray100,
                          borderColor: theme.border.primary,
                          color: theme.text.primary
                        }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: theme.bg.surface }}>
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
                            <Shield className="w-4 h-4" />
                            <span>Private</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: theme.text.secondary }}>Information Visibility</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" style={{ color: theme.text.muted }} />
                          <span className="text-sm" style={{ color: theme.text.primary }}>Email Address</span>
                        </div>
                        <Switch
                          checked={privacySettings.showEmail}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showEmail: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" style={{ color: theme.text.muted }} />
                          <span className="text-sm" style={{ color: theme.text.primary }}>Phone Number</span>
                        </div>
                        <Switch
                          checked={privacySettings.showPhone}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showPhone: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" style={{ color: theme.text.muted }} />
                          <span className="text-sm" style={{ color: theme.text.primary }}>Location</span>
                        </div>
                        <Switch
                          checked={privacySettings.showLocation}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showLocation: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" style={{ color: theme.text.muted }} />
                          <span className="text-sm" style={{ color: theme.text.primary }}>Show Age</span>
                        </div>
                        <Switch
                          checked={privacySettings.showAge}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showAge: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium" style={{ color: theme.text.secondary }}>Interaction Settings</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" style={{ color: theme.text.muted }} />
                          <span className="text-sm" style={{ color: theme.text.primary }}>Allow Messages</span>
                        </div>
                        <Switch
                          checked={privacySettings.allowMessages}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowMessages: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserPlus className="w-4 h-4" style={{ color: theme.text.muted }} />
                          <span className="text-sm" style={{ color: theme.text.primary }}>Allow Connection Requests</span>
                        </div>
                        <Switch
                          checked={privacySettings.allowConnections}
                          onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowConnections: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePrivacySettingsUpdate}
                    disabled={saving}
                    className="w-full"
                    style={{
                      background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                      color: theme.text.inverse
                    }}
                  >
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Privacy Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card style={{ backgroundColor: theme.bg.surface, borderColor: theme.border.primary }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" style={{ color: theme.text.primary }}>
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <CardDescription style={{ color: theme.text.secondary }}>
                  Manage your notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium flex items-center gap-2" style={{ color: theme.text.secondary }}>
                    <Mail className="w-4 h-4" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.text.primary }}>New Messages</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.text.primary }}>Connection Requests</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.text.primary }}>Job Matches</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.text.primary }}>New Followers</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium" style={{ color: theme.text.secondary }}>Push Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.text.primary }}>New Messages</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.text.primary }}>Connection Requests</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: theme.text.primary }}>Job Alerts</span>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePrivacySettingsUpdate}
                  disabled={saving}
                  className="w-full"
                  style={{
                    background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                    color: theme.text.inverse
                  }}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Notification Preferences
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Portfolio Form Modal */}
      {showPortfolioForm && (
        <PortfolioForm
          item={editingPortfolioItem}
          onSubmit={editingPortfolioItem ? handleEditPortfolioItem : handleAddPortfolioItem}
          onCancel={handlePortfolioFormClose}
          isLoading={saving}
        />
      )}

      {/* Certification Form Dialog - FIXED */}
      {showCertificationForm && (
        <Dialog open={showCertificationForm} onOpenChange={setShowCertificationForm}>
          <DialogContent className="max-w-2xl" style={{ backgroundColor: theme.bg.surface }}>
            <DialogHeader>
              <DialogTitle style={{ color: theme.text.primary }}>
                {editingCertification ? 'Edit Certification' : 'Add Certification'}
              </DialogTitle>
              <DialogDescription style={{ color: theme.text.secondary }}>
                Add your professional certifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium" style={{ color: theme.text.secondary }}>Name *</label>
                  <Input
                    placeholder="e.g., AWS Certified Developer"
                    value={newCertification.name}
                    onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
                    style={{
                      backgroundColor: theme.bg.gray100,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: theme.text.secondary }}>Issuer *</label>
                  <Input
                    placeholder="e.g., Amazon Web Services"
                    value={newCertification.issuer}
                    onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
                    style={{
                      backgroundColor: theme.bg.gray100,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: theme.text.secondary }}>Issue Date *</label>
                  <Input
                    type="date"
                    value={newCertification.issueDate}
                    onChange={(e) => setNewCertification({ ...newCertification, issueDate: e.target.value })}
                    style={{
                      backgroundColor: theme.bg.gray100,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium" style={{ color: theme.text.secondary }}>Expiry Date</label>
                  <Input
                    type="date"
                    value={newCertification.expiryDate || ''}
                    onChange={(e) => setNewCertification({ ...newCertification, expiryDate: e.target.value })}
                    style={{
                      backgroundColor: theme.bg.gray100,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium" style={{ color: theme.text.secondary }}>Credential ID</label>
                  <Input
                    placeholder="e.g., ABC123XYZ"
                    value={newCertification.credentialId || ''}
                    onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
                    style={{
                      backgroundColor: theme.bg.gray100,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium" style={{ color: theme.text.secondary }}>Credential URL</label>
                  <Input
                    placeholder="https://www.credential.net/..."
                    value={newCertification.credentialUrl || ''}
                    onChange={(e) => setNewCertification({ ...newCertification, credentialUrl: e.target.value })}
                    style={{
                      backgroundColor: theme.bg.gray100,
                      borderColor: theme.border.primary,
                      color: theme.text.primary
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium" style={{ color: theme.text.secondary }}>Skills</label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a skill (e.g., AWS, Cloud Computing)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCertificationSkillAdd((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      style={{
                        backgroundColor: theme.bg.gray100,
                        borderColor: theme.border.primary,
                        color: theme.text.primary
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const input = document.querySelector('input[placeholder="Add a skill (e.g., AWS, Cloud Computing)"]') as HTMLInputElement;
                        if (input) {
                          handleCertificationSkillAdd(input.value);
                          input.value = '';
                        }
                      }}
                      style={{
                        background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                        color: theme.text.inverse
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {newCertification.skills?.map((skill, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="px-2 py-1 flex items-center gap-1"
                        style={{
                          backgroundColor: isDarkMode ? `${theme.bg.gold}20` : `${theme.bg.gold}10`,
                          color: theme.bg.gold,
                          borderColor: isDarkMode ? `${theme.bg.gold}30` : `${theme.bg.gold}20`
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleCertificationSkillRemove(i)}
                          className="hover:opacity-70"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCertificationForm(false)}
                  style={{
                    borderColor: theme.border.primary,
                    color: theme.text.primary
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveCertification}
                  style={{
                    background: `linear-gradient(135deg, ${theme.bg.gold}, ${theme.bg.goldenMustard})`,
                    color: theme.text.inverse
                  }}
                >
                  Save Certification
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FreelancerProfileEditForm;