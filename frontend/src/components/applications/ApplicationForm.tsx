/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ApplicationForm.tsx - MOBILE OPTIMIZED
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
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { colors, colorClasses } from '@/utils/color';

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
  const [expandedSections, setExpandedSections] = useState<number[]>([1]);

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
      color: `${colorClasses.bg.darkNavy}`,
      textColor: `${colorClasses.text.white}`
    },
    {
      number: 2,
      title: 'Application',
      icon: BookOpen,
      description: 'Cover Letter & Skills',
      color: `${colorClasses.bg.blue}`,
      textColor: `${colorClasses.text.white}`
    },
    {
      number: 3,
      title: 'Documents',
      icon: Briefcase,
      description: 'Experience & References',
      color: `${colorClasses.bg.teal}`,
      textColor: `${colorClasses.text.white}`
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

  const toggleSection = (stepNumber: number) => {
    setExpandedSections(prev =>
      prev.includes(stepNumber)
        ? prev.filter(num => num !== stepNumber)
        : [...prev, stepNumber]
    );
  };

  const getFileDisplayName = (file: File): string => {
    return file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name;
  };

  if (isLoading) {
    return (
      <div className="min-h-[40vh] bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className={`w-12 h-12 border-2 ${colorClasses.border.darkNavy} border-t-transparent rounded-full animate-spin mx-auto mb-4`}></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Preparing Your Application</h3>
          <p className="text-gray-500 text-sm">Getting everything ready for you...</p>
        </div>
      </div>
    );
  }

  const isLastStep = currentStep === steps.length;

  return (
    <div className="bg-white">
      {/* Mobile Step Indicator */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${colorClasses.bg.darkNavy}`}>
              {currentStep}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Step {currentStep} of {steps.length}</p>
              <p className="text-xs text-gray-500">{steps[currentStep - 1]?.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`w-2 h-2 rounded-full ${currentStep === step.number ? colorClasses.bg.darkNavy : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Form Content - Mobile Optimized */}
      <div className="p-4">
        {/* Step 1: Profile & CV Selection */}
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Contact Information - Mobile Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(1)}
                className="w-full px-4 py-3.5 flex items-center justify-between bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Contact Information</p>
                    <p className="text-xs text-gray-500">We'll contact you about this application</p>
                  </div>
                </div>
                {expandedSections.includes(1) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {expandedSections.includes(1) && (
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.contactInfo.email}
                        onChange={(e) => handleContactInfoChange('email', e.target.value)}
                        className="w-full text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.contactInfo.phone}
                        onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                        className="w-full text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Location *
                      </Label>
                      <Input
                        id="location"
                        value={formData.contactInfo.location}
                        onChange={(e) => handleContactInfoChange('location', e.target.value)}
                        className="w-full text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CV Selection - Mobile Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(2)}
                className="w-full px-4 py-3.5 flex items-center justify-between bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Select Resume</p>
                    <p className="text-xs text-gray-500">
                      {formData.selectedCVs.length > 0
                        ? `${formData.selectedCVs.length} selected`
                        : 'Choose resume to submit'}
                    </p>
                  </div>
                </div>
                {expandedSections.includes(2) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {expandedSections.includes(2) && (
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-3">
                    {cvs.length > 0 ? cvs.map((cv) => (
                      <div
                        key={cv._id}
                        className={`flex items-center p-3 rounded-lg border-2 transition-all ${formData.selectedCVs.some(selected => selected.cvId === cv._id)
                            ? `${colorClasses.border.darkNavy} bg-blue-50`
                            : 'border-gray-200 bg-white'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedCVs.some(selected => selected.cvId === cv._id)}
                          onChange={(e) => handleCVSelection(cv._id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded mr-3"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <FileText className="h-3.5 w-3.5 text-gray-500" />
                            <p className="font-medium text-gray-900 text-sm truncate">
                              {cv.originalName}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {applicationService.getFileSize(cv)} • {new Date(cv.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => applicationService.viewCV(cv)}
                            className="p-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-4">
                        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 font-medium mb-1">No Resume Found</p>
                        <p className="text-gray-400 text-xs mb-3">Upload your resume to start applying</p>
                        <Button
                          variant="outline"
                          onClick={() => window.open('/dashboard/candidate/profile', '_blank')}
                          className="border-gray-300 text-gray-700 text-xs py-1.5"
                        >
                          <Plus className="h-3 w-3 mr-1.5" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Cover Letter & Skills */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Cover Letter - Mobile Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3.5 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Cover Letter</p>
                    <p className="text-xs text-gray-500">Tell us why you're the perfect fit</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div>
                  <Label htmlFor="coverLetter" className="text-sm font-medium text-gray-700 mb-2.5 block">
                    Your Application Letter *
                  </Label>
                  <Textarea
                    id="coverLetter"
                    value={formData.coverLetter}
                    onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
                    rows={8}
                    className="w-full resize-none font-sans leading-relaxed text-sm"
                    placeholder="Write your cover letter here..."
                  />
                  <div className="flex justify-between items-center mt-2.5">
                    <p className="text-xs text-gray-500">
                      {formData.coverLetter.length} characters
                    </p>
                    {formData.coverLetter.length < 100 && (
                      <p className="text-xs text-amber-600 flex items-center space-x-1">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Minimum 100 chars</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skills - Mobile Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(3)}
                className="w-full px-4 py-3.5 flex items-center justify-between bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <Award className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Skills & Competencies</p>
                    <p className="text-xs text-gray-500">
                      {formData.skills.length > 0
                        ? `${formData.skills.length} skills added`
                        : 'Add relevant skills'}
                    </p>
                  </div>
                </div>
                {expandedSections.includes(3) ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </button>

              {expandedSections.includes(3) && (
                <div className="p-4 border-t border-gray-200">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        placeholder="Add skill..."
                        className="flex-1 text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                      />
                      <Button
                        onClick={handleAddSkill}
                        className={`${colorClasses.bg.blue} hover:opacity-90 text-white p-2.5`}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {formData.skills.map((skill, index) => (
                        <div
                          key={index}
                          className={`${colorClasses.bg.blue} text-white px-2.5 py-1 rounded-full flex items-center`}
                        >
                          <span className="text-xs mr-1.5">{skill}</span>
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:opacity-80"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {formData.skills.length === 0 && (
                      <div className="text-center py-3 text-gray-500">
                        <Award className="h-6 w-6 text-gray-300 mx-auto mb-1.5" />
                        <p className="text-sm">No skills added yet</p>
                        <p className="text-xs text-gray-400">Add skills to strengthen your application</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Experience & References */}
        {currentStep === 3 && (
          <div className="space-y-4">
            {/* Work Experience */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3.5 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Work Experience</p>
                      <p className="text-xs text-gray-500">
                        {formData.workExperience.length > 0
                          ? `${formData.workExperience.length} experiences`
                          : 'Add your work history'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddExperience}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="space-y-4">
                  {formData.workExperience.map((experience, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">Experience #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveExperience(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <Input
                            value={experience.company || ''}
                            onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                            placeholder="Company name"
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <Input
                            value={experience.position || ''}
                            onChange={(e) => handleExperienceChange(index, 'position', e.target.value)}
                            placeholder="Your position"
                            className="text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              type="month"
                              value={experience.startDate || ''}
                              onChange={(e) => handleExperienceChange(index, 'startDate', e.target.value)}
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Input
                              type="month"
                              value={experience.endDate || ''}
                              onChange={(e) => handleExperienceChange(index, 'endDate', e.target.value)}
                              disabled={experience.current}
                              className="text-sm"
                            />
                            <div className="flex items-center mt-1.5">
                              <input
                                type="checkbox"
                                checked={experience.current || false}
                                onChange={(e) => handleExperienceChange(index, 'current', e.target.checked)}
                                className="h-3.5 w-3.5 text-teal-600 rounded"
                              />
                              <Label className="ml-1.5 text-xs text-gray-700">Current</Label>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Textarea
                            value={experience.description || ''}
                            onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                            rows={2}
                            placeholder="Responsibilities..."
                            className="text-sm"
                          />
                        </div>

                        {/* Experience Document Upload - Mobile */}
                        <div>
                          {uploadedFiles.experienceFiles[index] ? (
                            <div className="flex items-center justify-between p-2 border border-emerald-200 bg-emerald-50 rounded">
                              <div className="flex items-center space-x-2 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 text-xs truncate">
                                    {getFileDisplayName(uploadedFiles.experienceFiles[index])}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveExperienceFile(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-gray-300 rounded p-2.5 text-center">
                              <Input
                                type="file"
                                onChange={(e) => handleFileUpload(e, (file) => handleExperienceFileUpload(index, file))}
                                className="hidden"
                                id={`experience-file-${index}`}
                              />
                              <Label htmlFor={`experience-file-${index}`} className="cursor-pointer">
                                <div className="flex flex-col items-center">
                                  <Upload className="h-5 w-5 text-gray-400 mb-1" />
                                  <p className="text-gray-600 font-medium text-xs">Upload document</p>
                                  <p className="text-[10px] text-gray-500">PDF, DOC • Max 15MB</p>
                                </div>
                              </Label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.workExperience.length === 0 && (
                    <div className="text-center py-6">
                      <Briefcase className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium mb-1">No work experience added</p>
                      <p className="text-gray-400 text-xs mb-3">Add your relevant work history</p>
                      <Button
                        onClick={handleAddExperience}
                        variant="outline"
                        className="border-gray-300 text-gray-700 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Work Experience
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* References */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3.5 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Users className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">References</p>
                      <p className="text-xs text-gray-500">
                        {formData.references.length > 0
                          ? `${formData.references.length} references`
                          : 'Add professional references'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleAddReference}
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="space-y-4">
                  {formData.references.map((reference, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-sm">Reference #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveReference(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-2.5">
                        <Input
                          value={reference.name || ''}
                          onChange={(e) => handleReferenceChange(index, 'name', e.target.value)}
                          placeholder="Full name"
                          className="text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            value={reference.position || ''}
                            onChange={(e) => handleReferenceChange(index, 'position', e.target.value)}
                            placeholder="Position"
                            className="text-sm"
                          />
                          <Input
                            value={reference.company || ''}
                            onChange={(e) => handleReferenceChange(index, 'company', e.target.value)}
                            placeholder="Company"
                            className="text-sm"
                          />
                        </div>
                        <Input
                          value={reference.relationship || ''}
                          onChange={(e) => handleReferenceChange(index, 'relationship', e.target.value)}
                          placeholder="How do you know them?"
                          className="text-sm"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="email"
                            value={reference.email || ''}
                            onChange={(e) => handleReferenceChange(index, 'email', e.target.value)}
                            placeholder="Email"
                            className="text-sm"
                          />
                          <Input
                            type="tel"
                            value={reference.phone || ''}
                            onChange={(e) => handleReferenceChange(index, 'phone', e.target.value)}
                            placeholder="Phone"
                            className="text-sm"
                          />
                        </div>

                        {/* Contact Permission */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={reference.allowsContact || false}
                            onChange={(e) => handleReferenceChange(index, 'allowsContact', e.target.checked)}
                            className="h-3.5 w-3.5 text-teal-600 rounded"
                          />
                          <Label className="text-xs text-gray-700">Allows contact</Label>
                        </div>

                        {/* Reference Document Upload - Mobile */}
                        <div>
                          {uploadedFiles.referenceFiles[index] ? (
                            <div className="flex items-center justify-between p-2 border border-emerald-200 bg-emerald-50 rounded">
                              <div className="flex items-center space-x-2 min-w-0">
                                <FileText className="h-3.5 w-3.5 text-emerald-600" />
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900 text-xs truncate">
                                    {getFileDisplayName(uploadedFiles.referenceFiles[index])}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveReferenceFile(index)}
                                className="text-red-600 hover:text-red-700 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <div className="border border-dashed border-gray-300 rounded p-2.5 text-center">
                              <Input
                                type="file"
                                onChange={(e) => handleFileUpload(e, (file) => handleReferenceFileUpload(index, file))}
                                className="hidden"
                                id={`reference-file-${index}`}
                              />
                              <Label htmlFor={`reference-file-${index}`} className="cursor-pointer">
                                <div className="flex flex-col items-center">
                                  <Upload className="h-5 w-5 text-gray-400 mb-1" />
                                  <p className="text-gray-600 font-medium text-xs">Upload letter</p>
                                  <p className="text-[10px] text-gray-500">PDF, DOC • Max 15MB</p>
                                </div>
                              </Label>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.references.length === 0 && (
                    <div className="text-center py-6">
                      <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium mb-1">No references added</p>
                      <p className="text-gray-400 text-xs mb-3">Add professional references</p>
                      <Button
                        onClick={handleAddReference}
                        variant="outline"
                        className="border-gray-300 text-gray-700 text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add Reference
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Application Summary - Mobile */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center space-x-2.5 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-gray-900">Ready to Submit?</p>
                  <p className="text-xs text-gray-500">Review your application summary</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-50 p-2.5 rounded-lg text-center">
                  <div className="text-lg font-bold text-blue-600">{formData.selectedCVs.length}</div>
                  <div className="text-xs text-blue-700">Resumes</div>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-lg text-center">
                  <div className="text-lg font-bold text-emerald-600">{formData.skills.length}</div>
                  <div className="text-xs text-emerald-700">Skills</div>
                </div>
                <div className="bg-teal-50 p-2.5 rounded-lg text-center">
                  <div className="text-lg font-bold text-teal-600">{formData.workExperience.length}</div>
                  <div className="text-xs text-teal-700">Experiences</div>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-lg text-center">
                  <div className="text-lg font-bold text-amber-600">{formData.references.length}</div>
                  <div className="text-xs text-amber-700">References</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Navigation Footer - Fixed to Bottom */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <Button
            onClick={prevStep}
            disabled={currentStep === 1}
            variant="outline"
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5"
          >
            <ChevronLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>

          <div className="text-center">
            <p className="text-xs text-gray-500">Step {currentStep} of {steps.length}</p>
          </div>

          {!isLastStep ? (
            <Button
              onClick={nextStep}
              className={`${colorClasses.bg.darkNavy} hover:opacity-90 text-white px-4 py-2.5`}
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`${colorClasses.bg.goldenMustard} hover:opacity-90 text-white px-4 py-2.5`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1.5" />
                  Submit
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