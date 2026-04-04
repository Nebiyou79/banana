/* eslint-disable react/no-children-prop */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Application,
  applicationService,
  CompanyResponse,
  InterviewDetails,
} from '@/services/applicationService';
import { jobService, Job } from '@/services/jobService';
import { companyService } from '@/services/companyService';
import { organizationService } from '@/services/organizationService';
import { Button } from '@/components/social/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { Progress } from '@/components/ui/Progress';
import { useToast } from '@/hooks/use-toast';
import { useMediaQuery } from '@/hooks/use-media-query';
import { colorClasses } from '@/utils/color';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

// Import the new attachment system
import { ApplicationAttachments, NormalizedAttachment, AttachmentHandlers } from '@/components/applications/ApplicationAttachments';
import { AttachmentList } from '@/components/applications/AttachmentList';
import {
  AlertCircle,
  Award,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Gift,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Users,
  Video,
  XCircle,
  Activity,
  FolderOpen,
  User,
  Target,
  Globe,
  ArrowLeft,
} from 'lucide-react';

// ==================== Types ====================

interface CandidateApplicationDetailsProps {
  applicationId: string;
  onBack?: () => void;
  enableOffline?: boolean;
}

interface DocumentValidation {
  isValid: boolean;
  issues: string[];
  lastChecked: string;
}

// Company Response Timeline Item
interface CompanyResponseItem {
  id: string;
  status: string;
  message: string;
  respondedAt: string;
  respondedBy?: {
    name: string;
    email: string;
    _id?: string;
  };
  interviewDetails?: {
    date: string;
    location: string;
    type: string;
    time?: string;
    interviewer?: string;
    notes?: string;
  };
}

// Extended Application type
interface ExtendedApplication extends Omit<Application, 'companyResponse'> {
  companyResponse?: CompanyResponse & {
    interviewDetails?: InterviewDetails;
  };
  statusHistory: Array<{
    _id: string;
    status: string;
    changedBy: {
      _id: string;
      name: string;
      email: string;
    };
    changedAt: string;
    message?: string;
    interviewDetails?: InterviewDetails;
  }>;
}

// Tab configuration - SINGLE SOURCE OF TRUTH
const tabs = [
  { id: 'overview', icon: User, label: 'Overview' },
  { id: 'documents', icon: FolderOpen, label: 'Documents' },
  { id: 'experience', icon: Briefcase, label: 'Experience' },
  { id: 'references', icon: Users, label: 'References' },
  { id: 'status', icon: Activity, label: 'Timeline' },
  { id: 'company', icon: Building, label: 'Company' }
] as const;

type TabId = typeof tabs[number]['id'];

// ==================== Status Color Mapping ====================

const statusColors: Record<string, { bg: string; text: string; lightBg: string }> = {
  applied: {
    bg: colorClasses.bg.blue,
    text: 'text-white',
    lightBg: colorClasses.bg.blueLight
  },
  'under-review': {
    bg: colorClasses.bg.amber,
    text: 'text-white',
    lightBg: colorClasses.bg.amberLight
  },
  shortlisted: {
    bg: colorClasses.bg.green,
    text: 'text-white',
    lightBg: colorClasses.bg.greenLight
  },
  'interview-scheduled': {
    bg: colorClasses.bg.purple,
    text: 'text-white',
    lightBg: colorClasses.bg.purpleLight
  },
  interviewed: {
    bg: colorClasses.bg.indigo,
    text: 'text-white',
    lightBg: colorClasses.bg.indigoLight
  },
  'offer-pending': {
    bg: colorClasses.bg.orange,
    text: 'text-white',
    lightBg: colorClasses.bg.orangeLight
  },
  'offer-made': {
    bg: colorClasses.bg.emerald,
    text: 'text-white',
    lightBg: colorClasses.bg.emeraldLight
  },
  'offer-accepted': {
    bg: colorClasses.bg.green,
    text: 'text-white',
    lightBg: colorClasses.bg.greenLight
  },
  rejected: {
    bg: colorClasses.bg.red,
    text: 'text-white',
    lightBg: colorClasses.bg.redLight
  },
  'on-hold': {
    bg: colorClasses.bg.slate,
    text: 'text-white',
    lightBg: colorClasses.bg.gray100
  },
  withdrawn: {
    bg: colorClasses.bg.gray600,
    text: 'text-white',
    lightBg: colorClasses.bg.gray100
  }
};

// ==================== Sub-components ====================

// Company/Organization Info Component
const EntityInfo: React.FC<{ application: ExtendedApplication }> = ({ application }) => {
  const [entityInfo, setEntityInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const ownerName = jobService.getOwnerName(application.job as Job);
  const ownerAvatarUrl = jobService.getOwnerAvatarUrl(application.job as Job);

  const ownerInfo = application.job.jobType === 'organization'
    ? application.job.organization
    : application.job.company;

  const ownerId = ownerInfo?._id;

  useEffect(() => {
    const fetchEntityDetails = async () => {
      if (!ownerId) return;

      setIsLoading(true);
      try {
        if (application.job.jobType === 'company') {
          const company = await companyService.getCompany(ownerId);
          setEntityInfo(company);
        } else {
          const organization = await organizationService.getOrganization(ownerId);
          setEntityInfo(organization);
        }
      } catch (error) {
        console.error('Failed to fetch entity details:', error);
        setEntityInfo(ownerInfo);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntityDetails();
  }, [ownerId, application.job.jobType, ownerInfo]);

  const getAvatarUrl = () => {
    if (ownerAvatarUrl && !ownerAvatarUrl.includes('ui-avatars.com')) {
      return ownerAvatarUrl;
    }
    if (entityInfo?.avatar) return entityInfo.avatar;
    if (entityInfo?.logoUrl) return entityInfo.logoUrl;
    if (application.job.jobType === 'organization' && entityInfo?.logoFullUrl) {
      return entityInfo.logoFullUrl;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(ownerName)}&background=4DA6FF&color=fff&size=128`;
  };

  const openWebsite = () => {
    const website = entityInfo?.website;
    if (website) {
      window.open(website.startsWith('http') ? website : `https://${website}`, '_blank');
    } else {
      toast({
        title: 'No Website',
        description: 'Website URL is not available',
        variant: 'default',
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
        <div className={`h-24 bg-linear-to-r ${colorClasses.bg.blue} to-blue-600`}></div>
        <CardContent className="p-6">
          <div className="flex flex-col items-center -mt-12 mb-4">
            <Skeleton className={`w-20 h-20 rounded-full border-4 border-white ${colorClasses.bg.gray100}`} />
          </div>
          <div className="space-y-3 text-center">
            <Skeleton className={`h-6 w-48 mx-auto ${colorClasses.bg.gray100}`} />
            <Skeleton className={`h-4 w-32 mx-auto ${colorClasses.bg.gray100}`} />
            <Skeleton className={`h-20 w-full ${colorClasses.bg.gray100}`} />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
      <div className={`h-24 bg-linear-to-r ${colorClasses.bg.blue} to-purple-600`}></div>

      <CardContent className="relative pt-0 px-6 pb-6">
        <div className="flex justify-center -mt-12 mb-4">
          <img
            src={getAvatarUrl()}
            alt={ownerName}
            className="w-20 h-20 rounded-full border-4 border-white object-cover shadow-sm"
          />
        </div>

        <div className="text-center mb-6">
          <h3 className={`text-xl font-bold ${colorClasses.text.primary} mb-2`}>
            {ownerName}
          </h3>

          <Badge className={`
            ${application.job.jobType === 'organization'
              ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`
              : `${colorClasses.bg.greenLight} ${colorClasses.text.green}`}
            border-0 px-3 py-1 text-xs font-medium mb-4
          `}>
            {application.job.jobType === 'organization' ? 'Organization' : 'Company'}
          </Badge>

          {(entityInfo?.description || (application.job as Job).shortDescription) && (
            <p className={`text-sm ${colorClasses.text.muted} mb-4 max-w-2xl mx-auto`}>
              {entityInfo?.description || (application.job as Job).shortDescription}
            </p>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            {(entityInfo?.website) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={openWebsite}
                    className={`border ${colorClasses.border.gray400} ${colorClasses.text.secondary}`}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visit website</TooltipContent>
              </Tooltip>
            )}

            {application.job.jobType === 'organization' && (entityInfo?.organizationType || application.job.organization?.organizationType) && (
              <div className={`text-sm ${colorClasses.text.muted} flex items-center gap-1`}>
                <Building className="h-4 w-4" />
                <span>{entityInfo?.organizationType || application.job.organization?.organizationType}</span>
              </div>
            )}
          </div>
        </div>

        {(entityInfo?.mission || entityInfo?.values || (application.job as Job).benefits) && (
          <div className={`pt-6 border-t ${colorClasses.border.gray400}`}>
            {entityInfo?.mission && (
              <div className="mb-4">
                <h4 className={`font-semibold ${colorClasses.text.primary} mb-2 flex items-center gap-2`}>
                  <Target className={`h-4 w-4 ${colorClasses.text.blue}`} />
                  Mission
                </h4>
                <p className={`text-sm ${colorClasses.text.muted}`}>{entityInfo.mission}</p>
              </div>
            )}

            {entityInfo?.values && entityInfo.values.length > 0 && (
              <div className="mb-4">
                <h4 className={`font-semibold ${colorClasses.text.primary} mb-2 flex items-center gap-2`}>
                  <Award className={`h-4 w-4 ${colorClasses.text.blue}`} />
                  Core Values
                </h4>
                <div className="flex flex-wrap gap-2">
                  {entityInfo.values.map((value: string, index: number) => (
                    <Badge key={index} variant="outline" className={`${colorClasses.border.gray400} ${colorClasses.text.muted}`}>
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(application.job as Job).benefits && (application.job as Job).benefits!.length > 0 && (
              <div>
                <h4 className={`font-semibold ${colorClasses.text.primary} mb-2 flex items-center gap-2`}>
                  <Gift className={`h-4 w-4 ${colorClasses.text.blue}`} />
                  Benefits
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(application.job as Job).benefits!.map((benefit: string, index: number) => (
                    <Badge key={index} variant="outline" className={`${colorClasses.border.gray400} ${colorClasses.text.muted}`}>
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Status Timeline Component for Company Responses
const CompanyResponseTimeline: React.FC<{
  responses: CompanyResponseItem[],
  currentStatus: string
}> = ({ responses, currentStatus }) => {
  const sortedResponses = useMemo(() => {
    return [...responses].sort((a, b) =>
      new Date(b.respondedAt).getTime() - new Date(a.respondedAt).getTime()
    );
  }, [responses]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active-consideration': `${colorClasses.bg.greenLight} ${colorClasses.text.green}`,
      'selected-for-interview': `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`,
      'on-hold': `${colorClasses.bg.amberLight} ${colorClasses.text.amber}`,
      'rejected': `${colorClasses.bg.redLight} ${colorClasses.text.red}`,
      'offer-made': `${colorClasses.bg.emeraldLight} ${colorClasses.text.emerald}`,
      'interview-scheduled': `${colorClasses.bg.purpleLight} ${colorClasses.text.purple}`,
      'message': `${colorClasses.bg.blueLight} ${colorClasses.text.blue}`,
    };
    return colors[status] || `${colorClasses.bg.secondary} ${colorClasses.text.secondary}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active-consideration':
        return <CheckCircle className={`h-4 w-4 ${colorClasses.text.green}`} />;
      case 'selected-for-interview':
      case 'interview-scheduled':
        return <Calendar className={`h-4 w-4 ${colorClasses.text.purple}`} />;
      case 'on-hold':
        return <Clock className={`h-4 w-4 ${colorClasses.text.amber}`} />;
      case 'rejected':
        return <XCircle className={`h-4 w-4 ${colorClasses.text.red}`} />;
      case 'offer-made':
        return <Gift className={`h-4 w-4 ${colorClasses.text.emerald}`} />;
      case 'message':
        return <MessageCircle className={`h-4 w-4 ${colorClasses.text.blue}`} />;
      default:
        return <MessageCircle className={`h-4 w-4 ${colorClasses.text.muted}`} />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active-consideration': 'Active Consideration',
      'selected-for-interview': 'Selected for Interview',
      'interview-scheduled': 'Interview Scheduled',
      'on-hold': 'On Hold',
      'rejected': 'Rejected',
      'offer-made': 'Offer Made',
      'message': 'Message',
    };
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (sortedResponses.length === 0) {
    return (
      <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl`}>
        <CardContent className="text-center py-12">
          <MessageCircle className={`h-12 w-12 ${colorClasses.text.muted} mx-auto mb-4`} />
          <p className={`${colorClasses.text.primary} text-lg font-medium`}>No responses yet</p>
          <p className={`${colorClasses.text.muted} text-sm mt-2`}>
            The company will respond to your application soon
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
      <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className={`flex items-center gap-2 text-base ${colorClasses.text.primary}`}>
          <MessageCircle className={`h-5 w-5 ${colorClasses.text.blue}`} />
          Company Responses
        </CardTitle>
        <CardDescription className={colorClasses.text.muted}>
          Timeline of all communications from the employer
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {sortedResponses.map((response, index) => (
            <motion.div
              key={response.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex gap-3"
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-full ${colorClasses.bg.secondary} flex items-center justify-center`}>
                  {getStatusIcon(response.status)}
                </div>
                {index < sortedResponses.length - 1 && (
                  <div className={`absolute top-8 left-4 w-0.5 h-full ${colorClasses.bg.gray400}`} />
                )}
              </div>

              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`${getStatusColor(response.status)} border-0 px-2 py-0.5 text-xs`}>
                    {getStatusLabel(response.status)}
                  </Badge>
                  <span className={`text-xs ${colorClasses.text.muted}`}>
                    {formatDistanceToNow(new Date(response.respondedAt), { addSuffix: true })}
                  </span>
                </div>

                {response.message && (
                  <div className={`
                    p-3 rounded-lg mb-2 text-sm
                    ${colorClasses.bg.secondary} ${colorClasses.text.secondary}
                  `}>
                    {response.message}
                  </div>
                )}

                {response.interviewDetails && (
                  <div className={`
                    p-3 rounded-lg 
                    ${colorClasses.bg.purpleLight}
                    border ${colorClasses.border.purple}
                  `}>
                    <p className={`text-sm font-medium ${colorClasses.text.purple} mb-2`}>
                      Interview Details:
                    </p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className={`h-4 w-4 ${colorClasses.text.purple}`} />
                        <span className={colorClasses.text.primary}>
                          {new Date(response.interviewDetails.date).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${colorClasses.text.purple}`} />
                        <span className={colorClasses.text.primary}>
                          {response.interviewDetails.location}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Video className={`h-4 w-4 ${colorClasses.text.purple}`} />
                        <span className={colorClasses.text.primary}>
                          {response.interviewDetails.type}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Mini Stat Card Component
const MiniStatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ElementType;
  color: keyof typeof colorClasses.bg;
}> = ({ label, value, icon: Icon, color }) => {
  const bgClass = colorClasses.bg[color];

  return (
    <div className={`
      p-3 rounded-lg ${colorClasses.bg.primary} 
      border ${colorClasses.border.gray400} shadow-sm
    `}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs ${colorClasses.text.muted} mb-1`}>{label}</p>
          <p className={`text-xl font-bold ${colorClasses.text.primary}`}>{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${bgClass} bg-opacity-10`}>
          <Icon className={`h-4 w-4 ${colorClasses.text[color as keyof typeof colorClasses.text]}`} />
        </div>
      </div>
    </div>
  );
};

// ==================== Tab Navigation Component - SINGLE SOURCE ====================

const TabNavigation: React.FC<{
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}> = ({ activeTab, onTabChange }) => {
  const isMobile = useMediaQuery('(max-width: 640px)');

  if (isMobile) {
    return (
      <div 
        className="w-full overflow-x-auto mb-6"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex items-center gap-2 min-w-max pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Tooltip key={tab.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onTabChange(tab.id)}
                    className={`
                      flex items-center justify-center
                      w-12 h-12 rounded-xl shrink-0
                      transition-all duration-200
                      ${isActive
                        ? `${colorClasses.bg.blue} text-white shadow-sm`
                        : `${colorClasses.bg.secondary} ${colorClasses.text.muted} hover:${colorClasses.bg.gray100}`
                      }
                    `}
                    aria-label={tab.label}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>{tab.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={`
      flex items-center gap-1 p-1 rounded-lg
      ${colorClasses.bg.secondary} border ${colorClasses.border.gray400}
      mb-6
    `}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-2
              px-4 py-2.5 rounded-md
              transition-all duration-200
              ${isActive
                ? `${colorClasses.bg.blue} text-white shadow-sm`
                : `${colorClasses.text.muted} hover:${colorClasses.bg.gray100}`
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

export const CandidateApplicationDetails: React.FC<CandidateApplicationDetailsProps> = ({
  applicationId,
  onBack,
  enableOffline = true
}) => {
  // ==================== State ====================
  const [application, setApplication] = useState<ExtendedApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [previewDocument, setPreviewDocument] = useState<NormalizedAttachment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [allAttachments, setAllAttachments] = useState<NormalizedAttachment[]>([]);
  const [companyResponses, setCompanyResponses] = useState<CompanyResponseItem[]>([]);

  // FIX: Stable callback that defers the state update to avoid
  // "setState during render of a different component" warning.
  // ApplicationAttachments calls this from its own useEffect, which can
  // still fire during the same React flush — wrapping in setTimeout
  // ensures it runs after the current render cycle is fully committed.
  const handleAttachmentsChange = useCallback((attachments: NormalizedAttachment[]) => {
    setTimeout(() => setAllAttachments(attachments), 0);
  }, []);

  // ==================== Hooks ====================
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const contentRef = useRef<HTMLDivElement>(null);

  // ==================== Memoized Values ====================
  const canWithdraw = useMemo(() =>
    application ? applicationService.canWithdraw(application.status) : false
    , [application]);

  const documentStats = useMemo(() => {
    if (!allAttachments.length) return { total: 0, byCategory: {} };

    return {
      total: allAttachments.length,
      byCategory: allAttachments.reduce((acc, doc) => {
        acc[doc.category] = (acc[doc.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [allAttachments]);

  // ==================== Effects ====================

  // Load application details
  const loadApplicationDetails = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true);

      if (enableOffline && !forceRefresh) {
        const cached = localStorage.getItem(`application_${applicationId}`);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            setApplication(data);
            setLastUpdated(new Date(timestamp));

            if (data.companyResponse) {
              const response: CompanyResponseItem = {
                id: '1',
                status: data.companyResponse.status || 'response',
                message: data.companyResponse.message || '',
                respondedAt: data.companyResponse.respondedAt || data.updatedAt,
                respondedBy: data.companyResponse.respondedBy,
                interviewDetails: data.companyResponse.interviewDetails
              };
              setCompanyResponses([response]);
            }

            setIsLoading(false);
            return;
          }
        }
      }

      const response = await applicationService.getApplicationDetails(applicationId);
      const appData = response.data.application as ExtendedApplication;
      setApplication(appData);
      setLastUpdated(new Date());

      const responses: CompanyResponseItem[] = [];

      if (appData.companyResponse) {
        responses.push({
          id: Date.now().toString(),
          status: appData.companyResponse.status || 'response',
          message: appData.companyResponse.message || '',
          respondedAt: appData.companyResponse.respondedAt || appData.updatedAt,
          respondedBy: appData.companyResponse.respondedBy,
          interviewDetails: appData.companyResponse.interviewDetails
        });
      }

      if (appData.statusHistory) {
        appData.statusHistory.forEach((history: any, index: number) => {
          if (history.message || history.interviewDetails) {
            responses.push({
              id: `history-${index}`,
              status: history.status,
              message: history.message || '',
              respondedAt: history.changedAt,
              respondedBy: history.changedBy,
              interviewDetails: history.interviewDetails
            });
          }
        });
      }

      setCompanyResponses(responses);

      if (enableOffline) {
        localStorage.setItem(`application_${applicationId}`, JSON.stringify({
          data: appData,
          timestamp: Date.now()
        }));
      }
    } catch (error: any) {
      console.error('Failed to load application:', error);

      if (enableOffline) {
        const cached = localStorage.getItem(`application_${applicationId}`);
        if (cached) {
          const { data } = JSON.parse(cached);
          setApplication(data);

          if (data.companyResponse) {
            const response: CompanyResponseItem = {
              id: '1',
              status: data.companyResponse.status || 'response',
              message: data.companyResponse.message || '',
              respondedAt: data.companyResponse.respondedAt || data.updatedAt,
              respondedBy: data.companyResponse.respondedBy,
              interviewDetails: data.companyResponse.interviewDetails
            };
            setCompanyResponses([response]);
          }

          toast({
            title: 'Offline Mode',
            description: 'Showing cached version. Some features may be limited.',
            variant: 'default',
          });
          return;
        }
      }

      toast({
        title: 'Error',
        description: error.message || 'Failed to load application details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, enableOffline, toast]);

  // In CandidateApplicationDetails.tsx, after loading the application
  useEffect(() => {
    if (application) {
      console.log('📊 Application selectedCVs:', application.selectedCVs.map(cv => ({
        cvId: cv.cvId,
        _id: (cv as any)._id,
        id: (cv as any).id,
        filename: cv.filename,
        originalName: cv.originalName
      })));
    }
  }, [application]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      loadApplicationDetails(true);
      toast({
        title: 'Back Online',
        description: 'Your application has been refreshed.',
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast({
        title: 'Offline Mode',
        description: 'You are viewing cached data.',
        variant: 'default',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadApplicationDetails, toast]);

  // Initial load
  useEffect(() => {
    loadApplicationDetails();
  }, [loadApplicationDetails]);

  // ==================== Handlers ====================

  const handleWithdrawApplication = useCallback(async () => {
    if (!application) return;

    try {
      setIsWithdrawing(true);
      await applicationService.withdrawApplication(applicationId);

      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been successfully withdrawn',
        variant: 'default',
      });

      await loadApplicationDetails(true);
      setShowWithdrawConfirm(false);
    } catch (error: any) {
      console.error('Failed to withdraw application:', error);
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to withdraw application',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
    }
  }, [application, applicationId, loadApplicationDetails, toast]);

  const handleDocumentPreview = useCallback((attachment: NormalizedAttachment) => {
    setPreviewDocument(attachment);
    setIsPreviewOpen(true);
  }, []);

  // ==================== Render Loading State ====================
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Tabs Skeleton */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className={`h-10 flex-1 rounded-lg ${colorClasses.bg.gray100}`} />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className={`h-64 rounded-xl ${colorClasses.bg.gray100}`} />
          <Skeleton className={`h-64 rounded-xl ${colorClasses.bg.gray100}`} />
          <Skeleton className={`h-48 rounded-xl ${colorClasses.bg.gray100}`} />
          <Skeleton className={`h-48 rounded-xl ${colorClasses.bg.gray100}`} />
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={`${colorClasses.bg.secondary} flex items-center justify-center p-4 min-h-[400px]`}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md"
        >
          <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl overflow-hidden`}>
            <CardContent className="p-8 text-center">
              <div className={`w-16 h-16 ${colorClasses.bg.redLight} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <AlertCircle className={`h-8 w-8 ${colorClasses.text.red}`} />
              </div>
              <h3 className={`text-xl font-bold ${colorClasses.text.primary} mb-2`}>Application Not Found</h3>
              <p className={`${colorClasses.text.muted} mb-6`}>
                The application you're looking for doesn't exist or may have been removed.
              </p>
              {onBack && (
                <Button
                  onClick={onBack}
                  variant="outline"
                  className={`${colorClasses.border.gray400} mx-auto h-11`}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 w-full min-w-0 overflow-hidden">
        {/* Offline Banner - Inside component */}
        <AnimatePresence>
          {isOffline && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className={`${colorClasses.bg.amberLight} ${colorClasses.text.amber} p-3 rounded-lg text-sm flex items-center gap-2`}
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>You are offline. Showing cached data.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Stats */}
        {allAttachments.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <MiniStatCard
              label="CVs"
              value={allAttachments.filter(a => a.category === 'CV').length}
              icon={Eye}
              color="blue"
            />
            <MiniStatCard
              label="References"
              value={allAttachments.filter(a => a.category === 'Reference').length}
              icon={Users}
              color="purple"
            />
            <MiniStatCard
              label="Experience"
              value={allAttachments.filter(a => a.category === 'Experience').length}
              icon={Briefcase}
              color="green"
            />
            <MiniStatCard
              label="Other"
              value={allAttachments.filter(a => a.category === 'Other').length}
              icon={FolderOpen}
              color="gray600"
            />
          </div>
        )}

        {/* Tab Navigation - SINGLE SYSTEM ONLY */}
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content Area */}
        <div ref={contentRef} className="w-full min-w-0 overflow-hidden">
          <ApplicationAttachments 
            application={application as Application}
            onAttachmentsChange={handleAttachmentsChange}
          >
            {(attachments: NormalizedAttachment[], handlers: AttachmentHandlers, viewer: React.ReactNode) => {
              return (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 w-full min-w-0 overflow-hidden"
                    >
                      {/* Overview Tab */}
                      {activeTab === 'overview' && (
                        <>
                          {/* Job Information */}
                          <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
                            <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                              <CardTitle className={`flex items-center gap-2 text-base ${colorClasses.text.primary}`}>
                                <Building className={`h-5 w-5 ${colorClasses.text.blue}`} />
                                Job Details
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                              <div>
                                <h3 className={`text-xl font-bold ${colorClasses.text.primary} mb-1`}>
                                  {application.job.title}
                                </h3>
                                <p className={`${colorClasses.text.muted} text-sm`}>
                                  {jobService.getOwnerName(application.job as Job)}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-2 text-sm min-w-0">
                                  <MapPin className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                  <span className={`${colorClasses.text.primary} truncate`}>
                                    {application.job.location?.city || 'Location not specified'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm min-w-0">
                                  <Mail className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                  <span className={`${colorClasses.text.primary} truncate`}>{application.contactInfo.email}</span>
                                </div>
                                {application.contactInfo.phone && (
                                  <div className="flex items-center gap-2 text-sm min-w-0">
                                    <Phone className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                    <span className={`${colorClasses.text.primary} truncate`}>{application.contactInfo.phone}</span>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Cover Letter */}
                          {application.coverLetter && (
                            <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
                              <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className={`flex items-center gap-2 text-base ${colorClasses.text.primary}`}>
                                  <BookOpen className={`h-5 w-5 ${colorClasses.text.blue}`} />
                                  Cover Letter
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-6">
                                <div className="prose max-w-none">
                                  <p className={`whitespace-pre-wrap text-sm ${colorClasses.text.secondary}`}>
                                    {application.coverLetter}
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Skills */}
                          {application.skills && application.skills.length > 0 && (
                            <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
                              <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <CardTitle className={`flex items-center gap-2 text-base ${colorClasses.text.primary}`}>
                                  <Award className={`h-5 w-5 ${colorClasses.text.blue}`} />
                                  Skills
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="p-6">
                                <div className="flex flex-wrap gap-2">
                                  {application.skills.map((skill: any, index: any) => (
                                    <Badge key={index} variant="secondary" className={`${colorClasses.bg.secondary} ${colorClasses.text.secondary} border-0 px-3 py-1`}>
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </>
                      )}

                      {/* Documents Tab - FIXED WITH MOBILE-SAFE CLASSES */}
                      {activeTab === 'documents' && (
                        <div className="w-full min-w-0 max-w-full overflow-hidden px-0">
                          <AttachmentList
                            attachments={attachments}
                            onView={(att) => handleDocumentPreview(att)}
                            onDownload={handlers.onDownload}
                            onDownloadAll={handlers.onDownloadAll}
                            title="All Documents"
                            description={`${attachments.length} file${attachments.length !== 1 ? 's' : ''} attached to this application`}
                            emptyMessage="No documents submitted"
                          />
                        </div>
                      )}

                      {/* Experience Tab */}
                      {activeTab === 'experience' && (
                        <div className="space-y-4 w-full min-w-0 overflow-hidden">
                          {application.workExperience && application.workExperience.length > 0 ? (
                            application.workExperience.map((exp: any, index: number) => {
                              const expAttachment = attachments.find(a =>
                                a.category === 'Experience' &&
                                a.description.includes(String(exp?.company || ''))
                              );

                              return (
                                <motion.div
                                  key={exp?._id || index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="w-full"
                                >
                                  <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
                                    <CardContent className="p-4 sm:p-6">
                                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-start justify-between mb-2">
                                            <h4 className={`text-lg font-bold ${colorClasses.text.primary} truncate`}>
                                              {exp?.position}
                                            </h4>
                                            {exp?.current && (
                                              <Badge className={`${colorClasses.bg.greenLight} ${colorClasses.text.green} border-0 ml-2 shrink-0`}>
                                                Current
                                              </Badge>
                                            )}
                                          </div>
                                          <p className={`${colorClasses.text.muted} font-medium text-sm mb-3`}>
                                            {exp?.company}
                                          </p>

                                          <div className="flex items-center gap-4 text-sm mb-4">
                                            <div className="flex items-center gap-1 min-w-0">
                                              <Calendar className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                              <span className={`${colorClasses.text.secondary} truncate`}>
                                                {exp?.startDate} - {exp?.current ? 'Present' : exp?.endDate}
                                              </span>
                                            </div>
                                          </div>

                                          {exp?.description && (
                                            <p className={`${colorClasses.text.secondary} text-sm leading-relaxed`}>
                                              {exp.description}
                                            </p>
                                          )}

                                          {exp?.skills && exp.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-4">
                                              {exp.skills.map((skill: any, skillIndex: any) => (
                                                <Badge key={skillIndex} variant="outline" className={`${colorClasses.border.gray400} ${colorClasses.text.muted} text-xs`}>
                                                  {skill}
                                                </Badge>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {expAttachment && (
                                          <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                                            {expAttachment.canView && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDocumentPreview(expAttachment)}
                                                className={`${colorClasses.border.gray400} h-10`}
                                              >
                                                <Eye className="h-4 w-4 mr-2 shrink-0" />
                                                <span className="hidden xs:inline">View</span>
                                              </Button>
                                            )}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handlers.onDownload(expAttachment)}
                                              className={`${colorClasses.border.gray400} h-10`}
                                            >
                                              <Download className="h-4 w-4 mr-2 shrink-0" />
                                              <span className="hidden xs:inline">Download</span>
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })
                          ) : (
                            <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl`}>
                              <CardContent className="text-center py-12">
                                <Briefcase className={`h-12 w-12 ${colorClasses.text.muted} mx-auto mb-4`} />
                                <p className={colorClasses.text.muted}>No work experience provided</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* References Tab */}
                      {activeTab === 'references' && (
                        <div className="space-y-4 w-full min-w-0 overflow-hidden">
                          {application.references && application.references.length > 0 ? (
                            application.references.map((ref: any, index: number) => {
                              const refAttachment = attachments.find(a =>
                                a.category === 'Reference' &&
                                a.description.includes(String(ref.name || ''))
                              );

                              return (
                                <motion.div
                                  key={ref._id || index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="w-full"
                                >
                                  <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
                                    <CardContent className="p-4 sm:p-6">
                                      <div className="flex flex-col lg:flex-row justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                          <h4 className={`text-lg font-bold ${colorClasses.text.primary} mb-2 truncate`}>
                                            {ref.name}
                                          </h4>
                                          <p className={`${colorClasses.text.muted} font-medium text-sm mb-3 truncate`}>
                                            {ref.position} at {ref.company}
                                          </p>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span className={`font-medium ${colorClasses.text.secondary} shrink-0`}>Relationship:</span>{' '}
                                              <span className={`${colorClasses.text.muted} truncate`}>{ref.relationship}</span>
                                            </div>
                                            <div className="flex items-center gap-1 min-w-0">
                                              <span className={`font-medium ${colorClasses.text.secondary} shrink-0`}>Contact Allowed:</span>{' '}
                                              <Badge className={ref.allowsContact ? `${colorClasses.bg.greenLight} ${colorClasses.text.green} border-0` : `${colorClasses.bg.redLight} ${colorClasses.text.red} border-0`}>
                                                {ref.allowsContact ? 'Yes' : 'No'}
                                              </Badge>
                                            </div>
                                          </div>

                                          <div className="flex flex-wrap gap-4">
                                            {ref.email && (
                                              <div className="flex items-center gap-2 text-sm min-w-0">
                                                <Mail className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                                <span className={`${colorClasses.text.muted} truncate`}>{ref.email}</span>
                                              </div>
                                            )}
                                            {ref.phone && (
                                              <div className="flex items-center gap-2 text-sm min-w-0">
                                                <Phone className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                                <span className={`${colorClasses.text.muted} truncate`}>{ref.phone}</span>
                                              </div>
                                            )}
                                          </div>

                                          {ref.notes && (
                                            <p className={`${colorClasses.text.muted} mt-4 p-3 ${colorClasses.bg.secondary} rounded-lg text-sm`}>
                                              <span className="font-medium">Notes:</span> {ref.notes}
                                            </p>
                                          )}
                                        </div>

                                        {refAttachment && (
                                          <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                                            {refAttachment.canView && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDocumentPreview(refAttachment)}
                                                className={`${colorClasses.border.gray400} h-10`}
                                              >
                                                <Eye className="h-4 w-4 mr-2 shrink-0" />
                                                <span className="hidden xs:inline">View</span>
                                              </Button>
                                            )}
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => handlers.onDownload(refAttachment)}
                                              className={`${colorClasses.border.gray400} h-10`}
                                            >
                                              <Download className="h-4 w-4 mr-2 shrink-0" />
                                              <span className="hidden xs:inline">Download</span>
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              );
                            })
                          ) : (
                            <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl`}>
                              <CardContent className="text-center py-12">
                                <Users className={`h-12 w-12 ${colorClasses.text.muted} mx-auto mb-4`} />
                                <p className={colorClasses.text.muted}>No references provided</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}

                      {/* Timeline Tab */}
                      {activeTab === 'status' && (
                        <div className="space-y-6 w-full min-w-0 overflow-hidden">
                          {/* Current Status Card */}
                          <Card className={`border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
                            <CardHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                              <CardTitle className={`flex items-center gap-2 text-base ${colorClasses.text.primary}`}>
                                <Activity className={`h-5 w-5 ${colorClasses.text.blue}`} />
                                Application Progress
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className={`
                                  flex flex-col sm:flex-row sm:items-center justify-between gap-4 
                                  p-4 rounded-lg ${colorClasses.bg.secondary}
                                `}>
                                  <div>
                                    <p className={`text-xs ${colorClasses.text.muted} mb-1`}>Current Stage</p>
                                    <p className={`text-lg font-semibold ${colorClasses.text.primary}`}>
                                      {applicationService.getStatusLabel(application.status)}
                                    </p>
                                  </div>
                                  <div className="sm:text-right">
                                    <p className={`text-xs ${colorClasses.text.muted} mb-1`}>Last Updated</p>
                                    <p className={`text-sm font-medium ${colorClasses.text.primary}`}>
                                      {formatDistanceToNow(new Date(application.updatedAt), { addSuffix: true })}
                                    </p>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className={colorClasses.text.muted}>Progress</span>
                                    <span className={colorClasses.text.primary}>
                                      {application.status === 'applied' && '25%'}
                                      {application.status === 'under-review' && '50%'}
                                      {application.status === 'shortlisted' && '75%'}
                                      {application.status === 'interview-scheduled' && '85%'}
                                      {application.status === 'offer-made' && '95%'}
                                      {application.status === 'offer-accepted' && '100%'}
                                      {['rejected', 'withdrawn'].includes(application.status) && 'Completed'}
                                    </span>
                                  </div>
                                  <Progress
                                    value={
                                      application.status === 'applied' ? 25 :
                                        application.status === 'under-review' ? 50 :
                                          application.status === 'shortlisted' ? 75 :
                                            application.status === 'interview-scheduled' ? 85 :
                                              application.status === 'offer-made' ? 95 :
                                                application.status === 'offer-accepted' ? 100 :
                                                  ['rejected', 'withdrawn'].includes(application.status) ? 100 : 0
                                    }
                                    className="h-2"
                                  />
                                </div>

                                {/* Status History */}
                                {application.statusHistory && application.statusHistory.length > 0 && (
                                  <div className="pt-4">
                                    <p className={`text-sm font-medium ${colorClasses.text.primary} mb-3`}>Status History</p>
                                    <div className="space-y-2">
                                      {application.statusHistory.sort((a, b) =>
                                        new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()
                                      ).map((history, index) => (
                                        <div key={index} className={`flex items-start gap-3 p-3 ${colorClasses.bg.secondary} rounded-lg`}>
                                          <div className="mt-0.5">
                                            <Clock className={`h-4 w-4 ${colorClasses.text.muted} shrink-0`} />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                              <p className={`text-sm font-medium ${colorClasses.text.primary}`}>
                                                {applicationService.getStatusLabel(history.status)}
                                              </p>
                                              <p className={`text-xs ${colorClasses.text.muted}`}>
                                                {new Date(history.changedAt).toLocaleString()}
                                              </p>
                                            </div>
                                            {history.message && (
                                              <p className={`text-sm ${colorClasses.text.muted} mt-1`}>
                                                {history.message}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Company Responses */}
                          <CompanyResponseTimeline
                            responses={companyResponses}
                            currentStatus={application.status}
                          />
                        </div>
                      )}

                      {/* Company Tab */}
                      {activeTab === 'company' && (
                        <div className="w-full min-w-0 overflow-hidden">
                          <EntityInfo application={application} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>

                  {/* File Viewer */}
                  {viewer}
                </>
              );
            }}
          </ApplicationAttachments>
        </div>

        {/* Withdraw Confirmation Dialog */}
        <Dialog open={showWithdrawConfirm} onOpenChange={setShowWithdrawConfirm}>
          <DialogContent className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl p-6 max-w-md`}>
            <DialogHeader>
              <DialogTitle className={`text-lg font-bold ${colorClasses.text.primary} mb-2`}>
                Withdraw Application
              </DialogTitle>
              <DialogDescription className={`${colorClasses.text.muted} text-sm`}>
                Are you sure you want to withdraw your application for {application.job.title}?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawConfirm(false)}
                className={`${colorClasses.border.gray400} w-full sm:w-auto h-11`}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleWithdrawApplication}
                disabled={isWithdrawing}
                className="w-full sm:w-auto h-11"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin shrink-0" />
                    Withdrawing...
                  </>
                ) : (
                  'Withdraw Application'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};