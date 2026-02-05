/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CandidateApplicationDetails.tsx
import React, { useState, useEffect } from 'react';
import {
  Application,
  applicationService
} from '@/services/applicationService';
import { Button } from '@/components/ui/Button';
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
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  Building,
  FileText,
  Download,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Briefcase,
  Users,
  Award,
  Calendar,
  DownloadCloud,
  EyeIcon,
  FolderOpen,
  Shield,
  BookOpen,
  File,
} from 'lucide-react';
import { colorClasses } from '@/utils/color';

// Import the new attachment system
import { ApplicationAttachments, NormalizedAttachment, AttachmentHandlers } from '@/components/applications/ApplicationAttachments';

// Import the AttachmentList component
import { AttachmentList } from '@/components/applications/AttachmentList';

interface CandidateApplicationDetailsProps {
  applicationId: string;
  onBack?: () => void;
}

export const CandidateApplicationDetails: React.FC<CandidateApplicationDetailsProps> = ({
  applicationId,
  onBack
}) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadApplicationDetails();
  }, [applicationId]);

  const loadApplicationDetails = async () => {
    try {
      setIsLoading(true);
      const response = await applicationService.getApplicationDetails(applicationId);
      setApplication(response.data.application);
      console.log('📄 Loaded Application:', response.data.application);
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

  const handleWithdrawApplication = async () => {
    if (!application) return;

    try {
      setIsWithdrawing(true);
      await applicationService.withdrawApplication(applicationId);

      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been successfully withdrawn',
        variant: 'default',
      });

      await loadApplicationDetails();
      setShowWithdrawConfirm(false);
    } catch (error: any) {
      console.error('❌ Failed to withdraw application:', error);
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to withdraw application',
        variant: 'destructive',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer-accepted':
      case 'shortlisted':
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle className="h-5 w-5 text-rose-500" />;
      case 'interview-scheduled':
      case 'under-review':
        return <Clock className="h-5 w-5 text-amber-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
    }
  };

  const getStatusColorClass = (status: string) => {
    const statusColors: Record<string, string> = {
      'applied': `${colorClasses.bg.blue} ${colorClasses.text.blue} ${colorClasses.border.blue}`,
      'under-review': `${colorClasses.bg.amber} ${colorClasses.text.amber} ${colorClasses.border.amber}`,
      'shortlisted': `${colorClasses.bg.emerald} ${colorClasses.text.emerald} ${colorClasses.border.emerald}`,
      'interview-scheduled': `${colorClasses.bg.purple} ${colorClasses.text.purple} ${colorClasses.border.purple}`,
      'interviewed': `${colorClasses.bg.indigo} ${colorClasses.text.indigo} ${colorClasses.border.indigo}`,
      'offer-pending': `${colorClasses.bg.orange} ${colorClasses.text.orange} ${colorClasses.border.orange}`,
      'offer-made': `${colorClasses.bg.teal} ${colorClasses.text.teal} ${colorClasses.border.teal}`,
      'offer-accepted': `${colorClasses.bg.emerald} ${colorClasses.text.emerald} ${colorClasses.border.emerald}`,
      'rejected': `${colorClasses.bg.rose} ${colorClasses.text.rose} ${colorClasses.border.rose}`,
      'on-hold': `${colorClasses.bg.slate} ${colorClasses.text.slate} ${colorClasses.border.slate}`,
      'withdrawn': `${colorClasses.bg.gray800} ${colorClasses.text.gray800} ${colorClasses.border.gray800}`
    };
    return statusColors[status] || `${colorClasses.bg.slate} ${colorClasses.text.slate} ${colorClasses.border.slate}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-linear-to-br ${colorClasses.bg.gray100} p-4 flex items-center justify-center`}>
        <div className={`text-center backdrop-blur-xl ${colorClasses.bg.white} rounded-3xl p-12 shadow-2xl border ${colorClasses.border.gray100}`}>
          <div className={`animate-spin rounded-full h-20 w-20 border-b-2 ${colorClasses.border.blue} mx-auto mb-8`}></div>
          <p className={`${colorClasses.text.gray800} text-lg font-medium mb-2`}>Loading application details...</p>
          <p className={`${colorClasses.text.gray400} text-sm`}>Please wait while we fetch your application</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colorClasses.bg.gray100} flex items-center justify-center p-4`}>
        <div className={`text-center max-w-md backdrop-blur-xl ${colorClasses.bg.white} rounded-3xl p-12 shadow-2xl border ${colorClasses.border.gray100}`}>
          <div className={`w-24 h-24 ${colorClasses.bg.red} bg-opacity-10 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border ${colorClasses.border.rose}`}>
            <AlertCircle className="h-12 w-12 text-rose-500/80" />
          </div>
          <h3 className={`text-2xl font-bold ${colorClasses.text.gray800} mb-4`}>Application Not Found</h3>
          <p className={`${colorClasses.text.gray600} mb-8 leading-relaxed`}>
            The application you're looking for doesn't exist or may have been removed.
          </p>
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className={`${colorClasses.border.gray400} ${colorClasses.bg.white} ${colorClasses.text.gray700} hover:${colorClasses.bg.white} hover:${colorClasses.text.gray800}`}
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              Back to Applications
            </Button>
          )}
        </div>
      </div>
    );
  }

  const formattedApplication = applicationService.formatApplication(application);
  const canWithdraw = applicationService.canWithdraw(application.status);

  const jobLocation = application.job.location ?
    `${application.job.location.city || ''}, ${application.job.location.region || ''}`.replace(/^,\s*|,\s*$/g, '') :
    'Location not specified';

  const ownerInfo = application.job.jobType === 'organization'
    ? application.job.organization
    : application.job.company;

  return (
    <div className={`min-h-screen ${colorClasses.bg.gray100} p-4`}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className={`rounded-3xl p-8 ${colorClasses.bg.darkNavy} text-white shadow-2xl border ${colorClasses.border.white} relative overflow-hidden`}>
          <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-6">
              {onBack && (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className="shrink-0 bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                >
                  <ArrowLeft className="h-5 w-5 mr-3" />
                  Back
                </Button>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                    <FileText className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-linear-to-r from-white to-white/90 bg-clip-text text-transparent">
                      Application Details
                    </h1>
                    <p className="text-blue-100/90 text-lg mt-2">
                      Applied on {formatDate(application.createdAt)} • {application.job.title} at {ownerInfo?.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Badge
                className={`text-base px-6 py-3 font-semibold border-2 backdrop-blur-sm rounded-2xl transition-all duration-300 ${getStatusColorClass(application.status)}`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(application.status)}
                  <span className="drop-shadow-sm">{formattedApplication.statusLabel}</span>
                </div>
              </Badge>

              {canWithdraw && (
                <Dialog open={showWithdrawConfirm} onOpenChange={setShowWithdrawConfirm}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 hover:scale-105"
                    >
                      Withdraw Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent className={`backdrop-blur-xl ${colorClasses.bg.white} border ${colorClasses.border.gray100} shadow-2xl rounded-3xl`}>
                    <DialogHeader>
                      <DialogTitle className={`text-2xl font-bold ${colorClasses.text.gray800}`}>Withdraw Application</DialogTitle>
                      <DialogDescription className={`${colorClasses.text.gray600} text-lg mt-2`}>
                        Are you sure you want to withdraw your application for {application.job.title}?
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-4 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowWithdrawConfirm(false)}
                        className={`${colorClasses.border.gray400} ${colorClasses.text.gray700} hover:${colorClasses.bg.gray100}`}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={handleWithdrawApplication}
                        disabled={isWithdrawing}
                        className="bg-rose-500 hover:bg-rose-600 text-white transition-all duration-300"
                      >
                        {isWithdrawing ? 'Withdrawing...' : 'Withdraw Application'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className={`grid grid-cols-1 sm:grid-cols-4 w-full ${colorClasses.bg.white} backdrop-blur-xl p-2 rounded-2xl border ${colorClasses.border.gray100} shadow-lg`}>
              <TabsTrigger
                value="overview"
                className={`data-[state=active]:${colorClasses.bg.white} data-[state=active]:${colorClasses.text.blue} rounded-xl transition-all duration-300 font-medium`}
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className={`data-[state=active]:${colorClasses.bg.white} data-[state=active]:${colorClasses.text.blue} rounded-xl transition-all duration-300 font-medium`}
              >
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="experience"
                className={`data-[state=active]:${colorClasses.bg.white} data-[state=active]:${colorClasses.text.blue} rounded-xl transition-all duration-300 font-medium`}
              >
                Experience
              </TabsTrigger>
              <TabsTrigger
                value="references"
                className={`data-[state=active]:${colorClasses.bg.white} data-[state=active]:${colorClasses.text.blue} rounded-xl transition-all duration-300 font-medium`}
              >
                References
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
              {/* Job Information */}
              <Card className={`${colorClasses.bg.white} border ${colorClasses.border.gray100} shadow-2xl rounded-3xl overflow-hidden`}>
                <CardHeader className={`pb-6 border-b ${colorClasses.border.gray100} ${colorClasses.bg.gray100} rounded-t-3xl`}>
                  <CardTitle className={`flex items-center gap-3 ${colorClasses.text.gray800} text-2xl font-bold`}>
                    <div className={`p-3 ${colorClasses.bg.blue} bg-opacity-10 rounded-2xl border ${colorClasses.border.blue}`}>
                      <Building className={`h-6 w-6 ${colorClasses.text.blue}`} />
                    </div>
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className={`text-2xl font-bold ${colorClasses.text.gray800} mb-3`}>{application.job.title}</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <p className={`${colorClasses.text.gray700} font-semibold text-lg`}>{ownerInfo?.name}</p>
                        {ownerInfo?.verified && (
                          <Badge className={`${colorClasses.bg.emerald} ${colorClasses.text.emerald} border ${colorClasses.border.emerald}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className={`flex items-center gap-3 p-4 ${colorClasses.bg.blue} bg-opacity-5 rounded-2xl border ${colorClasses.border.blue}`}>
                        <MapPin className={`h-5 w-5 ${colorClasses.text.blue}`} />
                        <span className={`${colorClasses.text.gray700} font-medium`}>{jobLocation}</span>
                      </div>
                      <div className={`flex items-center gap-3 p-4 ${colorClasses.bg.purple} bg-opacity-5 rounded-2xl border ${colorClasses.border.purple}`}>
                        <Calendar className={`h-5 w-5 ${colorClasses.text.purple}`} />
                        <span className={`${colorClasses.text.gray700} font-medium`}>Applied {formatDate(application.createdAt)}</span>
                      </div>
                      <div className={`flex items-center gap-3 p-4 ${colorClasses.bg.emerald} bg-opacity-5 rounded-2xl border ${colorClasses.border.emerald}`}>
                        <Mail className={`h-5 w-5 ${colorClasses.text.emerald}`} />
                        <span className={`${colorClasses.text.gray700} font-medium`}>{application.contactInfo.email}</span>
                      </div>
                      {application.contactInfo.phone && (
                        <div className={`flex items-center gap-3 p-4 ${colorClasses.bg.amber} bg-opacity-5 rounded-2xl border ${colorClasses.border.amber}`}>
                          <Phone className={`h-5 w-5 ${colorClasses.text.amber}`} />
                          <span className={`${colorClasses.text.gray700} font-medium`}>{application.contactInfo.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button
                        variant="outline"
                        className={`${colorClasses.border.blue} ${colorClasses.text.blue} hover:${colorClasses.bg.blue} hover:text-white`}
                        onClick={() => window.open(`/jobs/${application.job._id}`, '_blank')}
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        View Job Posting
                      </Button>
                      <Button
                        variant="outline"
                        className={`${colorClasses.border.gray400} ${colorClasses.text.gray600} hover:${colorClasses.bg.gray400} hover:text-white`}
                        onClick={() => window.open('/dashboard/candidate/profile', '_blank')}
                      >
                        <User className="h-5 w-5 mr-2" />
                        Update Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cover Letter */}
              <Card className={`${colorClasses.bg.white} border ${colorClasses.border.gray100} shadow-2xl rounded-3xl overflow-hidden`}>
                <CardHeader className={`pb-6 border-b ${colorClasses.border.gray100} ${colorClasses.bg.gray100} rounded-t-3xl`}>
                  <CardTitle className={`flex items-center gap-3 ${colorClasses.text.gray800} text-2xl font-bold`}>
                    <div className={`p-3 ${colorClasses.bg.blue} bg-opacity-10 rounded-2xl border ${colorClasses.border.blue}`}>
                      <BookOpen className={`h-6 w-6 ${colorClasses.text.blue}`} />
                    </div>
                    Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className={`${colorClasses.bg.blue} bg-opacity-5 p-8 rounded-2xl border ${colorClasses.border.blue}`}>
                    <p className={`${colorClasses.text.gray700} whitespace-pre-wrap leading-relaxed text-lg font-medium`}>
                      {application.coverLetter}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              {application.skills && application.skills.length > 0 && (
                <Card className={`${colorClasses.bg.white} border ${colorClasses.border.gray100} shadow-2xl rounded-3xl overflow-hidden`}>
                  <CardHeader className={`pb-6 border-b ${colorClasses.border.gray100} ${colorClasses.bg.gray100} rounded-t-3xl`}>
                    <CardTitle className={`flex items-center gap-3 ${colorClasses.text.gray800} text-2xl font-bold`}>
                      <div className={`p-3 ${colorClasses.bg.amber} bg-opacity-10 rounded-2xl border ${colorClasses.border.amber}`}>
                        <Award className={`h-6 w-6 ${colorClasses.text.amber}`} />
                      </div>
                      Skills & Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="flex flex-wrap gap-3">
                      {application.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          className={`${colorClasses.bg.amber} ${colorClasses.text.amber} border ${colorClasses.border.amber} px-5 py-2 text-sm font-semibold shadow-lg rounded-2xl`}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-8 animate-in fade-in duration-500">
              <ApplicationAttachments application={application}>
                {(attachments: NormalizedAttachment[], handlers: AttachmentHandlers) => {
                  const cvCount = attachments.filter((a) => a.category === 'CV').length;
                  const refCount = attachments.filter((a) => a.category === 'Reference').length;
                  const expCount = attachments.filter((a) => a.category === 'Experience').length;
                  const otherCount = attachments.filter((a) => a.category === 'Other').length;

                  return (
                    <>
                      {/* Document Summary */}
                      <Card className={`${colorClasses.bg.blue} bg-opacity-5 border ${colorClasses.border.blue} shadow-2xl rounded-3xl`}>
                        <CardContent className="p-8">
                          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                              <div className={`p-4 ${colorClasses.bg.blue} bg-opacity-10 rounded-3xl border ${colorClasses.border.blue}`}>
                                <FolderOpen className={`h-8 w-8 ${colorClasses.text.blue}`} />
                              </div>
                              <div>
                                <h3 className={`text-xl font-bold ${colorClasses.text.gray800}`}>Document Summary</h3>
                                <p className={`${colorClasses.text.gray600} text-lg`}>
                                  {attachments.length} total document(s) submitted
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlers.onDownloadAll}
                                disabled={attachments.length === 0}
                                className={`${colorClasses.border.emerald} ${colorClasses.text.emerald} hover:${colorClasses.bg.emerald} hover:text-white`}
                              >
                                <DownloadCloud className="h-4 w-4 mr-2" />
                                Download All
                              </Button>
                              <div className={`text-right ${colorClasses.bg.white} rounded-2xl p-4 border ${colorClasses.border.gray100}`}>
                                <p className={`text-sm ${colorClasses.text.gray600} font-medium`}>Breakdown</p>
                                <p className="text-sm text-slate-700">
                                  {cvCount} CV • {refCount} References • {expCount} Experience • {otherCount} Other
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* All Documents */}
                      <AttachmentList
                        attachments={attachments}
                        onView={handlers.onView}
                        onDownload={handlers.onDownload}
                        onDownloadAll={handlers.onDownloadAll}
                        showDownloadAll={false}
                        title="All Documents"
                        description="All files submitted with this application"
                        emptyMessage="No documents submitted"
                      />
                    </>
                  );
                }}
              </ApplicationAttachments>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-8 animate-in fade-in duration-500">
              <Card className={`${colorClasses.bg.white} border ${colorClasses.border.gray100} shadow-2xl rounded-3xl overflow-hidden`}>
                <CardHeader className={`pb-6 border-b ${colorClasses.border.gray100} ${colorClasses.bg.gray100} rounded-t-3xl`}>
                  <CardTitle className={`flex items-center gap-3 ${colorClasses.text.gray800} text-2xl font-bold`}>
                    <div className={`p-3 ${colorClasses.bg.blue} bg-opacity-10 rounded-2xl border ${colorClasses.border.blue}`}>
                      <Briefcase className={`h-6 w-6 ${colorClasses.text.blue}`} />
                    </div>
                    Work Experience
                  </CardTitle>
                  <CardDescription className={`${colorClasses.text.gray600} text-lg`}>
                    Your professional work history and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    {application.workExperience && application.workExperience.length > 0 ? (
                      application.workExperience.map((exp, index) => (
                        <div key={index} className={`p-6 border ${colorClasses.border.gray100} rounded-2xl ${colorClasses.bg.gray100} hover:shadow-lg transition-all duration-300`}>
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
                            <div className="flex-1">
                              <h4 className={`text-xl font-bold ${colorClasses.text.gray800} mb-2`}>{exp.position}</h4>
                              <p className={`${colorClasses.text.gray700} font-semibold text-lg mb-3`}>{exp.company}</p>
                              <div className="flex flex-wrap items-center gap-4 text-base text-slate-600 mb-4">
                                <Calendar className="h-5 w-5" />
                                <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                                {exp.current && (
                                  <Badge className={`${colorClasses.bg.green} ${colorClasses.text.emerald} border ${colorClasses.border.emerald}`}>
                                    Current
                                  </Badge>
                                )}
                              </div>
                              {exp.description && (
                                <p className={`${colorClasses.text.gray700} leading-relaxed ${colorClasses.bg.gray100} p-6 rounded-2xl border ${colorClasses.border.gray100}`}>
                                  {exp.description}
                                </p>
                              )}
                            </div>

                            {/* Document actions */}
                            {exp.document && exp.providedAsDocument && (
                              <ApplicationAttachments application={application}>
                                {(attachments, handlers) => {
                                  const expAttachment = attachments.find(a =>
                                    a.category === 'Experience' &&
                                    a.description.includes(exp.company || '')
                                  );

                                  if (!expAttachment) return null;

                                  return (
                                    <div className="flex gap-3">
                                      {expAttachment.canView && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handlers.onView(expAttachment)}
                                          className={`${colorClasses.border.blue} ${colorClasses.text.blue} hover:${colorClasses.bg.blue} hover:text-white flex items-center gap-2`}
                                        >
                                          <EyeIcon className="h-4 w-4" />
                                          View
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlers.onDownload(expAttachment)}
                                        className={`${colorClasses.border.emerald} ${colorClasses.text.emerald} hover:${colorClasses.bg.emerald} hover:text-white flex items-center gap-2`}
                                      >
                                        <DownloadCloud className="h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  );
                                }}
                              </ApplicationAttachments>
                            )}
                          </div>

                          {/* Document preview */}
                          {exp.document && exp.providedAsDocument && (
                            <ApplicationAttachments application={application}>
                              {(attachments) => {
                                const expAttachment = attachments.find(a =>
                                  a.category === 'Experience' &&
                                  a.description.includes(exp.company || '')
                                );

                                if (!expAttachment) return null;

                                return (
                                  <div className={`mt-6 p-6 ${expAttachment.categoryBg} rounded-2xl border ${expAttachment.categoryBorder}`}>
                                    <div className="flex items-center gap-4">
                                      <File className={`h-6 w-6 ${expAttachment.categoryColor}`} />
                                      <div>
                                        <p className={`font-semibold ${colorClasses.text.gray800} text-lg`}>
                                          {expAttachment.name}
                                        </p>
                                        <p className={`text-base ${colorClasses.text.gray600}`}>
                                          {expAttachment.sizeLabel} • {expAttachment.fileType}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            </ApplicationAttachments>
                          )}

                          {exp.skills && exp.skills.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-6">
                              {exp.skills.map((skill, skillIndex) => (
                                <Badge key={skillIndex} className={`${colorClasses.bg.blue} ${colorClasses.text.blue} border ${colorClasses.border.blue}`}>
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Briefcase className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className={`${colorClasses.text.gray400} text-lg`}>No work experience provided</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* References Tab */}
            <TabsContent value="references" className="space-y-8 animate-in fade-in duration-500">
              <Card className={`${colorClasses.bg.white} border ${colorClasses.border.gray100} shadow-2xl rounded-3xl overflow-hidden`}>
                <CardHeader className={`pb-6 border-b ${colorClasses.border.gray100} ${colorClasses.bg.gray100} rounded-t-3xl`}>
                  <CardTitle className={`flex items-center gap-3 ${colorClasses.text.gray800} text-2xl font-bold`}>
                    <div className={`p-3 ${colorClasses.bg.blue} bg-opacity-10 rounded-2xl border ${colorClasses.border.blue}`}>
                      <Users className={`h-6 w-6 ${colorClasses.text.blue}`} />
                    </div>
                    Professional References
                  </CardTitle>
                  <CardDescription className={`${colorClasses.text.gray600} text-lg`}>
                    Your professional references and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    {application.references && application.references.length > 0 ? (
                      application.references.map((ref, index) => (
                        <div key={index} className={`p-6 border ${colorClasses.border.gray100} rounded-2xl ${colorClasses.bg.gray100} hover:shadow-lg transition-all duration-300`}>
                          <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
                            <div className="flex-1">
                              <h4 className={`text-xl font-bold ${colorClasses.text.gray800} mb-2`}>{ref.name}</h4>
                              <p className={`${colorClasses.text.gray700} font-semibold text-lg mb-3`}>{ref.position} at {ref.company}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base text-slate-600 mb-4">
                                <div>
                                  <strong className={`${colorClasses.text.gray700}`}>Relationship:</strong> {ref.relationship}
                                </div>
                                <div>
                                  <strong className={`${colorClasses.text.gray700}`}>Contact Allowed:</strong>
                                  <span className={`ml-3 font-semibold ${ref.allowsContact ? colorClasses.text.emerald : colorClasses.text.rose}`}>
                                    {ref.allowsContact ? 'Yes' : 'No'}
                                  </span>
                                </div>
                                {ref.email && (
                                  <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5" />
                                    <span>{ref.email}</span>
                                  </div>
                                )}
                                {ref.phone && (
                                  <div className="flex items-center gap-3">
                                    <Phone className="h-5 w-5" />
                                    <span>{ref.phone}</span>
                                  </div>
                                )}
                              </div>
                              {ref.notes && (
                                <p className={`${colorClasses.text.gray700} leading-relaxed ${colorClasses.bg.gray100} p-6 rounded-2xl border ${colorClasses.border.gray100}`}>
                                  <strong>Notes:</strong> {ref.notes}
                                </p>
                              )}
                            </div>

                            {/* Document actions */}
                            {ref.document && ref.providedAsDocument && (
                              <ApplicationAttachments application={application}>
                                {(attachments, handlers) => {
                                  const refAttachment = attachments.find(a =>
                                    a.category === 'Reference' &&
                                    a.description.includes(ref.name || '')
                                  );

                                  if (!refAttachment) return null;

                                  return (
                                    <div className="flex gap-3">
                                      {refAttachment.canView && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => handlers.onView(refAttachment)}
                                          className={`${colorClasses.border.blue} ${colorClasses.text.blue} hover:${colorClasses.bg.blue} hover:text-white flex items-center gap-2`}
                                        >
                                          <EyeIcon className="h-4 w-4" />
                                          View
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlers.onDownload(refAttachment)}
                                        className={`${colorClasses.border.purple} ${colorClasses.text.purple} hover:${colorClasses.bg.purple} hover:text-white flex items-center gap-2`}
                                      >
                                        <DownloadCloud className="h-4 w-4" />
                                        Download
                                      </Button>
                                    </div>
                                  );
                                }}
                              </ApplicationAttachments>
                            )}
                          </div>

                          {/* Document preview */}
                          {ref.document && ref.providedAsDocument && (
                            <ApplicationAttachments application={application}>
                              {(attachments) => {
                                const refAttachment = attachments.find(a =>
                                  a.category === 'Reference' &&
                                  a.description.includes(ref.name || '')
                                );

                                if (!refAttachment) return null;

                                return (
                                  <div className={`mt-6 p-6 ${refAttachment.categoryBg} rounded-2xl border ${refAttachment.categoryBorder}`}>
                                    <div className="flex items-center gap-4">
                                      <File className={`h-6 w-6 ${refAttachment.categoryColor}`} />
                                      <div>
                                        <p className={`font-semibold ${colorClasses.text.gray800} text-lg`}>
                                          {refAttachment.name}
                                        </p>
                                        <p className={`text-base ${colorClasses.text.gray600}`}>
                                          {refAttachment.sizeLabel} • {refAttachment.fileType}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }}
                            </ApplicationAttachments>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                        <p className={`${colorClasses.text.gray400} text-lg`}>No references provided</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};