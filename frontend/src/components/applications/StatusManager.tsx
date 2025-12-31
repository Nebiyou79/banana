/* eslint-disable @typescript-eslint/no-explicit-any */
// components/application/StatusManager.tsx - CLEAN PROFESSIONAL VERSION
import React, { useState } from 'react';
import { 
  Application, 
  applicationService, 
  UpdateStatusData,
  CompanyResponseData 
} from '@/services/applicationService';
import { Button } from '@/components/ui/Button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { Badge } from '@/components/ui/Badge';
import { 
  Calendar,
  MapPin,
  Send,
  Clock,
  User,
  CheckCircle,
  Pause,
  X,
  Mail,
  ThumbsUp,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StatusManagerProps {
  application: Application;
  onStatusUpdate: (updatedApplication: Application) => void;
  viewType: 'company' | 'organization';
}

type ResponseStatus = 'active-consideration' | 'on-hold' | 'rejected' | 'selected-for-interview';

interface ResponseOption {
  value: ResponseStatus;
  label: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

interface ResponseFormData {
  status: ResponseStatus;
  message: string;
  interviewLocation: string;
  interviewDate: string;
  interviewTime: string;
  startDate: string;
  rejectionReason: string;
}

export const StatusManager: React.FC<StatusManagerProps> = ({
  application,
  onStatusUpdate,
  viewType
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>('');
  const [responseData, setResponseData] = useState<ResponseFormData>({
    status: '' as ResponseStatus,
    message: '',
    interviewLocation: '',
    interviewDate: '',
    interviewTime: '',
    startDate: '',
    rejectionReason: ''
  });
  const { toast } = useToast();

  const formattedApplication = applicationService.formatApplication(application);

  const responseOptions: ResponseOption[] = [
    {
      value: 'selected-for-interview',
      label: 'Schedule Interview',
      description: 'Invite candidate for an interview',
      color: 'purple',
      icon: <Calendar className="h-5 w-5" />
    },
    {
      value: 'active-consideration',
      label: 'Shortlist Candidate',
      description: 'Inform candidate they are shortlisted',
      color: 'green',
      icon: <CheckCircle className="h-5 w-5" />
    },
    {
      value: 'on-hold',
      label: 'Put on Hold',
      description: 'Notify candidate to wait for positions',
      color: 'orange',
      icon: <Pause className="h-5 w-5" />
    },
    {
      value: 'rejected',
      label: 'Not Selected',
      description: 'Inform candidate they were not selected',
      color: 'red',
      icon: <X className="h-5 w-5" />
    }
  ];

  const getDefaultMessage = (status: ResponseStatus, additionalData?: Partial<ResponseFormData>): string => {
    const candidateName = application.userInfo?.name || application.candidate?.name || 'Candidate';
    const jobTitle = application.job?.title || 'the position';
    const ownerName = application.job.jobType === 'organization' 
      ? application.job.organization?.name 
      : application.job.company?.name || 'Our organization';
    
    switch (status) {
      case 'active-consideration':
        return `Dear ${candidateName},

We are pleased to inform you that your application for ${jobTitle} has been shortlisted! 

Please visit our office to complete the onboarding process. Your start date will be ${additionalData?.startDate || 'upon completion of onboarding'}.

We look forward to welcoming you to our team.

Best regards,
${ownerName} Hiring Team`;

      case 'selected-for-interview':
        const interviewDateTime = additionalData?.interviewDate && additionalData?.interviewTime 
          ? `${new Date(additionalData.interviewDate).toLocaleDateString()} at ${additionalData.interviewTime}`
          : 'To be scheduled';
        
        return `Dear ${candidateName},

Congratulations! You have been selected for an interview for the ${jobTitle} position.

Interview Details:
- Date & Time: ${interviewDateTime}
- Location: ${additionalData?.interviewLocation || 'Our main office'}

Please arrive 15 minutes early and bring any required documents.

We look forward to meeting you!

Best regards,
${ownerName} Hiring Team`;

      case 'on-hold':
        return `Dear ${candidateName},

Thank you for your application for the ${jobTitle} position.

Your application is currently on hold as we are reviewing other candidates. We will contact you if a position becomes available that matches your qualifications.

Please wait for our response regarding potential opportunities.

Thank you for your patience.

Best regards,
${ownerName} Hiring Team`;

      case 'rejected':
        return `Dear ${candidateName},

Thank you for your interest in the ${jobTitle} position at ${ownerName}.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs. ${additionalData?.rejectionReason ? `\n\nReason: ${additionalData.rejectionReason}` : ''}

We appreciate the time and effort you invested in your application and encourage you to apply for future positions that may be a better fit for your skills and experience.

We wish you the best in your job search.

Sincerely,
${ownerName} Hiring Team`;

      default:
        return '';
    }
  };

  const handleResponseSubmit = async (): Promise<void> => {
    if (!responseData.status) {
      toast({
        title: 'Error',
        description: 'Please select a response type',
        variant: 'destructive',
      });
      return;
    }

    if (responseData.status === 'selected-for-interview' && (!responseData.interviewDate || !responseData.interviewTime || !responseData.interviewLocation)) {
      toast({
        title: 'Error',
        description: 'Please provide interview date, time, and location',
        variant: 'destructive',
      });
      return;
    }

    if (responseData.status === 'active-consideration' && !responseData.startDate) {
      toast({
        title: 'Error',
        description: 'Please provide a start date for the candidate',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      let updatedApplication: Application;

      if (responseData.status === 'selected-for-interview') {
        // Combine date and time for the interview details
        const interviewDateTime = `${responseData.interviewDate}T${responseData.interviewTime}:00`;
        
        // First update company response
        const companyResponseData: CompanyResponseData = {
          status: responseData.status,
          message: responseData.message,
          interviewLocation: responseData.interviewLocation
        };

        await applicationService.addCompanyResponse(
          application._id,
          companyResponseData
        );

        // Then update the main status to interview-scheduled with full interview details
        const statusData: UpdateStatusData = {
          status: 'interview-scheduled',
          message: responseData.message,
          interviewDetails: {
            date: interviewDateTime,
            location: responseData.interviewLocation,
            type: 'in-person',
            interviewer: 'Hiring Manager',
            notes: responseData.message
          }
        };

        const statusResponse = await applicationService.updateApplicationStatus(
          application._id,
          statusData
        );
        updatedApplication = statusResponse.data.application;

      } else {
        // Map response status to application status
        let applicationStatus: string;
        switch (responseData.status) {
          case 'active-consideration':
            applicationStatus = 'shortlisted';
            break;
          case 'on-hold':
            applicationStatus = 'on-hold';
            break;
          case 'rejected':
            applicationStatus = 'rejected';
            break;
          default:
            applicationStatus = 'under-review';
        }

        const statusData: UpdateStatusData = {
          status: applicationStatus,
          message: responseData.message
        };

        if (responseData.status === 'active-consideration' && responseData.startDate) {
          statusData.message += `\n\nStart Date: ${responseData.startDate}`;
        }

        const response = await applicationService.updateApplicationStatus(
          application._id,
          statusData
        );
        updatedApplication = response.data.application;
      }

      toast({
        title: 'Response Sent',
        description: `Candidate has been notified`,
        variant: 'default',
      });

      onStatusUpdate(updatedApplication);
      setShowResponseDialog(false);
      setResponseData({
        status: '' as ResponseStatus,
        message: '',
        interviewLocation: '',
        interviewDate: '',
        interviewTime: '',
        startDate: '',
        rejectionReason: ''
      });
      setSelectedAction('');
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update application status',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionSelect = (action: string): void => {
    setSelectedAction(action);
    const status = action as ResponseStatus;
    setResponseData(prev => ({
      ...prev,
      status,
      message: getDefaultMessage(status)
    }));
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      'applied': 'bg-blue-100 text-blue-800 border-blue-200',
      'under-review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'shortlisted': 'bg-green-100 text-green-800 border-green-200',
      'interview-scheduled': 'bg-purple-100 text-purple-800 border-purple-200',
      'interviewed': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'offer-pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'offer-made': 'bg-teal-100 text-teal-800 border-teal-200',
      'offer-accepted': 'bg-green-100 text-green-800 border-green-200',
      'rejected': 'bg-red-100 text-red-800 border-red-200',
      'on-hold': 'bg-gray-100 text-gray-800 border-gray-200',
      'withdrawn': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-600" />
            <span>Application Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Badge 
                variant="outline" 
                className={`text-base px-4 py-2 font-semibold ${getStatusColor(application.status)}`}
              >
                {formattedApplication.statusLabel}
              </Badge>
              <div className="text-sm text-gray-600">
                <p>Applied on {new Date(application.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setSelectedAction('')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Response
                </Button>
              </DialogTrigger>
              <ResponseDialog 
                responseData={responseData}
                onResponseDataChange={setResponseData}
                onSubmit={handleResponseSubmit}
                isSubmitting={isSubmitting}
                responseOptions={responseOptions}
                selectedAction={selectedAction}
                onActionSelect={handleActionSelect}
                getDefaultMessage={getDefaultMessage}
              />
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription className="text-gray-600">
            Send predefined responses to candidates
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {responseOptions.map((option) => {
              const colorClasses = {
                'purple': 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
                'green': 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
                'orange': 'bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100',
                'red': 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
              };

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedAction(option.value);
                    setResponseData(prev => ({
                      ...prev,
                      status: option.value as ResponseStatus,
                      message: getDefaultMessage(option.value as ResponseStatus),
                    }));
                    setShowResponseDialog(true);
                  }}
                  disabled={isSubmitting}
                  className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses[option.color as keyof typeof colorClasses]}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      option.color === 'purple' ? 'bg-purple-600' :
                      option.color === 'green' ? 'bg-green-600' :
                      option.color === 'orange' ? 'bg-orange-500' :
                      'bg-red-600'
                    } text-white`}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{option.label}</h3>
                      <p className="text-sm opacity-75 mt-1">{option.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Status History */}
      {application.statusHistory && application.statusHistory.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-4">
            <CardTitle>Status History</CardTitle>
            <CardDescription>
              Timeline of all status changes for this application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {application.statusHistory
                .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
                .map((history, index) => (
                  <div key={history._id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-gray-300'
                      }`}></div>
                      {index < application.statusHistory!.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(history.status)}
                        >
                          {applicationService.getStatusLabel(history.status)}
                        </Badge>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(history.changedAt).toLocaleDateString()} at{' '}
                          {new Date(history.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <User className="h-4 w-4" />
                        <span>By {history.changedBy?.name || 'System'}</span>
                      </div>
                      
                      {history.message && (
                        <div className="bg-gray-50 p-3 rounded border border-gray-200">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{history.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Response Dialog Component
interface ResponseDialogProps {
  responseData: ResponseFormData;
  onResponseDataChange: (data: ResponseFormData) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  responseOptions: ResponseOption[];
  selectedAction: string;
  onActionSelect: (action: string) => void;
  getDefaultMessage: (status: ResponseStatus, additionalData?: Partial<ResponseFormData>) => string;
}

const ResponseDialog: React.FC<ResponseDialogProps> = ({ 
  responseData, 
  onResponseDataChange, 
  onSubmit, 
  isSubmitting, 
  responseOptions,
  selectedAction,
  onActionSelect,
  getDefaultMessage
}) => {
  const selectedOption = responseOptions.find(opt => opt.value === responseData.status);

  const handleFieldChange = (field: keyof ResponseFormData, value: string): void => {
    const newData = { ...responseData, [field]: value };
    onResponseDataChange(newData);
    
    // Update message when relevant fields change
    if (['interviewDate', 'interviewTime', 'interviewLocation', 'startDate', 'rejectionReason'].includes(field)) {
      const updatedMessage = getDefaultMessage(responseData.status, newData);
      onResponseDataChange({ ...newData, message: updatedMessage });
    }
  };

  const handleResetTemplate = (): void => {
    const updatedMessage = getDefaultMessage(responseData.status, responseData);
    onResponseDataChange({ ...responseData, message: updatedMessage });
  };

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          Send Response to Candidate
        </DialogTitle>
        <DialogDescription className="text-gray-600">
          Choose a response type and customize the message for the candidate
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        {/* Action Selection */}
        {!selectedAction && (
          <div className="space-y-4">
            <Label className="text-base font-medium text-gray-900">
              Choose Response Type
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {responseOptions.map((option) => {
                const colorClasses = {
                  'purple': 'border-purple-200 bg-purple-50',
                  'green': 'border-green-200 bg-green-50',
                  'orange': 'border-orange-200 bg-orange-50',
                  'red': 'border-red-200 bg-red-50'
                };

                return (
                  <div
                    key={option.value}
                    onClick={() => onActionSelect(option.value)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-sm ${
                      selectedAction === option.value ? 
                      'ring-2 ring-offset-2 ring-blue-500' : 
                      'hover:border-gray-300'
                    } ${colorClasses[option.color as keyof typeof colorClasses]}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        option.color === 'purple' ? 'bg-purple-600' :
                        option.color === 'green' ? 'bg-green-600' :
                        option.color === 'orange' ? 'bg-orange-500' :
                        'bg-red-600'
                      } text-white`}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{option.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedAction && (
          <>
            {/* Selected Action Header */}
            {selectedOption && (
              <div className={`p-4 rounded-lg border-2 ${
                selectedOption.color === 'purple' ? 'border-purple-200 bg-purple-50' :
                selectedOption.color === 'green' ? 'border-green-200 bg-green-50' :
                selectedOption.color === 'orange' ? 'border-orange-200 bg-orange-50' :
                'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedOption.color === 'purple' ? 'bg-purple-600' :
                    selectedOption.color === 'green' ? 'bg-green-600' :
                    selectedOption.color === 'orange' ? 'bg-orange-500' :
                    'bg-red-600'
                  } text-white`}>
                    {selectedOption.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedOption.label}</p>
                    <p className="text-sm text-gray-600">{selectedOption.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Fields based on action */}
            {selectedAction === 'selected-for-interview' && (
              <div className="space-y-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50">
                <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Interview Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="interview-date" className="font-medium text-gray-900">
                      Interview Date
                    </Label>
                    <Input
                      id="interview-date"
                      type="date"
                      value={responseData.interviewDate}
                      onChange={(e) => handleFieldChange('interviewDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interview-time" className="font-medium text-gray-900">
                      Interview Time
                    </Label>
                    <Input
                      id="interview-time"
                      type="time"
                      value={responseData.interviewTime}
                      onChange={(e) => handleFieldChange('interviewTime', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interview-location" className="font-medium text-gray-900">
                    Interview Location
                  </Label>
                  <Input
                    id="interview-location"
                    placeholder="e.g., Main Office - Conference Room B"
                    value={responseData.interviewLocation}
                    onChange={(e) => handleFieldChange('interviewLocation', e.target.value)}
                  />
                </div>
              </div>
            )}

            {selectedAction === 'active-consideration' && (
              <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                <h3 className="font-semibold text-green-900 flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5" />
                  Onboarding Details
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="font-medium text-gray-900">
                    Start Date
                  </Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={responseData.startDate}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            )}

            {selectedAction === 'rejected' && (
              <div className="space-y-4 p-4 border-2 border-red-200 rounded-lg bg-red-50">
                <h3 className="font-semibold text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Rejection Details
                </h3>
                
                <div className="space-y-2">
                  <Label htmlFor="rejection-reason" className="font-medium text-gray-900">
                    Reason for Rejection
                  </Label>
                  <Textarea
                    id="rejection-reason"
                    placeholder="Provide constructive feedback for the candidate"
                    value={responseData.rejectionReason}
                    onChange={(e) => handleFieldChange('rejectionReason', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Message */}
            <div className="space-y-3">
              <Label htmlFor="response-message" className="text-base font-medium text-gray-900">
                Message to Candidate
              </Label>
              <Textarea
                id="response-message"
                value={responseData.message}
                onChange={(e) => onResponseDataChange({ ...responseData, message: e.target.value })}
                rows={8}
                className="resize-none"
                placeholder="Enter your message to the candidate..."
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between space-x-3 pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => {
            onResponseDataChange({
              status: '' as ResponseStatus,
              message: '',
              interviewLocation: '',
              interviewDate: '',
              interviewTime: '',
              startDate: '',
              rejectionReason: ''
            });
            onActionSelect('');
          }}
          disabled={isSubmitting}
        >
          {selectedAction ? 'Back to Options' : 'Cancel'}
        </Button>
        
        <div className="flex space-x-3">
          {selectedAction && (
            <Button
              variant="outline"
              onClick={handleResetTemplate}
              disabled={isSubmitting}
            >
              Reset Template
            </Button>
          )}
          
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !responseData.status || !responseData.message ||
              (responseData.status === 'selected-for-interview' && 
               (!responseData.interviewDate || !responseData.interviewTime || !responseData.interviewLocation)) ||
              (responseData.status === 'active-consideration' && !responseData.startDate)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Send Response
              </div>
            )}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};