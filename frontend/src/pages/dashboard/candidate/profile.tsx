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
import { Loader2, Save, Plus, Trash2, Briefcase, GraduationCap, Award } from 'lucide-react';
import { candidateService, CV } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CVUploadCard from '@/components/candidate/CVUploadCard';
import SkillsInput from '@/components/candidate/SkillsInput';
import { applyBgColor, applyColor, applyBorderColor } from '@/utils/color';
import { useToast } from '@/hooks/use-toast';

interface ProfileFormData {
  skills: string[];
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
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
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" style={applyColor('gold')} />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  const education = form.watch('education') || [];
  const experience = form.watch('experience') || [];
  const certifications = form.watch('certifications') || [];

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="pl-7 pt-5 text-3xl font-bold" style={applyColor('darkNavy')}>Profile Management</h1>
          <p className="text-gray-600 pl-8">Update your candidate profile and CV</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle style={applyColor('darkNavy')}>Basic Information</CardTitle>
                  <CardDescription>Your personal details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us about yourself, your career goals, and what makes you unique..."
                            rows={4}
                            {...field}
                            value={field.value || ''}
                            className="resize-none"
                            maxLength={1000}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., Addis Ababa, Ethiopia" 
                            {...field} 
                            value={field.value || ''}
                            maxLength={100}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+251 91 234 5678" 
                            {...field} 
                            value={field.value || ''}
                            maxLength={20}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website/Portfolio</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://yourportfolio.com" 
                            {...field} 
                            value={field.value || ''}
                            maxLength={200}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* CV Upload */}
              <CVUploadCard
                cvs={cvs}
                onUpload={handleCVUpload}
                onSetPrimary={handleSetPrimaryCV}
                onDelete={handleDeleteCV}
                onDownload={handleDownloadCV}
                isUploading={isUploading}
              />
            </div>

            {/* Skills Section */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle style={applyColor('darkNavy')}>Skills</CardTitle>
                <CardDescription>Your technical and professional skills</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillsInput
                  control={form.control}
                  name="skills"
                  label="Skills"
                  placeholder="Add a skill and press Enter or click +"
                />
              </CardContent>
            </Card>

            {/* Education Section */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={applyColor('darkNavy')}>Education</CardTitle>
                    <CardDescription>Your educational background</CardDescription>
                  </div>
                  <button 
                    type="button" 
                    onClick={addEducation}
                    className="flex items-center px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                    style={applyBgColor('gold')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {education.map((edu, index) => {
                  const dateErrors = validateDate(edu.startDate, edu.endDate, edu.current, 'Education');
                  
                  return (
                    <div key={`education-${index}-${edu.institution}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                          <h4 className="font-medium text-gray-900">Education #{index + 1}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEducation(index)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Date validation errors */}
                      {dateErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          {dateErrors.map((error, errorIndex) => (
                            <p key={`education-error-${index}-${errorIndex}`} className="text-sm text-red-600 flex items-center">
                              <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
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
                              <FormLabel>Institution *</FormLabel>
                              <FormControl>
                                <Input placeholder="University of Example" {...field} value={field.value || ''} />
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
                              <FormLabel>Degree *</FormLabel>
                              <FormControl>
                                <Input placeholder="Bachelor of Science" {...field} value={field.value || ''} />
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
                              <FormLabel>Field of Study</FormLabel>
                              <FormControl>
                                <Input placeholder="Computer Science" {...field} value={field.value || ''} />
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
                              <FormLabel>Start Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value || ''}
                                  max={new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
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
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value || ''}
                                  disabled={form.watch(`education.${index}.current`)}
                                  max={new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
  control={form.control}
  name={`education.${index}.current`}
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2">
      <FormControl>
        <input
          type="checkbox"
          checked={field.value || false}
          onChange={(e) => {
            const isChecked = e.target.checked;
            field.onChange(isChecked);
            
            // Clear end date when "current" is checked
            if (isChecked) {
              form.setValue(`education.${index}.endDate`, '');
            }
          }}
          className="rounded border-gray-300"
        />
      </FormControl>
      <FormLabel className="!mt-0 cursor-pointer">Currently studying here</FormLabel>
      <FormMessage />
    </FormItem>
  )}
/>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`education.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your studies, achievements, courses, etc."
                                rows={3}
                                {...field}
                                value={field.value || ''}
                                className="resize-none"
                                maxLength={500}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
                
                {education.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No education entries yet</p>
                    <p className="text-sm">Add your educational background to complete your profile</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={applyColor('darkNavy')}>Experience</CardTitle>
                    <CardDescription>Your work experience</CardDescription>
                  </div>
                  <button 
                    type="button" 
                    onClick={addExperience}
                    className="flex items-center px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                    style={applyBgColor('gold')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {experience.map((exp, index) => {
                  const dateErrors = validateDate(exp.startDate, exp.endDate, exp.current, 'Experience');
                  
                  return (
                    <div key={`experience-${index}-${exp.company}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="h-5 w-5 text-green-600" />
                          <h4 className="font-medium text-gray-900">Experience #{index + 1}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeExperience(index)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Date validation errors */}
                      {dateErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          {dateErrors.map((error, errorIndex) => (
                            <p key={`experience-error-${index}-${errorIndex}`} className="text-sm text-red-600 flex items-center">
                              <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
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
                              <FormLabel>Company *</FormLabel>
                              <FormControl>
                                <Input placeholder="Company Name" {...field} value={field.value || ''} />
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
                              <FormLabel>Position *</FormLabel>
                              <FormControl>
                                <Input placeholder="Job Title" {...field} value={field.value || ''} />
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
                              <FormLabel>Start Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value || ''}
                                  max={new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
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
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value || ''}
                                  disabled={form.watch(`experience.${index}.current`)}
                                  max={new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
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
          checked={field.value || false}
          onChange={(e) => {
            const isChecked = e.target.checked;
            field.onChange(isChecked);
            
            // Clear end date when "current" is checked
            if (isChecked) {
              form.setValue(`experience.${index}.endDate`, '');
            }
          }}
          className="rounded border-gray-300"
        />
      </FormControl>
      <FormLabel className="!mt-0 cursor-pointer">Current position</FormLabel>
      <FormMessage />
    </FormItem>
  )}
/>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name={`experience.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe your responsibilities, achievements, and key contributions..."
                                rows={3}
                                {...field}
                                value={field.value || ''}
                                className="resize-none"
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
                      />
                    </div>
                  );
                })}
                
                {experience.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No experience entries yet</p>
                    <p className="text-sm">Add your work experience to showcase your professional background</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Certifications & Courses Section */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={applyColor('darkNavy')}>Certifications & Courses</CardTitle>
                    <CardDescription>Professional certifications, online courses, and training programs</CardDescription>
                  </div>
                  <button 
                    type="button" 
                    onClick={addCertification}
                    className="flex items-center px-4 py-2 text-white rounded-lg font-medium transition-all hover:shadow-lg"
                    style={applyBgColor('gold')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification/Course
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {certifications.map((cert, index) => {
                  const dateErrors = validateDate(cert.issueDate, cert.expiryDate, false, 'Certification');
                  
                  return (
                    <div key={`certification-${index}-${cert.name}`} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Award className="h-5 w-5 text-purple-600" />
                          <h4 className="font-medium text-gray-900">Certification #{index + 1}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* Date validation errors */}
                      {dateErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          {dateErrors.map((error, errorIndex) => (
                            <p key={`certification-error-${index}-${errorIndex}`} className="text-sm text-red-600 flex items-center">
                              <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
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
                              <FormLabel>Certification/Course Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., AWS Certified Solutions Architect" {...field} value={field.value || ''} />
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
                              <FormLabel>Issuing Organization *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Amazon Web Services, Coursera" {...field} value={field.value || ''} />
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
                              <FormLabel>Issue Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value || ''}
                                  max={new Date().toISOString().split('T')[0]}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
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
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field}
                                  value={field.value || ''}
                                  min={form.watch(`certifications.${index}.issueDate`)}
                                  onChange={(e) => {
                                    field.onChange(e.target.value);
                                  }}
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
                              <FormLabel>Credential ID</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., AWS-12345" {...field} value={field.value || ''} />
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
                              <FormLabel>Credential URL</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="https://example.com/credential" 
                                  {...field} 
                                  value={field.value || ''}
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
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe what you learned, skills gained, or project completed..."
                                rows={3}
                                {...field}
                                value={field.value || ''}
                                className="resize-none"
                                maxLength={500}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
                
                {certifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Award className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No certifications or courses yet</p>
                    <p className="text-sm">Add professional certifications, online courses, or training programs</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => window.history.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
                style={applyBorderColor('gray400')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="flex items-center px-6 py-3 text-white rounded-xl font-medium transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={applyBgColor('gold')}
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