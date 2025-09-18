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
import { Loader2, Save, Upload, FileText, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { candidateService, CandidateProfile } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/forms/Button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState<string | undefined>(undefined);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
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
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await candidateService.getProfile();
        
        // If the CV URL is a relative path, convert it to full URL
        let finalCvUrl = profile.cvUrl;
        if (profile.cvUrl && profile.cvUrl.startsWith('/uploads/')) {
          finalCvUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${profile.cvUrl}`;
        }
        setCvUrl(finalCvUrl);
        
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
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load profile',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [form, toast]);

  const onSubmit = async (values: ProfileFormData) => {
    try {
      setIsSaving(true);
      await candidateService.updateProfile(values);
      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = (file: File): boolean => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'doc', 'docx'].includes(fileExtension || '')) {
      toast({
        title: 'Error',
        description: 'Please upload a PDF, DOC, or DOCX file',
        variant: 'destructive'
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'File size must be less than 10MB',
        variant: 'destructive'
      });
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const result = await candidateService.uploadCV(file);
      
      // Convert relative URL to absolute URL for frontend access
      let finalCvUrl = result.cvUrl;
      if (result.cvUrl && result.cvUrl.startsWith('/uploads/')) {
        finalCvUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${result.cvUrl}`;
      }
      setCvUrl(finalCvUrl);
      setSelectedFile(null);
      
      toast({
        title: 'Success',
        description: 'CV uploaded successfully'
      });
    } catch (error: any) {
      console.error('Failed to upload CV:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload CV',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (handleFileSelect(file)) {
        handleFileUpload(file);
      }
    }
  };

  const handleSelectFileClick = () => {
    // Programmatically click the hidden file input
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

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && handleFileSelect(files[0])) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleDownloadCV = () => {
    if (cvUrl) {
      console.log('Current CV URL:', cvUrl);
      
      let downloadUrl = cvUrl;
      
      // FIX: Handle URL construction correctly
      if (cvUrl.startsWith('http')) {
        // Already a full URL, use as-is
        downloadUrl = cvUrl;
      } else if (cvUrl.startsWith('/api/v1/')) {
        // Remove the incorrect prefix
        downloadUrl = cvUrl.replace('/api/v1', '');
      }
      
      // Construct correct URL - files are served from /uploads, not /api/v1/uploads
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // If it's not already a full URL, prepend the backend URL
      if (!downloadUrl.startsWith('http')) {
        // Ensure proper URL format
        if (downloadUrl.startsWith('/')) {
          downloadUrl = `${backendUrl}${downloadUrl}`;
        } else {
          downloadUrl = `${backendUrl}/${downloadUrl}`;
        }
      }
      
      console.log('Final download URL:', downloadUrl);
      window.open(downloadUrl, '_blank');
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
    <DashboardLayout requiredRole="candidate">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  const currentSkills = form.watch('skills') || [];

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile Management</h1>
          <p className="text-gray-600">Update your candidate profile and CV</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
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
                  <CardTitle>CV/Resume</CardTitle>
                  <CardDescription>Upload your latest CV</CardDescription>
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
                    
                    {selectedFile ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium truncate">
                              {selectedFile.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={removeSelectedFile}
                            type="button"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2">
                          <Button
                            onClick={() => handleFileUpload(selectedFile)}
                            disabled={isUploading}
                            className="w-full"
                          >
                            {isUploading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            {isUploading ? 'Uploading...' : 'Upload CV'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Drag & drop your CV here or click to browse
                        </p>
                        <Button 
                          variant="outline" 
                          disabled={isUploading} 
                          onClick={handleSelectFileClick}
                          type="button"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Select File
                        </Button>
                        <input
                          ref={fileInputRef}
                          id="cv-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileInputChange}
                          disabled={isUploading}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          PDF, DOC, or DOCX files (max 10MB)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Current CV Status */}
                  {cvUrl && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-6 w-6 text-green-600" />
                          <div>
                            <p className="font-medium text-green-800">CV Uploaded</p>
                            <p className="text-sm text-green-600">
                              Ready for employers to view
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadCV}
                          type="button"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          View CV
                        </Button>
                      </div>
                    </div>
                  )}

                  {!cvUrl && !selectedFile && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800">No CV Uploaded</p>
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
                <CardTitle>Skills</CardTitle>
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
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
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
    </DashboardLayout>
  );
}