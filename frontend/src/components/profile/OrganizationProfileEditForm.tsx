/* eslint-disable @typescript-eslint/no-explicit-any */
// components/forms/OrganizationProfileForm.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { Loader2, Users, Building2, MapPin, Phone, Link, Target, FileText } from 'lucide-react';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import {
    profileService,
    type Profile,
    type SocialLinks,
    type CloudinaryImage
} from '@/services/profileService';
import {
    roleProfileService,
    type OrganizationProfileResponse
} from '@/services/roleProfileService';
import { organizationService, type OrganizationProfile } from '@/services/organizationService';
import { colorClasses } from '@/utils/color';

// Form schemas for each service responsibility
const basicInfoSchema = z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters').max(100, 'Organization name cannot exceed 100 characters'),
    registrationNumber: z.string().optional(),
    organizationType: z.enum(['non-profit', 'government', 'educational', 'healthcare', 'other']).optional(),
    industry: z.string().optional(),
});

const organizationDetailsSchema = z.object({
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    mission: z.string().max(500, 'Mission statement cannot exceed 500 characters').optional(),
    address: z.string().optional(),
});

const contactInfoSchema = z.object({
    phone: z.string().optional(),
    secondaryPhone: z.string().optional(),
    website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
    email: z.string().email('Please enter a valid email').optional(),
});

const organizationRoleSchema = z.object({
    companyInfo: z.object({
        size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
        foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
        companyType: z.enum([
            'non-profit', 'government', 'educational', 'healthcare', 'other',
            'startup', 'small-business', 'medium-business', 'large-enterprise',
            'multinational', 'community', 'ngo', 'charity', 'association'
        ]).optional(),
        mission: z.string().max(500).optional(),
        // Accept either an array of strings or a comma-separated string so the form input can be processed safely
        values: z.array(z.string()).or(z.string()).optional(),
        culture: z.string().max(500).optional(),
        specialties: z.array(z.string()).or(z.string()).optional(),
    }).optional(),
});

// Social links schema - ONLY social media platforms, NO website
const socialLinksSchema = z.object({
    linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
    twitter: z.string().url('Please enter a valid Twitter URL').optional().or(z.literal('')),
    facebook: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
    instagram: z.string().url('Please enter a valid Instagram URL').optional().or(z.literal('')),
    youtube: z.string().url('Please enter a valid YouTube URL').optional().or(z.literal('')),
    // Note: NO website field here - that's in contact info
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
type OrganizationDetailsFormData = z.infer<typeof organizationDetailsSchema>;
type ContactInfoFormData = z.infer<typeof contactInfoSchema>;
type OrganizationRoleFormData = z.infer<typeof organizationRoleSchema>;
type SocialLinksFormData = z.infer<typeof socialLinksSchema>;

interface OrganizationProfileFormProps {
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const OrganizationProfileEditForm: React.FC<OrganizationProfileFormProps> = ({
    onSuccess,
    onCancel,
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [organizationData, setOrganizationData] = useState<OrganizationProfile | null>(null);
    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [roleSpecificData, setRoleSpecificData] = useState<OrganizationProfileResponse['data'] | null>(null);
    const [mode, setMode] = useState<'create' | 'edit'>('create');
    const [profileCompletion, setProfileCompletion] = useState<number>(0);
    const [loadingErrors, setLoadingErrors] = useState<string[]>([]);
    const [logoUrl, setLogoUrl] = useState<string>('');
    const [bannerUrl, setBannerUrl] = useState<string>('');

    // Form instances for each section
    const {
        register: registerBasic,
        handleSubmit: handleSubmitBasic,
        formState: { errors: errorsBasic },
        reset: resetBasic,
        setValue: setBasicValue
    } = useForm<BasicInfoFormData>({
        resolver: zodResolver(basicInfoSchema),
    });

    const {
        register: registerDetails,
        handleSubmit: handleSubmitDetails,
        formState: { errors: errorsDetails },
        reset: resetDetails
    } = useForm<OrganizationDetailsFormData>({
        resolver: zodResolver(organizationDetailsSchema),
    });

    const {
        register: registerContact,
        handleSubmit: handleSubmitContact,
        formState: { errors: errorsContact },
        reset: resetContact
    } = useForm<ContactInfoFormData>({
        resolver: zodResolver(contactInfoSchema),
    });

    const {
        register: registerRoleSpecific,
        handleSubmit: handleSubmitRoleSpecific,
        formState: { errors: errorsRoleSpecific },
        reset: resetRoleSpecific,
        setValue: setRoleSpecificValue
    } = useForm<OrganizationRoleFormData>({
        resolver: zodResolver(organizationRoleSchema),
    });

    const {
        register: registerSocial,
        handleSubmit: handleSubmitSocial,
        formState: { errors: errorsSocial },
        reset: resetSocial
    } = useForm<SocialLinksFormData>({
        resolver: zodResolver(socialLinksSchema),
    });

    // Load all data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const errors: string[] = [];

        try {
            setIsLoading(true);
            setLoadingErrors([]);

            // 1. Load organization registration data (organizationService)
            try {
                const orgData = await organizationService.getMyOrganization();

                if (orgData) {
                    // Organization exists - edit mode
                    setMode('edit');
                    setOrganizationData(orgData);

                    // Populate basic info form
                    resetBasic({
                        name: orgData.name,
                        registrationNumber: orgData.registrationNumber,
                        organizationType: orgData.organizationType as any,
                        industry: orgData.industry,
                    });

                    // Populate organization details form
                    resetDetails({
                        description: orgData.description,
                        mission: orgData.mission,
                        address: orgData.address,
                    });

                    // Populate contact info form
                    resetContact({
                        phone: orgData.phone,
                        secondaryPhone: orgData.secondaryPhone,
                        website: orgData.website,
                        email: orgData.user?.email,
                    });

                    // Set image URLs from organization service if available
                    if (orgData.logoFullUrl) setLogoUrl(orgData.logoFullUrl);
                    if (orgData.bannerFullUrl) setBannerUrl(orgData.bannerFullUrl);
                } else {
                    // No organization exists - create mode
                    setMode('create');
                    setOrganizationData(null);
                }
            } catch (orgError: any) {
                const errorMsg = orgError.message || 'Failed to load organization registration data';
                errors.push(errorMsg);
                console.warn('Organization service error:', orgError);
            }

            // 2. Load user profile data (profileService) - optional, can fail gracefully
            try {
                const profile = await profileService.getProfile();
                setProfileData(profile);

                // Populate social links form (ONLY social media, no website)
                const socialLinks = profile.socialLinks || {};
                const { ...socialMediaLinks } = socialLinks;
                resetSocial(socialMediaLinks);

                // Get profile completion if available
                try {
                    const completion = await profileService.getProfileCompletion();
                    setProfileCompletion(completion.percentage);
                } catch (completionError) {
                    console.warn('Profile completion fetch failed, using fallback');
                    // Use fallback completion based on available data
                    const calculatedCompletion = calculateFallbackCompletion(profile);
                    setProfileCompletion(calculatedCompletion);
                }

                // Update image URLs from profile if available
                if (profile && !logoUrl) {
                    const avatarUrl = profileService.getAvatarUrl(profile);
                    if (avatarUrl) setLogoUrl(avatarUrl);
                }
                if (profile && !bannerUrl) {
                    const coverUrl = profileService.getCoverUrl(profile);
                    if (coverUrl) setBannerUrl(coverUrl);
                }
            } catch (profileError: any) {
                const errorMsg = 'Profile data: ' + (profileError.message || 'Could not load');
                errors.push(errorMsg);
                console.warn('Profile service error:', profileError);
            }

            // 3. Load role-specific data (roleProfileService) - optional, can fail gracefully
            try {
                const roleProfile = await roleProfileService.getOrganizationProfile();
                setRoleSpecificData(roleProfile);

                // Prepare role-specific form data
                const roleFormData: OrganizationRoleFormData = {
                    companyInfo: roleProfile.companyInfo
                };

                resetRoleSpecific(roleFormData);

                // Set values field as comma-separated string for display
                if (roleProfile.companyInfo?.values && Array.isArray(roleProfile.companyInfo.values)) {
                    setRoleSpecificValue('companyInfo.values', roleProfile.companyInfo.values);
                }
            } catch (roleError: any) {
                const errorMsg = 'Organization profile: ' + (roleError.message || 'Could not load');
                errors.push(errorMsg);
                console.warn('Role profile service error:', roleError);
            }

        } catch (error: any) {
            console.error('Unexpected error loading organization data:', error);
            errors.push('Unexpected error loading data');
        } finally {
            setIsLoading(false);
            if (errors.length > 0) {
                setLoadingErrors(errors);
                if (errors.length === 1 && errors[0].includes('Failed to load organization registration data')) {
                    // This is expected when no organization exists yet
                    console.log('No organization found - create mode');
                } else {
                    toast.error('Some data failed to load. You can still edit available fields.', {
                        duration: 5000,
                    });
                }
            }
        }
    };

    // Helper function to calculate fallback completion percentage
    const calculateFallbackCompletion = (profile: Profile): number => {
        let completion = 0;

        // Check for basic fields
        if (profile?.headline) completion += 20;
        if (profile?.bio) completion += 15;
        if (profile?.location) completion += 15;
        if (profile?.avatar?.secure_url || profile?.user?.avatar) completion += 20;
        if (profile?.cover?.secure_url) completion += 10;

        // Check for social links
        const socialLinks = profile?.socialLinks || {};
        const socialLinksCount = Object.values(socialLinks).filter(link => link).length;
        if (socialLinksCount > 0) completion += 10;

        // Check for role-specific data
        const roleSpecific = profile?.roleSpecific;
        if (roleSpecific?.skills && roleSpecific.skills.length > 0) completion += 10;

        return Math.min(completion, 100);
    };

    // ========== SERVICE-SPECIFIC HANDLERS ==========

    // organizationService: Create/Update organization registration data
    const handleBasicInfoSubmit = async (data: BasicInfoFormData) => {
        try {
            setIsSubmitting(true);

            if (mode === 'create') {
                // Create new organization
                const newOrg = await organizationService.createOrganization(data);
                setOrganizationData(newOrg);
                setMode('edit');
                toast.success('Organization created successfully!');
                if (onSuccess) onSuccess();
            } else if (organizationData?._id) {
                // Update existing organization
                const updatedOrg = await organizationService.updateOrganization(organizationData._id, data);
                setOrganizationData(updatedOrg);
                toast.success('Organization updated successfully!');
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            // Error handling is done in organizationService
            console.error('Organization service error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // organizationService: Update organization details
    const handleOrganizationDetailsSubmit = async (data: OrganizationDetailsFormData) => {
        try {
            setIsSubmitting(true);

            if (organizationData?._id) {
                const updatedOrg = await organizationService.updateOrganization(organizationData._id, data);
                setOrganizationData(updatedOrg);
                toast.success('Organization details updated successfully!');
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            // Error handling is done in organizationService
            console.error('Organization service error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // organizationService: Update contact information
    const handleContactInfoSubmit = async (data: ContactInfoFormData) => {
        try {
            setIsSubmitting(true);

            if (organizationData?._id) {
                const updatedOrg = await organizationService.updateOrganization(organizationData._id, data);
                setOrganizationData(updatedOrg);
                toast.success('Contact information updated successfully!');
                if (onSuccess) onSuccess();
            }
        } catch (error) {
            // Error handling is done in organizationService
            console.error('Organization service error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // roleProfileService: Update role-specific metadata
    const handleRoleSpecificSubmit = async (data: OrganizationRoleFormData) => {
        try {
            setIsSubmitting(true);

            // Convert comma-separated values string to array and build properly typed data
            const companyInfoData = data.companyInfo ? { ...data.companyInfo } : undefined;

            // Handle values field (convert comma-separated string to array)
            let processedValues: string[] | undefined = undefined;
            if (companyInfoData?.values) {
                if (typeof companyInfoData.values === 'string') {
                    processedValues = companyInfoData.values
                        .split(',')
                        .map((value: string) => value.trim())
                        .filter((value: string) => value.length > 0);
                } else if (Array.isArray(companyInfoData.values)) {
                    processedValues = companyInfoData.values;
                }
            }

            // Handle specialties field (convert comma-separated string to array)
            let processedSpecialties: string[] | undefined = undefined;
            if (companyInfoData?.specialties) {
                if (typeof companyInfoData.specialties === 'string') {
                    processedSpecialties = companyInfoData.specialties
                        .split(',')
                        .map((specialty: string) => specialty.trim())
                        .filter((specialty: string) => specialty.length > 0);
                } else if (Array.isArray(companyInfoData.specialties)) {
                    processedSpecialties = companyInfoData.specialties;
                }
            }

            // Build the properly typed update data
            const updateData: Parameters<typeof roleProfileService.updateOrganizationProfile>[0] = {
                companyInfo: companyInfoData ? {
                    size: companyInfoData.size,
                    foundedYear: companyInfoData.foundedYear,
                    companyType: companyInfoData.companyType,
                    mission: companyInfoData.mission,
                    values: processedValues,
                    culture: companyInfoData.culture,
                    specialties: processedSpecialties,
                } : undefined,
            };

            const updatedRoleData = await roleProfileService.updateOrganizationProfile(updateData);
            setRoleSpecificData(updatedRoleData);
            toast.success('Organization profile updated successfully!');

            if (onSuccess) onSuccess();
        } catch (error) {
            // Error handling is done in roleProfileService
            console.error('Role profile service error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // profileService: Update social links (ONLY social media, no website)
    const handleSocialLinksSubmit = async (data: SocialLinksFormData) => {
        try {
            setIsSubmitting(true);

            // Filter out empty strings
            const filteredSocialLinks: SocialLinks = {};
            Object.entries(data).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    filteredSocialLinks[key as keyof SocialLinks] = value;
                }
            });

            const updatedSocialLinks = await profileService.updateSocialLinks(filteredSocialLinks);

            // Update local profile data if available
            if (profileData) {
                setProfileData({
                    ...profileData,
                    socialLinks: updatedSocialLinks
                });
            }

            toast.success('Social links updated successfully!');

            if (onSuccess) onSuccess();
        } catch (error) {
            // Error handling is done in profileService
            console.error('Profile service error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // AvatarUploader: Handle logo upload
    const handleLogoComplete = async (avatar: CloudinaryImage) => {
        try {
            // Update local state immediately for better UX
            setLogoUrl(avatar.secure_url);

            // Note: profileService.uploadAvatar is already called by AvatarUploader
            // The actual update to the backend is handled by AvatarUploader

            toast.success('Logo uploaded successfully!');

            // Update profile completion if we have profile data
            if (profileData) {
                const calculatedCompletion = calculateFallbackCompletion({
                    ...profileData,
                    avatar: avatar
                });
                setProfileCompletion(calculatedCompletion);
            }
        } catch (error) {
            console.error('Error updating logo:', error);
        }
    };

    // AvatarUploader: Handle banner upload
    const handleBannerComplete = async (cover: CloudinaryImage) => {
        try {
            // Update local state immediately for better UX
            setBannerUrl(cover.secure_url);

            // Note: profileService.uploadCoverPhoto is already called by AvatarUploader
            // The actual update to the backend is handled by AvatarUploader

            toast.success('Banner uploaded successfully!');

            // Update profile completion if we have profile data
            if (profileData) {
                const calculatedCompletion = calculateFallbackCompletion({
                    ...profileData,
                    cover: cover
                });
                setProfileCompletion(calculatedCompletion);
            }
        } catch (error) {
            console.error('Error updating banner:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className={`${colorClasses.text.gray600}`}>Loading organization profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
                        {mode === 'create' ? 'Register Organization' : 'Organization Profile'}
                    </h1>
                    <p className={`${colorClasses.text.gray600} mt-1`}>
                        {mode === 'create'
                            ? 'Complete your organization registration to get started'
                            : 'Manage your organization\'s public profile and information'}
                    </p>
                </div>

                {mode === 'edit' && (
                    <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full ${colorClasses.bg.blue} ${colorClasses.text.blue}`}>
                            <span className="text-sm font-medium">Profile Complete: {profileCompletion}%</span>
                        </div>
                        {onCancel && (
                            <button
                                onClick={onCancel}
                                className={`px-4 py-2 border rounded-lg hover:${colorClasses.bg.gray100} ${colorClasses.border.gray400} ${colorClasses.text.gray700}`}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Loading Errors Banner */}
            {loadingErrors.length > 0 && mode === 'edit' && (
                <div className={`p-4 rounded-lg border ${colorClasses.bg.goldenMustard} ${colorClasses.border.goldenMustard}`}>
                    <div className="flex items-start gap-3">
                        <div className="text-yellow-600">
                            ⚠️
                        </div>
                        <div>
                            <h4 className={`font-medium ${colorClasses.text.darkNavy}`}>Partial Data Loaded</h4>
                            <p className={`text-sm ${colorClasses.text.gray700} mt-1`}>
                                Some data failed to load: {loadingErrors.join('; ')}.
                                You can still edit the available fields below.
                            </p>
                            <button
                                onClick={loadData}
                                className={`mt-2 text-sm ${colorClasses.text.blue} hover:underline`}
                            >
                                Try reloading data
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Separator className={colorClasses.border.gray400} />

            {/* Branding Section - AvatarUploader */}
            <Card className={colorClasses.bg.white}>
                <CardHeader>
                    <CardTitle className={`flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                        <Building2 className="w-5 h-5" />
                        Organization Branding
                    </CardTitle>
                    <CardDescription className={colorClasses.text.gray600}>
                        Upload your organization logo and banner image
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AvatarUploader
                        currentAvatar={logoUrl}
                        currentCover={bannerUrl}
                        onAvatarComplete={handleLogoComplete}
                        onCoverComplete={handleBannerComplete}
                        type="both"
                        aspectRatio={{
                            avatar: '1:1',
                            cover: '16:9'
                        }}
                        maxFileSize={{
                            avatar: 5,
                            cover: 10
                        }}
                        showHelperText={true}
                        userId={organizationData?._id}
                    />
                </CardContent>
            </Card>

            {/* Section 1: Basic Information - organizationService */}
            <Card className={colorClasses.bg.white}>
                <CardHeader>
                    <CardTitle className={colorClasses.text.darkNavy}>Basic Information</CardTitle>
                    <CardDescription className={colorClasses.text.gray600}>
                        Core organization details for registration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitBasic(handleBasicInfoSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                    Organization Name *
                                </label>
                                <input
                                    type="text"
                                    {...registerBasic('name')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                    placeholder="e.g., Green Earth Initiative"
                                    disabled={mode === 'edit'}
                                />
                                {errorsBasic.name && (
                                    <p className="text-sm text-red-600">{errorsBasic.name.message}</p>
                                )}
                                {mode === 'edit' && (
                                    <p className="text-xs text-gray-500">Organization name cannot be changed after registration</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                    Registration Number
                                </label>
                                <input
                                    type="text"
                                    {...registerBasic('registrationNumber')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                    placeholder="e.g., 123456789"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                    Organization Type
                                </label>
                                <select
                                    {...registerBasic('organizationType')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                >
                                    <option value="">Select type</option>
                                    {organizationService.getOrganizationTypeOptions().map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                    Industry/Sector
                                </label>
                                <input
                                    type="text"
                                    {...registerBasic('industry')}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                    placeholder="e.g., Education, Environment, Healthcare"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {mode === 'create' ? 'Register Organization' : 'Update Basic Info'}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Show remaining sections only in edit mode */}
            {mode === 'edit' && (
                <>
                    {/* Section 2: Organization Details - organizationService */}
                    <Card className={colorClasses.bg.white}>
                        <CardHeader>
                            <CardTitle className={`flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                                <FileText className="w-5 h-5" />
                                Organization Details
                            </CardTitle>
                            <CardDescription className={colorClasses.text.gray600}>
                                Tell us about your organization`s work and impact
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitDetails(handleOrganizationDetailsSubmit)} className="space-y-6">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Description
                                        </label>
                                        <textarea
                                            {...registerDetails('description')}
                                            rows={4}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="Describe your organization's purpose, activities, and impact..."
                                        />
                                        {errorsDetails.description && (
                                            <p className="text-sm text-red-600">{errorsDetails.description.message}</p>
                                        )}
                                        <p className="text-xs text-gray-500">Max 1000 characters</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Mission Statement
                                        </label>
                                        <textarea
                                            {...registerDetails('mission')}
                                            rows={3}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="What is your organization's core mission?"
                                        />
                                        {errorsDetails.mission && (
                                            <p className="text-sm text-red-600">{errorsDetails.mission.message}</p>
                                        )}
                                        <p className="text-xs text-gray-500">Max 500 characters</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            {...registerDetails('address')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="e.g., 123 Main Street, City, State, ZIP Code"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Details
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Section 3: Contact Information - organizationService */}
                    <Card className={colorClasses.bg.white}>
                        <CardHeader>
                            <CardTitle className={`flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                                <Phone className="w-5 h-5" />
                                Contact Information
                            </CardTitle>
                            <CardDescription className={colorClasses.text.gray600}>
                                How people can get in touch with your organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitContact(handleContactInfoSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Primary Phone
                                        </label>
                                        <input
                                            type="tel"
                                            {...registerContact('phone')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="+1 (555) 123-4567"
                                        />
                                        {errorsContact.phone && (
                                            <p className="text-sm text-red-600">{errorsContact.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Secondary Phone
                                        </label>
                                        <input
                                            type="tel"
                                            {...registerContact('secondaryPhone')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="+1 (555) 987-6543"
                                        />
                                        {errorsContact.secondaryPhone && (
                                            <p className="text-sm text-red-600">{errorsContact.secondaryPhone.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            {...registerContact('website')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="https://example.org"
                                        />
                                        {errorsContact.website && (
                                            <p className="text-sm text-red-600">{errorsContact.website.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Contact Email
                                        </label>
                                        <input
                                            type="email"
                                            {...registerContact('email')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="contact@example.org"
                                        />
                                        {errorsContact.email && (
                                            <p className="text-sm text-red-600">{errorsContact.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Contact Info
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Section 4: Organization Profile - roleProfileService */}
                    <Card className={colorClasses.bg.white}>
                        <CardHeader>
                            <CardTitle className={`flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                                <Target className="w-5 h-5" />
                                Organization Profile
                            </CardTitle>
                            <CardDescription className={colorClasses.text.gray600}>
                                Additional organization-specific information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitRoleSpecific(handleRoleSpecificSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Organization Size
                                        </label>
                                        <select
                                            {...registerRoleSpecific('companyInfo.size')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                        >
                                            <option value="">Select size</option>
                                            <option value="1-10">1-10 employees</option>
                                            <option value="11-50">11-50 employees</option>
                                            <option value="51-200">51-200 employees</option>
                                            <option value="201-500">201-500 employees</option>
                                            <option value="501-1000">501-1000 employees</option>
                                            <option value="1000+">1000+ employees</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Founded Year
                                        </label>
                                        <input
                                            type="number"
                                            {...registerRoleSpecific('companyInfo.foundedYear', { valueAsNumber: true })}
                                            min="1800"
                                            max={new Date().getFullYear()}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="2010"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Organization Type (Profile)
                                        </label>
                                        <select
                                            {...registerRoleSpecific('companyInfo.companyType')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                        >
                                            <option value="">Select type</option>
                                            <option value="non-profit">Non-Profit Organization</option>
                                            <option value="government">Government Agency</option>
                                            <option value="educational">Educational Institution</option>
                                            <option value="healthcare">Healthcare Organization</option>
                                            <option value="startup">Startup</option>
                                            <option value="small-business">Small Business</option>
                                            <option value="medium-business">Medium Business</option>
                                            <option value="large-enterprise">Large Enterprise</option>
                                            <option value="multinational">Multinational</option>
                                            <option value="community">Community Organization</option>
                                            <option value="ngo">NGO</option>
                                            <option value="charity">Charity</option>
                                            <option value="association">Association</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Core Values (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            {...registerRoleSpecific('companyInfo.values')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="e.g., Integrity, Compassion, Innovation, Collaboration"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter values separated by commas. Example: `Integrity, Compassion, Innovation, Collaboration``
                                        </p>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Organization Culture
                                        </label>
                                        <textarea
                                            {...registerRoleSpecific('companyInfo.culture')}
                                            rows={3}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="Describe your organization's culture and work environment..."
                                        />
                                        <p className="text-xs text-gray-500">Max 500 characters</p>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Specialties (comma separated)
                                        </label>
                                        <input
                                            type="text"
                                            {...registerRoleSpecific('companyInfo.specialties')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="e.g., Environmental Conservation, Youth Education, Community Development"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Enter specialties separated by commas
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Profile Details
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Section 5: Social Links - profileService (ONLY social media) */}
                    <Card className={colorClasses.bg.white}>
                        <CardHeader>
                            <CardTitle className={`flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                                <Link className="w-5 h-5" />
                                Social Media Links
                            </CardTitle>
                            <CardDescription className={colorClasses.text.gray600}>
                                Connect your organization`s social media profiles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitSocial(handleSocialLinksSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            LinkedIn
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('linkedin')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="https://linkedin.com/company/your-organization"
                                        />
                                        {errorsSocial.linkedin && (
                                            <p className="text-sm text-red-600">{errorsSocial.linkedin.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Twitter / X
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('twitter')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="https://twitter.com/your-organization"
                                        />
                                        {errorsSocial.twitter && (
                                            <p className="text-sm text-red-600">{errorsSocial.twitter.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Facebook
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('facebook')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="https://facebook.com/your-organization"
                                        />
                                        {errorsSocial.facebook && (
                                            <p className="text-sm text-red-600">{errorsSocial.facebook.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            Instagram
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('instagram')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="https://instagram.com/your-organization"
                                        />
                                        {errorsSocial.instagram && (
                                            <p className="text-sm text-red-600">{errorsSocial.instagram.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                                            YouTube
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('youtube')}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                                            placeholder="https://youtube.com/@your-organization"
                                        />
                                        {errorsSocial.youtube && (
                                            <p className="text-sm text-red-600">{errorsSocial.youtube.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                        Save Social Links
                                    </button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Create Mode Call to Action */}
            {mode === 'create' && (
                <div className={`p-6 rounded-lg border ${colorClasses.bg.blue} ${colorClasses.border.blue}`}>
                    <div className="flex items-start gap-4">
                        <Users className="w-8 h-8 text-blue-600 mt-1" />
                        <div>
                            <h3 className="font-semibold text-blue-900 mb-2">Ready to Register Your Organization?</h3>
                            <p className={`text-sm ${colorClasses.text.gray700} mb-4`}>
                                Start by filling out the Basic Information section above. Once registered, you`ll be able to:
                            </p>
                            <ul className="space-y-2 text-sm text-blue-800">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    Upload your organization logo and banner
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    Complete your organization profile details
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    Connect social media accounts
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                    Start recruiting volunteers and partners
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizationProfileEditForm;