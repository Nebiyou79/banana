// components/company/CompanyForm.tsx - UPDATED WITH CREATE/UPDATE LOGIC
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CompanyProfile as Company } from '@/services/companyService';
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
import { Building2, X, Shield, Globe, Phone, MapPin, Cloud, Check, Loader2, Plus, Save } from 'lucide-react';
import Button from '../forms/Button';
import { toast } from 'sonner';
import { AvatarUploader } from '@/components/profile/AvatarUploader';

const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100, 'Company name is too long'),
  tin: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: CompanyFormValues, isCreateMode: boolean) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  currentAvatar?: string | CloudinaryImage | null;
  currentCover?: string | CloudinaryImage | null;
}

export default function CompanyForm({
  company,
  onSubmit,
  onCancel,
  loading = false,
  currentAvatar,
  currentCover
}: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [avatarData, setAvatarData] = useState<CloudinaryImage | null>(null);
  const [coverData, setCoverData] = useState<CloudinaryImage | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(!company);

  // Initialize avatar and cover data from props
  useEffect(() => {
    if (currentAvatar && typeof currentAvatar !== 'string' && 'secure_url' in currentAvatar) {
      setAvatarData(currentAvatar);
    }
    if (currentCover && typeof currentCover !== 'string' && 'secure_url' in currentCover) {
      setCoverData(currentCover);
    }

    // Determine if we're in create or update mode
    setIsCreateMode(!company);
  }, [currentAvatar, currentCover, company]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: company?.name || '',
      tin: company?.tin || '',
      industry: company?.industry || '',
      description: company?.description || '',
      address: company?.address || '',
      phone: company?.phone || '',
      website: company?.website || '',
    },
  });

  const handleAvatarComplete = async (avatar: CloudinaryImage, thumbnailUrl?: string) => {
    try {
      setAvatarUploading(true);
      setAvatarData(avatar);

      toast.success('Company logo uploaded successfully!', {
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

      toast.success('Company banner uploaded successfully!', {
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

  const handleSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    try {
      // Submit company data (images are already uploaded to profile)
      await onSubmit(data, isCreateMode);

    } catch (error) {
      console.error('Form submission error:', error);
      throw error; // Re-throw to be handled by the form
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              {isCreateMode ? 'Create Company Profile' : 'Edit Company Profile'}
            </CardTitle>
            <CardDescription className="text-lg mt-2 text-gray-600">
              {isCreateMode
                ? 'Fill in your company details to get started'
                : 'Update your company information'}
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {isCreateMode ? 'New Profile' : 'Existing Profile'}
              </span>
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="md"
            onClick={handleCancel}
            className="hover:bg-red-50 hover:text-red-600 transition-colors"
            disabled={isSubmitting || avatarUploading || coverUploading}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Media Upload Section */}
            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <Cloud className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Cloud Storage Powered Media</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Company logo and banner are stored securely in cloud storage. Upload them here and they will automatically sync with your profile.
                </p>

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
                />

                {/* Upload Status */}
                {(avatarUploading || coverUploading) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 text-sm">
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

            {/* Company Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Company Name *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company name"
                        {...field}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-600" />
                      TIN Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter TIN number"
                        {...field}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription>Tax Identification Number</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">Industry</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Technology, Healthcare, Education"
                        {...field}
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
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
                    <FormLabel className="text-gray-700 font-semibold flex items-center gap-2">
                      <Phone className="w-4 h-4 text-green-600" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter phone number"
                        {...field}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500 transition-colors"
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4 text-purple-600" />
                      Website
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://yourcompany.com"
                        {...field}
                        className="border-gray-300 focus:border-purple-500 focus:ring-purple-500 transition-colors"
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-gray-700 font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-600" />
                      Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter company address"
                        {...field}
                        className="border-gray-300 focus:border-red-500 focus:ring-red-500 transition-colors"
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-gray-700 font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your company, services, and mission..."
                        className="min-h-32 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors resize-none"
                        {...field}
                        disabled={isSubmitting || avatarUploading || coverUploading}
                      />
                    </FormControl>
                    <FormDescription className="text-gray-500">
                      Max 1000 characters • {field.value?.length || 0}/1000
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={isSubmitting || loading || avatarUploading || coverUploading}
                className="min-w-32 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
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
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
            </div>

            {/* Help Text */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 flex items-start gap-2">
                <span className="font-medium">Note:</span>
                {isCreateMode
                  ? 'You are creating a new company profile. This will be linked to your user account.'
                  : 'You are updating an existing company profile. All changes will be saved to your profile.'
                }
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}