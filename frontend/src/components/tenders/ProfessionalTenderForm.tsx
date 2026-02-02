/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { format, addDays, addMonths, isValid } from 'date-fns';
import {
  CalendarIcon, Upload, FileText, ChevronRight, ChevronLeft, Eye,
  Save, Calendar, Plus, X, AlertCircle, CheckCircle,
  DollarSign, Briefcase, Shield, FileCheck, Award, CreditCard,
  FileEdit, Building2, BarChart, Target, Tag, Users, FileUp,
  Check, Globe, Lock, Mail, Sparkles, AlertTriangle,
  FileBarChart, ClipboardList, Percent, CalendarDays, UserCheck
} from 'lucide-react';

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Separator } from '@/components/ui/Separator';
import { Badge } from '@/components/ui/Badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/Alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Slider } from '@/components/ui/Slider';
import { Checkbox } from '@/components/ui/Checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import RichTextEditor from '@/components/ui/RichTextEditor';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

// Hooks & Services
import { useToast } from '@/hooks/use-toast';
import {
  useCreateProfessionalTender,
  useTenderCategories,
} from '@/hooks/useTenders';
import {
  professionalTenderSchema,
  type Tender,
  PROCUREMENT_METHODS,
  EVALUATION_METHODS,
  CURRENCIES,
  VISIBILITY_TYPES,
  WORKFLOW_TYPES,
  DOCUMENT_TYPES,
  FILE_UPLOAD_CONSTRAINTS,
  type ProcurementMethod,
  type EvaluationMethod,
  type CreateProfessionalTenderData,
  type VisibilityType,
  type WorkflowType
} from '@/services/tenderService';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';

// Extended types
interface TechnicalRequirement {
  type: 'hardware' | 'software' | 'certification' | 'other';
  name: string;
  description: string;
  minimum?: string;
  recommended?: string;
  mandatory: boolean;
}

interface LanguageRequirement {
  language: string;
  proficiency: 'basic' | 'intermediate' | 'fluent' | 'native';
  requiredFor: 'submission' | 'communication' | 'both';
}

interface PersonnelRole {
  role: string;
  quantity: number;
  experience: number;
  qualifications: string[];
  mandatory: boolean;
}

interface FinancialCapacity {
  minAnnualTurnover: number;
  currency: string;
}

// Form type
interface ProfessionalTenderFormValues extends Omit<CreateProfessionalTenderData,
  'tenderCategory' | 'deadline' | 'deliverables' | 'milestones' | 'timeline' |
  'clarificationDeadline' | 'preBidMeeting' | 'workflowType' | 'status' |
  'visibilityType' | 'bidValidityPeriod' | 'evaluationCriteria' | 'financialCapacity'
> {
  invitedEmails: any;
  tenderCategory: 'professional';
  deadline: string;
  workflowType: WorkflowType;
  status: 'draft' | 'published';
  visibilityType: VisibilityType;
  deliverables: Array<{
    title: string;
    description: string;
    deadline: string;
  }>;
  milestones: Array<{
    title: string;
    description: string;
    dueDate: string;
    paymentPercentage: number;
  }>;
  timeline?: {
    startDate: string;
    endDate: string;
    duration: {
      value: number;
      unit: 'days' | 'weeks' | 'months' | 'years';
    };
  };
  clarificationDeadline?: string;
  preBidMeeting?: {
    date: string;
    location: string;
    onlineLink: string;
  };
  technicalRequirements?: TechnicalRequirement[];
  languageRequirements?: LanguageRequirement[];
  keyPersonnel?: PersonnelRole[];
  financialCapacity: FinancialCapacity;
  submissionLanguage?: string;
  communicationLanguage?: string;
  cpoRequired: boolean;
  cpoDescription?: string;
  evaluationCriteria: {
    technicalWeight: number;
    financialWeight: number;
  };
  bidValidityPeriod: {
    value: number;
    unit: 'days' | 'weeks' | 'months';
  };
}

interface ProfessionalTenderFormProps {
  editMode?: boolean;
  initialData?: Partial<Tender>;
  tenderId?: string;
}

// Helper functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const safeFormatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : format(date, 'PPP');
  } catch {
    return 'Invalid Date';
  }
};

const generateReferenceNumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TDR-PRO-${year}${month}${day}-${random}`;
};

// Predefined options
const SKILLS_SUGGESTIONS = [
  'Project Management', 'Construction Management', 'Engineering', 'Architecture',
  'Software Development', 'Consulting', 'Legal Services', 'Financial Analysis',
  'Procurement', 'Logistics', 'Healthcare', 'Education', 'Environmental Services',
  'Quality Assurance', 'Risk Management', 'Compliance', 'Technical Writing'
];

const TIME_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
] as const;

const BID_VALIDITY_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
] as const;

// Color system with dark mode support
const getColors = (isDarkMode: boolean) => ({
  primary: isDarkMode ? '#3B82F6' : '#1E40AF', // Blue
  primaryLight: isDarkMode ? '#60A5FA' : '#3B82F6',
  primaryDark: isDarkMode ? '#1E3A8A' : '#1E3A8A',
  secondary: isDarkMode ? '#0D9488' : '#0F766E', // Teal
  secondaryLight: isDarkMode ? '#14B8A6' : '#0D9488',
  accent: isDarkMode ? '#F59E0B' : '#F59E0B', // Amber
  background: isDarkMode ? '#0F172A' : '#F8FAFC',
  card: isDarkMode ? '#1E293B' : '#FFFFFF',
  textPrimary: isDarkMode ? '#F1F5F9' : '#020617',
  textSecondary: isDarkMode ? '#CBD5E1' : '#475569',
  textMuted: isDarkMode ? '#94A3B8' : '#64748B',
  border: isDarkMode ? '#334155' : '#E2E8F0',
  success: isDarkMode ? '#10B981' : '#10B981',
  warning: isDarkMode ? '#F59E0B' : '#F59E0B',
  error: isDarkMode ? '#EF4444' : '#EF4444',
  info: isDarkMode ? '#3B82F6' : '#3B82F6'
});

const ProfessionalTenderForm: React.FC<ProfessionalTenderFormProps> = ({
  editMode = false,
  initialData,
  tenderId
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark') ||
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  const colors = getColors(isDarkMode);

  // Use the tender categories hook
  const {
    groups: categories,
    isLoading: loadingCategories,
    error: categoriesError,
    categoryOptions
  } = useTenderCategories('professional');

  const { mutate: createTender, isPending: creating } = useCreateProfessionalTender();

  const [currentStep, setCurrentStep] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [sealedConfirmed, setSealedConfirmed] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitationMethod, setInvitationMethod] = useState<'companies' | 'users' | 'emails'>('companies');

  // Default dates - only used when no initial data
  const getDefaultDeadline = () => format(addDays(new Date(), 30), 'yyyy-MM-dd');
  const getDefaultStartDate = () => format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const getDefaultEndDate = () => format(addMonths(new Date(), 6), 'yyyy-MM-dd');

  const form = useForm<ProfessionalTenderFormValues>({
    resolver: zodResolver(professionalTenderSchema) as any,
    defaultValues: {
      tenderCategory: 'professional',
      title: initialData?.title || '',
      description: initialData?.description || '',
      procurementCategory: initialData?.procurementCategory || '',
      deadline: initialData?.deadline ? format(new Date(initialData.deadline), 'yyyy-MM-dd') : getDefaultDeadline(),
      referenceNumber: initialData?.professionalSpecific?.referenceNumber || generateReferenceNumber(),
      procuringEntity: initialData?.professionalSpecific?.procuringEntity || '',
      workflowType: (initialData?.workflowType as WorkflowType) || 'open',
      visibilityType: (initialData?.visibility?.visibilityType as VisibilityType) || 'public',
      status: 'draft', // Always start as draft, user chooses at the end
      procurementMethod: (initialData?.procurementMethod as ProcurementMethod) || 'open_tender',
      evaluationMethod: (initialData?.professionalSpecific?.evaluationMethod as EvaluationMethod) || 'combined',
      sealedBidConfirmation: initialData?.professionalSpecific?.sealedBidConfirmation || false,
      skillsRequired: initialData?.skillsRequired || [],
      minimumExperience: initialData?.professionalSpecific?.minimumExperience || 5,
      legalRegistrationRequired: initialData?.professionalSpecific?.legalRegistrationRequired ?? true,
      cpoRequired: initialData?.professionalSpecific?.cpoRequired || false,
      cpoDescription: initialData?.professionalSpecific?.cpoDescription || '',
      evaluationCriteria: initialData?.professionalSpecific?.evaluationCriteria || {
        technicalWeight: 70,
        financialWeight: 30,
      },
      bidValidityPeriod: initialData?.professionalSpecific?.bidValidityPeriod || {
        value: 30,
        unit: 'days',
      },
      maxFileSize: initialData?.maxFileSize || FILE_UPLOAD_CONSTRAINTS.maxFileSize,
      maxFileCount: initialData?.maxFileCount || 10,
      financialCapacity: initialData?.professionalSpecific?.financialCapacity || {
        minAnnualTurnover: 0,
        currency: 'USD',
      },
      submissionLanguage: 'English',
      communicationLanguage: 'English',
      projectObjectives: initialData?.professionalSpecific?.projectObjectives || '',
      deliverables: initialData?.professionalSpecific?.deliverables
        ? initialData.professionalSpecific.deliverables.map(d => ({
          ...d,
          deadline: format(new Date(d.deadline), 'yyyy-MM-dd'),
        }))
        : [],
      milestones: initialData?.professionalSpecific?.milestones
        ? initialData.professionalSpecific.milestones.map(m => ({
          ...m,
          dueDate: format(new Date(m.dueDate), 'yyyy-MM-dd'),
        }))
        : [],
      timeline: initialData?.professionalSpecific?.timeline ? {
        ...initialData.professionalSpecific.timeline,
        startDate: format(new Date(initialData.professionalSpecific.timeline.startDate), 'yyyy-MM-dd'),
        endDate: format(new Date(initialData.professionalSpecific.timeline.endDate), 'yyyy-MM-dd'),
      } : {
        startDate: getDefaultStartDate(),
        endDate: getDefaultEndDate(),
        duration: {
          value: 6,
          unit: 'months',
        },
      },
      clarificationDeadline: initialData?.professionalSpecific?.clarificationDeadline
        ? format(new Date(initialData.professionalSpecific.clarificationDeadline), 'yyyy-MM-dd')
        : '',
      preBidMeeting: initialData?.professionalSpecific?.preBidMeeting ? {
        ...initialData.professionalSpecific.preBidMeeting,
        date: format(new Date(initialData.professionalSpecific.preBidMeeting.date), 'yyyy-MM-dd'),
      } : undefined,
      requiredCertifications: initialData?.professionalSpecific?.requiredCertifications || [],
      pastProjectReferences: initialData?.professionalSpecific?.pastProjectReferences || {
        minCount: 0,
        similarValueProjects: false,
      },
      fundingSource: initialData?.professionalSpecific?.fundingSource || '',
    },
    mode: 'onChange',
  });

  // Watch form values
  const workflowType = form.watch('workflowType');
  const visibilityType = form.watch('visibilityType');
  const cpoRequired = form.watch('cpoRequired');
  const evaluationCriteria = form.watch('evaluationCriteria');
  const evaluationMethod = form.watch('evaluationMethod');
  const sealedBidConfirmation = form.watch('sealedBidConfirmation');
  const skills = form.watch('skillsRequired') || [];
  const allowedCompanies = form.watch('allowedCompanies') || [];
  const allowedUsers = form.watch('allowedUsers') || [];
  const formStatus = form.watch('status');

  // Field arrays for dynamic sections
  const deliverablesFields = useFieldArray({
    control: form.control,
    name: 'deliverables',
  });

  const milestonesFields = useFieldArray({
    control: form.control,
    name: 'milestones',
  });

  const certificationFields = useFieldArray({
    control: form.control,
    name: 'requiredCertifications',
  });

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFileCount = form.getValues('maxFileCount') || 10;
    const maxFileSize = form.getValues('maxFileSize') || FILE_UPLOAD_CONSTRAINTS.maxFileSize;

    // Validate file count
    if (uploadedFiles.length + files.length > maxFileCount) {
      toast({
        title: 'Maximum files exceeded',
        description: `Maximum ${maxFileCount} files allowed. You have ${uploadedFiles.length} files already.`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      toast({
        title: 'File too large',
        description: `Maximum file size is ${formatFileSize(maxFileSize)}`,
        variant: 'destructive',
      });
      return;
    }

    // Validate file types
    const allowedTypes = FILE_UPLOAD_CONSTRAINTS.allowedTypes;
    const invalidTypeFiles = files.filter(file => {
      const fileType = file.type;
      return !allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return fileType.startsWith(category + '/');
        }
        return fileType === type;
      });
    });

    if (invalidTypeFiles.length > 0) {
      toast({
        title: 'Invalid file type',
        description: `Only ${allowedTypes.join(', ')} files are allowed`,
        variant: 'destructive',
      });
      return;
    }

    setUploadedFiles(prev => [...prev, ...files]);
    toast({
      title: 'Files uploaded',
      description: `${files.length} file(s) uploaded successfully`,
      variant: 'default',
    });
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: 'File removed',
      description: 'File has been removed from the upload list',
      variant: 'default',
    });
  };

  const handleFormSubmit = async (data: ProfessionalTenderFormValues) => {
    // Validation checks
    if (workflowType === 'closed' && !sealedConfirmed) {
      toast({
        title: 'Confirmation required',
        description: 'Please confirm sealed bid requirements',
        variant: 'destructive',
      });
      return;
    }

    if (cpoRequired && !data.cpoDescription?.trim()) {
      toast({
        title: 'CPO description required',
        description: 'Please provide CPO requirements description',
        variant: 'destructive',
      });
      return;
    }

    if (visibilityType === 'invite_only' &&
      (!allowedCompanies.length && !allowedUsers.length && !data.invitedEmails?.length)) {
      toast({
        title: 'Invitations required',
        description: 'Please specify at least one invitation method for invite-only visibility',
        variant: 'destructive',
      });
      return;
    }

    if (evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight !== 100) {
      toast({
        title: 'Evaluation weights error',
        description: 'Technical and financial weights must sum to 100%',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData: CreateProfessionalTenderData = {
        ...data,
        tenderCategory: 'professional',
        deadline: new Date(data.deadline).toISOString(),
        deliverables: data.deliverables.map(d => ({
          ...d,
          deadline: new Date(d.deadline).toISOString(),
        })),
        milestones: data.milestones.map(m => ({
          ...m,
          dueDate: new Date(m.dueDate).toISOString(),
        })),
        clarificationDeadline: data.clarificationDeadline
          ? new Date(data.clarificationDeadline).toISOString()
          : undefined,
        preBidMeeting: data.preBidMeeting
          ? {
            ...data.preBidMeeting,
            date: new Date(data.preBidMeeting.date).toISOString(),
          }
          : undefined,
        timeline: data.timeline
          ? {
            ...data.timeline,
            startDate: new Date(data.timeline.startDate).toISOString(),
            endDate: new Date(data.timeline.endDate).toISOString(),
          }
          : undefined,
        fileDescriptions: uploadedFiles.map((_, index) => `File ${index + 1}`),
        fileTypes: uploadedFiles.map(() => 'technical_specifications'),
        cpoRequired: data.cpoRequired,
        cpoDescription: data.cpoRequired ? data.cpoDescription : undefined,
        sealedBidConfirmation: workflowType === 'closed' ? true : false,
        status: data.status, // Use the status from form (draft or published)
      };

      console.log('Submitting tender data:', submissionData);
      console.log('Files count:', uploadedFiles.length);
      console.log('Status:', submissionData.status);

      createTender(
        {
          data: submissionData,
          files: uploadedFiles,
        },
        {
          onSuccess: (response) => {
            toast({
              title: 'Tender created successfully',
              description: `Professional tender "${data.title}" has been ${data.status === 'published' ? 'published' : 'saved as draft'}`,
              variant: 'default',
            });

            // Redirect to company dashboard
            setTimeout(() => {
              router.push('/dashboard/company/my-tenders');
            }, 1500);
          },
          onError: (error: Error) => {
            toast({
              title: 'Failed to create tender',
              description: error.message || 'An error occurred while creating the tender',
              variant: 'destructive',
            });
            setIsSubmitting(false);
          },
          onSettled: () => {
            setIsSubmitting(false);
          },
        }
      );
    } catch (error: any) {
      console.error('Submission error:', error);
      toast({
        title: 'Submission error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    // Only validate and move to next step, don't submit
    const stepFields = getStepFields(currentStep);
    const isValid = await form.trigger(stepFields as any);

    if (isValid && currentStep < 6) {
      setCurrentStep(currentStep + 1);
    } else {
      const errors = form.formState.errors;
      const firstError = Object.keys(errors)[0] as keyof typeof errors;
      toast({
        title: 'Validation Error',
        description: typeof errors[firstError] === 'object' && errors[firstError] !== null && 'message' in errors[firstError]
          ? (errors[firstError] as { message?: string }).message || 'Please fill in all required fields correctly'
          : 'Please fill in all required fields correctly',
        variant: 'destructive',
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepFields = (step: number): string[] => {
    switch (step) {
      case 1:
        return ['title', 'referenceNumber', 'procurementCategory', 'procuringEntity', 'description'];
      case 2:
        return ['procurementMethod', 'deadline', 'timeline.startDate', 'timeline.endDate'];
      case 3:
        return ['minimumExperience', 'legalRegistrationRequired', 'financialCapacity.minAnnualTurnover'];
      case 4:
        return ['evaluationMethod', 'evaluationCriteria.technicalWeight', 'evaluationCriteria.financialWeight'];
      case 5:
        return ['cpoRequired', 'cpoDescription', 'workflowType', 'visibilityType'];
      case 6:
        return []; // No validation needed for final step, user chooses publish/draft
      default:
        return [];
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      form.setValue('skillsRequired', [...skills, skill]);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    form.setValue('skillsRequired', skills.filter(skill => skill !== skillToRemove));
  };

  const generateNewReference = () => {
    form.setValue('referenceNumber', generateReferenceNumber());
    toast({
      title: 'Reference number generated',
      description: 'New unique reference number has been created',
      variant: 'default',
    });
  };

  // Progress calculation
  const calculateProgress = () => {
    const totalSteps = 6;
    return Math.round((currentStep / totalSteps) * 100);
  };

  // Safely render categories in select
  const renderCategories = () => {
    if (loadingCategories) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn(
              "h-8 rounded animate-pulse",
              isDarkMode ? "bg-gray-700" : "bg-gray-100"
            )} />
          ))}
        </div>
      );
    }

    if (categoriesError) {
      return (
        <div className="p-4 text-center">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading categories</AlertTitle>
            <AlertDescription>
              Failed to load categories. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    if (!categories || Object.keys(categories).length === 0) {
      return (
        <div className="p-4 text-center">
          <p className={cn(
            "text-sm",
            isDarkMode ? "text-gray-400" : "text-gray-600"
          )}>No categories available</p>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      );
    }

    return Object.entries(categories).map(([groupKey, group]: [string, any]) => (
      <React.Fragment key={groupKey}>
        <div className={cn(
          "px-2 py-1.5 text-xs font-semibold border-b",
          isDarkMode
            ? "text-gray-400 bg-gray-800 border-gray-700"
            : "text-gray-600 bg-gray-50 border-gray-200"
        )}>
          {group.name}
        </div>
        {group.subcategories?.map((subcat: any) => (
          <SelectItem key={subcat.id} value={subcat.id}>
            {subcat.name}
          </SelectItem>
        ))}
      </React.Fragment>
    ));
  };

  // Render CPO Section
  const renderCPOSection = () => (
    <Card className={cn(
      "border shadow-sm",
      isDarkMode
        ? "border-gray-700 bg-gray-800"
        : "border-gray-200 bg-white"
    )}>
      <CardHeader className={cn(
        "border-b px-6 py-4",
        isDarkMode
          ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
          : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
      )}>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <CreditCard className="h-5 w-5" style={{ color: colors.secondary }} />
          Conditional Payment Order (CPO) Requirements
        </CardTitle>
        <CardDescription>
          Optional requirement for bidders to provide a CPO as financial guarantee
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        <FormField
          control={form.control}
          name="cpoRequired"
          render={({ field }) => (
            <FormItem className={cn(
              "flex flex-row items-center justify-between rounded-lg border p-4",
              isDarkMode
                ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}>
              <div className="space-y-0.5">
                <FormLabel className="text-base font-medium">
                  Require CPO Submission
                </FormLabel>
                <FormDescription>
                  Bidders must provide a Conditional Payment Order from a recognized bank
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  style={{ backgroundColor: field.value ? colors.secondary : undefined }}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {cpoRequired && (
          <FormField
            control={form.control}
            name="cpoDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  CPO Requirements Description <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Specify CPO requirements, minimum amount, validity period (e.g., 90 days), issuing bank requirements, submission deadline, etc."
                    className={cn(
                      "min-h-[120px] resize-none transition-all",
                      isDarkMode
                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    )}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Provide clear instructions for bidders regarding CPO submission. This will be included in the tender documents.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );

  // Enhanced Calendar Component
  const EnhancedCalendarTrigger = ({
    field,
    label,
    description,
    required = false,
  }: {
    field: any
    label: string
    description?: string
    required?: boolean
  }) => {
    const today = new Date().toISOString().split("T")[0]

    // Safe date formatting function
    const safeFormatDateDisplay = (dateString: string | undefined) => {
      if (!dateString) return "Pick a date";

      try {
        const date = new Date(dateString);
        if (isValid(date)) {
          return format(date, "PPP");
        }
        return "Invalid date";
      } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid date";
      }
    };

    return (
      <FormItem>
        <FormLabel className="font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </FormLabel>

        <Popover>
          <PopoverTrigger asChild>
            <FormControl>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal border transition-all duration-200",
                  isDarkMode
                    ? "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-700 hover:from-gray-700 hover:to-gray-800 text-gray-200"
                    : "bg-gradient-to-r from-indigo-50 to-gray-50 border-gray-300 hover:from-indigo-100 hover:to-gray-100 text-gray-900"
                )}
              >
                <CalendarIcon className={cn(
                  "mr-2 h-4 w-4",
                  isDarkMode ? "text-blue-400" : "text-indigo-600"
                )} />
                {field.value ? (
                  <span className={isDarkMode ? "text-gray-200" : "text-gray-900"}>
                    {safeFormatDateDisplay(field.value)}
                  </span>
                ) : (
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                    Pick a date
                  </span>
                )}
              </Button>
            </FormControl>
          </PopoverTrigger>

          <PopoverContent
            className={cn(
              "w-72 p-4 rounded-xl shadow-xl border animate-in fade-in-50",
              isDarkMode
                ? "bg-gradient-to-br from-gray-900 to-gray-950 text-white border-gray-700"
                : "bg-gradient-to-br from-slate-900 to-indigo-900 text-white border-gray-200"
            )}
            align="start"
          >
            <div className="space-y-3">
              <p className="text-sm text-slate-200">
                Select a date
              </p>

              <Input
                type="date"
                value={field.value || ""}
                min={today}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                className={cn(
                  "w-full border text-white focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all",
                  isDarkMode
                    ? "bg-white/10 border-white/20"
                    : "bg-white/10 border-white/20"
                )}
              />
            </div>
          </PopoverContent>
        </Popover>

        {description && (
          <FormDescription>
            {description}
          </FormDescription>
        )}

        <FormMessage />
      </FormItem>
    )
  }

  // Handle timeline duration calculation
  const handleTimelineDurationChange = (value: number, unit: 'days' | 'weeks' | 'months' | 'years') => {
    const startDate = form.getValues('timeline.startDate');
    if (startDate) {
      const start = new Date(startDate);
      let end = new Date(start);

      switch (unit) {
        case 'days':
          end.setDate(start.getDate() + value);
          break;
        case 'weeks':
          end.setDate(start.getDate() + (value * 7));
          break;
        case 'months':
          end.setMonth(start.getMonth() + value);
          break;
        case 'years':
          end.setFullYear(start.getFullYear() + value);
          break;
      }

      form.setValue('timeline.endDate', format(end, 'yyyy-MM-dd'));
    }

    form.setValue('timeline.duration', { value, unit });
  };

  // Handle timeline start/end date changes
  const handleStartDateChange = (date: string) => {
    form.setValue('timeline.startDate', date);
    const duration = form.getValues('timeline.duration');
    if (duration && duration.value > 0) {
      handleTimelineDurationChange(duration.value, duration.unit);
    }
  };

  const handleEndDateChange = (date: string) => {
    form.setValue('timeline.endDate', date);
    const startDate = form.getValues('timeline.startDate');
    if (startDate) {
      const start = new Date(startDate);
      const end = new Date(date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Calculate approximate duration in months
      const diffMonths = Math.round(diffDays / 30);
      form.setValue('timeline.duration', {
        value: diffMonths,
        unit: 'months'
      });
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDarkMode
                  ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                  : "bg-gradient-to-br from-blue-100 to-indigo-100"
              )}>
                <FileText className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">1. Tender Identification</h2>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Provide essential identification details for your tender
                </p>
              </div>
            </div>

            {/* Tender Identification Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Tag className="h-5 w-5" style={{ color: colors.primary }} />
                  Tender Identification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tender Title <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Construction of Office Building"
                          {...field}
                          className={cn(
                            "h-11 transition-all",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}
                        />
                      </FormControl>
                      <FormDescription>
                        Clear, descriptive title that summarizes the project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Reference Number <span className="text-red-500">*</span>
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="TDR-PRO-20241226-001"
                              {...field}
                              className={cn(
                                "h-11 flex-1 transition-all uppercase",
                                isDarkMode
                                  ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              )}
                              style={{ textTransform: 'uppercase' }}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateNewReference}
                            className={cn(
                              "border transition-all",
                              isDarkMode
                                ? "border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-200"
                                : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                            )}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate
                          </Button>
                        </div>
                        <FormDescription>
                          Unique identifier for this tender
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="procuringEntity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Procuring Entity <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Ministry of Infrastructure"
                            {...field}
                            className={cn(
                              "h-11 transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormDescription>
                          Name of the organization issuing this tender
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="procurementCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Procurement Category <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-11 transition-all",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={cn(
                          "border shadow-lg max-h-[300px] overflow-y-auto animate-in fade-in-50",
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        )}>
                          {renderCategories()}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the most appropriate category for this tender
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Description & Details Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <FileEdit className="h-5 w-5" style={{ color: colors.primary }} />
                  Description & Details
                </CardTitle>
                <CardDescription>
                  Detailed description of the tender requirements and scope
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Brief Description <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <RichTextEditor
                          value={field.value || ''}
                          onChange={field.onChange}
                          placeholder="Provide a detailed overview of the project, including scope, objectives, requirements..."
                          minHeight={300}
                        />
                      </FormControl>
                      <FormDescription>
                        Detailed description that will appear in the tender document
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <Label>Required Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {skills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="gap-1 pl-3 transition-all hover:scale-105"
                        style={{
                          backgroundColor: isDarkMode ? `${colors.primary}30` : `${colors.primary}15`,
                          color: colors.primary,
                          borderColor: isDarkMode ? `${colors.primary}50` : `${colors.primary}30`
                        }}
                      >
                        {skill}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 hover:bg-transparent"
                          onClick={() => removeSkill(skill)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          if (input.value.trim()) {
                            addSkill(input.value.trim());
                            input.value = '';
                          }
                        }
                      }}
                      className={cn(
                        "h-9 transition-all",
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      )}
                    />
                    <Select
                      onValueChange={(value) => addSkill(value)}
                    >
                      <SelectTrigger className={cn(
                        "h-9 w-[180px] transition-all",
                        isDarkMode
                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      )}>
                        <SelectValue placeholder="Suggested skills" />
                      </SelectTrigger>
                      <SelectContent className={cn(
                        "border shadow-lg animate-in fade-in-50",
                        isDarkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      )}>
                        {SKILLS_SUGGESTIONS.map((skill) => (
                          <SelectItem key={skill} value={skill}>
                            {skill}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDarkMode
                  ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                  : "bg-gradient-to-br from-blue-100 to-indigo-100"
              )}>
                <CalendarDays className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">2. Procurement Details & Timeline</h2>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Define procurement method, funding, and project timeline
                </p>
              </div>
            </div>

            {/* Procurement Details Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Briefcase className="h-5 w-5" style={{ color: colors.primary }} />
                  Procurement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="procurementMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Procurement Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            "h-11 transition-all",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={cn(
                          "border shadow-lg animate-in fade-in-50",
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        )}>
                          {PROCUREMENT_METHODS.filter(method =>
                            method.value === 'open_tender' || method.value === 'restricted'
                          ).map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              <div className="flex flex-col">
                                <span className="font-medium">{method.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select the procurement procedure to be followed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fundingSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Funding Source (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Government Budget, World Bank, etc."
                          {...field}
                          className={cn(
                            "h-11 transition-all",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}
                        />
                      </FormControl>
                      <FormDescription>
                        Source of funds for this procurement
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deadline"
                  render={({ field }) => (
                    <EnhancedCalendarTrigger
                      field={field}
                      label="Submission Deadline"
                      description="Last date and time for bid submission"
                      required={true}
                    />
                  )}
                />
              </CardContent>
            </Card>

            {/* Project Timeline Details Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-5 w-5" style={{ color: colors.primary }} />
                  Project Timeline Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="timeline.startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Start Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => handleStartDateChange(e.target.value)}
                            className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline.endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project End Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => handleEndDateChange(e.target.value)}
                            className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="timeline.duration.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Duration</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 1;
                              const unit = form.getValues('timeline.duration.unit') || 'months';
                              handleTimelineDurationChange(value, unit);
                            }}
                            className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="timeline.duration.unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration Unit</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const durationValue = form.getValues('timeline.duration.value') || 1;
                          handleTimelineDurationChange(durationValue, value as any);
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={cn(
                            "border shadow-lg animate-in fade-in-50",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          )}>
                            {TIME_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="bidValidityPeriod.value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Validity Period</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              form.setValue('bidValidityPeriod', {
                                ...form.getValues('bidValidityPeriod'),
                                value: value,
                              });
                            }}
                            className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormDescription>
                          How long bids must remain valid after submission
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bidValidityPeriod.unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Validity Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={cn(
                            "border shadow-lg animate-in fade-in-50",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          )}>
                            {BID_VALIDITY_UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="clarificationDeadline"
                  render={({ field }) => (
                    <EnhancedCalendarTrigger
                      field={field}
                      label="Clarification Deadline (Optional)"
                      description="Last date for bidders to submit clarification requests"
                    />
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDarkMode
                  ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                  : "bg-gradient-to-br from-blue-100 to-indigo-100"
              )}>
                <UserCheck className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">3. Eligibility & Requirements</h2>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Define qualification criteria and technical requirements for bidders
                </p>
              </div>
            </div>

            {/* Professional Requirements Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <ClipboardList className="h-5 w-5" style={{ color: colors.primary }} />
                  Professional Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="minimumExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Company Experience (Years)</FormLabel>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className={cn(
                            "text-sm",
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          )}>0</span>
                          <span className="text-lg font-semibold" style={{ color: colors.primary }}>{field.value} years</span>
                          <span className={cn(
                            "text-sm",
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          )}>50+</span>
                        </div>
                        <Slider
                          min={0}
                          max={50}
                          step={1}
                          value={[field.value ?? 0]}
                          onValueChange={(value) => field.onChange(value[0])}
                          className="w-full transition-all"
                        />
                      </div>
                      <FormDescription>
                        Minimum years of relevant experience required
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legalRegistrationRequired"
                  render={({ field }) => (
                    <FormItem className={cn(
                      "flex flex-row items-center justify-between rounded-lg border p-4 transition-all hover:border",
                      isDarkMode
                        ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    )}>
                      <div className="space-y-0.5">
                        <FormLabel className="text-base font-medium">Legal Registration Required</FormLabel>
                        <FormDescription>
                          Bidders must be legally registered entities
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          style={{ backgroundColor: field.value ? colors.secondary : undefined }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Financial Capacity Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <DollarSign className="h-5 w-5" style={{ color: colors.primary }} />
                  Financial Capacity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Controller
                    name="financialCapacity.minAnnualTurnover"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Annual Turnover</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={1000}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Controller
                    name="financialCapacity.currency"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={cn(
                            "transition-all",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent className={cn(
                            "border shadow-lg animate-in fade-in-50",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          )}>
                            {CURRENCIES.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="pastProjectReferences.minCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Past Project References</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const pastProjectReferences = form.getValues('pastProjectReferences');
                              form.setValue('pastProjectReferences', {
                                ...pastProjectReferences,
                                minCount: value,
                                similarValueProjects: pastProjectReferences?.similarValueProjects ?? false,
                              });
                            }}
                            className={cn(
                              "transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum number of similar past projects required
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pastProjectReferences.similarValueProjects"
                    render={({ field }) => (
                      <FormItem className={cn(
                        "flex flex-row items-center justify-between rounded-lg border p-4 transition-all hover:border",
                        isDarkMode
                          ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      )}>
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-medium">Similar Value Projects Required</FormLabel>
                          <FormDescription>
                            Past projects must be of similar value
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            style={{ backgroundColor: field.value ? colors.secondary : undefined }}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Required Certifications Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Award className="h-5 w-5" style={{ color: colors.primary }} />
                    Required Certifications
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      certificationFields.append({
                        name: '',
                        issuingAuthority: '',
                      })
                    }
                    className={cn(
                      "border transition-all",
                      isDarkMode
                        ? "border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-200"
                        : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
                <CardDescription>
                  List all required certifications for bidders
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {certificationFields.fields.length === 0 ? (
                  <div className={cn(
                    "text-center py-8 border-2 border-dashed rounded-lg transition-all",
                    isDarkMode
                      ? "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                      : "border-gray-300 bg-gray-50 hover:border-gray-400"
                  )}>
                    <Award className={cn(
                      "h-12 w-12 mx-auto mb-4",
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    )} />
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No certifications required</p>
                    <p className={cn(
                      "text-sm mt-1",
                      isDarkMode ? "text-gray-500" : "text-gray-500"
                    )}>
                      Click `Add Certification` to specify required certifications
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {certificationFields.fields.map((field, index) => (
                      <Card key={field.id} className={cn(
                        "border transition-all hover:shadow-md",
                        isDarkMode
                          ? "border-gray-700 bg-gray-800"
                          : "border-gray-200"
                      )}>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn(
                              isDarkMode
                                ? "bg-gray-700 text-gray-200 border-gray-600"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            )}>
                              Certification {index + 1}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => certificationFields.remove(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`requiredCertifications.${index}.name`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Certification Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="e.g., ISO 9001:2015"
                                      className={cn(
                                        "transition-all",
                                        isDarkMode
                                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`requiredCertifications.${index}.issuingAuthority`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Issuing Authority</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="e.g., International Organization for Standardization"
                                      className={cn(
                                        "transition-all",
                                        isDarkMode
                                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDarkMode
                  ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                  : "bg-gradient-to-br from-blue-100 to-indigo-100"
              )}>
                <BarChart className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">4. Evaluation & Submission</h2>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Define evaluation criteria and submission requirements
                </p>
              </div>
            </div>

            {/* Evaluation Criteria Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <FileBarChart className="h-5 w-5" style={{ color: colors.primary }} />
                  Evaluation Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="evaluationMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evaluation Method</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={cn(
                            "transition-all",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className={cn(
                          "border shadow-lg animate-in fade-in-50",
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        )}>
                          {EVALUATION_METHODS.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Method used to evaluate bids
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {evaluationMethod === 'combined' && (
                  <Controller
                    name="evaluationCriteria"
                    control={form.control}
                    render={({ field }) => {
                      const total = (field.value?.technicalWeight || 0) + (field.value?.financialWeight || 0);
                      const isValid = total === 100;

                      return (
                        <FormItem>
                          <FormLabel>Evaluation Weights</FormLabel>
                          <div className="space-y-6">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">Technical Weight</div>
                                  <div className="text-sm font-semibold" style={{ color: colors.primary }}>
                                    {field.value?.technicalWeight || 0}%
                                  </div>
                                </div>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[field.value?.technicalWeight || 0]}
                                  onValueChange={(value) => {
                                    const techWeight = value[0];
                                    const finWeight = 100 - techWeight;
                                    field.onChange({
                                      technicalWeight: techWeight,
                                      financialWeight: finWeight,
                                    });
                                  }}
                                  className="w-full transition-all"
                                />
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-medium">Financial Weight</div>
                                  <div className="text-sm font-semibold" style={{ color: colors.primary }}>
                                    {field.value?.financialWeight || 0}%
                                  </div>
                                </div>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[field.value?.financialWeight || 0]}
                                  onValueChange={(value) => {
                                    const finWeight = value[0];
                                    const techWeight = 100 - finWeight;
                                    field.onChange({
                                      technicalWeight: techWeight,
                                      financialWeight: finWeight,
                                    });
                                  }}
                                  className="w-full transition-all"
                                />
                              </div>
                            </div>

                            <div className={cn(
                              "p-3 rounded-lg border transition-all",
                              isValid
                                ? isDarkMode
                                  ? "bg-blue-900/20 border-blue-700"
                                  : "bg-blue-50 border-blue-200"
                                : isDarkMode
                                  ? "bg-red-900/20 border-red-700"
                                  : "bg-red-50 border-red-200"
                            )}>
                              <div className="flex items-center justify-between">
                                <span className={cn(
                                  "text-sm font-medium",
                                  isValid
                                    ? isDarkMode ? "text-blue-300" : "text-blue-700"
                                    : isDarkMode ? "text-red-300" : "text-red-700"
                                )}>
                                  Total Weight
                                </span>
                                <span className={cn(
                                  "text-sm font-semibold",
                                  isValid
                                    ? isDarkMode ? "text-green-400" : "text-green-600"
                                    : isDarkMode ? "text-red-400" : "text-red-600"
                                )}>
                                  {total}%
                                </span>
                              </div>
                              {!isValid && (
                                <p className={cn(
                                  "text-sm mt-1",
                                  isDarkMode ? "text-red-400" : "text-red-600"
                                )}>
                                  Technical and financial weights must sum to 100%
                                </p>
                              )}
                              {isValid && (
                                <p className={cn(
                                  "text-sm mt-1",
                                  isDarkMode ? "text-green-400" : "text-green-600"
                                )}>
                                  ✓ Weights are properly balanced
                                </p>
                              )}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Project Scope & Deliverables Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Target className="h-5 w-5" style={{ color: colors.primary }} />
                  Project Scope & Deliverables
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <FormField
                  control={form.control}
                  name="projectObjectives"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Objectives</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the main objectives and goals of the project..."
                          className={cn(
                            "min-h-[100px] resize-none transition-all",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                          )}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Clear objectives help bidders understand project goals
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <Label>Deliverables</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        deliverablesFields.append({
                          title: '',
                          description: '',
                          deadline: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
                        })
                      }
                      className={cn(
                        "border transition-all",
                        isDarkMode
                          ? "border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-200"
                          : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                      )}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Deliverable
                    </Button>
                  </div>

                  {deliverablesFields.fields.length === 0 ? (
                    <div className={cn(
                      "text-center py-6 border-2 border-dashed rounded-lg transition-all",
                      isDarkMode
                        ? "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                        : "border-gray-300 bg-gray-50 hover:border-gray-400"
                    )}>
                      <FileText className={cn(
                        "h-10 w-10 mx-auto mb-2",
                        isDarkMode ? "text-gray-500" : "text-gray-400"
                      )} />
                      <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No deliverables defined</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deliverablesFields.fields.map((field, index) => (
                        <Card key={field.id} className={cn(
                          "border p-4 transition-all hover:shadow-md",
                          isDarkMode
                            ? "border-gray-700 bg-gray-800"
                            : "border-gray-200"
                        )}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={cn(
                                isDarkMode
                                  ? "bg-gray-700 text-gray-200 border-gray-600"
                                  : "bg-gray-100 text-gray-800 border-gray-200"
                              )}>
                                {index + 1}
                              </Badge>
                              <span className="font-medium">
                                {form.watch(`deliverables.${index}.title`) || `Deliverable ${index + 1}`}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deliverablesFields.remove(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name={`deliverables.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Title</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Final Report" className={cn(
                                      "transition-all",
                                      isDarkMode
                                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    )} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`deliverables.${index}.deadline`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Deadline</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} className={cn(
                                      "transition-all",
                                      isDarkMode
                                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    )} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`deliverables.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">Description</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Detailed description of this deliverable..."
                                      rows={2}
                                      className={cn(
                                        "transition-all",
                                        isDarkMode
                                          ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      )}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Milestones Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Percent className="h-5 w-5" style={{ color: colors.primary }} />
                    Payment Milestones
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      milestonesFields.append({
                        title: '',
                        description: '',
                        dueDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
                        paymentPercentage: 0,
                      })
                    }
                    className={cn(
                      "border transition-all",
                      isDarkMode
                        ? "border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-200"
                        : "border-gray-300 hover:bg-gray-50 hover:border-gray-400"
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </div>
                <CardDescription>
                  Define payment schedule and milestones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {milestonesFields.fields.length === 0 ? (
                  <div className={cn(
                    "text-center py-8 border-2 border-dashed rounded-lg transition-all",
                    isDarkMode
                      ? "border-gray-600 bg-gray-800/50 hover:border-gray-500"
                      : "border-gray-300 bg-gray-50 hover:border-gray-400"
                  )}>
                    <DollarSign className={cn(
                      "h-12 w-12 mx-auto mb-4",
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    )} />
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>No milestones added yet</p>
                    <p className={cn(
                      "text-sm mt-1",
                      isDarkMode ? "text-gray-500" : "text-gray-500"
                    )}>
                      Click `Add Milestone` to define payment schedule
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestonesFields.fields.map((field, index) => (
                      <Card key={field.id} className={cn(
                        "border transition-all hover:shadow-md",
                        isDarkMode
                          ? "border-gray-700 bg-gray-800"
                          : "border-gray-200"
                      )}>
                        <CardContent className="p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className={cn(
                              isDarkMode
                                ? "bg-gray-700 text-gray-200 border-gray-600"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            )}>
                              Milestone {index + 1}
                            </Badge>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => milestonesFields.remove(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <FormField
                            control={form.control}
                            name={`milestones.${index}.title`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Phase 1 Completion" className={cn(
                                    "transition-all",
                                    isDarkMode
                                      ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  )} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`milestones.${index}.dueDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Due Date</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} className={cn(
                                      "transition-all",
                                      isDarkMode
                                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    )} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`milestones.${index}.paymentPercentage`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Payment Percentage</FormLabel>
                                  <div className="flex items-center gap-2">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                        className={cn(
                                          "transition-all",
                                          isDarkMode
                                            ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        )}
                                      />
                                    </FormControl>
                                    <span className={cn(
                                      "text-sm",
                                      isDarkMode ? "text-gray-400" : "text-gray-600"
                                    )}>%</span>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`milestones.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea
                                    {...field}
                                    placeholder="Description of this milestone..."
                                    rows={2}
                                    className={cn(
                                      "transition-all",
                                      isDarkMode
                                        ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    )}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDarkMode
                  ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                  : "bg-gradient-to-br from-blue-100 to-indigo-100"
              )}>
                <Shield className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">5. CPO, Compliance & Visibility</h2>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Configure CPO requirements, workflow, and visibility settings
                </p>
              </div>
            </div>

            {/* CPO Requirements */}
            {renderCPOSection()}

            <div className="space-y-6">
              {/* Workflow Type Card */}
              <Card className={cn(
                "border shadow-sm",
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              )}>
                <CardHeader className={cn(
                  "border-b px-6 py-4",
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
                )}>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <FileCheck className="h-5 w-5" style={{ color: colors.primary }} />
                    Workflow Type
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <FormField
                    control={form.control}
                    name="workflowType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workflow Type</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-4"
                        >
                          {WORKFLOW_TYPES.map((type) => (
                            <FormItem key={type.value} className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={type.value} />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex-1">
                                <div className={cn(
                                  "flex items-center gap-4 p-3 border rounded-lg hover:bg transition-all duration-200",
                                  isDarkMode
                                    ? "border-gray-700 hover:bg-gray-700/50"
                                    : "border-gray-200 hover:bg-gray-50"
                                )}>
                                  {type.value === 'open' ? (
                                    <div className={cn(
                                      "w-12 h-12 rounded-lg flex items-center justify-center",
                                      isDarkMode
                                        ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                                        : "bg-gradient-to-br from-blue-100 to-indigo-100"
                                    )}>
                                      <Globe className="w-6 h-6" style={{ color: colors.primary }} />
                                    </div>
                                  ) : (
                                    <div className={cn(
                                      "w-12 h-12 rounded-lg flex items-center justify-center",
                                      isDarkMode
                                        ? "bg-gradient-to-br from-amber-900/50 to-orange-900/50"
                                        : "bg-gradient-to-br from-amber-100 to-orange-100"
                                    )}>
                                      <Lock className="w-6 h-6" style={{ color: colors.accent }} />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-sm mt-1">
                                      {type.description}
                                    </div>
                                  </div>
                                </div>
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                        <FormDescription className="mt-4">
                          Choose between open proposals or sealed bids
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {workflowType === 'closed' && (
                    <Alert className={cn(
                      "border transition-all",
                      isDarkMode
                        ? "border-yellow-800 bg-yellow-900/20 text-yellow-200"
                        : "border-yellow-200 bg-yellow-50 text-yellow-800"
                    )}>
                      <Shield className="h-4 w-4" />
                      <AlertTitle>Sealed Bid Process</AlertTitle>
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">
                          By selecting closed workflow, you confirm that:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Proposals will remain sealed until the deadline</li>
                          <li>No bid amounts will be visible before reveal</li>
                          <li>All bids will be opened simultaneously after deadline</li>
                          <li>This process cannot be reversed once published</li>
                        </ul>
                        <div className="flex items-center gap-2 mt-4">
                          <Checkbox
                            checked={sealedConfirmed}
                            onCheckedChange={(checked) =>
                              setSealedConfirmed(checked as boolean)
                            }
                            id="sealed-confirm"
                            className={cn(
                              "transition-all",
                              isDarkMode
                                ? "border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                : "border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            )}
                          />
                          <Label htmlFor="sealed-confirm" className={cn(
                            "text-sm font-normal",
                            isDarkMode ? "text-yellow-200" : "text-yellow-800"
                          )}>
                            I understand and confirm the sealed bid requirements
                          </Label>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Visibility Settings Card */}
              <Card className={cn(
                "border shadow-sm",
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              )}>
                <CardHeader className={cn(
                  "border-b px-6 py-4",
                  isDarkMode
                    ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
                )}>
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                    <Eye className="h-5 w-5" style={{ color: colors.primary }} />
                    Visibility Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <FormField
                    control={form.control}
                    name="visibilityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Visibility Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className={cn(
                              "h-11 transition-all",
                              isDarkMode
                                ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            )}>
                              <SelectValue placeholder="Select visibility" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className={cn(
                            "border shadow-lg animate-in fade-in-50",
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          )}>
                            {VISIBILITY_TYPES.filter(v => v.value !== 'freelancers_only').map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Control who can see and apply to this tender
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {visibilityType === 'invite_only' && (
                    <div className="space-y-4">
                      <Tabs value={invitationMethod} onValueChange={(v) => setInvitationMethod(v as any)}>
                        <TabsList className={cn(
                          "grid grid-cols-3 w-full",
                          isDarkMode ? "bg-gray-700" : "bg-gray-100"
                        )}>
                          <TabsTrigger value="companies" className={cn(
                            "transition-all",
                            isDarkMode
                              ? "data-[state=active]:bg-gray-800"
                              : "data-[state=active]:bg-white"
                          )}>
                            <Building2 className="h-4 w-4 mr-2" />
                            Companies
                          </TabsTrigger>
                          <TabsTrigger value="users" className={cn(
                            "transition-all",
                            isDarkMode
                              ? "data-[state=active]:bg-gray-800"
                              : "data-[state=active]:bg-white"
                          )}>
                            <Users className="h-4 w-4 mr-2" />
                            Users
                          </TabsTrigger>
                          <TabsTrigger value="emails" className={cn(
                            "transition-all",
                            isDarkMode
                              ? "data-[state=active]:bg-gray-800"
                              : "data-[state=active]:bg-white"
                          )}>
                            <Mail className="h-4 w-4 mr-2" />
                            Emails
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="companies" className="space-y-4 animate-in fade-in-50">
                          <div className="space-y-2">
                            <Label>Invite Specific Companies</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Search companies..."
                                className={cn(
                                  "transition-all",
                                  isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                )}
                              />
                              <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white transition-all">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {allowedCompanies.length > 0 && (
                              <div className="space-y-2 mt-3">
                                <Label className="text-sm">Selected Companies</Label>
                                <div className="space-y-1">
                                  {allowedCompanies.map((company, index) => (
                                    <div key={index} className={cn(
                                      "flex items-center justify-between p-2 rounded transition-all",
                                      isDarkMode
                                        ? "bg-gray-700 hover:bg-gray-600"
                                        : "bg-gray-50 hover:bg-gray-100"
                                    )}>
                                      <span className="text-sm">{company}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          const newCompanies = [...allowedCompanies];
                                          newCompanies.splice(index, 1);
                                          form.setValue('allowedCompanies', newCompanies);
                                        }}
                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                        <TabsContent value="users" className="space-y-4 animate-in fade-in-50">
                          <div className="space-y-2">
                            <Label>Invite Specific Users</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder="Search users..."
                                className={cn(
                                  "transition-all",
                                  isDarkMode
                                    ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                )}
                              />
                              <Button type="button" className="bg-blue-600 hover:bg-blue-700 text-white transition-all">
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="emails" className="space-y-4 animate-in fade-in-50">
                          <div className="space-y-2">
                            <Label>Invite by Email</Label>
                            <Textarea
                              placeholder="Enter email addresses (comma-separated)"
                              className={cn(
                                "min-h-[100px] resize-none transition-all",
                                isDarkMode
                                  ? "bg-gray-800 border-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                                  : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                              )}
                            />
                            <FormDescription>
                              Enter email addresses separated by commas
                            </FormDescription>
                          </div>
                        </TabsContent>
                      </Tabs>

                      {(allowedCompanies.length === 0 && form.watch('allowedUsers')?.length === 0) && (
                        <Alert className={cn(
                          "border transition-all",
                          isDarkMode
                            ? "border-yellow-800 bg-yellow-900/20 text-yellow-200"
                            : "border-yellow-200 bg-yellow-50 text-yellow-800"
                        )}>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            For invite-only visibility, you must specify at least one company, user, or email.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center gap-3 mb-6">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                isDarkMode
                  ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                  : "bg-gradient-to-br from-blue-100 to-indigo-100"
              )}>
                <FileUp className="h-6 w-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">6. Review & Finalize</h2>
                <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                  Review deadlines, upload documents, and finalize your tender
                </p>
              </div>
            </div>

            {/* Documents & Attachments Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <Upload className="h-5 w-5" style={{ color: colors.primary }} />
                  Documents & Attachments
                </CardTitle>
                <CardDescription>
                  Upload supporting documents (max {form.watch('maxFileCount') || 20} files, {formatFileSize(form.watch('maxFileSize') || FILE_UPLOAD_CONSTRAINTS.maxFileSize)} each)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer",
                      isDarkMode
                        ? "border-gray-600 bg-gray-800/50 hover:border-blue-500 hover:bg-blue-900/20"
                        : "border-gray-300 bg-gray-50 hover:border-blue-500 hover:bg-blue-50"
                    )}
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    <Input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      accept={FILE_UPLOAD_CONSTRAINTS.allowedTypes.join(',')}
                    />
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4",
                      isDarkMode
                        ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                        : "bg-gradient-to-br from-blue-100 to-indigo-100"
                    )}>
                      <Upload className="w-6 h-6" style={{ color: colors.primary }} />
                    </div>
                    <div>
                      <p className="font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className={cn(
                        "text-sm mt-1",
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      )}>
                        Supports: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, Images, ZIP
                      </p>
                    </div>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Uploaded Files ({uploadedFiles.length})
                        </Label>
                        <span className={cn(
                          "text-xs",
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {uploadedFiles.reduce((acc, file) => acc + file.size, 0) > 0
                            ? `Total: ${formatFileSize(uploadedFiles.reduce((acc, file) => acc + file.size, 0))}`
                            : ''}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {uploadedFiles.map((file, index) => (
                          <Card key={index} className={cn(
                            "p-3 border transition-all hover:shadow-md",
                            isDarkMode
                              ? "border-gray-700 bg-gray-800"
                              : "border-gray-200"
                          )}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <FileText className={cn(
                                  "w-5 h-5 mt-0.5",
                                  isDarkMode ? "text-gray-400" : "text-gray-400"
                                )} />
                                <div>
                                  <p className="font-medium text-sm">{file.name}</p>
                                  <p className={cn(
                                    "text-xs",
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                  )}>
                                    {formatFileSize(file.size)} • {file.type}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Input
                                      placeholder="Description"
                                      className={cn(
                                        "w-40 h-8 text-xs transition-all",
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      )}
                                    />
                                    <Select defaultValue="technical_specifications">
                                      <SelectTrigger className={cn(
                                        "w-40 h-8 text-xs transition-all",
                                        isDarkMode
                                          ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500"
                                          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                      )}>
                                        <SelectValue placeholder="Type" />
                                      </SelectTrigger>
                                      <SelectContent className={cn(
                                        "border shadow-lg animate-in fade-in-50",
                                        isDarkMode
                                          ? "bg-gray-800 border-gray-700"
                                          : "bg-white border-gray-200"
                                      )}>
                                        {DOCUMENT_TYPES.map((type) => (
                                          <SelectItem key={type} value={type} className="text-xs">
                                            {type.replace(/_/g, ' ').toUpperCase()}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeUploadedFile(index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-all"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Final Validation & Submission Card */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardHeader className={cn(
                "border-b px-6 py-4",
                isDarkMode
                  ? "bg-gradient-to-r from-blue-900/30 to-indigo-900/30 border-gray-700"
                  : "bg-gradient-to-r from-blue-50 to-indigo-50 border-gray-200"
              )}>
                <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                  <CheckCircle className="h-5 w-5" style={{ color: colors.secondary }} />
                  Final Validation & Submission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                <div className="space-y-4">
                  <div className={cn(
                    "p-4 rounded-lg border transition-all",
                    evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight === 100
                      ? isDarkMode
                        ? "bg-blue-900/20 border-blue-700"
                        : "bg-blue-50 border-blue-200"
                      : isDarkMode
                        ? "bg-red-900/20 border-red-700"
                        : "bg-red-50 border-red-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight === 100
                          ? "bg-green-500"
                          : "bg-red-500"
                      )}>
                        {evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight === 100 ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">Evaluation Weights</div>
                        <div className={cn(
                          "text-sm",
                          evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight === 100
                            ? isDarkMode ? "text-green-400" : "text-green-600"
                            : isDarkMode ? "text-red-400" : "text-red-600"
                        )}>
                          {evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight === 100
                            ? '✓ Weights properly balanced (100%)'
                            : `✗ Weights sum to ${evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight}% (must be 100%)`
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "p-4 rounded-lg border transition-all",
                    cpoRequired
                      ? (form.getValues('cpoDescription')?.trim()
                        ? isDarkMode
                          ? "bg-blue-900/20 border-blue-700"
                          : "bg-blue-50 border-blue-200"
                        : isDarkMode
                          ? "bg-red-900/20 border-red-700"
                          : "bg-red-50 border-red-200")
                      : isDarkMode
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-50 border-gray-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        cpoRequired
                          ? (form.getValues('cpoDescription')?.trim() ? "bg-green-500" : "bg-red-500")
                          : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                      )}>
                        {cpoRequired ? (
                          form.getValues('cpoDescription')?.trim() ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-white" />
                          )
                        ) : (
                          <Check className={cn(
                            "h-4 w-4",
                            isDarkMode ? "text-gray-400" : "text-gray-400"
                          )} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">CPO Requirements</div>
                        <div className={cn(
                          "text-sm",
                          cpoRequired
                            ? (form.getValues('cpoDescription')?.trim()
                              ? isDarkMode ? "text-green-400" : "text-green-600"
                              : isDarkMode ? "text-red-400" : "text-red-600")
                            : isDarkMode ? "text-gray-400" : "text-gray-600"
                        )}>
                          {cpoRequired
                            ? (form.getValues('cpoDescription')?.trim()
                              ? '✓ CPO description provided'
                              : '✗ CPO description required')
                            : 'CPO not required'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  {workflowType === 'closed' && (
                    <div className={cn(
                      "p-4 rounded-lg border transition-all",
                      sealedConfirmed
                        ? isDarkMode
                          ? "bg-blue-900/20 border-blue-700"
                          : "bg-blue-50 border-blue-200"
                        : isDarkMode
                          ? "bg-red-900/20 border-red-700"
                          : "bg-red-50 border-red-200"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                          sealedConfirmed ? "bg-green-500" : "bg-red-500"
                        )}>
                          {sealedConfirmed ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">Sealed Bid Confirmation</div>
                          <div className={cn(
                            "text-sm",
                            sealedConfirmed
                              ? isDarkMode ? "text-green-400" : "text-green-600"
                              : isDarkMode ? "text-red-400" : "text-red-600"
                          )}>
                            {sealedConfirmed
                              ? '✓ Sealed bid requirements confirmed'
                              : '✗ Sealed bid confirmation required'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Publication Options */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Publication Status</FormLabel>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-4"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="draft" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              <div className={cn(
                                "flex items-center gap-4 p-3 border rounded-lg hover:bg transition-all duration-200",
                                isDarkMode
                                  ? "border-gray-700 hover:bg-gray-700/50"
                                  : "border-gray-200 hover:bg-gray-50"
                              )}>
                                <div className={cn(
                                  "w-12 h-12 rounded-lg flex items-center justify-center",
                                  isDarkMode
                                    ? "bg-gray-700"
                                    : "bg-gray-100"
                                )}>
                                  <Save className={cn(
                                    "w-6 h-6",
                                    isDarkMode ? "text-gray-400" : "text-gray-600"
                                  )} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">Save as Draft</div>
                                  <div className="text-sm">
                                    Keep tender private for further editing. You can publish it later.
                                  </div>
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="published" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              <div className={cn(
                                "flex items-center gap-4 p-3 border rounded-lg hover:bg transition-all duration-200",
                                isDarkMode
                                  ? "border-gray-700 hover:bg-gray-700/50"
                                  : "border-gray-200 hover:bg-gray-50"
                              )}>
                                <div className={cn(
                                  "w-12 h-12 rounded-lg flex items-center justify-center",
                                  isDarkMode
                                    ? "bg-gradient-to-br from-blue-900/50 to-indigo-900/50"
                                    : "bg-gradient-to-br from-blue-100 to-indigo-100"
                                )}>
                                  <Eye className="w-6 h-6" style={{ color: colors.primary }} />
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium">Publish Immediately</div>
                                  <div className="text-sm">
                                    Make tender visible to eligible bidders immediately
                                  </div>
                                </div>
                              </div>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {workflowType === 'closed' && !sealedConfirmed && (
                    <Alert variant="destructive" className="transition-all">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Action Required</AlertTitle>
                      <AlertDescription>
                        You must confirm the sealed bid requirements before publishing
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "min-h-screen",
      isDarkMode
        ? "bg-gradient-to-b from-gray-900 to-gray-950"
        : "bg-gradient-to-b from-gray-50 to-gray-100"
    )}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-8">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className={cn(
                  "transition-colors",
                  isDarkMode
                    ? "text-gray-400 hover:text-blue-400"
                    : "text-gray-600 hover:text-blue-600"
                )}
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/tenders"
                className={cn(
                  "transition-colors",
                  isDarkMode
                    ? "text-gray-400 hover:text-blue-400"
                    : "text-gray-600 hover:text-blue-600"
                )}
              >
                Tenders
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">
                {editMode ? 'Edit Professional Tender' : 'Create Professional Tender'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {editMode ? 'Edit Professional Tender' : 'Create Professional Tender'}
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {editMode ? 'Update your professional tender details' : 'Create a detailed professional tender for companies and organizations'}
          </p>
        </div>

        <Form {...form}>
          {/* Progress Steps */}
          <Card className={cn(
            "border shadow-sm mb-6",
            isDarkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          )}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                {[1, 2, 3, 4, 5, 6].map((step) => (
                  <React.Fragment key={step}>
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 border-2 shadow-md",
                          step === currentStep
                            ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-blue-600"
                            : step < currentStep
                              ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white border-green-500"
                              : isDarkMode
                                ? "bg-gray-700 text-gray-400 border-gray-600"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                        )}
                      >
                        {step < currentStep ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          step
                        )}
                      </div>
                      <span className={cn(
                        "mt-2 text-xs font-medium text-center",
                        isDarkMode ? "text-gray-400" : "text-gray-700"
                      )}>
                        {step === 1 && 'Identification'}
                        {step === 2 && 'Procurement'}
                        {step === 3 && 'Eligibility'}
                        {step === 4 && 'Evaluation'}
                        {step === 5 && 'CPO & Visibility'}
                        {step === 6 && 'Finalize'}
                      </span>
                    </div>
                    {step < 6 && (
                      <div
                        className={cn(
                          "flex-1 h-1 mx-2 transition-all duration-300",
                          step < currentStep
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : isDarkMode
                              ? "bg-gray-700"
                              : "bg-gray-200"
                        )}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                    Step {currentStep} of 6
                  </span>
                  <span className="font-medium" style={{ color: colors.primary }}>
                    {calculateProgress()}% complete
                  </span>
                </div>
                <Progress
                  value={calculateProgress()}
                  className="h-2 transition-all duration-300"
                />
              </div>
            </CardContent>
          </Card>

          {/* Step Content */}
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <Card className={cn(
              "border shadow-sm",
              isDarkMode
                ? "border-gray-700 bg-gray-800"
                : "border-gray-200 bg-white"
            )}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    {currentStep > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={creating || isSubmitting}
                        className={cn(
                          "w-full sm:w-auto border transition-all",
                          isDarkMode
                            ? "border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-200"
                            : "border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700"
                        )}
                      >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                      </Button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowPreview(true)}
                      disabled={creating || isSubmitting}
                      className={cn(
                        "w-full sm:w-auto border transition-all",
                        isDarkMode
                          ? "border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-200"
                          : "border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700"
                      )}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>

                    {currentStep < 6 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        Next Step
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={
                          creating ||
                          isSubmitting ||
                          (workflowType === 'closed' && !sealedConfirmed) ||
                          (cpoRequired && !form.getValues('cpoDescription')?.trim()) ||
                          (evaluationCriteria.technicalWeight + evaluationCriteria.financialWeight !== 100)
                        }
                        className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting || creating ? (
                          <>
                            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            {form.watch('status') === 'published' ? 'Publishing...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            {form.watch('status') === 'published' ? 'Publish Tender' : 'Save as Draft'}
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className={cn(
            "max-w-4xl max-h-[90vh] overflow-y-auto border shadow-xl",
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          )}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" style={{ color: colors.primary }} />
                Tender Preview
              </DialogTitle>
              <DialogDescription>
                Review your tender before submission
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <Card className={cn(
                "border",
                isDarkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              )}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{form.watch('title') || 'Untitled Tender'}</CardTitle>
                      <CardDescription>
                        Reference: {form.watch('referenceNumber') || 'N/A'}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={cn(
                      isDarkMode
                        ? "bg-gray-700 text-gray-200 border-gray-600"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    )}>
                      {form.watch('status') === 'published' ? 'PUBLISHED' : 'DRAFT'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Procuring Entity</Label>
                      <p className="text-sm font-medium">{form.watch('procuringEntity') || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Deadline</Label>
                      <p className="text-sm font-medium">
                        {safeFormatDate(form.watch('deadline'))}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Workflow</Label>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        isDarkMode
                          ? "bg-blue-900/30 text-blue-300 border-blue-700"
                          : "bg-blue-100 text-blue-800 border-blue-200"
                      )}>
                        {WORKFLOW_TYPES.find(t => t.value === form.watch('workflowType'))?.label || 'Open'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Visibility</Label>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        isDarkMode
                          ? "bg-gray-700 text-gray-200 border-gray-600"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      )}>
                        {VISIBILITY_TYPES.find(t => t.value === form.watch('visibilityType'))?.label || 'Public'}
                      </Badge>
                    </div>
                  </div>

                  <Separator className={isDarkMode ? "bg-gray-700" : "bg-gray-200"} />

                  <div>
                    <Label className="text-xs font-medium mb-2">Description</Label>
                    <div className="text-sm prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: form.watch('description') || 'No description provided' }} />
                    </div>
                  </div>

                  {cpoRequired && (
                    <div>
                      <Label className="text-xs font-medium mb-2">CPO Requirements</Label>
                      <div className="text-sm">
                        {form.watch('cpoDescription') || 'No CPO requirements specified'}
                      </div>
                    </div>
                  )}

                  {(form.watch('deliverables')?.length ?? 0) > 0 && (
                    <div>
                      <Label className="text-xs font-medium mb-2">Deliverables</Label>
                      <ul className="space-y-2">
                        {form.watch('deliverables')?.map((d, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors.primary, marginTop: '0.375rem' }} />
                            <div>
                              <span className="text-sm font-medium">{d.title}</span>
                              <p className="text-sm">{d.description}</p>
                              <p className={cn(
                                "text-xs",
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              )}>
                                Due: {safeFormatDate(d.deadline)}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="pt-4 border-t" style={isDarkMode ? { borderColor: '#374151' } : { borderColor: '#E5E7EB' }}>
              <Button
                variant="outline"
                onClick={() => setShowPreview(false)}
                className={cn(
                  "border transition-all",
                  isDarkMode
                    ? "border-gray-700 hover:bg-gray-700 hover:border-gray-600 text-gray-200"
                    : "border-gray-300 hover:bg-gray-50 hover:border-gray-400 text-gray-700"
                )}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setShowPreview(false);
                  form.handleSubmit(handleFormSubmit)();
                }}
                disabled={creating || isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300"
              >
                Submit Tender
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ProfessionalTenderForm;