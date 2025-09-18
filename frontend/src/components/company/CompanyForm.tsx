import { useState } from 'react';
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
import { Building2, X } from 'lucide-react';
import Button from '../forms/Button';

const companyFormSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  tin: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  logoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  bannerUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: CompanyFormValues) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CompanyForm({ company, onSubmit, onCancel, loading = false }: CompanyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      logoUrl: company?.logoUrl || '',
      bannerUrl: company?.bannerUrl || '',
    },
  });

  const handleSubmit = async (data: CompanyFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              {company ? 'Edit Company Profile' : 'Create Company Profile'}
            </CardTitle>
            <CardDescription>
              {company ? 'Update your company information' : 'Fill in your company details to get started'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="md" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
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
                    <FormLabel>TIN Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter TIN number" {...field} />
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
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Technology, Healthcare, Education" {...field} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
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
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourcompany.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/logo.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bannerUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Banner URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/banner.png" {...field} />
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company address" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your company, services, and mission..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Max 1000 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? 'Saving...' : company ? 'Update Profile' : 'Create Profile'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}