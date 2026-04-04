// pages/verification/freelancer.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  BriefcaseIcon,
  DocumentCheckIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PrinterIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  UserIcon,
  AcademicCapIcon,
  StarIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import appointmentService, { DocumentRequirement, AppointmentSlot, Appointment } from '@/services/apointmentService';
import verificationService, { VerificationStatusResponse } from '@/services/verificationService';
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import VerificationProgress from '@/components/verifcation/VerifcationProgress';
import AppointmentModal from '@/components/verifcation/AppointmentModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { handleError, handleSuccess } from '@/lib/error-handler';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { colorClasses } from '@/utils/color';

// Utility to get safe user ID
const getSafeUserId = (user: any): string | null => {
  if (!user) return null;
  return user._id || user.id || null;
};

const FreelancerVerification = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [cancellingAppointment, setCancellingAppointment] = useState(false);

  // Get safe user ID
  const userId = getSafeUserId(user);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/verification/freelancer');
    }
  }, [isAuthenticated, router]);

  // Fetch verification status
  useEffect(() => {
    const fetchVerificationStatus = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const status = await verificationService.getVerificationStatus(userId);
        setVerificationStatus(status);
      } catch (err) {
        handleError(err, 'Failed to load verification status');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchVerificationStatus();
    }
  }, [userId]);

  // Fetch upcoming appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!userId) return;

      try {
        setIsLoadingAppointments(true);
        const response = await appointmentService.getUserAppointments(userId);
        const now = new Date();
        const upcoming = response.appointments.filter(appt => {
          const appointmentDate = new Date(appt.appointmentDate);
          return appointmentDate >= now && appt.status !== 'cancelled';
        }).sort((a, b) =>
          new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
        ).slice(0, 2);
        setUpcomingAppointments(upcoming);
      } catch (err) {
        console.error('Failed to load appointments:', err);
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    if (userId) {
      fetchAppointments();
    }
  }, [userId]);

  const handleAppointmentSubmit = async (data: any) => {
    if (!userId) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please login to schedule an appointment',
      });
      return;
    }

    try {
      const response = await appointmentService.createAppointment(data);
      handleSuccess('Appointment scheduled successfully!');
      setShowAppointmentModal(false);

      // Refresh appointments
      const appointmentsResponse = await appointmentService.getUserAppointments(userId);
      const now = new Date();
      setUpcomingAppointments(
        appointmentsResponse.appointments
          .filter(appt => new Date(appt.appointmentDate) >= now && appt.status !== 'cancelled')
          .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
          .slice(0, 2)
      );
    } catch (err: any) {
      handleError(err, err.response?.data?.message || 'Failed to schedule appointment');
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentId) return;

    try {
      setCancellingAppointment(true);
      const response = await appointmentService.cancelAppointment(selectedAppointmentId);
      handleSuccess('Appointment cancelled successfully!');
      setShowCancelModal(false);
      setSelectedAppointmentId(null);

      // Refresh appointments
      if (userId) {
        const appointmentsResponse = await appointmentService.getUserAppointments(userId);
        const now = new Date();
        setUpcomingAppointments(
          appointmentsResponse.appointments
            .filter(appt => new Date(appt.appointmentDate) >= now && appt.status !== 'cancelled')
            .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
            .slice(0, 2)
        );
      }
    } catch (err: any) {
      handleError(err, err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancellingAppointment(false);
    }
  };

  const openCancelConfirmation = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setShowCancelModal(true);
  };

  const checklistItems = [
    {
      icon: UserIcon,
      category: "Personal & Identity Verification",
      items: [
        "Full legal name provided and matches ID",
        "Government-issued ID verified (passport, driver's license, or national ID)",
        "Current address and contact details confirmed (email, phone, etc.)",
        "Profile photo is real and consistent across platforms",
        "Tax ID or freelancer registration number provided (if applicable)"
      ]
    },
    {
      icon: BriefcaseIcon,
      category: "Professional Background",
      items: [
        "Verified work history and experience (previous clients or employers)",
        "Resume or CV reviewed and consistent with online profiles",
        "Education or certifications verified (if relevant to the work)",
        "Professional licenses verified (if required for the service)",
        "LinkedIn or portfolio website verified and active"
      ]
    },
    {
      icon: StarIcon,
      category: "Skills & Work Samples",
      items: [
        "Portfolio or examples of completed work reviewed",
        "References or testimonials from past clients checked",
        "Skill tests or trial tasks completed successfully (optional)",
        "Tools and software proficiency verified (e.g., Adobe, Excel, coding, etc.)"
      ]
    },
    {
      icon: ShieldCheckIcon,
      category: "Legal & Business Compliance",
      items: [
        "Freelancer agreement signed (contract or service agreement)",
        "Non-disclosure agreement (NDA) signed (if required)",
        "Tax compliance confirmed (freelancer provides invoices with tax info)",
        "Business registration certificate (if operating as a sole proprietor or company)",
        "Insurance coverage (if relevant, e.g., professional liability)"
      ]
    },
    {
      icon: CurrencyDollarIcon,
      category: "Payment & Financial Verification",
      items: [
        "Payment terms clearly defined in writing",
        "Bank or PayPal account matches freelancer's name",
        "No record of payment disputes or fraud reports",
        "Agreed payment schedule (e.g., milestones, hourly, per project)",
        "Invoice format compliant with your accounting/tax requirements"
      ]
    },
    {
      icon: ChatBubbleLeftRightIcon,
      category: "Communication & Reliability",
      items: [
        "Communication tested and professional (response time, clarity)",
        "Availability and time zone confirmed",
        "Agreed project management tools in place (e.g., Trello, Slack, Upwork, etc.)",
        "Agreed method for progress updates and deadlines",
        "Backup plan for unexpected absence or delays"
      ]
    },
    {
      icon: UserGroupIcon,
      category: "Reputation & Background Check",
      items: [
        "Checked freelancer's profiles on major platforms (Upwork, Fiverr, LinkedIn, etc.)",
        "Reviewed ratings, feedback, and dispute history",
        "No record of plagiarism or professional misconduct",
        "Social media or web presence consistent and professional"
      ]
    }
  ];

  const officeLocation = appointmentService.getOfficeLocation();

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className={`min-h-screen ${colorClasses.bg.orangeLight} dark:bg-gray-900 flex items-center justify-center`}>
          <div className={`animate-spin rounded-full h-16 w-16 border-[3px] ${colorClasses.border.orange} border-t-transparent`}></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className={`min-h-screen ${colorClasses.bg.orangeLight} dark:bg-gray-900 flex items-center justify-center`}>
          <div className={`text-center max-w-md p-8 ${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-xl border border-orange-200 dark:border-orange-900/50`}>
            <BriefcaseIcon className={`h-20 w-20 ${colorClasses.text.orange} dark:text-orange-400 mx-auto mb-6`} />
            <h2 className={`text-3xl font-bold ${colorClasses.text.darkNavy} dark:text-white mb-4`}>Freelancer Verification</h2>
            <p className={`${colorClasses.text.gray600} dark:text-gray-400 mb-6`}>Login to start your verification process and unlock premium opportunities</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all"
            >
              Login to Continue
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={`min-h-screen ${colorClasses.bg.orangeLight} dark:bg-gray-900 py-8 transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-md mr-4">
                    <BriefcaseIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-3xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>Freelancer Verification</h1>
                    <p className={`${colorClasses.text.gray600} dark:text-gray-400 mt-1`}>
                      Get verified to increase your credibility, attract better clients, and access premium projects
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <VerificationBadge
                  status={verificationStatus?.verificationStatus || 'none'}
                  size="lg"
                  showText={true}
                  showTooltip={true}
                  customMessage={verificationStatus?.verificationMessage}
                />

                <button
                  onClick={() => setShowAppointmentModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all flex items-center"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-orange-200 dark:border-orange-900/50 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.orangeLight} dark:bg-orange-900/30 mr-4`}>
                  <ClockIcon className={`h-7 w-7 ${colorClasses.text.orange} dark:text-orange-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>1-2</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Processing Days</div>
                </div>
              </div>
            </div>

            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-green-200 dark:border-green-900/50 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.greenLight} dark:bg-green-900/30 mr-4`}>
                  <StarIcon className={`h-7 w-7 ${colorClasses.text.green} dark:text-green-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>95%</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Success Rate</div>
                </div>
              </div>
            </div>

            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-blue-900/50 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.blueLight} dark:bg-blue-900/30 mr-4`}>
                  <ShieldCheckIcon className={`h-7 w-7 ${colorClasses.text.blue} dark:text-blue-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>24/7</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Support Available</div>
                </div>
              </div>
            </div>

            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-purple-200 dark:border-purple-900/50 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.purpleLight} dark:bg-purple-900/30 mr-4`}>
                  <CheckCircleIcon className={`h-7 w-7 ${colorClasses.text.purple} dark:text-purple-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>7</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Verification Areas</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Verification Status & Benefits */}
            <div className="lg:col-span-1 space-y-6">
              {/* Verification Progress */}
              {verificationStatus && (
                <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-orange-200 dark:border-orange-900/50`}>
                  <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} dark:text-white mb-4`}>Verification Progress</h3>
                  <VerificationProgress
                    details={verificationStatus.verificationDetails}
                    compact={false}
                  />
                </div>
              )}

              {/* Upcoming Appointments */}
              <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-orange-200 dark:border-orange-900/50`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} dark:text-white`}>Upcoming Appointments</h3>
                  <button
                    onClick={() => router.push('/user/appointments')}
                    className={`text-sm ${colorClasses.text.orange} hover:${colorClasses.text.orange} dark:text-orange-400 dark:hover:text-orange-300 font-medium hover:underline`}
                  >
                    View all
                  </button>
                </div>

                {isLoadingAppointments ? (
                  <div className="text-center py-8">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${colorClasses.border.orange} mx-auto`}></div>
                  </div>
                ) : upcomingAppointments.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment._id} className={`border ${colorClasses.border.gray200} dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-all dark:hover:bg-gray-700/50`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <CalendarIcon className={`h-4 w-4 ${colorClasses.text.gray400} dark:text-gray-500 mr-2`} />
                            <span className={`font-medium ${colorClasses.text.darkNavy} dark:text-white`}>
                              {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${appointment.status === 'confirmed' ? `${colorClasses.bg.greenLight} dark:bg-green-900/30 ${colorClasses.text.green} dark:text-green-400` :
                            appointment.status === 'pending' ? `${colorClasses.bg.amberLight} dark:bg-amber-900/30 ${colorClasses.text.amber} dark:text-amber-400` :
                              `${colorClasses.bg.gray100} dark:bg-gray-700 ${colorClasses.text.gray600} dark:text-gray-400`
                            }`}>
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                          </span>
                        </div>
                        <div className={`flex items-center text-sm ${colorClasses.text.gray600} dark:text-gray-400 mb-2`}>
                          <ClockIcon className={`h-4 w-4 mr-2 ${colorClasses.text.gray400} dark:text-gray-500`} />
                          {appointment.appointmentTime}
                        </div>
                        <div className={`flex items-center text-sm ${colorClasses.text.gray600} dark:text-gray-400 mb-3`}>
                          <MapPinIcon className={`h-4 w-4 mr-2 ${colorClasses.text.gray400} dark:text-gray-500`} />
                          {appointment.officeLocation}
                        </div>
                        <button
                          onClick={() => openCancelConfirmation(appointment._id)}
                          className={`w-full text-sm ${colorClasses.text.red} hover:${colorClasses.text.red} dark:text-red-400 dark:hover:text-red-300 font-medium hover:underline pt-2 border-t ${colorClasses.border.gray100} dark:border-gray-700`}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className={`h-12 w-12 ${colorClasses.text.gray300} dark:text-gray-600 mx-auto mb-3`} />
                    <p className={`${colorClasses.text.gray400} dark:text-gray-400 mb-2`}>No upcoming appointments</p>
                    <p className={`text-sm ${colorClasses.text.gray400} dark:text-gray-500 mb-4`}>Schedule your verification appointment</p>
                    <button
                      onClick={() => setShowAppointmentModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all"
                    >
                      Schedule Now
                    </button>
                  </div>
                )}
              </div>

              {/* Office Location */}
              <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border ${colorClasses.border.gray200} dark:border-gray-700`}>
                <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} dark:text-white mb-4`}>Verification Office</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPinIcon className={`h-5 w-5 ${colorClasses.text.gray400} dark:text-gray-400 mt-0.5 mr-3`} />
                    <div>
                      <p className={`${colorClasses.text.darkNavy} dark:text-white font-medium`}>{officeLocation.address}</p>
                      <a
                        href={officeLocation.googleMapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${colorClasses.text.orange} hover:${colorClasses.text.orange} dark:text-orange-400 dark:hover:text-orange-300 text-sm font-medium hover:underline`}
                      >
                        Open in Google Maps →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <ClockIcon className={`h-5 w-5 ${colorClasses.text.gray400} dark:text-gray-400 mr-3`} />
                    <div>
                      <p className={`${colorClasses.text.darkNavy} dark:text-white font-medium`}>{officeLocation.workingHours}</p>
                      <p className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Appointment: 30-45 minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <ChatBubbleLeftRightIcon className={`h-5 w-5 ${colorClasses.text.gray400} dark:text-gray-400 mr-3`} />
                    <div>
                      <p className={`${colorClasses.text.darkNavy} dark:text-white`}>{officeLocation.contactPhone}</p>
                      <p className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>{officeLocation.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.open(officeLocation.googleMapsLink, '_blank')}
                    className={`w-full mt-4 px-4 py-3 ${colorClasses.bg.orangeLight} dark:bg-orange-900/30 ${colorClasses.text.orange} dark:text-orange-400 rounded-xl hover:from-orange-100 hover:to-amber-100 dark:hover:bg-orange-900/50 font-medium flex items-center justify-center shadow-sm hover:shadow transition-all`}
                  >
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Get Directions
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Requirements & Checklist */}
            <div className="lg:col-span-2">
              {/* Document Requirements */}
              <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border border-orange-200 dark:border-orange-900/50`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <div>
                    <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>Required Documents</h3>
                    <p className={`${colorClasses.text.gray600} dark:text-gray-400 mt-1`}>
                      Bring these documents to your verification appointment
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.print()}
                      className={`px-4 py-2 border ${colorClasses.border.orange} ${colorClasses.text.orange} dark:text-orange-400 dark:border-orange-800 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 flex items-center transition-colors`}
                    >
                      <PrinterIcon className="h-4 w-4 mr-2" />
                      Print Checklist
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documentRequirements.map((doc, index) => (
                    <div
                      key={doc.id}
                      className={`border rounded-xl p-4 transition-all hover:shadow-md ${doc.required
                        ? `${colorClasses.border.red} dark:border-red-800 ${colorClasses.bg.redLight} dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30`
                        : `${colorClasses.border.blue} dark:border-blue-800 ${colorClasses.bg.blueLight} dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30`
                        }`}
                    >
                      <div className="flex items-start">
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${doc.required
                          ? `${colorClasses.bg.redLight} dark:bg-red-900/30 ${colorClasses.text.red} dark:text-red-400`
                          : `${colorClasses.bg.blueLight} dark:bg-blue-900/30 ${colorClasses.text.blue} dark:text-blue-400`
                          }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className={`font-medium ${colorClasses.text.darkNavy} dark:text-white`}>{doc.title}</h4>
                            {doc.required ? (
                              <span className={`px-2 py-0.5 text-xs ${colorClasses.bg.redLight} dark:bg-red-900/30 ${colorClasses.text.red} dark:text-red-400 rounded-full`}>
                                Required
                              </span>
                            ) : (
                              <span className={`px-2 py-0.5 text-xs ${colorClasses.bg.blueLight} dark:bg-blue-900/30 ${colorClasses.text.blue} dark:text-blue-400 rounded-full`}>
                                Optional
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400 mb-2`}>{doc.description}</p>
                          {doc.example && (
                            <div className={`text-xs ${colorClasses.text.gray400} dark:text-gray-500 mb-1 p-2 bg-white/50 dark:bg-gray-700/50 rounded border ${colorClasses.border.gray200} dark:border-gray-700`}>
                              <strong className={`${colorClasses.text.gray700} dark:text-gray-300`}>Example:</strong> {doc.example}
                            </div>
                          )}
                          {doc.notes && (
                            <div className={`text-xs ${colorClasses.text.amber} dark:text-amber-400 ${colorClasses.bg.amberLight} dark:bg-amber-900/30 p-2 rounded border ${colorClasses.border.amber} dark:border-amber-800`}>
                              <strong>Note:</strong> {doc.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instructions Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 ${colorClasses.bg.blueLight} dark:bg-blue-900/20 rounded-xl border ${colorClasses.border.blue} dark:border-blue-800`}>
                    <h4 className={`font-medium ${colorClasses.text.blue600} dark:text-blue-400 mb-2`}>📋 Important Instructions</h4>
                    <ul className={`text-sm ${colorClasses.text.blue600} dark:text-blue-300 space-y-1`}>
                      <li>• Bring <strong>original documents</strong> or certified copies</li>
                      <li>• All documents must be current and valid</li>
                      <li>• Arrive 15 minutes before appointment</li>
                      <li>• Processing: 1-2 business days</li>
                      <li>• Digital portfolio recommended</li>
                    </ul>
                  </div>

                  <div className={`p-4 ${colorClasses.bg.greenLight} dark:bg-green-900/20 rounded-xl border ${colorClasses.border.green} dark:border-green-800`}>
                    <h4 className={`font-medium ${colorClasses.text.green} dark:text-green-400 mb-2`}>✅ What We Verify</h4>
                    <ul className={`text-sm ${colorClasses.text.green} dark:text-green-300 space-y-1`}>
                      <li>• Identity & background</li>
                      <li>• Professional credentials</li>
                      <li>• Work portfolio</li>
                      <li>• Legal compliance</li>
                      <li>• Communication skills</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Complete Verification Checklist */}
              <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-orange-200 dark:border-orange-900/50`}>
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className={`p-2 ${colorClasses.bg.orangeLight} dark:bg-orange-900/30 rounded-lg mr-3`}>
                      <DocumentCheckIcon className={`h-7 w-7 ${colorClasses.text.orange} dark:text-orange-400`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>Freelancer Verification Checklist</h3>
                      <p className={`${colorClasses.text.gray600} dark:text-gray-400`}>Complete all 7 verification areas for full certification</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {checklistItems.map((section, index) => (
                    <div key={index} className={`border ${colorClasses.border.gray200} dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all`}>
                      <div className={`${colorClasses.bg.orangeLight} dark:bg-gray-700/50 p-4 border-b ${colorClasses.border.gray200} dark:border-gray-700`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-2 ${colorClasses.bg.white} dark:bg-gray-800 rounded-lg shadow-sm mr-4`}>
                              <section.icon className={`h-5 w-5 ${colorClasses.text.orange} dark:text-orange-400`} />
                            </div>
                            <div>
                              <h4 className={`text-lg font-semibold ${colorClasses.text.darkNavy} dark:text-white`}>{section.category}</h4>
                              <p className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>
                                {section.items.length} verification points
                              </p>
                            </div>
                          </div>
                          {verificationStatus?.verificationStatus === 'full' && (
                            <div className={`flex items-center ${colorClasses.bg.greenLight} dark:bg-green-900/30 ${colorClasses.text.green} dark:text-green-400 px-3 py-1.5 rounded-full text-sm shadow-sm`}>
                              <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                              Verified
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-6 dark:bg-gray-800">
                        <ul className="space-y-3">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex} className={`flex items-start p-2 hover:${colorClasses.bg.gray100} dark:hover:bg-gray-700 rounded-lg transition-colors`}>
                              <input
                                type="checkbox"
                                className={`mt-1 mr-3 h-4 w-4 ${colorClasses.text.orange} rounded focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600`}
                                disabled={verificationStatus?.verificationStatus !== 'full'}
                                checked={verificationStatus?.verificationStatus === 'full'}
                                onChange={() => { }}
                              />
                              <span className={`${colorClasses.text.gray700} dark:text-gray-300 flex-1`}>{item}</span>
                              {verificationStatus?.verificationStatus === 'full' && (
                                <CheckCircleIcon className={`h-5 w-5 ${colorClasses.text.green} dark:text-green-400 ml-2 shrink-0`} />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Section */}
                <div className="mt-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-8 text-white shadow-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <h4 className="text-2xl font-bold mb-3">Ready to Get Verified?</h4>
                      <p className="text-orange-100 text-lg">
                        Join thousands of trusted freelancers and unlock premium opportunities
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowAppointmentModal(true)}
                        className="px-8 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                      >
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        Schedule Appointment
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </button>
                      <button
                        onClick={() => window.open(officeLocation.googleMapsLink, '_blank')}
                        className="px-6 py-3 bg-orange-700 text-white rounded-xl font-semibold hover:bg-orange-800 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                      >
                        <MapPinIcon className="h-5 w-5 mr-2" />
                        Get Directions
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Modal */}
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          onSubmit={handleAppointmentSubmit}
          verificationType="freelancer"
          user={user}
        />

        {/* Cancel Confirmation Modal */}
        <ConfirmationModal
          isOpen={showCancelModal}
          onClose={() => {
            setShowCancelModal(false);
            setSelectedAppointmentId(null);
          }}
          onConfirm={handleCancelAppointment}
          title="Cancel Appointment"
          message="Are you sure you want to cancel this appointment? This action cannot be undone."
          confirmText="Cancel Appointment"
          cancelText="Keep Appointment"
          variant="warning"
          isLoading={cancellingAppointment}
        />
      </div>
    </DashboardLayout>
  );
};

export default FreelancerVerification;