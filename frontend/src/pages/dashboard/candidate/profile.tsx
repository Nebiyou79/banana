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
import { Loader2, Save, Plus, Trash2, Briefcase, GraduationCap, Award, Calendar, HardDrive, AlertCircle } from 'lucide-react';
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
  const { user } = useAuth();
  const { toast } = useToast();

  // Responsive design classes
  const responsiveClasses = {
    container: 'p-4 md:p-6 lg:p-8',
    grid: 'grid gap-4 md:gap-6 lg:gap-8 md:grid-cols-2',
    buttonGroup: 'flex flex-col sm:flex-row gap-3 sm:gap-4',
    sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
    cardSpacing: 'space-y-4 md:space-y-6',
  };

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

  // ✅ UPDATED: Load profile data with local storage CVs
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Load profile data
        const profile = await candidateService.getProfile();

        // Load CVs separately using the new endpoint
        try {
          const cvResponse = await candidateService.getAllCVs();
          if (cvResponse.cvs && cvResponse.cvs.length > 0) {
            setCvs(cvResponse.cvs);
            console.log('Loaded CVs from local storage:', cvResponse.cvs.length, 'CVs');
          } else {
            // Fallback to profile CVs
            setCvs(profile.cvs || []);
            console.log('Using profile CVs:', profile.cvs?.length || 0, 'CVs');
          }
        } catch (cvError) {
          console.warn('Could not fetch CVs separately, using profile CVs:', cvError);
          setCvs(profile.cvs || []);
        }

        // Set form data
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

        console.log('Profile loaded successfully with local storage CVs');
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

  // ✅ UPDATED: Handle CV upload with local storage - with progress tracking
  const handleCVUpload = async (files: File[]) => {
    if (!user) return;

    try {
      setIsUploading(true);
      setUploadProgress(10); // Start progress
      console.log('Starting local storage upload of', files.length, 'files');

      // Validate files using service
      const validation = candidateService.validateCVFiles(files);
      if (!validation.valid) {
        toast({
          title: 'Validation Error',
          description: validation.errors.slice(0, 2).join(', '),
          variant: 'destructive',
        });
        setIsUploading(false);
        return;
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Upload files using service (note: single file at a time with local storage)
      for (const file of files) {
        try {
          await candidateService.uploadSingleCV(file);
        } catch (error) {
          console.error('Failed to upload file:', file.name, error);
          toast({
            title: 'Upload Error',
            description: `Failed to upload ${file.name}`,
            variant: 'destructive',
          });
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Refresh CV list
      try {
        const cvResponse = await candidateService.getAllCVs();
        if (cvResponse.cvs && cvResponse.cvs.length > 0) {
          setCvs(cvResponse.cvs);
        }
      } catch (refreshError) {
        console.warn('Could not refresh CV list:', refreshError);
      }

      toast({
        title: 'Upload Successful',
        description: `Successfully uploaded ${files.length} CV(s) to local storage`,
        variant: 'default',
      });

      // Reset progress after delay
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

  // ✅ UPDATED: Set primary CV
  const handleSetPrimaryCV = async (cvId: string) => {
    try {
      await candidateService.setPrimaryCV(cvId);

      // Update local state
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

  // ✅ UPDATED: Handle CV deletion with local storage
  const handleDeleteCV = async (cvId: string) => {
    try {
      const result = await candidateService.deleteCV(cvId);

      // Update local state
      setCvs(prev => prev.filter(cv => cv._id !== cvId));

      toast({
        title: 'CV Deleted',
        description: `CV has been deleted from local storage. ${result.remainingCVs} CV(s) remaining.`,
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

  // Form submission
  const onSubmit = async (values: ProfileFormData) => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Validate required fields
      const errors: string[] = [];

      // Validate education
      values.education.forEach((edu, index) => {
        if (!edu.institution?.trim() || !edu.degree?.trim() || !edu.startDate) {
          errors.push(`Education #${index + 1}: Institution, Degree, and Start Date are required`);
        }
      });

      // Validate experience
      values.experience.forEach((exp, index) => {
        if (!exp.company?.trim() || !exp.position?.trim() || !exp.startDate) {
          errors.push(`Experience #${index + 1}: Company, Position, and Start Date are required`);
        }
      });

      // Validate certifications
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

      // Format dates for backend
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
      // Success toast is handled by the service

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

  // Helper functions for adding/removing entries
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

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <span className="text-muted-foreground">Loading profile with local storage CVs...</span>
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
      <div className={`${responsiveClasses.container} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} min-h-screen`}>
        <div className="space-y-2 mb-6 md:mb-8">
          <h1 className={`text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
            Profile Management
          </h1>
          <p className={`text-sm md:text-base lg:text-lg ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
            Update your candidate profile and manage your CVs stored in local storage
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <HardDrive className="h-4 w-4" />
            <span>All CVs are securely stored on our local server</span>
          </div>
        </div>

        {/* Local Storage Status Banner */}
        <div className={`mb-6 p-4 rounded-lg ${colorClasses.bg[themeMode === 'dark' ? 'blue' : 'blue']} bg-opacity-10 border border-blue-200 dark:border-blue-800`}>
          <div className="flex items-center space-x-3">
            <HardDrive className="h-6 w-6 text-blue-600" />
            <div>
              <p className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                Local Storage Active
              </p>
              <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                Your CVs are stored on our secure server with direct file access. {cvs.length} CV(s) currently stored.
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information & CV Upload Section */}
            <div className={responsiveClasses.grid}>
              {/* Basic Information Card */}
              <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} shadow-sm`}>
                <CardHeader>
                  <CardTitle className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                    Basic Information
                  </CardTitle>
                  <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                    Your personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className={responsiveClasses.cardSpacing}>
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
                          <div className="space-y-2">
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                              max={new Date().toISOString().split('T')[0]}
                              className={`${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
                            />
                            {age !== null && (
                              <div className={`text-sm flex items-center ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Age: {age} years old
                              </div>
                            )}
                          </div>
                        </FormControl>
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
                            className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}
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

                  {/* Bio */}
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
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
                      <FormItem>
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
                </CardContent>
              </Card>

              {/* ✅ UPDATED: CV Upload Card - uses local storage */}
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

            {/* Skills Section */}
            <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} shadow-sm`}>
              <CardHeader>
                <CardTitle className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                  Skills
                </CardTitle>
                <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                  Your technical and professional skills
                </CardDescription>
              </CardHeader>
              <CardContent>
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
            <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} shadow-sm`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                      Education
                    </CardTitle>
                    <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                      Your educational background
                    </CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={addEducation}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90 hover:shadow-md`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </button>
                </div>
              </CardHeader>
              <CardContent className={responsiveClasses.cardSpacing}>
                {education.map((edu, index) => (
                  <div
                    key={`education-${index}`}
                    className={`border rounded-lg p-4 space-y-4 ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="h-5 w-5 text-primary" />
                        <h4 className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                          Education #{index + 1}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className={responsiveClasses.sectionGrid}>
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
                    </div>

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
                          <FormLabel className={`!mt-0 cursor-pointer ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                            Currently studying here
                          </FormLabel>
                        </FormItem>
                      )}
                    />

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
                ))}

                {education.length === 0 && (
                  <div className={`text-center py-8 border-2 border-dashed rounded-lg ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                    <p className={`mt-2 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                      No education entries yet
                    </p>
                    <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                      Add your educational background to complete your profile
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} shadow-sm`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                      Experience
                    </CardTitle>
                    <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                      Your work experience
                    </CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={addExperience}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90 hover:shadow-md`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </button>
                </div>
              </CardHeader>
              <CardContent className={responsiveClasses.cardSpacing}>
                {experience.map((exp, index) => (
                  <div
                    key={`experience-${index}`}
                    className={`border rounded-lg p-4 space-y-4 ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h4 className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                          Experience #{index + 1}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExperience(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className={responsiveClasses.sectionGrid}>
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
                            <FormLabel className={`!mt-0 cursor-pointer ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                              Current position
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>

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

                    <SkillsInput
                      control={form.control}
                      name={`experience.${index}.skills`}
                      label="Skills used in this role"
                      placeholder="Add skills used in this position"
                      themeMode={themeMode}
                    />
                  </div>
                ))}

                {experience.length === 0 && (
                  <div className={`text-center py-8 border-2 border-dashed rounded-lg ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <p className={`mt-2 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                      No experience entries yet
                    </p>
                    <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                      Add your work experience to showcase your professional background
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications Section */}
            <Card className={`${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'white']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} shadow-sm`}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className={colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}>
                      Certifications & Courses
                    </CardTitle>
                    <CardDescription className={colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}>
                      Professional certifications and training
                    </CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={addCertification}
                    className={`flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90 hover:shadow-md`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </button>
                </div>
              </CardHeader>
              <CardContent className={responsiveClasses.cardSpacing}>
                {certifications.map((cert, index) => (
                  <div
                    key={`certification-${index}`}
                    className={`border rounded-lg p-4 space-y-4 ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} ${colorClasses.bg[themeMode === 'dark' ? 'darkNavy' : 'gray100']}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Award className="h-5 w-5 text-primary" />
                        <h4 className={`font-medium ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                          Certification #{index + 1}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCertification(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className={responsiveClasses.sectionGrid}>
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
                    </div>

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
                ))}

                {certifications.length === 0 && (
                  <div className={`text-center py-8 border-2 border-dashed rounded-lg ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
                    <Award className="mx-auto h-12 w-12 text-gray-400" />
                    <p className={`mt-2 ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']}`}>
                      No certifications yet
                    </p>
                    <p className={`text-sm ${colorClasses.text[themeMode === 'dark' ? 'gray100' : 'gray800']}`}>
                      Add professional certifications, online courses, or training programs
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className={`flex justify-end space-x-4 pt-6 border-t ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']}`}>
              <button
                type="button"
                onClick={() => window.history.back()}
                className={`px-6 py-3 border rounded-xl font-medium transition-all ${colorClasses.bg[themeMode === 'dark' ? 'gray800' : 'gray100']} ${colorClasses.text[themeMode === 'dark' ? 'white' : 'darkNavy']} ${colorClasses.border[themeMode === 'dark' ? 'gray800' : 'gray400']} hover:opacity-90`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${colorClasses.bg.gold} ${colorClasses.text[themeMode === 'dark' ? 'darkNavy' : 'darkNavy']} hover:opacity-90 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
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
    </DashboardLayout>
  );
};

export default CandidateProfilePage;