// components/admin/UserDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import {
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Building,
    Calendar,
    FileText,
    Shield,
    CheckCircle,
    XCircle,
    AlertCircle,
    Clock,
    Save,
    Loader2,
    File,
    CheckSquare,
    ExternalLink,
    ChevronRight,
    Briefcase,
    Globe,
    Tag
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import VerificationBadge from '@/components/verifcation/VerificationBadge';
import AppointmentService from '@/services/apointmentService';

interface UserDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onUpdateVerification: (userId: string, status: 'none' | 'partial' | 'full') => Promise<void>;
    onUpdateUserStatus: (userId: string, status: 'active' | 'inactive' | 'suspended') => Promise<void>;
}

// Helper function to safely render values
const safeRender = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (typeof value === 'object') {
        // Handle nested objects - return a string representation
        if (value.name || value.title || value._id) {
            return value.name || value.title || value._id || 'Object';
        }
        return JSON.stringify(value).substring(0, 100) + '...';
    }
    return 'N/A';
};

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
    isOpen,
    onClose,
    user,
    onUpdateVerification,
    onUpdateUserStatus
}) => {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [verificationNotes, setVerificationNotes] = useState('');
    const [activeTab, setActiveTab] = useState<'details' | 'appointments'>('details');
    const [appointmentStats, setAppointmentStats] = useState({
        total: 0,
        upcoming: 0,
        completed: 0,
        cancelled: 0,
        pending: 0
    });

    // Safely extract user data with defaults
    const safeUser = user || {};
    const safeVerificationDetails = safeUser.verificationDetails || {};
    const safeAppointments = Array.isArray(safeUser.appointments) ? safeUser.appointments : [];

    useEffect(() => {
        if (safeUser) {
            console.log('User data in modal:', safeUser);
            setVerificationNotes(safeVerificationDetails.verificationNotes || '');
            calculateAppointmentStats(safeAppointments);
        }
    }, [safeUser, safeVerificationDetails, safeAppointments]);

    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
            document.body.classList.remove('modal-open');
        };
    }, [isOpen, onClose]);

    const calculateAppointmentStats = (appointments: any[]) => {
        console.log('Calculating stats for appointments:', appointments);

        const stats = {
            total: appointments.length,
            upcoming: appointments.filter(app => {
                try {
                    if (!app || app.status !== 'confirmed') return false;
                    const appDate = new Date(app.appointmentDate);
                    return appDate > new Date();
                } catch {
                    return false;
                }
            }).length,
            completed: appointments.filter(app => app && app.status === 'completed').length,
            cancelled: appointments.filter(app => app && app.status === 'cancelled').length,
            pending: appointments.filter(app => app && app.status === 'pending').length
        };

        console.log('Calculated stats:', stats);
        setAppointmentStats(stats);
    };

    if (!isOpen || !user) {
        return null;
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return safeRender(dateString);
        }
    };

    const formatSimpleDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return safeRender(dateString);
        }
    };

    const formatTime = (timeString: string) => {
        if (!timeString) return 'N/A';
        return timeString;
    };

    const getAppointmentStatusColor = (status: string) => {
        if (!status) return { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-800 dark:text-gray-300', icon: '?' };

        switch (status.toLowerCase()) {
            case 'completed':
                return { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-300', icon: '✓' };
            case 'confirmed':
                return { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-300', icon: '✓' };
            case 'pending':
                return { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-300', icon: '⏳' };
            case 'cancelled':
                return { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-300', icon: '✗' };
            default:
                return { bg: 'bg-gray-100 dark:bg-gray-900', text: 'text-gray-800 dark:text-gray-300', icon: '?' };
        }
    };

    const getVerificationTypeColor = (type: string) => {
        if (!type) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';

        switch (type.toLowerCase()) {
            case 'candidate':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
            case 'freelancer':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            case 'company':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'organization':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const handleSaveNotes = async () => {
        try {
            setIsUpdating(true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
                title: 'Success',
                description: 'Verification notes updated successfully',
                variant: 'default'
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update notes',
                variant: 'destructive'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleVerificationUpdate = async (status: 'none' | 'partial' | 'full') => {
        try {
            setIsUpdating(true);
            await onUpdateVerification(safeUser._id, status);
            toast({
                title: 'Success',
                description: `User verification status updated to ${status}`,
                variant: 'default'
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update verification status',
                variant: 'destructive'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStatusUpdate = async (status: 'active' | 'inactive' | 'suspended') => {
        try {
            setIsUpdating(true);
            await onUpdateUserStatus(safeUser._id, status);
            toast({
                title: 'Success',
                description: `User status updated to ${status}`,
                variant: 'default'
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to update user status',
                variant: 'destructive'
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const getVerificationProgress = () => {
        const details = safeVerificationDetails || {};
        const checks = [
            details.profileVerified,
            details.socialVerified,
            details.documentsVerified,
            details.emailVerified,
            details.phoneVerified
        ].filter(check => check !== undefined);

        if (checks.length === 0) return 0;
        const completed = checks.filter(Boolean).length;
        return Math.round((completed / checks.length) * 100);
    };

    const getStatusColor = (status: string) => {
        if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';

        switch (status.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
            case 'suspended': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getDocumentRequirementName = (docId: string) => {
        const docMap: Record<string, string> = {
            'id_card': 'ID Card',
            'academic_certificates': 'Academic Certificates',
            'cv_resume': 'CV/Resume',
            'professional_certificates': 'Professional Certificates',
            'passport_photos': 'Passport Photos',
            'portfolio': 'Portfolio',
            'tax_registration': 'Tax Registration',
            'business_license': 'Business License',
            'client_references': 'Client References',
            'certificate_of_incorporation': 'Certificate of Incorporation',
            'tin_certificate': 'TIN Certificate',
            'director_ids': 'Director IDs',
            'company_profile': 'Company Profile',
            'bank_reference': 'Bank Reference',
            'registration_certificate': 'Registration Certificate',
            'constitution_bylaws': 'Constitution/By-laws',
            'board_resolution': 'Board Resolution',
            'annual_report': 'Annual Report'
        };
        return docMap[docId] || docId;
    };

    const getOfficeLocation = () => {
        return AppointmentService.getOfficeLocation();
    };

    // Safely extract company/organization info
    const getCompanyInfo = () => {
        if (!safeUser.company) return null;

        if (typeof safeUser.company === 'object') {
            return {
                name: safeRender(safeUser.company.name || safeUser.company.title),
                industry: safeRender(safeUser.company.industry),
                id: safeUser.company._id || safeUser.company.id
            };
        }

        return {
            name: safeRender(safeUser.company),
            industry: 'N/A',
            id: 'N/A'
        };
    };

    const companyInfo = getCompanyInfo();

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Background overlay */}
            <div
                className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
                onClick={onClose}
            />

            {/* Modal panel */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                                <User className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <div className="flex items-center space-x-3 mb-2">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {safeRender(safeUser.name)}
                                    </h2>
                                    <VerificationBadge
                                        status={safeUser.verificationStatus || 'none'}
                                        size="md"
                                        showText
                                    />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                        <Mail className="w-4 h-4 mr-2" />
                                        {safeRender(safeUser.email)}
                                    </span>
                                    {safeUser.phone && (
                                        <span className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                            <Phone className="w-4 h-4 mr-2" />
                                            {safeRender(safeUser.phone)}
                                        </span>
                                    )}
                                    {safeUser.location && (
                                        <span className="flex items-center text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            {safeRender(safeUser.location)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="sticky top-[86px] z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`flex-1 py-4 text-center font-medium text-sm ${activeTab === 'details'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                } transition-colors`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <User className="w-4 h-4" />
                                User Details
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`flex-1 py-4 text-center font-medium text-sm ${activeTab === 'appointments'
                                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                } transition-colors`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Appointments ({safeAppointments.length || 0})
                            </div>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto h-[calc(90vh-180px)]">
                    {activeTab === 'details' ? (
                        <div className="p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Basic Information Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
                                            <User className="w-5 h-5 mr-3 text-blue-500" />
                                            Basic Information
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Role</p>
                                                    <div className="flex items-center">
                                                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${safeUser.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' :
                                                            safeUser.role === 'company' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                                safeUser.role === 'organization' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                    'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                            }`}>
                                                            {safeRender(safeUser.role)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Account Status</p>
                                                    <div className="flex items-center">
                                                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${getStatusColor(safeUser.status)}`}>
                                                            {safeRender(safeUser.status)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Profile Completion</p>
                                                    <div className="flex items-center">
                                                        {safeUser.profileCompleted ? (
                                                            <>
                                                                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                                                                <span className="text-green-600 dark:text-green-400 font-medium">Completed</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                                                                <span className="text-yellow-600 dark:text-yellow-400 font-medium">Incomplete</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                                                    <p className="text-gray-900 dark:text-white font-medium">
                                                        {formatSimpleDate(safeUser.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                            {safeUser.location && (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                        <MapPin className="w-4 h-4 mr-2" />
                                                        Location
                                                    </p>
                                                    <p className="text-gray-900 dark:text-white font-medium pl-6">
                                                        {safeRender(safeUser.location)}
                                                    </p>
                                                </div>
                                            )}
                                            {companyInfo && (
                                                <div className="space-y-1">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                        <Building className="w-4 h-4 mr-2" />
                                                        {safeUser.role === 'company' ? 'Company' : 'Organization'}
                                                    </p>
                                                    <div className="pl-6">
                                                        <p className="text-gray-900 dark:text-white font-medium">{companyInfo.name}</p>
                                                        {companyInfo.industry && companyInfo.industry !== 'N/A' && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                                                                <Briefcase className="w-3 h-3 mr-2" />
                                                                Industry: {companyInfo.industry}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Verification Progress Card */}
                                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700 shadow-sm">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
                                            <Shield className="w-5 h-5 mr-3 text-blue-500" />
                                            Verification Progress
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Verification Score
                                                    </span>
                                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                        {getVerificationProgress()}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                                                        style={{ width: `${getVerificationProgress()}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 dark:text-gray-300">Profile Verified</span>
                                                    {safeVerificationDetails.profileVerified ? (
                                                        <div className="flex items-center text-green-600">
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600">
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Not Verified</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 dark:text-gray-300">Social Verified</span>
                                                    {safeVerificationDetails.socialVerified ? (
                                                        <div className="flex items-center text-green-600">
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600">
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Not Verified</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 dark:text-gray-300">Documents Verified</span>
                                                    {safeVerificationDetails.documentsVerified ? (
                                                        <div className="flex items-center text-green-600">
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600">
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Not Verified</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 dark:text-gray-300">Email Verified</span>
                                                    {safeVerificationDetails.emailVerified ? (
                                                        <div className="flex items-center text-green-600">
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600">
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Not Verified</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-700 dark:text-gray-300">Phone Verified</span>
                                                    {safeVerificationDetails.phoneVerified ? (
                                                        <div className="flex items-center text-green-600">
                                                            <CheckCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Verified</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center text-red-600">
                                                            <XCircle className="w-5 h-5 mr-2" />
                                                            <span className="text-sm font-medium">Not Verified</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-6">
                                    {/* Quick Actions Card */}
                                    <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6 border border-green-200 dark:border-green-700 shadow-sm">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                                            Quick Actions
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Update Verification Status</p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => handleVerificationUpdate('full')}
                                                        disabled={isUpdating}
                                                        className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors shadow-md"
                                                    >
                                                        {isUpdating ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-5 h-5 mr-2" />
                                                                Mark Fully Verified
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerificationUpdate('partial')}
                                                        disabled={isUpdating}
                                                        className="flex items-center justify-center px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors shadow-md"
                                                    >
                                                        {isUpdating ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="w-5 h-5 mr-2" />
                                                                Mark Partially Verified
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Update Account Status</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate('active')}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm transition-colors shadow-sm"
                                                    >
                                                        Activate
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate('inactive')}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 text-sm transition-colors shadow-sm"
                                                    >
                                                        Deactivate
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate('suspended')}
                                                        disabled={isUpdating}
                                                        className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm transition-colors shadow-sm"
                                                    >
                                                        Suspend
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Verification Notes Card */}
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center">
                                            <FileText className="w-5 h-5 mr-3 text-blue-500" />
                                            Verification Notes
                                        </h3>
                                        <textarea
                                            value={verificationNotes}
                                            onChange={(e) => setVerificationNotes(e.target.value)}
                                            placeholder="Add verification notes here..."
                                            rows={4}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                                        />
                                        <div className="flex justify-end mt-4">
                                            <button
                                                onClick={handleSaveNotes}
                                                disabled={isUpdating}
                                                className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                                            >
                                                {isUpdating ? (
                                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                ) : (
                                                    <Save className="w-4 h-4 mr-2" />
                                                )}
                                                Save Notes
                                            </button>
                                        </div>
                                    </div>

                                    {/* Last Verification Card */}
                                    {safeVerificationDetails.lastVerified && (
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700 shadow-sm">
                                            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4">
                                                Last Verification Details
                                            </h3>
                                            <div className="space-y-3">
                                                {safeVerificationDetails.lastVerified && (
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Verification Date</p>
                                                        <p className="text-gray-900 dark:text-white font-medium">
                                                            {formatDate(safeVerificationDetails.lastVerified)}
                                                        </p>
                                                    </div>
                                                )}
                                                {safeVerificationDetails.verifiedBy && (
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">Verified By</p>
                                                        <p className="text-gray-900 dark:text-white font-medium">
                                                            {safeRender(safeVerificationDetails.verifiedBy)}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Appointments Tab */
                        <div className="p-6">
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                {/* Appointments Header */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center">
                                            <Calendar className="w-5 h-5 mr-3 text-blue-500" />
                                            Appointments ({safeAppointments.length || 0})
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            Manage and view all appointment details
                                        </p>
                                    </div>
                                    {safeAppointments.length > 0 && (
                                        <div className="mt-4 sm:mt-0">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center text-sm">
                                                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                                                    <span className="text-gray-600 dark:text-gray-400">Completed: {appointmentStats.completed}</span>
                                                </div>
                                                <div className="flex items-center text-sm">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                                    <span className="text-gray-600 dark:text-gray-400">Upcoming: {appointmentStats.upcoming}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {safeAppointments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No appointments found</p>
                                        <p className="text-gray-400 dark:text-gray-500 mt-2">This user hasn't scheduled any appointments yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {safeAppointments.map((appointment: any, index: number) => {
                                            const statusInfo = getAppointmentStatusColor(appointment?.status);
                                            const isUpcoming = appointment?.status === 'confirmed' &&
                                                appointment?.appointmentDate &&
                                                new Date(appointment.appointmentDate) > new Date();
                                            const isCompleted = appointment?.status === 'completed';

                                            return (
                                                <div key={appointment?._id || index} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="p-5">
                                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                                            {/* Appointment Info */}
                                                            <div className="flex-1">
                                                                <div className="flex items-start justify-between mb-3">
                                                                    <div>
                                                                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                                            {appointment?.verificationType ?
                                                                                `${safeRender(appointment.verificationType).charAt(0).toUpperCase() + safeRender(appointment.verificationType).slice(1)} Verification` :
                                                                                'General Appointment'}
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                            Appointment ID: {safeRender(appointment?._id || `APP-${index + 1}`)}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                                                                        {safeRender(appointment?.status).toUpperCase()}
                                                                    </span>
                                                                </div>

                                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                                                        <div className="flex items-center text-gray-900 dark:text-white font-medium">
                                                                            <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                                                            {formatSimpleDate(appointment?.appointmentDate)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                                                                        <div className="flex items-center text-gray-900 dark:text-white font-medium">
                                                                            <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                                            {formatTime(appointment?.appointmentTime)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-1">
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                                                                        <div className="flex items-center text-gray-900 dark:text-white font-medium">
                                                                            <MapPin className="w-4 h-4 mr-2 text-blue-500" />
                                                                            {safeRender(appointment?.officeLocation) || getOfficeLocation().address}
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Documents Section */}
                                                                {appointment?.documents && Array.isArray(appointment.documents) && appointment.documents.length > 0 && (
                                                                    <div className="mb-4">
                                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Required Documents</p>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {appointment.documents.map((docId: string, docIndex: number) => (
                                                                                <span key={docIndex} className="inline-flex items-center px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                                                                    <File className="w-3 h-3 mr-1.5" />
                                                                                    {getDocumentRequirementName(docId)}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Additional Notes */}
                                                                {appointment?.additionalNotes && (
                                                                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Additional Notes:</p>
                                                                        <p className="text-gray-900 dark:text-white text-sm">{safeRender(appointment.additionalNotes)}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-600">
                                                            <div className="flex items-center space-x-2">
                                                                <span className={`px-2 py-1 rounded text-xs ${isUpcoming ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                                                                    isCompleted ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                                                                    }`}>
                                                                    {isUpcoming ? 'Upcoming' : isCompleted ? 'Completed' : 'Past'}
                                                                </span>
                                                                {appointment?.verificationType && (
                                                                    <span className={`px-2 py-1 rounded text-xs ${getVerificationTypeColor(appointment.verificationType)}`}>
                                                                        {safeRender(appointment.verificationType).toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <button className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center">
                                                                    <FileText className="w-4 h-4 mr-2" />
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Office Information */}
                                {safeAppointments.length > 0 && (
                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                            <Building className="w-5 h-5 mr-2 text-blue-500" />
                                            Office Information
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Address</p>
                                                <p className="text-gray-900 dark:text-white">{getOfficeLocation().address}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Working Hours</p>
                                                <p className="text-gray-900 dark:text-white">{getOfficeLocation().workingHours}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailsModal;