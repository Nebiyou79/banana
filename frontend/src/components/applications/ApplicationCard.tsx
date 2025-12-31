/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Application, applicationService } from '@/services/applicationService';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar, 
  MapPin, 
  Building, 
  Download, 
  Eye, 
  FileText, 
  Mail,
  Clock,
  User,
  Award,
  Briefcase,
  ChevronRight,
  ExternalLink,
  Phone
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApplicationCardProps {
  application: Application;
  viewType?: 'candidate' | 'company' | 'organization';
  onStatusUpdate?: (updatedApplication: Application) => void;
  onWithdraw?: (applicationId: string) => void;
  onSelect?: (application: Application) => void;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  viewType = 'candidate',
  onStatusUpdate,
  onWithdraw,
  onSelect
}) => {
  const { toast } = useToast();
  const formattedApplication = applicationService.formatApplication(application);

  const handleDownloadCV = async (cv: any) => {
    try {
      console.log('📥 Downloading CV:', cv);
      // Convert to plain object first to handle Mongoose documents
      const plainCV = applicationService.convertMongooseDocToPlainObject(cv);
      await applicationService.downloadFile(plainCV, 'cv');
    } catch (error: any) {
      console.error('CV download error:', error);
      toast({
        title: 'Download Failed',
        description: error.message || 'Failed to download CV',
        variant: 'destructive',
      });
    }
  };

  const handleViewCV = async (cv: any) => {
    try {
      // Convert to plain object first to handle Mongoose documents
      const plainCV = applicationService.convertMongooseDocToPlainObject(cv);
      await applicationService.viewFile(plainCV, 'cv');
    } catch (error: any) {
      toast({
        title: 'View Failed',
        description: error.message || 'Failed to view CV',
        variant: 'destructive',
      });
    }
  };

  const handleWithdraw = async () => {
    if (!onWithdraw) return;
    
    try {
      await applicationService.withdrawApplication(application._id);
      onWithdraw(application._id);
      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been successfully withdrawn',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Withdrawal Failed',
        description: error.message || 'Failed to withdraw application',
        variant: 'destructive',
      });
    }
  };

  const handleSelect = () => {
    if (onSelect) {
      onSelect(application);
    } else {
      const basePath = viewType === 'candidate' 
        ? '/dashboard/candidate/applications' 
        : '/dashboard/company/applications';
      window.location.href = `${basePath}/${application._id}`;
    }
  };

  const getOwnerInfo = () => {
    if (application.job.jobType === 'organization' && application.job.organization) {
      return {
        name: application.job.organization.name,
        logo: application.job.organization.logoUrl,
        type: 'Organization',
        verified: application.job.organization.verified
      };
    }
    
    if (application.job.jobType === 'company' && application.job.company) {
      return {
        name: application.job.company.name,
        logo: application.job.company.logoUrl,
        type: 'Company',
        verified: application.job.company.verified
      };
    }
    
    return {
      name: 'Unknown',
      logo: undefined,
      type: 'Unknown',
      verified: false
    };
  };

  const getStatusColorClass = (status: string) => {
    const statusColors: Record<string, string> = {
      'applied': 'bg-blue-50 text-blue-700 border-blue-200',
      'under-review': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'shortlisted': 'bg-green-50 text-green-700 border-green-200',
      'interview-scheduled': 'bg-purple-50 text-purple-700 border-purple-200',
      'interviewed': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'offer-pending': 'bg-orange-50 text-orange-700 border-orange-200',
      'offer-made': 'bg-teal-50 text-teal-700 border-teal-200',
      'offer-accepted': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'rejected': 'bg-red-50 text-red-700 border-red-200',
      'on-hold': 'bg-gray-50 text-gray-700 border-gray-200',
      'withdrawn': 'bg-gray-100 text-gray-600 border-gray-300'
    };
    return statusColors[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const ownerInfo = getOwnerInfo();

  return (
    <Card className="w-full group cursor-pointer transition-all duration-300 hover:shadow-xl border border-gray-200/80 rounded-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm">
      <CardHeader className="pb-4 border-b border-gray-100/50 bg-white/80">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1 min-w-0">            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                    {application.job.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{ownerInfo.name}</span>
                    {ownerInfo.verified && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs px-2 py-1">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 bg-blue-50/50 px-3 py-1.5 rounded-full">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Applied {formattedApplication.daysSinceApplied === 0 ? 'today' : `${formattedApplication.daysSinceApplied}d ago`}</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50/50 px-3 py-1.5 rounded-full">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span>Updated {new Date(application.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <Badge 
              className={`px-4 py-2 font-semibold border-2 ${getStatusColorClass(application.status)} rounded-full shadow-sm`}
            >
              {formattedApplication.statusLabel}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect();
              }}
              className="h-9 w-9 p-0 bg-white/80 border border-gray-200/50 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all duration-200 shadow-sm"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-blue-600" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Candidate Info */}
        {viewType !== 'candidate' && (
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 rounded-2xl border border-blue-200/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm">{application.candidate.name}</h4>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mt-2">
                  <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="font-medium">{application.candidate.email}</span>
                  </div>
                  {application.candidate.phone && (
                    <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{application.candidate.phone}</span>
                    </div>
                  )}
                  {application.candidate.location && (
                    <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{application.candidate.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Skills & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Skills */}
          {application.skills && application.skills.length > 0 && (
            <div className="bg-gradient-to-br from-yellow-50/50 to-amber-50/50 p-4 rounded-2xl border border-yellow-200/50">
              <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-yellow-600" />
                Key Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {application.skills.slice(0, 4).map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-white/80 border-yellow-300 text-gray-700 shadow-sm">
                    {skill}
                  </Badge>
                ))}
                {application.skills.length > 4 && (
                  <Badge variant="outline" className="text-xs bg-yellow-100/50 border-yellow-200 text-yellow-700">
                    +{application.skills.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* CVs */}
          {application.selectedCVs && application.selectedCVs.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50/50 to-cyan-50/50 p-4 rounded-2xl border border-blue-200/50">
              <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                Documents ({application.selectedCVs.length})
              </h4>
              <div className="space-y-2">
                {application.selectedCVs.slice(0, 2).map((cv, index) => {
                  const plainCV = applicationService.convertMongooseDocToPlainObject(cv);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/80 border border-blue-200/30 rounded-xl hover:border-blue-300 transition-all duration-200 shadow-sm">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-gray-900 truncate block">
                            {plainCV.originalName || plainCV.filename || `CV-${index + 1}`}
                          </span>
                          {plainCV.size && (
                            <span className="text-xs text-gray-500">
                              ({applicationService.getFileSize(plainCV)})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCV(plainCV);
                          }}
                          className="h-7 w-7 p-0 hover:bg-blue-500 hover:text-white transition-all duration-200 rounded-lg"
                          title="View CV"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadCV(plainCV);
                          }}
                          className="h-7 w-7 p-0 hover:bg-emerald-500 hover:text-white transition-all duration-200 rounded-lg"
                          title="Download CV"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cover Letter Preview */}
        {application.coverLetter && (
          <div className="bg-gradient-to-br from-orange-50/50 to-amber-50/50 p-4 rounded-2xl border border-orange-200/50">
            <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-orange-600" />
              Cover Letter Preview
            </h4>
            <div className="p-3 bg-white/80 border border-orange-200/30 rounded-xl max-h-20 overflow-y-auto">
              <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                {application.coverLetter}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t border-gray-100/50 bg-white/50">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50/50 px-3 py-1.5 rounded-full">
            <User className="h-3 w-3" />
            <span>ID: {application._id.slice(-8)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {viewType === 'candidate' && formattedApplication.canWithdraw && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleWithdraw();
                }}
                className="border-orange-300 text-orange-700 bg-orange-50/50 hover:bg-orange-500 hover:text-white transition-all duration-200 rounded-lg shadow-sm"
              >
                Withdraw
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect();
              }}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 rounded-lg shadow-lg shadow-blue-500/25"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};