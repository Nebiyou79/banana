/* eslint-disable @typescript-eslint/no-explicit-any */
// components/forms/CompanyProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { Skeleton } from '@/components/ui/Skeleton';
import { Loader2, Building, Shield, MapPin, Phone, Globe as GlobeIcon, FileText, Hash } from 'lucide-react';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { profileService, type SocialLinks, type CloudinaryImage, type Profile } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { companyService, type CompanyProfile } from '@/services/companyService';

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
    const [activeTab, setActiveTab] = useState('core');
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
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </div>
                </div>

                <Separator />

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Get avatar and cover from user profile
    const avatarUrl = userProfile?.avatar;
    const coverUrl = userProfile?.cover;
    const userId = userProfile?.user?._id;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {mode === 'create' ? 'Create Company Profile' : 'Edit Company Profile'}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {mode === 'create'
                            ? 'Set up your company profile to get started'
                            : 'Manage your company information and branding'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

            {/* Branding Section - Logo & Banner using AvatarUploader */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Company Branding
                    </CardTitle>
                    <CardDescription>
                        Upload your company logo and cover banner. These images are stored in your user profile.
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                        className="max-w-4xl"
                    />
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="core" className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Company Info
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Contact Details
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex items-center gap-2">
                        <GlobeIcon className="w-4 h-4" />
                        Social Links
                    </TabsTrigger>
                </TabsList>

                {/* Company Core Information Tab */}
                <TabsContent value="core" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>
                                Basic information about your company
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitCore(handleCoreSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            {...registerCore('name')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="Enter your company name"
                                            disabled={mode === 'edit' && companyData?.verified}
                                        />
                                        {errorsCore.name && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsCore.name.message}</p>
                                        )}
                                        <div className="flex justify-between">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Required • 2-100 characters
                                            </p>
                                            <p className={`text-xs ${(watchedName?.length || 0) > 100 ? 'text-red-500' : 'text-gray-500'}`}>
                                                {watchedName?.length || 0}/100
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            TIN / Registration Number
                                        </label>
                                        <input
                                            type="text"
                                            {...registerCore('tin')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., 123456789"
                                        />
                                        {errorsCore.tin && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsCore.tin.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Industry
                                        </label>
                                        <input
                                            type="text"
                                            {...registerCore('industry')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="e.g., Technology, Healthcare, Finance"
                                        />
                                        {errorsCore.industry && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsCore.industry.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Company Description
                                        </label>
                                        <textarea
                                            {...registerCore('description')}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="Describe what your company does..."
                                        />
                                        {errorsCore.description && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsCore.description.message}</p>
                                        )}
                                        <div className="flex justify-between">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Optional • Max 1000 characters
                                            </p>
                                            <p className={`text-xs ${(watchedDescription?.length || 0) > 1000 ? 'text-red-500' : 'text-gray-500'}`}>
                                                {watchedDescription?.length || 0}/1000
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    {onCancel && (
                                        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                                            Cancel
                                        </Button>
                                    )}
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {mode === 'create' ? 'Create Company Profile' : 'Save Changes'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Contact Details Tab */}
                <TabsContent value="contact" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Contact Information</CardTitle>
                            <CardDescription>
                                How people can contact your company
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitCore(handleCoreSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <MapPin className="w-4 h-4 inline mr-2" />
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            {...registerCore('address')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="Company street address"
                                        />
                                        {errorsCore.address && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsCore.address.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <Phone className="w-4 h-4 inline mr-2" />
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            {...registerCore('phone')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                        {errorsCore.phone && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsCore.phone.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <GlobeIcon className="w-4 h-4 inline mr-2" />
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            {...registerCore('website')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://example.com"
                                        />
                                        {errorsCore.website && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsCore.website.message}</p>
                                        )}
                                    </div>
                                </div>

                                {companyData?.verified && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <h4 className="font-medium text-blue-900 dark:text-blue-300">Verified Company</h4>
                                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                                    Your company is verified. Some fields may be restricted from editing.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => resetCore()} disabled={isSubmitting}>
                                        Reset
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Contact Info
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Social Links Tab */}
                <TabsContent value="social" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Social Media Links</CardTitle>
                            <CardDescription>
                                Add your company`s social media profiles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitSocial(handleSocialLinksSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            LinkedIn URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('linkedin')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://linkedin.com/company/your-company"
                                        />
                                        {errorsSocial.linkedin && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsSocial.linkedin.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            Twitter URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('twitter')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://twitter.com/your-company"
                                        />
                                        {errorsSocial.twitter && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsSocial.twitter.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            Facebook URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('facebook')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://facebook.com/your-company"
                                        />
                                        {errorsSocial.facebook && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsSocial.facebook.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            Instagram URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('instagram')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://instagram.com/your-company"
                                        />
                                        {errorsSocial.instagram && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsSocial.instagram.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <Hash className="w-4 h-4" />
                                            GitHub URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('github')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://github.com/your-company"
                                        />
                                        {errorsSocial.github && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsSocial.github.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                            <GlobeIcon className="w-4 h-4" />
                                            Company Website
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('website')}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            placeholder="https://your-company.com"
                                        />
                                        {errorsSocial.website && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errorsSocial.website.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => resetSocial({})} disabled={isSubmitting}>
                                        Clear All
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Social Links
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CompanyProfileEditForm;