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
import { colorClasses, getTheme } from '@/utils/color';

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
  
  // Get theme colors based on mode (default light)
  const themeMode = 'light'; // In a real app, this would come from a theme context
  const theme = getTheme(themeMode);

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
    const statusColors: Record<string, { text: string; bg: string; border: string }> = {
      'applied': {
        text: colorClasses.text.blue,
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: colorClasses.border.blue
      },
      'under-review': {
        text: colorClasses.text.amber,
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: colorClasses.border.amber
      },
      'shortlisted': {
        text: colorClasses.text.green,
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: colorClasses.border.green
      },
      'interview-scheduled': {
        text: colorClasses.text.purple,
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: colorClasses.border.purple
      },
      'interviewed': {
        text: colorClasses.text.indigo,
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: colorClasses.border.indigo
      },
      'offer-pending': {
        text: colorClasses.text.orange,
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: colorClasses.border.orange
      },
      'offer-made': {
        text: colorClasses.text.teal,
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        border: colorClasses.border.teal
      },
      'offer-accepted': {
        text: colorClasses.text.emerald,
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: colorClasses.border.emerald
      },
      'rejected': {
        text: colorClasses.text.red,
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: colorClasses.border.red
      },
      'on-hold': {
        text: colorClasses.text.gray800,
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: colorClasses.border.gray800
      },
      'withdrawn': {
        text: colorClasses.text.gray600,
        bg: 'bg-gray-100 dark:bg-gray-800/50',
        border: colorClasses.border.gray400
      }
    };
    
    return statusColors[status] || {
      text: colorClasses.text.gray800,
      bg: 'bg-gray-50 dark:bg-gray-800',
      border: colorClasses.border.gray400
    };
  };

  const ownerInfo = getOwnerInfo();
  const statusColor = getStatusColorClass(application.status);

  return (
    <Card className={`
      w-full group cursor-pointer transition-all duration-300 
      hover:shadow-xl border rounded-2xl overflow-hidden 
      ${colorClasses.bg.white} backdrop-blur-sm
      ${colorClasses.border.gray400}
      hover:${colorClasses.border.gray800}
    `}>
      <CardHeader className={`
        pb-4 border-b ${colorClasses.bg.white}/80
        ${colorClasses.border.gray100}
      `}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start space-x-4 flex-1 min-w-0">            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
                <div className={`
                  p-2 bg-gradient-to-br from-blue-500 to-blue-600 
                  rounded-xl shadow-lg w-fit
                `}>
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className={`
                    text-xl font-bold truncate 
                    group-hover:${colorClasses.text.blue} 
                    transition-colors ${colorClasses.text.darkNavy}
                  `}>
                    {application.job.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Building className={`h-4 w-4 ${colorClasses.text.gray400}`} />
                    <span className={`text-sm font-medium ${colorClasses.text.gray700}`}>
                      {ownerInfo.name}
                    </span>
                    {ownerInfo.verified && (
                      <Badge variant="secondary" className={`
                        bg-emerald-100 dark:bg-emerald-900/30 
                        ${colorClasses.text.emerald}
                        ${colorClasses.border.emerald} text-xs px-2 py-1
                      `}>
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                <div className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full 
                  bg-blue-50/50 dark:bg-blue-900/20
                `}>
                  <Calendar className={`h-4 w-4 ${colorClasses.text.blue}`} />
                  <span className={`font-medium ${colorClasses.text.blue}`}>
                    Applied {formattedApplication.daysSinceApplied === 0 ? 'today' : `${formattedApplication.daysSinceApplied}d ago`}
                  </span>
                </div>
                <div className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full
                  ${colorClasses.bg.gray100}
                `}>
                  <Clock className={`h-4 w-4 ${colorClasses.text.gray600}`} />
                  <span className={colorClasses.text.gray600}>
                    Updated {new Date(application.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-row md:flex-col items-center md:items-end gap-3">
            <Badge 
              className={`
                px-4 py-2 font-semibold border-2 rounded-full shadow-sm
                ${statusColor.text} ${statusColor.bg} ${statusColor.border}
              `}
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
              className={`
                h-9 w-9 p-0 border rounded-xl 
                transition-all duration-200 shadow-sm
                ${colorClasses.bg.white}/80
                ${colorClasses.border.gray400}
                hover:${colorClasses.bg.blue}
                hover:${colorClasses.border.blue}
              `}
            >
              <ChevronRight className={`
                h-4 w-4 ${colorClasses.text.gray600} 
                group-hover:${colorClasses.text.blue}
              `} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Candidate Info */}
        {viewType !== 'candidate' && (
          <div className={`
            p-4 bg-gradient-to-r rounded-2xl border backdrop-blur-sm
            from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20
            ${colorClasses.border.blue}
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                p-2 rounded-xl shadow-sm border
                ${colorClasses.bg.white}
                ${colorClasses.border.blue}
              `}>
                <User className={`h-5 w-5 ${colorClasses.text.blue}`} />
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold text-sm ${colorClasses.text.darkNavy}`}>
                  {application.candidate.name}
                </h4>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs mt-2">
                  <div className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-lg
                    ${colorClasses.bg.white}/50
                  `}>
                    <Mail className="h-3.5 w-3.5" />
                    <span className={`font-medium ${colorClasses.text.gray700}`}>
                      {application.candidate.email}
                    </span>
                  </div>
                  {application.candidate.phone && (
                    <div className={`
                      flex items-center gap-1.5 px-2 py-1 rounded-lg
                      ${colorClasses.bg.white}/50
                    `}>
                      <Phone className="h-3.5 w-3.5" />
                      <span className={colorClasses.text.gray700}>
                        {application.candidate.phone}
                      </span>
                    </div>
                  )}
                  {application.candidate.location && (
                    <div className={`
                      flex items-center gap-1.5 px-2 py-1 rounded-lg
                      ${colorClasses.bg.white}/50
                    `}>
                      <MapPin className="h-3.5 w-3.5" />
                      <span className={colorClasses.text.gray700}>
                        {application.candidate.location}
                      </span>
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
            <div className={`
              p-4 rounded-2xl border
              bg-gradient-to-br from-yellow-50/50 to-amber-50/50 
              dark:from-yellow-900/20 dark:to-amber-900/20
              ${colorClasses.border.amber}
            `}>
              <h4 className={`
                font-semibold text-sm mb-3 flex items-center gap-2
                ${colorClasses.text.darkNavy}
              `}>
                <Award className={`h-4 w-4 ${colorClasses.text.amber}`} />
                Key Skills
              </h4>
              <div className="flex flex-wrap gap-2">
                {application.skills.slice(0, 4).map((skill, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className={`
                      text-xs shadow-sm
                      ${colorClasses.bg.white}/80
                      ${colorClasses.border.amber}
                      ${colorClasses.text.gray700}
                    `}
                  >
                    {skill}
                  </Badge>
                ))}
                {application.skills.length > 4 && (
                  <Badge 
                    variant="outline" 
                    className={`
                      text-xs bg-yellow-100/50 dark:bg-yellow-900/30
                      ${colorClasses.border.amber}
                      ${colorClasses.text.amber}
                    `}
                  >
                    +{application.skills.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* CVs */}
          {application.selectedCVs && application.selectedCVs.length > 0 && (
            <div className={`
              p-4 rounded-2xl border
              bg-gradient-to-br from-blue-50/50 to-cyan-50/50
              dark:from-blue-900/20 dark:to-cyan-900/20
              ${colorClasses.border.blue}
            `}>
              <h4 className={`
                font-semibold text-sm mb-3 flex items-center gap-2
                ${colorClasses.text.darkNavy}
              `}>
                <FileText className={`h-4 w-4 ${colorClasses.text.blue}`} />
                Documents ({application.selectedCVs.length})
              </h4>
              <div className="space-y-2">
                {application.selectedCVs.slice(0, 2).map((cv, index) => {
                  const plainCV = applicationService.convertMongooseDocToPlainObject(cv);
                  return (
                    <div key={index} className={`
                      flex items-center justify-between p-3 border rounded-xl
                      transition-all duration-200 shadow-sm
                      ${colorClasses.bg.white}/80
                      ${colorClasses.border.blue}
                      hover:${colorClasses.border.blue}
                    `}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className={`h-4 w-4 ${colorClasses.text.blue} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm truncate block ${colorClasses.text.darkNavy}`}>
                            {plainCV.originalName || plainCV.filename || `CV-${index + 1}`}
                          </span>
                          {plainCV.size && (
                            <span className={`text-xs ${colorClasses.text.gray400}`}>
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
                          className={`
                            h-7 w-7 p-0 transition-all duration-200 rounded-lg
                            hover:bg-blue-500 hover:text-white
                          `}
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
                          className={`
                            h-7 w-7 p-0 transition-all duration-200 rounded-lg
                            hover:bg-emerald-500 hover:text-white
                          `}
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
          <div className={`
            p-4 rounded-2xl border
            bg-gradient-to-br from-orange-50/50 to-amber-50/50
            dark:from-orange-900/20 dark:to-amber-900/20
            ${colorClasses.border.orange}
          `}>
            <h4 className={`
              font-semibold text-sm mb-3 flex items-center gap-2
              ${colorClasses.text.darkNavy}
            `}>
              <Briefcase className={`h-4 w-4 ${colorClasses.text.orange}`} />
              Cover Letter Preview
            </h4>
            <div className={`
              p-3 border rounded-xl max-h-20 overflow-y-auto
              ${colorClasses.bg.white}/80
              ${colorClasses.border.orange}
            `}>
              <p className={`text-sm leading-relaxed ${colorClasses.text.gray700} line-clamp-3`}>
                {application.coverLetter}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className={`
        pt-4 border-t bg-white/50 dark:bg-gray-900/50
        ${colorClasses.border.gray100}
      `}>
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-4">
          <div className={`
            flex items-center gap-2 text-xs px-3 py-1.5 rounded-full
            ${colorClasses.bg.gray100}
            ${colorClasses.text.gray400}
          `}>
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
                className={`
                  border text-orange-700 dark:text-orange-300 bg-orange-50/50 
                  dark:bg-orange-900/20 hover:bg-orange-500 hover:text-white 
                  transition-all duration-200 rounded-lg shadow-sm
                  ${colorClasses.border.orange}
                `}
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
              className={`
                bg-gradient-to-r from-blue-600 to-blue-700 
                hover:from-blue-700 hover:to-blue-800 
                text-white transition-all duration-200 
                rounded-lg shadow-lg shadow-blue-500/25
              `}
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