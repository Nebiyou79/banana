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
import { Loader2, Save, Plus, Trash2, Briefcase, GraduationCap, Award, Calendar, User, MapPin, Phone, Globe } from 'lucide-react';
import { candidateService, CV } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CVUploadCard from '@/components/candidate/CVUploadCard';
import SkillsInput from '@/components/candidate/SkillsInput';
import { useToast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';

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

// Date helper functions
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const formatDateForBackend = (dateString: string): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch (error) {
    console.error('Error parsing date:', error);
    return dateString;
  }
};

// Helper function to calculate age from date of birth
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
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

const CandidateProfilePage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cvs, setCvs] = useState<CV[]>([]);
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

  // Date validation helper
  const validateDate = (startDate: string, endDate: string | undefined, isCurrent: boolean, fieldName: string = '') => {
    try {
      const errors: string[] = [];
      const now = new Date();

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (!start) {
        errors.push(`${fieldName} start date is required`);
        return errors;
      }

      if (start > now) {
        errors.push(`${fieldName} start date cannot be in the future`);
      }

      if (end) {
        if (end < start) {
          errors.push(`${fieldName} end date must be after start date`);
        }
        if (end > now && !isCurrent) {
          errors.push(`${fieldName} end date cannot be in the future for completed entries`);
        }
      }

      return errors;
    } catch (error) {
      console.error('Date validation error:', error);
      return ['Invalid date format'];
    }
  };

  // Age validation helper
  const validateAge = (dateOfBirth: string): string[] => {
    const errors: string[] = [];

    if (!dateOfBirth) {
      return errors; // Date of birth is optional
    }

    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
      const maxDate = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());

      if (dob > maxDate) {
        errors.push('You must be at least 16 years old');
      }
      if (dob < minDate) {
        errors.push('Please enter a valid date of birth');
      }
    } catch (error) {
      errors.push('Invalid date of birth format');
    }

    return errors;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await candidateService.getProfile();
        setCvs(profile.cvs || []);
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
        // Error is already handled by the service
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [form, user]);

  const onSubmit = async (values: ProfileFormData) => {
    try {
      setIsSaving(true);

      // Client-side validation for required fields
      const validationErrors: string[] = [];

      // Age validation
      const ageErrors = validateAge(values.dateOfBirth || '');
      validationErrors.push(...ageErrors);

      // Validate education required fields
      values.education.forEach((edu, index) => {
        if (!edu.institution?.trim() || !edu.degree?.trim() || !edu.startDate) {
          validationErrors.push(`Education #${index + 1}: Institution, Degree, and Start Date are required`);
        }
      });

      // Validate experience required fields
      values.experience.forEach((exp, index) => {
        if (!exp.company?.trim() || !exp.position?.trim() || !exp.startDate) {
          validationErrors.push(`Experience #${index + 1}: Company, Position, and Start Date are required`);
        }
      });

      // Validate certification required fields
      values.certifications.forEach((cert, index) => {
        if (!cert.name?.trim() || !cert.issuer?.trim() || !cert.issueDate) {
          validationErrors.push(`Certification #${index + 1}: Name, Issuer, and Issue Date are required`);
        }
      });

      if (validationErrors.length > 0) {
        validationErrors.forEach(error => {
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
      // Error is already handled by the service
    } finally {
      setIsSaving(false);
    }
  };

  const handleCVUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      const uploadedCVs = await candidateService.uploadCVs(files);
      setCvs(prev => [...prev, ...uploadedCVs]);
      // Success toast is handled by the service
    } catch (error: any) {
      console.error('Failed to upload CVs:', error);
      // Error is already handled by the service
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
      // Success toast is handled by the service
    } catch (error: any) {
      console.error('Failed to set primary CV:', error);
      // Error is already handled by the service
    }
  };

  const handleDeleteCV = async (cvId: string) => {
    try {
      await candidateService.deleteCV(cvId);
      setCvs(prev => prev.filter(cv => cv._id !== cvId));
      // Success toast is handled by the service
    } catch (error: any) {
      console.error('Failed to delete CV:', error);
      // Error is already handled by the service
    }
  };

  const handleDownloadCV = (cv: CV) => {
    try {
      const downloadUrl = candidateService.getCVDownloadUrl(cv);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download CV error:', error);
      toast({
        title: 'Download Error',
        description: 'Failed to download CV',
        variant: 'destructive',
      });
    }
  };

  const addEducation = () => {
    try {
      const currentEducation = form.getValues('education') || [];
      const today = new Date().toISOString().split('T')[0];

      form.setValue('education', [
        ...currentEducation,
        {
          institution: '',
          degree: '',
          field: '',
          startDate: today,
          current: false
        }
      ]);
    } catch (error) {
      console.error('Add education error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add education entry',
        variant: 'destructive',
      });
    }
  };

  const removeEducation = (index: number) => {
    try {
      const currentEducation = form.getValues('education') || [];
      form.setValue('education', currentEducation.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Remove education error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove education entry',
        variant: 'destructive',
      });
    }
  };

  const addExperience = () => {
    try {
      const currentExperience = form.getValues('experience') || [];
      const today = new Date().toISOString().split('T')[0];

      form.setValue('experience', [
        ...currentExperience,
        {
          company: '',
          position: '',
          startDate: today,
          current: false,
          skills: []
        }
      ]);
    } catch (error) {
      console.error('Add experience error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add experience entry',
        variant: 'destructive',
      });
    }
  };

  const removeExperience = (index: number) => {
    try {
      const currentExperience = form.getValues('experience') || [];
      form.setValue('experience', currentExperience.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Remove experience error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove experience entry',
        variant: 'destructive',
      });
    }
  };

  const addCertification = () => {
    try {
      const currentCertifications = form.getValues('certifications') || [];
      const today = new Date().toISOString().split('T')[0];

      form.setValue('certifications', [
        ...currentCertifications,
        {
          name: '',
          issuer: '',
          issueDate: today,
          expiryDate: '',
          credentialId: '',
          credentialUrl: '',
          description: ''
        }
      ]);
    } catch (error) {
      console.error('Add certification error:', error);
      toast({
        title: 'Error',
        description: 'Failed to add certification entry',
        variant: 'destructive',
      });
    }
  };

  const removeCertification = (index: number) => {
    try {
      const currentCertifications = form.getValues('certifications') || [];
      form.setValue('certifications', currentCertifications.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Remove certification error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove certification entry',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4">
          <Loader2 className={`h-12 w-12 animate-spin ${colorClasses.text.goldenMustard}`} />
          <span className={`mt-4 text-lg font-medium ${colorClasses.text.darkNavy}`}>Loading profile...</span>
          <p className={`mt-2 text-sm ${colorClasses.text.gray400}`}>Please wait while we load your information</p>
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
      <div className="min-h-screen bg-gray-100 p-3 md:p-6">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className={`text-2xl md:text-3xl font-bold ${colorClasses.text.darkNavy}`}>
            Profile Management
          </h1>
          <p className={`mt-1 md:mt-2 text-sm md:text-base ${colorClasses.text.gray400}`}>
            Update your candidate profile and CV to showcase your skills and experience
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Grid for Basic Info and CV Upload */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Information Card */}
              <Card className={`border ${colorClasses.border.gray100} ${colorClasses.bg.white} shadow-sm hover:shadow-md transition-shadow`}>
                <CardHeader className={`pb-3 ${colorClasses.bg.darkNavy} rounded-t-lg`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses.bg.goldenMustard}`}>
                      <User className={`h-5 w-5 ${colorClasses.text.white}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg md:text-xl font-bold ${colorClasses.text.white}`}>
                        Basic Information
                      </CardTitle>
                      <CardDescription className={`${colorClasses.text.gray100}`}>
                        Your personal details and contact information
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {/* Date of Birth with Age Display */}
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => {
                      const ageErrors = validateAge(field.value || '');

                      return (
                        <FormItem>
                          <FormLabel className={`flex items-center ${colorClasses.text.darkNavy}`}>
                            <Calendar className="h-4 w-4 mr-2" />
                            Date of Birth
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                type="date"
                                {...field}
                                value={field.value || ''}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => field.onChange(e.target.value)}
                                className={`${colorClasses.bg.white} ${colorClasses.border.gray400} focus:${colorClasses.border.goldenMustard}`}
                              />
                              {age && (
                                <div className={`text-sm flex items-center ${colorClasses.text.teal}`}>
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Age: {age} years old
                                </div>
                              )}
                            </div>
                          </FormControl>
                          {ageErrors.length > 0 && (
                            <div className={`text-sm ${colorClasses.text.orange}`}>
                              {ageErrors.map((error, index) => (
                                <p key={index} className="flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-2"></span>
                                  {error}
                                </p>
                              ))}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* Gender Field */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={`${colorClasses.text.darkNavy}`}>
                          Gender
                        </FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className={`w-full px-3 py-2 ${colorClasses.bg.white} border ${colorClasses.border.gray400} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 focus:${colorClasses.border.goldenMustard} ${colorClasses.text.darkNavy}`}
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
                        <FormLabel className={`${colorClasses.text.darkNavy}`}>
                          Professional Bio
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself, your career goals, and what makes you unique..."
                            rows={4}
                            {...field}
                            value={field.value || ''}
                            className={`${colorClasses.bg.white} ${colorClasses.border.gray400} resize-none ${colorClasses.text.darkNavy} placeholder:${colorClasses.text.gray400}`}
                            maxLength={1000}
                          />
                        </FormControl>
                        <div className={`text-xs ${colorClasses.text.gray400} text-right`}>
                          {field.value?.length || 0}/1000 characters
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Contact Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Location */}
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className={`flex items-center ${colorClasses.text.darkNavy}`}>
                            <MapPin className="h-4 w-4 mr-2" />
                            Location
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Addis Ababa, Ethiopia"
                              {...field}
                              value={field.value || ''}
                              maxLength={100}
                              className={`${colorClasses.bg.white} ${colorClasses.border.gray400} ${colorClasses.text.darkNavy}`}
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
                          <FormLabel className={`flex items-center ${colorClasses.text.darkNavy}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Phone
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+251 91 234 5678"
                              {...field}
                              value={field.value || ''}
                              maxLength={20}
                              className={`${colorClasses.bg.white} ${colorClasses.border.gray400} ${colorClasses.text.darkNavy}`}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Website */}
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={`flex items-center ${colorClasses.text.darkNavy}`}>
                          <Globe className="h-4 w-4 mr-2" />
                          Website/Portfolio
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://yourportfolio.com"
                            {...field}
                            value={field.value || ''}
                            maxLength={200}
                            className={`${colorClasses.bg.white} ${colorClasses.border.gray400} ${colorClasses.text.darkNavy}`}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* CV Upload Card */}
              <div className="lg:row-span-2">
                <CVUploadCard
                  cvs={cvs}
                  onUpload={handleCVUpload}
                  onSetPrimary={handleSetPrimaryCV}
                  onDelete={handleDeleteCV}
                  onDownload={handleDownloadCV}
                  isUploading={isUploading}
                />
              </div>

              {/* Skills Card */}
              <Card className={`border ${colorClasses.border.gray100} ${colorClasses.bg.white} shadow-sm hover:shadow-md transition-shadow lg:col-span-1`}>
                <CardHeader className={`pb-3 ${colorClasses.bg.darkNavy} rounded-t-lg`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses.bg.blue}`}>
                      <Award className={`h-5 w-5 ${colorClasses.text.white}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg md:text-xl font-bold ${colorClasses.text.white}`}>
                        Skills & Expertise
                      </CardTitle>
                      <CardDescription className={`${colorClasses.text.gray100}`}>
                        Your technical and professional skills
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <SkillsInput
                    control={form.control}
                    name="skills"
                    label="Add your skills"
                    placeholder="Type a skill and press Enter or click +"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Education Section */}
            <Card className={`border ${colorClasses.border.gray100} ${colorClasses.bg.white} shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className={`pb-3 ${colorClasses.bg.darkNavy} rounded-t-lg`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses.bg.teal}`}>
                      <GraduationCap className={`h-5 w-5 ${colorClasses.text.white}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg md:text-xl font-bold ${colorClasses.text.white}`}>
                        Education Background
                      </CardTitle>
                      <CardDescription className={`${colorClasses.text.gray100}`}>
                        Your academic qualifications and degrees
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addEducation}
                    className={`flex items-center justify-center px-4 py-2 ${colorClasses.bg.goldenMustard} ${colorClasses.text.white} rounded-lg font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Education</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {education.map((edu, index) => {
                  const dateErrors = validateDate(edu.startDate, edu.endDate, edu.current, 'Education');

                  return (
                    <div key={index} className={`border ${colorClasses.border.gray100} rounded-xl p-4 md:p-6 space-y-4 ${colorClasses.bg.gray100}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${colorClasses.bg.teal} ${colorClasses.text.white}`}>
                            <GraduationCap className="h-4 w-4" />
                          </div>
                          <h4 className={`font-semibold ${colorClasses.text.darkNavy}`}>
                            Education #{index + 1}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className={`p-2 ${colorClasses.text.gray400} hover:${colorClasses.text.orange} transition-colors`}
                          aria-label="Remove education entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Date validation errors */}
                      {dateErrors.length > 0 && (
                        <div className={`${colorClasses.bg.orange} bg-opacity-10 border ${colorClasses.border.orange} border-opacity-20 rounded-lg p-3`}>
                          {dateErrors.map((error, errorIndex) => (
                            <p key={errorIndex} className={`text-sm flex items-center ${colorClasses.text.orange}`}>
                              <span className={`w-2 h-2 rounded-full ${colorClasses.bg.orange} mr-2`}></span>
                              {error}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`education.${index}.institution`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Institution <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="University of Example"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Degree <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Bachelor of Science"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Field of Study
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Computer Science"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                    Start Date <span className={`${colorClasses.text.orange}`}>*</span>
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value || ''}
                                      max={new Date().toISOString().split('T')[0]}
                                      className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                                  <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                    End Date
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="date"
                                      {...field}
                                      value={field.value || ''}
                                      disabled={form.watch(`education.${index}.current`)}
                                      max={new Date().toISOString().split('T')[0]}
                                      className={`${colorClasses.bg.white} ${colorClasses.border.gray400} disabled:opacity-50`}
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
                                    id={`education-current-${index}`}
                                    checked={field.value || false}
                                    onChange={(e) => {
                                      const isChecked = e.target.checked;
                                      field.onChange(isChecked);
                                      if (isChecked) {
                                        form.setValue(`education.${index}.endDate`, '');
                                      }
                                    }}
                                    className={`rounded ${colorClasses.border.gray400} focus:ring-2 focus:${colorClasses.border.goldenMustard}`}
                                  />
                                </FormControl>
                                <label
                                  htmlFor={`education-current-${index}`}
                                  className={`text-sm cursor-pointer ${colorClasses.text.darkNavy}`}
                                >
                                  Currently studying here
                                </label>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name={`education.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={`${colorClasses.text.darkNavy}`}>
                              Description & Achievements
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your studies, achievements, relevant courses, GPA, honors, etc."
                                rows={3}
                                {...field}
                                value={field.value || ''}
                                className={`${colorClasses.bg.white} ${colorClasses.border.gray400} resize-none`}
                                maxLength={500}
                              />
                            </FormControl>
                            <div className={`text-xs ${colorClasses.text.gray400} text-right`}>
                              {field.value?.length || 0}/500 characters
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}

                {education.length === 0 && (
                  <div className={`text-center py-12 ${colorClasses.text.gray400} border-2 border-dashed ${colorClasses.border.gray400} rounded-xl`}>
                    <GraduationCap className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-4 text-lg font-medium">No education entries yet</p>
                    <p className="mt-2 text-sm max-w-md mx-auto">
                      Add your educational background to showcase your academic qualifications
                    </p>
                    <button
                      type="button"
                      onClick={addEducation}
                      className={`mt-6 flex items-center mx-auto px-6 py-2 ${colorClasses.bg.goldenMustard} ${colorClasses.text.white} rounded-lg font-medium transition-all hover:opacity-90`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Education Entry
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className={`border ${colorClasses.border.gray100} ${colorClasses.bg.white} shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className={`pb-3 ${colorClasses.bg.darkNavy} rounded-t-lg`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses.bg.orange}`}>
                      <Briefcase className={`h-5 w-5 ${colorClasses.text.white}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg md:text-xl font-bold ${colorClasses.text.white}`}>
                        Work Experience
                      </CardTitle>
                      <CardDescription className={`${colorClasses.text.gray100}`}>
                        Your professional work history and positions
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addExperience}
                    className={`flex items-center justify-center px-4 py-2 ${colorClasses.bg.goldenMustard} ${colorClasses.text.white} rounded-lg font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Experience</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {experience.map((exp, index) => {
                  const dateErrors = validateDate(exp.startDate, exp.endDate, exp.current, 'Experience');

                  return (
                    <div key={index} className={`border ${colorClasses.border.gray100} rounded-xl p-4 md:p-6 space-y-4 ${colorClasses.bg.gray100}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${colorClasses.bg.orange} ${colorClasses.text.white}`}>
                            <Briefcase className="h-4 w-4" />
                          </div>
                          <h4 className={`font-semibold ${colorClasses.text.darkNavy}`}>
                            Experience #{index + 1}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className={`p-2 ${colorClasses.text.gray400} hover:${colorClasses.text.orange} transition-colors`}
                          aria-label="Remove experience entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Date validation errors */}
                      {dateErrors.length > 0 && (
                        <div className={`${colorClasses.bg.orange} bg-opacity-10 border ${colorClasses.border.orange} border-opacity-20 rounded-lg p-3`}>
                          {dateErrors.map((error, errorIndex) => (
                            <p key={errorIndex} className={`text-sm flex items-center ${colorClasses.text.orange}`}>
                              <span className={`w-2 h-2 rounded-full ${colorClasses.bg.orange} mr-2`}></span>
                              {error}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experience.${index}.company`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Company <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Company Name"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Position <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Job Title"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`experience.${index}.startDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Start Date <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ''}
                                  max={new Date().toISOString().split('T')[0]}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                End Date
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ''}
                                  disabled={form.watch(`experience.${index}.current`)}
                                  max={new Date().toISOString().split('T')[0]}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400} disabled:opacity-50`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`experience.${index}.current`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <input
                                type="checkbox"
                                id={`experience-current-${index}`}
                                checked={field.value || false}
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  field.onChange(isChecked);
                                  if (isChecked) {
                                    form.setValue(`experience.${index}.endDate`, '');
                                  }
                                }}
                                className={`rounded ${colorClasses.border.gray400} focus:ring-2 focus:${colorClasses.border.goldenMustard}`}
                              />
                            </FormControl>
                            <label
                              htmlFor={`experience-current-${index}`}
                              className={`text-sm cursor-pointer ${colorClasses.text.darkNavy}`}
                            >
                              Current position
                            </label>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`experience.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={`${colorClasses.text.darkNavy}`}>
                              Role Description & Achievements
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your responsibilities, key achievements, projects led, and impact made..."
                                rows={3}
                                {...field}
                                value={field.value || ''}
                                className={`${colorClasses.bg.white} ${colorClasses.border.gray400} resize-none`}
                                maxLength={500}
                              />
                            </FormControl>
                            <div className={`text-xs ${colorClasses.text.gray400} text-right`}>
                              {field.value?.length || 0}/500 characters
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <SkillsInput
                        control={form.control}
                        name={`experience.${index}.skills`}
                        label="Skills used in this role"
                        placeholder="Add skills relevant to this position"
                      />
                    </div>
                  );
                })}

                {experience.length === 0 && (
                  <div className={`text-center py-12 ${colorClasses.text.gray400} border-2 border-dashed ${colorClasses.border.gray400} rounded-xl`}>
                    <Briefcase className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-4 text-lg font-medium">No experience entries yet</p>
                    <p className="mt-2 text-sm max-w-md mx-auto">
                      Add your work experience to showcase your professional background and achievements
                    </p>
                    <button
                      type="button"
                      onClick={addExperience}
                      className={`mt-6 flex items-center mx-auto px-6 py-2 ${colorClasses.bg.goldenMustard} ${colorClasses.text.white} rounded-lg font-medium transition-all hover:opacity-90`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Experience Entry
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications Section */}
            <Card className={`border ${colorClasses.border.gray100} ${colorClasses.bg.white} shadow-sm hover:shadow-md transition-shadow`}>
              <CardHeader className={`pb-3 ${colorClasses.bg.darkNavy} rounded-t-lg`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colorClasses.bg.gold}`}>
                      <Award className={`h-5 w-5 ${colorClasses.text.darkNavy}`} />
                    </div>
                    <div>
                      <CardTitle className={`text-lg md:text-xl font-bold ${colorClasses.text.white}`}>
                        Certifications & Courses
                      </CardTitle>
                      <CardDescription className={`${colorClasses.text.gray100}`}>
                        Professional certifications, online courses, and training programs
                      </CardDescription>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCertification}
                    className={`flex items-center justify-center px-4 py-2 ${colorClasses.bg.goldenMustard} ${colorClasses.text.white} rounded-lg font-medium transition-all hover:opacity-90 active:scale-95 shadow-sm`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Certification</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {certifications.map((cert, index) => {
                  const dateErrors = validateDate(cert.issueDate, cert.expiryDate, false, 'Certification');

                  return (
                    <div key={index} className={`border ${colorClasses.border.gray100} rounded-xl p-4 md:p-6 space-y-4 ${colorClasses.bg.gray100}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${colorClasses.bg.gold} ${colorClasses.text.darkNavy}`}>
                            <Award className="h-4 w-4" />
                          </div>
                          <h4 className={`font-semibold ${colorClasses.text.darkNavy}`}>
                            Certification #{index + 1}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className={`p-2 ${colorClasses.text.gray400} hover:${colorClasses.text.orange} transition-colors`}
                          aria-label="Remove certification entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Date validation errors */}
                      {dateErrors.length > 0 && (
                        <div className={`${colorClasses.bg.orange} bg-opacity-10 border ${colorClasses.border.orange} border-opacity-20 rounded-lg p-3`}>
                          {dateErrors.map((error, errorIndex) => (
                            <p key={errorIndex} className={`text-sm flex items-center ${colorClasses.text.orange}`}>
                              <span className={`w-2 h-2 rounded-full ${colorClasses.bg.orange} mr-2`}></span>
                              {error}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`certifications.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Certification/Course Name <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., AWS Certified Solutions Architect"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Issuing Organization <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Amazon Web Services, Coursera"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Issue Date <span className={`${colorClasses.text.orange}`}>*</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ''}
                                  max={new Date().toISOString().split('T')[0]}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Expiry Date
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="date"
                                  {...field}
                                  value={field.value || ''}
                                  min={form.watch(`certifications.${index}.issueDate`)}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Credential ID
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., AWS-12345"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                              <FormLabel className={`${colorClasses.text.darkNavy}`}>
                                Credential URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/credential"
                                  {...field}
                                  value={field.value || ''}
                                  className={`${colorClasses.bg.white} ${colorClasses.border.gray400}`}
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
                            <FormLabel className={`${colorClasses.text.darkNavy}`}>
                              Description & Learning Outcomes
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what you learned, skills gained, project completed, or relevance to your career..."
                                rows={3}
                                {...field}
                                value={field.value || ''}
                                className={`${colorClasses.bg.white} ${colorClasses.border.gray400} resize-none`}
                                maxLength={500}
                              />
                            </FormControl>
                            <div className={`text-xs ${colorClasses.text.gray400} text-right`}>
                              {field.value?.length || 0}/500 characters
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}

                {certifications.length === 0 && (
                  <div className={`text-center py-12 ${colorClasses.text.gray400} border-2 border-dashed ${colorClasses.border.gray400} rounded-xl`}>
                    <Award className="mx-auto h-12 w-12 opacity-50" />
                    <p className="mt-4 text-lg font-medium">No certifications or courses yet</p>
                    <p className="mt-2 text-sm max-w-md mx-auto">
                      Add professional certifications, online courses, or training programs to enhance your profile
                    </p>
                    <button
                      type="button"
                      onClick={addCertification}
                      className={`mt-6 flex items-center mx-auto px-6 py-2 ${colorClasses.bg.goldenMustard} ${colorClasses.text.white} rounded-lg font-medium transition-all hover:opacity-90`}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Certification
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => window.history.back()}
                className={`px-6 py-3 border ${colorClasses.border.gray400} ${colorClasses.bg.white} ${colorClasses.text.darkNavy} rounded-xl font-medium transition-all hover:${colorClasses.bg.gray100} active:scale-95`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex items-center justify-center px-6 py-3 ${colorClasses.bg.goldenMustard} ${colorClasses.text.white} rounded-xl font-medium transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving Changes...
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