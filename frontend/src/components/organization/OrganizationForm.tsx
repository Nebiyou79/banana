// src/components/organization/OrganizationForm.tsx - UPDATED WITH SECONDARY PHONE
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { OrganizationProfile } from '@/services/organizationService';
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
import { Building2, Target, X, Upload, Trash2, ImageDown, Phone } from 'lucide-react';
import Button from '../forms/Button';
import { organizationService } from '@/services/organizationService';

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
  onSubmit: (data: OrganizationFormValues & { logoFile?: File; bannerFile?: File }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export default function OrganizationForm({ 
  organization, 
  onSubmit, 
  onCancel, 
  loading = false 
}: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize previews from existing organization
  useEffect(() => {
    if (organization?.logoUrl) {
      const url = organizationService.getFullImageUrl(organization.logoUrl);
      if (url) setLogoPreview(url);
    }
    if (organization?.bannerUrl) {
      const url = organizationService.getFullImageUrl(organization.bannerUrl);
      if (url) setBannerPreview(url);
    }
  }, [organization]);

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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        console.error('Logo file too large');
        return;
      }
      if (!file.type.startsWith('image/')) {
        console.error('Invalid logo file type');
        return;
      }
      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
    } catch (error) {
      console.error('Error processing logo file:', error);
    }
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        console.error('Banner file too large');
        return;
      }
      if (!file.type.startsWith('image/')) {
        console.error('Invalid banner file type');
        return;
      }
      setBannerFile(file);
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
    } catch (error) {
      console.error('Error processing banner file:', error);
    }
  };

  const removeLogo = () => {
    try {
      if (logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoFile(null);
      setLogoPreview('');
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing logo:', error);
    }
  };

  const removeBanner = () => {
    try {
      if (bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
      setBannerFile(null);
      setBannerPreview('');
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing banner:', error);
    }
  };

  const handleSubmit = async (data: OrganizationFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        logoFile: logoFile || undefined,
        bannerFile: bannerFile || undefined
      });
      // Success toast is handled by the service layer
    } catch (error) {
      // Errors are now handled by the service layer through toast
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    try {
      // Cleanup blob URLs
      if (logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
      onCancel();
    } catch (error) {
      console.error('Error canceling form:', error);
    }
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (logoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview);
      }
      if (bannerPreview.startsWith('blob:')) {
        URL.revokeObjectURL(bannerPreview);
      }
    };
  }, [logoPreview, bannerPreview]);

  const organizationTypeOptions = organizationService.getOrganizationTypeOptions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {organization ? 'Edit Organization Profile' : 'Create Organization Profile'}
            </CardTitle>
            <CardDescription>
              {organization ? 'Update your organization information' : 'Fill in your organization details to get started'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="md" onClick={handleCancel} disabled={isSubmitting}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Logo and Banner Upload Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <FormLabel>Organization Logo</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-gray-400 transition-colors">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-xl overflow-hidden mx-auto">
                          <img 
                            src={logoPreview} 
                            alt="Logo preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                          onClick={removeLogo}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                          <ImageDown className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Upload Logo</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {logoPreview ? 'Change Logo' : 'Select Logo'}
                    </Button>
                  </div>
                </div>

                {/* Banner Upload */}
                <div className="space-y-4">
                  <FormLabel>Organization Banner</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-gray-400 transition-colors">
                    {bannerPreview ? (
                      <div className="relative">
                        <div className="w-full h-24 rounded-lg overflow-hidden">
                          <img 
                            src={bannerPreview} 
                            alt="Banner preview" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                          onClick={removeBanner}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                          <ImageDown className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Upload Banner</p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                      id="banner-upload"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => bannerInputRef.current?.click()}
                      disabled={isSubmitting}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {bannerPreview ? 'Change Banner' : 'Select Banner'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Organization Details Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization name" {...field} disabled={isSubmitting} />
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
                    <FormLabel>Registration Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter registration number" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>Official registration identifier</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <FormControl>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-colors"
                        {...field}
                        disabled={isSubmitting}
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
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Education, Healthcare, Environment" {...field} disabled={isSubmitting} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
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
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Optional - include country code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secondaryPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
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
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Optional - alternative contact</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
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
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Include http:// or https://</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization address" {...field} disabled={isSubmitting} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Mission Statement
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What is your organization's mission and purpose?"
                        className="min-h-24"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Max 500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your organization, services, and impact..."
                        className="min-h-32"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Max 1000 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <Button type="submit" disabled={isSubmitting || loading} className="min-w-32">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : organization ? (
                  'Update Profile'
                ) : (
                  'Create Profile'
                )}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}