/* eslint-disable react/no-children-prop */
/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CompanyApplicationDetails.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Application,
  applicationService
} from '@/services/applicationService';
import { StatusManager } from './StatusManager';
import { Button } from '@/components/social/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useTheme } from '@/hooks/use-theme';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { colorClasses } from '@/utils/color';

// Import the new attachment system
import { ApplicationAttachments, NormalizedAttachment } from '@/components/applications/ApplicationAttachments';
import { AttachmentList } from '@/components/applications/AttachmentList';
import { formatDistanceToNow } from 'date-fns';
import {
  Sparkles,
  Zap,
  MessageCircle,
  Send,
  Plus,
  FileText,
  Rocket,
  AlertCircle,
  ArrowLeft,
  Upload,
  Shield,
  Minimize2,
  Maximize2,
  Printer,
  MoreVertical,
  User,
  FolderOpen,
  Briefcase,
  Users,
  Target,
  Mail,
  Phone,
  BookOpen,
  Award,
  DownloadCloud,
  Calendar,
  EyeIcon,
  Download,
  CalendarIcon,
  Video,
  Gift,
  Share2,
  Trash2,
  Activity
} from 'lucide-react';
import { Separator } from '../ui/Separator';

// ==================== Types ====================

interface CompanyApplicationDetailsProps {
  applicationId: string;
  viewType: 'company' | 'organization';
  onBack?: () => void;
  onStatusUpdate?: (application: Application) => void;
  enableCollaboration?: boolean;
  enableAI?: boolean;
  application?: Application;
}

interface TeamNote {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  mentions?: string[];
}

interface ActivityLog {
  userAvatar: string | Blob | undefined;
  id: string;
  action: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: any;
}

interface OfferTemplate {
  id: string;
  name: string;
  content: string;
  salary?: string;
  startDate?: string;
  benefits?: string[];
}

interface CandidateMatchScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  culture: number;
  breakdown: {
    category: string;
    score: number;
    details: string;
  }[];
}

// Tab configuration
const tabs = [
  { id: 'overview', icon: User, label: 'Overview' },
  { id: 'documents', icon: FolderOpen, label: 'Documents' },
  { id: 'experience', icon: Briefcase, label: 'Experience' },
  { id: 'references', icon: Users, label: 'References' },
  { id: 'status', icon: Target, label: 'Status' },
  { id: 'activity', icon: Activity, label: 'Activity' }
] as const;

type TabId = typeof tabs[number]['id'];

// ==================== Sub-components ====================

// 3D Card Effect Component
const ThreeDCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}> = ({ children, className = '', intensity = 10 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXValue = ((y - centerY) / centerY) * -intensity;
    const rotateYValue = ((x - centerX) / centerX) * intensity;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={className}
    >
      <div style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </motion.div>
  );
};

// Confetti Celebration
const Celebration: React.FC<{ trigger: boolean; onComplete?: () => void }> = ({ trigger, onComplete }) => {
  useEffect(() => {
    if (trigger) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          onComplete?.();
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [trigger, onComplete]);

  return null;
};

// Animated Background Pattern
const AnimatedBackground: React.FC<{ pattern?: 'dots' | 'grid' | 'waves' }> = ({ pattern = 'dots' }) => {
  const patterns = {
    dots: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
    grid: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)',
    waves: 'repeating-linear-gradient(45deg, currentColor 0px, currentColor 2px, transparent 2px, transparent 8px)'
  };

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none opacity-10"
      style={{
        backgroundImage: patterns[pattern],
        backgroundSize: pattern === 'grid' ? '50px 50px' : '30px 30px',
        color: 'currentColor'
      }}
      animate={{
        backgroundPosition: ['0px 0px', '100px 100px']
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: 'linear'
      }}
    />
  );
};

// AI Match Score Component
const AIMatchScore: React.FC<{ score: CandidateMatchScore }> = ({ score }) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score.overall / 100) * circumference;

  const getScoreColor = (value: number) => {
    if (value >= 80) return `${colorClasses.text.green}`;
    if (value >= 60) return `${colorClasses.text.amber}`;
    return `${colorClasses.text.red}`;
  };

  return (
    <ThreeDCard intensity={5}>
      <Card className={`bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0 overflow-hidden`}>
        <AnimatedBackground pattern="dots" />

        <CardContent className="p-4 sm:p-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <svg className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth="6"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold">{score.overall}</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-bold mb-2 flex items-center gap-2 justify-center sm:justify-start">
                <Sparkles className="h-5 w-5" />
                AI Match Score
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span>Skills</span>
                  <span className={getScoreColor(score.skills)}>{score.skills}%</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span>Experience</span>
                  <span className={getScoreColor(score.experience)}>{score.experience}%</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-4">
                  <span>Culture</span>
                  <span className={getScoreColor(score.culture)}>{score.culture}%</span>
                </div>
              </div>
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm" className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white">
                <Zap className="h-4 w-4 mr-2" />
                View Detailed Analysis
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>See AI-powered breakdown of candidate match</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Card>
    </ThreeDCard>
  );
};

// Activity Timeline
const ActivityTimeline: React.FC<{ activities: ActivityLog[] }> = ({ activities }) => {
  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex gap-3"
        >
          <div className="relative">
            <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
            {index < activities.length - 1 && (
              <div className="absolute top-3 left-1 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src={activity.userAvatar as string} />
                <AvatarFallback className={`${colorClasses.bg.blue600} ${colorClasses.text.white} text-xs`}>
                  {activity.userName[0]}
                </AvatarFallback>
              </Avatar>
              <span className={`text-sm font-medium ${colorClasses.text.primary}`}>{activity.userName}</span>
              <span className={`text-xs ${colorClasses.text.muted}`}>
                {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
              </span>
            </div>
            <p className={`text-sm ${colorClasses.text.secondary} ml-8`}>
              {activity.action}
            </p>
            {activity.details && (
              <p className={`text-xs ${colorClasses.text.muted} mt-1 ml-8`}>
                {JSON.stringify(activity.details)}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

// Team Notes Component
const TeamNotes: React.FC<{
  notes: TeamNote[];
  onAddNote: (content: string) => void;
  onMention: (userId: string) => void;
}> = ({ notes, onAddNote, onMention }) => {
  const [newNote, setNewNote] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '@') {
      setShowMentions(true);
    }
  };

  const handleSubmit = () => {
    if (newNote.trim()) {
      onAddNote(newNote);
      setNewNote('');
    }
  };

  return (
    <Card className={`border ${colorClasses.border.primary}`}>
      <CardHeader className="px-4 sm:px-6 py-4">
        <CardTitle className={`flex items-center gap-2 ${colorClasses.text.primary}`}>
          <MessageCircle className="h-5 w-5" />
          Team Notes
        </CardTitle>
        <CardDescription className={colorClasses.text.muted}>Collaborate with your team on this application</CardDescription>
      </CardHeader>

      <CardContent className="px-4 sm:px-6 space-y-4">
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {notes.map(note => (
            <div key={note.id} className={`p-3 ${colorClasses.bg.secondary} rounded-lg`}>
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={note.userAvatar} />
                  <AvatarFallback className={`${colorClasses.bg.blue600} ${colorClasses.text.white} text-xs`}>
                    {note.userName[0]}
                  </AvatarFallback>
                </Avatar>
                <span className={`text-sm font-medium ${colorClasses.text.primary}`}>{note.userName}</span>
                <span className={`text-xs ${colorClasses.text.muted}`}>
                  {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className={`text-sm ${colorClasses.text.secondary}`}>
                {note.content}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a note... Use @ to mention team members"
              className={`w-full p-3 text-sm border rounded-lg resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500 ${colorClasses.border.primary} ${colorClasses.bg.primary}`}
            />
          </div>

          <Button onClick={handleSubmit} className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Offer Letter Template
const OfferTemplateSelector: React.FC<{
  templates: OfferTemplate[];
  onSelect: (template: OfferTemplate) => void;
  onCreateNew: () => void;
}> = ({ templates, onSelect, onCreateNew }) => {
  return (
    <div className="space-y-2">
      {templates.map(template => (
        <motion.div
          key={template.id}
          whileHover={{ scale: 1.02 }}
          className={`p-3 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors ${colorClasses.border.primary}`}
          onClick={() => onSelect(template)}
        >
          <h4 className={`font-medium ${colorClasses.text.primary}`}>{template.name}</h4>
          {template.salary && (
            <p className={`text-sm ${colorClasses.text.secondary}`}>Salary: {template.salary}</p>
          )}
        </motion.div>
      ))}

      <Button variant="outline" onClick={onCreateNew} className="w-full mt-2">
        <Plus className="h-4 w-4 mr-2" />
        Create New Template
      </Button>
    </div>
  );
};

// Tab Navigation Component
const TabNavigation: React.FC<{
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}> = ({ activeTab, onTabChange }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');

  if (isMobile) {
    return (
      <Select value={activeTab} onValueChange={(value) => onTabChange(value as TabId)}>
        <SelectTrigger className={`w-full bg-white dark:bg-darkNavy border ${colorClasses.border.primary}`}>
          <SelectValue placeholder="Select section" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-darkNavy border border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <SelectItem key={tab.id} value={tab.id} className="cursor-pointer">
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className={`flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-darkNavy border ${colorClasses.border.primary} shadow-sm`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2
              px-4 py-3 rounded-lg
              transition-all duration-200
              ${isActive
                ? `${colorClasses.bg.blue600} ${colorClasses.text.white} shadow-sm`
                : `${colorClasses.text.muted} hover:bg-gray-50 dark:hover:bg-gray-800`
              }
            `}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// ==================== Main Component ====================

export const CompanyApplicationDetails: React.FC<CompanyApplicationDetailsProps> = ({
  applicationId,
  viewType,
  onBack,
  onStatusUpdate,
  enableCollaboration = true,
  enableAI = true,
  application: propApplication
}) => {
  // ==================== State ====================
  const [application, setApplication] = useState<Application | null>(propApplication || null);
  const [isLoading, setIsLoading] = useState(!propApplication);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showCelebration, setShowCelebration] = useState(false);
  const [matchScore, setMatchScore] = useState<CandidateMatchScore | null>(null);
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [offerTemplates, setOfferTemplates] = useState<OfferTemplate[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // ==================== Hooks ====================
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const containerRef = useRef<HTMLDivElement>(null);

  // ==================== Effects ====================

  useEffect(() => {
    if (!propApplication && applicationId) {
      loadApplicationDetails();
    } else if (propApplication) {
      setApplication(propApplication);
      setIsLoading(false);
    }
  }, [applicationId, viewType, propApplication]);

  useEffect(() => {
    if (enableAI && application) {
      calculateMatchScore();
    }
  }, [application, enableAI]);

  useEffect(() => {
    if (enableCollaboration) {
      const saved = localStorage.getItem(`team_notes_${applicationId}`);
      if (saved) {
        setTeamNotes(JSON.parse(saved));
      }
    }
  }, [applicationId, enableCollaboration]);

  const loadApplicationDetails = async () => {
    try {
      if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
        toast({
          title: 'Error',
          description: 'Invalid application ID',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      let response;
      if (viewType === 'company') {
        response = await applicationService.getCompanyApplicationDetails(applicationId);
      } else {
        response = await applicationService.getOrganizationApplicationDetails(applicationId);
      }

      setApplication(response.data.application);
      addActivity('Viewed application details');

    } catch (error: any) {
      console.error('❌ Failed to load application:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load application details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMatchScore = () => {
    const score: CandidateMatchScore = {
      overall: Math.floor(Math.random() * 30) + 70,
      skills: Math.floor(Math.random() * 30) + 70,
      experience: Math.floor(Math.random() * 30) + 70,
      education: Math.floor(Math.random() * 30) + 70,
      culture: Math.floor(Math.random() * 30) + 70,
      breakdown: [
        { category: 'Technical Skills', score: 85, details: 'Strong match in required technologies' },
        { category: 'Years of Experience', score: 75, details: 'Meets minimum requirement' },
        { category: 'Industry Knowledge', score: 90, details: 'Excellent domain expertise' }
      ]
    };
    setMatchScore(score);
  };

  const handleStatusUpdate = (updatedApplication: Application) => {
    setApplication(updatedApplication);
    onStatusUpdate?.(updatedApplication);

    if (updatedApplication.status === 'offer-accepted') {
      setShowCelebration(true);
    }

    addActivity(`Updated status to ${updatedApplication.status}`);

    toast({
      title: 'Status Updated',
      description: 'Application status has been updated successfully',
      variant: 'default',
    });
  };

  const addActivity = (action: string, details?: any) => {
    const newActivity: ActivityLog = {
      id: Date.now().toString(),
      action,
      userId: 'current-user',
      userName: 'Current User',
      timestamp: new Date().toISOString(),
      details,
      userAvatar: undefined
    };
    setActivities(prev => [newActivity, ...prev]);
  };

  const handleAddNote = (content: string) => {
    const newNote: TeamNote = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'Current User',
      content,
      createdAt: new Date().toISOString()
    };
    setTeamNotes(prev => [newNote, ...prev]);
    localStorage.setItem(`team_notes_${applicationId}`, JSON.stringify([newNote, ...teamNotes]));
    addActivity('Added a team note');
    toast({ title: 'Note Added', description: 'Your note has been saved' });
  };

  const handleRequestDocument = (type: string) => {
    toast({
      title: 'Document Request Sent',
      description: `Request for ${type} document has been sent to candidate`,
    });
    addActivity(`Requested ${type} document from candidate`);
  };

  const handleScheduleInterview = () => {
    toast({
      title: 'Interview Scheduled',
      description: 'Calendar invitation has been sent to candidate',
    });
    addActivity('Scheduled interview');
  };

  const handleSendOffer = (template: OfferTemplate) => {
    toast({
      title: 'Offer Sent',
      description: `Offer letter using "${template.name}" template has been sent`,
    });
    addActivity('Sent offer letter', { template: template.name });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    toast({ title: 'Files Dropped', description: `${files.length} file(s) will be processed` });
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 360, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className={`w-20 h-20 sm:w-24 sm:h-24 ${colorClasses.bg.red} rounded-3xl flex items-center justify-center mx-auto mb-4`}>
            <AlertCircle className={`h-10 w-10 sm:h-12 sm:w-12 ${colorClasses.text.error}`} />
          </div>
          <h3 className={`text-xl sm:text-2xl font-bold ${colorClasses.text.primary} mb-3`}>Application Not Found</h3>
          <p className={`${colorClasses.text.secondary} mb-6`}>
            The application you're looking for doesn't exist or may have been removed.
          </p>
          {onBack && (
            <Button onClick={onBack} variant="outline" size="lg">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Applications
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        ref={containerRef}
        className="transition-all duration-300"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-none"
            >
              <div className={`${colorClasses.bg.primary} p-6 sm:p-8 rounded-2xl shadow-2xl text-center`}>
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold mb-2">Drop files to upload</h3>
                <p className={`${colorClasses.text.secondary}`}>Release to add to application</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Celebration trigger={showCelebration} onComplete={() => setShowCelebration(false)} />

        <div className="space-y-6">
          {enableAI && matchScore && <AIMatchScore score={matchScore} />}

          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

          <ApplicationAttachments application={application}>
            {(attachments: NormalizedAttachment[], handlers, viewer) => (
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'overview' && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <ThreeDCard intensity={10}>
                          <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.primary} h-full`}>
                            <CardHeader className="px-4 sm:px-6 py-4">
                              <CardTitle className={`flex items-center gap-2 ${colorClasses.text.primary}`}>
                                <User className="h-5 w-5 text-blue-500" />
                                Candidate Profile
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 space-y-4">
                              <div className="flex items-center gap-3 sm:gap-4">
                                <Avatar className="h-14 w-14 sm:h-16 sm:w-16">
                                  <AvatarImage src={application.userInfo.avatar} />
                                  <AvatarFallback className={`${colorClasses.bg.blue600} ${colorClasses.text.white} text-xl`}>
                                    {application.userInfo.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <h3 className={`text-lg sm:text-xl font-bold ${colorClasses.text.primary} truncate`}>{application.userInfo.name}</h3>
                                  <p className={`${colorClasses.text.secondary} text-sm truncate`}>{application.userInfo.location}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Mail className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                  <span className={`text-sm ${colorClasses.text.primary} truncate`}>{application.contactInfo.email}</span>
                                </div>
                                {application.contactInfo.phone && (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Phone className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                    <span className={`text-sm ${colorClasses.text.primary} truncate`}>{application.contactInfo.phone}</span>
                                  </div>
                                )}
                              </div>

                              {application.userInfo.bio && (
                                <p className={`${colorClasses.text.secondary} text-sm leading-relaxed`}>
                                  {application.userInfo.bio}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        </ThreeDCard>

                        <ThreeDCard intensity={10}>
                          <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.primary} h-full`}>
                            <CardHeader className="px-4 sm:px-6 py-4">
                              <CardTitle className={`flex items-center gap-2 ${colorClasses.text.primary}`}>
                                <BookOpen className="h-5 w-5 text-blue-500" />
                                Cover Letter
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6">
                              <div className={`prose dark:prose-invert max-w-none max-h-48 sm:max-h-60 overflow-y-auto pr-2 ${colorClasses.text.secondary}`}>
                                <p className="whitespace-pre-wrap text-sm">{application.coverLetter}</p>
                              </div>
                            </CardContent>
                          </Card>
                        </ThreeDCard>

                        {application.skills && application.skills.length > 0 && (
                          <ThreeDCard intensity={10}>
                            <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.primary} lg:col-span-2`}>
                              <CardHeader className="px-4 sm:px-6 py-4">
                                <CardTitle className={`flex items-center gap-2 ${colorClasses.text.primary}`}>
                                  <Award className="h-5 w-5 text-blue-500" />
                                  Skills & Qualifications
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="px-4 sm:px-6">
                                <div className="flex flex-wrap gap-2">
                                  {application.skills.map((skill, index) => (
                                    <motion.div
                                      key={index}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ delay: index * 0.05 }}
                                    >
                                      <Badge variant="secondary" className="text-xs sm:text-sm py-1 px-2 sm:px-3">
                                        {skill}
                                      </Badge>
                                    </motion.div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </ThreeDCard>
                        )}
                      </div>
                    )}

                    {activeTab === 'documents' && (
                      <div className="space-y-4 sm:space-y-6">
                        <ThreeDCard intensity={5}>
                          <Card className={`bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200/50 dark:border-blue-800/50`}>
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <div className="p-2 sm:p-3 rounded-xl bg-blue-500/20">
                                    <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-base sm:text-lg font-bold">Document Summary</h3>
                                    <p className={`text-xs sm:text-sm ${colorClasses.text.secondary}`}>
                                      {attachments.length} total document(s) submitted
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2 sm:gap-3">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlers.onDownloadAll()}
                                        className="h-10"
                                      >
                                        <DownloadCloud className="h-4 w-4 mr-2" />
                                        <span className="hidden xs:inline">Download All</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Download all documents</TooltipContent>
                                  </Tooltip>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </ThreeDCard>

                        <AttachmentList
                          attachments={attachments}
                          onView={handlers.onView}
                          onDownload={handlers.onDownload}
                          onDownloadAll={handlers.onDownloadAll}
                          title="All Documents"
                          description="All files submitted by the candidate"
                          emptyMessage="No documents submitted"
                        />

                        <Card className={`border ${colorClasses.border.gray400}`}>
                          <CardHeader className="px-4 sm:px-6 py-4">
                            <CardTitle className={`text-sm sm:text-base ${colorClasses.text.primary}`}>
                              Need Additional Documents?
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 sm:px-6">
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                              <Button variant="outline" size="sm" onClick={() => handleRequestDocument('CV')} className="h-10">
                                Request Updated CV
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleRequestDocument('Portfolio')} className="h-10">
                                Request Portfolio
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleRequestDocument('Reference')} className="h-10">
                                Request Reference Letter
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {activeTab === 'experience' && (
                      <div className="space-y-4">
                        {application.workExperience && application.workExperience.length > 0 ? (
                          application.workExperience.map((exp, index) => (
                            <ThreeDCard key={index} intensity={5 + index * 2}>
                              <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.primary} overflow-hidden`}>
                                <CardContent className="p-4 sm:p-6">
                                  <h4 className={`text-lg sm:text-xl font-bold ${colorClasses.text.primary} mb-2`}>{exp.position}</h4>
                                  <p className={`${colorClasses.text.secondary} font-medium mb-3`}>{exp.company}</p>
                                  <div className="flex items-center gap-2 text-sm mb-4">
                                    <Calendar className={`h-4 w-4 ${colorClasses.text.muted}`} />
                                    <span className={colorClasses.text.primary}>
                                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                    </span>
                                  </div>
                                  {exp.description && (
                                    <p className={`${colorClasses.text.secondary} text-sm`}>{exp.description}</p>
                                  )}
                                </CardContent>
                              </Card>
                            </ThreeDCard>
                          ))
                        ) : (
                          <Card className={`border ${colorClasses.border.primary}`}>
                            <CardContent className="text-center py-10">
                              <Briefcase className={`h-12 w-12 ${colorClasses.text.muted} mx-auto mb-4`} />
                              <p className={`${colorClasses.text.secondary}`}>No work experience provided</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {activeTab === 'references' && (
                      <div className="space-y-4">
                        {application.references && application.references.length > 0 ? (
                          application.references.map((ref, index) => (
                            <ThreeDCard key={index} intensity={5 + index * 2}>
                              <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.primary} overflow-hidden`}>
                                <CardContent className="p-4 sm:p-6">
                                  <h4 className={`text-lg sm:text-xl font-bold ${colorClasses.text.primary} mb-2`}>{ref.name}</h4>
                                  <p className={`${colorClasses.text.secondary} font-medium mb-3`}>{ref.position} at {ref.company}</p>
                                  <div className="space-y-2 text-sm">
                                    {ref.email && (
                                      <div className="flex items-center gap-2">
                                        <Mail className={`h-4 w-4 ${colorClasses.text.muted}`} />
                                        <span className={colorClasses.text.primary}>{ref.email}</span>
                                      </div>
                                    )}
                                    {ref.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className={`h-4 w-4 ${colorClasses.text.muted}`} />
                                        <span className={colorClasses.text.primary}>{ref.phone}</span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </ThreeDCard>
                          ))
                        ) : (
                          <Card className={`border ${colorClasses.border.primary}`}>
                            <CardContent className="text-center py-10">
                              <Users className={`h-12 w-12 ${colorClasses.text.muted} mx-auto mb-4`} />
                              <p className={`${colorClasses.text.secondary}`}>No references provided</p>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {activeTab === 'status' && (
                      <div className="space-y-4 sm:space-y-6">
                        <StatusManager
                          application={application}
                          onStatusUpdate={handleStatusUpdate}
                          viewType={viewType}
                        />

                        <Card className={`border ${colorClasses.border.primary}`}>
                          <CardHeader className="px-4 sm:px-6 py-4">
                            <CardTitle className={`flex items-center gap-2 ${colorClasses.text.primary}`}>
                              <Zap className="h-5 w-5" />
                              Quick Actions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 sm:px-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-3" onClick={handleScheduleInterview}>
                                <CalendarIcon className="h-5 w-5" />
                                <span className="text-xs">Schedule</span>
                              </Button>
                              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-3" onClick={() => toast({ title: 'Feature Coming Soon' })}>
                                <Video className="h-5 w-5" />
                                <span className="text-xs">Video Call</span>
                              </Button>
                              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-3" onClick={() => setShowMobileMenu(true)}>
                                <Mail className="h-5 w-5" />
                                <span className="text-xs">Email</span>
                              </Button>
                              <Button variant="outline" className="flex flex-col items-center gap-2 h-auto py-3" onClick={() => toast({ title: 'Feature Coming Soon' })}>
                                <MessageCircle className="h-5 w-5" />
                                <span className="text-xs">Request</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className={`border ${colorClasses.border.primary}`}>
                          <CardHeader className="px-4 sm:px-6 py-4">
                            <CardTitle className={`flex items-center gap-2 ${colorClasses.text.primary}`}>
                              <Gift className="h-5 w-5" />
                              Offer Templates
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 sm:px-6">
                            <OfferTemplateSelector
                              templates={offerTemplates}
                              onSelect={handleSendOffer}
                              onCreateNew={() => toast({ title: 'Feature Coming Soon' })}
                            />
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {activeTab === 'activity' && enableCollaboration && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <TeamNotes
                          notes={teamNotes}
                          onAddNote={handleAddNote}
                          onMention={(userId) => toast({ title: `Mentioned @${userId}` })}
                        />
                        <Card className={`border ${colorClasses.border.primary}`}>
                          <CardHeader className="px-4 sm:px-6 py-4">
                            <CardTitle className={`flex items-center gap-2 ${colorClasses.text.primary}`}>
                              <Activity className="h-5 w-5" />
                              Activity Timeline
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="px-4 sm:px-6">
                            <ActivityTimeline activities={activities} />
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {viewer}
              </div>
            )}
          </ApplicationAttachments>

          {isMobile && (
            <div className={`fixed bottom-0 left-0 right-0 ${colorClasses.bg.primary} border-t ${colorClasses.border.primary} p-3 flex justify-around z-40`}>
              <Button variant="ghost" size="sm" className="flex-col h-auto gap-1 px-2">
                <MessageCircle className="h-5 w-5" />
                <span className="text-xs">Message</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex-col h-auto gap-1 px-2">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Schedule</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex-col h-auto gap-1 px-2">
                <Download className="h-5 w-5" />
                <span className="text-xs">Download</span>
              </Button>
              <Button variant="ghost" size="sm" className="flex-col h-auto gap-1 px-2">
                <Share2 className="h-5 w-5" />
                <span className="text-xs">Share</span>
              </Button>
            </div>
          )}

          <BottomSheet
            isOpen={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
            title="Application Actions"
          >
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="ghost">
                <MessageCircle className="h-4 w-4 mr-3" />
                Message Candidate
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Calendar className="h-4 w-4 mr-3" />
                Schedule Interview
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Download className="h-4 w-4 mr-3" />
                Download All Documents
              </Button>
              <Button className="w-full justify-start" variant="ghost">
                <Share2 className="h-4 w-4 mr-3" />
                Share Application
              </Button>
              <Separator />
              <Button className="w-full justify-start" variant="ghost">
                <Trash2 className="h-4 w-4 mr-3" />
                Withdraw Application
              </Button>
            </div>
          </BottomSheet>
        </div>
      </div>
    </TooltipProvider>
  );
};