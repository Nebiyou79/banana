/* eslint-disable @typescript-eslint/no-explicit-any */
// components/forms/CompanyProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import { Loader2, Building, Shield, MapPin, Phone, Globe as GlobeIcon, FileText, Hash, Users, Briefcase, Mail, Globe } from 'lucide-react';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { profileService, type SocialLinks, type CloudinaryImage, type Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { companyService, type CompanyProfile } from '@/services/companyService';
import { colorClasses } from '@/utils/color';

// Form schemas - align with companyService validation
const companyCoreSchema = z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name cannot exceed 100 characters'),
    tin: z.string().optional(),
    industry: z.string().optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

const socialLinksSchema = z.object({
    linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
    twitter: z.string().url('Please enter a valid Twitter URL').optional().or(z.literal('')),
    github: z.string().url('Please enter a valid GitHub URL').optional().or(z.literal('')),
    facebook: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
    instagram: z.string().url('Please enter a valid Instagram URL').optional().or(z.literal('')),
    website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
});

type CompanyCoreFormData = z.infer<typeof companyCoreSchema>;
type SocialLinksFormData = z.infer<typeof socialLinksSchema>;

interface CompanyProfileFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const CompanyProfileEditForm: React.FC<CompanyProfileFormProps> = ({
    onSuccess,
    onCancel,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeSection, setActiveSection] = useState<'branding' | 'info' | 'contact' | 'social'>('branding');
    const [companyData, setCompanyData] = useState<CompanyProfile | null>(null);
    const [userProfile, setUserProfile] = useState<Profile | null>(null);
    const [socialLinksData, setSocialLinksData] = useState<SocialLinks | null>(null);
    const [companyRoleData, setCompanyRoleData] = useState<any>(null);
    const [mode, setMode] = useState<'create' | 'edit'>('create');

    // Company core form
    const {
        register: registerCore,
        handleSubmit: handleSubmitCore,
        formState: { errors: errorsCore },
        reset: resetCore,
        watch
    } = useForm<CompanyCoreFormData>({
        resolver: zodResolver(companyCoreSchema),
        defaultValues: {
            name: '',
            tin: '',
            industry: '',
            description: '',
            address: '',
            phone: '',
            website: '',
        }
    });

    // Social links form
    const {
        register: registerSocial,
        handleSubmit: handleSubmitSocial,
        formState: { errors: errorsSocial },
        reset: resetSocial
    } = useForm<SocialLinksFormData>({
        resolver: zodResolver(socialLinksSchema),
        defaultValues: {
            linkedin: '',
            twitter: '',
            github: '',
            facebook: '',
            instagram: '',
            website: '',
        }
    });

    // Watch form values for real-time validation display
    const watchedName = watch('name');
    const watchedDescription = watch('description');

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Load user profile (for avatar and cover images) using profileService
            const profile = await profileService.getProfile();
            setUserProfile(profile);

            // Load company profile using companyService
            const companyProfile = await companyService.getMyCompany();
            setCompanyData(companyProfile);

            if (companyProfile) {
                setMode('edit');
                // Reset core form with company data
                resetCore({
                    name: companyProfile.name || '',
                    tin: companyProfile.tin || '',
                    industry: companyProfile.industry || '',
                    description: companyProfile.description || '',
                    address: companyProfile.address || '',
                    phone: companyProfile.phone || '',
                    website: companyProfile.website || '',
                });

                // Load role-specific data using roleProfileService
                try {
                    const roleProfile = await roleProfileService.getCompanyProfile();
                    setCompanyRoleData(roleProfile);
                } catch (roleError) {
                    console.log('No role-specific data found or error loading:', roleError);
                    setCompanyRoleData(null);
                }

                // Load social links from user profile
                if (profile.socialLinks) {
                    resetSocial(profile.socialLinks);
                    setSocialLinksData(profile.socialLinks);
                }
            } else {
                setMode('create');
                // Reset forms with empty values for creation mode
                resetCore();
                resetSocial();
            }

        } catch (error) {
            console.error('Error loading company data:', error);
            // companyService already shows toast for errors
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarComplete = async (avatar: CloudinaryImage, thumbnailUrl?: string) => {
        try {
            // AvatarUploader already uploaded the image via profileService
            // Refresh user profile to get the new avatar
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
            console.log('Avatar upload completed:', avatar);
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleCoverComplete = async (cover: CloudinaryImage, thumbnailUrl?: string) => {
        try {
            // AvatarUploader already uploaded the image via profileService
            // Refresh user profile to get the new cover
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
            console.log('Cover upload completed:', cover);
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleAvatarDelete = async () => {
        try {
            // AvatarUploader already handles deletion via profileService.deleteAvatar()
            // Refresh user profile after deletion
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleCoverDelete = async () => {
        try {
            // AvatarUploader already handles deletion via profileService.deleteCoverPhoto()
            // Refresh user profile after deletion
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
        } catch (error) {
            console.error('Failed to refresh profile data:', error);
        }
    };

    const handleAvatarError = (type: 'avatar' | 'cover', error: any) => {
        console.error(`Avatar uploader error for ${type}:`, error);
        // AvatarUploader already shows toast errors
    };

    const handleCoreSubmit = async (data: CompanyCoreFormData) => {
        try {
            setIsSubmitting(true);

            if (mode === 'create') {
                // Create new company using companyService
                const newCompany = await companyService.createCompany(data);
                setCompanyData(newCompany);
                setMode('edit');
                toast.success('Company profile created successfully!');
            } else {
                // Update existing company using companyService
                const updatedCompany = await companyService.updateMyCompany(data);
                setCompanyData(updatedCompany);
                toast.success('Company profile updated successfully!');
            }

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to save company profile:', error);
            // companyService handles toast errors internally
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialLinksSubmit = async (data: SocialLinksFormData) => {
        try {
            setIsSubmitting(true);

            // Update social links using profileService
            await profileService.updateSocialLinks(data as SocialLinks);

            // Refresh user profile to get updated social links
            const updatedProfile = await profileService.getProfile();
            setUserProfile(updatedProfile);
            setSocialLinksData(data);

            toast.success('Social links updated successfully!');

            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Failed to update social links:', error);
            // profileService handles toast errors internally
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="space-y-6 w-full">
                <div className="flex flex-col gap-4">
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>

                <Separator />

                <div className="space-y-6">
                    <Skeleton className="h-40 w-full rounded-lg" />
                    <Skeleton className="h-80 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    // Get avatar and cover from user profile
    const avatarUrl = userProfile?.avatar;
    const coverUrl = userProfile?.cover;
    const userId = userProfile?.user?._id;

    // Mobile-friendly section navigation
    const SectionNav = () => (
        <div className="flex flex-col sm:flex-row gap-2 mb-8 overflow-x-auto pb-2">
            <button
                type="button"
                onClick={() => setActiveSection('branding')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'branding'
                    ? `${colorClasses.bg.blue} ${colorClasses.text.white}`
                    : `${colorClasses.bg.gray100} ${colorClasses.text.gray800} hover:bg-gray-200 dark:hover:bg-gray-700`
                    }`}
            >
                <Building className="w-4 h-4" />
                Branding
            </button>
            <button
                type="button"
                onClick={() => setActiveSection('info')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'info'
                    ? `${colorClasses.bg.blue} ${colorClasses.text.white}`
                    : `${colorClasses.bg.gray100} ${colorClasses.text.gray800} hover:bg-gray-200 dark:hover:bg-gray-700`
                    }`}
            >
                <FileText className="w-4 h-4" />
                Company Info
            </button>
            <button
                type="button"
                onClick={() => setActiveSection('contact')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'contact'
                    ? `${colorClasses.bg.blue} ${colorClasses.text.white}`
                    : `${colorClasses.bg.gray100} ${colorClasses.text.gray800} hover:bg-gray-200 dark:hover:bg-gray-700`
                    }`}
            >
                <Phone className="w-4 h-4" />
                Contact
            </button>
            <button
                type="button"
                onClick={() => setActiveSection('social')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeSection === 'social'
                    ? `${colorClasses.bg.blue} ${colorClasses.text.white}`
                    : `${colorClasses.bg.gray100} ${colorClasses.text.gray800} hover:bg-gray-200 dark:hover:bg-gray-700`
                    }`}
            >
                <Globe className="w-4 h-4" />
                Social Links
            </button>
        </div>
    );

    return (
        <div className="w-full space-y-8">
            {/* Form Header */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.darkNavy}`}>
                            {mode === 'create' ? 'Create Company Profile' : 'Edit Company Profile'}
                        </h2>
                        <p className={`mt-2 ${colorClasses.text.gray600}`}>
                            {mode === 'create'
                                ? 'Set up your company profile to get started'
                                : 'Manage your company information and branding'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {onCancel && (
                            <Button
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                                className="flex items-center gap-2"
                            >
                                Cancel
                            </Button>
                        )}
                    </div>
                </div>

                <Separator />
            </div>

            {/* Mobile-friendly Section Navigation */}
            <SectionNav />

            {/* Branding Section */}
            {activeSection === 'branding' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-4">
                        <h3 className={`text-xl font-semibold flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                            <Building className="w-5 h-5" />
                            Company Branding
                        </h3>
                        <p className={colorClasses.text.gray600}>
                            Upload your company logo and cover banner. These images are stored in your user profile.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                        <AvatarUploader
                            currentAvatar={avatarUrl}
                            currentCover={coverUrl}
                            onAvatarComplete={handleAvatarComplete}
                            onCoverComplete={handleCoverComplete}
                            onAvatarDelete={mode === 'edit' ? handleAvatarDelete : undefined}
                            onCoverDelete={mode === 'edit' ? handleCoverDelete : undefined}
                            onError={handleAvatarError}
                            type="both"
                            size="lg"
                            showHelperText={true}
                            showDeleteButtons={mode === 'edit'}
                            maxFileSize={{
                                avatar: 5,
                                cover: 10
                            }}
                            allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                            aspectRatio={{
                                avatar: '1:1',
                                cover: '16:9'
                            }}
                            userId={userId}
                            className="w-full max-w-4xl"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveSection('info')}
                            className="flex items-center gap-2"
                        >
                            Next: Company Info
                        </Button>
                    </div>
                </div>
            )}

            {/* Company Information Section */}
            {activeSection === 'info' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-4">
                        <h3 className={`text-xl font-semibold flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                            <FileText className="w-5 h-5" />
                            Company Information
                        </h3>
                        <p className={colorClasses.text.gray600}>
                            Basic information about your company
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                        <form onSubmit={handleSubmitCore(handleCoreSubmit)} className="space-y-6">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${colorClasses.text.gray800}`}>
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            {...registerCore('name')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsCore.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="Enter your company name"
                                            disabled={mode === 'edit' && companyData?.verified}
                                        />
                                        <div className="flex justify-between mt-2">
                                            <p className="text-xs text-gray-500">
                                                Required • 2-100 characters
                                            </p>
                                            <p className={`text-xs ${(watchedName?.length || 0) > 100 ? 'text-red-500' : 'text-gray-500'}`}>
                                                {watchedName?.length || 0}/100
                                            </p>
                                        </div>
                                        {errorsCore.name && (
                                            <p className="mt-1 text-sm text-red-600">{errorsCore.name.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${colorClasses.text.gray800}`}>
                                                TIN / Registration Number
                                            </label>
                                            <input
                                                type="text"
                                                {...registerCore('tin')}
                                                className={`w-full px-4 py-3 rounded-lg border ${errorsCore.tin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                                placeholder="e.g., 123456789"
                                            />
                                            {errorsCore.tin && (
                                                <p className="mt-1 text-sm text-red-600">{errorsCore.tin.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 ${colorClasses.text.gray800}`}>
                                                Industry
                                            </label>
                                            <input
                                                type="text"
                                                {...registerCore('industry')}
                                                className={`w-full px-4 py-3 rounded-lg border ${errorsCore.industry ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                                placeholder="e.g., Technology, Healthcare, Finance"
                                            />
                                            {errorsCore.industry && (
                                                <p className="mt-1 text-sm text-red-600">{errorsCore.industry.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${colorClasses.text.gray800}`}>
                                            Company Description
                                        </label>
                                        <textarea
                                            {...registerCore('description')}
                                            rows={4}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsCore.description ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="Describe what your company does..."
                                        />
                                        <div className="flex justify-between mt-2">
                                            <p className="text-xs text-gray-500">
                                                Optional • Max 1000 characters
                                            </p>
                                            <p className={`text-xs ${(watchedDescription?.length || 0) > 1000 ? 'text-red-500' : 'text-gray-500'}`}>
                                                {watchedDescription?.length || 0}/1000
                                            </p>
                                        </div>
                                        {errorsCore.description && (
                                            <p className="mt-1 text-sm text-red-600">{errorsCore.description.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveSection('branding')}
                                            className="flex items-center gap-2"
                                        >
                                            Back
                                        </Button>
                                        {onCancel && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={onCancel}
                                                disabled={isSubmitting}
                                            >
                                                Cancel
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveSection('contact')}
                                            className="flex items-center gap-2"
                                        >
                                            Next: Contact Details
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                        // className={theme.getButtonClasses('primary')}
                                        >
                                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            {mode === 'create' ? 'Create Profile' : 'Save Info'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contact Details Section */}
            {activeSection === 'contact' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-4">
                        <h3 className={`text-xl font-semibold flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                            <Phone className="w-5 h-5" />
                            Contact Information
                        </h3>
                        <p className={colorClasses.text.gray600}>
                            How people can contact your company
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                        <form onSubmit={handleSubmitCore(handleCoreSubmit)} className="space-y-6">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                            <MapPin className="w-4 h-4" />
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            {...registerCore('address')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsCore.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="Company street address"
                                        />
                                        {errorsCore.address && (
                                            <p className="mt-1 text-sm text-red-600">{errorsCore.address.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                                <Phone className="w-4 h-4" />
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                {...registerCore('phone')}
                                                className={`w-full px-4 py-3 rounded-lg border ${errorsCore.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                                placeholder="+1 (555) 123-4567"
                                            />
                                            {errorsCore.phone && (
                                                <p className="mt-1 text-sm text-red-600">{errorsCore.phone.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                                <GlobeIcon className="w-4 h-4" />
                                                Website
                                            </label>
                                            <input
                                                type="url"
                                                {...registerCore('website')}
                                                className={`w-full px-4 py-3 rounded-lg border ${errorsCore.website ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                                placeholder="https://example.com"
                                            />
                                            {errorsCore.website && (
                                                <p className="mt-1 text-sm text-red-600">{errorsCore.website.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {companyData?.verified && (
                                    <div className={`p-4 rounded-lg border ${colorClasses.border.blue} ${colorClasses.bg.blue} bg-opacity-10 dark:bg-opacity-20`}>
                                        <div className="flex items-start gap-3">
                                            <Shield className="w-5 h-5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <h4 className="font-medium text-blue-800 dark:text-blue-300">Verified Company</h4>
                                                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                                    Your company is verified. Some fields may be restricted from editing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveSection('info')}
                                            className="flex items-center gap-2"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => resetCore()}
                                            disabled={isSubmitting}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveSection('social')}
                                            className="flex items-center gap-2"
                                        >
                                            Next: Social Links
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                        // className={theme.getButtonClasses('primary')}
                                        >
                                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Save Contact Info
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Social Links Section */}
            {activeSection === 'social' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="space-y-4">
                        <h3 className={`text-xl font-semibold flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                            <GlobeIcon className="w-5 h-5" />
                            Social Media Links
                        </h3>
                        <p className={colorClasses.text.gray600}>
                            Add your company's social media profiles
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
                        <form onSubmit={handleSubmitSocial(handleSocialLinksSubmit)} className="space-y-6">
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                            <Hash className="w-4 h-4" />
                                            LinkedIn URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('linkedin')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsSocial.linkedin ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="https://linkedin.com/company/your-company"
                                        />
                                        {errorsSocial.linkedin && (
                                            <p className="mt-1 text-sm text-red-600">{errorsSocial.linkedin.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                            <Hash className="w-4 h-4" />
                                            Twitter URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('twitter')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsSocial.twitter ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="https://twitter.com/your-company"
                                        />
                                        {errorsSocial.twitter && (
                                            <p className="mt-1 text-sm text-red-600">{errorsSocial.twitter.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                            <Hash className="w-4 h-4" />
                                            Facebook URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('facebook')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsSocial.facebook ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="https://facebook.com/your-company"
                                        />
                                        {errorsSocial.facebook && (
                                            <p className="mt-1 text-sm text-red-600">{errorsSocial.facebook.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                            <Hash className="w-4 h-4" />
                                            Instagram URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('instagram')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsSocial.instagram ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="https://instagram.com/your-company"
                                        />
                                        {errorsSocial.instagram && (
                                            <p className="mt-1 text-sm text-red-600">{errorsSocial.instagram.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                            <Hash className="w-4 h-4" />
                                            GitHub URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('github')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsSocial.github ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="https://github.com/your-company"
                                        />
                                        {errorsSocial.github && (
                                            <p className="mt-1 text-sm text-red-600">{errorsSocial.github.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${colorClasses.text.gray800}`}>
                                            <GlobeIcon className="w-4 h-4" />
                                            Company Website
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('website')}
                                            className={`w-full px-4 py-3 rounded-lg border ${errorsSocial.website ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${colorClasses.bg.white} ${colorClasses.text.gray800} focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                            placeholder="https://your-company.com"
                                        />
                                        {errorsSocial.website && (
                                            <p className="mt-1 text-sm text-red-600">{errorsSocial.website.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setActiveSection('contact')}
                                            className="flex items-center gap-2"
                                        >
                                            Back
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => resetSocial({})}
                                            disabled={isSubmitting}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                        // className={theme.getButtonClasses('primary')}
                                        >
                                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Save Social Links
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Progress indicator for mobile */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
                <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                        {['branding', 'info', 'contact', 'social'].map((section, index) => (
                            <div
                                key={section}
                                className={`w-2 h-2 rounded-full ${activeSection === section ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                                title={section.charAt(0).toUpperCase() + section.slice(1)}
                            />
                        ))}
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CompanyProfileEditForm;