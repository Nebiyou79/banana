// pages/verification/organization.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  BuildingLibraryIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  PrinterIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  UsersIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ScaleIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  IdentificationIcon,
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

const OrganizationVerification = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false);
  const [cancellingAppointment, setCancellingAppointment] = useState(false);

  // Get safe user ID
  const userId = getSafeUserId(user);

  // Check authentication and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/verification/organization');
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
      icon: IdentificationIcon,
      category: "Basic Identification",
      items: [
        "Legal name of the organization matches official records",
        "Business registration or incorporation certificate obtained",
        "Business registration number verified with relevant authority",
        "Physical business address confirmed (not just a P.O. box)",
        "Contact details (phone, email, website) verified and active"
      ]
    },
    {
      icon: ScaleIcon,
      category: "Legal Status & Structure",
      items: [
        "Type of organization verified (e.g., LLC, Corporation, NGO, Partnership)",
        "Articles of incorporation / constitution / bylaws reviewed",
        "Ownership structure and shareholders identified",
        "Board of directors or key officers listed and verified",
        "No conflicts of interest or disqualified persons involved"
      ]
    },
    {
      icon: ShieldCheckIcon,
      category: "Licenses & Permits",
      items: [
        "All required local, state, and federal business licenses obtained",
        "Industry-specific permits valid and up to date",
        "Proof of tax registration (e.g., VAT, EIN, PAN, etc.)",
        "Export/import licenses (if applicable)",
        "Environmental, safety, or professional certifications (if applicable)"
      ]
    },
    {
      icon: ClipboardDocumentCheckIcon,
      category: "Compliance & Legal Standing",
      items: [
        "The organization is in good standing with corporate registry",
        "No record of current or past legal disputes, sanctions, or suspensions",
        "Compliance with labor laws and employment regulations",
        "Data protection and privacy compliance (e.g., GDPR, CCPA)",
        "Anti-money laundering (AML) and anti-corruption compliance policies in place"
      ]
    },
    {
      icon: BanknotesIcon,
      category: "Financial Verification",
      items: [
        "Tax filings up to date and available for review",
        "Recent financial statements audited or certified",
        "Banking details verified (registered under company name)",
        "No record of insolvency or bankruptcy"
      ]
    },
    {
      icon: UserGroupIcon,
      category: "Reputation & Background",
      items: [
        "Company website and online presence verified",
        "Reviews, testimonials, or public records checked",
        "No negative media or regulatory reports",
        "References from clients, partners, or suppliers verified"
      ]
    },
    {
      icon: DocumentTextIcon,
      category: "Contracts & Legal Documents",
      items: [
        "Standard contracts reviewed for legal soundness",
        "Non-disclosure and confidentiality agreements in place",
        "Intellectual property (trademarks, patents, copyrights) verified",
        "Insurance coverage valid and adequate"
      ]
    },
    {
      icon: GlobeAltIcon,
      category: "International (if applicable)",
      items: [
        "Registration verified in each jurisdiction of operation",
        "Compliance with international trade laws and sanctions lists",
        "Foreign ownership disclosure verified"
      ]
    }
  ];

  const officeLocation = appointmentService.getOfficeLocation();

  // Show loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className={`min-h-screen ${colorClasses.bg.indigoLight} dark:bg-gray-900 flex items-center justify-center`}>
          <div className={`animate-spin rounded-full h-16 w-16 border-[3px] ${colorClasses.border.indigo} border-t-transparent`}></div>
        </div>
      </DashboardLayout>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <div className={`min-h-screen ${colorClasses.bg.indigoLight} dark:bg-gray-900 flex items-center justify-center`}>
          <div className={`text-center max-w-md p-8 ${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-xl border ${colorClasses.border.indigo} dark:border-gray-700`}>
            <BuildingLibraryIcon className={`h-20 w-20 ${colorClasses.text.indigo} dark:text-indigo-400 mx-auto mb-6`} />
            <h2 className={`text-3xl font-bold ${colorClasses.text.darkNavy} dark:text-white mb-4`}>Organization Verification</h2>
            <p className={`${colorClasses.text.gray600} dark:text-gray-400 mb-6`}>Login to start your organization verification process</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
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
      <div className={`min-h-screen ${colorClasses.bg.indigoLight} dark:bg-gray-900 py-8 transition-colors duration-200`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center mb-3">
                  <div className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-md mr-4">
                    <BuildingLibraryIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-3xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>Organization Verification</h1>
                    <p className={`${colorClasses.text.gray600} dark:text-gray-400 mt-1`}>
                      Complete your organization verification to build trust and access exclusive opportunities
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
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all flex items-center"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Schedule Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border ${colorClasses.border.indigo} dark:border-gray-700 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.indigoLight} dark:bg-indigo-900/30 mr-4`}>
                  <CheckBadgeIcon className={`h-7 w-7 ${colorClasses.text.indigo} dark:text-indigo-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>8</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Verification Areas</div>
                </div>
              </div>
            </div>

            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-amber-200 dark:border-amber-900/50 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.amberLight} dark:bg-amber-900/30 mr-4`}>
                  <ClockIcon className={`h-7 w-7 ${colorClasses.text.amber} dark:text-amber-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>60-90</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Minutes</div>
                </div>
              </div>
            </div>

            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-green-200 dark:border-green-900/50 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.greenLight} dark:bg-green-900/30 mr-4`}>
                  <CalendarIcon className={`h-7 w-7 ${colorClasses.text.green} dark:text-green-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>5-7</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Processing Days</div>
                </div>
              </div>
            </div>

            <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-blue-200 dark:border-blue-900/50 hover:shadow-xl transition-all`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-full ${colorClasses.bg.blueLight} dark:bg-blue-900/30 mr-4`}>
                  <ShieldCheckIcon className={`h-7 w-7 ${colorClasses.text.blue} dark:text-blue-400`} />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>100%</div>
                  <div className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Compliance Required</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Status & Documents */}
            <div className="lg:col-span-1 space-y-6">
              {/* Verification Status */}
              {verificationStatus && (
                <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border ${colorClasses.border.indigo} dark:border-gray-700`}>
                  <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} dark:text-white mb-4`}>Verification Status</h3>
                  <VerificationProgress
                    details={verificationStatus.verificationDetails}
                    compact={true}
                  />
                </div>
              )}

              {/* Upcoming Appointments */}
              <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border ${colorClasses.border.indigo} dark:border-gray-700`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} dark:text-white`}>Upcoming Appointments</h3>
                  <button
                    onClick={() => router.push('/user/appointments')}
                    className={`text-sm ${colorClasses.text.indigo} hover:${colorClasses.text.indigo} dark:text-indigo-400 dark:hover:text-indigo-300 font-medium hover:underline`}
                  >
                    View all
                  </button>
                </div>

                {isLoadingAppointments ? (
                  <div className="text-center py-8">
                    <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${colorClasses.border.indigo} mx-auto`}></div>
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
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                      Schedule Now
                    </button>
                  </div>
                )}
              </div>

              {/* Office Information */}
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
                        className={`${colorClasses.text.indigo} hover:${colorClasses.text.indigo} dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium hover:underline`}
                      >
                        Open in Google Maps →
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <ClockIcon className={`h-5 w-5 ${colorClasses.text.gray400} dark:text-gray-400 mr-3`} />
                    <div>
                      <p className={`${colorClasses.text.darkNavy} dark:text-white font-medium`}>{officeLocation.workingHours}</p>
                      <p className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>Appointment: 60-90 minutes</p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <UsersIcon className={`h-5 w-5 ${colorClasses.text.gray400} dark:text-gray-400 mr-3`} />
                    <div>
                      <p className={`${colorClasses.text.darkNavy} dark:text-white`}>{officeLocation.contactPhone}</p>
                      <p className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400`}>{officeLocation.email}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => window.open(officeLocation.googleMapsLink, '_blank')}
                    className={`w-full mt-4 px-4 py-3 ${colorClasses.bg.indigoLight} dark:bg-indigo-900/30 ${colorClasses.text.indigo} dark:text-indigo-400 rounded-xl hover:from-indigo-100 hover:to-purple-100 dark:hover:bg-indigo-900/50 font-medium flex items-center justify-center shadow-sm hover:shadow transition-all`}
                  >
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    Get Directions
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Checklist & Requirements */}
            <div className="lg:col-span-2">
              {/* Document Requirements */}
              <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 border ${colorClasses.border.indigo} dark:border-gray-700`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                  <div>
                    <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>Required Organization Documents</h3>
                    <p className={`${colorClasses.text.gray600} dark:text-gray-400 mt-1`}>
                      Original documents or certified copies required for verification
                    </p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className={`px-4 py-2 border ${colorClasses.border.indigo} ${colorClasses.text.indigo} dark:text-indigo-400 dark:border-indigo-800 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center transition-colors`}
                  >
                    <PrinterIcon className="h-4 w-4 mr-2" />
                    Print Checklist
                  </button>
                </div>

                {/* Instructions Grid */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 ${colorClasses.bg.blueLight} dark:bg-blue-900/20 rounded-xl border ${colorClasses.border.blue} dark:border-blue-800`}>
                    <h4 className={`font-medium ${colorClasses.text.blue600} dark:text-blue-400 mb-2`}>📋 Important Instructions</h4>
                    <ul className={`text-sm ${colorClasses.text.blue600} dark:text-blue-300 space-y-1`}>
                      <li>• All documents must be <strong>original or certified copies</strong></li>
                      <li>• Foreign language documents need <strong>certified translations</strong></li>
                      <li>• <strong>Authorized representatives</strong> must bring identification</li>
                      <li>• Arrive <strong>15 minutes before</strong> appointment</li>
                      <li>• Processing: <strong>5-7 business days</strong></li>
                    </ul>
                  </div>

                  <div className={`p-4 ${colorClasses.bg.greenLight} dark:bg-green-900/20 rounded-xl border ${colorClasses.border.green} dark:border-green-800`}>
                    <h4 className={`font-medium ${colorClasses.text.green} dark:text-green-400 mb-2`}>✅ What We Verify</h4>
                    <ul className={`text-sm ${colorClasses.text.green} dark:text-green-300 space-y-1`}>
                      <li>• Legal standing & compliance</li>
                      <li>• Financial credibility</li>
                      <li>• Ownership structure</li>
                      <li>• Regulatory compliance</li>
                      <li>• International operations</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Complete Verification Checklist */}
              <div className={`${colorClasses.bg.white} dark:bg-gray-800 rounded-2xl shadow-lg p-6 border ${colorClasses.border.indigo} dark:border-gray-700`}>
                <div className="mb-6">
                  <div className="flex items-center mb-3">
                    <div className={`p-2 ${colorClasses.bg.indigoLight} dark:bg-indigo-900/30 rounded-lg mr-3`}>
                      <BuildingLibraryIcon className={`h-7 w-7 ${colorClasses.text.indigo} dark:text-indigo-400`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${colorClasses.text.darkNavy} dark:text-white`}>Organization Verification Checklist</h3>
                      <p className={`${colorClasses.text.gray600} dark:text-gray-400`}>
                        8 comprehensive categories covering all aspects of organizational verification
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {checklistItems.map((section, index) => (
                    <div key={index} className={`border ${colorClasses.border.gray200} dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all`}>
                      <div className={`${colorClasses.bg.indigoLight} dark:bg-gray-700/50 p-4 border-b ${colorClasses.border.gray200} dark:border-gray-700`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`p-2 ${colorClasses.bg.white} dark:bg-gray-800 rounded-lg shadow-sm mr-4`}>
                              <section.icon className={`h-5 w-5 ${colorClasses.text.indigo} dark:text-indigo-400`} />
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
                              <CheckBadgeIcon className="h-4 w-4 mr-1.5" />
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
                                className={`mt-1 mr-3 h-4 w-4 ${colorClasses.text.indigo} rounded focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600`}
                                disabled={verificationStatus?.verificationStatus !== 'full'}
                                checked={verificationStatus?.verificationStatus === 'full'}
                                onChange={() => { }}
                              />
                              <span className={`${colorClasses.text.gray700} dark:text-gray-300 flex-1`}>{item}</span>
                              {verificationStatus?.verificationStatus === 'full' && (
                                <CheckBadgeIcon className={`h-5 w-5 ${colorClasses.text.green} dark:text-green-400 ml-2 shrink-0`} />
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Section */}
                <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white shadow-xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <h4 className="text-2xl font-bold mb-3">Ready to Verify Your Organization?</h4>
                      <p className="text-indigo-100 text-lg">
                        Schedule your verification appointment and join trusted organizations on our platform.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setShowAppointmentModal(true)}
                        className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
                      >
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        Schedule Appointment
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </button>
                      <button
                        onClick={() => window.open(officeLocation.googleMapsLink, '_blank')}
                        className="px-6 py-3 bg-indigo-700 text-white rounded-xl font-semibold hover:bg-indigo-800 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
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
          verificationType="organization"
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

export default OrganizationVerification;