// src/components/organization/OrganizationForm.tsx
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { OrganizationProfile } from '@/services/organizationService';
import { profileService, CloudinaryImage } from '@/services/profileService';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Building2, Target, X, Phone, Cloud, Check, Loader2, Plus, Save } from 'lucide-react';
import Button from '../forms/Button';
import { organizationService } from '@/services/organizationService';
import { toast } from 'sonner';
import { AvatarUploader } from '@/components/profile/AvatarUploader';
import { colorClasses } from '@/utils/color';

const organizationFormSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  registrationNumber: z.string().optional(),
  organizationType: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  mission: z.string().max(500, 'Mission cannot exceed 500 characters').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  website: z.string().optional(),
}).refine((data) => {
  // Custom validation for website - only validate if provided
  if (data.website && data.website.trim() !== '') {
    try {
      new URL(data.website);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Please enter a valid URL (include http:// or https://)',
  path: ['website'],
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

interface OrganizationFormProps {
  organization?: OrganizationProfile | null;
  onSubmit: (data: OrganizationFormValues, isCreateMode: boolean) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  currentAvatar?: string | CloudinaryImage | null;
  currentCover?: string | CloudinaryImage | null;
}

export default function OrganizationForm({
  organization,
  onSubmit,
  onCancel,
  loading = false,
  currentAvatar,
  currentCover
}: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarData, setAvatarData] = useState<CloudinaryImage | null>(null);
  const [coverData, setCoverData] = useState<CloudinaryImage | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(!organization);

  // Initialize avatar and cover data from props
  useEffect(() => {
    if (currentAvatar && typeof currentAvatar !== 'string' && 'secure_url' in currentAvatar) {
      setAvatarData(currentAvatar);
    }
    if (currentCover && typeof currentCover !== 'string' && 'secure_url' in currentCover) {
      setCoverData(currentCover);
    }

    // Determine if we're in create or update mode
    setIsCreateMode(!organization);
  }, [currentAvatar, currentCover, organization]);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization?.name || '',
      registrationNumber: organization?.registrationNumber || '',
      organizationType: organization?.organizationType || 'non-profit',
      industry: organization?.industry || '',
      description: organization?.description || '',
      mission: organization?.mission || '',
      address: organization?.address || '',
      phone: organization?.phone || '',
      secondaryPhone: organization?.secondaryPhone || '',
      website: organization?.website || '',
    },
  });

  const handleAvatarComplete = async (avatar: CloudinaryImage, thumbnailUrl?: string) => {
    try {
      setAvatarUploading(true);
      setAvatarData(avatar);

      toast.success('Organization logo uploaded successfully!', {
        description: 'Logo is now stored securely in the cloud.',
        icon: <Check className="w-5 h-5 text-green-500" />,
      });

    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload logo', {
        description: error.message || 'Please try again',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleCoverComplete = async (cover: CloudinaryImage, thumbnailUrl?: string) => {
    try {
      setCoverUploading(true);
      setCoverData(cover);

      toast.success('Organization banner uploaded successfully!', {
        description: 'Banner is now stored securely in the cloud.',
        icon: <Check className="w-5 h-5 text-green-500" />,
      });

    } catch (error: any) {
      console.error('Cover upload error:', error);
      toast.error('Failed to upload banner', {
        description: error.message || 'Please try again',
      });
    } finally {
      setCoverUploading(false);
    }
  };

  const handleUploadError = (type: 'avatar' | 'cover', error: any) => {
    console.error(`${type} upload error:`, error);
    toast.error(`Failed to upload ${type === 'avatar' ? 'logo' : 'banner'}`, {
      description: error.message || 'Please try again',
    });
  };

  const handleSubmit = async (data: OrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      // Submit organization data (images are already uploaded to profile)
      await onSubmit(data, isCreateMode);

    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  // Prevent form submission when clicking on avatar area
  const handleAvatarAreaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const organizationTypeOptions = organizationService.getOrganizationTypeOptions();

  return (
    <Card className={`border-0 shadow-lg ${colorClasses.bg.white} dark:bg-gray-800 transition-colors duration-200`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className={`text-2xl flex items-center gap-2 ${colorClasses.text.darkNavy} dark:text-white`}>
              <Building2 className={`w-6 h-6 ${colorClasses.text.teal} dark:text-teal-400`} />
              {isCreateMode ? 'Create Organization Profile' : 'Edit Organization Profile'}
            </CardTitle>
            <CardDescription className={`${colorClasses.text.gray600} dark:text-gray-400`}>
              {isCreateMode
                ? 'Fill in your organization details to get started'
                : 'Update your organization information'}
              <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorClasses.bg.tealLight} ${colorClasses.text.teal} dark:bg-teal-900/30 dark:text-teal-400`}>
                {isCreateMode ? 'New Profile' : 'Existing Profile'}
              </span>
            </CardDescription>
          </div>
          <Button variant="ghost" size="md" onClick={handleCancel} disabled={isSubmitting || avatarUploading || coverUploading}>
            <X className={`w-4 h-4 ${colorClasses.text.gray600} dark:text-gray-400`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Media Upload Section */}
            <div className="space-y-6">
              <div className={`p-4 ${colorClasses.bg.tealLight} dark:bg-teal-900/20 rounded-xl border ${colorClasses.border.teal} dark:border-teal-800`}>
                <div className="flex items-center gap-2 mb-4">
                  <Cloud className={`w-5 h-5 ${colorClasses.text.teal} dark:text-teal-400`} />
                  <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} dark:text-white`}>Cloud Storage Powered Media</h3>
                </div>
                <p className={`text-sm ${colorClasses.text.gray600} dark:text-gray-400 mb-4`}>
                  Organization logo and banner are stored securely in cloud storage. Upload them here and they will automatically sync with your profile.
                </p>

                {/* Wrap AvatarUploader to prevent form submission on click */}
                <div onClick={handleAvatarAreaClick} onMouseDown={handleAvatarAreaClick}>
                  <AvatarUploader
                    currentAvatar={currentAvatar}
                    currentCover={currentCover}
                    onAvatarComplete={handleAvatarComplete}
                    onCoverComplete={handleCoverComplete}
                    onError={handleUploadError}
                    size="md"
                    type="both"
                    showHelperText={true}
                    maxFileSize={{
                      avatar: 5,
                      cover: 10
                    }}
                    allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
                    aspectRatio={{
                      avatar: '1:1',
                      cover: '16:9'
                    }}
                    preventFormSubmission={true}
                  />
                </div>

                {/* Upload Status */}
                {(avatarUploading || coverUploading) && (
                  <div className={`mt-4 p-3 ${colorClasses.bg.tealLight} dark:bg-teal-900/30 rounded-lg border ${colorClasses.border.teal} dark:border-teal-800`}>
                    <div className={`flex items-center gap-2 ${colorClasses.text.teal} dark:text-teal-400 text-sm`}>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {avatarUploading && coverUploading
                          ? 'Uploading logo and banner...'
                          : avatarUploading
                            ? 'Uploading logo...'
                            : 'Uploading banner...'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300`}>Organization Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter organization name"
                        {...field}
                        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registrationNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300`}>Registration Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter registration number"
                        {...field}
                        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription className={`${colorClasses.text.gray600} dark:text-gray-500`}>Official registration identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300`}>Organization Type</FormLabel>
                    <FormControl>
                      <select
                        className={`w-full px-3 py-2 border ${colorClasses.border.gray300} dark:border-gray-700 ${colorClasses.bg.white} dark:bg-gray-700 ${colorClasses.text.darkNavy} dark:text-white rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:outline-none transition-colors`}
                        {...field}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      >
                        {organizationTypeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300`}>Industry</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Education, Healthcare, Environment"
                        {...field}
                        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300 flex items-center gap-2`}>
                      <Phone className={`w-4 h-4 ${colorClasses.text.teal} dark:text-teal-400`} />
                      Primary Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                        }}
                        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription className={`${colorClasses.text.gray600} dark:text-gray-500`}>Optional - include country code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300 flex items-center gap-2`}>
                      <Phone className={`w-4 h-4 ${colorClasses.text.teal} dark:text-teal-400`} />
                      Secondary Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+1 (555) 123-4567"
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                        }}
                        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription className={`${colorClasses.text.gray600} dark:text-gray-500`}>Optional - alternative contact</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300`}>Website</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://yourorganization.org"
                        {...field}
                        onChange={(e) => {
                          let value = e.target.value;
                          // Auto-prepend https:// if user doesn't provide protocol
                          if (value && !value.startsWith('http://') && !value.startsWith('https://') && value.includes('.')) {
                            value = 'https://' + value;
                          }
                          field.onChange(value);
                        }}
                        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription className={`${colorClasses.text.gray600} dark:text-gray-500`}>Include http:// or https://</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300`}>Address</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter organization address"
                        {...field}
                        className={`border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mission"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300 flex items-center gap-2`}>
                      <Target className={`w-4 h-4 ${colorClasses.text.teal} dark:text-teal-400`} />
                      Mission Statement
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is your organization's mission and purpose?"
                        className={`min-h-24 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        {...field}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription className={`${colorClasses.text.gray600} dark:text-gray-500`}>Max 500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className={`${colorClasses.text.gray700} dark:text-gray-300`}>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your organization, services, and impact..."
                        className={`min-h-32 border-gray-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white focus:border-teal-500 focus:ring-teal-500`}
                        {...field}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription className={`${colorClasses.text.gray600} dark:text-gray-500`}>Max 1000 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t ${colorClasses.border.gray200} dark:border-gray-700">
              <Button
                type="submit"
                disabled={isSubmitting || loading || avatarUploading || coverUploading}
                className="min-w-32 bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isCreateMode ? 'Creating...' : 'Updating...'}
                  </>
                ) : isCreateMode ? (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Profile
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Update Profile
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || avatarUploading || coverUploading}
                className={`border-gray-300 dark:border-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                Cancel
              </Button>
            </div>

            {/* Help Text */}
            <div className={`p-4 ${colorClasses.bg.tealLight} dark:bg-teal-900/20 rounded-lg border ${colorClasses.border.teal} dark:border-teal-800`}>
              <p className={`text-sm ${colorClasses.text.teal} dark:text-teal-400 flex items-start gap-2`}>
                <span className="font-medium">Note:</span>
                {isCreateMode
                  ? 'You are creating a new organization profile. This will be linked to your user account.'
                  : 'You are updating an existing organization profile. All changes will be saved to your profile.'
                }
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}