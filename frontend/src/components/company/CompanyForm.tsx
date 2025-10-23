/* eslint-disable @typescript-eslint/no-unused-vars */
// components/company/CompanyForm.tsx - FIXED & ENHANCED
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CompanyProfile as Company } from '@/services/companyService';
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
import { Building2, X, Upload, Trash2, ImageDown, Shield, Globe, Phone, MapPin } from 'lucide-react';
import Button from '../forms/Button';
import { toast } from '@/hooks/use-toast';
import { getSafeImageUrl } from '@/lib/image-utils';

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
  onSubmit: (data: CompanyFormValues & { logoFile?: File; bannerFile?: File }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CompanyForm({ company, onSubmit, onCancel, loading = false }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [bannerPreview, setBannerPreview] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Initialize previews from existing company
  useEffect(() => {
    if (company?.logoUrl) {
      const url = getSafeImageUrl(company.logoUrl);
      if (url) setLogoPreview(url);
    }
    if (company?.bannerUrl) {
      const url = getSafeImageUrl(company.bannerUrl);
      if (url) setBannerPreview(url);
    }
  }, [company]);

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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Logo must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (PNG, JPG, JPEG, WebP)',
          variant: 'destructive',
        });
        return;
      }

      setLogoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setLogoPreview(previewUrl);
      
      toast({
        title: 'Logo selected',
        description: 'Logo ready for upload',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to process logo file',
        variant: 'destructive',
      });
    }
  };

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Banner must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (PNG, JPG, JPEG, WebP)',
          variant: 'destructive',
        });
        return;
      }

      setBannerFile(file);
      const previewUrl = URL.createObjectURL(file);
      setBannerPreview(previewUrl);
      
      toast({
        title: 'Banner selected',
        description: 'Banner ready for upload',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: 'Failed to process banner file',
        variant: 'destructive',
      });
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
      toast({
        title: 'Logo removed',
        description: 'Logo has been cleared',
        variant: 'warning',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove logo',
        variant: 'destructive',
      });
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
      toast({
        title: 'Banner removed',
        description: 'Banner has been cleared',
        variant: 'warning',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove banner',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        logoFile: logoFile || undefined,
        bannerFile: bannerFile || undefined
      });
    } catch (error) {
      console.error('Form submission error:', error);
      // Error is handled by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cleanup blob URLs
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

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              {company ? 'Edit Company Profile' : 'Create Company Profile'}
            </CardTitle>
            <CardDescription className="text-lg mt-2 text-gray-600">
              {company ? 'Update your company information' : 'Fill in your company details to get started'}
            </CardDescription>
          </div>
          <Button 
            variant="ghost" 
            size="md" 
            onClick={onCancel}
            className="hover:bg-red-50 hover:text-red-600 transition-colors"
            disabled={isSubmitting}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <FormLabel className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <ImageDown className="w-4 h-4 text-blue-600" />
                    </div>
                    Company Logo
                  </FormLabel>
                  <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 text-center hover:border-blue-300 transition-all duration-300 bg-white/50 backdrop-blur-sm group">
                    {logoPreview ? (
                      <div className="relative">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden mx-auto shadow-lg ring-2 ring-blue-200 group-hover:ring-blue-300 transition-all">
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
                          className="absolute -top-2 -right-2 w-7 h-7 p-0 rounded-full shadow-lg"
                          onClick={removeLogo}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                          <ImageDown className="w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">Upload Logo</p>
                          <p className="text-sm text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
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
                      className="mt-4 bg-white border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all"
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
                  <FormLabel className="text-lg font-semibold flex items-center gap-2 text-gray-700">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <ImageDown className="w-4 h-4 text-purple-600" />
                    </div>
                    Company Banner
                  </FormLabel>
                  <div className="border-2 border-dashed border-purple-200 rounded-2xl p-6 text-center hover:border-purple-300 transition-all duration-300 bg-white/50 backdrop-blur-sm group">
                    {bannerPreview ? (
                      <div className="relative">
                        <div className="w-full h-24 rounded-xl overflow-hidden shadow-lg ring-2 ring-purple-200 group-hover:ring-purple-300 transition-all">
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
                          className="absolute -top-2 -right-2 w-7 h-7 p-0 rounded-full shadow-lg"
                          onClick={removeBanner}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                          <ImageDown className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-base font-semibold text-gray-900">Upload Banner</p>
                          <p className="text-sm text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
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
                      className="mt-4 bg-white border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 transition-all"
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                        disabled={isSubmitting}
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
                disabled={isSubmitting || loading} 
                className="min-w-32 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Saving...
                  </div>
                ) : company ? (
                  'Update Profile'
                ) : (
                  'Create Profile'
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel} 
                disabled={isSubmitting}
                className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}