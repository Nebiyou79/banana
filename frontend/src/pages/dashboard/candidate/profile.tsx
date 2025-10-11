/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';
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
import { Badge } from '@/components/ui/Badge';
import { Loader2, Save, Upload, FileText, Download, X, Plus, Trash2, Briefcase } from 'lucide-react';
import { candidateService, CV } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/forms/Button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { applyBgColor, applyColor, applyBorderColor } from '@/utils/color';
import { toast } from '@/utils/Toast';

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
}

export default function CandidateProfilePage() {
  console.log('[CandidateProfilePage] Render start');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    defaultValues: {
      skills: [],
      bio: '',
      location: '',
      phone: '',
      website: '',
      education: [],
      experience: []
    }
  });

  useEffect(() => {
    console.log('[CandidateProfilePage] useEffect (loadProfile), user:', user);
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await candidateService.getProfile();
        console.log('Loaded profile:', profile); // Debug log
        setCvs(profile.cvs || []);
        const formData: ProfileFormData = {
          skills: profile.skills || [],
          bio: profile.bio || '',
          location: profile.location || '',
          phone: profile.phone || '',
          website: profile.website || '',
          education: profile.education || [],
          experience: profile.experience || []
        };
        form.reset(formData);
        console.log('[CandidateProfilePage] Form reset with:', formData);
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        toast.error(error.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
        console.log('[CandidateProfilePage] Loading finished');
      }
    };
    if (user) {
      console.log('[CandidateProfilePage] user exists, loading profile...');
      loadProfile();
    } else {
      console.log('[CandidateProfilePage] user not available, skipping loadProfile');
    }
  }, [form, user]);

  const onSubmit = async (values: ProfileFormData) => {
    // Frontend validation for required education/experience fields
    const eduErrors = (values.education || []).map((edu, idx) => {
      if (!edu.institution || !edu.degree || !edu.startDate) {
        return `Education #${idx + 1}: Institution, Degree, and Start Date are required.`;
      }
      return null;
    }).filter(Boolean);

    const expErrors = (values.experience || []).map((exp, idx) => {
      if (!exp.company || !exp.position || !exp.startDate) {
        return `Experience #${idx + 1}: Company, Position, and Start Date are required.`;
      }
      return null;
    }).filter(Boolean);

    const allErrors = [...eduErrors, ...expErrors].filter((msg): msg is string => Boolean(msg));
    if (allErrors.length > 0) {
      allErrors.forEach((msg) => toast.error(msg));
      return;
    }

    try {
      setIsSaving(true);
      console.log('Submitting profile data:', values); // Debug log
      await candidateService.updateProfile(values);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (files: FileList): File[] => {
    const validFiles: File[] = [];
    
    Array.from(files).forEach(file => {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'doc', 'docx'].includes(fileExtension || '')) {
        toast.error('Please upload only PDF, DOC, or DOCX files');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      validFiles.push(file);
    });

    return validFiles;
  };

  const handleFileUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      const uploadedCVs = await candidateService.uploadCVs(files);
      setCvs(prev => [...prev, ...uploadedCVs]);
      setSelectedFiles([]);
      toast.success('CVs uploaded successfully');
    } catch (error: any) {
      console.error('Failed to upload CVs:', error);
      toast.error(error.message || 'Failed to upload CVs');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validFiles = handleFileSelect(files);
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
      }
    }
  };

  const handleSelectFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const validFiles = handleFileSelect(files);
      if (validFiles.length > 0) {
        setSelectedFiles(validFiles);
      }
    }
  }, []);

  const handleDownloadCV = (cv: CV) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    let downloadUrl = cv.path;
    // Always use /uploads/cv/filename path
    if (!downloadUrl.startsWith('http')) {
      // Remove any /api/v1/uploads prefix and ensure /uploads/cv/filename
      downloadUrl = downloadUrl.replace(/^\/api\/v1\/uploads/, '/uploads');
      downloadUrl = `${backendUrl}${downloadUrl}`;
    }
    window.open(downloadUrl, '_blank');
  };

  const handleSetPrimaryCV = async (cvId: string) => {
    try {
      await candidateService.setPrimaryCV(cvId);
      setCvs(prev => prev.map(cv => ({
        ...cv,
        isPrimary: cv._id === cvId
      })));
      toast.success('Primary CV updated successfully');
    } catch (error: any) {
      console.error('Failed to set primary CV:', error);
      toast.error(error.message || 'Failed to set primary CV');
    }
  };

  const handleDeleteCV = async (cvId: string) => {
    if (!confirm('Are you sure you want to delete this CV?')) return;

    try {
      await candidateService.deleteCV(cvId);
      setCvs(prev => prev.filter(cv => cv._id !== cvId));
      toast.success('CV deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete CV:', error);
      toast.error(error.message || 'Failed to delete CV');
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadSelectedFiles = () => {
    if (selectedFiles.length > 0) {
      handleFileUpload(selectedFiles);
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
        startDate: '',
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
        startDate: '',
        current: false,
        skills: []
      }
    ]);
  };

  const removeExperience = (index: number) => {
    const currentExperience = form.getValues('experience') || [];
    form.setValue('experience', currentExperience.filter((_, i) => i !== index));
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

  const currentSkills = form.watch('skills') || [];
  const education = form.watch('education') || [];
  const experience = form.watch('experience') || [];

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold" style={applyColor('darkNavy')}>Profile Management</h1>
          <p className="text-gray-600">Update your candidate profile and CV</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
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
                            placeholder="Tell us about yourself..."
                            rows={4}
                            {...field}
                            value={field.value || ''}
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
                            placeholder="Your location" 
                            {...field} 
                            value={field.value || ''}
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
                            placeholder="Your phone number" 
                            {...field} 
                            value={field.value || ''}
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
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Your website" 
                            {...field} 
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* CV Upload */}
              <Card>
                <CardHeader>
                  <CardTitle style={applyColor('darkNavy')}>CV/Resume</CardTitle>
                  <CardDescription>Upload your latest CVs (max 5)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Drag & Drop Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragOver 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    
                    {selectedFiles.length > 0 ? (
                      <div className="space-y-3">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium truncate">
                                  {file.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSelectedFile(index)}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <div className="flex space-x-2">
                          <Button
                            onClick={uploadSelectedFiles}
                            disabled={isUploading}
                            className="flex-1"
                            style={applyBgColor('gold')}
                          >
                            {isUploading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {isUploading ? 'Uploading...' : 'Upload All'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedFiles([])}
                            type="button"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Drag & drop your CVs here or click to browse
                        </p>
                        <Button 
                          variant="outline" 
                          disabled={isUploading} 
                          onClick={handleSelectFileClick}
                          type="button"
                          style={applyBorderColor('gold')}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Select Files
                        </Button>
                        <input
                          ref={fileInputRef}
                          id="cv-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileInputChange}
                          disabled={isUploading}
                          multiple
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          PDF, DOC, or DOCX files (max 10MB each)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Current CVs */}
                  {cvs.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="font-medium">Your CVs</h3>
                      {cvs.map((cv) => (
                        <div key={cv._id} className={`border rounded-lg p-3 ${cv.isPrimary ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-medium">{cv.originalName}</p>
                                <p className="text-sm text-gray-600">
                                  Uploaded: {new Date(cv.uploadedAt).toLocaleDateString()}
                                  {cv.isPrimary && <span className="ml-2 text-blue-600 font-semibold">• Primary</span>}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {!cv.isPrimary && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSetPrimaryCV(cv._id)}
                                  style={applyBorderColor('gold')}
                                >
                                  Set Primary
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadCV(cv)}
                                style={applyBorderColor('teal')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteCV(cv._id)}
                                style={applyBorderColor('orange')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {cvs.length === 0 && selectedFiles.length === 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800">No CVs Uploaded</p>
                          <p className="text-sm text-yellow-600">
                            Upload your CV to apply for jobs
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skills Section */}
            <Card>
              <CardHeader>
                <CardTitle style={applyColor('darkNavy')}>Skills</CardTitle>
                <CardDescription>Your technical and professional skills</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills (comma-separated)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., JavaScript, React, Node.js"
                          value={field.value.join(', ')}
                          onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {currentSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" style={applyBgColor('gold')}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Education Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={applyColor('darkNavy')}>Education</CardTitle>
                    <CardDescription>Your educational background</CardDescription>
                  </div>
                  <Button type="button" onClick={addEducation} size="sm" style={applyBgColor('gold')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {education.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Education #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEducation(index)}
                        style={applyBorderColor('orange')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`education.${index}.institution`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Institution</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
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
                            <FormLabel>Degree</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
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
                              <Input {...field} value={field.value || ''} />
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
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ''} />
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
                                onChange={field.onChange}
                                className="rounded"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Currently studying here</FormLabel>
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
                              placeholder="Describe your studies, achievements, etc."
                              rows={3}
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                {education.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No education entries yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Experience Section */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle style={applyColor('darkNavy')}>Experience</CardTitle>
                    <CardDescription>Your work experience</CardDescription>
                  </div>
                  <Button type="button" onClick={addExperience} size="sm" style={applyBgColor('gold')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {experience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Experience #{index + 1}</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeExperience(index)}
                        style={applyBorderColor('orange')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`experience.${index}.company`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
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
                            <FormLabel>Position</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
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
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} value={field.value || ''} />
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
                                onChange={field.onChange}
                                className="rounded"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Current position</FormLabel>
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
                              placeholder="Describe your responsibilities and achievements"
                              rows={3}
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`experience.${index}.skills`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skills used (comma-separated)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., JavaScript, React, Node.js"
                              value={field.value.join(', ')}
                              onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
                
                {experience.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No experience entries yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => window.history.back()}
                style={applyBorderColor('gray400')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} style={applyBgColor('gold')}>
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
              </Button>
            </div>
          </form>
        </Form>
      </div>
      {/* {console.log('[CandidateProfilePage] Render end, isLoading:', isLoading, 'user:', user)} */}
    </DashboardLayout>
  );
}