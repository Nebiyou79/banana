/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ApplicationForm.tsx - MODERN REDESIGN
import React, { useState, useEffect } from 'react';
import {
  applicationService,
  type ApplyForJobData,
  type Reference,
  type WorkExperience,
  type ContactInfo,
  type CV,
  type UserInfo
} from '@/services/applicationService';
import { candidateService, type CandidateProfile } from '@/services/candidateService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  User,
  Send,
  FileText,
  Plus,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Briefcase,
  Users,
  Award,
  File,
  BookOpen,
  AlertCircle,
} from 'lucide-react';

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSuccess?: (application: any) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
}

interface FormData {
  coverLetter: string;
  skills: string[];
  references: Reference[];
  workExperience: WorkExperience[];
  contactInfo: ContactInfo;
  selectedCVs: Array<{ cvId: string; filename: string; originalName: string; url: string }>;
  userInfo?: UserInfo;
}

interface UploadedFiles {
  referenceFiles: File[];
  experienceFiles: File[];
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId,
  jobTitle,
  companyName,
  onSuccess,
  onCancel,
  onError
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    referenceFiles: [],
    experienceFiles: []
  });

  const [formData, setFormData] = useState<FormData>({
    coverLetter: '',
    skills: [],
    references: [],
    workExperience: [],
    contactInfo: {
      email: '',
      phone: '',
      location: '',
      telegram: ''
    },
    selectedCVs: [],
    userInfo: undefined
  });

  const steps = [
    { 
      number: 1, 
      title: 'Profile', 
      icon: User, 
      description: 'Contact & CV',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      number: 2, 
      title: 'Application', 
      icon: BookOpen, 
      description: 'Cover Letter & Skills',
      color: 'from-emerald-500 to-green-500'
    },
    { 
      number: 3, 
      title: 'Documents', 
      icon: Briefcase, 
      description: 'Experience & References',
      color: 'from-violet-500 to-purple-500'
    },
  ];

  useEffect(() => {
    loadCandidateData();
  }, []);

  const loadCandidateData = async () => {
    try {
      setIsLoading(true);
      const profile = await candidateService.getProfile();
      setCandidateProfile(profile);

      setFormData(prev => ({
        ...prev,
        contactInfo: {
          email: profile.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          telegram: ''
        },
        userInfo: {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          location: profile.location || '',
          bio: profile.bio || '',
          website: profile.website || '',
          socialLinks: profile.socialLinks || {}
        },
        skills: profile.skills || [],
        coverLetter: generateDefaultCoverLetter(profile, jobTitle, companyName)
      }));

      try {
        const candidateCVs = await applicationService.getCandidateCVs();
        const enhancedCVs = candidateCVs.map(cv => ({
          ...cv,
          size: cv.size || 0,
          mimetype: cv.mimetype || 'application/octet-stream'
        }));
        setCvs(enhancedCVs);

        if (enhancedCVs.length > 0) {
          const firstCV = enhancedCVs[0];
          setFormData(prev => ({
            ...prev,
            selectedCVs: [{
              cvId: firstCV._id,
              filename: firstCV.filename,
              originalName: firstCV.originalName,
              url: firstCV.url
            }]
          }));
        }
      } catch (cvError) {
        console.error('CV loading error:', cvError);
        toast({
          title: 'CV Loading Issue',
          description: 'You can continue without CVs or try again later',
          variant: 'warning'
        });
      }

    } catch (error: any) {
      console.error('Profile loading error:', error);
      toast({
        title: 'Profile Loading Failed',
        description: 'Please refresh the page or try again later',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDefaultCoverLetter = (profile: CandidateProfile, jobTitle: string, companyName: string): string => {
    return `Dear Hiring Manager,

I am excited to apply for the ${jobTitle} position at ${companyName}. With my background in ${profile.skills?.[0] || 'this field'} and passion for the industry, I believe I would be a valuable addition to your team.

Key qualifications that make me a strong candidate for this position:
• ${profile.skills?.slice(0, 3).join('\n• ') || 'Relevant skills and experience'}

I am particularly drawn to this opportunity because of ${companyName}'s reputation for innovation and excellence.

I look forward to the possibility of discussing how my skills and experience can contribute to your team's success.

Sincerely,
${profile.name}`;
  };

  const handleContactInfoChange = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };

  const handleCVSelection = (cvId: string, selected: boolean) => {
    setFormData(prev => {
      const cv = cvs.find(c => c._id === cvId);
      if (!cv) return prev;

      if (selected) {
        if (!prev.selectedCVs.some(selectedCV => selectedCV.cvId === cvId)) {
          return {
            ...prev,
            selectedCVs: [
              ...prev.selectedCVs,
              {
                cvId: cv._id,
                filename: cv.filename,
                originalName: cv.originalName,
                url: cv.url
              }
            ]
          };
        }
      } else {
        return {
          ...prev,
          selectedCVs: prev.selectedCVs.filter(selectedCV => selectedCV.cvId !== cvId)
        };
      }
      return prev;
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }));
  };

  const handleAddReference = () => {
    setFormData(prev => ({
      ...prev,
      references: [
        ...prev.references,
        {
          name: '',
          position: '',
          company: '',
          email: '',
          phone: '',
          relationship: '',
          allowsContact: true,
          providedAsDocument: false
        }
      ]
    }));
  };

  const handleReferenceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedReferences = [...prev.references];
      updatedReferences[index] = { ...updatedReferences[index], [field]: value };
      return { ...prev, references: updatedReferences };
    });
  };

  const handleRemoveReference = (index: number) => {
    setFormData(prev => {
      const updatedReferences = [...prev.references];
      updatedReferences.splice(index, 1);
      
      const newReferenceFiles = [...uploadedFiles.referenceFiles];
      if (newReferenceFiles[index]) {
        newReferenceFiles.splice(index, 1);
        setUploadedFiles(prev => ({ ...prev, referenceFiles: newReferenceFiles }));
      }
      
      return { ...prev, references: updatedReferences };
    });
  };

  const handleReferenceFileUpload = (index: number, file: File) => {
    const newReferenceFiles = [...uploadedFiles.referenceFiles];
    newReferenceFiles[index] = file;
    setUploadedFiles(prev => ({ ...prev, referenceFiles: newReferenceFiles }));

    setFormData(prev => {
      const updatedReferences = [...prev.references];
      updatedReferences[index] = { 
        ...updatedReferences[index], 
        providedAsDocument: true
      };
      return { ...prev, references: updatedReferences };
    });
  };

  const handleRemoveReferenceFile = (index: number) => {
    const newReferenceFiles = [...uploadedFiles.referenceFiles];
    newReferenceFiles.splice(index, 1);
    setUploadedFiles(prev => ({ ...prev, referenceFiles: newReferenceFiles }));

    setFormData(prev => {
      const updatedReferences = [...prev.references];
      updatedReferences[index] = { 
        ...updatedReferences[index], 
        providedAsDocument: false
      };
      return { ...prev, references: updatedReferences };
    });
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          current: false,
          description: '',
          providedAsDocument: false
        }
      ]
    }));
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedExperience = [...prev.workExperience];
      updatedExperience[index] = { ...updatedExperience[index], [field]: value };
      return { ...prev, workExperience: updatedExperience };
    });
  };

  const handleRemoveExperience = (index: number) => {
    setFormData(prev => {
      const updatedExperience = [...prev.workExperience];
      updatedExperience.splice(index, 1);
      
      const newExperienceFiles = [...uploadedFiles.experienceFiles];
      if (newExperienceFiles[index]) {
        newExperienceFiles.splice(index, 1);
        setUploadedFiles(prev => ({ ...prev, experienceFiles: newExperienceFiles }));
      }
      
      return { ...prev, workExperience: updatedExperience };
    });
  };

  const handleExperienceFileUpload = (index: number, file: File) => {
    const newExperienceFiles = [...uploadedFiles.experienceFiles];
    newExperienceFiles[index] = file;
    setUploadedFiles(prev => ({ ...prev, experienceFiles: newExperienceFiles }));

    setFormData(prev => {
      const updatedExperience = [...prev.workExperience];
      updatedExperience[index] = { 
        ...updatedExperience[index], 
        providedAsDocument: true
      };
      return { ...prev, workExperience: updatedExperience };
    });
  };

  const handleRemoveExperienceFile = (index: number) => {
    const newExperienceFiles = [...uploadedFiles.experienceFiles];
    newExperienceFiles.splice(index, 1);
    setUploadedFiles(prev => ({ ...prev, experienceFiles: newExperienceFiles }));

    setFormData(prev => {
      const updatedExperience = [...prev.workExperience];
      updatedExperience[index] = { 
        ...updatedExperience[index], 
        providedAsDocument: false
      };
      return { ...prev, workExperience: updatedExperience };
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, callback: (file: File) => void) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    if (selectedFiles.length > 0) {
      const file = selectedFiles[0];
      
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'text/plain'
      ];
      
      const isValidType = allowedTypes.includes(file.type);
      const isValidSize = file.size <= 15 * 1024 * 1024;

      if (!isValidType) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload PDF, Word documents, or images',
          variant: 'destructive'
        });
        return;
      }

      if (!isValidSize) {
        toast({
          title: 'File too large',
          description: 'File size must be less than 15MB',
          variant: 'destructive'
        });
        return;
      }

      callback(file);
      toast({
        title: 'File Uploaded',
        description: `${file.name} has been added successfully`,
        variant: 'default'
      });
    }

    event.target.value = '';
  };

  const handleSubmit = async () => {
    try {
      const errors: string[] = [];

      if (!formData.contactInfo.email?.trim()) {
        errors.push('Email address is required');
      }
      if (!formData.contactInfo.phone?.trim()) {
        errors.push('Phone number is required');
      }
      if (!formData.contactInfo.location?.trim()) {
        errors.push('Location is required');
      }
      if (formData.selectedCVs.length === 0) {
        errors.push('At least one CV must be selected');
      }
      if (!formData.coverLetter?.trim()) {
        errors.push('Cover letter is required');
      }

      if (errors.length > 0) {
        errors.forEach((error: any) => {
          toast({
            title: 'Validation Error',
            description: error,
            variant: 'destructive'
          });
        });
        return;
      }

      setIsSubmitting(true);

      const applicationData: ApplyForJobData = {
        coverLetter: formData.coverLetter,
        skills: formData.skills,
        references: formData.references.map((ref, index) => ({
          ...ref,
          providedAsDocument: uploadedFiles.referenceFiles[index] !== undefined
        })),
        workExperience: formData.workExperience.map((exp, index) => ({
          ...exp,
          providedAsDocument: uploadedFiles.experienceFiles[index] !== undefined
        })),
        contactInfo: {
          email: formData.contactInfo.email,
          phone: formData.contactInfo.phone,
          location: formData.contactInfo.location,
          telegram: formData.contactInfo.telegram || ''
        },
        selectedCVs: formData.selectedCVs,
        userInfo: formData.userInfo
      };

      const allFiles: File[] = [
        ...uploadedFiles.referenceFiles.filter(file => file !== undefined),
        ...uploadedFiles.experienceFiles.filter(file => file !== undefined)
      ];

      const response = await applicationService.applyForJob(
        jobId,
        applicationData,
        allFiles
      );

      toast({
        title: 'Application Submitted! 🎉',
        description: 'Your application has been submitted successfully',
        variant: 'default'
      });

      onSuccess?.(response.data.application);

    } catch (error: any) {
      console.error('Application submission error:', error);
      
      let errorMessage = error.message || 'Failed to submit application';
      
      if (error.message.includes('already applied')) {
        errorMessage = 'You have already applied for this job';
      } else if (error.message.includes('no longer accepting')) {
        errorMessage = 'This job is no longer accepting applications';
      } else if (error.message.includes('Validation failed')) {
        errorMessage = 'Please check your application details and try again';
      } else if (error.message.includes('Cover letter is required')) {
        errorMessage = 'Cover letter is required';
      } else if (error.message.includes('At least one CV must be selected')) {
        errorMessage = 'Please select at least one CV';
      }

      toast({
        title: 'Application Failed',
        description: errorMessage,
        variant: 'destructive'
      });

      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.contactInfo.email || !formData.contactInfo.phone || !formData.contactInfo.location) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required contact information',
          variant: 'destructive'
        });
        return;
      }
      if (formData.selectedCVs.length === 0) {
        toast({
          title: 'CV Required',
          description: 'Please select at least one CV to continue',
          variant: 'destructive'
        });
        return;
      }
    }

    if (currentStep === 2 && !formData.coverLetter.trim()) {
      toast({
        title: 'Cover Letter Required',
        description: 'Please write a cover letter to continue',
        variant: 'destructive'
      });
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const getFileDisplayName = (file: File): string => {
    return file.name.length > 30 ? `${file.name.substring(0, 30)}...` : file.name;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-2xl font-semibold text-slate-900 mb-2">Preparing Your Application</h3>
          <p className="text-slate-600">Getting everything ready for you...</p>
        </div>
      </div>
    );
  }

  const isLastStep = currentStep === steps.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Apply for Position</h1>
                <p className="text-slate-600 text-lg">{jobTitle} at {companyName}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCurrent = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center relative z-10">
                    <button
                      onClick={() => goToStep(step.number)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isCurrent 
                          ? `bg-gradient-to-br ${step.color} text-white shadow-lg scale-110` 
                          : isCompleted 
                          ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-200' 
                          : 'bg-slate-100 text-slate-400 border-2 border-slate-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </button>
                    <div className="mt-3 text-center">
                      <p className={`text-sm font-medium ${
                        isCurrent ? 'text-slate-900' : isCompleted ? 'text-emerald-700' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{step.description}</p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Step 1: Profile & CV Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Contact Information */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Contact Information</CardTitle>
                      <CardDescription className="text-slate-600">
                        We`ll use this to contact you about your application
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-sm font-medium text-slate-700 mb-2 block">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.contactInfo.email}
                          onChange={(e) => handleContactInfoChange('email', e.target.value)}
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-sm font-medium text-slate-700 mb-2 block">
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.contactInfo.phone}
                          onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                          className="w-full"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-sm font-medium text-slate-700 mb-2 block">
                        Location *
                      </Label>
                      <Input
                        id="location"
                        value={formData.contactInfo.location}
                        onChange={(e) => handleContactInfoChange('location', e.target.value)}
                        className="w-full"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CV Selection */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Select Your Resume</CardTitle>
                      <CardDescription className="text-slate-600">
                        Choose which resume to submit with your application
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {cvs.length > 0 ? cvs.map((cv) => (
                      <div
                        key={cv._id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          formData.selectedCVs.some(selected => selected.cvId === cv._id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4 flex-1">
                          <input
                            type="checkbox"
                            checked={formData.selectedCVs.some(selected => selected.cvId === cv._id)}
                            onChange={(e) => handleCVSelection(cv._id, e.target.checked)}
                            className="h-5 w-5 text-blue-600 rounded"
                          />
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-slate-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{cv.originalName}</p>
                            <p className="text-sm text-slate-500">
                              {applicationService.getFileSize(cv)} • Uploaded {new Date(cv.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applicationService.viewCV(cv)}
                            className="border-slate-300 text-slate-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applicationService.downloadCV(cv)}
                            className="border-slate-300 text-slate-700"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium mb-2">No Resume Found</p>
                        <p className="text-slate-400 text-sm mb-4">Upload your resume to start applying for jobs</p>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/dashboard/candidate/profile', '_blank')}
                          className="border-slate-300 text-slate-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Cover Letter & Skills */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Cover Letter */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Cover Letter</CardTitle>
                      <CardDescription className="text-slate-600">
                        Tell us why you`re the perfect fit for this position
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div>
                    <Label htmlFor="coverLetter" className="text-sm font-medium text-slate-700 mb-3 block">
                      Your Application Letter *
                    </Label>
                    <Textarea
                      id="coverLetter"
                      value={formData.coverLetter}
                      onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                      rows={12}
                      className="w-full resize-none font-sans leading-relaxed"
                      placeholder="Write your cover letter here..."
                    />
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-sm text-slate-500">
                        {formData.coverLetter.length} characters
                      </p>
                      {formData.coverLetter.length < 100 && (
                        <p className="text-sm text-amber-600 flex items-center space-x-1">
                          <AlertCircle className="h-4 w-4" />
                          <span>Minimum 100 characters recommended</span>
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Award className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Skills & Competencies</CardTitle>
                      <CardDescription className="text-slate-600">
                        Add skills that are relevant to this position
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex space-x-3">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a new skill..."
                        className="flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button
                        onClick={handleAddSkill}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-2 hover:text-emerald-800"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {formData.skills.length === 0 && (
                      <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl">
                        <Award className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-medium">No skills added yet</p>
                        <p className="text-sm">Add relevant skills to strengthen your application</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Experience & References */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Work Experience */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Work Experience</CardTitle>
                      <CardDescription className="text-slate-600">
                        Add your relevant work experience and supporting documents
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {formData.workExperience.map((experience, index) => (
                      <div key={index} className="p-6 border border-slate-200 rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900">Experience #{index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExperience(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">
                              Company *
                            </Label>
                            <Input
                              value={experience.company || ''}
                              onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                              placeholder="Company name"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">
                              Position *
                            </Label>
                            <Input
                              value={experience.position || ''}
                              onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                              placeholder="Your position"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">
                              Start Date *
                            </Label>
                            <Input
                              type="month"
                              value={experience.startDate || ''}
                              onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">
                              End Date
                            </Label>
                            <Input
                              type="month"
                              value={experience.endDate || ''}
                              onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                              disabled={experience.current}
                            />
                            <div className="flex items-center mt-2">
                              <input
                                type="checkbox"
                                checked={experience.current || false}
                                onChange={(e) => handleExperienceChange(index, 'current', e.target.checked)}
                                className="h-4 w-4 text-violet-600 rounded"
                              />
                              <Label className="ml-2 text-sm text-slate-700">I currently work here</Label>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label className="text-sm font-medium text-slate-700 mb-2 block">Description</Label>
                          <Textarea
                            value={experience.description || ''}
                            onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                            rows={3}
                            placeholder="Describe your responsibilities and achievements..."
                          />
                        </div>
                        
                        {/* Experience Document Upload */}
                        <div className="mt-4">
                          <Label className="text-sm font-medium text-slate-700 mb-2 block">
                            Supporting Document (Optional)
                          </Label>
                          {uploadedFiles.experienceFiles[index] ? (
                            <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                <div>
                                  <p className="font-medium text-slate-900">
                                    {getFileDisplayName(uploadedFiles.experienceFiles[index])}
                                  </p>
                                  <p className="text-sm text-slate-500">
                                    {applicationService.getFileSize({ size: uploadedFiles.experienceFiles[index].size } as any)}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExperienceFile(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                              <Input
                                type="file"
                                onChange={(e) => handleFileUpload(e, (file) => handleExperienceFileUpload(index, file))}
                                className="hidden"
                                id={`experience-file-${index}`}
                              />
                              <Label htmlFor={`experience-file-${index}`} className="cursor-pointer">
                                <div className="flex flex-col items-center">
                                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                  <p className="text-slate-600 font-medium">Upload supporting document</p>
                                  <p className="text-sm text-slate-500">PDF, DOC, DOCX • Max 15MB</p>
                                </div>
                              </Label>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={handleAddExperience}
                      variant="outline"
                      className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 py-6"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Another Work Experience
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* References */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Professional References</CardTitle>
                      <CardDescription className="text-slate-600">
                        Add people who can vouch for your work and character
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {formData.references.map((reference, index) => (
                      <div key={index} className="p-6 border border-slate-200 rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-slate-900">Reference #{index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveReference(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Full Name *</Label>
                            <Input
                              value={reference.name || ''}
                              onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                              placeholder="Reference full name"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Position *</Label>
                            <Input
                              value={reference.position || ''}
                              onChange={(e) => handleReferenceChange(index, 'position', e.target.value)}
                              placeholder="Their position"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Company *</Label>
                            <Input
                              value={reference.company || ''}
                              onChange={(e) => handleReferenceChange(index, 'company', e.target.value)}
                              placeholder="Company name"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Relationship *</Label>
                            <Input
                              value={reference.relationship || ''}
                              onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
                              placeholder="How do you know them?"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Email</Label>
                            <Input
                              type="email"
                              value={reference.email || ''}
                              onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                              placeholder="email@example.com"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">Phone</Label>
                            <Input
                              type="tel"
                              value={reference.phone || ''}
                              onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                              placeholder="Phone number"
                            />
                          </div>
                        </div>
                        <div className="mt-4 space-y-3">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={reference.allowsContact || false}
                              onChange={(e) => handleReferenceChange(index, 'allowsContact', e.target.checked)}
                              className="h-4 w-4 text-violet-600 rounded"
                            />
                            <Label className="text-sm text-slate-700 font-medium">This reference allows contact</Label>
                          </div>

                          {/* Reference Document Upload */}
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-2 block">
                              Reference Letter (Optional)
                            </Label>
                            {uploadedFiles.referenceFiles[index] ? (
                              <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-5 w-5 text-emerald-600" />
                                  <div>
                                    <p className="font-medium text-slate-900">
                                      {getFileDisplayName(uploadedFiles.referenceFiles[index])}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                      {applicationService.getFileSize({ size: uploadedFiles.referenceFiles[index].size } as any)}
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveReferenceFile(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-slate-400 transition-colors">
                                <Input
                                  type="file"
                                  onChange={(e) => handleFileUpload(e, (file) => handleReferenceFileUpload(index, file))}
                                  className="hidden"
                                  id={`reference-file-${index}`}
                                />
                                <Label htmlFor={`reference-file-${index}`} className="cursor-pointer">
                                  <div className="flex flex-col items-center">
                                    <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                    <p className="text-slate-600 font-medium">Upload reference letter</p>
                                    <p className="text-sm text-slate-500">PDF, DOC, DOCX • Max 15MB</p>
                                  </div>
                                </Label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={handleAddReference}
                      variant="outline"
                      className="w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 py-6"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Another Professional Reference
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Application Summary */}
              <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-slate-900">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                    <span>Ready to Submit?</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Review your application before submitting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-blue-600">{formData.selectedCVs.length}</div>
                      <div className="text-sm text-slate-600">Resumes</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-emerald-600">{formData.skills.length}</div>
                      <div className="text-sm text-slate-600">Skills</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-violet-600">{formData.workExperience.length}</div>
                      <div className="text-sm text-slate-600">Experiences</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-amber-600">{formData.references.length}</div>
                      <div className="text-sm text-slate-600">References</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-center">
            <p className="text-sm font-medium text-slate-600">
              Step {currentStep} of {steps.length}
            </p>
            <p className="text-xs text-slate-500">
              {steps[currentStep - 1]?.title}
            </p>
          </div>

          {!isLastStep ? (
            <Button
              onClick={nextStep}
              className="bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-gradient-to-br from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;