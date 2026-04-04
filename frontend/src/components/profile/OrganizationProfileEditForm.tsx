/* eslint-disable @typescript-eslint/no-explicit-any */
// components/forms/OrganizationProfileForm.tsx - COMPLETELY REFACTORED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
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
import {
  Loader2,
  Users,
  Building2,
  MapPin,
  Phone,
  Link,
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
  Globe,
  Mail,
  Calendar,
  Shield
} from 'lucide-react';

// ========== UNIFIED SCHEMAS ==========
const unifiedSchema = z.object({
  // Basic Information (organizationService)
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name cannot exceed 100 characters')
    .optional(),
  registrationNumber: z.string().optional(),
  organizationType: z.enum(['non-profit', 'government', 'educational', 'healthcare', 'other']).optional(),
  industry: z.string().optional(),

  // Organization Details (organizationService)
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  mission: z.string().max(500, 'Mission statement cannot exceed 500 characters').optional(),
  address: z.string().optional(),

  // Contact Information (organizationService)
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional(),

  // Role-Specific Data (roleProfileService)
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']).optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional().nullable(),
  companyType: z.enum([
    'non-profit', 'government', 'educational', 'healthcare', 'other',
    'startup', 'small-business', 'medium-business', 'large-enterprise',
    'multinational', 'community', 'ngo', 'charity', 'association'
  ]).optional(),
  companyValues: z.string().optional(),
  culture: z.string().max(500).optional(),
  specialties: z.string().optional(),

  // Social Links (profileService)
  linkedin: z.string().url('Please enter a valid LinkedIn URL').optional().or(z.literal('')),
  twitter: z.string().url('Please enter a valid Twitter URL').optional().or(z.literal('')),
  facebook: z.string().url('Please enter a valid Facebook URL').optional().or(z.literal('')),
  instagram: z.string().url('Please enter a valid Instagram URL').optional().or(z.literal('')),
  youtube: z.string().url('Please enter a valid YouTube URL').optional().or(z.literal('')),
});

type UnifiedFormData = z.infer<typeof unifiedSchema>;

interface OrganizationProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

type ServiceStatus = 'idle' | 'loading' | 'success' | 'error';
type LoadingState = {
  organizationService: ServiceStatus;
  profileService: ServiceStatus;
  roleProfileService: ServiceStatus;
};

// ========== CUSTOM HOOKS ==========
const useOrganizationData = () => {
  const [primaryData, setPrimaryData] = useState<OrganizationProfile | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [roleData, setRoleData] = useState<OrganizationProfileResponse['data'] | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    organizationService: 'idle',
    profileService: 'idle',
    roleProfileService: 'idle'
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const loadAllData = useCallback(async () => {
    setErrors([]);

    try {
      // Step 1: Load primary organization data
      setLoadingState(prev => ({ ...prev, organizationService: 'loading' }));
      const orgData = await organizationService.getMyOrganization();

      if (orgData) {
        setPrimaryData(orgData);
        setMode('edit');
        setLoadingState(prev => ({ ...prev, organizationService: 'success' }));

        // Step 2: Load dependent data in parallel
        setLoadingState(prev => ({
          ...prev,
          profileService: 'loading',
          roleProfileService: 'loading'
        }));

        const [profileResult, roleResult] = await Promise.allSettled([
          profileService.getProfile(),
          roleProfileService.getOrganizationProfile()
        ]);

        // Process profile service result
        if (profileResult.status === 'fulfilled') {
          setProfileData(profileResult.value);
          setLoadingState(prev => ({ ...prev, profileService: 'success' }));
        } else {
          console.warn('Profile service failed:', profileResult.reason);
          setLoadingState(prev => ({ ...prev, profileService: 'error' }));
          setErrors(prev => [...prev, 'Profile data unavailable']);
        }

        // Process role profile service result
        if (roleResult.status === 'fulfilled') {
          setRoleData(roleResult.value);
          setLoadingState(prev => ({ ...prev, roleProfileService: 'success' }));
        } else {
          console.warn('Role profile service failed:', roleResult.reason);
          setLoadingState(prev => ({ ...prev, roleProfileService: 'error' }));
          setErrors(prev => [...prev, 'Organization profile details unavailable']);
        }
      } else {
        setMode('create');
        setLoadingState(prev => ({ ...prev, organizationService: 'success' }));
      }
    } catch (error: any) {
      console.error('Failed to load organization data:', error);
      setLoadingState(prev => ({ ...prev, organizationService: 'error' }));
      setErrors(prev => [...prev, 'Failed to load organization registration data']);
    }
  }, []);

  const updateData = useCallback(async (updates: {
    basicInfo?: Partial<OrganizationProfile>;
    socialLinks?: SocialLinks;
    roleSpecific?: Parameters<typeof roleProfileService.updateOrganizationProfile>[0];
  }) => {
    const promises: Promise<any>[] = [];
    const orgId = primaryData?._id;

    if (!orgId && updates.basicInfo) {
      // Create new organization
      try {
        const newOrg = await organizationService.createOrganization(updates.basicInfo);
        setPrimaryData(newOrg);
        setMode('edit');
        return { success: true, created: true };
      } catch (error) {
        throw error;
      }
    }

    // Organization update
    if (orgId && updates.basicInfo) {
      promises.push(
        organizationService.updateOrganization(orgId, updates.basicInfo)
          .then(updated => setPrimaryData(updated))
      );
    }

    // Social links update
    if (updates.socialLinks && Object.keys(updates.socialLinks).length > 0) {
      promises.push(
        profileService.updateSocialLinks(updates.socialLinks)
          .then(updated => setProfileData(prev => prev ? { ...prev, socialLinks: updated } : null))
      );
    }

    // Role-specific update
    if (updates.roleSpecific) {
      promises.push(
        roleProfileService.updateOrganizationProfile(updates.roleSpecific)
          .then(updated => setRoleData(updated))
      );
    }

    if (promises.length === 0) {
      return { success: true };
    }

    try {
      const results = await Promise.allSettled(promises);
      const failed = results.filter(result => result.status === 'rejected');

      if (failed.length > 0) {
        throw new Error(`${failed.length} update(s) failed`);
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }, [primaryData]);

  return {
    primaryData,
    profileData,
    roleData,
    loadingState,
    errors,
    mode,
    loadAllData,
    updateData,
    setPrimaryData,
    setProfileData,
    setRoleData
  };
};

// ========== MAIN COMPONENT ==========
export const OrganizationProfileEditForm: React.FC<OrganizationProfileFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const {
    primaryData,
    profileData,
    roleData,
    loadingState,
    errors,
    mode,
    loadAllData,
    updateData,
    setProfileData
  } = useOrganizationData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');

  // Initialize form
  const formMethods = useForm<UnifiedFormData>({
    resolver: zodResolver(unifiedSchema),
    defaultValues: {
      name: '',
      registrationNumber: '',
      organizationType: undefined,
      industry: '',
      description: '',
      mission: '',
      address: '',
      phone: '',
      secondaryPhone: '',
      website: '',
      email: '',
      companySize: undefined,
      foundedYear: null,
      companyType: undefined,
      companyValues: '',
      culture: '',
      specialties: '',
      linkedin: '',
      twitter: '',
      facebook: '',
      instagram: '',
      youtube: ''
    }
  });

  const { handleSubmit, reset, formState: { isDirty } } = formMethods;

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Populate form when data is loaded
  useEffect(() => {
    if (mode === 'edit' && primaryData && (loadingState.organizationService === 'success')) {
      const formValues: Partial<UnifiedFormData> = {
        name: primaryData.name || '',
        registrationNumber: primaryData.registrationNumber || '',
        organizationType: primaryData.organizationType as any,
        industry: primaryData.industry || '',
        description: primaryData.description || '',
        mission: primaryData.mission || '',
        address: primaryData.address || '',
        phone: primaryData.phone || '',
        secondaryPhone: primaryData.secondaryPhone || '',
        website: primaryData.website || '',
        email: primaryData.user?.email || '',
      };

      // Set image URLs
      if (primaryData.logoFullUrl) setLogoUrl(primaryData.logoFullUrl);
      if (primaryData.bannerFullUrl) setBannerUrl(primaryData.bannerFullUrl);

      // Add profile data if available
      if (profileData && loadingState.profileService === 'success') {
        formValues.linkedin = profileData.socialLinks?.linkedin || '';
        formValues.twitter = profileData.socialLinks?.twitter || '';
        formValues.facebook = profileData.socialLinks?.facebook || '';
        formValues.instagram = profileData.socialLinks?.instagram || '';
        formValues.youtube = profileData.socialLinks?.youtube || '';

        // Set images from profile if organization images not available
        if (!logoUrl) {
          const avatarUrl = profileService.getAvatarUrl(profileData);
          if (avatarUrl) setLogoUrl(avatarUrl);
        }
        if (!bannerUrl) {
          const coverUrl = profileService.getCoverUrl(profileData);
          if (coverUrl) setBannerUrl(coverUrl);
        }
      }

      // Add role-specific data if available
      if (roleData && loadingState.roleProfileService === 'success') {
        formValues.companySize = roleData.companyInfo?.size;
        formValues.foundedYear = roleData.companyInfo?.foundedYear || null;
        formValues.companyType = roleData.companyInfo?.companyType;
        formValues.companyValues = Array.isArray(roleData.companyInfo?.values)
          ? roleData.companyInfo.values.join(', ')
          : roleData.companyInfo?.values || '';
        formValues.culture = roleData.companyInfo?.culture || '';
        formValues.specialties = Array.isArray(roleData.companyInfo?.specialties)
          ? roleData.companyInfo.specialties.join(', ')
          : roleData.companyInfo?.specialties || '';
      }

      reset(formValues);
    }
  }, [primaryData, profileData, roleData, loadingState, mode, reset, logoUrl, bannerUrl]);

  // Handle form submission
  const onSubmit = async (data: UnifiedFormData) => {
    try {
      setIsSubmitting(true);

      // Transform form data for different services
      const updates = {
        basicInfo: {
          name: data.name,
          registrationNumber: data.registrationNumber,
          organizationType: data.organizationType,
          industry: data.industry,
          description: data.description,
          mission: data.mission,
          address: data.address,
          phone: data.phone,
          secondaryPhone: data.secondaryPhone,
          website: data.website,
        },
        socialLinks: {
          linkedin: data.linkedin,
          twitter: data.twitter,
          facebook: data.facebook,
          instagram: data.instagram,
          youtube: data.youtube,
        },
        roleSpecific: {
          companyInfo: {
            size: data.companySize,
            foundedYear: data.foundedYear,
            companyType: data.companyType,
            mission: data.mission,
            values: data.companyValues ? data.companyValues.split(',').map(v => v.trim()).filter(v => v) : [],
            culture: data.culture,
            specialties: data.specialties ? data.specialties.split(',').map(s => s.trim()).filter(s => s) : [],
          }
        }
      };

      // Execute updates
      const result = await updateData(updates);

      if (result.success) {
        toast.success(result.created
          ? 'Organization created successfully!'
          : 'Organization updated successfully!'
        );
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save organization data');
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle image uploads
  const handleLogoComplete = async (avatar: CloudinaryImage) => {
    try {
      setLogoUrl(avatar.secure_url);

      // Update profile data locally for immediate feedback
      if (profileData) {
        setProfileData({
          ...profileData,
          avatar
        });
      }

      toast.success('Logo updated successfully!');
    } catch (error) {
      console.error('Error updating logo:', error);
      toast.error('Failed to update logo');
    }
  };

  const handleBannerComplete = async (cover: CloudinaryImage) => {
    try {
      setBannerUrl(cover.secure_url);

      // Update profile data locally for immediate feedback
      if (profileData) {
        setProfileData({
          ...profileData,
          cover
        });
      }

      toast.success('Banner updated successfully!');
    } catch (error) {
      console.error('Error updating banner:', error);
      toast.error('Failed to update banner');
    }
  };

  // Calculate overall loading state
  const isLoading = loadingState.organizationService === 'loading' ||
    loadingState.profileService === 'loading' ||
    loadingState.roleProfileService === 'loading';

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <h2 className={`text-xl font-semibold mb-2 ${colorClasses.text.darkNavy}`}>
          Loading Organization Profile
        </h2>
        <div className="space-y-2 w-full max-w-md">
          <div className="flex items-center justify-between text-sm">
            <span className={colorClasses.text.gray600}>Organization Data</span>
            {loadingState.organizationService === 'loading' && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {loadingState.organizationService === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
            {loadingState.organizationService === 'error' && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
          {mode === 'edit' && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className={colorClasses.text.gray600}>Profile Data</span>
                {loadingState.profileService === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {loadingState.profileService === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {loadingState.profileService === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className={colorClasses.text.gray600}>Organization Details</span>
                {loadingState.roleProfileService === 'loading' && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {loadingState.roleProfileService === 'success' && (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                )}
                {loadingState.roleProfileService === 'error' && (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...formMethods}>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${colorClasses.text.darkNavy}`}>
                {mode === 'create' ? 'Register Organization' : 'Organization Profile'}
              </h1>
              <p className={`mt-2 ${colorClasses.text.gray600}`}>
                {mode === 'create'
                  ? 'Complete your organization registration to get started'
                  : 'Manage your organization\'s public profile and information'}
              </p>
            </div>

            {mode === 'edit' && onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="shrink-0"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Service Status Indicators */}
          {errors.length > 0 && (
            <div className={`p-4 rounded-lg border ${colorClasses.border.amber} ${colorClasses.bg.amber} bg-opacity-10`}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className={`font-medium ${colorClasses.text.darkNavy}`}>
                    Partial Data Loaded
                  </h4>
                  <p className={`text-sm mt-1 ${colorClasses.text.gray700}`}>
                    Some services returned errors: {errors.join(', ')}.
                    You can still edit available fields.
                  </p>
                  <button
                    onClick={loadAllData}
                    className={`mt-2 text-sm font-medium ${colorClasses.text.blue} hover:underline`}
                  >
                    Retry Loading Data
                  </button>
                </div>
              </div>
            </div>
          )}

          <Separator className={colorClasses.border.gray400} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Branding & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Branding Card */}
            <Card className={`border ${colorClasses.border.gray400} ${colorClasses.bg.white}`}>
              <CardHeader className="pb-4">
                <CardTitle className={`flex items-center gap-2 ${colorClasses.text.darkNavy}`}>
                  <Building2 className="w-5 h-5" />
                  Organization Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  userId={primaryData?._id || 'organization'}
                />

                {mode === 'edit' && (
                  <div className={`pt-4 border-t ${colorClasses.border.gray400}`}>
                    <h4 className={`text-sm font-medium mb-3 ${colorClasses.text.gray800}`}>
                      Profile Status
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Registration Complete</span>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Profile Data</span>
                        {loadingState.profileService === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-amber-600">Partial</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Organization Details</span>
                        {loadingState.roleProfileService === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-amber-600">Partial</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            {mode === 'edit' && (
              <Card className={`border ${colorClasses.border.gray400} ${colorClasses.bg.white}`}>
                <CardHeader className="pb-4">
                  <CardTitle className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(primaryData?.website || '#', '_blank')}
                    disabled={!primaryData?.website}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`mailto:${primaryData?.user?.email || ''}`)}
                    disabled={!primaryData?.user?.email}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Email
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open(`tel:${primaryData?.phone || ''}`)}
                    disabled={!primaryData?.phone}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Organization
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Form Content */}
          <div className="lg:col-span-2">
            <Card className={`border ${colorClasses.border.gray400} ${colorClasses.bg.white}`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className={`${colorClasses.text.darkNavy}`}>
                    {mode === 'create' ? 'Registration Details' : 'Edit Profile'}
                  </CardTitle>

                  {/* Progress Indicator */}
                  {mode === 'edit' && (
                    <div className={`px-3 py-1 rounded-full ${colorClasses.bg.blue} ${colorClasses.text.blue}`}>
                      <span className="text-sm font-medium">Ready to Update</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {/* Form Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-6">
                    <TabsTrigger value="basic">
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Basic</span>
                    </TabsTrigger>
                    <TabsTrigger value="details">
                      <FileText className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Details</span>
                    </TabsTrigger>
                    <TabsTrigger value="contact">
                      <Phone className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Contact</span>
                    </TabsTrigger>
                    <TabsTrigger value="profile">
                      <Target className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Profile</span>
                    </TabsTrigger>
                    <TabsTrigger value="social">
                      <Link className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Social</span>
                    </TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Basic Information Tab */}
                    <TabsContent value="basic" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy}`}>
                          Organization Registration
                        </h3>
                        <p className={`text-sm ${colorClasses.text.gray600}`}>
                          Core organization details for registration and verification
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Organization Name *
                          </label>
                          <input
                            type="text"
                            {...formMethods.register('name')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="e.g., Green Earth Initiative"
                            disabled={mode === 'edit'}
                          />
                          {formMethods.formState.errors.name && (
                            <p className="text-sm text-red-600">{formMethods.formState.errors.name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Registration Number
                          </label>
                          <input
                            type="text"
                            {...formMethods.register('registrationNumber')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="e.g., 123456789"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Organization Type
                          </label>
                          <select
                            {...formMethods.register('organizationType')}
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
                            {...formMethods.register('industry')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="e.g., Education, Environment, Healthcare"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Organization Details Tab */}
                    <TabsContent value="details" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy}`}>
                          About Your Organization
                        </h3>
                        <p className={`text-sm ${colorClasses.text.gray600}`}>
                          Tell us about your organization's work, mission, and impact
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Description
                          </label>
                          <textarea
                            {...formMethods.register('description')}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="Describe your organization's purpose, activities, and impact..."
                          />
                          {formMethods.formState.errors.description && (
                            <p className="text-sm text-red-600">{formMethods.formState.errors.description.message}</p>
                          )}
                          <p className="text-xs text-gray-500">Max 1000 characters</p>
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Mission Statement
                          </label>
                          <textarea
                            {...formMethods.register('mission')}
                            rows={3}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="What is your organization's core mission?"
                          />
                          {formMethods.formState.errors.mission && (
                            <p className="text-sm text-red-600">{formMethods.formState.errors.mission.message}</p>
                          )}
                          <p className="text-xs text-gray-500">Max 500 characters</p>
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Address
                          </label>
                          <input
                            type="text"
                            {...formMethods.register('address')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="e.g., 123 Main Street, City, State, ZIP Code"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Contact Information Tab */}
                    <TabsContent value="contact" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy}`}>
                          Contact Information
                        </h3>
                        <p className={`text-sm ${colorClasses.text.gray600}`}>
                          How people can get in touch with your organization
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Primary Phone
                          </label>
                          <input
                            type="tel"
                            {...formMethods.register('phone')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Secondary Phone
                          </label>
                          <input
                            type="tel"
                            {...formMethods.register('secondaryPhone')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="+1 (555) 987-6543"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Website
                          </label>
                          <input
                            type="url"
                            {...formMethods.register('website')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="https://example.org"
                          />
                          {formMethods.formState.errors.website && (
                            <p className="text-sm text-red-600">{formMethods.formState.errors.website.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Contact Email
                          </label>
                          <input
                            type="email"
                            {...formMethods.register('email')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="contact@example.org"
                            disabled
                          />
                          <p className="text-xs text-gray-500">Email cannot be changed here</p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Organization Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy}`}>
                          Organization Profile
                        </h3>
                        <p className={`text-sm ${colorClasses.text.gray600}`}>
                          Additional organization-specific information
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Organization Size
                          </label>
                          <select
                            {...formMethods.register('companySize')}
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
                            {...formMethods.register('foundedYear', { valueAsNumber: true })}
                            min="1800"
                            max={new Date().getFullYear()}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="2010"
                          />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Core Values (comma separated)
                          </label>
                          <input
                            type="text"
                            {...formMethods.register('companyValues')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="e.g., Integrity, Compassion, Innovation, Collaboration"
                          />
                          <p className="text-xs text-gray-500">
                            Enter values separated by commas
                          </p>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Organization Culture
                          </label>
                          <textarea
                            {...formMethods.register('culture')}
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
                            {...formMethods.register('specialties')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="e.g., Environmental Conservation, Youth Education, Community Development"
                          />
                          <p className="text-xs text-gray-500">
                            Enter specialties separated by commas
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Social Links Tab */}
                    <TabsContent value="social" className="space-y-6">
                      <div className="space-y-4">
                        <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy}`}>
                          Social Media Links
                        </h3>
                        <p className={`text-sm ${colorClasses.text.gray600}`}>
                          Connect your organization's social media profiles
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            LinkedIn
                          </label>
                          <input
                            type="url"
                            {...formMethods.register('linkedin')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="https://linkedin.com/company/your-organization"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Twitter / X
                          </label>
                          <input
                            type="url"
                            {...formMethods.register('twitter')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="https://twitter.com/your-organization"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Facebook
                          </label>
                          <input
                            type="url"
                            {...formMethods.register('facebook')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="https://facebook.com/your-organization"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            Instagram
                          </label>
                          <input
                            type="url"
                            {...formMethods.register('instagram')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="https://instagram.com/your-organization"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${colorClasses.text.gray800}`}>
                            YouTube
                          </label>
                          <input
                            type="url"
                            {...formMethods.register('youtube')}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${colorClasses.border.gray400}`}
                            placeholder="https://youtube.com/@your-organization"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Form Actions */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-col-reverse md:flex-row justify-between gap-4">
                        <div>
                          {mode === 'create' && (
                            <div className={`p-4 rounded-lg ${colorClasses.bg.blue} bg-opacity-10`}>
                              <div className="flex items-start gap-3">
                                <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                  <h4 className={`text-sm font-medium ${colorClasses.text.darkNavy}`}>
                                    Ready to Register?
                                  </h4>
                                  <p className={`text-xs mt-1 ${colorClasses.text.gray600}`}>
                                    Fill in the basic information above to create your organization profile.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          {isDirty && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => reset()}
                              disabled={isSubmitting}
                            >
                              Reset Changes
                            </Button>
                          )}
                          <Button
                            type="submit"
                            disabled={isSubmitting || (!isDirty && mode === 'edit')}
                            className="min-w-[120px]"
                          >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {mode === 'create' ? 'Register Organization' : 'Save Changes'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FormProvider>
  );
};

export default OrganizationProfileEditForm;