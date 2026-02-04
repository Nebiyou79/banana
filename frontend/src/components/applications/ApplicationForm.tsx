/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ApplicationForm.tsx - PROPER 3-STEP FLOW IMPLEMENTATION
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
  ClipboardCheck,
  Edit,
  X,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';

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

// File validation constants
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'text/plain'
];

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'];
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Generate unique temp ID for form entries
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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

  // File states - SEPARATE for each document type
  const [referenceFiles, setReferenceFiles] = useState<Map<string, File>>(new Map()); // Map tempId -> File
  const [experienceFiles, setExperienceFiles] = useState<Map<string, File>>(new Map()); // Map tempId -> File

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
      description: 'Contact & CV Selection',
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
    {
      number: 4,
      title: 'Review',
      icon: ClipboardCheck,
      description: 'Review & Submit',
      color: 'from-amber-500 to-orange-500'
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

      // Initialize form with candidate data
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

      // Load candidate's existing CVs
      try {
        const candidateCVs = await applicationService.getCandidateCVs();
        setCvs(candidateCVs);

        if (candidateCVs.length > 0) {
          // Auto-select the first CV (can be changed by user)
          const firstCV = candidateCVs[0];
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

  // File validation function
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const fileExtension = `.${file.name.toLowerCase().split('.').pop()}`;
      if (!ALLOWED_FILE_EXTENSIONS.includes(fileExtension)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
        };
      }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: `File size must be less than ${MAX_FILE_SIZE_MB}MB`
      };
    }

    if (file.size === 0) {
      return {
        valid: false,
        error: 'File is empty'
      };
    }

    return { valid: true };
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

  // Reference handling with tempId
  const handleAddReference = (mode: 'form' | 'document' = 'form') => {
    const tempId = generateTempId();
    
    setFormData(prev => ({
      ...prev,
      references: [
        ...prev.references,
        {
          _tempId: tempId,
          name: mode === 'form' ? '' : undefined,
          position: mode === 'form' ? '' : undefined,
          company: mode === 'form' ? '' : undefined,
          email: mode === 'form' ? '' : undefined,
          phone: mode === 'form' ? '' : undefined,
          relationship: mode === 'form' ? '' : undefined,
          allowsContact: true,
          providedAsDocument: mode === 'document'
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
    const reference = formData.references[index];
    if (reference._tempId) {
      // Remove associated file if exists
      setReferenceFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(reference._tempId!);
        return newMap;
      });
    }
    
    setFormData(prev => {
      const updatedReferences = [...prev.references];
      updatedReferences.splice(index, 1);
      return { ...prev, references: updatedReferences };
    });
  };

  // Experience handling with tempId
  const handleAddExperience = (mode: 'form' | 'document' = 'form') => {
    const tempId = generateTempId();
    
    setFormData(prev => ({
      ...prev,
      workExperience: [
        ...prev.workExperience,
        {
          _tempId: tempId,
          company: mode === 'form' ? '' : undefined,
          position: mode === 'form' ? '' : undefined,
          startDate: '',
          endDate: '',
          current: false,
          description: mode === 'form' ? '' : undefined,
          providedAsDocument: mode === 'document'
        }
      ]
    }));
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedExperience = [...prev.workExperience];
      updatedExperience[index] = { ...updatedExperience[index], [field]: value };
      
      // If changing to current, clear endDate
      if (field === 'current' && value === true) {
        updatedExperience[index].endDate = '';
      }
      
      return { ...prev, workExperience: updatedExperience };
    });
  };

  const handleRemoveExperience = (index: number) => {
    const experience = formData.workExperience[index];
    if (experience._tempId) {
      // Remove associated file if exists
      setExperienceFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(experience._tempId!);
        return newMap;
      });
    }
    
    setFormData(prev => {
      const updatedExperience = [...prev.workExperience];
      updatedExperience.splice(index, 1);
      return { ...prev, workExperience: updatedExperience };
    });
  };

  // File upload handling for references
  const handleReferenceFileUpload = (tempId: string, file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive'
      });
      return false;
    }

    setReferenceFiles(prev => new Map(prev).set(tempId, file));
    return true;
  };

  const removeReferenceFile = (tempId: string) => {
    setReferenceFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(tempId);
      return newMap;
    });
  };

  // File upload handling for experience
  const handleExperienceFileUpload = (tempId: string, file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: 'Invalid File',
        description: validation.error,
        variant: 'destructive'
      });
      return false;
    }

    setExperienceFiles(prev => new Map(prev).set(tempId, file));
    return true;
  };

  const removeExperienceFile = (tempId: string) => {
    setExperienceFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(tempId);
      return newMap;
    });
  };

  // Helper function to get file size display
  const getFileSize = (size: number): string => {
    if (size === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(size) / Math.log(k));
    return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to truncate filename
  const truncateFilename = (filename: string, maxLength: number = 25): string => {
    if (filename.length <= maxLength) return filename;
    const extension = filename.split('.').pop();
    const name = filename.substring(0, filename.lastIndexOf('.'));
    const truncatedName = name.substring(0, maxLength - (extension?.length || 0) - 4) + '...';
    return `${truncatedName}.${extension}`;
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
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
        errors.push('At least one CV must be selected from your profile');
      }
      if (!formData.coverLetter?.trim()) {
        errors.push('Cover letter is required');
      }

      // Validate document-based entries have files
      formData.references.forEach((ref, index) => {
        if (ref.providedAsDocument && !referenceFiles.has(ref._tempId!)) {
          errors.push(`Reference ${index + 1} is marked as document but no file is uploaded`);
        }
      });

      formData.workExperience.forEach((exp, index) => {
        if (exp.providedAsDocument && !experienceFiles.has(exp._tempId!)) {
          errors.push(`Work experience ${index + 1} is marked as document but no file is uploaded`);
        }
      });

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

      // Prepare application data
      const applicationData: ApplyForJobData = {
        coverLetter: formData.coverLetter,
        skills: formData.skills,
        references: formData.references.map(ref => ({
          ...ref,
          // Keep tempId for backend file matching
          _tempId: ref._tempId
        })),
        workExperience: formData.workExperience.map(exp => ({
          ...exp,
          // Keep tempId for backend file matching
          _tempId: exp._tempId
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

      console.log('📤 Submitting application:', {
        jobId,
        cvCount: formData.selectedCVs.length,
        referencesCount: formData.references.length,
        referencesWithDocuments: Array.from(referenceFiles.keys()).length,
        experienceCount: formData.workExperience.length,
        experienceWithDocuments: Array.from(experienceFiles.keys()).length
      });

      // Convert file maps to arrays with metadata
      const referenceFilesArray = Array.from(referenceFiles.entries()).map(([tempId, file]) => ({
        file,
        tempId
      }));

      const experienceFilesArray = Array.from(experienceFiles.entries()).map(([tempId, file]) => ({
        file,
        tempId
      }));

      // Submit application with files
      const response = await applicationService.applyForJob(
        jobId,
        applicationData,
        {
          referenceFiles: referenceFilesArray,
          experienceFiles: experienceFilesArray
        }
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
        errorMessage = 'Please select at least one CV from your profile';
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
    // Step 1 validation
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
          description: 'Please select at least one CV from your profile to continue',
          variant: 'destructive'
        });
        return;
      }
    }

    // Step 2 validation
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

  const truncateText = (text: string, length: number = 500): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
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
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${colorClasses.bg.goldenMustard} rounded-xl flex items-center justify-center`}>
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
                          ? `${colorClasses.bg.goldenMustard} text-white shadow-lg scale-110`
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
                    <div className={`w-10 h-10 ${colorClasses.bg.goldenMustard} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <User className="h-5 w-5 text-goldenMustard" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Contact Information</CardTitle>
                      <CardDescription className="text-slate-600">
                        We'll use this to contact you about your application
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
                    <div className={`w-10 h-10 ${colorClasses.bg.goldenMustard} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <FileText className="h-5 w-5 text-goldenMustard" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Select Your CVs</CardTitle>
                      <CardDescription className="text-slate-600">
                        Choose which CVs to include from your profile
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
                        <p className="text-slate-500 font-medium mb-2">No CV Found</p>
                        <p className="text-slate-400 text-sm mb-4">Upload your CV to your profile to start applying for jobs</p>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/dashboard/candidate/profile', '_blank')}
                          className="border-slate-300 text-slate-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Upload CV to Profile
                        </Button>
                      </div>
                    )}
                  </div>
                  {formData.selectedCVs.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Note:</span> You've selected {formData.selectedCVs.length} CV(s) from your profile.
                        These will be included in your application.
                      </p>
                    </div>
                  )}
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
                    <div className={`w-10 h-10 ${colorClasses.bg.goldenMustard} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <BookOpen className="h-5 w-5 text-goldenMustard" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Cover Letter</CardTitle>
                      <CardDescription className="text-slate-600">
                        Tell us why you're the perfect fit for this position
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
                    <div className={`w-10 h-10 ${colorClasses.bg.goldenMustard} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <Award className="h-5 w-5 text-goldenMustard" />
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
                        className={`${colorClasses.bg.goldenMustard} hover:opacity-90 text-white`}
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
                            <X className="h-3 w-3" />
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
                    <div className={`w-10 h-10 ${colorClasses.bg.goldenMustard} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <Briefcase className="h-5 w-5 text-goldenMustard" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Work Experience</CardTitle>
                      <CardDescription className="text-slate-600">
                        Add your relevant work experience (form or document)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {formData.workExperience.map((experience, index) => (
                      <div key={experience._tempId || index} className="p-6 border border-slate-200 rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-slate-900">Work Experience #{index + 1}</h4>
                            <Badge variant={experience.providedAsDocument ? "default" : "secondary"}>
                              {experience.providedAsDocument ? 'Document' : 'Form'}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveExperience(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {experience.providedAsDocument ? (
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-3 block">
                              Upload Experience Document
                            </Label>
                            {experienceFiles.has(experience._tempId!) ? (
                              <div className="mb-4">
                                <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {truncateFilename(experienceFiles.get(experience._tempId!)!.name)}
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        {getFileSize(experienceFiles.get(experience._tempId!)!.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const file = experienceFiles.get(experience._tempId!);
                                        if (file) {
                                          const url = URL.createObjectURL(file);
                                          window.open(url, '_blank');
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeExperienceFile(experience._tempId!)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                                <Input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && experience._tempId) {
                                      handleExperienceFileUpload(experience._tempId, file);
                                    }
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                  id={`experience-file-${index}`}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                />
                                <Label htmlFor={`experience-file-${index}`} className="cursor-pointer">
                                  <div className="flex flex-col items-center">
                                    <Upload className="h-8 w-8 text-slate-400 mb-3" />
                                    <p className="text-slate-700 font-medium mb-1">Upload Experience Document</p>
                                    <p className="text-slate-500 text-sm mb-2">Supporting document for this work experience</p>
                                    <p className="text-slate-400 text-xs">PDF, DOC, DOCX, Images • Max 15MB</p>
                                    <Button
                                      variant="outline"
                                      className="mt-3 border-slate-300 text-slate-700"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Select File
                                    </Button>
                                  </div>
                                </Label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                                  Company
                                </Label>
                                <Input
                                  value={experience.company || ''}
                                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                                  placeholder="Company name"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                                  Position
                                </Label>
                                <Input
                                  value={experience.position || ''}
                                  onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                                  placeholder="Your position"
                                />
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-slate-700 mb-2 block">
                                  Start Date
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
                                    className="h-4 w-4 text-blue-600 rounded"
                                  />
                                  <Label className="ml-2 text-sm text-slate-700">I currently work here</Label>
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 block">Description</Label>
                              <Textarea
                                value={experience.description || ''}
                                onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                                rows={3}
                                placeholder="Describe your responsibilities and achievements..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleAddExperience('form')}
                        variant="outline"
                        className="border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 py-6"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Form-Based Experience
                      </Button>
                      <Button
                        onClick={() => handleAddExperience('document')}
                        variant="outline"
                        className="border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 py-6"
                      >
                        <File className="h-5 w-5 mr-2" />
                        Add Document-Based Experience
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* References */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${colorClasses.bg.goldenMustard} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <Users className="h-5 w-5 text-goldenMustard" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Professional References</CardTitle>
                      <CardDescription className="text-slate-600">
                        Add people who can vouch for your work (form or document)
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {formData.references.map((reference, index) => (
                      <div key={reference._tempId || index} className="p-6 border border-slate-200 rounded-xl bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-semibold text-slate-900">Reference #{index + 1}</h4>
                            <Badge variant={reference.providedAsDocument ? "default" : "secondary"}>
                              {reference.providedAsDocument ? 'Document' : 'Form'}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveReference(index)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {reference.providedAsDocument ? (
                          <div>
                            <Label className="text-sm font-medium text-slate-700 mb-3 block">
                              Upload Reference Document
                            </Label>
                            {referenceFiles.has(reference._tempId!) ? (
                              <div className="mb-4">
                                <div className="flex items-center justify-between p-3 border border-emerald-200 bg-emerald-50 rounded-lg">
                                  <div className="flex items-center space-x-3">
                                    <FileText className="h-5 w-5 text-emerald-600" />
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {truncateFilename(referenceFiles.get(reference._tempId!)!.name)}
                                      </p>
                                      <p className="text-sm text-slate-500">
                                        {getFileSize(referenceFiles.get(reference._tempId!)!.size)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const file = referenceFiles.get(reference._tempId!);
                                        if (file) {
                                          const url = URL.createObjectURL(file);
                                          window.open(url, '_blank');
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeReferenceFile(reference._tempId!)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                                <Input
                                  type="file"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && reference._tempId) {
                                      handleReferenceFileUpload(reference._tempId, file);
                                    }
                                    e.target.value = '';
                                  }}
                                  className="hidden"
                                  id={`reference-file-${index}`}
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                                />
                                <Label htmlFor={`reference-file-${index}`} className="cursor-pointer">
                                  <div className="flex flex-col items-center">
                                    <Upload className="h-8 w-8 text-slate-400 mb-3" />
                                    <p className="text-slate-700 font-medium mb-1">Upload Reference Document</p>
                                    <p className="text-slate-500 text-sm mb-2">Reference letter or recommendation letter</p>
                                    <p className="text-slate-400 text-xs">PDF, DOC, DOCX, Images • Max 15MB</p>
                                    <Button
                                      variant="outline"
                                      className="mt-3 border-slate-300 text-slate-700"
                                    >
                                      <Upload className="h-4 w-4 mr-2" />
                                      Select File
                                    </Button>
                                  </div>
                                </Label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 block">Full Name</Label>
                              <Input
                                value={reference.name || ''}
                                onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                                placeholder="Reference full name"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 block">Position</Label>
                              <Input
                                value={reference.position || ''}
                                onChange={(e) => handleReferenceChange(index, 'position', e.target.value)}
                                placeholder="Their position"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 block">Company</Label>
                              <Input
                                value={reference.company || ''}
                                onChange={(e) => handleReferenceChange(index, 'company', e.target.value)}
                                placeholder="Company name"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium text-slate-700 mb-2 block">Relationship</Label>
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
                            <div className="md:col-span-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={reference.allowsContact || false}
                                  onChange={(e) => handleReferenceChange(index, 'allowsContact', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 rounded"
                                />
                                <Label className="text-sm text-slate-700 font-medium">This reference allows contact</Label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        onClick={() => handleAddReference('form')}
                        variant="outline"
                        className="border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 py-6"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Form-Based Reference
                      </Button>
                      <Button
                        onClick={() => handleAddReference('document')}
                        variant="outline"
                        className="border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 py-6"
                      >
                        <File className="h-5 w-5 mr-2" />
                        Add Document-Based Reference
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Review Application */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Application Summary */}
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${colorClasses.bg.goldenMustard} bg-opacity-20 rounded-lg flex items-center justify-center`}>
                      <ClipboardCheck className="h-5 w-5 text-goldenMustard" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-900">Application Summary</CardTitle>
                      <CardDescription className="text-slate-600">
                        Review your application before submitting
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-8">
                    {/* Contact Information Review */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Contact Information</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep(1)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-500">Email</p>
                          <p className="font-medium">{formData.contactInfo.email}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-500">Phone</p>
                          <p className="font-medium">{formData.contactInfo.phone}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-500">Location</p>
                          <p className="font-medium">{formData.contactInfo.location}</p>
                        </div>
                      </div>
                    </div>

                    {/* CVs Review */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Selected CVs</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep(1)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {formData.selectedCVs.map((cv, index) => (
                            <Badge key={index} variant="secondary" className="px-3 py-1">
                              {cv.originalName}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-slate-500 mt-2">
                          {formData.selectedCVs.length} CV(s) selected from your profile
                        </p>
                      </div>
                    </div>

                    {/* Uploaded Files Review */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Uploaded Documents</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep(3)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-500">Reference Documents</p>
                          <p className="font-medium text-xl mb-2">{referenceFiles.size}</p>
                          {referenceFiles.size > 0 && (
                            <div className="space-y-1">
                              {Array.from(referenceFiles.values()).slice(0, 2).map((file, index) => (
                                <p key={index} className="text-xs text-slate-600 truncate">
                                  • {truncateFilename(file.name, 30)}
                                </p>
                              ))}
                              {referenceFiles.size > 2 && (
                                <p className="text-xs text-slate-500">
                                  +{referenceFiles.size - 2} more
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-lg">
                          <p className="text-sm text-slate-500">Experience Documents</p>
                          <p className="font-medium text-xl mb-2">{experienceFiles.size}</p>
                          {experienceFiles.size > 0 && (
                            <div className="space-y-1">
                              {Array.from(experienceFiles.values()).slice(0, 2).map((file, index) => (
                                <p key={index} className="text-xs text-slate-600 truncate">
                                  • {truncateFilename(file.name, 30)}
                                </p>
                              ))}
                              {experienceFiles.size > 2 && (
                                <p className="text-xs text-slate-500">
                                  +{experienceFiles.size - 2} more
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cover Letter Review */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Cover Letter</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep(2)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="bg-slate-50 p-6 rounded-lg">
                        <div className="text-slate-700 whitespace-pre-line max-h-60 overflow-y-auto">
                          {truncateText(formData.coverLetter, 1000)}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Total length: {formData.coverLetter.length} characters
                        </p>
                      </div>
                    </div>

                    {/* Skills Review */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Skills</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep(2)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
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
                          </Badge>
                        ))}
                        {formData.skills.length === 0 && (
                          <p className="text-slate-500 italic">No skills added</p>
                        )}
                      </div>
                    </div>

                    {/* Work Experience Review */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Work Experience</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep(3)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {formData.workExperience.map((exp, index) => (
                          <div key={index} className="p-4 border border-slate-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-slate-900">
                                  {exp.providedAsDocument ? 'Document' : `${exp.position || 'Position'} at ${exp.company || 'Company'}`}
                                </p>
                                {!exp.providedAsDocument && exp.startDate && (
                                  <p className="text-sm text-slate-600">
                                    {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'Not specified'}
                                  </p>
                                )}
                                {exp.providedAsDocument && experienceFiles.has(exp._tempId!) && (
                                  <p className="text-sm text-slate-600">
                                    File: {truncateFilename(experienceFiles.get(exp._tempId!)!.name)}
                                  </p>
                                )}
                              </div>
                              <Badge variant={exp.providedAsDocument ? "default" : "secondary"}>
                                {exp.providedAsDocument ? 'Document' : 'Form'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {formData.workExperience.length === 0 && (
                          <p className="text-slate-500 italic">No work experience added</p>
                        )}
                      </div>
                    </div>

                    {/* References Review */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">Professional References</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => goToStep(3)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {formData.references.map((ref, index) => (
                          <div key={index} className="p-4 border border-slate-200 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <p className="font-medium text-slate-900">
                                {ref.providedAsDocument ? 'Reference Document' : ref.name || 'Unnamed Reference'}
                              </p>
                              <Badge variant={ref.providedAsDocument ? "default" : "secondary"}>
                                {ref.providedAsDocument ? 'Document' : 'Form'}
                              </Badge>
                            </div>
                            {!ref.providedAsDocument && ref.position && ref.company && (
                              <p className="text-sm text-slate-600">{ref.position} at {ref.company}</p>
                            )}
                            {ref.providedAsDocument && referenceFiles.has(ref._tempId!) && (
                              <p className="text-sm text-slate-600">
                                File: {truncateFilename(referenceFiles.get(ref._tempId!)!.name)}
                              </p>
                            )}
                          </div>
                        ))}
                        {formData.references.length === 0 && (
                          <p className="text-slate-500 italic col-span-2">No references added</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Final Submission */}
              <Card className="border-slate-200 shadow-sm bg-linear-to-br from-amber-50 to-orange-50">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center space-x-3 text-slate-900">
                    <Send className="h-6 w-6 text-amber-600" />
                    <span>Ready to Submit</span>
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Review all information before final submission
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-blue-600">{formData.selectedCVs.length}</div>
                      <div className="text-sm text-slate-600">Profile CVs</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-violet-600">{referenceFiles.size}</div>
                      <div className="text-sm text-slate-600">Reference Files</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-emerald-600">{experienceFiles.size}</div>
                      <div className="text-sm text-slate-600">Experience Files</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <div className="text-2xl font-bold text-amber-600">{formData.skills.length}</div>
                      <div className="text-sm text-slate-600">Skills</div>
                    </div>
                  </div>

                  {/* Validation Summary */}
                  <div className="bg-white rounded-lg border border-slate-200 p-4">
                    <h4 className="font-medium text-slate-900 mb-3">Application Checklist:</h4>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                          formData.contactInfo.email && formData.contactInfo.phone && formData.contactInfo.location 
                          ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {formData.contactInfo.email && formData.contactInfo.phone && formData.contactInfo.location ? '✓' : '✗'}
                        </div>
                        <span className="text-sm">Contact information complete</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                          formData.selectedCVs.length > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {formData.selectedCVs.length > 0 ? '✓' : '✗'}
                        </div>
                        <span className="text-sm">CVs selected from profile</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                          formData.coverLetter.trim().length > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {formData.coverLetter.trim().length > 0 ? '✓' : '✗'}
                        </div>
                        <span className="text-sm">Cover letter provided</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center mr-3 ${
                          formData.references.every(ref => 
                            !ref.providedAsDocument || 
                            (ref.providedAsDocument && referenceFiles.has(ref._tempId!))
                          ) && formData.workExperience.every(exp => 
                            !exp.providedAsDocument || 
                            (exp.providedAsDocument && experienceFiles.has(exp._tempId!))
                          ) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {formData.references.every(ref => 
                            !ref.providedAsDocument || 
                            (ref.providedAsDocument && referenceFiles.has(ref._tempId!))
                          ) && formData.workExperience.every(exp => 
                            !exp.providedAsDocument || 
                            (exp.providedAsDocument && experienceFiles.has(exp._tempId!))
                          ) ? '✓' : '✗'}
                        </div>
                        <span className="text-sm">All document-based entries have files</span>
                      </div>
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
              className={`${colorClasses.bg.goldenMustard} hover:opacity-90 text-white`}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${colorClasses.bg.goldenMustard} hover:opacity-90 text-white disabled:opacity-50 disabled:cursor-not-allowed`}
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