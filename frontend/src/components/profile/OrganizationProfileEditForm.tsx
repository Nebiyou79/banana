// components/forms/OrganizationProfileForm.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { Loader2, Users, User, Globe, Settings, Shield, Target } from 'lucide-react';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { profileService, type Profile, type SocialLinks } from '@/services/profileService';
import { roleProfileService } from '@/services/roleProfileService';
import { organizationService, type OrganizationProfile } from '@/services/organizationService';

// Form schemas
const mainProfileSchema = z.object({
    headline: z.string().min(3, 'Headline must be at least 3 characters').max(100),
    bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
    location: z.string().min(2, 'Location must be at least 2 characters'),
    phone: z.string().optional(),
    website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

const organizationInfoSchema = z.object({
    companyInfo: z.object({
        size: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
        foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
        companyType: z.enum(['startup', 'small-business', 'medium-business', 'large-enterprise', 'multinational', 'non-profit', 'government', 'community', 'ngo', 'charity', 'association', 'educational', 'healthcare', 'other']).optional(),
        industry: z.string().optional(),
        mission: z.string().max(500).optional(),
        values: z.array(z.string()).optional(),
        culture: z.string().max(500).optional(),
    }).optional(),
});

const socialLinksSchema = z.object({
    linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
    twitter: z.string().url('Please enter a valid Twitter URL').optional().or(z.literal('')),
    facebook: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
    instagram: z.string().url('Please enter a valid Instagram URL').optional().or(z.literal('')),
    website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
});

type MainProfileFormData = z.infer<typeof mainProfileSchema>;
type OrganizationInfoFormData = z.infer<typeof organizationInfoSchema>;
type SocialLinksFormData = z.infer<typeof socialLinksSchema>;

interface OrganizationProfileFormProps {
    initialData?: {
        profile?: Profile;
        organizationProfile?: OrganizationProfile;
        roleSpecific?: any;
    };
    onSuccess?: () => void;
    onCancel?: () => void;
    mode?: 'create' | 'edit';
}

export const OrganizationProfileForm: React.FC<OrganizationProfileFormProps> = ({
    initialData,
    onSuccess,
    onCancel,
    mode = 'edit'
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('main');
    const [profileData, setProfileData] = useState<Profile | null>(null);
    const [organizationData, setOrganizationData] = useState<OrganizationProfile | null>(null);
    const [organizationRoleData, setOrganizationRoleData] = useState<any>(null);

    // Main profile form
    const { register: registerMain, handleSubmit: handleSubmitMain, formState: { errors: errorsMain }, reset: resetMain } = useForm<MainProfileFormData>({
        resolver: zodResolver(mainProfileSchema),
    });

    // Organization info form
    const { register: registerOrg, handleSubmit: handleSubmitOrg, formState: { errors: errorsOrg }, reset: resetOrg } = useForm<OrganizationInfoFormData>({
        resolver: zodResolver(organizationInfoSchema),
    });

    // Social links form
    const { register: registerSocial, handleSubmit: handleSubmitSocial, formState: { errors: errorsSocial }, reset: resetSocial } = useForm<SocialLinksFormData>({
        resolver: zodResolver(socialLinksSchema),
    });

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);

            // Load main profile
            const profile = await profileService.getProfile();
            setProfileData(profile);
            resetMain({
                headline: profile.headline || '',
                bio: profile.bio || '',
                location: profile.location || '',
                phone: profile.phone || '',
                website: profile.website || '',
            });

            // Load organization-specific profile
            const roleProfile = await roleProfileService.getOrganizationProfile();
            setOrganizationRoleData(roleProfile);

            // Load organization service profile
            const orgProfile = await organizationService.getMyOrganization();
            setOrganizationData(orgProfile);

            // Reset social links form
            resetSocial(profile.socialLinks || {});

        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load profile data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarComplete = async (avatarUrl: string) => {
        try {
            await profileService.updateProfile({ avatar: avatarUrl });
            setProfileData(prev => prev ? { ...prev, user: { ...prev.user, avatar: avatarUrl } } : null);
            toast.success('Profile picture updated successfully');
        } catch (error) {
            toast.error('Failed to update profile picture');
        }
    };

    const handleCoverComplete = async (coverUrl: string) => {
        try {
            await profileService.updateProfile({ coverPhoto: coverUrl });
            setProfileData(prev => prev ? { ...prev, coverPhoto: coverUrl } : null);
            toast.success('Cover photo updated successfully');
        } catch (error) {
            toast.error('Failed to update cover photo');
        }
    };

    const handleMainProfileSubmit = async (data: MainProfileFormData) => {
        try {
            setIsLoading(true);
            await profileService.updateProfile(data);
            toast.success('Main profile updated successfully');
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Failed to update main profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrganizationInfoSubmit = async (data: OrganizationInfoFormData) => {
        try {
            setIsLoading(true);
            await roleProfileService.updateOrganizationProfile(data);
            toast.success('Organization information updated successfully');
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Failed to update organization information');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSocialLinksSubmit = async (data: SocialLinksFormData) => {
        try {
            setIsLoading(true);
            await profileService.updateSocialLinks(data as SocialLinks);
            toast.success('Social links updated successfully');
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Failed to update social links');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOrganizationServiceSubmit = async () => {
        try {
            setIsLoading(true);
            // This would be handled in a separate organization details form
            toast.info('Organization registration details can be updated in Organization Settings');
        } catch (error) {
            toast.error('Failed to update organization details');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !profileData) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organization Profile</h2>
                    <p className="text-gray-600 mt-1">Manage your organization's public profile and information</p>
                </div>
                <div className="flex items-center gap-2">
                    {onCancel && (
                        <Button variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                </div>
            </div>

            <Separator />

            {/* Avatar and Cover Uploader */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Organization Images
                    </CardTitle>
                    <CardDescription>
                        Upload your organization logo and cover photo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AvatarUploader
                        currentAvatar={profileData?.user.avatar}
                        currentCover={profileData?.coverPhoto as string}
                        onAvatarComplete={handleAvatarComplete}
                        onCoverComplete={handleCoverComplete}
                        type="both"
                        aspectRatio={{
                            avatar: '1:1',
                            cover: '16:9'
                        }}
                    />
                </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="main" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Main Profile
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Organization Info
                    </TabsTrigger>
                    <TabsTrigger value="social" className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Social Links
                    </TabsTrigger>
                    <TabsTrigger value="registration" className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Registration
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </TabsTrigger>
                </TabsList>

                {/* Main Profile Tab */}
                <TabsContent value="main" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Main Profile Information</CardTitle>
                            <CardDescription>
                                Basic information that appears on your organization profile
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitMain(handleMainProfileSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Organization Headline *
                                        </label>
                                        <input
                                            type="text"
                                            {...registerMain('headline')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., Leading Non-Profit in Education"
                                        />
                                        {errorsMain.headline && (
                                            <p className="text-sm text-red-600">{errorsMain.headline.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Location *
                                        </label>
                                        <input
                                            type="text"
                                            {...registerMain('location')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., New York, NY"
                                        />
                                        {errorsMain.location && (
                                            <p className="text-sm text-red-600">{errorsMain.location.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Organization Bio
                                        </label>
                                        <textarea
                                            {...registerMain('bio')}
                                            rows={4}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Tell us about your organization's work and impact..."
                                        />
                                        {errorsMain.bio && (
                                            <p className="text-sm text-red-600">{errorsMain.bio.message}</p>
                                        )}
                                        <p className="text-xs text-gray-500">Max 500 characters</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            {...registerMain('phone')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="+1 (555) 123-4567"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Website
                                        </label>
                                        <input
                                            type="url"
                                            {...registerMain('website')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://example.org"
                                        />
                                        {errorsMain.website && (
                                            <p className="text-sm text-red-600">{errorsMain.website.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={onCancel}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Organization Information Tab */}
                <TabsContent value="organization" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Details</CardTitle>
                            <CardDescription>
                                Detailed information about your organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitOrg(handleOrganizationInfoSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Organization Type
                                        </label>
                                        <select
                                            {...registerOrg('companyInfo.companyType')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">Select type</option>
                                            <option value="association">Association</option>
                                            <option value="non-profit">Non-Profit Organization</option>
                                            <option value="government">Government Agency</option>
                                            <option value="educational">Educational Institution</option>
                                            <option value="healthcare">Healthcare Organization</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Organization Size
                                        </label>
                                        <select
                                            {...registerOrg('companyInfo.size')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                        <label className="text-sm font-medium text-gray-700">
                                            Founded Year
                                        </label>
                                        <input
                                            type="number"
                                            {...registerOrg('companyInfo.foundedYear', { valueAsNumber: true })}
                                            min="1800"
                                            max={new Date().getFullYear()}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="2010"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Industry/Sector
                                        </label>
                                        <input
                                            type="text"
                                            {...registerOrg('companyInfo.industry')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g., Education, Healthcare, Environment"
                                        />
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Mission Statement
                                        </label>
                                        <textarea
                                            {...registerOrg('companyInfo.mission')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="What is your organization's mission?"
                                        />
                                        <p className="text-xs text-gray-500">Max 500 characters</p>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Core Values
                                        </label>
                                        <textarea
                                            {...registerOrg('companyInfo.values')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="List your organization's core values (comma-separated)"
                                        />
                                        <p className="text-xs text-gray-500">e.g., Integrity, Compassion, Innovation, Collaboration</p>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Organization Culture
                                        </label>
                                        <textarea
                                            {...registerOrg('companyInfo.culture')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Describe your organization's culture and work environment..."
                                        />
                                        <p className="text-xs text-gray-500">Max 500 characters</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => resetOrg()}>
                                        Reset
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Organization Info
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
                                Add your organization's social media profiles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmitSocial(handleSocialLinksSubmit)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            LinkedIn URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('linkedin')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://linkedin.com/company/your-organization"
                                        />
                                        {errorsSocial.linkedin && (
                                            <p className="text-sm text-red-600">{errorsSocial.linkedin.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Twitter URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('twitter')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://twitter.com/your-organization"
                                        />
                                        {errorsSocial.twitter && (
                                            <p className="text-sm text-red-600">{errorsSocial.twitter.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Facebook URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('facebook')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://facebook.com/your-organization"
                                        />
                                        {errorsSocial.facebook && (
                                            <p className="text-sm text-red-600">{errorsSocial.facebook.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Instagram URL
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('instagram')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://instagram.com/your-organization"
                                        />
                                        {errorsSocial.instagram && (
                                            <p className="text-sm text-red-600">{errorsSocial.instagram.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Organization Website
                                        </label>
                                        <input
                                            type="url"
                                            {...registerSocial('website')}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="https://your-organization.org"
                                        />
                                        {errorsSocial.website && (
                                            <p className="text-sm text-red-600">{errorsSocial.website.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => resetSocial({})}>
                                        Clear All
                                    </Button>
                                    <Button type="submit" disabled={isLoading}>
                                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Social Links
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Registration Tab */}
                <TabsContent value="registration" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Registration</CardTitle>
                            <CardDescription>
                                Legal and registration information
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {organizationData ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <div className="flex items-center gap-3">
                                            <Shield className="w-5 h-5 text-blue-600" />
                                            <div>
                                                <h4 className="font-medium text-blue-900">Organization Registration Complete</h4>
                                                <p className="text-sm text-blue-700">
                                                    Your organization is registered as: <strong>{organizationData.name}</strong>
                                                    {organizationData.verified && (
                                                        <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Organization Name
                                            </label>
                                            <input
                                                type="text"
                                                value={organizationData.name}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Registration Number
                                            </label>
                                            <input
                                                type="text"
                                                value={organizationData.registrationNumber || 'Not provided'}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Organization Type
                                            </label>
                                            <input
                                                type="text"
                                                value={organizationService.getOrganizationTypeLabel(organizationData.organizationType || '')}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">
                                                Registration Date
                                            </label>
                                            <input
                                                type="text"
                                                value={new Date(organizationData.createdAt).toLocaleDateString()}
                                                readOnly
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-600">
                                            To update registration details, please contact support or visit the Organization Settings page.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Organization Registration Found</h3>
                                    <p className="text-gray-600 mb-6">
                                        You need to register your organization to access all features.
                                    </p>
                                    <Button onClick={handleOrganizationServiceSubmit}>
                                        Register Organization
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Settings</CardTitle>
                            <CardDescription>
                                Manage your organization's profile visibility and preferences
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                            <input type="radio" id="public" name="visibility" defaultChecked className="w-4 h-4" />
                                            <div>
                                                <label htmlFor="public" className="font-medium">Public</label>
                                                <p className="text-sm text-gray-600">Anyone can view your organization profile</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                            <input type="radio" id="connections" name="visibility" className="w-4 h-4" />
                                            <div>
                                                <label htmlFor="connections" className="font-medium">Partners Only</label>
                                                <p className="text-sm text-gray-600">Only partner organizations can view full profile</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                                            <input type="radio" id="private" name="visibility" className="w-4 h-4" />
                                            <div>
                                                <label htmlFor="private" className="font-medium">Private</label>
                                                <p className="text-sm text-gray-600">Only basic information is visible</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900">Contact Preferences</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="font-medium">Allow Volunteer Applications</label>
                                                <p className="text-sm text-gray-600">Allow users to apply as volunteers</p>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="font-medium">Allow Donation Inquiries</label>
                                                <p className="text-sm text-gray-600">Allow users to inquire about donations</p>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="font-medium">Show Contact Information</label>
                                                <p className="text-sm text-gray-600">Display email and phone number</p>
                                            </div>
                                            <input type="checkbox" className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="font-medium">Show Location</label>
                                                <p className="text-sm text-gray-600">Display organization location</p>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900">Impact Tracking</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="font-medium">Show Impact Metrics</label>
                                                <p className="text-sm text-gray-600">Display organization impact data publicly</p>
                                            </div>
                                            <input type="checkbox" defaultChecked className="w-4 h-4" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <label className="font-medium">Annual Report Access</label>
                                                <p className="text-sm text-gray-600">Allow public access to annual reports</p>
                                            </div>
                                            <input type="checkbox" className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button disabled={isLoading}>
                                        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Save Settings
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default OrganizationProfileForm;