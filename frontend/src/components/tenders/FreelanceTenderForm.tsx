/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/tenders/freelance/FreelanceTenderForm.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  DollarSign,
  Eye,
  FileText,
  Globe,
  Languages,
  Lock,
  Plus,
  Save,
  Send,
  Settings,
  Tag,
  Trash2,
  Upload,
  Briefcase,
  GraduationCap,
  Award,
  Calendar,
  Shield,
  AlertTriangle,
  Sparkles,
  ListChecks,
  HelpCircle,
  Zap,
  X,
  Hash,
  AlignLeft,
  Copy,
  Check,
  PenTool,
  Image as ImageIcon,
  File as FileIcon,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  Camera,
  ChevronDown,
  Users,
  Target,
  Clock3,
} from 'lucide-react';

// UI Components
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import { Progress } from '@/components/ui/Progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Slider } from '@/components/ui/Slider';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/Accordian';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/Separator';

// Hooks & Services
import {
  useCreateFreelanceTender,
  useTenderCategories,
  useTenderUtils,
} from '@/hooks/useTenders';
import {
  ENGAGEMENT_TYPES,
  EXPERIENCE_LEVELS,
  PROJECT_TYPES,
  WORKFLOW_TYPES,
  CURRENCIES,
  TIME_UNITS,
  DOCUMENT_TYPES,
  FILE_UPLOAD_CONSTRAINTS,
  CreateFreelanceTenderData,
  TenderCreationStatus,
  Currency,
} from '@/services/tenderService';
import { useAuth } from '@/hooks/useAuth';

// NEW IMPORTS for responsive and theming
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';

// ============ CONSTANTS ============
const STEP_LABELS = [
  { title: 'Basics', icon: FileText },
  { title: 'Skills & Requirements', icon: ListChecks },
  { title: 'Budget', icon: DollarSign },
  { title: 'Workflow & Files', icon: Settings },
  { title: 'Review', icon: Eye },
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese',
  'Arabic', 'Portuguese', 'Russian', 'Italian', 'Dutch', 'Korean',
  'Hindi', 'Bengali', 'Turkish', 'Polish', 'Swedish', 'Norwegian',
  'Danish', 'Finnish', 'Greek', 'Hebrew', 'Thai', 'Vietnamese',
  'Indonesian', 'Malay', 'Filipino', 'Czech', 'Romanian', 'Hungarian'
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing',
  'Retail', 'Construction', 'Energy', 'Transportation', 'Media',
  'Agriculture', 'Government', 'Non-profit', 'Other',
  'Real Estate', 'Hospitality', 'Entertainment', 'Telecommunications',
  'Automotive', 'Aerospace', 'Defense', 'Biotechnology', 'Pharmaceutical',
  'Chemical', 'Mining', 'Oil & Gas', 'Utilities', 'Insurance',
  'Legal', 'Consulting', 'Marketing', 'Advertising', 'Public Relations'
];

const TIMEZONES = [
  'UTC-12:00', 'UTC-11:00', 'UTC-10:00', 'UTC-09:00', 'UTC-08:00', 'UTC-07:00',
  'UTC-06:00', 'UTC-05:00', 'UTC-04:00', 'UTC-03:00', 'UTC-02:00', 'UTC-01:00',
  'UTC+00:00', 'UTC+01:00', 'UTC+02:00', 'UTC+03:00', 'UTC+04:00', 'UTC+05:00',
  'UTC+06:00', 'UTC+07:00', 'UTC+08:00', 'UTC+09:00', 'UTC+10:00', 'UTC+11:00',
  'UTC+12:00', 'UTC+13:00', 'UTC+14:00', 'UTC-09:30', 'UTC-08:30', 'UTC-07:30',
  'UTC-06:30', 'UTC-05:30', 'UTC-04:30', 'UTC-03:30', 'UTC+03:30', 'UTC+04:30',
  'UTC+05:30', 'UTC+05:45', 'UTC+06:30', 'UTC+08:30', 'UTC+09:30', 'UTC+10:30',
  'UTC+11:30', 'UTC+12:45'
];

// ============ EXPANDED SKILL SUGGESTIONS ============
const SKILL_SUGGESTIONS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python', 'Java', 'C#', 'C++',
  'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Dart', 'Flutter', 'React Native',
  'Vue.js', 'Angular', 'Svelte', 'Express.js', 'Django', 'Flask', 'Spring Boot',
  'ASP.NET', 'Laravel', 'Symfony', 'Ruby on Rails', 'GraphQL', 'REST API', 'WebSockets',
  'HTML5', 'CSS3', 'SCSS', 'Tailwind CSS', 'Bootstrap', 'Material UI', 'Chakra UI',
  'Figma', 'Adobe XD', 'Sketch', 'UI/UX Design', 'Wireframing', 'Prototyping',
  'User Research', 'Usability Testing', 'Information Architecture', 'Interaction Design',
  'iOS Development', 'Android Development', 'Mobile UI Design', 'App Store Optimization',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Firebase', 'Supabase', 'Redis', 'Elasticsearch',
  'Database Design', 'SQL', 'NoSQL', 'Prisma', 'TypeORM', 'Sequelize', 'Mongoose',
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Analysis',
  'Content Writing', 'Copywriting', 'Technical Writing', 'Creative Writing', 'Blog Writing',
  'SEO Writing', 'Ghostwriting', 'Script Writing', 'Academic Writing', 'Grant Writing',
  'Editing', 'Proofreading', 'Translation', 'Localization', 'Transcription',
  'Digital Marketing', 'Social Media Marketing', 'SEO', 'SEM', 'PPC', 'Google Ads',
  'Facebook Ads', 'Instagram Marketing', 'LinkedIn Marketing', 'TikTok Marketing',
  'Email Marketing', 'Content Marketing', 'Influencer Marketing', 'Affiliate Marketing',
  'Project Management', 'Product Management', 'Business Analysis', 'Agile', 'Scrum',
  'Kanban', 'JIRA', 'Trello', 'Asana', 'ClickUp', 'Notion', 'Microsoft Project',
  'Graphic Design', 'Logo Design', 'Brand Identity', 'Illustration', 'Digital Art',
  'Print Design', 'Packaging Design', 'Motion Graphics', '2D Animation', '3D Animation',
  'Video Editing', 'Post-Production', 'Color Grading', 'Sound Design', 'Visual Effects',
  'Music Production', 'Audio Editing', 'Mixing', 'Mastering', 'Voice Over', 'Podcast Production',
  'Video Production', 'Cinematography', 'Photography', 'Photo Editing',
].sort();

// ============ UPDATED ZOD VALIDATION SCHEMA ============
const formSchema = z.object({
  // Step 1 - Basics
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title cannot exceed 200 characters'),
  shortDescription: z.string().max(200).optional(),
  procurementCategory: z.string().min(1, 'Category is required'),
  description: z.string()
    .min(1, 'Description is required')
    .max(20000, 'Description cannot exceed 20000 characters'),
  deadlineDate: z.date()
    .refine(d => d > new Date(), 'Deadline must be in the future'),

  // UI-Only: Tender ID
  customTenderId: z.string()
    .max(50, 'Tender ID cannot exceed 50 characters')
    .optional(),

  // Step 2 - Skills & Requirements (Moved from step 4)
  skillsRequired: z.array(z.string())
    .min(1, 'At least one skill is required'),
  experienceLevel: z.enum(['entry', 'intermediate', 'expert'] as const).default('intermediate'),
  portfolioRequired: z.boolean().default(false),
  ndaRequired: z.boolean().default(false),
  industry: z.string().optional(),
  urgency: z.enum(['normal', 'urgent'] as const).default('normal'),
  timezonePreference: z.string().optional(),
  screeningQuestions: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    required: z.boolean().default(false),
  })).default([]),

  // Step 3 - Budget & Engagement
  freelanceSpecific: z.object({
    engagementType: z.enum(['fixed_price', 'hourly'] as const, {
      message: 'Engagement type is required',
    }),

    // Fixed price fields
    budget: z.object({
      min: z.number().min(0, 'Minimum budget must be positive'),
      max: z.number().min(0, 'Maximum budget must be positive'),
      currency: z.enum(['USD', 'EUR', 'GBP', 'ETB'] as const).default('USD'),
    }).optional(),

    // Hourly fields
    hourlyRate: z.object({
      min: z.number().min(1, 'Minimum rate must be at least 1'),
      max: z.number().min(1, 'Maximum rate must be at least 1'),
      currency: z.enum(['USD', 'EUR', 'GBP', 'ETB'] as const).default('USD'),
    }).optional(),

    weeklyHours: z.number()
      .min(1, 'Minimum 1 hour per week')
      .max(40, 'Maximum 40 hours per week')
      .optional(),

    projectDuration: z.object({
      value: z.number().min(1, 'Duration must be at least 1'),
      unit: z.enum(['days', 'weeks', 'months'] as const).default('days'),
    }).optional(),

    // Common fields
    projectType: z.enum(['one_time', 'ongoing', 'complex'] as const).optional(),
    languagePreference: z.string().optional(),
  }),

  // Step 4 - Workflow & Files
  workflowType: z.enum(['open', 'closed'] as const).default('open'),
  sealedBidConfirmation: z.boolean().default(false),
  maxFileSize: z.number().default(FILE_UPLOAD_CONSTRAINTS.maxFileSize),
  maxFileCount: z.number().default(10),
}).superRefine((data, ctx) => {
  // Engagement type conditions
  if (data.freelanceSpecific.engagementType === 'fixed_price') {
    if (!data.freelanceSpecific.budget) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Budget is required for fixed price engagements',
        path: ['freelanceSpecific', 'budget'],
      });
    } else if (data.freelanceSpecific.budget.min >= data.freelanceSpecific.budget.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum budget must be greater than minimum',
        path: ['freelanceSpecific', 'budget', 'max'],
      });
    }
  }

  if (data.freelanceSpecific.engagementType === 'hourly') {
    if (!data.freelanceSpecific.hourlyRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hourly rate range is required for hourly engagements',
        path: ['freelanceSpecific', 'hourlyRate'],
      });
    } else if (data.freelanceSpecific.hourlyRate.min >= data.freelanceSpecific.hourlyRate.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum rate must be greater than minimum',
        path: ['freelanceSpecific', 'hourlyRate', 'max'],
      });
    }

    if (!data.freelanceSpecific.weeklyHours) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Weekly hours is required for hourly engagements',
        path: ['freelanceSpecific', 'weeklyHours'],
      });
    }
  }

  // Workflow condition
  if (data.workflowType === 'closed' && !data.sealedBidConfirmation) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Sealed bid confirmation is required for closed workflow',
      path: ['sealedBidConfirmation'],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

// ============ FILE UPLOAD TYPES ============
interface UploadedFile {
  id: string;
  file: File;
  description: string;
  documentType: string;
  progress?: number;
  error?: string;
  uploaded?: boolean;
  preview?: string;
}

// ============ TOGGLE CARD COMPONENT ============
interface ToggleCardProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  trueLabel: string;
  falseLabel: string;
  trueIcon?: React.ReactNode;
  falseIcon?: React.ReactNode;
  className?: string;
}

const ToggleCard: React.FC<ToggleCardProps> = ({
  label,
  description,
  value,
  onChange,
  trueLabel,
  falseLabel,
  trueIcon,
  falseIcon,
  className,
}) => {
  const { getTouchTargetSize } = useResponsive();

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <Label className={cn("text-sm font-medium", colorClasses.text.primary)}>
        {label}
      </Label>
      {description && (
        <p className={cn("text-xs", colorClasses.text.muted)}>{description}</p>
      )}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all",
            "hover:scale-[1.02] active:scale-[0.98]",
            getTouchTargetSize('lg'),
            "w-full",
            !value
              ? cn(
                colorClasses.border.emerald,
                colorClasses.bg.emeraldLight,
                "shadow-sm"
              )
              : cn(
                colorClasses.border.gray100,
                colorClasses.bg.primary,
                "opacity-70 hover:opacity-100"
              )
          )}
        >
          {falseIcon}
          <span className={cn(
            "text-sm sm:text-base font-medium",
            !value ? colorClasses.text.emerald : colorClasses.text.primary
          )}>
            {falseLabel}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "flex items-center justify-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all",
            "hover:scale-[1.02] active:scale-[0.98]",
            getTouchTargetSize('lg'),
            "w-full",
            value
              ? cn(
                colorClasses.border.emerald,
                colorClasses.bg.emeraldLight,
                "shadow-sm"
              )
              : cn(
                colorClasses.border.gray100,
                colorClasses.bg.primary,
                "opacity-70 hover:opacity-100"
              )
          )}
        >
          {trueIcon}
          <span className={cn(
            "text-sm sm:text-base font-medium",
            value ? colorClasses.text.emerald : colorClasses.text.primary
          )}>
            {trueLabel}
          </span>
        </button>
      </div>
    </div>
  );
};

// ============ STEP INDICATOR COMPONENT ============
interface StepIndicatorProps {
  currentStep: number;
  steps: typeof STEP_LABELS;
  onStepClick?: (step: number) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, steps, onStepClick }) => {
  const { breakpoint } = useResponsive();

  if (breakpoint === 'mobile') {
    return (
      <div className="space-y-3 mb-6 w-full">
        <div className="flex justify-center gap-2">
          {steps.map((_, index) => {
            const stepNumber = index + 1;
            const isActive = stepNumber === currentStep;
            const isCompleted = stepNumber < currentStep;

            return (
              <button
                key={index}
                onClick={() => onStepClick?.(stepNumber)}
                className={cn(
                  "transition-all duration-200 rounded-full",
                  "touch-manipulation",
                  isActive
                    ? cn("w-8 h-2.5", colorClasses.bg.emerald)
                    : isCompleted
                      ? cn("w-2.5 h-2.5", colorClasses.bg.emeraldLight)
                      : cn("w-2.5 h-2.5", colorClasses.bg.secondary)
                )}
                aria-label={`Go to step ${stepNumber}: ${steps[index].title}`}
              />
            );
          })}
        </div>

        <div className={cn(
          "relative h-1.5 rounded-full overflow-hidden w-full",
          colorClasses.bg.secondary
        )}>
          <div
            className={cn(
              "absolute top-0 left-0 h-full transition-all duration-300",
              colorClasses.bg.emerald
            )}
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>

        <p className={cn("text-sm font-medium text-center", colorClasses.text.primary)}>
          Step {currentStep}: {steps[currentStep - 1].title}
        </p>
      </div>
    );
  }

  return (
    <div className="hidden sm:flex justify-between mb-8 max-w-4xl mx-auto w-full">
      {steps.map((step, index) => {
        const StepIcon = step.icon;
        const isActive = index + 1 === currentStep;
        const isCompleted = index + 1 < currentStep;

        return (
          <button
            key={step.title}
            onClick={() => onStepClick?.(index + 1)}
            className="flex flex-col items-center flex-1 group"
            disabled={index + 1 > currentStep && !isCompleted}
          >
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                isActive && cn("border-emerald-600", colorClasses.bg.emeraldLight),
                isCompleted && cn("border-emerald-600", colorClasses.bg.emerald),
                !isActive && !isCompleted && cn(
                  colorClasses.border.gray100,
                  colorClasses.bg.primary
                ),
                "group-hover:scale-105 group-disabled:opacity-50 group-disabled:pointer-events-none"
              )}
            >
              {isCompleted ? (
                <CheckCircle2 className={cn("h-5 w-5", colorClasses.text.white)} />
              ) : (
                <StepIcon className={cn(
                  "h-5 w-5",
                  isActive ? colorClasses.text.emerald : colorClasses.text.muted
                )} />
              )}
            </div>
            <span
              className={cn(
                "text-sm mt-2",
                isActive && cn("font-medium", colorClasses.text.emerald)
              )}
            >
              {step.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ============ MAIN COMPONENT ============
export const FreelanceTenderForm: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Responsive hook
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();

  // ============ FILE UPLOAD STATE ============
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Generate unique tender ID once
  const [generatedTenderId] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `FT-${year}-${random}`;
  });

  const createTender = useCreateFreelanceTender();
  const { categoryOptions, findCategoryById } = useTenderCategories('freelance');
  const { formatFileSize: formatSize } = useTenderUtils();

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: {
      title: '',
      shortDescription: '',
      procurementCategory: '',
      description: '',
      deadlineDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      customTenderId: '',
      skillsRequired: [],
      experienceLevel: 'intermediate',
      portfolioRequired: false,
      ndaRequired: false,
      urgency: 'normal',
      screeningQuestions: [],
      freelanceSpecific: {
        engagementType: 'fixed_price',
        budget: { min: 1000, max: 5000, currency: 'USD' },
        hourlyRate: { min: 20, max: 50, currency: 'USD' },
        weeklyHours: 20,
        projectDuration: { value: 4, unit: 'weeks' },
        projectType: 'one_time',
      },
      workflowType: 'open',
      sealedBidConfirmation: false,
      maxFileSize: FILE_UPLOAD_CONSTRAINTS.maxFileSize,
      maxFileCount: 10,
    },
    mode: 'onChange',
  });

  // Watch values for conditional rendering
  const engagementType = form.watch('freelanceSpecific.engagementType');
  const workflowType = form.watch('workflowType');
  const maxFileSize = form.watch('maxFileSize');
  const maxFileCount = form.watch('maxFileCount');

  // Set default values when engagement type changes
  useEffect(() => {
    if (engagementType === 'fixed_price') {
      if (!form.getValues('freelanceSpecific.budget')) {
        form.setValue('freelanceSpecific.budget', {
          min: 1000,
          max: 5000,
          currency: 'USD'
        });
      }
    } else {
      if (!form.getValues('freelanceSpecific.hourlyRate')) {
        form.setValue('freelanceSpecific.hourlyRate', {
          min: 20,
          max: 50,
          currency: 'USD'
        });
      }
      if (!form.getValues('freelanceSpecific.weeklyHours')) {
        form.setValue('freelanceSpecific.weeklyHours', 20);
      }
      if (!form.getValues('freelanceSpecific.projectDuration')) {
        form.setValue('freelanceSpecific.projectDuration', {
          value: 4,
          unit: 'weeks'
        });
      }
    }
  }, [engagementType, form]);

  // Screening questions field array
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'screeningQuestions',
  });

  // Skills
  const [skillsInput, setSkillsInput] = useState('');
  const [filteredSkills, setFilteredSkills] = useState<string[]>([]);
  const skillsRequired = form.watch('skillsRequired') || [];

  // Filter skills based on input
  useEffect(() => {
    if (skillsInput) {
      const filtered = SKILL_SUGGESTIONS.filter(
        s => s.toLowerCase().includes(skillsInput.toLowerCase()) &&
          !skillsRequired.includes(s)
      ).slice(0, 10);
      setFilteredSkills(filtered);
    } else {
      setFilteredSkills([]);
    }
  }, [skillsInput, skillsRequired]);

  // ============ FILE UTILITY FUNCTIONS ============
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (file.type.startsWith('image/')) {
      return <ImageIcon className={cn("h-5 w-5", colorClasses.text.blue)} />;
    }
    if (file.type === 'application/pdf' || ext === 'pdf') {
      return <FileText className={cn("h-5 w-5", colorClasses.text.red)} />;
    }
    if (file.type.includes('word') || ['doc', 'docx'].includes(ext || '')) {
      return <FileText className={cn("h-5 w-5", colorClasses.text.blue)} />;
    }
    if (file.type.includes('excel') || ['xls', 'xlsx'].includes(ext || '')) {
      return <FileSpreadsheet className={cn("h-5 w-5", colorClasses.text.emerald)} />;
    }
    return <FileIcon className={cn("h-5 w-5", colorClasses.text.muted)} />;
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      return {
        valid: false,
        error: `${file.name} exceeds maximum file size of ${formatFileSize(maxFileSize)}`,
      };
    }

    const allowedTypes = [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip',
    ];

    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0];
        return file.type.startsWith(category + '/');
      }
      return file.type === type;
    });

    if (!isAllowed) {
      return {
        valid: false,
        error: `${file.name} has unsupported file type.`,
      };
    }

    return { valid: true };
  };

  // ============ FILE HANDLERS ============
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];

    if (uploadFiles.length + selectedFiles.length > maxFileCount) {
      toast({
        title: 'Too many files',
        description: `Maximum ${maxFileCount} files allowed`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    selectedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        let preview: string | undefined;
        if (file.type.startsWith('image/')) {
          preview = URL.createObjectURL(file);
        }

        validFiles.push({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          file,
          description: '',
          documentType: 'other',
          progress: 0,
          uploaded: false,
          preview,
        });
      } else {
        errors.push(validation.error!);
      }
    });

    errors.forEach(error => {
      toast({
        title: 'File Error',
        description: error,
        variant: 'destructive',
      });
    });

    if (validFiles.length > 0) {
      setUploadFiles(prev => [...prev, ...validFiles]);
      simulateUploadProgress(validFiles);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const simulateUploadProgress = (newFiles: UploadedFile[]) => {
    setIsUploading(true);

    newFiles.forEach(file => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 25;

        setUploadFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, progress: Math.min(progress, 100) }
              : f
          )
        );

        if (progress >= 100) {
          clearInterval(interval);
          setUploadFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, uploaded: true, progress: 100 }
                : f
            )
          );
        }
      }, 150);
    });

    setTimeout(() => {
      setIsUploading(false);
    }, 1000);
  };

  const removeFile = (id: string) => {
    const file = uploadFiles.find(f => f.id === id);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const updateFileDescription = (id: string, description: string) => {
    setUploadFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, description } : f))
    );
  };

  const updateFileType = (id: string, documentType: string) => {
    const validTypes = DOCUMENT_TYPES as readonly string[];
    const validType = validTypes.includes(documentType as any) ? documentType : 'other';

    setUploadFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, documentType: validType } : f))
    );
  };

  const getFilesForSubmission = () => {
    const readyFiles = uploadFiles.filter(f => !f.error);

    return {
      files: readyFiles.map(f => f.file),
      fileDescriptions: readyFiles.map(f => f.description || ''),
      fileTypes: readyFiles.map(f => {
        const validTypes = DOCUMENT_TYPES as readonly string[];
        const docType = f.documentType || 'other';

        if (validTypes.includes(docType as any)) {
          return docType;
        }

        return 'other';
      }),
    };
  };

  const clearFiles = () => {
    uploadFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadFiles([]);
  };

  // Add skill
  const addSkill = useCallback((skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    if (!skillsRequired.includes(trimmed)) {
      form.setValue('skillsRequired', [...skillsRequired, trimmed], { shouldValidate: true });
    }
    setSkillsInput('');
  }, [form, skillsRequired]);

  // Remove skill
  const removeSkill = useCallback((skill: string) => {
    form.setValue('skillsRequired', skillsRequired.filter(s => s !== skill), { shouldValidate: true });
  }, [form, skillsRequired]);

  // Copy tender ID to clipboard
  const copyTenderId = useCallback(() => {
    navigator.clipboard.writeText(generatedTenderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'Tender ID copied to clipboard',
      variant: 'success',
    });
  }, [generatedTenderId, toast]);

  // Step validation
  const validateStep = useCallback(async (step: number): Promise<boolean> => {
    setSubmitError(null);

    let fieldsToValidate: string[] = [];

    switch (step) {
      case 1: // Basics
        fieldsToValidate = ['title', 'procurementCategory', 'description', 'deadlineDate'];
        break;
      case 2: // Skills & Requirements
        fieldsToValidate = ['skillsRequired', 'experienceLevel'];
        break;
      case 3: // Budget
        fieldsToValidate = ['freelanceSpecific.engagementType'];
        if (engagementType === 'fixed_price') {
          fieldsToValidate.push(
            'freelanceSpecific.budget.min',
            'freelanceSpecific.budget.max'
          );
        } else {
          fieldsToValidate.push(
            'freelanceSpecific.hourlyRate.min',
            'freelanceSpecific.hourlyRate.max',
            'freelanceSpecific.weeklyHours'
          );
        }
        break;
      case 4: // Workflow & Files
        fieldsToValidate = ['workflowType'];
        if (workflowType === 'closed') {
          fieldsToValidate.push('sealedBidConfirmation');
        }
        break;
      default:
        return true;
    }

    const result = await form.trigger(fieldsToValidate as any);

    if (!result) {
      setSubmitError('Please fill all required fields correctly.');
    }

    return result;
  }, [form, engagementType, workflowType]);

  // Handle step click from indicator
  const handleStepClick = useCallback(async (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (step > currentStep) {
      const isValid = await validateStep(currentStep);
      if (isValid) {
        setCurrentStep(step);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentStep, validateStep]);

  // Handle next step
  const handleNextStep = async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle previous step
  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSubmitError(null);
  };

  // Handle form submission
  const onSubmit = async (data: FormValues, status: TenderCreationStatus) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const isValid = await form.trigger();
      if (!isValid) {
        setSubmitError('Please fix validation errors before submitting.');
        setIsSubmitting(false);
        return;
      }

      const { files: fileList, fileDescriptions, fileTypes } = getFilesForSubmission();

      // Transform data to match backend contract
      const submitData: CreateFreelanceTenderData = {
        tenderCategory: 'freelance',
        title: data.title.trim(),
        description: data.description.trim(),
        procurementCategory: data.procurementCategory,
        deadline: data.deadlineDate.toISOString(),
        workflowType: data.workflowType,
        status,
        skillsRequired: skillsRequired,
        maxFileSize: data.maxFileSize,
        maxFileCount: data.maxFileCount,

        ...(data.workflowType === 'closed' && data.sealedBidConfirmation && {
          sealedBidConfirmation: true,
        }),

        ...(fileList.length > 0 && {
          fileDescriptions,
          fileTypes,
        }),

        // ALL freelance fields nested here
        freelanceSpecific: {
          // Engagement type is required
          engagementType: data.freelanceSpecific.engagementType,

          // Fixed price fields
          ...(data.freelanceSpecific.engagementType === 'fixed_price' &&
            data.freelanceSpecific.budget && {
            budget: {
              min: data.freelanceSpecific.budget.min,
              max: data.freelanceSpecific.budget.max,
              currency: data.freelanceSpecific.budget.currency,
            }
          }),

          // Hourly fields
          ...(data.freelanceSpecific.engagementType === 'hourly' && {
            hourlyRate: data.freelanceSpecific.hourlyRate ? {
              min: data.freelanceSpecific.hourlyRate.min,
              max: data.freelanceSpecific.hourlyRate.max,
              currency: data.freelanceSpecific.hourlyRate.currency,
            } : undefined,
            weeklyHours: data.freelanceSpecific.weeklyHours,
            projectDuration: data.freelanceSpecific.projectDuration,
          }),

          // Common fields from freelanceSpecific
          projectType: data.freelanceSpecific.projectType || 'one_time',

          ...(data.freelanceSpecific.languagePreference && {
            languagePreference: data.freelanceSpecific.languagePreference,
          }),

          // Fields from step 2 (moved inside freelanceSpecific)
          experienceLevel: data.experienceLevel,
          portfolioRequired: data.portfolioRequired,
          ndaRequired: data.ndaRequired,

          ...(data.industry && { industry: data.industry }),

          urgency: data.urgency,

          ...(data.timezonePreference && {
            timezonePreference: data.timezonePreference,
          }),

          ...(data.screeningQuestions?.length > 0 && {
            screeningQuestions: data.screeningQuestions,
          }),
        },
      };

      await createTender.mutateAsync({
        data: submitData,
        files: fileList,
      });

      clearFiles();

      toast({
        title: status === 'published' ? 'Tender Published!' : 'Draft Saved',
        description: status === 'published'
          ? 'Your freelance tender is now live and visible to freelancers.'
          : 'Your tender has been saved as a draft.',
        variant: 'success',
      });

      const userRole = user?.role || localStorage.getItem('userRole') || 'organization';
      const redirectPath = userRole === 'company'
        ? '/dashboard/company/tenders/my-tenders'
        : '/dashboard/organization/tenders';

      setTimeout(() => {
        router.push(redirectPath);
      }, 1500);

    } catch (error: any) {
      console.error('❌ Submission error:', error);
      setSubmitError(error.message || 'Failed to create tender. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    let totalFields = 0;
    let completedFields = 0;

    const values = form.getValues();

    // Step 1 - Basics
    if (values.title) completedFields++;
    totalFields++;
    if (values.procurementCategory) completedFields++;
    totalFields++;
    if (values.description) completedFields++;
    totalFields++;
    if (values.deadlineDate) completedFields++;
    totalFields++;

    // Step 2 - Skills & Requirements
    if (values.skillsRequired?.length > 0) completedFields++;
    totalFields++;
    if (values.experienceLevel) completedFields++;
    totalFields++;

    // Step 3 - Budget
    if (values.freelanceSpecific?.engagementType) completedFields++;
    totalFields++;

    if (values.freelanceSpecific?.engagementType === 'fixed_price') {
      if (values.freelanceSpecific?.budget?.min) completedFields++;
      totalFields++;
      if (values.freelanceSpecific?.budget?.max) completedFields++;
      totalFields++;
    } else {
      if (values.freelanceSpecific?.hourlyRate?.min) completedFields++;
      totalFields++;
      if (values.freelanceSpecific?.hourlyRate?.max) completedFields++;
      totalFields++;
      if (values.freelanceSpecific?.weeklyHours) completedFields++;
      totalFields++;
    }

    // Step 4 - Workflow
    if (values.workflowType) completedFields++;
    totalFields++;

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }, [form.watch()]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1_Basics
            form={form}
            categoryOptions={categoryOptions}
            generatedTenderId={generatedTenderId}
            copyTenderId={copyTenderId}
            copied={copied}
            getTouchTargetSize={getTouchTargetSize}
            breakpoint={breakpoint}
          />
        );
      case 2:
        return (
          <Step2_SkillsAndRequirements
            form={form}
            skillsInput={skillsInput}
            setSkillsInput={setSkillsInput}
            skillsRequired={skillsRequired}
            filteredSkills={filteredSkills}
            addSkill={addSkill}
            removeSkill={removeSkill}
            fields={fields}
            append={append}
            remove={remove}
            getTouchTargetSize={getTouchTargetSize}
            breakpoint={breakpoint}
          />
        );
      case 3:
        return (
          <Step3_Budget
            form={form}
            engagementType={engagementType}
            getTouchTargetSize={getTouchTargetSize}
            breakpoint={breakpoint}
          />
        );
      case 4:
        return (
          <Step4_WorkflowAndFiles
            form={form}
            uploadFiles={uploadFiles}
            isUploading={isUploading}
            fileInputRef={fileInputRef}
            handleFileSelect={handleFileSelect}
            removeFile={removeFile}
            updateFileDescription={updateFileDescription}
            updateFileType={updateFileType}
            formatFileSize={formatFileSize}
            getFileIcon={getFileIcon}
            maxFileCount={maxFileCount}
            maxFileSize={maxFileSize}
            getTouchTargetSize={getTouchTargetSize}
            breakpoint={breakpoint}
          />
        );
      case 5:
        return (
          <Step5_Review
            form={form}
            uploadFiles={uploadFiles}
            skillsRequired={skillsRequired}
            findCategoryById={findCategoryById}
            formatFileSize={formatFileSize}
            generatedTenderId={generatedTenderId}
            copyTenderId={copyTenderId}
            copied={copied}
            onSubmitDraft={() => onSubmit(form.getValues(), 'draft')}
            onSubmitPublish={() => onSubmit(form.getValues(), 'published')}
            isSubmitting={isSubmitting}
            submitError={submitError}
            getTouchTargetSize={getTouchTargetSize}
            breakpoint={breakpoint}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={cn(
      "container mx-auto",
      "px-4 sm:px-6 lg:px-8",
      "py-4 sm:py-6 md:py-8 lg:py-10",
      "min-h-screen",
      colorClasses.bg.primary
    )}>
      {/* Header */}
      <div className="mb-6 sm:mb-8 max-w-4xl mx-auto">
        <h1 className={cn(
          "text-2xl sm:text-3xl font-bold",
          colorClasses.text.emerald
        )}>
          Create Freelance Tender
        </h1>
        <p className={cn(
          "text-sm sm:text-base mt-2",
          colorClasses.text.secondary
        )}>
          Post a project and connect with skilled freelancers worldwide
        </p>
      </div>

      {/* Progress & Help Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 max-w-4xl mx-auto">
        <div className="w-full sm:flex-1 sm:mr-4">
          <div className="flex justify-between mb-2 text-xs sm:text-sm">
            <span className={colorClasses.text.secondary}>Overall Progress</span>
            <span className={cn("font-medium", colorClasses.text.emerald)}>
              {completionPercentage}%
            </span>
          </div>
          <div className={cn("relative h-2 rounded-full overflow-hidden w-full", colorClasses.bg.secondary)}>
            <div
              className={cn("absolute top-0 left-0 h-full transition-all duration-300", colorClasses.bg.emerald)}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowHelp(!showHelp)}
          className={cn(
            "shrink-0 w-full sm:w-auto",
            getTouchTargetSize('md'),
            "touch-manipulation"
          )}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          {showHelp ? 'Hide Help' : 'Show Help'}
        </Button>
      </div>

      {/* Help Accordion */}
      {showHelp && (
        <Accordion type="single" collapsible className="mb-6 max-w-4xl mx-auto">
          <AccordionItem value="help" className={cn(colorClasses.border.gray100)}>
            <AccordionTrigger className={colorClasses.text.emerald}>
              <div className="flex items-center">
                <Sparkles className="h-4 w-4 mr-2" />
                Tips for creating a great tender
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {[
                  "Write a clear, specific title that describes the work needed",
                  "Provide detailed requirements and expectations in the description",
                  "Set realistic deadlines and budgets based on project scope",
                  "Include sample files or references when helpful",
                  "Use screening questions to pre-qualify applicants",
                  "Choose the right workflow type for your project needs"
                ].map((tip, i) => (
                  <li key={i} className={colorClasses.text.secondary}>{tip}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        steps={STEP_LABELS}
        onStepClick={handleStepClick}
      />

      {/* Form */}
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <Card className={cn(
            "border shadow-sm w-full",
            colorClasses.border.gray100,
            colorClasses.bg.surface
          )}>
            <CardHeader className={cn(
              "bg-linear-to-r p-4 sm:p-6 rounded-t-xl",
              colorClasses.bg.emeraldLight
            )}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={cn("text-lg sm:text-xl", colorClasses.text.emerald)}>
                    {STEP_LABELS[currentStep - 1].title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Step {currentStep} of 5
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className={cn(
              "pt-4 sm:pt-6 px-4 sm:px-6",
              colorClasses.bg.primary
            )}>
              {renderStepContent()}
            </CardContent>
            <CardFooter className={cn(
              "flex flex-col sm:flex-row justify-between gap-3 border-t pt-4 sm:pt-6 px-4 sm:px-6 rounded-b-xl",
              colorClasses.border.gray100,
              colorClasses.bg.primary
            )}>
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={cn(
                  "w-full sm:w-auto order-2 sm:order-1",
                  getTouchTargetSize('lg'),
                  "touch-manipulation"
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className={cn(
                    "w-full sm:w-auto order-1 sm:order-2",
                    getTouchTargetSize('lg'),
                    "touch-manipulation"
                  )}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : null}
            </CardFooter>
          </Card>

          {submitError && currentStep === 5 && (
            <Alert variant="destructive" className="animate-in fade-in-50 max-w-4xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}
        </form>
      </Form>
    </div>
  );
};

// ============ STEP 1: BASICS ============
interface Step1Props {
  form: any;
  categoryOptions: Array<{ value: string; label: string; group?: string }>;
  generatedTenderId: string;
  copyTenderId: () => void;
  copied: boolean;
  getTouchTargetSize: (size: 'sm' | 'md' | 'lg') => string;
  breakpoint: string;
}

const Step1_Basics: React.FC<Step1Props> = ({
  form,
  categoryOptions,
  generatedTenderId,
  copyTenderId,
  copied,
  getTouchTargetSize,
  breakpoint
}) => {
  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Tender ID Preview */}
      <div className={cn(
        "rounded-xl p-4 border",
        colorClasses.bg.emeraldLight,
        colorClasses.border.emerald
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Label className={cn("text-xs", colorClasses.text.emerald)}>Tender ID (Preview Only)</Label>
            <div className="flex items-center gap-2 mt-1">
              <p className={cn(
                "font-mono text-lg sm:text-xl font-bold break-all",
                colorClasses.text.emerald
              )}>
                {generatedTenderId}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={copyTenderId}
                className={cn(
                  "h-8 w-8 shrink-0",
                  colorClasses.text.emerald,
                  "hover:bg-emerald-200/50"
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "self-start sm:self-center",
              colorClasses.bg.emeraldLight,
              colorClasses.text.emerald,
              colorClasses.border.emerald
            )}
          >
            Auto-generated
          </Badge>
        </div>
      </div>

      {/* Custom Tender ID - UI Only */}
      <FormField
        control={form.control}
        name="customTenderId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn("text-xs flex items-center", colorClasses.text.amber)}>
              <PenTool className="h-3 w-3 mr-1" />
              Custom Tender ID (Optional)
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="e.g., FT-2026-MYPROJECT"
                  {...field}
                  className={cn(
                    "pr-16 w-full",
                    colorClasses.bg.amberLight,
                    colorClasses.border.amber
                  )}
                />
                <Badge
                  variant="outline"
                  className={cn(
                    "absolute right-2 top-2 text-xs",
                    colorClasses.bg.amberLight,
                    colorClasses.text.amber,
                    colorClasses.border.amber
                  )}
                >
                  UI Only
                </Badge>
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <FileText className="h-4 w-4 mr-2" />
              Title
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  placeholder="e.g., React Native Developer for Mobile App"
                  {...field}
                  className={cn(
                    "pr-16 w-full",
                    colorClasses.bg.primary,
                    colorClasses.border.gray100,
                    "h-12 sm:h-11"
                  )}
                />
                <span className={cn(
                  "absolute right-3 top-3 text-xs",
                  colorClasses.text.muted
                )}>
                  {field.value?.length || 0}/200
                </span>
              </div>
            </FormControl>
            <FormMessage className={colorClasses.text.red} />
          </FormItem>
        )}
      />

      {/* Short Description - UI Only */}
      <FormField
        control={form.control}
        name="shortDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn("text-xs flex items-center", colorClasses.text.amber)}>
              <PenTool className="h-3 w-3 mr-1" />
              Preview Only - Not Saved
            </FormLabel>
            <div className="relative">
              <Textarea
                placeholder="Brief preview of your project (not saved to backend)"
                {...field}
                className={cn(
                  "pr-16 w-full",
                  colorClasses.bg.amberLight,
                  colorClasses.border.amber,
                  "min-h-25 sm:min-h-[80px]"
                )}
                rows={breakpoint === 'mobile' ? 4 : 3}
              />
              <span className={cn(
                "absolute right-3 bottom-3 text-xs",
                colorClasses.text.muted
              )}>
                {field.value?.length || 0}/200
              </span>
            </div>
          </FormItem>
        )}
      />

      {/* Category */}
      <FormField
        control={form.control}
        name="procurementCategory"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <Tag className="h-4 w-4 mr-2" />
              Category
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 sm:h-11 w-full"
                )}>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={cn(
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "max-h-[300px] w-full",
                "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
              )}>
                {categoryOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={cn(
                      option.group === 'header' && cn(
                        "font-semibold",
                        colorClasses.bg.secondary
                      )
                    )}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage className={colorClasses.text.red} />
          </FormItem>
        )}
      />

      {/* Full Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <AlignLeft className="h-4 w-4 mr-2" />
              Full Description
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Textarea
                  placeholder="Describe your project in detail..."
                  {...field}
                  rows={breakpoint === 'mobile' ? 8 : 6}
                  className={cn(
                    "pr-16 w-full",
                    colorClasses.bg.primary,
                    colorClasses.border.gray100
                  )}
                />
                <span className={cn(
                  "absolute right-3 bottom-3 text-xs",
                  colorClasses.text.muted
                )}>
                  {field.value?.length || 0}/20000
                </span>
              </div>
            </FormControl>
            <FormMessage className={colorClasses.text.red} />
          </FormItem>
        )}
      />

      {/* Deadline */}
      <FormField
        control={form.control}
        name="deadlineDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <Calendar className="h-4 w-4 mr-2" />
              Deadline
            </FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : ''}
                onChange={(e) => field.onChange(new Date(e.target.value))}
                min={new Date().toISOString().slice(0, 16)}
                className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 sm:h-11 w-full"
                )}
              />
            </FormControl>
            <FormMessage className={colorClasses.text.red} />
          </FormItem>
        )}
      />
    </div>
  );
};

// ============ STEP 2: SKILLS & REQUIREMENTS ============
interface Step2Props {
  form: any;
  skillsInput: string;
  setSkillsInput: (value: string) => void;
  skillsRequired: string[];
  filteredSkills: string[];
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  fields: any[];
  append: (value: any) => void;
  remove: (index: number) => void;
  getTouchTargetSize: (size: 'sm' | 'md' | 'lg') => string;
  breakpoint: string;
}

const Step2_SkillsAndRequirements: React.FC<Step2Props> = ({
  form,
  skillsInput,
  setSkillsInput,
  skillsRequired,
  filteredSkills,
  addSkill,
  removeSkill,
  fields,
  append,
  remove,
  getTouchTargetSize,
  breakpoint,
}) => {
  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Skills Input */}
      <FormField
        control={form.control}
        name="skillsRequired"
        render={() => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <Hash className="h-4 w-4 mr-2" />
              Required Skills
            </FormLabel>
            <FormControl>
              <div className="space-y-2 w-full">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <div className="flex-1 relative w-full">
                    <Input
                      placeholder="Add skills (e.g., React, Python)"
                      value={skillsInput}
                      onChange={(e) => setSkillsInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill(skillsInput);
                        }
                      }}
                      className={cn(
                        colorClasses.bg.primary,
                        colorClasses.border.gray100,
                        "h-12 sm:h-11 w-full"
                      )}
                    />
                    {filteredSkills.length > 0 && (
                      <div className={cn(
                        "absolute z-10 w-full mt-1 border rounded-md shadow-lg max-h-48 overflow-y-auto",
                        colorClasses.bg.primary,
                        colorClasses.border.gray100,
                        "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
                      )}>
                        {filteredSkills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-3 sm:py-2",
                              "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
                              colorClasses.text.primary,
                              "touch-manipulation"
                            )}
                            onClick={() => addSkill(skill)}
                          >
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => addSkill(skillsInput)}
                    variant="outline"
                    className={cn(
                      "w-full sm:w-auto",
                      getTouchTargetSize('md'),
                      "touch-manipulation"
                    )}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skillsRequired.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className={cn(
                        "pl-2 pr-1 py-1 sm:py-2 flex items-center gap-1",
                        colorClasses.bg.emeraldLight,
                        colorClasses.text.emerald
                      )}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className={cn(
                          "ml-1 hover:text-red-500",
                          getTouchTargetSize('sm')
                        )}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </FormControl>
            <FormMessage className={colorClasses.text.red} />
          </FormItem>
        )}
      />

      {/* Experience Level */}
      <FormField
        control={form.control}
        name="experienceLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <GraduationCap className="h-4 w-4 mr-2" />
              Experience Level
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 sm:h-11 w-full"
                )}>
                  <SelectValue placeholder="Select experience level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={cn(
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "w-full"
              )}>
                {EXPERIENCE_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center">
                      <span className={cn(
                        "w-2 h-2 rounded-full mr-2",
                        level.value === 'entry' && colorClasses.bg.green,
                        level.value === 'intermediate' && colorClasses.bg.amber,
                        level.value === 'expert' && colorClasses.bg.red,
                      )} />
                      <span className={colorClasses.text.primary}>{level.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Portfolio Requirement - Toggle Card */}
      <FormField
        control={form.control}
        name="portfolioRequired"
        render={({ field }) => (
          <ToggleCard
            label="Portfolio Requirement"
            description="Do freelancers need to provide portfolio samples?"
            value={field.value}
            onChange={field.onChange}
            trueLabel="Required"
            falseLabel="Optional"
            trueIcon={<Award className={cn("h-5 w-5", colorClasses.text.emerald)} />}
            falseIcon={<Award className={cn("h-5 w-5", colorClasses.text.muted)} />}
          />
        )}
      />

      {/* NDA Requirement - Toggle Card */}
      <FormField
        control={form.control}
        name="ndaRequired"
        render={({ field }) => (
          <ToggleCard
            label="NDA Requirement"
            description="Do freelancers need to sign a Non-Disclosure Agreement?"
            value={field.value}
            onChange={field.onChange}
            trueLabel="NDA Required"
            falseLabel="No NDA"
            trueIcon={<Shield className={cn("h-5 w-5", colorClasses.text.emerald)} />}
            falseIcon={<Shield className={cn("h-5 w-5", colorClasses.text.muted)} />}
          />
        )}
      />

      {/* Industry */}
      <FormField
        control={form.control}
        name="industry"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <Briefcase className="h-4 w-4 mr-2" />
              Industry
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 sm:h-11 w-full"
                )}>
                  <SelectValue placeholder="Select industry (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={cn(
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "max-h-[300px] w-full",
                "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
              )}>
                {INDUSTRIES.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Urgency */}
      <FormField
        control={form.control}
        name="urgency"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <Zap className="h-4 w-4 mr-2" />
              Urgency
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 sm:h-11 w-full"
                )}>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={cn(
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "w-full"
              )}>
                <SelectItem value="normal">
                  <div className="flex items-center">
                    <span className={cn("w-2 h-2 rounded-full mr-2", colorClasses.bg.green)} />
                    Normal
                  </div>
                </SelectItem>
                <SelectItem value="urgent">
                  <div className="flex items-center">
                    <span className={cn("w-2 h-2 rounded-full mr-2", colorClasses.bg.amber)} />
                    Urgent
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Timezone Preference */}
      <FormField
        control={form.control}
        name="timezonePreference"
        render={({ field }) => (
          <FormItem>
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <Globe className="h-4 w-4 mr-2" />
              Timezone Preference
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 sm:h-11 w-full"
                )}>
                  <SelectValue placeholder="Select timezone (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={cn(
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "max-h-[300px] w-full",
                "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
              )}>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Screening Questions */}
      <div className="space-y-4 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Label className={cn(
            "flex items-center text-sm sm:text-base",
            colorClasses.text.emerald
          )}>
            <ListChecks className="h-4 w-4 mr-2" />
            Screening Questions
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ question: '', required: false })}
            className={cn(
              "w-full sm:w-auto",
              getTouchTargetSize('md'),
              "touch-manipulation"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        {fields.length === 0 && (
          <p className={cn(
            "text-sm text-center py-4 border rounded-lg w-full",
            colorClasses.text.muted,
            colorClasses.border.gray100
          )}>
            No screening questions added. Click "Add Question" to create one.
          </p>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className={cn(
              "flex flex-col sm:flex-row gap-2 items-start p-4 border rounded-lg w-full",
              colorClasses.border.gray100
            )}
          >
            <div className="flex-1 space-y-2 w-full">
              <FormField
                control={form.control}
                name={`screeningQuestions.${index}.question`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Enter your question"
                        {...field}
                        className={cn(
                          colorClasses.bg.primary,
                          colorClasses.border.gray100,
                          "h-12 sm:h-11 w-full"
                        )}
                      />
                    </FormControl>
                    <FormMessage className={colorClasses.text.red} />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`screeningQuestions.${index}.required`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className={getTouchTargetSize('sm')}
                      />
                    </FormControl>
                    <span className={cn("text-sm", colorClasses.text.primary)}>Required</span>
                  </FormItem>
                )}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className={cn(
                colorClasses.text.red,
                "hover:text-red-700 self-end sm:self-start",
                getTouchTargetSize('md'),
                "touch-manipulation shrink-0"
              )}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ STEP 3: BUDGET (FIXED FOR MOBILE - RADIO GROUP FIXED) ============
interface Step3Props {
  form: any;
  engagementType: 'fixed_price' | 'hourly';
  getTouchTargetSize: (size: 'sm' | 'md' | 'lg') => string;
  breakpoint: string;
}

const Step3_Budget: React.FC<Step3Props> = ({
  form,
  engagementType,
  getTouchTargetSize,
  breakpoint
}) => {
  const [budgetSlider, setBudgetSlider] = useState([1000, 5000]);
  const [hourlyRateSlider, setHourlyRateSlider] = useState([20, 50]);

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Engagement Type Selection */}
      <FormField
        control={form.control}
        name="freelanceSpecific.engagementType"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base mb-3",
              colorClasses.text.emerald
            )}>
              <Coins className="h-4 w-4 mr-2 shrink-0" />
              How do you want to pay?
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className={cn(
                  "w-full",
                  breakpoint === 'mobile' 
                    ? "flex flex-col gap-3" 
                    : "grid grid-cols-2 gap-4"
                )}
              >
                {ENGAGEMENT_TYPES.map((type) => (
                  <div key={type.value} className={cn(
                    "w-full",
                    breakpoint === 'mobile' ? "" : ""
                  )}>
                    <RadioGroupItem
                      value={type.value}
                      id={`engagement-${type.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`engagement-${type.value}`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2",
                        "cursor-pointer transition-all w-full",
                        "min-h-[80px]",
                        getTouchTargetSize('lg'),
                        field.value === type.value
                          ? cn(colorClasses.border.emerald, colorClasses.bg.emeraldLight, "shadow-sm")
                          : cn(colorClasses.border.gray100, colorClasses.bg.primary),
                        "hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      {type.value === 'fixed_price' ? (
                        <DollarSign className={cn("h-6 w-6 shrink-0",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.primary
                        )} />
                      ) : (
                        <Clock className={cn("h-6 w-6 shrink-0",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.primary
                        )} />
                      )}
                      <div className="flex-1">
                        <div className={cn(
                          "font-medium",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.primary
                        )}>
                          {type.label}
                        </div>
                        <div className={cn(
                          "text-xs",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.muted
                        )}>
                          {type.value === 'fixed_price' 
                            ? 'Pay for project completion'
                            : 'Pay for time worked'}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage className={colorClasses.text.red} />
          </FormItem>
        )}
      />

      {engagementType === 'fixed_price' && (
        <div className={cn(
          "space-y-6 p-4 sm:p-6 border rounded-xl w-full",
          colorClasses.bg.emeraldLight,
          colorClasses.border.emerald
        )}>
          <h3 className={cn("font-medium flex items-center text-base", colorClasses.text.emerald)}>
            <DollarSign className="h-5 w-5 mr-2 shrink-0" />
            Budget Range
          </h3>

          {/* Currency */}
          <FormField
            control={form.control}
            name="freelanceSpecific.budget.currency"
            render={({ field }) => (
              <FormItem className="w-full">
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger className={cn(
                      "w-full sm:w-32",
                      colorClasses.bg.primary,
                      colorClasses.border.gray100,
                      "h-12"
                    )}>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className={cn(
                    colorClasses.bg.primary,
                    colorClasses.border.gray100
                  )}>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Min/Max Inputs */}
          <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full">
            <FormField
              control={form.control}
              name="freelanceSpecific.budget.min"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className={cn("text-sm", colorClasses.text.primary)}>Minimum Budget</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        field.onChange(val);
                        setBudgetSlider([val, budgetSlider[1]]);
                      }}
                      value={field.value || ''}
                      className={cn(
                        colorClasses.bg.primary,
                        colorClasses.border.gray100,
                        "h-12 w-full"
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="freelanceSpecific.budget.max"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className={cn("text-sm", colorClasses.text.primary)}>Maximum Budget</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        field.onChange(val);
                        setBudgetSlider([budgetSlider[0], val]);
                      }}
                      value={field.value || ''}
                      className={cn(
                        colorClasses.bg.primary,
                        colorClasses.border.gray100,
                        "h-12 w-full"
                      )}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* Slider Preview */}
          <div className="pt-4 w-full">
            <p className={cn("text-sm mb-4", colorClasses.text.secondary)}>Drag to adjust range</p>
            <Slider
              min={0}
              max={10000}
              step={100}
              value={budgetSlider}
              onValueChange={(val) => {
                setBudgetSlider([val[0], val[1]]);
                form.setValue('freelanceSpecific.budget.min', val[0]);
                form.setValue('freelanceSpecific.budget.max', val[1]);
              }}
              className="py-4 w-full"
            />
            <div className="flex flex-col sm:flex-row justify-between text-sm font-medium gap-2 w-full">
              <span className={cn("text-center sm:text-left", colorClasses.text.emerald)}>
                {form.getValues('freelanceSpecific.budget.currency')} {budgetSlider[0]}
              </span>
              <span className={cn("text-center", colorClasses.text.primary)}>to</span>
              <span className={cn("text-center sm:text-right", colorClasses.text.emerald)}>
                {form.getValues('freelanceSpecific.budget.currency')} {budgetSlider[1]}
              </span>
            </div>
          </div>
        </div>
      )}

      {engagementType === 'hourly' && (
        <div className="space-y-6 w-full">
          {/* Hourly Rate Range */}
          <div className={cn(
            "p-4 sm:p-6 border rounded-xl w-full",
            colorClasses.bg.emeraldLight,
            colorClasses.border.emerald
          )}>
            <h3 className={cn("font-medium flex items-center mb-4 text-base", colorClasses.text.emerald)}>
              <Clock className="h-5 w-5 mr-2 shrink-0" />
              Hourly Rate Range
            </h3>

            {/* Currency */}
            <FormField
              control={form.control}
              name="freelanceSpecific.hourlyRate.currency"
              render={({ field }) => (
                <FormItem className="mb-4 w-full">
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || undefined}
                  >
                    <FormControl>
                      <SelectTrigger className={cn(
                        "w-full sm:w-32",
                        colorClasses.bg.primary,
                        colorClasses.border.gray100,
                        "h-12"
                      )}>
                        <SelectValue placeholder="Currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={cn(
                      colorClasses.bg.primary,
                      colorClasses.border.gray100
                    )}>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Min/Max Inputs */}
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 mb-4 w-full">
              <FormField
                control={form.control}
                name="freelanceSpecific.hourlyRate.min"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className={cn("text-sm", colorClasses.text.primary)}>Minimum Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          field.onChange(val);
                          setHourlyRateSlider([val, hourlyRateSlider[1]]);
                        }}
                        value={field.value || ''}
                        className={cn(
                          colorClasses.bg.primary,
                          colorClasses.border.gray100,
                          "h-12 w-full"
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freelanceSpecific.hourlyRate.max"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className={cn("text-sm", colorClasses.text.primary)}>Maximum Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          field.onChange(val);
                          setHourlyRateSlider([hourlyRateSlider[0], val]);
                        }}
                        value={field.value || ''}
                        className={cn(
                          colorClasses.bg.primary,
                          colorClasses.border.gray100,
                          "h-12 w-full"
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Slider Preview */}
            <div className="pt-2 w-full">
              <p className={cn("text-sm mb-4", colorClasses.text.secondary)}>Drag to adjust rate</p>
              <Slider
                min={0}
                max={200}
                step={5}
                value={hourlyRateSlider}
                onValueChange={(val) => {
                  setHourlyRateSlider([val[0], val[1]]);
                  form.setValue('freelanceSpecific.hourlyRate.min', val[0]);
                  form.setValue('freelanceSpecific.hourlyRate.max', val[1]);
                }}
                className="py-4 w-full"
              />
              <div className="flex flex-col sm:flex-row justify-between text-sm font-medium gap-2 w-full">
                <span className={cn("text-center sm:text-left", colorClasses.text.emerald)}>
                  {form.getValues('freelanceSpecific.hourlyRate.currency')} {hourlyRateSlider[0]}/hr
                </span>
                <span className={cn("text-center", colorClasses.text.primary)}>to</span>
                <span className={cn("text-center sm:text-right", colorClasses.text.emerald)}>
                  {form.getValues('freelanceSpecific.hourlyRate.currency')} {hourlyRateSlider[1]}/hr
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Hours */}
          <div className={cn(
            "p-4 sm:p-6 border rounded-xl w-full",
            colorClasses.bg.emeraldLight,
            colorClasses.border.emerald
          )}>
            <h3 className={cn("font-medium flex items-center mb-4 text-base", colorClasses.text.emerald)}>
              <Clock3 className="h-5 w-5 mr-2 shrink-0" />
              Weekly Hours
            </h3>

            <FormField
              control={form.control}
              name="freelanceSpecific.weeklyHours"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="space-y-4 w-full">
                      <Input
                        type="number"
                        min="1"
                        max="40"
                        placeholder="Hours per week"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ''}
                        className={cn(
                          colorClasses.bg.primary,
                          colorClasses.border.gray100,
                          "h-12 w-full"
                        )}
                      />
                      <Slider
                        min={1}
                        max={40}
                        step={1}
                        value={[field.value || 20]}
                        onValueChange={(val) => field.onChange(val[0])}
                        className="w-full"
                      />
                      <div className="flex flex-col sm:flex-row justify-between text-sm gap-2 w-full">
                        <span className={cn("text-center sm:text-left", colorClasses.text.secondary)}>1h/week</span>
                        <span className={cn("text-center font-medium", colorClasses.text.emerald)}>{field.value || 20}h/week</span>
                        <span className={cn("text-center sm:text-right", colorClasses.text.secondary)}>40h/week</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className={colorClasses.text.red} />
                </FormItem>
              )}
            />
          </div>

          {/* Project Duration (optional for hourly) */}
          <div className={cn(
            "p-4 sm:p-6 border rounded-xl w-full",
            colorClasses.bg.emeraldLight,
            colorClasses.border.emerald
          )}>
            <h3 className={cn("font-medium flex items-center mb-4 text-base", colorClasses.text.emerald)}>
              <Target className="h-5 w-5 mr-2 shrink-0" />
              Project Duration (Optional)
            </h3>

            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full">
              <FormField
                control={form.control}
                name="freelanceSpecific.projectDuration.value"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className={cn("text-sm", colorClasses.text.primary)}>Duration</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Amount"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        value={field.value || ''}
                        className={cn(
                          colorClasses.bg.primary,
                          colorClasses.border.gray100,
                          "h-12 w-full"
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="freelanceSpecific.projectDuration.unit"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel className={cn("text-sm", colorClasses.text.primary)}>Unit</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger className={cn(
                          colorClasses.bg.primary,
                          colorClasses.border.gray100,
                          "h-12 w-full"
                        )}>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={cn(
                        colorClasses.bg.primary,
                        colorClasses.border.gray100,
                        "w-full"
                      )}>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* Project Type */}
      <FormField
        control={form.control}
        name="freelanceSpecific.projectType"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className={cn("text-sm sm:text-base", colorClasses.text.emerald)}>
              Project Type
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 w-full"
                )}>
                  <SelectValue placeholder="Select project type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={cn(
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "w-full"
              )}>
                {PROJECT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* Language Preference */}
      <FormField
        control={form.control}
        name="freelanceSpecific.languagePreference"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base",
              colorClasses.text.emerald
            )}>
              <Languages className="h-4 w-4 mr-2 shrink-0" />
              Language Preference
            </FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value || undefined}
            >
              <FormControl>
                <SelectTrigger className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "h-12 w-full"
                )}>
                  <SelectValue placeholder="Select language (optional)" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className={cn(
                colorClasses.bg.primary,
                colorClasses.border.gray100,
                "max-h-[300px] w-full",
                "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
              )}>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
    </div>
  );
};

// ============ STEP 4: WORKFLOW & FILES (FIXED FOR MOBILE - RADIO GROUP FIXED) ============
interface Step4Props {
  form: any;
  uploadFiles: UploadedFile[];
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (id: string) => void;
  updateFileDescription: (id: string, description: string) => void;
  updateFileType: (id: string, documentType: string) => void;
  formatFileSize: (bytes: number) => string;
  getFileIcon: (file: File) => React.ReactNode;
  maxFileCount: number;
  maxFileSize: number;
  getTouchTargetSize: (size: 'sm' | 'md' | 'lg') => string;
  breakpoint: string;
}

const Step4_WorkflowAndFiles: React.FC<Step4Props> = ({
  form,
  uploadFiles,
  isUploading,
  fileInputRef,
  handleFileSelect,
  removeFile,
  updateFileDescription,
  updateFileType,
  formatFileSize,
  getFileIcon,
  maxFileCount,
  maxFileSize,
  getTouchTargetSize,
  breakpoint,
}) => {
  const workflowType = form.watch('workflowType');
  const [swipedFileId, setSwipedFileId] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent, fileId: string) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent, fileId: string) => {
    if (!touchStartX.current) return;

    const currentX = e.touches[0].clientX;
    const diff = touchStartX.current - currentX;

    if (diff > 50) {
      setSwipedFileId(fileId);
    } else if (diff < -30) {
      setSwipedFileId(null);
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Workflow Type */}
      <FormField
        control={form.control}
        name="workflowType"
        render={({ field }) => (
          <FormItem className="w-full">
            <FormLabel className={cn(
              "flex items-center text-sm sm:text-base mb-3",
              colorClasses.text.emerald
            )}>
              <Settings className="h-4 w-4 mr-2 shrink-0" />
              Workflow Type
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className={cn(
                  "w-full",
                  breakpoint === 'mobile' 
                    ? "flex flex-col gap-3" 
                    : "grid grid-cols-2 gap-4"
                )}
              >
                {WORKFLOW_TYPES.map((type) => (
                  <div key={type.value} className="w-full">
                    <RadioGroupItem
                      value={type.value}
                      id={`workflow-${type.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`workflow-${type.value}`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2",
                        "cursor-pointer transition-all w-full",
                        "min-h-[80px]",
                        getTouchTargetSize('lg'),
                        field.value === type.value
                          ? cn(colorClasses.border.emerald, colorClasses.bg.emeraldLight, "shadow-sm")
                          : cn(colorClasses.border.gray100, colorClasses.bg.primary),
                        "hover:scale-[1.02] active:scale-[0.98]"
                      )}
                    >
                      {type.value === 'open' ? (
                        <Eye className={cn("h-6 w-6 shrink-0",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.primary
                        )} />
                      ) : (
                        <Lock className={cn("h-6 w-6 shrink-0",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.primary
                        )} />
                      )}
                      <div className="flex-1">
                        <div className={cn(
                          "font-medium",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.primary
                        )}>
                          {type.label}
                        </div>
                        <div className={cn(
                          "text-xs",
                          field.value === type.value ? colorClasses.text.emerald : colorClasses.text.muted
                        )}>
                          {type.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage className={colorClasses.text.red} />
          </FormItem>
        )}
      />

      {/* Sealed Bid Confirmation */}
      {workflowType === 'closed' && (
        <FormField
          control={form.control}
          name="sealedBidConfirmation"
          render={({ field }) => (
            <FormItem className={cn(
              "flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border p-4 gap-4 w-full",
              colorClasses.border.amber,
              colorClasses.bg.amberLight
            )}>
              <div className="space-y-0.5">
                <FormLabel className={cn("flex items-center text-sm", colorClasses.text.amber)}>
                  <AlertTriangle className="h-4 w-4 mr-2 shrink-0" />
                  Sealed Bid Confirmation
                </FormLabel>
                <FormDescription className={cn("text-xs sm:text-sm", colorClasses.text.amber)}>
                  Proposals will be sealed until after the deadline. This cannot be changed after publishing.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className={cn(getTouchTargetSize('md'), "self-start sm:self-center")}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}

      {/* File Upload Settings */}
      <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4 w-full">
        <FormField
          control={form.control}
          name="maxFileSize"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className={cn("text-sm sm:text-base", colorClasses.text.emerald)}>
                Max File Size
              </FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val) * 1024 * 1024)}
                value={(field.value / (1024 * 1024)).toString()}
              >
                <FormControl>
                  <SelectTrigger className={cn(
                    colorClasses.bg.primary,
                    colorClasses.border.gray100,
                    "h-12 w-full"
                  )}>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "w-full"
                )}>
                  <SelectItem value="10">10 MB</SelectItem>
                  <SelectItem value="25">25 MB</SelectItem>
                  <SelectItem value="50">50 MB</SelectItem>
                  <SelectItem value="100">100 MB</SelectItem>
                  <SelectItem value="200">200 MB</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxFileCount"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormLabel className={cn("text-sm sm:text-base", colorClasses.text.emerald)}>
                Max Files
              </FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger className={cn(
                    colorClasses.bg.primary,
                    colorClasses.border.gray100,
                    "h-12 w-full"
                  )}>
                    <SelectValue placeholder="Select count" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className={cn(
                  colorClasses.bg.primary,
                  colorClasses.border.gray100,
                  "w-full"
                )}>
                  <SelectItem value="5">5 files</SelectItem>
                  <SelectItem value="10">10 files</SelectItem>
                  <SelectItem value="15">15 files</SelectItem>
                  <SelectItem value="20">20 files</SelectItem>
                  <SelectItem value="30">30 files</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>

      {/* Attachments */}
      <div className="space-y-4 w-full">
        <Label className={cn(
          "flex items-center text-sm sm:text-base",
          colorClasses.text.emerald
        )}>
          <Upload className="h-4 w-4 mr-2 shrink-0" />
          Attachments
        </Label>

        {/* Mobile camera option */}
        {breakpoint === 'mobile' && (
          <div className="flex flex-row gap-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.capture = 'environment';
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files.length > 0) {
                    const fakeEvent = {
                      target: { files: Array.from(files) }
                    } as unknown as React.ChangeEvent<HTMLInputElement>;
                    handleFileSelect(fakeEvent);
                  }
                };
                input.click();
              }}
              className={cn(
                "flex-1 h-14 flex-col gap-1",
                getTouchTargetSize('lg'),
                "touch-manipulation"
              )}
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">Take Photo</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex-1 h-14 flex-col gap-1",
                getTouchTargetSize('lg'),
                "touch-manipulation"
              )}
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Browse Files</span>
            </Button>
          </div>
        )}

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-4 sm:p-6 text-center transition-colors relative cursor-pointer",
            isUploading && "opacity-50 pointer-events-none",
            colorClasses.border.gray100,
            colorClasses.bg.primary,
            "hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20",
            "w-full min-h-40 sm:min-h-[200px] flex flex-col items-center justify-center"
          )}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-emerald-500', 'bg-emerald-50/50');
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50/50');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-emerald-500', 'bg-emerald-50/50');
            if (isUploading) return;

            const droppedFiles = Array.from(e.dataTransfer.files);
            const fakeEvent = {
              target: { files: droppedFiles }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileSelect(fakeEvent);
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip"
          />

          {isUploading ? (
            <div className="space-y-3">
              <Loader2 className={cn("h-8 w-8 mx-auto animate-spin", colorClasses.text.emerald)} />
              <p className={cn("text-sm font-medium", colorClasses.text.primary)}>Processing files...</p>
            </div>
          ) : (
            <>
              <Upload className={cn("h-8 w-8 mx-auto mb-2", colorClasses.text.muted)} />
              <p className={cn("text-sm font-medium", colorClasses.text.primary)}>
                {breakpoint === 'mobile'
                  ? 'Tap to browse files'
                  : 'Drag & drop files here, or click to browse'
                }
              </p>
              <p className={cn("text-xs mt-1", colorClasses.text.muted)}>
                Max {maxFileCount} files, up to {formatFileSize(maxFileSize)} each
              </p>
              <div className="flex flex-wrap gap-1 justify-center mt-2">
                <Badge variant="outline" className="text-xs">PDF</Badge>
                <Badge variant="outline" className="text-xs">DOC/DOCX</Badge>
                <Badge variant="outline" className="text-xs">XLS/XLSX</Badge>
                <Badge variant="outline" className="text-xs">Images</Badge>
              </div>
            </>
          )}
        </div>

        {/* File List */}
        {uploadFiles.length > 0 && (
          <div className="space-y-3 mt-4 w-full">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-medium", colorClasses.text.primary)}>
                  {uploadFiles.length} file{uploadFiles.length !== 1 ? 's' : ''}
                </span>
                <Badge variant="outline" className="text-xs">
                  {formatFileSize(uploadFiles.reduce((sum, f) => sum + f.file.size, 0))} total
                </Badge>
              </div>
            </div>

            <div className={cn(
              "space-y-3 max-h-[400px] overflow-y-auto pr-1 w-full",
              "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
            )}>
              {uploadFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className={cn(
                    "relative touch-pan-y w-full",
                    breakpoint === 'mobile' && "overflow-hidden"
                  )}
                  onTouchStart={(e) => handleTouchStart(e, uploadedFile.id)}
                  onTouchMove={(e) => handleTouchMove(e, uploadedFile.id)}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className={cn(
                      "flex flex-col sm:flex-row sm:items-start gap-3 p-3 border rounded-lg transition-all w-full",
                      uploadedFile.uploaded
                        ? cn("border-green-200 dark:border-green-800", colorClasses.bg.greenLight)
                        : cn(colorClasses.bg.primary, colorClasses.border.gray100),
                      uploadedFile.error && cn("border-red-200 dark:border-red-800", colorClasses.bg.redLight),
                      swipedFileId === uploadedFile.id && "translate-x-[-48px]"
                    )}
                  >
                    {/* File Icon and Basic Info Row */}
                    <div className="flex items-start gap-3 w-full">
                      {/* File Icon */}
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        uploadedFile.uploaded
                          ? colorClasses.bg.greenLight
                          : colorClasses.bg.emeraldLight
                      )}>
                        {uploadedFile.preview ? (
                          <img
                            src={uploadedFile.preview}
                            alt="Preview"
                            className="h-8 w-8 object-cover rounded"
                          />
                        ) : (
                          getFileIcon(uploadedFile.file)
                        )}
                      </div>

                      {/* File Name and Size */}
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm truncate", colorClasses.text.primary)} title={uploadedFile.file.name}>
                          {uploadedFile.file.name}
                        </p>
                        <p className={cn("text-xs", colorClasses.text.muted)}>
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                      </div>

                      {/* Desktop Actions */}
                      {breakpoint !== 'mobile' && (
                        <div className="flex items-center gap-1 shrink-0">
                          {uploadedFile.preview && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(uploadedFile.preview, '_blank')}
                              className={cn("h-7 w-7", getTouchTargetSize('sm'))}
                              title="Preview"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFile(uploadedFile.id)}
                            className={cn(
                              "h-7 w-7",
                              colorClasses.text.red,
                              "hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30",
                              getTouchTargetSize('sm')
                            )}
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {uploadedFile.progress !== undefined && uploadedFile.progress < 100 && (
                      <div className="space-y-1 w-full">
                        <Progress value={uploadedFile.progress} className="h-1" />
                        <p className={cn("text-xs", colorClasses.text.muted)}>
                          Processing... {uploadedFile.progress}%
                        </p>
                      </div>
                    )}

                    {/* Success Indicator */}
                    {uploadedFile.uploaded && !uploadedFile.error && (
                      <div className={cn("flex items-center gap-1 text-xs", colorClasses.text.green)}>
                        <CheckCircle className="h-3 w-3" />
                        <span>Ready for submission</span>
                      </div>
                    )}

                    {/* Description Input */}
                    <div className="w-full">
                      <Input
                        placeholder="File description (optional)"
                        value={uploadedFile.description}
                        onChange={(e) => updateFileDescription(uploadedFile.id, e.target.value)}
                        className={cn(
                          "text-sm h-8 sm:h-9 w-full",
                          colorClasses.bg.primary,
                          colorClasses.border.gray100
                        )}
                      />
                    </div>

                    {/* Document Type Select */}
                    <div className="w-full">
                      <Select
                        value={uploadedFile.documentType}
                        onValueChange={(value) => updateFileType(uploadedFile.id, value)}
                      >
                        <SelectTrigger className={cn(
                          "h-8 sm:h-9 text-sm w-full",
                          colorClasses.bg.primary,
                          colorClasses.border.gray100
                        )}>
                          <SelectValue placeholder="Document type" />
                        </SelectTrigger>
                        <SelectContent className={cn(
                          colorClasses.bg.primary,
                          colorClasses.border.gray100,
                          "w-full"
                        )}>
                          {DOCUMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.split('_').map(word =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Mobile swipe delete button */}
                  {breakpoint === 'mobile' && swipedFileId === uploadedFile.id && (
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className={cn(
                        "absolute right-0 top-1/2 -translate-y-1/2",
                        "w-12 h-12 flex items-center justify-center",
                        colorClasses.text.red,
                        getTouchTargetSize('lg'),
                        "touch-manipulation"
                      )}
                      aria-label="Delete file"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ STEP 5: REVIEW ============
interface Step5Props {
  form: any;
  uploadFiles: UploadedFile[];
  skillsRequired: string[];
  findCategoryById: (id: string) => any;
  formatFileSize: (bytes: number) => string;
  generatedTenderId: string;
  copyTenderId: () => void;
  copied: boolean;
  onSubmitDraft: () => void;
  onSubmitPublish: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  getTouchTargetSize: (size: 'sm' | 'md' | 'lg') => string;
  breakpoint: string;
}

const Step5_Review: React.FC<Step5Props> = ({
  form,
  uploadFiles,
  skillsRequired,
  findCategoryById,
  formatFileSize,
  generatedTenderId,
  copyTenderId,
  copied,
  onSubmitDraft,
  onSubmitPublish,
  isSubmitting,
  submitError,
  getTouchTargetSize,
  breakpoint,
}) => {
  const values = form.getValues();
  const category = values.procurementCategory ? findCategoryById(values.procurementCategory) : null;
  const totalSize = uploadFiles.reduce((sum, f) => sum + (f.file?.size || 0), 0);
  const currency = values.freelanceSpecific?.budget?.currency ||
    values.freelanceSpecific?.hourlyRate?.currency || 'USD';

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatRate = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + '/hr';
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Tender ID Card */}
      <Card className={cn("border w-full", colorClasses.border.emerald)}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg shrink-0", colorClasses.bg.emeraldLight)}>
                <Hash className={cn("h-5 w-5", colorClasses.text.emerald)} />
              </div>
              <div>
                <p className={cn("text-sm", colorClasses.text.muted)}>Tender ID</p>
                <div className="flex items-center gap-2">
                  <p className={cn("font-mono text-xl font-bold break-all", colorClasses.text.emerald)}>
                    {generatedTenderId}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={copyTenderId}
                    className={cn(
                      "h-8 w-8 shrink-0",
                      getTouchTargetSize('sm'),
                      "touch-manipulation"
                    )}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "self-start sm:self-center",
                colorClasses.bg.emeraldLight,
                colorClasses.text.emerald,
                colorClasses.border.emerald
              )}
            >
              {values.status === 'published' ? 'Ready to Publish' : 'Draft Preview'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Main Summary Card */}
      <Card className={cn("border shadow-sm w-full", colorClasses.border.gray100)}>
        <CardHeader className="pb-3">
          <CardTitle className={cn("text-lg flex items-center", colorClasses.text.emerald)}>
            <FileText className="h-5 w-5 mr-2" />
            Tender Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {/* Left Column */}
            <div className="space-y-4 w-full">
              <h4 className={cn("text-sm font-medium mb-3 flex items-center", colorClasses.text.muted)}>
                <FileText className="h-4 w-4 mr-1" />
                Basic Information
              </h4>
              <div className="space-y-3 w-full">
                <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                  <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Title</p>
                  <p className={cn("font-medium break-words", colorClasses.text.primary)}>{values.title}</p>
                </div>
                <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                  <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Category</p>
                  <p className={cn("font-medium break-words", colorClasses.text.primary)}>
                    {category?.name || values.procurementCategory}
                  </p>
                </div>
                <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                  <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Experience Level</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      values.experienceLevel === 'entry' && colorClasses.bg.green,
                      values.experienceLevel === 'intermediate' && colorClasses.bg.amber,
                      values.experienceLevel === 'expert' && colorClasses.bg.red,
                    )} />
                    <span className={cn("font-medium", colorClasses.text.primary)}>
                      {EXPERIENCE_LEVELS.find(l => l.value === values.experienceLevel)?.label}
                    </span>
                  </div>
                </div>
                <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                  <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Deadline</p>
                  <p className={cn("font-medium", colorClasses.text.primary)}>
                    {values.deadlineDate?.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4 w-full">
              <h4 className={cn("text-sm font-medium mb-3 flex items", colorClasses.text.muted)}>
                <DollarSign className="h-4 w-4 mr-1" />
                Budget & Engagement
              </h4>
              <div className="space-y-3 w-full">
                <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                  <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Type</p>
                  <p className={cn("font-medium", colorClasses.text.primary)}>
                    {values.freelanceSpecific?.engagementType === 'fixed_price' ? 'Fixed Price' : 'Hourly'}
                  </p>
                </div>

                {values.freelanceSpecific?.engagementType === 'fixed_price' && values.freelanceSpecific?.budget && (
                  <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                    <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Budget Range</p>
                    <p className={cn("font-medium break-words", colorClasses.text.emerald)}>
                      {formatCurrency(values.freelanceSpecific.budget.min)} - {formatCurrency(values.freelanceSpecific.budget.max)}
                    </p>
                  </div>
                )}

                {values.freelanceSpecific?.engagementType === 'hourly' && (
                  <>
                    <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                      <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Hourly Rate Range</p>
                      <p className={cn("font-medium break-words", colorClasses.text.emerald)}>
                        {formatRate(values.freelanceSpecific.hourlyRate.min)} - {formatRate(values.freelanceSpecific.hourlyRate.max)}
                      </p>
                    </div>
                    <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                      <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Weekly Hours</p>
                      <p className={cn("font-medium", colorClasses.text.primary)}>
                        {values.freelanceSpecific.weeklyHours} hours/week
                      </p>
                    </div>
                  </>
                )}

                <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                  <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Project Type</p>
                  <p className={cn("font-medium", colorClasses.text.primary)}>
                    {PROJECT_TYPES.find(t => t.value === values.freelanceSpecific?.projectType)?.label || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Requirements Section */}
          <div className="space-y-4 w-full">
            <h4 className={cn("text-sm font-medium mb-3 flex items", colorClasses.text.muted)}>
              <ListChecks className="h-4 w-4 mr-1" />
              Requirements
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className={cn("p-3 rounded-lg", colorClasses.bg.secondary)}>
                <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Portfolio</p>
                <p className={cn("font-medium",
                  values.portfolioRequired ? colorClasses.text.emerald : colorClasses.text.primary
                )}>
                  {values.portfolioRequired ? 'Required' : 'Optional'}
                </p>
              </div>
              <div className={cn("p-3 rounded-lg", colorClasses.bg.secondary)}>
                <p className={cn("text-xs mb-1", colorClasses.text.muted)}>NDA</p>
                <p className={cn("font-medium",
                  values.ndaRequired ? colorClasses.text.emerald : colorClasses.text.primary
                )}>
                  {values.ndaRequired ? 'Required' : 'Not Required'}
                </p>
              </div>
              {values.industry && (
                <div className={cn("p-3 rounded-lg", colorClasses.bg.secondary)}>
                  <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Industry</p>
                  <p className={cn("font-medium", colorClasses.text.primary)}>{values.industry}</p>
                </div>
              )}
              <div className={cn("p-3 rounded-lg", colorClasses.bg.secondary)}>
                <p className={cn("text-xs mb-1", colorClasses.text.muted)}>Urgency</p>
                <p className={cn("font-medium",
                  values.urgency === 'urgent' ? colorClasses.text.amber : colorClasses.text.primary
                )}>
                  {values.urgency === 'urgent' ? 'Urgent' : 'Normal'}
                </p>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="w-full">
            <h4 className={cn("text-sm font-medium mb-3 flex items", colorClasses.text.muted)}>
              <Hash className="h-4 w-4 mr-1" />
              Required Skills
            </h4>
            <div className="flex flex-wrap gap-2 w-full">
              {skillsRequired.map(skill => (
                <Badge
                  key={skill}
                  className={cn(
                    colorClasses.bg.emeraldLight,
                    colorClasses.text.emerald
                  )}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {/* Attachments Summary */}
          {uploadFiles.length > 0 && (
            <div className="w-full">
              <h4 className={cn("text-sm font-medium mb-3 flex items", colorClasses.text.muted)}>
                <Upload className="h-4 w-4 mr-1" />
                Attachments ({uploadFiles.length})
              </h4>
              <div className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-sm", colorClasses.text.primary)}>Total Size</span>
                  <span className={cn("font-medium", colorClasses.text.primary)}>{formatFileSize(totalSize)}</span>
                </div>
                <div className={cn(
                  "space-y-2 max-h-40 overflow-y-auto w-full",
                  "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
                )}>
                  {uploadFiles.map((f, i) => (
                    <div key={f.id} className="flex items-center gap-2 text-sm w-full">
                      <FileText className={cn("h-4 w-4 shrink-0", colorClasses.text.emerald)} />
                      <span className={cn("flex-1 truncate", colorClasses.text.primary)} title={f.file.name}>
                        {f.file.name}
                      </span>
                      <span className={cn("text-xs shrink-0", colorClasses.text.muted)}>
                        {formatFileSize(f.file.size)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Screening Questions Preview */}
          {values.screeningQuestions?.length > 0 && (
            <div className="w-full">
              <h4 className={cn("text-sm font-medium mb-3 flex items", colorClasses.text.muted)}>
                <ListChecks className="h-4 w-4 mr-1" />
                Screening Questions ({values.screeningQuestions.length})
              </h4>
              <div className={cn(
                "space-y-2 max-h-60 overflow-y-auto w-full",
                "scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600"
              )}>
                {values.screeningQuestions.map((q: any, i: number) => (
                  <div key={i} className={cn("p-3 rounded-lg w-full", colorClasses.bg.secondary)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm flex-1 break-words", colorClasses.text.primary)}>
                        <span className="font-medium mr-2">{i + 1}.</span>
                        {q.question}
                      </p>
                      {q.required && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs shrink-0",
                            colorClasses.bg.redLight,
                            colorClasses.text.red,
                            colorClasses.border.red
                          )}
                        >
                          Required
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Warning Alert */}
      <Alert className={cn(
        "w-full",
        colorClasses.bg.amberLight,
        colorClasses.border.amber
      )}>
        <AlertTriangle className={cn("h-4 w-4", colorClasses.text.amber)} />
        <AlertTitle className={colorClasses.text.amber}>Important</AlertTitle>
        <AlertDescription className={colorClasses.text.amber}>
          {values.workflowType === 'closed'
            ? 'This tender uses sealed bidding. Once published, it will be locked and cannot be edited. Proposals will be hidden until the deadline.'
            : 'Open tenders can be edited after publishing, but changes may affect existing applications.'
          }
        </AlertDescription>
      </Alert>

      {/* Submit Buttons */}
      <div className={cn(
        "flex flex-col sm:flex-row gap-3 justify-end w-full",
        breakpoint === 'mobile' && "sticky bottom-0 pt-2 pb-4",
        colorClasses.bg.primary
      )}>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onSubmitDraft}
          disabled={isSubmitting}
          className={cn(
            "w-full sm:w-auto",
            getTouchTargetSize('lg'),
            "touch-manipulation"
          )}
        >
          <Save className="h-4 w-4 mr-2" />
          Save as Draft
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onSubmitPublish}
          disabled={isSubmitting}
          className={cn(
            "w-full sm:w-auto",
            colorClasses.bg.emerald,
            colorClasses.text.white,
            getTouchTargetSize('lg'),
            "touch-manipulation"
          )}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Publishing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publish Now
            </>
          )}
        </Button>
      </div>

      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive" className="animate-in fade-in-50 w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FreelanceTenderForm;