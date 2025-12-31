/* eslint-disable @typescript-eslint/no-explicit-any */
// components/CompanyApplicationDetails.tsx - PREMIUM UI WITH BOTTOM ACTIONS
import React, { useState, useEffect } from 'react';
import { 
  Application, 
  applicationService
} from '@/services/applicationService';
import { StatusManager } from './StatusManager';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useToast } from '@/hooks/use-toast';
import {
  MapPin,
  FileText,
  Download,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Briefcase,
  Award,
  Users,
  Calendar,
  DownloadCloud,
  EyeIcon,
  File,
  FolderOpen,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  BookOpen,
  Target,
  Star
} from 'lucide-react';

interface CompanyApplicationDetailsProps {
  applicationId: string;
  viewType: 'company' | 'organization';
  onBack?: () => void;
  onStatusUpdate?: (application: Application) => void;
}

export const CompanyApplicationDetails: React.FC<CompanyApplicationDetailsProps> = ({
  applicationId,
  viewType,
  onBack,
  onStatusUpdate
}) => {
  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadApplicationDetails();
  }, [applicationId]);

  const loadApplicationDetails = async () => {
    try {
      if (!applicationId || applicationId === 'undefined' || applicationId === 'null') {
        console.error('❌ Invalid application ID:', applicationId);
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
      } else if (viewType === 'organization') {
        response = await applicationService.getOrganizationApplicationDetails(applicationId);
      } else {
        response = await applicationService.getApplicationDetails(applicationId, viewType);
      }
      
      setApplication(response.data.application);
      
    } catch (error: any) {
      console.error('❌ Failed to load application:', error);
      
      if (error.message.includes('Not authorized') || error.message.includes('403')) {
        toast({
          title: 'Access Denied',
          description: `You do not have permission to view this application. This application may belong to a different ${viewType}.`,
          variant: 'destructive',
          duration: 5000,
        });
        
        setTimeout(() => {
          if (onBack) onBack();
        }, 3000);
      } else if (error.message.includes('Invalid application ID')) {
        toast({
          title: 'Invalid Application',
          description: 'The application ID is invalid or malformed.',
          variant: 'destructive',
          duration: 5000,
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load application details',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = (updatedApplication: Application) => {
    setApplication(updatedApplication);
    onStatusUpdate?.(updatedApplication);
    toast({
      title: 'Status Updated',
      description: 'Application status has been updated successfully',
      variant: 'default',
    });
  };

  const handleDownloadFile = async (file: any, type: 'cv' | 'references' | 'experience' | 'applications') => {
    try {
      const plainFile = applicationService.convertMongooseDocToPlainObject(file);
      await applicationService.downloadFile(plainFile, type);
      
      toast({
        title: 'Download Started',
        description: 'File download has been initiated',
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handleViewFile = async (file: any, type: 'cv' | 'references' | 'experience' | 'applications') => {
    try {
      const plainFile = applicationService.convertMongooseDocToPlainObject(file);
      await applicationService.viewFile(plainFile, type);
    } catch (error: any) {
      console.error('View error:', error);
      toast({
        title: 'View Failed',
        description: error.message || 'Failed to view file',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAllDocuments = async () => {
    try {
      const allDocuments = getAllDocuments();
      let downloadedCount = 0;

      for (const doc of allDocuments) {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await handleDownloadFile(doc.file, doc.downloadType);
          downloadedCount++;
        } catch (error) {
          console.error(`Failed to download ${doc.name}:`, error);
        }
      }

      toast({
        title: 'Downloads Complete',
        description: `Successfully downloaded ${downloadedCount} out of ${allDocuments.length} files`,
        variant: downloadedCount === allDocuments.length ? 'default' : 'destructive',
      });
    } catch (error: any) {
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download all documents',
        variant: 'destructive',
      });
    }
  };

  // Premium Glass Card Component
  const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
    children, 
    className = '' 
  }) => (
    <div 
      className={`rounded-2xl border border-white/30 bg-white/20 backdrop-blur-xl shadow-2xl shadow-black/5 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
      }}
    >
      {children}
    </div>
  );

  // Premium Badge Component
  const PremiumBadge: React.FC<{ 
    children: React.ReactNode; 
    variant?: 'default' | 'gold' | 'platinum';
  }> = ({ children, variant = 'default' }) => {
    const variants = {
      default: 'bg-white/30 text-gray-700 border-white/40',
      gold: 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border-amber-300/50',
      platinum: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300/50'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border backdrop-blur-sm ${variants[variant]}`}>
        {children}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'offer-accepted':
      case 'shortlisted':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle className="h-5 w-5 text-rose-400" />;
      case 'interview-scheduled':
      case 'under-review':
        return <Clock className="h-5 w-5 text-blue-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColorClass = (status: string) => {
    const statusColors: Record<string, string> = {
      'applied': 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      'under-review': 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
      'shortlisted': 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      'interview-scheduled': 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      'interviewed': 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      'offer-pending': 'bg-orange-500/20 text-orange-300 border-orange-400/30',
      'offer-made': 'bg-teal-500/20 text-teal-300 border-teal-400/30',
      'offer-accepted': 'bg-green-500/20 text-green-300 border-green-400/30',
      'rejected': 'bg-rose-500/20 text-rose-300 border-rose-400/30',
      'on-hold': 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      'withdrawn': 'bg-gray-400/20 text-gray-400 border-gray-500/30'
    };
    return statusColors[status] || 'bg-gray-500/20 text-gray-300 border-gray-400/30';
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

  // Enhanced document organization with proper download types
  const getAllDocuments = () => {
    if (!application) return [];
    
    const documents: Array<{
      id: string;
      name: string;
      file: any;
      type: 'cv' | 'reference' | 'experience' | 'portfolio' | 'other';
      downloadType: 'cv' | 'references' | 'experience' | 'applications';
      category: string;
      description: string;
      icon: React.ReactNode;
      color: string;
      canView: boolean;
    }> = [];

    // Add CVs
    application.selectedCVs.forEach((cv, index) => {
      const plainCV = applicationService.convertMongooseDocToPlainObject(cv);
      documents.push({
        id: `cv-${index}-${plainCV._id || index}`,
        name: cv.originalName || cv.filename || `CV-${index + 1}`,
        file: plainCV,
        type: 'cv',
        downloadType: 'cv',
        category: 'Curriculum Vitae',
        description: 'Candidate\'s resume/CV',
        icon: <FileText className="h-5 w-5" />,
        color: 'blue',
        canView: applicationService.canViewInline(plainCV)
      });
    });

    // Add reference documents - ONLY if they have actual uploaded files
    if (application.references) {
      application.references.forEach((ref, index) => {
        if (ref.document && ref.providedAsDocument) {
          const plainDoc = applicationService.convertMongooseDocToPlainObject(ref.document);
          documents.push({
            id: `ref-${index}-${plainDoc._id || index}`,
            name: ref.document.originalName || `Reference from ${ref.name}`,
            file: plainDoc,
            type: 'reference',
            downloadType: 'references',
            category: 'Professional References',
            description: `Reference letter from ${ref.name}`,
            icon: <Users className="h-5 w-5" />,
            color: 'purple',
            canView: applicationService.canViewInline(plainDoc)
          });
        }
      });
    }

    // Add experience documents - ONLY if they have actual uploaded files
    if (application.workExperience) {
      application.workExperience.forEach((exp, index) => {
        if (exp.document && exp.providedAsDocument) {
          const plainDoc = applicationService.convertMongooseDocToPlainObject(exp.document);
          documents.push({
            id: `exp-${index}-${plainDoc._id || index}`,
            name: exp.document.originalName || `Experience at ${exp.company}`,
            file: plainDoc,
            type: 'experience',
            downloadType: 'experience',
            category: 'Work Experience',
            description: `Work experience at ${exp.company}`,
            icon: <Briefcase className="h-5 w-5" />,
            color: 'green',
            canView: applicationService.canViewInline(plainDoc)
          });
        }
      });
    }

    // Add all other attachments
    const allAttachments = applicationService.getAllAttachments(application);
    allAttachments.forEach((attachment, index) => {
      const plainAttachment = applicationService.convertMongooseDocToPlainObject(attachment);
      const isAlreadyIncluded = documents.some(doc => 
        doc.file._id === attachment._id || doc.file.filename === attachment.filename
      );
      
      if (!isAlreadyIncluded) {
        documents.push({
          id: `att-${index}-${plainAttachment._id || index}`,
          name: attachment.originalName || attachment.filename || `Document-${index + 1}`,
          file: plainAttachment,
          type: 'other',
          downloadType: 'applications',
          category: 'Additional Documents',
          description: 'Supporting document',
          icon: <File className="h-5 w-5" />,
          color: 'gray',
          canView: applicationService.canViewInline(plainAttachment)
        });
      }
    });

    return documents;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-400 mx-auto mb-6"></div>
          <p className="text-gray-600 text-lg font-medium">Loading candidate details...</p>
          <p className="text-gray-500 text-sm">Preparing premium experience</p>
        </GlassCard>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center p-4">
        <GlassCard className="p-8 text-center max-w-md">
          <div className="w-20 h-20 bg-rose-100/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <AlertCircle className="h-10 w-10 text-rose-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Application Not Found</h3>
          <p className="text-gray-600 mb-8">
            The application you`re looking for doesn`t exist or may have been removed.
          </p>
          {onBack && (
            <Button 
              onClick={onBack} 
              className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-700 hover:bg-white/50"
            >
              <ArrowLeft className="h-5 w-5 mr-3" />
              Back to Applications
            </Button>
          )}
        </GlassCard>
      </div>
    );
  }

  const formattedApplication = applicationService.formatApplication(application);
  const allDocuments = getAllDocuments();
  const hasAdditionalDocuments = allDocuments.length > application.selectedCVs.length;

  const ownerInfo = application.job.jobType === 'organization' 
    ? application.job.organization 
    : application.job.company;

  const isOrganization = viewType === 'organization';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Main Content - Full Width */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full bg-white/30 backdrop-blur-sm p-1 rounded-xl border border-white/40">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="documents" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <FolderOpen className="h-4 w-4" />
                Documents ({allDocuments.length})
              </TabsTrigger>
              <TabsTrigger 
                value="experience" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <Briefcase className="h-4 w-4" />
                Experience
              </TabsTrigger>
              <TabsTrigger 
                value="references" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <Users className="h-4 w-4" />
                References
              </TabsTrigger>
              <TabsTrigger 
                value="status" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg py-3 transition-all"
              >
                <Star className="h-4 w-4" />
                Status
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
              {/* Candidate Profile */}
              <GlassCard className="p-8">
                <div className="flex items-start gap-6">
                  {application.userInfo.avatar ? (
                    <img
                      src={application.userInfo.avatar}
                      alt={application.userInfo.name}
                      className="h-20 w-20 rounded-2xl object-cover border-4 border-white/50 shadow-2xl"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-200 border-4 border-white/50 shadow-2xl flex items-center justify-center">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {application.userInfo.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-900">{application.contactInfo.email}</p>
                        </div>
                      </div>
                      {application.contactInfo.phone && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40">
                          <Phone className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-semibold text-gray-900">{application.contactInfo.phone}</p>
                          </div>
                        </div>
                      )}
                      {application.userInfo.location && (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40">
                          <MapPin className="h-5 w-5 text-rose-500" />
                          <div>
                            <p className="text-sm text-gray-600">Location</p>
                            <p className="font-semibold text-gray-900">{application.userInfo.location}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {application.userInfo.bio && (
                      <div className="bg-white/30 p-4 rounded-xl border border-white/40">
                        <p className="text-gray-700 leading-relaxed">
                          {application.userInfo.bio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>

              {/* Cover Letter */}
              <GlassCard className="p-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-r from-purple-400 to-pink-400">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Cover Letter</h3>
                  </div>
                  <div className="bg-white/30 p-6 rounded-xl border border-white/40">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* Skills */}
              {application.skills && application.skills.length > 0 && (
                <GlassCard className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400">
                        <Award className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">Skills & Qualifications</h3>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {application.skills.map((skill, index) => (
                        <PremiumBadge key={index} variant="gold">
                          {skill}
                        </PremiumBadge>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6 animate-in fade-in duration-300">
              {/* Document Summary */}
              <GlassCard className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-400/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-500/20 border border-blue-400/30">
                      <FolderOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Document Summary
                      </h3>
                      <p className="text-gray-700">
                        {allDocuments.length} total document(s) submitted by candidate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">
                      Breakdown
                    </p>
                    <p className="text-xs text-gray-500">
                      {application.selectedCVs.length} CV(s) • {allDocuments.length - application.selectedCVs.length} supporting document(s)
                    </p>
                  </div>
                </div>
              </GlassCard>

              {/* All Documents */}
              <GlassCard className="p-8">
                <div className="space-y-4">
                  {allDocuments.length > 0 ? (
                    allDocuments.map((doc) => {
                      const colorClasses = {
                        blue: 'bg-blue-500/20 text-blue-600 border-blue-400/30',
                        purple: 'bg-purple-500/20 text-purple-600 border-purple-400/30',
                        green: 'bg-green-500/20 text-green-600 border-green-400/30',
                        gray: 'bg-gray-500/20 text-gray-600 border-gray-400/30'
                      }[doc.color];

                      return (
                        <div key={doc.id} className="flex items-center justify-between p-6 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 hover:bg-white/40 transition-all duration-200 group">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-3 rounded-xl border ${colorClasses}`}>
                              {doc.icon}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-4 mt-2">
                                <PremiumBadge>
                                  {doc.category}
                                </PremiumBadge>
                                <p className="text-sm text-gray-500">
                                  {applicationService.getFileSize(doc.file)}
                                </p>
                                <p className="text-sm text-gray-400">
                                  {doc.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {doc.canView && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewFile(doc.file, doc.downloadType)}
                                className="bg-white/50 backdrop-blur-sm border-white/60 text-gray-700 hover:bg-white/70"
                              >
                                <EyeIcon className="h-4 w-4" />
                                View
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadFile(doc.file, doc.downloadType)}
                              className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border-amber-300 hover:from-amber-500 hover:to-yellow-500"
                            >
                              <DownloadCloud className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No documents submitted</p>
                      <p className="text-gray-400">The candidate hasn`t uploaded any documents yet.</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="space-y-6 animate-in fade-in duration-300">
              <GlassCard className="p-8">
                <div className="space-y-6">
                  {application.workExperience && application.workExperience.length > 0 ? (
                    application.workExperience.map((exp, index) => (
                      <div key={index} className="p-6 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 hover:bg-white/40 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{exp.position}</h4>
                            <p className="text-lg text-gray-700 font-medium mb-3">{exp.company}</p>
                            <div className="flex items-center gap-4 text-gray-600 mb-4">
                              <Calendar className="h-5 w-5" />
                              <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate}</span>
                              {exp.current && (
                                <PremiumBadge variant="gold">Current</PremiumBadge>
                              )}
                            </div>
                            {exp.description && (
                              <p className="text-gray-700 leading-relaxed bg-white/30 p-4 rounded-lg border border-white/40">
                                {exp.description}
                              </p>
                            )}
                          </div>
                          {/* Only show download button if there's an actual uploaded file */}
                          {exp.document && exp.providedAsDocument && (
                            <div className="flex gap-2">
                              {applicationService.canViewInline(exp.document) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewFile(exp.document, 'experience')}
                                  className="bg-white/50 backdrop-blur-sm border-white/60 text-gray-700 hover:bg-white/70"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  View
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadFile(exp.document, 'experience')}
                                className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border-amber-300 hover:from-amber-500 hover:to-yellow-500"
                              >
                                <DownloadCloud className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Show document info if there's an actual uploaded file */}
                        {exp.document && exp.providedAsDocument && (
                          <div className="mt-4 p-4 bg-green-500/10 rounded-xl border border-green-400/30">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-900">
                                  {exp.document.originalName || 'Experience Document'}
                                </p>
                                <p className="text-sm text-green-700">
                                  {applicationService.getFileSize(exp.document)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {exp.skills && exp.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {exp.skills.map((skill, skillIndex) => (
                              <PremiumBadge key={skillIndex}>
                                {skill}
                              </PremiumBadge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No work experience provided</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </TabsContent>

            {/* References Tab */}
            <TabsContent value="references" className="space-y-6 animate-in fade-in duration-300">
              <GlassCard className="p-8">
                <div className="space-y-6">
                  {application.references && application.references.length > 0 ? (
                    application.references.map((ref, index) => (
                      <div key={index} className="p-6 rounded-xl bg-white/30 backdrop-blur-sm border border-white/40 hover:bg-white/40 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">{ref.name}</h4>
                            <p className="text-lg text-gray-700 font-medium mb-3">{ref.position} at {ref.company}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600 mb-4">
                              <div>
                                <strong className="text-gray-700">Relationship:</strong> {ref.relationship}
                              </div>
                              <div>
                                <strong className="text-gray-700">Contact Allowed:</strong> 
                                <span className={`ml-2 font-medium ${ref.allowsContact ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {ref.allowsContact ? 'Yes' : 'No'}
                                </span>
                              </div>
                              {ref.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-4 w-4" />
                                  <span>{ref.email}</span>
                                </div>
                              )}
                              {ref.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{ref.phone}</span>
                                </div>
                              )}
                            </div>
                            {ref.notes && (
                              <p className="text-gray-700 leading-relaxed bg-white/30 p-4 rounded-lg border border-white/40">
                                <strong>Notes:</strong> {ref.notes}
                              </p>
                            )}
                          </div>
                          {/* Only show download button if there's an actual uploaded file */}
                          {ref.document && ref.providedAsDocument && (
                            <div className="flex gap-2">
                              {applicationService.canViewInline(ref.document) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewFile(ref.document, 'references')}
                                  className="bg-white/50 backdrop-blur-sm border-white/60 text-gray-700 hover:bg-white/70"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  View
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadFile(ref.document, 'references')}
                                className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border-amber-300 hover:from-amber-500 hover:to-yellow-500"
                              >
                                <DownloadCloud className="h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          )}
                        </div>
                        
                        {/* Show document info if there's an actual uploaded file */}
                        {ref.document && ref.providedAsDocument && (
                          <div className="mt-4 p-4 bg-purple-500/10 rounded-xl border border-purple-400/30">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-purple-600" />
                              <div>
                                <p className="font-medium text-purple-900">
                                  {ref.document.originalName || 'Reference Document'}
                                </p>
                                <p className="text-sm text-purple-700">
                                  {applicationService.getFileSize(ref.document)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No references provided</p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-6 animate-in fade-in duration-300">
              <GlassCard className="p-8">
                <StatusManager
                  application={application}
                  onStatusUpdate={handleStatusUpdate}
                  viewType={viewType}
                />
              </GlassCard>
            </TabsContent>
          </Tabs>

          {/* Quick Actions & Application Details - MOVED TO BOTTOM */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <GlassCard className="p-6 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-400/30">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="space-y-3">
                  {application.selectedCVs.length > 0 && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white/50 backdrop-blur-sm border-white/60 text-gray-700 hover:bg-white/70"
                      onClick={() => {
                        const firstCV = application.selectedCVs[0];
                        if (firstCV) {
                          handleDownloadFile(firstCV, 'cv');
                        }
                      }}
                    >
                      <DownloadCloud className="h-4 w-4 mr-2" />
                      Download CV
                    </Button>
                  )}
                  {hasAdditionalDocuments && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white/50 backdrop-blur-sm border-white/60 text-gray-700 hover:bg-white/70"
                      onClick={handleDownloadAllDocuments}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All Documents
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* Application Details */}
            <GlassCard className="p-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Application Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/30">
                    <span className="text-gray-600">Application ID:</span>
                    <span className="font-mono text-gray-900 bg-white/50 px-2 py-1 rounded border border-white/60">{application._id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/30">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="text-gray-900 font-medium">{formatDate(application.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/30">
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="text-gray-900 font-medium">{formatDate(application.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-white/30">
                    <span className="text-gray-600">Total Documents:</span>
                    <span className="text-gray-900 font-medium bg-white/50 px-2 py-1 rounded border border-white/60">
                      {allDocuments.length}
                    </span>
                  </div>
                  {ownerInfo?.verified && (
                    <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/30">
                      <span className="text-emerald-700">
                        {isOrganization ? 'Organization' : 'Company'} Status:
                      </span>
                      <PremiumBadge variant="gold">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </PremiumBadge>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};