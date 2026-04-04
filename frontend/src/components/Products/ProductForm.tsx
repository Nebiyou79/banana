/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Product,
  CreateProductData,
  UpdateProductData,
  Company,
  productService,
  productToast,
} from '@/services/productService';
import { colors, getTheme, ThemeMode, colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { Button } from '@/components/social/ui/Button';
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
import { Badge } from '@/components/social/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/social/ui/Card';
import { Separator } from '@/components/ui/Separator';
import { ImageUploader, ExistingImage } from './ImageUpload';
import { CompanyAvatarDisplay } from './CompanyAvatarDisplay';
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
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Check,
  XCircle,
  Cloud,
  RefreshCw,
  ArrowLeft,
  Trash2,
  Building2,
} from 'lucide-react';
import { useRouter } from 'next/router';

// =====================
// DARK MODE HELPERS
// =====================

// Applied to every text input / textarea
const darkInput =
  'dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-500 dark:focus:border-[#F1BB03] dark:focus:ring-[#F1BB03]/20';

// Applied to every Select trigger
const darkSelect =
  'dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:focus:border-[#F1BB03]';

// Applied to every SelectContent
const darkSelectContent = 'dark:bg-gray-800 dark:border-gray-700';

// Applied to every SelectItem
const darkSelectItem =
  'dark:text-gray-200 dark:focus:bg-gray-700 dark:focus:text-white dark:data-[highlighted]:bg-gray-700';

// Applied to FormLabel
const darkLabel = 'dark:text-gray-200';

// Applied to FormDescription
const darkDesc = 'dark:text-gray-400';

// Card backgrounds
const darkCard = 'dark:bg-gray-900 dark:border-gray-700';

// Secondary / muted backgrounds (used in featured toggle, inventory toggle, etc.)
const darkSecondary = 'dark:bg-gray-800 dark:border-gray-700';

// =====================
// VALIDATION SCHEMA
// =====================

const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(120),
  description: z.string().min(1, 'Description is required').max(2000),
  shortDescription: z.string().max(250).optional().or(z.literal('')),
  price: z.object({
    amount: z.union([
      z.string().min(1, 'Price is required').refine(val => !isNaN(parseFloat(val)), 'Must be a valid number'),
      z.number().min(0.01, 'Price must be greater than 0'),
    ]),
    currency: z.string().min(1, 'Currency is required'),
    unit: z.string().min(1, 'Unit is required'),
  }),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()),
  specifications: z.array(z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
  })),
  featured: z.boolean(),
  metaTitle: z.string().max(60).optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  inventory: z.object({
    quantity: z.number().min(0, 'Quantity must be positive'),
    trackQuantity: z.boolean(),
    lowStockAlert: z.number().min(0, 'Alert threshold must be positive'),
  }),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const defaultFormValues: ProductFormValues = {
  name: '',
  description: '',
  shortDescription: '',
  price: { amount: '', currency: 'USD', unit: 'unit' },
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

// =====================
// PROPS
// =====================

interface ProductFormProps {
  product?: Product;
  company?: Company;
  companyId?: string;
  mode?: 'create' | 'edit';
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
  className?: string;
  theme?: ThemeMode;
  loading?: boolean;
}

// =====================
// MOBILE TAB SELECTOR
// =====================

const MobileTabSelector: React.FC<{
  tabs: Array<{ id: string; label: string; icon: any; required: boolean }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  tabErrors: Record<string, string[]>;
  theme: ThemeMode;
}> = ({ tabs, activeTab, onTabChange, tabErrors }) => {
  return (
    <Select value={activeTab} onValueChange={onTabChange}>
      <SelectTrigger
        className={cn(
          'w-full mb-4 font-medium',
          colorClasses.bg.primary,
          colorClasses.border.gray200,
          colorClasses.text.primary,
          darkSelect,
        )}
      >
        <SelectValue placeholder="Select section" />
      </SelectTrigger>
      <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const hasErrors = (tabErrors[tab.id] || []).length > 0;
          return (
            <SelectItem
              key={tab.id}
              value={tab.id}
              className={cn('flex items-center gap-2', colorClasses.text.primary, darkSelectItem)}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.required && <span className={cn('text-xs', colorClasses.text.error)}>*</span>}
                {hasErrors && <span className={cn('w-2 h-2 rounded-full', colorClasses.bg.red)} />}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

// =====================
// MAIN PRODUCT FORM
// =====================

export const ProductForm: React.FC<ProductFormProps> = ({
  product,
  company,
  companyId,
  mode = 'create',
  onSuccess,
  onCancel,
  className,
  theme = 'light',
  loading = false,
}) => {
  const isEditMode = mode === 'edit';
  const router = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const currentTheme = getTheme(theme);

  const formValuesRef = useRef<ProductFormValues>(defaultFormValues);
  const hasInitializedRef = useRef(false);

  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['basic']));
  const [tabErrors, setTabErrors] = useState<Record<string, string[]>>({});

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Package, required: true },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, required: true },
    { id: 'categories', label: 'Categories', icon: Layers, required: true },
    { id: 'images', label: 'Images', icon: ImageIcon, required: !isEditMode },
    { id: 'inventory', label: 'Inventory', icon: Package, required: false },
    { id: 'specs', label: 'Specifications', icon: List, required: false },
    { id: 'seo', label: 'SEO', icon: Globe, required: false },
  ];

  const tabValidationConfig = {
    basic: ['name', 'description', 'shortDescription', 'sku'],
    pricing: ['price.amount', 'price.currency', 'price.unit', 'featured'],
    categories: ['category', 'subcategory', 'tags'],
    images: [],
    inventory: ['inventory.quantity', 'inventory.trackQuantity', 'inventory.lowStockAlert'],
    specs: ['specifications'],
    seo: ['metaTitle', 'metaDescription'],
  } as const;

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'ETB', label: 'ETB (Br)' },
  ];

  const units = [
    'unit', 'kg', 'lb', 'piece', 'set', 'pair', 'dozen', 'meter', 'liter',
    'box', 'pack', 'bundle', 'roll', 'sheet', 'bottle', 'can', 'tube',
  ];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
    shouldUnregister: false,
  });

  // Initialise form values once
  useEffect(() => {
    if (hasInitializedRef.current) return;

    let initialValues: ProductFormValues;

    if (isEditMode && product) {
      initialValues = {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || '',
        price: {
          amount: product.price.amount,
          currency: product.price.currency || 'USD',
          unit: product.price.unit || 'unit',
        },
        category: product.category,
        subcategory: product.subcategory || '',
        tags: product.tags || [],
        specifications:
          product.specifications && product.specifications.length > 0
            ? product.specifications
            : [{ key: '', value: '' }],
        featured: product.featured || false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        sku: product.sku || '',
        inventory: product.inventory || defaultFormValues.inventory,
      };
    } else {
      const generatedSku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      initialValues = { ...defaultFormValues, sku: generatedSku, price: { amount: '', currency: 'USD', unit: 'unit' } };
    }

    form.reset(initialValues);
    formValuesRef.current = initialValues;
    hasInitializedRef.current = true;

    if (isEditMode && product?.images) {
      const mappedImages: ExistingImage[] = product.images.map((img, index) => ({
        secure_url: img.secure_url,
        public_id: img.public_id,
        altText: img.altText || `Product image ${index + 1}`,
        isPrimary: img.isPrimary || index === 0,
        width: img.width,
        height: img.height,
        bytes: img.bytes,
        format: img.format,
        uploaded_at: img.uploaded_at,
      }));
      setExistingImages(mappedImages);
      const primaryIdx = mappedImages.findIndex(img => img.isPrimary);
      setPrimaryImageIndex(primaryIdx !== -1 ? primaryIdx : 0);
    }
  }, [product, isEditMode, form]);

  // Watch changes
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values) {
        formValuesRef.current = values as ProductFormValues;
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const markTabAsVisited = (tabId: string) => {
    setVisitedTabs(prev => new Set([...prev, tabId]));
  };

  const validateCurrentTab = useCallback(
    async (tabId?: string): Promise<boolean> => {
      const targetTabId = tabId || activeTab;
      const fieldsToValidate =
        tabValidationConfig[targetTabId as keyof typeof tabValidationConfig] || [];

      if (fieldsToValidate.length === 0) {
        if (targetTabId === 'images') {
          const hasImages = newImages.length > 0 || existingImages.length > 0;
          if (!hasImages && !isEditMode) {
            setTabErrors(prev => ({ ...prev, images: ['At least one product image is required'] }));
            return false;
          }
          setTabErrors(prev => ({ ...prev, images: [] }));
          return true;
        }
        return true;
      }

      const result = await form.trigger(fieldsToValidate as any);
      const errors = fieldsToValidate
        .map(field => {
          const fieldError = form.formState.errors[field as keyof typeof form.formState.errors];
          return (fieldError as any)?.message;
        })
        .filter(Boolean) as string[];

      setTabErrors(prev => ({ ...prev, [targetTabId]: errors }));
      return result;
    },
    [activeTab, form, newImages.length, existingImages.length, isEditMode],
  );

  const handleTabChange = async (targetTabId: string) => {
    if (targetTabId === activeTab) return;
    markTabAsVisited(targetTabId);

    if (visitedTabs.has(activeTab)) {
      const isValid = await validateCurrentTab();
      if (!isValid) {
        const currentTab = tabs.find(t => t.id === activeTab);
        if (currentTab) productToast.warning(`Please fix errors in ${currentTab.label} tab`);
        setActiveTab(targetTabId);
        return;
      }
    }

    setTabErrors(prev => ({ ...prev, [activeTab]: [] }));
    setActiveTab(targetTabId);
  };

  // Tag management
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag) return;
    const currentTags = formValuesRef.current.tags || [];
    if (!currentTags.includes(tag) && currentTags.length < 20) {
      form.setValue('tags', [...currentTags, tag], { shouldValidate: true });
      setTagInput('');
      setHasUnsavedChanges(true);
      markTabAsVisited('categories');
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = formValuesRef.current.tags || [];
    form.setValue('tags', currentTags.filter(t => t !== tag), { shouldValidate: true });
    setHasUnsavedChanges(true);
  };

  // Spec management
  const addSpecification = () => {
    const currentSpecs = formValuesRef.current.specifications || [];
    if (currentSpecs.length < 50) {
      form.setValue('specifications', [...currentSpecs, { key: '', value: '' }], {
        shouldValidate: true,
      });
      setHasUnsavedChanges(true);
      markTabAsVisited('specs');
    }
  };

  const removeSpecification = (index: number) => {
    const currentSpecs = formValuesRef.current.specifications || [];
    if (currentSpecs.length > 1) {
      form.setValue(
        'specifications',
        currentSpecs.filter((_, i) => i !== index),
        { shouldValidate: true },
      );
      setHasUnsavedChanges(true);
    }
  };

  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const specs = [...(formValuesRef.current.specifications || [])];
    specs[index] = { ...specs[index], [field]: value };
    form.setValue('specifications', specs, { shouldValidate: true });
    setHasUnsavedChanges(true);
    markTabAsVisited('specs');
  };

  const generateSku = () => {
    const newSku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    form.setValue('sku', newSku);
    setHasUnsavedChanges(true);
    productToast.success('New SKU generated');
  };

  const calculateProgress = () => {
    const requiredTabs = tabs.filter(t => t.required);
    let completed = 0;
    requiredTabs.forEach(tab => {
      if (tab.id === 'images') {
        if (existingImages.length > 0 || newImages.length > 0) completed++;
      } else {
        const fields = tabValidationConfig[tab.id as keyof typeof tabValidationConfig] || [];
        const allValid = fields.every(field => {
          const value = field.includes('.')
            ? field.split('.').reduce((obj: any, key) => obj?.[key], formValuesRef.current)
            : formValuesRef.current[field as keyof ProductFormValues];
          return value !== undefined && value !== '' && value !== null;
        });
        if (allValid) completed++;
      }
    });
    return Math.round((completed / requiredTabs.length) * 100);
  };

  // Save as draft
  const handleSaveAsDraft = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setFormErrors([]);

      let allValid = true;
      for (const tabId of Array.from(visitedTabs)) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.required && tabId !== 'images') {
          if (!(await validateCurrentTab(tabId))) allValid = false;
        }
      }
      if (!allValid) { productToast.error('Please fix all required fields before saving as draft'); return; }

      let result: Product;
      if (isEditMode && product?._id) {
        result = await productService.updateProduct(
          product._id,
          { ...formValuesRef.current as UpdateProductData, status: 'draft' },
          newImages,
          { existingImages: existingImages.map(img => img.public_id!).filter(Boolean), imagesToDelete, primaryImageIndex },
        );
        productToast.success('Product saved as draft');
      } else {
        const productData: CreateProductData = { ...formValuesRef.current, companyId: company?._id || companyId };
        result = await productService.createProduct(productData, newImages);
        result = await productService.updateProductStatus(result._id, 'draft');
        productToast.success('Product saved as draft');
      }

      setHasUnsavedChanges(false);
      setNewImages([]);
      setImagesToDelete([]);
      hasInitializedRef.current = false;
      if (onSuccess) onSuccess(result);
      else router.push(`/products/${result._id}`);
    } catch (error: any) {
      setFormErrors([error.message || 'Failed to save product as draft']);
      productToast.error(error.message || 'Failed to save product as draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish / submit
  const handleSubmit = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setFormErrors([]);

      let allValid = true;
      let firstInvalidTab = '';
      for (const tabId of Array.from(visitedTabs)) {
        const tab = tabs.find(t => t.id === tabId);
        if (tab?.required) {
          const valid = await validateCurrentTab(tabId);
          if (!valid) { allValid = false; if (!firstInvalidTab) firstInvalidTab = tabId; }
        }
      }

      if (!allValid) {
        if (firstInvalidTab && firstInvalidTab !== activeTab) setActiveTab(firstInvalidTab);
        productToast.error('Please fix all required fields before submitting');
        return;
      }

      if (!isEditMode && newImages.length === 0) {
        setTabErrors(prev => ({ ...prev, images: ['At least one product image is required'] }));
        setActiveTab('images');
        productToast.error('Please upload at least one product image');
        return;
      }

      let result: Product;
      if (isEditMode && product?._id) {
        const updateData: UpdateProductData = {
          ...formValuesRef.current,
          existingImages: existingImages.map(img => img.public_id!).filter(Boolean),
          imagesToDelete,
          primaryImageIndex,
          status: product.status || 'active',
        };
        result = await productService.updateProduct(product._id, updateData, newImages, {
          existingImages: existingImages.map(img => img.public_id!).filter(Boolean),
          imagesToDelete,
          primaryImageIndex,
        });
        productToast.success('Product updated successfully');
      } else {
        const productData: CreateProductData = { ...formValuesRef.current, companyId: company?._id || companyId };
        result = await productService.createProduct(productData, newImages);
        productToast.success('Product created successfully');
      }

      setHasUnsavedChanges(false);
      setNewImages([]);
      setImagesToDelete([]);
      hasInitializedRef.current = false;
      if (onSuccess) onSuccess(result);
      else router.push(`/products/${result._id}`);
    } catch (error: any) {
      if (error.type === 'VALIDATION') {
        const errors = error.message.split(', ');
        setFormErrors(errors);
        errors.forEach((err: string) => productToast.error(err));
      } else if (error.code === 'DUPLICATE_SKU') {
        form.setError('sku', { message: 'SKU already exists' });
        productToast.error('SKU already exists. Please use a different SKU.');
      } else if (error.code === 'NO_IMAGES') {
        setTabErrors(prev => ({ ...prev, images: ['At least one product image is required'] }));
        setActiveTab('images');
        productToast.error('Please upload at least one product image');
      } else {
        setFormErrors([error.message || 'Failed to save product']);
        productToast.error(error.message || 'Failed to save product');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!isEditMode || !product?._id) return;
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) return;
    try {
      setIsSubmitting(true);
      await productService.deleteProduct(product._id);
      productToast.success('Product deleted successfully');
      router.push('/products');
    } catch (error: any) {
      productToast.error(error.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        if (onCancel) onCancel(); else router.back();
      }
    } else {
      if (onCancel) onCancel(); else router.back();
    }
  };

  const getTabStyle = (isActive: boolean, hasErrors: boolean) => {
    if (isActive) return cn(colorClasses.bg.goldenMustard, colorClasses.text.white);
    if (hasErrors) return cn('border', colorClasses.border.orange, colorClasses.text.error);
    return cn('border', colorClasses.border.gray200, colorClasses.text.primary);
  };

  // =====================
  // FORM FIELDS RENDER
  // =====================

  const renderFormFields = () => (
    <>
      {activeTab === 'basic' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter product name"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                      className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                    />
                  </FormControl>
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Descriptive name for your product</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>SKU</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        placeholder="e.g., PROD-001"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                        className={cn('flex-1', colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSku}
                      title="Generate new SKU"
                      className={cn(colorClasses.border.gray200, colorClasses.text.primary, darkSelect, getTouchTargetSize('md'))}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Unique identifier for inventory management</FormDescription>
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
                <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Short Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                    placeholder="Brief description for product listings"
                    className={cn('min-h-[80px] sm:min-h-25', colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput)}
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Appears in product listings (max 250 chars)</FormDescription>
                  <span className={cn('text-xs sm:text-sm', colorClasses.text.secondary, darkDesc)}>{(field.value || '').length}/250</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Full Description *</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                    placeholder="Detailed product description, features, and benefits"
                    className={cn('min-h-[120px] sm:min-h-[150px]', colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput)}
                  />
                </FormControl>
                <div className="flex justify-between">
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Full product details and features (max 2000 chars)</FormDescription>
                  <span className={cn('text-xs sm:text-sm', colorClasses.text.secondary, darkDesc)}>{(field.value || '').length}/2000</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}

      {activeTab === 'pricing' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            <FormField
              control={form.control}
              name="price.amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Price *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={field.value === '' ? '' : field.value}
                      onChange={(e) => { const v = e.target.value === '' ? '' : parseFloat(e.target.value) || 0; field.onChange(v); setHasUnsavedChanges(true); }}
                      onBlur={(e) => { const v = e.target.value === '' ? '' : parseFloat(e.target.value) || 0; field.onChange(v); }}
                      className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
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
                  <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Currency *</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); setHasUnsavedChanges(true); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkSelect, getTouchTargetSize('md'))}>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
                      {currencies.map(c => (
                        <SelectItem key={c.value} value={c.value} className={cn(colorClasses.text.primary, darkSelectItem)}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price.unit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Unit *</FormLabel>
                  <Select onValueChange={(v) => { field.onChange(v); setHasUnsavedChanges(true); }} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkSelect, getTouchTargetSize('md'))}>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className={cn(colorClasses.bg.primary, darkSelectContent)}>
                      {units.map(u => (
                        <SelectItem key={u} value={u} className={cn(colorClasses.text.primary, darkSelectItem)}>
                          {u.charAt(0).toUpperCase() + u.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="featured"
            render={({ field }) => (
              <FormItem className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-4 sm:p-5 gap-3 sm:gap-4',
                colorClasses.border.gray200,
                colorClasses.bg.secondary,
                darkSecondary,
              )}>
                <div>
                  <FormLabel className={cn('text-sm sm:text-base font-medium', colorClasses.text.primary, darkLabel)}>Featured Product</FormLabel>
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Show this product in featured sections</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={(checked) => { field.onChange(checked); setHasUnsavedChanges(true); }}
                    className={getTouchTargetSize('md')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Category *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Electronics, Clothing"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                      className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                    />
                  </FormControl>
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Main product category</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Subcategory</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Smartphones, T-Shirts"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                      className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                    />
                  </FormControl>
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Optional subcategory</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FormLabel className={cn('mb-2 block', colorClasses.text.primary, darkLabel)}>Tags</FormLabel>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                placeholder="Add tags and press Enter"
                className={cn('flex-1', colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                disabled={(formValuesRef.current.tags || []).length >= 20}
                className={cn(getTouchTargetSize('md'), colorClasses.border.gray200, colorClasses.text.primary, darkSelect)}
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Tag</span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {(formValuesRef.current.tags || []).map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={cn('gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm', colorClasses.bg.secondary, colorClasses.text.primary, 'dark:bg-gray-700 dark:text-gray-200')}
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:opacity-75">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {(formValuesRef.current.tags || []).length === 0 && (
                <p className={cn('text-xs sm:text-sm italic', colorClasses.text.secondary, darkDesc)}>No tags added yet</p>
              )}
            </div>
            <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>
              Add relevant keywords to help customers find this product (max 20 tags)
            </FormDescription>
          </div>
        </>
      )}

      {activeTab === 'images' && (
        <>
          <ImageUploader
            existingImages={existingImages}
            imagesToDelete={imagesToDelete}
            primaryImageIndex={primaryImageIndex}
            onExistingImagesChange={setExistingImages}
            onImagesToDeleteChange={setImagesToDelete}
            onPrimaryImageIndexChange={setPrimaryImageIndex}
            newImages={newImages}
            onNewImagesChange={setNewImages}
            maxImages={5}
            multiple={true}
            disabled={isSubmitting || loading}
            required={!isEditMode}
            label="Product Images"
            description="Upload high-quality product images"
            theme={theme}
          />
          {(existingImages.length > 0 || newImages.length > 0) && (
            <div className={cn('rounded-xl border p-3 sm:p-4', colorClasses.border.gray200, colorClasses.bg.secondary, darkSecondary)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <h4 className={cn('font-medium text-sm sm:text-base', colorClasses.text.primary, darkLabel)}>Images Summary</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Cloud className={cn('h-3 w-3 sm:h-4 sm:w-4', colorClasses.text.blue)} />
                    <span className={cn('text-xs sm:text-sm', colorClasses.text.secondary, darkDesc)}>{existingImages.length} existing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className={cn('h-3 w-3 sm:h-4 sm:w-4', colorClasses.text.green)} />
                    <span className={cn('text-xs sm:text-sm', colorClasses.text.primary, darkLabel)}>{newImages.length} new</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'inventory' && (
        <>
          <FormField
            control={form.control}
            name="inventory.trackQuantity"
            render={({ field }) => (
              <FormItem className={cn('rounded-xl border p-4 sm:p-5', colorClasses.border.gray200, colorClasses.bg.secondary, darkSecondary)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <div>
                    <FormLabel className={cn('text-sm sm:text-base font-medium', colorClasses.text.primary, darkLabel)}>Track Inventory</FormLabel>
                    <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Enable stock quantity tracking and alerts</FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={(checked) => { field.onChange(checked); setHasUnsavedChanges(true); }}
                      className={getTouchTargetSize('md')}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {formValuesRef.current.inventory?.trackQuantity && (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="inventory.quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Stock Quantity *</FormLabel>
                      <FormControl>
                        <Input
                          type="number" min="0" placeholder="0"
                          value={field.value || 0}
                          onChange={(e) => { field.onChange(parseInt(e.target.value) || 0); setHasUnsavedChanges(true); }}
                          onBlur={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                        />
                      </FormControl>
                      <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Current available stock</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inventory.lowStockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Low Stock Alert</FormLabel>
                      <FormControl>
                        <Input
                          type="number" min="0" placeholder="10"
                          value={field.value || 0}
                          onChange={(e) => { field.onChange(parseInt(e.target.value) || 0); setHasUnsavedChanges(true); }}
                          onBlur={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                        />
                      </FormControl>
                      <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Get notified when stock falls below this level</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className={cn('p-3 sm:p-4 rounded-xl border', colorClasses.border.gray200, colorClasses.bg.secondary, darkSecondary)}>
                <h4 className={cn('font-medium mb-2 text-sm sm:text-base', colorClasses.text.primary, darkLabel)}>Stock Status</h4>
                {(() => {
                  const inv = formValuesRef.current.inventory || defaultFormValues.inventory;
                  const ss = productService.getStockStatus(inv);
                  return (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: ss.color }} />
                      <span className="text-xs sm:text-sm" style={{ color: ss.color }}>{ss.text}</span>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'specs' && (
        <>
          <div className="space-y-3 sm:space-y-4">
            {(formValuesRef.current.specifications || []).map((spec, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 sm:gap-4 items-center">
                <div className="col-span-5">
                  <Input
                    value={spec.key || ''}
                    onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                    placeholder="Specification name"
                    className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                  />
                </div>
                <div className="col-span-6">
                  <Input
                    value={spec.value || ''}
                    onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                    placeholder="Specification value"
                    className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSpecification(index)}
                    disabled={(formValuesRef.current.specifications || []).length <= 1}
                    className={cn(colorClasses.text.secondary, getTouchTargetSize('md'))}
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              onClick={addSpecification}
              variant="outline"
              disabled={(formValuesRef.current.specifications || []).length >= 50}
              className={cn(getTouchTargetSize('md'), colorClasses.border.gray200, colorClasses.text.primary, darkSelect)}
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span>Add Specification</span>
            </Button>
            <Button
              type="button"
              onClick={() => { form.setValue('specifications', [{ key: '', value: '' }], { shouldValidate: true }); setHasUnsavedChanges(true); }}
              variant="ghost"
              className={cn(getTouchTargetSize('md'), colorClasses.text.secondary, 'dark:text-gray-400 dark:hover:text-gray-200')}
            >
              Clear All
            </Button>
          </div>
        </>
      )}

      {activeTab === 'seo' && (
        <>
          <FormField
            control={form.control}
            name="metaTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Meta Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="SEO title for search engines"
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                    className={cn(colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput, getTouchTargetSize('md'))}
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Appears in browser tabs and search results</FormDescription>
                  <span className={cn('text-xs sm:text-sm', colorClasses.text.secondary, darkDesc)}>{(field.value || '').length}/60</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="metaDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(colorClasses.text.primary, darkLabel)}>Meta Description</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    value={field.value || ''}
                    onChange={(e) => { field.onChange(e.target.value); setHasUnsavedChanges(true); }}
                    placeholder="SEO description for search results"
                    className={cn('min-h-[80px] sm:min-h-25', colorClasses.bg.primary, colorClasses.border.gray200, colorClasses.text.primary, darkInput)}
                  />
                </FormControl>
                <div className="flex items-center justify-between">
                  <FormDescription className={cn(colorClasses.text.secondary, darkDesc)}>Brief description for search engine snippets</FormDescription>
                  <span className={cn('text-xs sm:text-sm', colorClasses.text.secondary, darkDesc)}>{(field.value || '').length}/160</span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )}
    </>
  );

  // =====================
  // TAB CONTENT CARD
  // =====================

  const renderTabContent = () => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (!currentTab) return null;
    const currentTabErrors = tabErrors[activeTab] || [];
    const Icon = currentTab.icon;

    return (
      <Card className={cn('border shadow-sm', colorClasses.border.gray200, darkCard)}>
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4">
          <CardTitle className={cn('flex items-center gap-2 text-lg sm:text-xl', colorClasses.text.primary, darkLabel)}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#F1BB03]" />
            {currentTab.label}
            {currentTab.required && (
              <span className={cn('text-xs font-normal', colorClasses.text.error)}>* Required</span>
            )}
          </CardTitle>
          {currentTabErrors.length > 0 && (
            <div className={cn('p-3 sm:p-4 rounded-xl mt-3 border', 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800')}>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-orange-500" />
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-medium text-orange-700 dark:text-orange-400">Please fix the following:</p>
                  <ul className="text-xs space-y-0.5 text-orange-600 dark:text-orange-500">
                    {currentTabErrors.map((error, idx) => <li key={idx}>• {error}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-6">
          <Form {...form}>
            {renderFormFields()}
          </Form>
        </CardContent>
      </Card>
    );
  };

  // =====================
  // COMPANY BANNER (shown at top when company info available)
  // =====================

  const companyAvatarUrl = (company as any)?.logoUrl || (company as any)?.avatar?.secure_url;
  const companyAvatarPublicId = (company as any)?.avatarPublicId || (company as any)?.avatar?.public_id;
  const companyVerified = (company as any)?.verified || false;

  // =====================
  // MAIN RENDER
  // =====================

  return (
    <div className={cn('min-h-screen', colorClasses.bg.primary, 'dark:bg-gray-950', className)}>
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">

        {/* ── HEADER ── */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className={cn('p-0 h-auto', colorClasses.text.primary, 'dark:text-gray-300 dark:hover:text-white')}
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>

              {/* Company identity strip */}
              {(company || companyId) && (
                <div className="flex items-center gap-2">
                  <CompanyAvatarDisplay
                    companyName={(company as any)?.name || 'Company'}
                    avatarUrl={companyAvatarUrl}
                    avatarPublicId={companyAvatarPublicId}
                    verified={companyVerified}
                    size="sm"
                  />
                  <div className="hidden sm:block">
                    <p className={cn('text-xs font-medium truncate max-w-[140px]', colorClasses.text.secondary, darkDesc)}>
                      {(company as any)?.name || 'Your Company'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h1 className={cn('text-xl sm:text-2xl md:text-3xl font-bold tracking-tight', colorClasses.text.primary, darkLabel)}>
                  {isEditMode ? 'Edit Product' : 'Create New Product'}
                </h1>
                <p className={cn('mt-1 text-xs sm:text-sm md:text-base', colorClasses.text.secondary, darkDesc)}>
                  {isEditMode ? 'Update product information and specifications' : 'Add a new product to your catalog'}
                </p>
              </div>
            </div>

            {/* Header action buttons */}
            <div className="flex gap-2 w-full sm:w-auto">
              {isEditMode && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteProduct}
                  disabled={isSubmitting || loading}
                  size={breakpoint === 'mobile' ? 'default' : 'sm'}
                  className={cn('flex-1 sm:flex-none', getTouchTargetSize('lg'))}
                >
                  <Trash2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || loading}
                size={breakpoint === 'mobile' ? 'default' : 'sm'}
                className={cn('flex-1 sm:flex-none', getTouchTargetSize('lg'), colorClasses.border.gray200, colorClasses.text.primary, darkSelect)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                size={breakpoint === 'mobile' ? 'default' : 'sm'}
                className={cn('flex-1 sm:flex-none', getTouchTargetSize('lg'), colorClasses.bg.goldenMustard, colorClasses.text.white)}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{isEditMode ? 'Update' : 'Create'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator className="my-4 sm:my-6 dark:bg-gray-800" />
        </div>

        {/* ── GLOBAL ERRORS ── */}
        {formErrors.length > 0 && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-xl border bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800">
            <div className="flex items-start gap-2 sm:gap-3">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 shrink-0 text-orange-500" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm sm:text-base text-orange-700 dark:text-orange-400">Please fix the following errors:</h4>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-orange-600 dark:text-orange-500">
                  {formErrors.map((error, index) => <li key={index}>{error}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ── PROGRESS BAR ── */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className={cn('text-xs sm:text-sm font-medium', colorClasses.text.primary, darkLabel)}>Form Completion</span>
            <span className={cn('text-xs sm:text-sm', colorClasses.text.secondary, darkDesc)}>{calculateProgress()}%</span>
          </div>
          <div className={cn('w-full h-1.5 sm:h-2 rounded-full', colorClasses.bg.secondary, 'dark:bg-gray-800')}>
            <div
              className="h-1.5 sm:h-2 rounded-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%`, backgroundColor: colors.goldenMustard }}
            />
          </div>
        </div>

        {/* ── LAYOUT GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

          {/* Left sidebar nav */}
          <div className="lg:col-span-3">
            {breakpoint === 'mobile' ? (
              <MobileTabSelector tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} tabErrors={tabErrors} theme={theme} />
            ) : (
              <Card className={cn('border shadow-sm sticky top-6', colorClasses.border.gray200, darkCard)}>
                <CardContent className="p-3 sm:p-4">
                  <nav className="space-y-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      const tabHasErrors = (tabErrors[tab.id] || []).length > 0;

                      return (
                        <button
                          key={tab.id}
                          onClick={() => handleTabChange(tab.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                            isActive
                              ? cn(colorClasses.bg.goldenMustard, 'shadow-sm')
                              : cn(
                                'hover:bg-gray-100 dark:hover:bg-gray-800/60',
                                getTabStyle(false, tabHasErrors),
                                'border-transparent',
                              ),
                          )}
                        >
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-white' : colorClasses.text.secondary)} />
                            <span className={cn(
                              'font-medium text-xs sm:text-sm truncate',
                              isActive ? colorClasses.text.white : cn(colorClasses.text.primary, darkLabel),
                            )}>
                              {tab.label}
                            </span>
                            {tab.required && !isActive && (
                              <span className={cn('text-[10px] shrink-0', colorClasses.text.error)}>*</span>
                            )}
                            {tabHasErrors && (
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            )}
                          </div>
                          {isActive && <ChevronRight className="h-3 w-3 text-white shrink-0" />}
                        </button>
                      );
                    })}
                  </nav>

                  {/* Sidebar: company display */}
                  {(company || companyId) && (
                    <div className={cn('mt-4 p-3 rounded-xl border', colorClasses.border.gray200, colorClasses.bg.secondary, darkSecondary)}>
                      <div className="flex items-center gap-2.5">
                        <CompanyAvatarDisplay
                          companyName={(company as any)?.name || 'Company'}
                          avatarUrl={companyAvatarUrl}
                          avatarPublicId={companyAvatarPublicId}
                          verified={companyVerified}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-xs font-semibold truncate', colorClasses.text.primary, darkLabel)}>
                            {(company as any)?.name || 'Your Company'}
                          </p>
                          {(company as any)?.industry && (
                            <p className={cn('text-[10px] truncate', colorClasses.text.secondary, darkDesc)}>
                              {(company as any).industry}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form status */}
                  <div className={cn('mt-4 p-3 rounded-xl', colorClasses.bg.secondary, darkSecondary)}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-xs font-medium', colorClasses.text.primary, darkLabel)}>Form Status</span>
                        {Object.keys(form.formState.errors).length > 0 ? (
                          <div className={cn('flex items-center gap-1', colorClasses.text.error)}>
                            <XCircle className="h-3 w-3" />
                            <span className="text-xs">{Object.keys(form.formState.errors).length} error(s)</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
                            <Check className="h-3 w-3" />
                            <span className="text-xs">Valid</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        {[
                          { label: 'Images', value: `${existingImages.length + newImages.length}/5` },
                          { label: 'Tags', value: `${(formValuesRef.current.tags || []).length}/20` },
                          { label: 'Specs', value: `${(formValuesRef.current.specifications || []).length}/50` },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className={cn(colorClasses.text.secondary, darkDesc)}>{label}</span>
                            <span className={cn('font-medium', colorClasses.text.primary, darkLabel)}>{value}</span>
                          </div>
                        ))}
                      </div>

                      {hasUnsavedChanges && (
                        <div className="mt-2 p-2 rounded-lg border border-[#F1BB03]/30 bg-[#F1BB03]/10 dark:bg-[#F1BB03]/5">
                          <div className="flex items-center gap-1.5">
                            <AlertCircle className="h-3 w-3 text-[#F1BB03]" />
                            <span className="text-[10px] text-[#F1BB03] font-medium">Unsaved changes</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main form area */}
          <div className="lg:col-span-9">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              className="space-y-4 sm:space-y-6"
            >
              {renderTabContent()}

              {/* Sticky bottom action bar */}
              <div className={cn(
                'sticky bottom-2 sm:bottom-4 backdrop-blur-md border rounded-xl p-3 sm:p-4 shadow-lg z-30',
                colorClasses.bg.primary,
                'dark:bg-gray-900/95',
                colorClasses.border.gray200,
                'dark:border-gray-700',
              )}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                  {/* Prev / Next navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const idx = tabs.findIndex(t => t.id === activeTab);
                        if (idx > 0) { setActiveTab(tabs[idx - 1].id); markTabAsVisited(tabs[idx - 1].id); }
                      }}
                      disabled={activeTab === tabs[0].id}
                      size="sm"
                      className={cn(getTouchTargetSize('md'), colorClasses.border.gray200, colorClasses.text.primary, darkSelect)}
                    >
                      <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                      <span className="hidden sm:inline text-xs">Prev</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const idx = tabs.findIndex(t => t.id === activeTab);
                        if (idx < tabs.length - 1) handleTabChange(tabs[idx + 1].id);
                      }}
                      disabled={activeTab === tabs[tabs.length - 1].id}
                      size="sm"
                      className={cn(getTouchTargetSize('md'), colorClasses.border.gray200, colorClasses.text.primary, darkSelect)}
                    >
                      <span className="hidden sm:inline text-xs">Next</span>
                      <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
                    </Button>
                  </div>

                  {/* Right side: image counters + save actions */}
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-3 text-xs">
                      {existingImages.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Cloud className={cn('h-3 w-3', colorClasses.text.blue)} />
                          <span className={cn('hidden sm:inline', colorClasses.text.secondary, darkDesc)}>
                            {existingImages.length} cloud
                          </span>
                        </div>
                      )}
                      {newImages.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <ImageIcon className={cn('h-3 w-3', colorClasses.text.green)} />
                          <span className={cn('hidden sm:inline', colorClasses.text.secondary, darkDesc)}>
                            {newImages.length} new
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={handleSaveAsDraft}
                        disabled={isSubmitting || loading}
                        variant="outline"
                        size="sm"
                        className={cn(getTouchTargetSize('lg'), colorClasses.border.gray200, colorClasses.text.primary, darkSelect)}
                      >
                        <span className="hidden sm:inline">Save as Draft</span>
                        <span className="sm:hidden text-xs">Draft</span>
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || loading}
                        size="sm"
                        className={cn(
                          'min-w-[80px] sm:min-w-[140px]',
                          getTouchTargetSize('lg'),
                          colorClasses.bg.goldenMustard,
                          colorClasses.text.white,
                          'hover:opacity-90',
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2 animate-spin" />
                            <span className="hidden sm:inline">{isEditMode ? 'Updating...' : 'Creating...'}</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                            <span className="hidden sm:inline">{isEditMode ? 'Update' : 'Publish'}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;