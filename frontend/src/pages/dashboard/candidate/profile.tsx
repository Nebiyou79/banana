/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  HardDrive,
  User,
  ChevronDown,
  ChevronUp,
  Calendar,
  MapPin,
  Phone,
  Globe,
  Mail
} from 'lucide-react';
import { candidateService, CV } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CVUploadCard from '@/components/candidate/CVUploadCard';
import SkillsInput from '@/components/candidate/SkillsInput';
import { useToast } from '@/hooks/use-toast';
import { colorClasses, ThemeMode } from '@/utils/color';

interface ProfileFormData {
  skills: string[];
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
  }>;
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description?: string;
    skills: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    description?: string;
  }>;
}

// Format dates for input
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch {
    return dateString;
  }
};

const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 0;
  }
};

const CandidateProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    education: true,
    experience: true,
    certifications: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileFormData>({
    defaultValues: {
      skills: [],
      bio: '',
      location: '',
      phone: '',
      website: '',
      dateOfBirth: '',
      gender: 'prefer-not-to-say',
      education: [],
      experience: [],
      certifications: []
    }
  });

  // Check theme on mount
  useEffect(() => {
    const checkTheme = () => {
      if (typeof window !== 'undefined') {
        const isDark = document.documentElement.classList.contains('dark');
        setThemeMode(isDark ? 'dark' : 'light');
      }
    };

    checkTheme();

    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        const profile = await candidateService.getProfile();

        try {
          const cvResponse = await candidateService.getAllCVs();
          if (cvResponse.cvs && cvResponse.cvs.length > 0) {
            setCvs(cvResponse.cvs);
          } else {
            setCvs(profile.cvs || []);
          }
        } catch (cvError) {
          console.warn('Could not fetch CVs separately, using profile CVs:', cvError);
          setCvs(profile.cvs || []);
        }

        const formData: ProfileFormData = {
          skills: profile.skills || [],
          bio: profile.bio || '',
          location: profile.location || '',
          phone: profile.phone || '',
          website: profile.website || '',
          dateOfBirth: profile.dateOfBirth ? formatDateForInput(profile.dateOfBirth) : '',
          gender: profile.gender || 'prefer-not-to-say',
          education: (profile.education || []).map(edu => ({
            ...edu,
            startDate: formatDateForInput(edu.startDate),
            endDate: formatDateForInput(edu.endDate)
          })),
          experience: (profile.experience || []).map(exp => ({
            ...exp,
            startDate: formatDateForInput(exp.startDate),
            endDate: formatDateForInput(exp.endDate)
          })),
          certifications: (profile.certifications || []).map(cert => ({
            ...cert,
            issueDate: formatDateForInput(cert.issueDate),
            expiryDate: formatDateForInput(cert.expiryDate)
          }))
        };

        form.reset(formData);
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [form, user, toast]);

  const handleCVUpload = async (files: File[]) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(10);

      const validation = candidateService.validateCVFiles(files);
      if (!validation.valid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.slice(0, 2).join(', '),
          variant: 'destructive',
        });
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      let uploadedCount = 0;
      const uploadPromises = [];

      for (const file of files) {
        try {
          const promise = candidateService.uploadSingleCV(file);
          uploadPromises.push(promise);
        } catch (error) {
          console.error('Failed to queue file for upload:', file.name, error);
        }
      }

      try {
        await Promise.all(uploadPromises);
        uploadedCount = uploadPromises.length;
      } catch (error) {
        console.error('Some uploads failed:', error);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      try {
        const cvResponse = await candidateService.getAllCVs();
        if (cvResponse.cvs && cvResponse.cvs.length > 0) {
          setCvs(cvResponse.cvs);
        }
      } catch (refreshError) {
        console.warn('Could not refresh CV list:', refreshError);
      }

      if (uploadedCount > 0) {
        toast({
          title: 'Upload Successful',
          description: `Successfully uploaded ${uploadedCount} CV(s)`,
          variant: 'default',
        });
      }

      setTimeout(() => setUploadProgress(0), 1000);

    } catch (error: any) {
      console.error('Failed to upload CVs:', error);
      setUploadProgress(0);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload CVs',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrimaryCV = async (cvId: string) => {
    try {
      await candidateService.setPrimaryCV(cvId);
      setCvs(prev => prev.map(cv => ({
        ...cv,
        isPrimary: cv._id === cvId
      })));

      const cvName = cvs.find(cv => cv._id === cvId)?.originalName || 'CV';
      toast({
        title: 'Primary CV Updated',
        description: `${cvName} is now your primary CV`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to set primary CV:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to set primary CV',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCV = async (cvId: string) => {
    try {
      const result = await candidateService.deleteCV(cvId);
      setCvs(prev => prev.filter(cv => cv._id !== cvId));
      toast({
        title: 'CV Deleted',
        description: `CV has been deleted. ${result.remainingCVs} CV(s) remaining.`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Failed to delete CV:', error);
      toast({
        title: 'Delete Error',
        description: error.message || 'Failed to delete CV',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (values: ProfileFormData) => {
    if (!user) return;

    try {
      setIsSaving(true);

      const errors: string[] = [];

      values.education.forEach((edu, index) => {
        if (!edu.institution?.trim() || !edu.degree?.trim() || !edu.startDate) {
          errors.push(`Education #${index + 1}: Institution, Degree, and Start Date are required`);
        }
      });

      values.experience.forEach((exp, index) => {
        if (!exp.company?.trim() || !exp.position?.trim() || !exp.startDate) {
          errors.push(`Experience #${index + 1}: Company, Position, and Start Date are required`);
        }
      });

      values.certifications.forEach((cert, index) => {
        if (!cert.name?.trim() || !cert.issuer?.trim() || !cert.issueDate) {
          errors.push(`Certification #${index + 1}: Name, Issuer, and Issue Date are required`);
        }
      });

      if (errors.length > 0) {
        errors.forEach(error => {
          toast({
            title: 'Validation Error',
            description: error,
            variant: 'destructive',
          });
        });
        setIsSaving(false);
        return;
      }

      const submitData = {
        ...values,
        education: values.education.map(edu => ({
          ...edu,
          startDate: formatDateForBackend(edu.startDate),
          endDate: edu.endDate ? formatDateForBackend(edu.endDate) : undefined
        })),
        experience: values.experience.map(exp => ({
          ...exp,
          startDate: formatDateForBackend(exp.startDate),
          endDate: exp.endDate ? formatDateForBackend(exp.endDate) : undefined
        })),
        certifications: values.certifications.map(cert => ({
          ...cert,
          issueDate: formatDateForBackend(cert.issueDate),
          expiryDate: cert.expiryDate ? formatDateForBackend(cert.expiryDate) : undefined
        }))
      };

      await candidateService.updateProfile(submitData);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
        variant: 'default',
      });

    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Update Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addEducation = () => {
    const currentEducation = form.getValues('education') || [];
    form.setValue('education', [
      ...currentEducation,
      {
        institution: '',
        degree: '',
        field: '',
        startDate: new Date().toISOString().split('T')[0],
        current: false
      }
    ]);
  };

  const removeEducation = (index: number) => {
    const currentEducation = form.getValues('education') || [];
    form.setValue('education', currentEducation.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    const currentExperience = form.getValues('experience') || [];
    form.setValue('experience', [
      ...currentExperience,
      {
        company: '',
        position: '',
        startDate: new Date().toISOString().split('T')[0],
        current: false,
        skills: []
      }
    ]);
  };

  const removeExperience = (index: number) => {
    const currentExperience = form.getValues('experience') || [];
    form.setValue('experience', currentExperience.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    const currentCertifications = form.getValues('certifications') || [];
    form.setValue('certifications', [
      ...currentCertifications,
      {
        name: '',
        issuer: '',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        credentialId: '',
        credentialUrl: '',
        description: ''
      }
    ]);
  };

  const removeCertification = (index: number) => {
    const currentCertifications = form.getValues('certifications') || [];
    form.setValue('certifications', currentCertifications.filter((_, i) => i !== index));
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className={`flex flex-col items-center justify-center min-h-[60vh] ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']}`}>
          <Loader2 className={`h-8 w-8 animate-spin ${colorClasses.text.gold} mb-4`} />
          <span className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
            Loading your profile...
          </span>
        </div>
      </DashboardLayout>
    );
  }

  const education = form.watch('education') || [];
  const experience = form.watch('experience') || [];
  const certifications = form.watch('certifications') || [];
  const dateOfBirth = form.watch('dateOfBirth');
  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;

  return (
    <DashboardLayout requiredRole="candidate">
      <div className={`min-h-screen ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']}`}>
        {/* Header */}
        <div className={`border-b ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} sticky top-0 z-10 backdrop-blur-sm bg-opacity-90 ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-2xl sm:text-3xl font-bold ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                  Candidate Profile
                </h1>
                <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']} mt-1`}>
                  Manage your professional profile and documents
                </p>
              </div>

              {/* Storage Status Badge */}
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${colorClasses.bg.blue} bg-opacity-10`}>
                <HardDrive className={`h-4 w-4 ${colorClasses.text.blue} mr-2`} />
                <span className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                  {cvs.length} CV{cvs.length !== 1 ? 's' : ''} Stored
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Desktop: Form on Left (2/3), CV on Right (1/3) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Profile Form (2/3 on desktop) */}
            <div className="lg:col-span-2 order-1 lg:order-1">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information Card */}
                  <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} border-0 shadow-sm overflow-hidden`}>
                    <CardHeader className={`border-b ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']} bg-opacity-50`}>
                      <div className="flex items-center">
                        <User className={`h-5 w-5 ${colorClasses.text.gold} mr-2`} />
                        <CardTitle className={`text-lg ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                          Basic Information
                        </CardTitle>
                      </div>
                      <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                        Your personal and contact details
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {/* Date of Birth */}
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                Date of Birth
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ''}
                                  max={new Date().toISOString().split('T')[0]}
                                  className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                />
                              </FormControl>
                              {age !== null && (
                                <p className={`text-sm mt-1 ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                                  Age: {age} years
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Gender */}
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                Gender
                              </FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className={`w-full px-3 py-2 rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500 ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                >
                                  <option value="prefer-not-to-say">Prefer not to say</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Location */}
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                Location
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Addis Ababa, Ethiopia"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Phone */}
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                Phone
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="+251 91 234 5678"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Website */}
                        <FormField
                          control={form.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                Website/Portfolio
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://yourportfolio.com"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Bio - Full width */}
                        <FormField
                          control={form.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem className="sm:col-span-2">
                              <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                Bio
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Tell us about yourself, your career goals, and what makes you unique..."
                                  rows={4}
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} resize-none`}
                                  maxLength={1000}
                                />
                              </FormControl>
                              <div className="flex justify-end">
                                <span className={`text-xs ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                                  {field.value?.length || 0}/1000
                                </span>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Skills Card */}
                  <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} border-0 shadow-sm overflow-hidden`}>
                    <CardHeader className={`border-b ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']} bg-opacity-50`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className={`h-5 w-5 ${colorClasses.text.gold} mr-2`} />
                          <CardTitle className={`text-lg ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                            Skills
                          </CardTitle>
                        </div>
                      </div>
                      <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                        Your technical and professional skills
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <SkillsInput
                        control={form.control}
                        name="skills"
                        label="Skills"
                        placeholder="Add a skill and press Enter or click +"
                        themeMode={themeMode}
                      />
                    </CardContent>
                  </Card>

                  {/* Education Section */}
                  <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} border-0 shadow-sm overflow-hidden`}>
                    <CardHeader
                      className={`border-b ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']} bg-opacity-50 cursor-pointer`}
                      onClick={() => toggleSection('education')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <GraduationCap className={`h-5 w-5 ${colorClasses.text.gold} mr-2`} />
                          <div>
                            <CardTitle className={`text-lg ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              Education
                            </CardTitle>
                            <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                              Your educational background
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addEducation();
                            }}
                            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </button>
                          {expandedSections.education ? (
                            <ChevronUp className={`h-5 w-5 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`} />
                          ) : (
                            <ChevronDown className={`h-5 w-5 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`} />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {expandedSections.education && (
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        {education.map((edu, index) => (
                          <div
                            key={`education-${index}`}
                            className={`border rounded-lg p-4 space-y-4 ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                                Education #{index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeEducation(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`education.${index}.institution`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Institution *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="University of Example"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`education.${index}.degree`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Degree *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Bachelor of Science"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`education.${index}.field`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Field of Study
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Computer Science"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`education.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Start Date *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`education.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      End Date
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        disabled={form.watch(`education.${index}.current`)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} disabled:opacity-50`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="sm:col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`education.${index}.current`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={field.value}
                                          onChange={field.onChange}
                                          className="rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                      </FormControl>
                                      <FormLabel className={`!mt-0 cursor-pointer text-sm ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                                        Currently studying here
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`education.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                        Description
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Describe your studies, achievements, courses, etc."
                                          rows={3}
                                          {...field}
                                          className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} resize-none`}
                                          maxLength={500}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {education.length === 0 && (
                          <div className={`text-center py-8 border-2 border-dashed rounded-lg ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                            <GraduationCap className={`mx-auto h-12 w-12 ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`} />
                            <p className={`mt-2 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              No education entries yet
                            </p>
                            <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                              Click `Add` to add your educational background
                            </p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* Experience Section */}
                  <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} border-0 shadow-sm overflow-hidden`}>
                    <CardHeader
                      className={`border-b ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']} bg-opacity-50 cursor-pointer`}
                      onClick={() => toggleSection('experience')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Briefcase className={`h-5 w-5 ${colorClasses.text.gold} mr-2`} />
                          <div>
                            <CardTitle className={`text-lg ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              Experience
                            </CardTitle>
                            <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                              Your work experience
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addExperience();
                            }}
                            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </button>
                          {expandedSections.experience ? (
                            <ChevronUp className={`h-5 w-5 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`} />
                          ) : (
                            <ChevronDown className={`h-5 w-5 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`} />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {expandedSections.experience && (
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        {experience.map((exp, index) => (
                          <div
                            key={`experience-${index}`}
                            className={`border rounded-lg p-4 space-y-4 ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                                Experience #{index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeExperience(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`experience.${index}.company`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Company *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Company Name"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`experience.${index}.position`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Position *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Job Title"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`experience.${index}.startDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Start Date *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`experience.${index}.endDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      End Date
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        disabled={form.watch(`experience.${index}.current`)}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} disabled:opacity-50`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="sm:col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`experience.${index}.current`}
                                  render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                      <FormControl>
                                        <input
                                          type="checkbox"
                                          checked={field.value}
                                          onChange={field.onChange}
                                          className="rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                                        />
                                      </FormControl>
                                      <FormLabel className={`!mt-0 cursor-pointer text-sm ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                                        Current position
                                      </FormLabel>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`experience.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                        Description
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Describe your responsibilities, achievements, and key contributions..."
                                          rows={3}
                                          {...field}
                                          className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} resize-none`}
                                          maxLength={500}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <SkillsInput
                                  control={form.control}
                                  name={`experience.${index}.skills`}
                                  label="Skills used in this role"
                                  placeholder="Add skills used in this position"
                                  themeMode={themeMode}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {experience.length === 0 && (
                          <div className={`text-center py-8 border-2 border-dashed rounded-lg ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                            <Briefcase className={`mx-auto h-12 w-12 ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`} />
                            <p className={`mt-2 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              No experience entries yet
                            </p>
                            <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                              Click `Add` to add your work experience
                            </p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* Certifications Section */}
                  <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} border-0 shadow-sm overflow-hidden`}>
                    <CardHeader
                      className={`border-b ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']} bg-opacity-50 cursor-pointer`}
                      onClick={() => toggleSection('certifications')}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Award className={`h-5 w-5 ${colorClasses.text.gold} mr-2`} />
                          <div>
                            <CardTitle className={`text-lg ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              Certifications
                            </CardTitle>
                            <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                              Professional certifications and courses
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addCertification();
                            }}
                            className={`flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90`}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </button>
                          {expandedSections.certifications ? (
                            <ChevronUp className={`h-5 w-5 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`} />
                          ) : (
                            <ChevronDown className={`h-5 w-5 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`} />
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    {expandedSections.certifications && (
                      <CardContent className="p-4 sm:p-6 space-y-4">
                        {certifications.map((cert, index) => (
                          <div
                            key={`certification-${index}`}
                            className={`border rounded-lg p-4 space-y-4 ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`}
                          >
                            <div className="flex justify-between items-center">
                              <h4 className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                                Certification #{index + 1}
                              </h4>
                              <button
                                type="button"
                                onClick={() => removeCertification(index)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name={`certifications.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Name *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Certification Name"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`certifications.${index}.issuer`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Issuer *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Issuing Organization"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`certifications.${index}.issueDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Issue Date *
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        max={new Date().toISOString().split('T')[0]}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`certifications.${index}.expiryDate`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Expiry Date
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        type="date"
                                        {...field}
                                        min={form.watch(`certifications.${index}.issueDate`)}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`certifications.${index}.credentialId`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Credential ID
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="e.g., AWS-12345"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`certifications.${index}.credentialUrl`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                      Credential URL
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="https://example.com/credential"
                                        {...field}
                                        className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="sm:col-span-2">
                                <FormField
                                  control={form.control}
                                  name={`certifications.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                                        Description
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Describe what you learned, skills gained, or project completed..."
                                          rows={3}
                                          {...field}
                                          className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} resize-none`}
                                          maxLength={500}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {certifications.length === 0 && (
                          <div className={`text-center py-8 border-2 border-dashed rounded-lg ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                            <Award className={`mx-auto h-12 w-12 ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`} />
                            <p className={`mt-2 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              No certifications yet
                            </p>
                            <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                              Click `Add` to add professional certifications
                            </p>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className={`px-6 py-2.5 rounded-lg font-medium transition-all border ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving || isUploading}
                      className={`flex items-center px-6 py-2.5 rounded-lg font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Form>
            </div>

            {/* Right Column - CV Section (1/3 on desktop) */}
            <div className="lg:col-span-1 order-2 lg:order-2 mt-6 lg:mt-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* CV Upload Card */}
                <CVUploadCard
                  cvs={cvs}
                  onUpload={handleCVUpload}
                  onSetPrimary={handleSetPrimaryCV}
                  onDelete={handleDeleteCV}
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
                  maxFiles={10}
                  maxSizeMB={100}
                  themeMode={themeMode}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateProfilePage;