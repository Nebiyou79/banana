/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CandidateApplicationDetails.tsx - CLEAN PREMIUM VERSION
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
} from 'lucide-react';

// Import the new attachment system
import { ApplicationAttachments, NormalizedAttachment, AttachmentHandlers } from '@/components/applications/ApplicationAttachments';
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
      'applied': 'bg-blue-500/10 text-blue-600 border-blue-200 backdrop-blur-sm',
      'under-review': 'bg-amber-500/10 text-amber-600 border-amber-200 backdrop-blur-sm',
      'shortlisted': 'bg-emerald-500/10 text-emerald-600 border-emerald-200 backdrop-blur-sm',
      'interview-scheduled': 'bg-purple-500/10 text-purple-600 border-purple-200 backdrop-blur-sm',
      'interviewed': 'bg-indigo-500/10 text-indigo-600 border-indigo-200 backdrop-blur-sm',
      'offer-pending': 'bg-orange-500/10 text-orange-600 border-orange-200 backdrop-blur-sm',
      'offer-made': 'bg-teal-500/10 text-teal-600 border-teal-200 backdrop-blur-sm',
      'offer-accepted': 'bg-emerald-500/10 text-emerald-600 border-emerald-200 backdrop-blur-sm',
      'rejected': 'bg-rose-500/10 text-rose-600 border-rose-200 backdrop-blur-sm',
      'on-hold': 'bg-slate-500/10 text-slate-600 border-slate-200 backdrop-blur-sm',
      'withdrawn': 'bg-slate-500/10 text-slate-600 border-slate-300 backdrop-blur-sm'
    };
    return statusColors[status] || 'bg-slate-500/10 text-slate-600 border-slate-200 backdrop-blur-sm';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <div className="text-center backdrop-blur-xl bg-white/60 rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-20 w-20 border-b-2 border-blue-500/80 mx-auto mb-8"></div>
          <p className="text-slate-700 text-lg font-medium mb-2">Loading application details...</p>
          <p className="text-slate-500 text-sm">Please wait while we fetch your application</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <div className="text-center max-w-md backdrop-blur-xl bg-white/60 rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="w-24 h-24 bg-rose-100/50 rounded-3xl flex items-center justify-center mx-auto mb-8 backdrop-blur-sm border border-rose-200/30">
            <AlertCircle className="h-12 w-12 text-rose-500/80" />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-4">Application Not Found</h3>
          <p className="text-slate-600 mb-8 leading-relaxed">
            The application you`re looking for doesn`t exist or may have been removed.
          </p>
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="border-slate-300 bg-white/80 hover:bg-white backdrop-blur-sm text-slate-700 hover:text-slate-900 transition-all duration-300"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Premium Header */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-blue-600/90 to-indigo-700/90 rounded-3xl p-8 text-white shadow-2xl border border-white/20 relative overflow-hidden">
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
                  <DialogContent className="backdrop-blur-xl bg-white/95 border border-white/20 shadow-2xl rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-bold text-slate-800">Withdraw Application</DialogTitle>
                      <DialogDescription className="text-slate-600 text-lg mt-2">
                        Are you sure you want to withdraw your application for {application.job.title}?
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end space-x-4 mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowWithdrawConfirm(false)}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50 transition-all duration-300"
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

        {/* Main Content - Full Width */}
        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-4 w-full bg-white/80 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-lg">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
              >
                {/* Documents count will be handled by ApplicationAttachments */}
                Documents
              </TabsTrigger>
              <TabsTrigger
                value="experience"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
              >
                Experience
              </TabsTrigger>
              <TabsTrigger
                value="references"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
              >
                References
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500">
              {/* Job Information */}
              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                  <CardTitle className="flex items-center gap-3 text-slate-800 text-2xl font-bold">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-200/30">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    Job Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">{application.job.title}</h3>
                      <div className="flex items-center gap-3 mb-4">
                        <p className="text-slate-700 font-semibold text-lg">{ownerInfo?.name}</p>
                        {ownerInfo?.verified && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/30 backdrop-blur-sm">
                            <Shield className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-200/30 backdrop-blur-sm">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="text-slate-700 font-medium">{jobLocation}</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-purple-500/5 rounded-2xl border border-purple-200/30 backdrop-blur-sm">
                        <Calendar className="h-5 w-5 text-purple-600" />
                        <span className="text-slate-700 font-medium">Applied {formatDate(application.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-200/30 backdrop-blur-sm">
                        <Mail className="h-5 w-5 text-emerald-600" />
                        <span className="text-slate-700 font-medium">{application.contactInfo.email}</span>
                      </div>
                      {application.contactInfo.phone && (
                        <div className="flex items-center gap-3 p-4 bg-amber-500/5 rounded-2xl border border-amber-200/30 backdrop-blur-sm">
                          <Phone className="h-5 w-5 text-amber-600" />
                          <span className="text-slate-700 font-medium">{application.contactInfo.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4">
                      <Button
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white shadow-lg transition-all duration-300 hover:scale-105"
                        onClick={() => window.open(`/jobs/${application.job._id}`, '_blank')}
                      >
                        <ExternalLink className="h-5 w-5 mr-2" />
                        View Job Posting
                      </Button>
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-600 hover:bg-slate-600 hover:text-white shadow-lg transition-all duration-300 hover:scale-105"
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
              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-slate-200/30 bg-linear-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                  <CardTitle className="flex items-center gap-3 text-slate-800 text-2xl font-bold">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-200/30">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="backdrop-blur-sm bg-linear-to-br from-blue-50/50 to-indigo-50/30 p-8 rounded-2xl border border-blue-200/30">
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-lg font-medium">
                      {application.coverLetter}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Skills */}
              {application.skills && application.skills.length > 0 && (
                <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                  <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                    <CardTitle className="flex items-center gap-3 text-slate-800 text-2xl font-bold">
                      <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-200/30">
                        <Award className="h-6 w-6 text-amber-600" />
                      </div>
                      Skills & Qualifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="flex flex-wrap gap-3">
                      {application.skills.map((skill, index) => (
                        <Badge
                          key={index}
                          className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700 border border-amber-200/30 px-5 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm rounded-2xl"
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
              {/* Document Summary */}
              <ApplicationAttachments application={application}>
                {(attachments: NormalizedAttachment[], handlers: AttachmentHandlers) => {
                  const cvCount = attachments.filter((a) => a.category === 'CV').length;
                  const otherCount = attachments.length - cvCount;

                  return (
                    <>
                      <Card className="backdrop-blur-xl bg-gradient-to-r from-blue-500/5 to-indigo-500/5 border border-blue-200/20 shadow-2xl rounded-3xl">
                        <CardContent className="p-8">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                              <div className="p-4 bg-blue-500/10 rounded-3xl border border-blue-200/30 backdrop-blur-sm">
                                <FolderOpen className="h-8 w-8 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-slate-800">Document Summary</h3>
                                <p className="text-slate-600 text-lg">
                                  {attachments.length} total document(s) submitted
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handlers.onDownloadAll}
                                disabled={attachments.length === 0}
                                className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-lg transition-all duration-300"
                              >
                                <DownloadCloud className="h-4 w-4 mr-2" />
                                Download All
                              </Button>
                              <div className="text-right backdrop-blur-sm bg-white/30 rounded-2xl p-4 border border-white/20">
                                <p className="text-sm text-slate-600 font-medium">Breakdown</p>
                                <p className="text-sm text-slate-700">
                                  {cvCount} CV(s) • {otherCount} supporting document(s)
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
                        showDownloadAll={false} // Already shown in summary
                        title="All Documents"
                        description="All files you submitted with this application"
                        emptyMessage="No documents submitted"
                      />
                    </>
                  );
                }}
              </ApplicationAttachments>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-8 animate-in fade-in duration-500">
              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                  <CardTitle className="flex items-center gap-3 text-slate-800 text-2xl font-bold">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-200/30">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    Work Experience
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Your professional work history and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    {application.workExperience && application.workExperience.length > 0 ? (
                      application.workExperience.map((exp, index) => (
                        <div key={index} className="p-8 border border-slate-200/30 rounded-2xl bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-slate-800 mb-2">{exp.position}</h4>
                              <p className="text-slate-700 font-semibold text-lg mb-3">{exp.company}</p>
                              <div className="flex items-center gap-6 text-base text-slate-600 mb-4">
                                <Calendar className="h-5 w-5" />
                                <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                                {exp.current && (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/30 backdrop-blur-sm">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              {exp.description && (
                                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-200/30 backdrop-blur-sm">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                            {/* File actions moved to ApplicationAttachments - still show buttons if document exists */}
                            {exp.document && exp.providedAsDocument && (
                              <ApplicationAttachments application={application}>
                                {(attachments: any[], handlers: { onView: (arg0: any) => void; onDownload: (arg0: any) => void; }) => {
                                  const expAttachment = attachments.find((a: { category: string; description: string | string[]; }) =>
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
                                          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center gap-2 shadow-lg transition-all duration-300"
                                        >
                                          <EyeIcon className="h-4 w-4" />
                                          View
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlers.onDownload(expAttachment)}
                                        className="border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center gap-2 shadow-lg transition-all duration-300"
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

                          {exp.document && exp.providedAsDocument && (
                            <ApplicationAttachments application={application}>
                              {(attachments: any[]) => {
                                const expAttachment = attachments.find((a: { category: string; description: string | string[]; }) =>
                                  a.category === 'Experience' &&
                                  a.description.includes(exp.company || '')
                                );

                                if (!expAttachment) return null;

                                return (
                                  <div className="mt-6 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-200/30 backdrop-blur-sm">
                                    <div className="flex items-center gap-4">
                                      <FileText className="h-6 w-6 text-emerald-600" />
                                      <div>
                                        <p className="font-semibold text-emerald-900 text-lg">
                                          {expAttachment.name}
                                        </p>
                                        <p className="text-base text-emerald-700">
                                          {expAttachment.sizeLabel}
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
                                <Badge key={skillIndex} className="bg-blue-500/10 text-blue-700 border-blue-200/30 backdrop-blur-sm">
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
                        <p className="text-slate-500 text-lg">No work experience provided</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* References Tab */}
            <TabsContent value="references" className="space-y-8 animate-in fade-in duration-500">
              <Card className="backdrop-blur-xl bg-white/80 border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-6 border-b border-slate-200/30 bg-gradient-to-r from-slate-50/50 to-white/50 rounded-t-3xl">
                  <CardTitle className="flex items-center gap-3 text-slate-800 text-2xl font-bold">
                    <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-200/30">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    Professional References
                  </CardTitle>
                  <CardDescription className="text-slate-600 text-lg">
                    Your professional references and recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="space-y-6">
                    {application.references && application.references.length > 0 ? (
                      application.references.map((ref, index) => (
                        <div key={index} className="p-8 border border-slate-200/30 rounded-2xl bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-slate-800 mb-2">{ref.name}</h4>
                              <p className="text-slate-700 font-semibold text-lg mb-3">{ref.position} at {ref.company}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base text-slate-600 mb-4">
                                <div>
                                  <strong className="text-slate-700">Relationship:</strong> {ref.relationship}
                                </div>
                                <div>
                                  <strong className="text-slate-700">Contact Allowed:</strong>
                                  <span className={`ml-3 font-semibold ${ref.allowsContact ? 'text-emerald-600' : 'text-rose-600'}`}>
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
                                <p className="text-slate-700 leading-relaxed bg-slate-50/50 p-6 rounded-2xl border border-slate-200/30 backdrop-blur-sm">
                                  <strong>Notes:</strong> {ref.notes}
                                </p>
                              )}
                            </div>
                            {/* File actions moved to ApplicationAttachments - still show buttons if document exists */}
                            {ref.document && ref.providedAsDocument && (
                              <ApplicationAttachments application={application}>
                                {(attachments: any[], handlers: { onView: (arg0: any) => void; onDownload: (arg0: any) => void; }) => {
                                  const refAttachment = attachments.find((a: { category: string; description: string | string[]; }) =>
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
                                          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center gap-2 shadow-lg transition-all duration-300"
                                        >
                                          <EyeIcon className="h-4 w-4" />
                                          View
                                        </Button>
                                      )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlers.onDownload(refAttachment)}
                                        className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white flex items-center gap-2 shadow-lg transition-all duration-300"
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

                          {ref.document && ref.providedAsDocument && (
                            <ApplicationAttachments application={application}>
                              {(attachments: any[]) => {
                                const refAttachment = attachments.find((a: { category: string; description: string | string[]; }) =>
                                  a.category === 'Reference' &&
                                  a.description.includes(ref.name || '')
                                );

                                if (!refAttachment) return null;

                                return (
                                  <div className="mt-6 p-6 bg-purple-500/5 rounded-2xl border border-purple-200/30 backdrop-blur-sm">
                                    <div className="flex items-center gap-4">
                                      <FileText className="h-6 w-6 text-purple-600" />
                                      <div>
                                        <p className="font-semibold text-purple-900 text-lg">
                                          {refAttachment.name}
                                        </p>
                                        <p className="text-base text-purple-700">
                                          {refAttachment.sizeLabel}
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
                        <p className="text-slate-500 text-lg">No references provided</p>
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