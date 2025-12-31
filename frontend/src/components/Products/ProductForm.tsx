/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  Category,
  Company,
  productService,
  productToast,
} from '@/services/productService';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ImageUpload, UploadedImage } from './ImageUpload';
import {
  Plus,
  X,
  Save,
  Loader2,
  Package,
  List,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Globe,
} from 'lucide-react';
import Image from 'next/image';

// Validation schema
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(120),
  description: z.string().min(1, 'Description is required').max(2000),
  shortDescription: z.string().max(250).optional().or(z.literal('')),
  price: z.object({
    amount: z.number().min(0),
    currency: z.string().min(1),
    unit: z.string().min(1),
  }),
  category: z.string().min(1),
  subcategory: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })),
  featured: z.boolean(),
  metaTitle: z.string().max(60).optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  inventory: z.object({
    quantity: z.number().min(0),
    trackQuantity: z.boolean(),
    lowStockAlert: z.number().min(0),
  }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const defaultFormValues: ProductFormValues = {
  name: '',
  description: '',
  shortDescription: '',
  price: { amount: 0, currency: 'USD', unit: 'unit' },
  category: '',
  subcategory: '',
  tags: [],
  specifications: [{ key: '', value: '' }],
  featured: false,
  metaTitle: '',
  metaDescription: '',
  sku: '',
  inventory: { quantity: 0, trackQuantity: false, lowStockAlert: 10 },
};

interface ProfileFormProps {
  product?: Product;
  companies?: Company[];
  categories: Category[];
  onSubmit: (data: CreateProductData | UpdateProductData, images: File[]) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  className?: string;
}

export const ProductForm: React.FC<ProfileFormProps> = ({
  product,
  companies = [],
  categories,
  onSubmit,
  onCancel,
  loading = false,
  className,
}) => {
  const isEditing = !!product;
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [activeSection, setActiveSection] = useState('basic');

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: isEditing
      ? {
          name: product?.name ?? '',
          description: product?.description ?? '',
          shortDescription: product?.shortDescription ?? '',
          price: product?.price ?? defaultFormValues.price,
          category: product?.category ?? '',
          subcategory: product?.subcategory ?? '',
          tags: product?.tags ?? [],
          specifications: product?.specifications && product.specifications.length > 0 ? product.specifications : [{ key: '', value: '' }],
          featured: product?.featured ?? false,
          metaTitle: product?.metaTitle ?? '',
          metaDescription: product?.metaDescription ?? '',
          sku: product?.sku ?? '',
          inventory: product?.inventory ?? defaultFormValues.inventory,
        }
      : defaultFormValues,
    mode: 'onChange',
  });

  // Initialize images and company when editing
  useEffect(() => {
    if (product) {
      setSelectedCompany((product as any).companyId ?? '');
      if (product.images) {
        setImages(
          product.images.map((img) => ({
            ...img,
            altText: img.altText ?? product.name,
          }))
        );
      }
    }
  }, [product]);

  // Subcategories
  const selectedCategory = form.watch('category');
  const subcategories = categories.find((c) => c.name === selectedCategory)?.subcategories ?? [];

  const handleImagesChange = (newImgs: UploadedImage[]) => {
    setImages(newImgs);
    const files = newImgs.filter((i) => i.file).map((i) => i.file!) as File[];
    setNewImages(files);
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    const current = form.getValues('tags');
    if (!current.includes(tag)) {
      form.setValue('tags', [...current, tag], { shouldValidate: true });
    }
    setTagInput('');
  };

  const removeTag = (t: string) => {
    const current = form.getValues('tags');
    form.setValue('tags', current.filter((x) => x !== t), { shouldValidate: true });
  };

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const addSpecification = () => {
    const current = form.getValues('specifications');
    form.setValue('specifications', [...current, { key: '', value: '' }], { shouldValidate: true });
  };

  const removeSpecification = (index: number) => {
    const current = form.getValues('specifications');
    if (current.length <= 1) return;
    form.setValue('specifications', current.filter((_, i) => i !== index), { shouldValidate: true });
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const current = form.getValues('specifications');
    const updated = current.map((s, i) => (i === index ? { ...s, [field]: value } : s));
    form.setValue('specifications', updated, { shouldValidate: true });
  };

const onFormSubmit = async (data: ProductFormValues) => {
  try {
    // Filter out empty specifications BEFORE sending to backend
    const filteredSpecifications = data.specifications
      .filter((s) => s.key.trim() && s.value.trim())
      .map(s => ({
        key: s.key.trim(),
        value: s.value.trim()
      }));

    // Ensure we have at least one image
    if (!isEditing && newImages.length === 0 && images.length === 0) {
      productToast.error('At least one product image is required');
      return;
    }

    const payload: CreateProductData | UpdateProductData = {
      name: data.name.trim(),
      description: data.description.trim(),
      shortDescription: data.shortDescription?.trim() || undefined,
      price: {
        amount: parseFloat(data.price.amount.toString()),
        currency: data.price.currency,
        unit: data.price.unit
      },
      category: data.category.trim(),
      subcategory: data.subcategory?.trim() || undefined,
      tags: data.tags.filter((t) => t.trim()),
      // Only include specifications if there are valid ones
      specifications: filteredSpecifications.length > 0 ? filteredSpecifications : [],
      featured: data.featured,
      metaTitle: data.metaTitle?.trim() || undefined,
      metaDescription: data.metaDescription?.trim() || undefined,
      sku: data.sku?.trim() || undefined,
      inventory: {
        quantity: parseInt(data.inventory.quantity.toString()),
        trackQuantity: data.inventory.trackQuantity,
        lowStockAlert: parseInt(data.inventory.lowStockAlert.toString())
      },
    } as CreateProductData | UpdateProductData;

    if (!isEditing && selectedCompany) {
      (payload as CreateProductData).companyId = selectedCompany;
    }

    console.log('Submitting product data:', payload);
    await onSubmit(payload, newImages);
  } catch (err) {
    console.error('Submit error', err);
  }
};

  // Number helper to keep controlled inputs stable
  const handleNumberChange = (field: any, raw: string, isFloat = false) => {
    const parsed = isFloat ? parseFloat(raw) : parseInt(raw, 10);
    field.onChange(Number.isNaN(parsed) ? 0 : parsed);
  };

  const navItems = [
    { id: 'basic', label: 'Basic Info', icon: Package },
    { id: 'pricing', label: 'Pricing & Stock', icon: DollarSign },
    { id: 'categories', label: 'Categories & Tags', icon: Layers },
    { id: 'specs', label: 'Specifications', icon: List },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'seo', label: 'SEO Settings', icon: Globe },
  ];

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-gray-50 to-sky-50/40', className)}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            {isEditing ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="mt-1 text-slate-600">{isEditing ? 'Update product information' : 'Add a new item to your catalog'}</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar nav */}
          <aside className="lg:col-span-1">
            <Card className="sticky top-20 border-0 shadow-lg">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition',
                          activeSection === item.id
                            ? 'bg-amber-500 text-white shadow'
                            : 'text-slate-700 hover:bg-slate-100'
                        )}
                        aria-current={activeSection === item.id}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </aside>

          <main className="lg:col-span-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
                {/* Basic */}
                {(activeSection === 'basic' || !activeSection) && (
                  <Card className="shadow-md">
                    <CardHeader className="bg-slate-800 text-white rounded-t-md">
                      <CardTitle className="flex items-center gap-3">
                        <Package className="h-5 w-5" /> Basic information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {!isEditing && companies.length > 0 && (
                        <div className="rounded-md border p-3 bg-sky-50">
                          <FormLabel className="text-sm font-semibold text-slate-800">Company</FormLabel>
                          <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Select company" />
                            </SelectTrigger>
                            <SelectContent>
                              {companies.map((c) => (
                                <SelectItem key={c._id} value={c._id}>
                                  <div className="flex items-center gap-3">
                                    {c.logoUrl && (
                                      <img src={productService.getImageUrl(c.logoUrl)} alt={c.name} className="h-6 w-6 rounded object-cover" />
                                    )}
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm">{c.name}</span>
                                      {c.verified && <Badge variant="outline" className="text-xs">Verified</Badge>}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Product name *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Product name" className="border" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sku"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">SKU</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="SKU (optional)" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="shortDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Short description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Short summary shown in listings" className="min-h-[80px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Description *</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="Detailed product description" className="min-h-[120px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Pricing & Inventory */}
                {activeSection === 'pricing' && (
                  <Card className="shadow-md">
                    <CardHeader className="bg-amber-600 text-white rounded-t-md">
                      <CardTitle className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5" /> Pricing & Inventory
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="price.amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Price *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={field.value}
                                  onChange={(e) => handleNumberChange(field, e.target.value, true)}
                                  placeholder="0.00"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price.currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Currency</FormLabel>
                              <FormControl>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Currency" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="GBP">GBP (£)</SelectItem>
                                    <SelectItem value="ETB">ETB (Br)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="price.unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Unit</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="e.g. unit, kg" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="inventory.trackQuantity"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
                              <div>
                                <FormLabel className="font-semibold">Track quantity</FormLabel>
                                <FormDescription>Toggle to enable stock tracking</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="featured"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
                              <div>
                                <FormLabel className="font-semibold">Featured</FormLabel>
                                <FormDescription>Mark product as featured</FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch('inventory.trackQuantity') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-md border bg-sky-50">
                          <FormField
                            control={form.control}
                            name="inventory.quantity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">Stock quantity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => handleNumberChange(field, e.target.value)}
                                    placeholder="0"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="inventory.lowStockAlert"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">Low stock alert</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    value={field.value}
                                    onChange={(e) => handleNumberChange(field, e.target.value)}
                                    placeholder="10"
                                  />
                                </FormControl>
                                <FormDescription>Notify when stock goes below this number</FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Categories & Tags */}
{activeSection === 'categories' && (
  <Card className="shadow-md">
    <CardHeader className="bg-slate-800 text-white rounded-t-md">
      <CardTitle className="flex items-center gap-3">
        <Layers className="h-5 w-5" /> Categories & tags
      </CardTitle>
    </CardHeader>

    <CardContent className="p-6 space-y-4">

      {/* CATEGORY & SUBCATEGORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* CATEGORY – now a text input */}
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Category *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Type category (e.g., Electronics)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SUBCATEGORY – also typed manually */}
        <FormField
          control={form.control}
          name="subcategory"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Subcategory</FormLabel>
              <FormControl>
                <Input
                  placeholder="Type subcategory (optional)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>

      {/* TAGS */}
      <div>
        <FormLabel className="font-semibold">Tags</FormLabel>

        <div className="flex items-center gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKey}
            placeholder="Add tag and press Enter"
          />
          <Button type="button" onClick={addTag} variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {form.getValues("tags").map((t) => (
            <Badge key={t} className="px-3 py-1 flex items-center gap-2">
              <span className="text-sm">{t}</span>
              <button
                type="button"
                onClick={() => removeTag(t)}
                aria-label={`Remove ${t}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </div>

    </CardContent>
  </Card>
)}


                {/* Specifications */}
                {activeSection === 'specs' && (
                  <Card className="shadow-md">
                    <CardHeader className="bg-slate-800 text-white rounded-t-md">
                      <CardTitle className="flex items-center gap-3">
                        <List className="h-5 w-5" /> Specifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {form.getValues('specifications').map((spec, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-5">
                            <Input value={spec.key} onChange={(e) => updateSpecification(idx, 'key', e.target.value)} placeholder="Key (e.g. Weight)" />
                          </div>
                          <div className="col-span-6">
                            <Input value={spec.value} onChange={(e) => updateSpecification(idx, 'value', e.target.value)} placeholder="Value (e.g. 1.2 kg)" />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button type="button" variant="ghost" onClick={() => removeSpecification(idx)} disabled={form.getValues('specifications').length <= 1}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      <div>
                        <Button type="button" onClick={addSpecification} variant="outline">
                          <Plus className="h-4 w-4 mr-2" /> Add specification
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Images */}
                {activeSection === 'images' && (
                  <Card className="shadow-md">
                    <CardHeader className="bg-slate-800 text-white rounded-t-md">
                      <CardTitle className="flex items-center gap-3">
                        <ImageIcon className="h-5 w-5" /> Images & gallery
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-3">
                        <ImageUpload
                          images={images}
                          onImagesChange={handleImagesChange}
                        />
                        <FormDescription>Upload high-quality images. Drag to reorder. First image becomes primary.</FormDescription>
                      </div>

                      {/* Gallery preview */}
                      {images.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {images.map((img, i) => (
                            <div key={i} className="rounded-md overflow-hidden border bg-white">
                              <img
                                src={img.url}
                                alt={img.altText || 'product image'}
                                className="w-full h-40 object-cover"
                              />

                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* SEO */}
                {activeSection === 'seo' && (
                  <Card className="shadow-md">
                    <CardHeader className="bg-slate-800 text-white rounded-t-md">
                      <CardTitle className="flex items-center gap-3">
                        <Globe className="h-5 w-5" /> SEO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <FormField
                        control={form.control}
                        name="metaTitle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Meta title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="SEO title (max 60 chars)" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="metaDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Meta description</FormLabel>
                            <FormControl>
                              <Textarea {...field} placeholder="SEO description (max 160 chars)" className="min-h-[100px]" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Sticky footer actions */}
                <div className="sticky bottom-6 bg-white rounded-2xl p-4 shadow-md border">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                          Cancel
                        </Button>
                      )}
                      <div className="text-sm text-slate-600">
                        {Object.keys(form.formState.errors).length > 0 ? (
                          <span className="text-orange-600">Please fix {Object.keys(form.formState.errors).length} error(s)</span>
                        ) : (
                          <span>All good — ready to submit</span>
                        )}
                      </div>
                    </div>

                    <Button type="submit" disabled={loading} className="bg-amber-500 text-white px-6 py-2">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2 inline-block" /> : <Save className="h-4 w-4 mr-2 inline-block" />}
                      {isEditing ? 'Update Product' : 'Create Product'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
