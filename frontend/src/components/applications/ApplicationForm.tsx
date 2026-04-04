/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ApplicationForm.tsx - PERFECTLY SYMMETRICAL BUTTONS & ICONS
import React, { useState, useEffect } from 'react';
import {
  applicationService,
  type ApplyForJobData,
  type Reference,
  type WorkExperience,
  type ContactInfo,
  type CV,
  type UserInfo,
  type FileWithTempId
} from '@/services/applicationService';
import { candidateService, type CandidateProfile } from '@/services/candidateService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/Label';
import { useToast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { 
  User, BookOpen, Briefcase, ClipboardCheck, ChevronUp, ChevronDown, Check, 
  FileText, ArrowLeft, Eye, Download, Plus, AlertCircle, 
  Award, X, Trash2, Upload, Users, Edit, ChevronLeft, ChevronRight, Loader2, 
  Send, File
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

// Helper to convert Map to FileWithTempId array
const convertMapToFileWithTempIdArray = (map: Map<string, File>): Array<{file: File, tempId: string}> => {
  return Array.from(map.entries()).map(([tempId, file]) => ({
    file,
    tempId
  }));
};

// Helper to get file size display
const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

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
const generateTempId = (prefix: 'ref' | 'exp') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper function to truncate filename
const truncateFilename = (filename: string, maxLength: number = 20): string => {
  if (filename.length <= maxLength) return filename;
  const extension = filename.split('.').pop();
  const name = filename.substring(0, filename.lastIndexOf('.'));
  const truncatedName = name.substring(0, maxLength - (extension?.length || 0) - 4) + '...';
  return `${truncatedName}.${extension}`;
};

// Step progress indicator for mobile
const MobileStepProgress = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="w-full px-4 py-3">
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-300",
            index + 1 <= currentStep
              ? colorClasses.bg.blue
              : colorClasses.bg.gray100
          )}
        />
      ))}
    </div>
    <p className={cn("text-xs text-center mt-2 font-medium", colorClasses.text.muted)}>
      Step {currentStep} of {totalSteps}: {
        ['Profile', 'Application', 'Documents', 'Review'][currentStep - 1]
      }
    </p>
  </div>
);

// Desktop step indicator
const DesktopStepIndicator = ({ currentStep, steps, goToStep }: any) => (
  <div className="flex items-center justify-between relative mt-6">
    {steps.map((step: any, index: number) => {
      const StepIcon = step.icon;
      const isCurrent = currentStep === step.number;
      const isCompleted = currentStep > step.number;

      return (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center relative z-10">
            <button
              onClick={() => goToStep(step.number)}
              className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                isCurrent ? colorClasses.bg.blue + ' text-white shadow-md' :
                isCompleted ? colorClasses.bg.emeraldLight : colorClasses.bg.secondary
              )}
            >
              {isCompleted ? (
                <Check className="h-5 w-5 md:h-6 md:w-6" />
              ) : (
                <StepIcon className={cn(
                  "h-5 w-5 md:h-6 md:w-6",
                  isCurrent ? 'text-white' : colorClasses.text.muted
                )} />
              )}
            </button>
            <p className={cn(
              "mt-2 text-xs md:text-sm font-medium",
              isCurrent ? colorClasses.text.blue :
              isCompleted ? colorClasses.text.emerald :
              colorClasses.text.muted
            )}>
              {step.title}
            </p>
          </div>

          {index < steps.length - 1 && (
            <div className={cn(
              "flex-1 h-0.5 mx-2 md:mx-4",
              isCompleted ? colorClasses.bg.emerald : colorClasses.border.gray100
            )} />
          )}
        </div>
      );
    })}
  </div>
);

export const ApplicationForm: React.FC<ApplicationFormProps> = ({
  jobId,
  jobTitle,
  companyName,
  onSuccess,
  onCancel,
  onError
}) => {
  const { toast } = useToast();
  const { breakpoint } = useResponsive();
  const isMobile = breakpoint === 'mobile';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [cvs, setCvs] = useState<CV[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true,
    cvs: true,
    coverLetter: true,
    skills: true,
    experience: false,
    references: false
  });

  // File states with tempId matching
  const [referenceFiles, setReferenceFiles] = useState<Map<string, File>>(new Map());
  const [experienceFiles, setExperienceFiles] = useState<Map<string, File>>(new Map());

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
      description: 'Contact Info & CVs'
    },
    {
      number: 2,
      title: 'Application',
      icon: BookOpen,
      description: 'Cover Letter & Skills'
    },
    {
      number: 3,
      title: 'Documents',
      icon: Briefcase,
      description: 'Experience & References'
    },
    {
      number: 4,
      title: 'Review',
      icon: ClipboardCheck,
      description: 'Review & Submit'
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
          // Auto-select the first CV
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
          variant: 'default'
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
    const tempId = mode === 'document' ? generateTempId('ref') : undefined;

    const newReference: Reference = {
      _tempId: tempId,
      name: mode === 'form' ? '' : undefined,
      position: mode === 'form' ? '' : undefined,
      company: mode === 'form' ? '' : undefined,
      email: mode === 'form' ? '' : undefined,
      phone: mode === 'form' ? '' : undefined,
      relationship: mode === 'form' ? '' : undefined,
      allowsContact: true,
      providedAsDocument: mode === 'document'
    };

    setFormData(prev => ({
      ...prev,
      references: [...prev.references, newReference]
    }));
  };

  const handleReferenceChange = (index: number, field: keyof Reference, value: any) => {
    setFormData(prev => {
      const updatedReferences = [...prev.references];
      updatedReferences[index] = {
        ...updatedReferences[index],
        [field]: value
      };
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

  const toggleReferenceType = (index: number, isDocument: boolean) => {
    setFormData(prev => {
      const updatedReferences = [...prev.references];
      const currentRef = updatedReferences[index];

      if (isDocument && !currentRef._tempId) {
        // Switching to document mode - generate tempId
        updatedReferences[index] = {
          ...currentRef,
          providedAsDocument: true,
          _tempId: generateTempId('ref')
        };
      } else if (!isDocument) {
        // Switching to form mode - remove tempId and clear form fields if they don't exist
        updatedReferences[index] = {
          _tempId: undefined,
          name: currentRef.name || '',
          position: currentRef.position || '',
          company: currentRef.company || '',
          email: currentRef.email || '',
          phone: currentRef.phone || '',
          relationship: currentRef.relationship || '',
          allowsContact: currentRef.allowsContact ?? true,
          providedAsDocument: false
        };

        // Remove associated file if exists
        if (currentRef._tempId) {
          setReferenceFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(currentRef._tempId!);
            return newMap;
          });
        }
      }

      return { ...prev, references: updatedReferences };
    });
  };

  // Experience handling with tempId
  const handleAddExperience = (mode: 'form' | 'document' = 'form') => {
    const tempId = mode === 'document' ? generateTempId('exp') : undefined;

    const newExperience: WorkExperience = {
      _tempId: tempId,
      company: mode === 'form' ? '' : undefined,
      position: mode === 'form' ? '' : undefined,
      startDate: '',
      endDate: '',
      current: false,
      description: mode === 'form' ? '' : undefined,
      providedAsDocument: mode === 'document'
    };

    setFormData(prev => ({
      ...prev,
      workExperience: [...prev.workExperience, newExperience]
    }));
  };

  const handleExperienceChange = (index: number, field: keyof WorkExperience, value: any) => {
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

  const toggleExperienceType = (index: number, isDocument: boolean) => {
    setFormData(prev => {
      const updatedExperience = [...prev.workExperience];
      const currentExp = updatedExperience[index];

      if (isDocument && !currentExp._tempId) {
        // Switching to document mode - generate tempId
        updatedExperience[index] = {
          ...currentExp,
          providedAsDocument: true,
          _tempId: generateTempId('exp')
        };
      } else if (!isDocument) {
        // Switching to form mode - remove tempId and clear form fields if they don't exist
        updatedExperience[index] = {
          _tempId: undefined,
          company: currentExp.company || '',
          position: currentExp.position || '',
          startDate: currentExp.startDate || '',
          endDate: currentExp.endDate || '',
          current: currentExp.current || false,
          description: currentExp.description || '',
          providedAsDocument: false
        };

        // Remove associated file if exists
        if (currentExp._tempId) {
          setExperienceFiles(prev => {
            const newMap = new Map(prev);
            newMap.delete(currentExp._tempId!);
            return newMap;
          });
        }
      }

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

      // Validate references
      formData.references.forEach((ref, index) => {
        if (ref.providedAsDocument) {
          if (!ref._tempId) {
            errors.push(`Reference ${index + 1} is marked as document but has no tempId`);
          } else if (!referenceFiles.has(ref._tempId)) {
            errors.push(`Reference ${index + 1} is marked as document but no file is uploaded`);
          }
        } else {
          // Form-based validation
          if (!ref.name?.trim()) {
            errors.push(`Reference ${index + 1} name is required`);
          }
          if (!ref.email?.trim()) {
            errors.push(`Reference ${index + 1} email is required`);
          }
        }
      });

      // Validate work experience
      formData.workExperience.forEach((exp, index) => {
        if (exp.providedAsDocument) {
          if (!exp._tempId) {
            errors.push(`Work experience ${index + 1} is marked as document but has no tempId`);
          } else if (!experienceFiles.has(exp._tempId)) {
            errors.push(`Work experience ${index + 1} is marked as document but no file is uploaded`);
          }
        } else {
          // Form-based validation
          if (!exp.company?.trim()) {
            errors.push(`Work experience ${index + 1} company is required`);
          }
          if (!exp.position?.trim()) {
            errors.push(`Work experience ${index + 1} position is required`);
          }
          if (!exp.startDate) {
            errors.push(`Work experience ${index + 1} start date is required`);
          }
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
          name: ref.name,
          position: ref.position,
          company: ref.company,
          email: ref.email,
          phone: ref.phone,
          relationship: ref.relationship,
          allowsContact: ref.allowsContact ?? true,
          providedAsDocument: ref.providedAsDocument,
          _tempId: ref._tempId
        })),
        workExperience: formData.workExperience.map(exp => ({
          company: exp.company,
          position: exp.position,
          startDate: exp.startDate,
          endDate: exp.endDate,
          current: exp.current,
          description: exp.description,
          providedAsDocument: exp.providedAsDocument,
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
        referencesWithDocuments: formData.references.filter(ref => ref.providedAsDocument).length,
        experienceCount: formData.workExperience.length,
        experienceWithDocuments: formData.workExperience.filter(exp => exp.providedAsDocument).length
      });

      // Submit application with files
      const response = await applicationService.applyForJob(
        jobId,
        applicationData,
        {
          referenceFiles: convertMapToFileWithTempIdArray(referenceFiles),
          experienceFiles: convertMapToFileWithTempIdArray(experienceFiles)
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (isLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center p-4",
        colorClasses.bg.primary
      )}>
        <div className={cn(
          "text-center max-w-sm w-full p-8 rounded-xl border shadow-lg overflow-hidden",
          colorClasses.bg.primary,
          colorClasses.border.gray100
        )}>
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className={cn(
                "w-16 h-16 rounded-full border-4 border-t-transparent animate-spin",
                colorClasses.border.blue
              )}></div>
            </div>
          </div>
          <h3 className={cn("text-xl font-semibold mb-3", colorClasses.text.primary)}>
            Preparing Your Application
          </h3>
          <p className={cn("text-base", colorClasses.text.muted)}>
            Getting everything ready for you...
          </p>
        </div>
      </div>
    );
  }

  const isLastStep = currentStep === steps.length;

  return (
    <div className={cn(
      "w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6",
      colorClasses.bg.primary
    )}>
      {/* Header with Progress Steps */}
      <Card className={cn(
        "border shadow-lg rounded-xl overflow-hidden mb-4 sm:mb-6",
        colorClasses.bg.primary,
        colorClasses.border.gray100
      )}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                colorClasses.bg.blue
              )}>
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={cn("text-lg sm:text-xl font-bold truncate", colorClasses.text.primary)}>
                  Apply for Position
                </h1>
                <p className={cn("text-sm sm:text-base truncate", colorClasses.text.muted)}>
                  {jobTitle} at {companyName}
                </p>
              </div>
            </div>
            
            {/* Desktop Cancel Button */}
            {!isMobile && (
              <Button
                variant="outline"
                onClick={onCancel}
                className={cn(
                  "border shrink-0 h-11 px-5 rounded-lg",
                  colorClasses.border.gray100,
                  colorClasses.text.primary,
                  'hover:bg-gray-50 dark:hover:bg-gray-800',
                  "flex items-center gap-2"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            )}
          </div>

          {/* Progress Steps */}
          {isMobile ? (
            <MobileStepProgress currentStep={currentStep} totalSteps={steps.length} />
          ) : (
            <DesktopStepIndicator currentStep={currentStep} steps={steps} goToStep={goToStep} />
          )}
        </CardContent>
      </Card>

      {/* Form Content */}
      <div className="space-y-4 sm:space-y-6">
        {/* Step 1: Profile & CV Selection */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Contact Information */}
            <Card className={cn(
              "border shadow-md rounded-xl overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <CardHeader 
                className={cn(
                  "p-4 sm:p-5 border-b cursor-pointer",
                  colorClasses.border.gray100
                )} 
                onClick={() => toggleSection('contact')}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      colorClasses.bg.blueLight
                    )}>
                      <User className={cn("h-5 w-5", colorClasses.text.blue)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn("text-base sm:text-lg font-medium truncate", colorClasses.text.primary)}>
                        Contact Information
                      </CardTitle>
                      {!expandedSections.contact && (
                        <CardDescription className="text-sm truncate">
                          {formData.contactInfo.email || 'Not provided'}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {isMobile && (
                    expandedSections.contact ? 
                      <ChevronUp className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} /> :
                      <ChevronDown className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} />
                  )}
                </div>
              </CardHeader>
              {(!isMobile || expandedSections.contact) && (
                <CardContent className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {/* Email */}
                    <div className="space-y-2">
                      <Label className={cn("text-sm font-medium", colorClasses.text.secondary)}>
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="email"
                          value={formData.contactInfo.email}
                          onChange={(e) => handleContactInfoChange('email', e.target.value)}
                          className={cn(
                            "w-full pl-10 h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                            colorClasses.border.gray100,
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            colorClasses.bg.primary,
                            colorClasses.text.primary
                          )}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label className={cn("text-sm font-medium", colorClasses.text.secondary)}>
                        Phone <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="tel"
                          value={formData.contactInfo.phone}
                          onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                          className={cn(
                            "w-full pl-10 h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                            colorClasses.border.gray100,
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            colorClasses.bg.primary,
                            colorClasses.text.primary
                          )}
                          placeholder="+1 (555) 000-0000"
                          required
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                      <Label className={cn("text-sm font-medium", colorClasses.text.secondary)}>
                        Location <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          value={formData.contactInfo.location}
                          onChange={(e) => handleContactInfoChange('location', e.target.value)}
                          className={cn(
                            "w-full pl-10 h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                            colorClasses.border.gray100,
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            colorClasses.bg.primary,
                            colorClasses.text.primary
                          )}
                          placeholder="City, Country"
                          required
                        />
                      </div>
                    </div>

                    {/* Telegram (Optional) */}
                    <div className="space-y-2">
                      <Label className={cn("text-sm font-medium", colorClasses.text.secondary)}>
                        Telegram (Optional)
                      </Label>
                      <div className="relative">
                        <Input
                          value={formData.contactInfo.telegram}
                          onChange={(e) => handleContactInfoChange('telegram', e.target.value)}
                          className={cn(
                            "w-full pl-10 h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                            colorClasses.border.gray100,
                            'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                            colorClasses.bg.primary,
                            colorClasses.text.primary
                          )}
                          placeholder="@username"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* CV Selection */}
            <Card className={cn(
              "border shadow-md rounded-xl overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <CardHeader 
                className={cn(
                  "p-4 sm:p-5 border-b cursor-pointer",
                  colorClasses.border.gray100
                )} 
                onClick={() => toggleSection('cvs')}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      colorClasses.bg.purpleLight
                    )}>
                      <FileText className={cn("h-5 w-5", colorClasses.text.purple)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn("text-base sm:text-lg font-medium truncate", colorClasses.text.primary)}>
                        Select Your CVs <span className="text-red-500">*</span>
                      </CardTitle>
                      {!expandedSections.cvs && (
                        <CardDescription className="text-sm truncate">
                          {formData.selectedCVs.length} CV(s) selected
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {isMobile && (
                    expandedSections.cvs ? 
                      <ChevronUp className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} /> :
                      <ChevronDown className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} />
                  )}
                </div>
              </CardHeader>
              {(!isMobile || expandedSections.cvs) && (
                <CardContent className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {cvs.length > 0 ? cvs.map((cv) => (
                      <div
                        key={cv._id}
                        className={cn(
                          "flex flex-col p-4 rounded-xl border transition-all gap-4 overflow-hidden",
                          formData.selectedCVs.some(selected => selected.cvId === cv._id)
                            ? colorClasses.border.blue + ' ' + colorClasses.bg.blueLight
                            : colorClasses.border.gray100 + ' hover:' + colorClasses.border.gray200
                        )}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={formData.selectedCVs.some(selected => selected.cvId === cv._id)}
                            onChange={(e) => handleCVSelection(cv._id, e.target.checked)}
                            className="h-5 w-5 mt-0.5 text-blue-500 rounded focus:ring-blue-500 shrink-0"
                          />
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                            colorClasses.bg.secondary
                          )}>
                            <FileText className={cn("h-5 w-5", colorClasses.text.muted)} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn("font-medium text-sm truncate", colorClasses.text.primary)}>
                              {cv.originalName}
                            </p>
                            <p className={cn("text-xs", colorClasses.text.muted)}>
                              {getFileSize((cv as any).size ?? (cv as any).fileSize ?? 0)}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action buttons - Perfectly symmetrical */}
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
onClick={() => candidateService.viewCV(cv._id)}
                            className={cn(
                              "p-0 h-10 w-10 rounded-lg flex items-center justify-center",
                              colorClasses.text.blue,
                              'hover:' + colorClasses.bg.blueLight
                            )}
                            title="View CV"
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
onClick={() => candidateService.downloadCV(cv._id, cv.originalName)}
                            className={cn(
                              "p-0 h-10 w-10 rounded-lg flex items-center justify-center",
                              colorClasses.text.emerald,
                              'hover:' + colorClasses.bg.emeraldLight
                            )}
                            title="Download CV"
                          >
                            <Download className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="sm:col-span-2">
                        <div className={cn(
                          "text-center py-10 rounded-xl",
                          colorClasses.bg.secondary
                        )}>
                          <FileText className={cn("h-16 w-16 mx-auto mb-4", colorClasses.text.muted)} />
                          <p className={cn("font-medium text-lg mb-2", colorClasses.text.primary)}>No CV Found</p>
                          <p className={cn("text-base mb-4", colorClasses.text.muted)}>
                            Upload your CV to your profile first
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => window.open('/dashboard/candidate/profile', '_blank')}
                            className={cn(
                              "border h-12 px-6 rounded-lg",
                              colorClasses.border.gray100,
                              colorClasses.text.primary,
                              'hover:bg-gray-50 dark:hover:bg-gray-800',
                              "flex items-center gap-2"
                            )}
                          >
                            <Plus className="h-4 w-4" />
                            <span>Upload CV</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {formData.selectedCVs.length > 0 && (
                    <div className={cn(
                      "mt-4 p-3 rounded-lg border text-sm",
                      colorClasses.bg.blueLight,
                      colorClasses.border.blue,
                      colorClasses.text.blue
                    )}>
                      <span className="font-semibold">Selected:</span> {formData.selectedCVs.length} CV(s)
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Step 2: Cover Letter & Skills */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Cover Letter */}
            <Card className={cn(
              "border shadow-md rounded-xl overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <CardHeader 
                className={cn(
                  "p-4 sm:p-5 border-b cursor-pointer",
                  colorClasses.border.gray100
                )} 
                onClick={() => toggleSection('coverLetter')}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      colorClasses.bg.amberLight
                    )}>
                      <BookOpen className={cn("h-5 w-5", colorClasses.text.amber)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn("text-base sm:text-lg font-medium truncate", colorClasses.text.primary)}>
                        Cover Letter <span className="text-red-500">*</span>
                      </CardTitle>
                      {!expandedSections.coverLetter && (
                        <CardDescription className="text-sm truncate">
                          {formData.coverLetter.length} characters
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {isMobile && (
                    expandedSections.coverLetter ? 
                      <ChevronUp className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} /> :
                      <ChevronDown className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} />
                  )}
                </div>
              </CardHeader>
              {(!isMobile || expandedSections.coverLetter) && (
                <CardContent className="p-4 sm:p-5">
                  <div>
                    <Textarea
                      value={formData.coverLetter}
                      onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                      rows={isMobile ? 8 : 10}
                      className={cn(
                        "w-full resize-none text-sm sm:text-base rounded-lg p-3 sm:p-4",
                        colorClasses.border.gray100,
                        'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                        colorClasses.bg.primary,
                        colorClasses.text.primary
                      )}
                      placeholder="Write your cover letter here..."
                    />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 gap-2">
                      <p className={cn("text-sm", colorClasses.text.muted)}>
                        {formData.coverLetter.length} characters
                      </p>
                      {formData.coverLetter.length < 100 && (
                        <p className={cn("text-sm flex items-center", colorClasses.text.amber)}>
                          <AlertCircle className="h-4 w-4 mr-1.5" />
                          Minimum 100 characters recommended
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Skills */}
            <Card className={cn(
              "border shadow-md rounded-xl overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <CardHeader 
                className={cn(
                  "p-4 sm:p-5 border-b cursor-pointer",
                  colorClasses.border.gray100
                )} 
                onClick={() => toggleSection('skills')}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      colorClasses.bg.emeraldLight
                    )}>
                      <Award className={cn("h-5 w-5", colorClasses.text.emerald)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn("text-base sm:text-lg font-medium truncate", colorClasses.text.primary)}>
                        Skills
                      </CardTitle>
                      {!expandedSections.skills && (
                        <CardDescription className="text-sm truncate">
                          {formData.skills.length} skill(s) added
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {isMobile && (
                    expandedSections.skills ? 
                      <ChevronUp className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} /> :
                      <ChevronDown className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} />
                  )}
                </div>
              </CardHeader>
              {(!isMobile || expandedSections.skills) && (
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add a new skill..."
                        className={cn(
                          "flex-1 h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                          colorClasses.border.gray100,
                          'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                          colorClasses.bg.primary,
                          colorClasses.text.primary
                        )}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button
                        onClick={handleAddSkill}
                        className={cn(
                          "w-full sm:w-auto h-11 sm:h-12 px-6 rounded-lg",
                          colorClasses.bg.blue,
                          'hover:opacity-90 text-white',
                          "flex items-center gap-2"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Skill</span>
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className={cn(
                            "px-4 py-2 text-sm sm:text-base rounded-full",
                            colorClasses.bg.emeraldLight,
                            colorClasses.text.emerald,
                            "border-0 flex items-center gap-1"
                          )}
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-1 hover:text-emerald-700 focus:outline-none"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>

                    {formData.skills.length === 0 && (
                      <div className={cn(
                        "text-center py-8 rounded-lg text-base",
                        colorClasses.bg.secondary,
                        colorClasses.text.muted
                      )}>
                        No skills added yet
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Step 3: Experience & References */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Work Experience */}
            <Card className={cn(
              "border shadow-md rounded-xl overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <CardHeader 
                className={cn(
                  "p-4 sm:p-5 border-b cursor-pointer",
                  colorClasses.border.gray100
                )} 
                onClick={() => toggleSection('experience')}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      colorClasses.bg.purpleLight
                    )}>
                      <Briefcase className={cn("h-5 w-5", colorClasses.text.purple)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn("text-base sm:text-lg font-medium truncate", colorClasses.text.primary)}>
                        Work Experience
                      </CardTitle>
                      {!expandedSections.experience && (
                        <CardDescription className="text-sm truncate">
                          {formData.workExperience.length} experience(s) added
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {isMobile && (
                    expandedSections.experience ? 
                      <ChevronUp className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} /> :
                      <ChevronDown className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} />
                  )}
                </div>
              </CardHeader>
              {(!isMobile || expandedSections.experience) && (
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-4 sm:space-y-5">
                    {formData.workExperience.map((experience, index) => (
                      <div key={experience._tempId || index} className={cn(
                        "p-4 sm:p-5 border rounded-xl overflow-hidden",
                        colorClasses.border.gray100,
                        colorClasses.bg.primary
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn("font-semibold text-base", colorClasses.text.primary)}>
                              Experience #{index + 1}
                            </h4>
                            <Badge className={cn(
                              "text-xs px-3 py-1 border-0 rounded-full",
                              experience.providedAsDocument ? 
                                colorClasses.bg.purpleLight + ' ' + colorClasses.text.purple :
                                colorClasses.bg.blueLight + ' ' + colorClasses.text.blue
                            )}>
                              {experience.providedAsDocument ? 'Document' : 'Form'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                              <button
                                onClick={() => toggleExperienceType(index, false)}
                                className={cn(
                                  "text-xs px-3 py-1.5 rounded-md transition-colors",
                                  !experience.providedAsDocument 
                                    ? colorClasses.bg.blue + ' text-white'
                                    : colorClasses.text.muted + ' hover:' + colorClasses.text.secondary
                                )}
                              >
                                Form
                              </button>
                              <button
                                onClick={() => toggleExperienceType(index, true)}
                                className={cn(
                                  "text-xs px-3 py-1.5 rounded-md transition-colors",
                                  experience.providedAsDocument 
                                    ? colorClasses.bg.purple + ' text-white'
                                    : colorClasses.text.muted + ' hover:' + colorClasses.text.secondary
                                )}
                              >
                                Doc
                              </button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveExperience(index)}
                              className={cn(
                                "p-0 h-10 w-10 rounded-lg flex items-center justify-center",
                                colorClasses.text.red,
                                'hover:' + colorClasses.bg.redLight
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {experience.providedAsDocument ? (
                          <div>
                            {experience._tempId && experienceFiles.has(experience._tempId) ? (
                              <div className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4",
                                colorClasses.border.emerald,
                                colorClasses.bg.emeraldLight
                              )}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <FileText className={cn("h-5 w-5 shrink-0", colorClasses.text.emerald)} />
                                  <div className="min-w-0 flex-1">
                                    <p className={cn("font-medium text-sm truncate", colorClasses.text.primary)}>
                                      {truncateFilename(experienceFiles.get(experience._tempId!)!.name)}
                                    </p>
                                    <p className={cn("text-xs", colorClasses.text.muted)}>
                                      {getFileSize(experienceFiles.get(experience._tempId!)!.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-auto">
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
                                    className={cn(
                                      "p-0 h-9 w-9 rounded-lg flex items-center justify-center",
                                      colorClasses.text.blue,
                                      'hover:' + colorClasses.bg.blueLight
                                    )}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeExperienceFile(experience._tempId!)}
                                    className={cn(
                                      "p-0 h-9 w-9 rounded-lg flex items-center justify-center",
                                      colorClasses.text.red,
                                      'hover:' + colorClasses.bg.redLight
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center",
                                colorClasses.border.gray200,
                                'hover:' + colorClasses.border.blue
                              )}>
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
                                    <Upload className={cn("h-12 w-12 mb-3", colorClasses.text.muted)} />
                                    <p className={cn("text-base font-medium mb-1", colorClasses.text.secondary)}>
                                      Upload Document
                                    </p>
                                    <p className={cn("text-sm mb-4", colorClasses.text.muted)}>
                                      Max {MAX_FILE_SIZE_MB}MB
                                    </p>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "h-12 px-6 rounded-lg",
                                        colorClasses.border.gray100,
                                        colorClasses.text.primary,
                                        'hover:bg-gray-50 dark:hover:bg-gray-800',
                                        "flex items-center gap-2"
                                      )}
                                    >
                                      <Upload className="h-4 w-4" />
                                      <span>Select File</span>
                                    </Button>
                                  </div>
                                </Label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className={cn("text-sm font-medium mb-1 block", colorClasses.text.secondary)}>
                                  Company <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={experience.company || ''}
                                  onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                                  placeholder="Company name"
                                  className={cn(
                                    "w-full h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                                    colorClasses.border.gray100,
                                    colorClasses.bg.primary,
                                    colorClasses.text.primary
                                  )}
                                />
                              </div>
                              <div>
                                <Label className={cn("text-sm font-medium mb-1 block", colorClasses.text.secondary)}>
                                  Position <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  value={experience.position || ''}
                                  onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                                  placeholder="Your position"
                                  className={cn(
                                    "w-full h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                                    colorClasses.border.gray100,
                                    colorClasses.bg.primary,
                                    colorClasses.text.primary
                                  )}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <Label className={cn("text-sm font-medium mb-1 block", colorClasses.text.secondary)}>
                                  Start Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                  type="month"
                                  value={experience.startDate || ''}
                                  onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                                  className={cn(
                                    "w-full h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                                    colorClasses.border.gray100,
                                    colorClasses.bg.primary,
                                    colorClasses.text.primary
                                  )}
                                />
                              </div>
                              <div>
                                <Label className={cn("text-sm font-medium mb-1 block", colorClasses.text.secondary)}>
                                  End Date
                                </Label>
                                <Input
                                  type="month"
                                  value={experience.endDate || ''}
                                  onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                                  disabled={experience.current}
                                  className={cn(
                                    "w-full h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                                    colorClasses.border.gray100,
                                    colorClasses.bg.primary,
                                    colorClasses.text.primary,
                                    experience.current && 'opacity-50'
                                  )}
                                />
                                <div className="flex items-center mt-2">
                                  <input
                                    type="checkbox"
                                    checked={experience.current || false}
                                    onChange={(e) => handleExperienceChange(index, 'current', e.target.checked)}
                                    className="h-4 w-4 text-blue-500 rounded focus:ring-blue-500"
                                  />
                                  <Label className={cn("ml-2 text-sm", colorClasses.text.secondary)}>
                                    Current position
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Button
                        onClick={() => handleAddExperience('form')}
                        variant="outline"
                        className={cn(
                          "w-full h-12 text-sm sm:text-base border-dashed rounded-lg",
                          colorClasses.border.gray200,
                          colorClasses.text.secondary,
                          'hover:' + colorClasses.bg.secondary,
                          "flex items-center justify-center gap-2"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Form Experience</span>
                      </Button>
                      <Button
                        onClick={() => handleAddExperience('document')}
                        variant="outline"
                        className={cn(
                          "w-full h-12 text-sm sm:text-base border-dashed rounded-lg",
                          colorClasses.border.gray200,
                          colorClasses.text.secondary,
                          'hover:' + colorClasses.bg.secondary,
                          "flex items-center justify-center gap-2"
                        )}
                      >
                        <File className="h-4 w-4" />
                        <span>Add Document</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* References */}
            <Card className={cn(
              "border shadow-md rounded-xl overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <CardHeader 
                className={cn(
                  "p-4 sm:p-5 border-b cursor-pointer",
                  colorClasses.border.gray100
                )} 
                onClick={() => toggleSection('references')}
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      colorClasses.bg.amberLight
                    )}>
                      <Users className={cn("h-5 w-5", colorClasses.text.amber)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={cn("text-base sm:text-lg font-medium truncate", colorClasses.text.primary)}>
                        References
                      </CardTitle>
                      {!expandedSections.references && (
                        <CardDescription className="text-sm truncate">
                          {formData.references.length} reference(s) added
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  {isMobile && (
                    expandedSections.references ? 
                      <ChevronUp className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} /> :
                      <ChevronDown className={cn("h-5 w-5 shrink-0", colorClasses.text.muted)} />
                  )}
                </div>
              </CardHeader>
              {(!isMobile || expandedSections.references) && (
                <CardContent className="p-4 sm:p-5">
                  <div className="space-y-4 sm:space-y-5">
                    {formData.references.map((reference, index) => (
                      <div key={reference._tempId || index} className={cn(
                        "p-4 sm:p-5 border rounded-xl overflow-hidden",
                        colorClasses.border.gray100,
                        colorClasses.bg.primary
                      )}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn("font-semibold text-base", colorClasses.text.primary)}>
                              Reference #{index + 1}
                            </h4>
                            <Badge className={cn(
                              "text-xs px-3 py-1 border-0 rounded-full",
                              reference.providedAsDocument ? 
                                colorClasses.bg.purpleLight + ' ' + colorClasses.text.purple :
                                colorClasses.bg.blueLight + ' ' + colorClasses.text.blue
                            )}>
                              {reference.providedAsDocument ? 'Document' : 'Form'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 ml-auto">
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                              <button
                                onClick={() => toggleReferenceType(index, false)}
                                className={cn(
                                  "text-xs px-3 py-1.5 rounded-md transition-colors",
                                  !reference.providedAsDocument 
                                    ? colorClasses.bg.blue + ' text-white'
                                    : colorClasses.text.muted + ' hover:' + colorClasses.text.secondary
                                )}
                              >
                                Form
                              </button>
                              <button
                                onClick={() => toggleReferenceType(index, true)}
                                className={cn(
                                  "text-xs px-3 py-1.5 rounded-md transition-colors",
                                  reference.providedAsDocument 
                                    ? colorClasses.bg.purple + ' text-white'
                                    : colorClasses.text.muted + ' hover:' + colorClasses.text.secondary
                                )}
                              >
                                Doc
                              </button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveReference(index)}
                              className={cn(
                                "p-0 h-10 w-10 rounded-lg flex items-center justify-center",
                                colorClasses.text.red,
                                'hover:' + colorClasses.bg.redLight
                              )}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {reference.providedAsDocument ? (
                          <div>
                            {reference._tempId && referenceFiles.has(reference._tempId) ? (
                              <div className={cn(
                                "flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg gap-4",
                                colorClasses.border.emerald,
                                colorClasses.bg.emeraldLight
                              )}>
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <FileText className={cn("h-5 w-5 shrink-0", colorClasses.text.emerald)} />
                                  <div className="min-w-0 flex-1">
                                    <p className={cn("font-medium text-sm truncate", colorClasses.text.primary)}>
                                      {truncateFilename(referenceFiles.get(reference._tempId!)!.name)}
                                    </p>
                                    <p className={cn("text-xs", colorClasses.text.muted)}>
                                      {getFileSize(referenceFiles.get(reference._tempId!)!.size)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-auto">
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
                                    className={cn(
                                      "p-0 h-9 w-9 rounded-lg flex items-center justify-center",
                                      colorClasses.text.blue,
                                      'hover:' + colorClasses.bg.blueLight
                                    )}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeReferenceFile(reference._tempId!)}
                                    className={cn(
                                      "p-0 h-9 w-9 rounded-lg flex items-center justify-center",
                                      colorClasses.text.red,
                                      'hover:' + colorClasses.bg.redLight
                                    )}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center",
                                colorClasses.border.gray200,
                                'hover:' + colorClasses.border.blue
                              )}>
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
                                    <Upload className={cn("h-12 w-12 mb-3", colorClasses.text.muted)} />
                                    <p className={cn("text-base font-medium mb-1", colorClasses.text.secondary)}>
                                      Upload Document
                                    </p>
                                    <p className={cn("text-sm mb-4", colorClasses.text.muted)}>
                                      Max {MAX_FILE_SIZE_MB}MB
                                    </p>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "h-12 px-6 rounded-lg",
                                        colorClasses.border.gray100,
                                        colorClasses.text.primary,
                                        'hover:bg-gray-50 dark:hover:bg-gray-800',
                                        "flex items-center gap-2"
                                      )}
                                    >
                                      <Upload className="h-4 w-4" />
                                      <span>Select File</span>
                                    </Button>
                                  </div>
                                </Label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <Label className={cn("text-sm font-medium mb-1 block", colorClasses.text.secondary)}>
                                Full Name <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                value={reference.name || ''}
                                onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                                placeholder="Reference name"
                                className={cn(
                                  "w-full h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                                  colorClasses.border.gray100,
                                  colorClasses.bg.primary,
                                  colorClasses.text.primary
                                )}
                              />
                            </div>
                            <div>
                              <Label className={cn("text-sm font-medium mb-1 block", colorClasses.text.secondary)}>
                                Email <span className="text-red-500">*</span>
                              </Label>
                              <div className="relative">
                                <Input
                                  type="email"
                                  value={reference.email || ''}
                                  onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                                  placeholder="email@example.com"
                                  className={cn(
                                    "w-full pl-10 h-11 sm:h-12 text-sm sm:text-base rounded-lg",
                                    colorClasses.border.gray100,
                                    colorClasses.bg.primary,
                                    colorClasses.text.primary
                                  )}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <Button
                        onClick={() => handleAddReference('form')}
                        variant="outline"
                        className={cn(
                          "w-full h-12 text-sm sm:text-base border-dashed rounded-lg",
                          colorClasses.border.gray200,
                          colorClasses.text.secondary,
                          'hover:' + colorClasses.bg.secondary,
                          "flex items-center justify-center gap-2"
                        )}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Form Reference</span>
                      </Button>
                      <Button
                        onClick={() => handleAddReference('document')}
                        variant="outline"
                        className={cn(
                          "w-full h-12 text-sm sm:text-base border-dashed rounded-lg",
                          colorClasses.border.gray200,
                          colorClasses.text.secondary,
                          'hover:' + colorClasses.bg.secondary,
                          "flex items-center justify-center gap-2"
                        )}
                      >
                        <File className="h-4 w-4" />
                        <span>Add Document</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}

        {/* Step 4: Review Application */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Application Summary */}
            <Card className={cn(
              "border shadow-md rounded-xl overflow-hidden",
              colorClasses.bg.primary,
              colorClasses.border.gray100
            )}>
              <CardHeader className={cn("p-4 sm:p-5 border-b", colorClasses.border.gray100)}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    colorClasses.bg.blueLight
                  )}>
                    <ClipboardCheck className={cn("h-5 w-5", colorClasses.text.blue)} />
                  </div>
                  <div>
                    <CardTitle className={cn("text-base sm:text-lg font-medium", colorClasses.text.primary)}>
                      Application Summary
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-5">
                <div className="space-y-4 sm:space-y-5">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className={cn("p-4 rounded-lg border text-center overflow-hidden", colorClasses.border.gray100)}>
                      <div className={cn("text-xl sm:text-2xl font-bold", colorClasses.text.blue)}>
                        {formData.selectedCVs.length}
                      </div>
                      <div className={cn("text-sm", colorClasses.text.muted)}>CVs</div>
                    </div>
                    <div className={cn("p-4 rounded-lg border text-center overflow-hidden", colorClasses.border.gray100)}>
                      <div className={cn("text-xl sm:text-2xl font-bold", colorClasses.text.purple)}>
                        {referenceFiles.size}
                      </div>
                      <div className={cn("text-sm", colorClasses.text.muted)}>Ref Docs</div>
                    </div>
                    <div className={cn("p-4 rounded-lg border text-center overflow-hidden", colorClasses.border.gray100)}>
                      <div className={cn("text-xl sm:text-2xl font-bold", colorClasses.text.emerald)}>
                        {experienceFiles.size}
                      </div>
                      <div className={cn("text-sm", colorClasses.text.muted)}>Exp Docs</div>
                    </div>
                    <div className={cn("p-4 rounded-lg border text-center overflow-hidden", colorClasses.border.gray100)}>
                      <div className={cn("text-xl sm:text-2xl font-bold", colorClasses.text.amber)}>
                        {formData.skills.length}
                      </div>
                      <div className={cn("text-sm", colorClasses.text.muted)}>Skills</div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className={cn("rounded-lg border p-4", colorClasses.border.gray100)}>
                    <h4 className={cn("font-medium text-sm mb-3", colorClasses.text.primary)}>
                      Application Checklist:
                    </h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Contact information complete', 
                          valid: !!(formData.contactInfo.email && formData.contactInfo.phone && formData.contactInfo.location) },
                        { label: 'CVs selected', valid: formData.selectedCVs.length > 0 },
                        { label: 'Cover letter provided', valid: formData.coverLetter.trim().length > 0 },
                        { label: 'All documents uploaded', 
                          valid: formData.references.every(ref =>
                            !ref.providedAsDocument ||
                            (ref.providedAsDocument && ref._tempId && referenceFiles.has(ref._tempId))
                          ) && formData.workExperience.every(exp =>
                            !exp.providedAsDocument ||
                            (exp.providedAsDocument && exp._tempId && experienceFiles.has(exp._tempId))
                          )
                        }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center mr-3 shrink-0",
                            item.valid ? colorClasses.bg.emeraldLight : colorClasses.bg.redLight
                          )}>
                            {item.valid ? (
                              <Check className={cn("h-3 w-3", colorClasses.text.emerald)} />
                            ) : (
                              <X className={cn("h-3 w-3", colorClasses.text.red)} />
                            )}
                          </div>
                          <span className={cn("text-sm", colorClasses.text.secondary)}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edit Buttons - Perfectly symmetrical */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToStep(1)}
                      className={cn(
                        "h-11 text-sm rounded-lg",
                        colorClasses.border.gray100,
                        colorClasses.text.blue,
                        'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Profile</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToStep(2)}
                      className={cn(
                        "h-11 text-sm rounded-lg",
                        colorClasses.border.gray100,
                        colorClasses.text.amber,
                        'hover:bg-amber-50 dark:hover:bg-amber-900/20',
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      <Edit className="h-4 w-4" />
                      <span>App</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToStep(3)}
                      className={cn(
                        "h-11 text-sm rounded-lg",
                        colorClasses.border.gray100,
                        colorClasses.text.purple,
                        'hover:bg-purple-50 dark:hover:bg-purple-900/20',
                        "flex items-center justify-center gap-2"
                      )}
                    >
                      <Edit className="h-4 w-4" />
                      <span>Docs</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Navigation - Perfectly symmetrical buttons */}
      <div className={cn(
        "flex flex-col sm:flex-row justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t gap-3",
        colorClasses.border.gray100
      )}>
        <Button
          onClick={prevStep}
          disabled={currentStep === 1}
          variant="outline"
          className={cn(
            "w-full sm:w-auto order-2 sm:order-1 h-12 sm:h-11 px-6 rounded-lg",
            colorClasses.border.gray100,
            colorClasses.text.primary,
            'hover:bg-gray-50 dark:hover:bg-gray-800',
            "flex items-center justify-center gap-2"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <div className="text-center order-1 sm:order-2 w-full sm:w-auto">
          <p className={cn("text-sm font-medium", colorClasses.text.muted)}>
            Step {currentStep} of {steps.length}
          </p>
        </div>

        {!isLastStep ? (
          <Button
            onClick={nextStep}
            className={cn(
              "w-full sm:w-auto order-3 h-12 sm:h-11 px-6 rounded-lg",
              colorClasses.bg.blue,
              'hover:opacity-90 text-white',
              "flex items-center justify-center gap-2"
            )}
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              "w-full sm:w-auto order-3 h-12 sm:h-11 px-6 rounded-lg",
              colorClasses.bg.emerald,
              'hover:opacity-90 text-white disabled:opacity-50',
              "flex items-center justify-center gap-2"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Submit</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* Mobile Cancel Button */}
      {isMobile && (
        <div className="mt-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className={cn(
              "w-full h-12 px-6 rounded-lg border",
              colorClasses.border.gray100,
              colorClasses.text.primary,
              'hover:bg-gray-50 dark:hover:bg-gray-800',
              "flex items-center justify-center gap-2"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Cancel Application</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApplicationForm;