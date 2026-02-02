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
import { colors, getTheme } from '@/utils/color';
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
} from 'lucide-react';
import { useRouter } from 'next/router';

// Combined validation schema for final submission
const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(120),
  description: z.string().min(1, 'Description is required').max(2000),
  shortDescription: z.string().max(250).optional().or(z.literal('')),
  price: z.object({
    amount: z.union([
      z.string().min(1, 'Price is required').refine(val => !isNaN(parseFloat(val)), 'Must be a valid number'),
      z.number().min(0.01, 'Price must be greater than 0')
    ]),
    currency: z.string().min(1, 'Currency is required'),
    unit: z.string().min(1, 'Unit is required'),
  }),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()),
  specifications: z.array(z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required')
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
  price: { amount: '', currency: 'USD', unit: 'unit' }, // Empty string for new products
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

interface ProductFormProps {
  product?: Product;
  company?: Company;
  companyId?: string;
  mode?: 'create' | 'edit';
  onSuccess?: (product: Product) => void;
  onCancel?: () => void;
  className?: string;
  theme?: 'light' | 'dark';
  loading?: boolean;
}

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
  const currentTheme = getTheme(theme);

  // Use refs for persistent form data
  const formValuesRef = useRef<ProductFormValues>(defaultFormValues);
  const hasInitializedRef = useRef(false);

  // Form state
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

  // Track validation errors per tab
  const [tabErrors, setTabErrors] = useState<Record<string, string[]>>({});

  // Tabs configuration
  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Package, required: true },
    { id: 'pricing', label: 'Pricing', icon: DollarSign, required: true },
    { id: 'categories', label: 'Categories', icon: Layers, required: true },
    { id: 'images', label: 'Images', icon: ImageIcon, required: !isEditMode },
    { id: 'inventory', label: 'Inventory', icon: Package, required: false },
    { id: 'specs', label: 'Specifications', icon: List, required: false },
    { id: 'seo', label: 'SEO', icon: Globe, required: false },
  ];

  // Tab validation configuration
  const tabValidationConfig = {
    basic: ['name', 'description', 'shortDescription', 'sku'],
    pricing: ['price.amount', 'price.currency', 'price.unit', 'featured'],
    categories: ['category', 'subcategory', 'tags'],
    images: [], // Images validated separately
    inventory: ['inventory.quantity', 'inventory.trackQuantity', 'inventory.lowStockAlert'],
    specs: ['specifications'],
    seo: ['metaTitle', 'metaDescription'],
  } as const;

  // Currency and unit options
  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'ETB', label: 'ETB (Br)' },
  ];

  const units = [
    'unit', 'kg', 'lb', 'piece', 'set', 'pair', 'dozen', 'meter', 'liter',
    'box', 'pack', 'bundle', 'roll', 'sheet', 'bottle', 'can', 'tube'
  ];

  // Status options for edit mode
  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // Initialize form with useForm
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: defaultFormValues,
    mode: 'onChange',
    shouldUnregister: false,
  });

  // Initialize form values ONCE
  useEffect(() => {
    if (hasInitializedRef.current) return;

    let initialValues: ProductFormValues;

    if (isEditMode && product) {
      // Convert product to form values
      initialValues = {
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription || '',
        price: {
          amount: product.price.amount,
          currency: product.price.currency || 'USD',
          unit: product.price.unit || 'unit'
        },
        category: product.category,
        subcategory: product.subcategory || '',
        tags: product.tags || [],
        specifications: product.specifications && product.specifications.length > 0
          ? product.specifications
          : [{ key: '', value: '' }],
        featured: product.featured || false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || '',
        sku: product.sku || '',
        inventory: product.inventory || defaultFormValues.inventory,
      };
    } else {
      // New product - generate SKU, empty price
      const generatedSku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      initialValues = {
        ...defaultFormValues,
        sku: generatedSku,
        price: { amount: '', currency: 'USD', unit: 'unit' } // Empty price for new products
      };
    }

    // Set form values and ref
    form.reset(initialValues);
    formValuesRef.current = initialValues;
    hasInitializedRef.current = true;

    // Initialize existing images for edit mode
    if (isEditMode && product && product.images) {
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

  // Watch form changes and update ref
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values) {
        formValuesRef.current = values as ProductFormValues;
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Mark tab as visited
  const markTabAsVisited = (tabId: string) => {
    setVisitedTabs(prev => new Set([...prev, tabId]));
  };

  // Tab-specific validation
  const validateCurrentTab = useCallback(async (tabId?: string): Promise<boolean> => {
    const targetTabId = tabId || activeTab;
    const fieldsToValidate = tabValidationConfig[targetTabId as keyof typeof tabValidationConfig] || [];

    if (fieldsToValidate.length === 0) {
      // Handle images tab separately
      if (targetTabId === 'images') {
        const hasImages = newImages.length > 0 || existingImages.length > 0;
        if (!hasImages && !isEditMode) {
          setTabErrors(prev => ({
            ...prev,
            images: ['At least one product image is required']
          }));
          return false;
        }
        setTabErrors(prev => ({
          ...prev,
          images: []
        }));
        return true;
      }
      return true;
    }

    const result = await form.trigger(fieldsToValidate as any);

    // Collect errors for this tab
    const errors = fieldsToValidate
      .map(field => {
        const fieldError = form.formState.errors[field as keyof typeof form.formState.errors];
        return fieldError?.message;
      })
      .filter(Boolean) as string[];

    setTabErrors(prev => ({
      ...prev,
      [targetTabId]: errors
    }));

    return result;
  }, [activeTab, form, newImages.length, existingImages.length, isEditMode]);

  // Handle tab navigation with proper validation
  const handleTabChange = async (targetTabId: string) => {
    if (targetTabId === activeTab) return;

    // Mark target tab as visited
    markTabAsVisited(targetTabId);

    // Validate only if we're leaving a visited tab
    if (visitedTabs.has(activeTab)) {
      const isValid = await validateCurrentTab();

      if (!isValid) {
        // Show warning but allow navigation
        const currentTab = tabs.find(t => t.id === activeTab);
        if (currentTab) {
          productToast.warning(`Please fix errors in ${currentTab.label} tab`);
        }

        // Still allow navigation but show errors
        setActiveTab(targetTabId);
        return;
      }
    }

    // Clear errors for current tab
    setTabErrors(prev => ({
      ...prev,
      [activeTab]: []
    }));

    // Navigate to new tab
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

  // Specification management
  const addSpecification = () => {
    const currentSpecs = formValuesRef.current.specifications || [];
    if (currentSpecs.length < 50) {
      form.setValue('specifications', [...currentSpecs, { key: '', value: '' }], { shouldValidate: true });
      setHasUnsavedChanges(true);
      markTabAsVisited('specs');
    }
  };

  const removeSpecification = (index: number) => {
    const currentSpecs = formValuesRef.current.specifications || [];
    if (currentSpecs.length > 1) {
      form.setValue('specifications', currentSpecs.filter((_, i) => i !== index), { shouldValidate: true });
      setHasUnsavedChanges(true);
    }
  };

  // Generate SKU
  const generateSku = () => {
    const newSku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    form.setValue('sku', newSku);
    setHasUnsavedChanges(true);
    productToast.success('New SKU generated');
  };

  // Update specification field
  const updateSpecification = (index: number, field: 'key' | 'value', value: string) => {
    const specs = [...(formValuesRef.current.specifications || [])];
    specs[index] = { ...specs[index], [field]: value };
    form.setValue('specifications', specs, { shouldValidate: true });
    setHasUnsavedChanges(true);
    markTabAsVisited('specs');
  };

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setFormErrors([]);

      // Validate all visited tabs
      const visitedTabIds = Array.from(visitedTabs);
      let allValid = true;

      for (const tabId of visitedTabIds) {
        const currentTab = tabs.find(t => t.id === tabId);
        if (currentTab?.required && tabId !== 'images') {
          const isValid = await validateCurrentTab(tabId);
          if (!isValid) {
            allValid = false;
          }
        }
      }

      if (!allValid) {
        productToast.error('Please fix all required fields before saving as draft');
        return;
      }

      console.log('🔄 Saving product as draft...', {
        mode,
        hasImages: newImages.length + existingImages.length
      });

      let result: Product;

      if (isEditMode && product?._id) {
        // Update existing product as draft
        result = await productService.updateProduct(
          product._id,
          {
            ...formValuesRef.current as UpdateProductData,
            status: 'draft'
          },
          newImages,
          {
            existingImages: existingImages.map(img => img.public_id!).filter(Boolean),
            imagesToDelete,
            primaryImageIndex
          }
        );
        productToast.success('Product saved as draft');
      } else {
        // Create new product as draft
        const productData: CreateProductData = {
          ...formValuesRef.current,
          companyId: company?._id || companyId
        };

        result = await productService.createProduct(
          productData,
          newImages
        );

        // Update status to draft after creation
        result = await productService.updateProductStatus(result._id, 'draft');
        productToast.success('Product saved as draft');
      }

      // Reset form state
      setHasUnsavedChanges(false);
      setNewImages([]);
      setImagesToDelete([]);
      hasInitializedRef.current = false;

      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/products/${result._id}`);
      }

    } catch (error: any) {
      console.error('❌ Save draft error:', error);
      setFormErrors([error.message || 'Failed to save product as draft']);
      productToast.error(error.message || 'Failed to save product as draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle publish/submit
  const handleSubmit = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setFormErrors([]);

      // Validate all visited tabs
      const visitedTabIds = Array.from(visitedTabs);
      let allValid = true;
      let firstInvalidTab = '';

      for (const tabId of visitedTabIds) {
        const currentTab = tabs.find(t => t.id === tabId);
        if (currentTab?.required) {
          const isValid = await validateCurrentTab(tabId);
          if (!isValid) {
            allValid = false;
            if (!firstInvalidTab) {
              firstInvalidTab = tabId;
            }
          }
        }
      }

      if (!allValid) {
        // Navigate to first invalid tab
        if (firstInvalidTab && firstInvalidTab !== activeTab) {
          setActiveTab(firstInvalidTab);
        }
        productToast.error('Please fix all required fields before submitting');
        return;
      }

      // Check if we have at least one image (for new products)
      if (!isEditMode && newImages.length === 0) {
        setTabErrors(prev => ({
          ...prev,
          images: ['At least one product image is required']
        }));
        setActiveTab('images');
        productToast.error('Please upload at least one product image');
        return;
      }

      console.log('🔄 Submitting product form...', {
        mode,
        hasImages: newImages.length + existingImages.length,
        price: formValuesRef.current.price
      });

      let result: Product;

      if (isEditMode && product?._id) {
        // Update existing product
        const updateData: UpdateProductData = {
          ...formValuesRef.current,
          existingImages: existingImages.map(img => img.public_id!).filter(Boolean),
          imagesToDelete,
          primaryImageIndex,
          status: product.status || 'active'
        };

        result = await productService.updateProduct(
          product._id,
          updateData,
          newImages,
          {
            existingImages: existingImages.map(img => img.public_id!).filter(Boolean),
            imagesToDelete,
            primaryImageIndex
          }
        );
        productToast.success('Product updated successfully');
      } else {
        // Create new product
        const productData: CreateProductData = {
          ...formValuesRef.current,
          companyId: company?._id || companyId
        };

        result = await productService.createProduct(
          productData,
          newImages
        );
        productToast.success('Product created successfully');
      }

      // Reset form state
      setHasUnsavedChanges(false);
      setNewImages([]);
      setImagesToDelete([]);
      hasInitializedRef.current = false;

      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(result);
      } else {
        router.push(`/products/${result._id}`);
      }

    } catch (error: any) {
      console.error('❌ Product form submission error:', error);

      // Handle specific error cases
      if (error.type === 'VALIDATION') {
        const errors = error.message.split(', ');
        setFormErrors(errors);
        errors.forEach((err: string) => productToast.error(err));
      } else if (error.code === 'DUPLICATE_SKU') {
        form.setError('sku', { message: 'SKU already exists' });
        productToast.error('SKU already exists. Please use a different SKU.');
      } else if (error.code === 'NO_IMAGES') {
        setTabErrors(prev => ({
          ...prev,
          images: ['At least one product image is required']
        }));
        setActiveTab('images');
        productToast.error('At least one product image is required');
      } else if (error.code === 'NO_VALID_IMAGES') {
        setTabErrors(prev => ({
          ...prev,
          images: ['No valid images could be uploaded. Please check file formats.']
        }));
        setActiveTab('images');
        productToast.error('No valid images could be uploaded. Please check file formats.');
      } else {
        setFormErrors([error.message || 'Failed to save product']);
        productToast.error(error.message || 'Failed to save product');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete product
  const handleDeleteProduct = async () => {
    if (!isEditMode || !product?._id) return;

    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setIsSubmitting(true);
      await productService.deleteProduct(product._id);
      productToast.success('Product deleted successfully');
      router.push('/products');
    } catch (error: any) {
      console.error('❌ Delete product error:', error);
      productToast.error(error.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel with warning about unsaved changes
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        if (onCancel) onCancel();
        else router.back();
      }
    } else {
      if (onCancel) onCancel();
      else router.back();
    }
  };

  // Get tab style
  const getTabStyle = (isActive: boolean, hasErrors: boolean) => {
    if (isActive) {
      return {
        backgroundColor: colors.goldenMustard,
        color: colors.white,
      };
    }

    if (hasErrors) {
      return {
        backgroundColor: 'transparent',
        color: currentTheme.text.error,
        border: `1px solid ${currentTheme.border.orange}`,
      };
    }

    return {
      backgroundColor: 'transparent',
      color: currentTheme.text.primary,
      border: `1px solid ${currentTheme.border.gray100}`,
    };
  };

  // Render all form fields but conditionally show based on active tab
  const renderFormFields = () => {
    return (
      <>
        {/* Basic Info Tab */}
        {(activeTab === 'basic') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter product name"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}
                      />
                    </FormControl>
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Descriptive name for your product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="e.g., PROD-001"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e.target.value);
                            setHasUnsavedChanges(true);
                          }}
                          style={{
                            backgroundColor: currentTheme.bg.white,
                            borderColor: currentTheme.border.gray100,
                            color: currentTheme.text.primary,
                          }}
                          className="flex-1"
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateSku}
                        style={{
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Unique identifier for inventory management
                    </FormDescription>
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
                  <FormLabel>Short Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Brief description for product listings"
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Appears in product listings (max 250 chars)
                    </FormDescription>
                    <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                      {(field.value || '').length}/250
                    </span>
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
                  <FormLabel>Full Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="Detailed product description, features, and benefits"
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                      className="min-h-[150px]"
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Full product details and features (max 2000 chars)
                    </FormDescription>
                    <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                      {(field.value || '').length}/2000
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Pricing Tab */}
        {(activeTab === 'pricing') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="price.amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={field.value === '' ? '' : field.value}
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                          field.onChange(value);
                          setHasUnsavedChanges(true);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                          field.onChange(value);
                        }}
                        style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}
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
                    <FormLabel>Currency *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setHasUnsavedChanges(true);
                      }}
                      value={field.value || 'USD'}
                    >
                      <FormControl>
                        <SelectTrigger style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
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
                    <FormLabel>Unit *</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setHasUnsavedChanges(true);
                      }}
                      value={field.value || 'unit'}
                    >
                      <FormControl>
                        <SelectTrigger style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
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
                <FormItem className="flex items-center justify-between rounded-lg border p-4" style={{
                  borderColor: currentTheme.border.gray100,
                  backgroundColor: currentTheme.bg.gray100,
                }}>
                  <div>
                    <FormLabel className="text-base" style={{ color: currentTheme.text.primary }}>
                      Featured Product
                    </FormLabel>
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Show this product in featured sections
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setHasUnsavedChanges(true);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        {/* Categories Tab */}
        {(activeTab === 'categories') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Electronics, Clothing"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}
                      />
                    </FormControl>
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Main product category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subcategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Smartphones, T-Shirts"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                          setHasUnsavedChanges(true);
                        }}
                        style={{
                          backgroundColor: currentTheme.bg.white,
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}
                      />
                    </FormControl>
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Optional subcategory
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormLabel>Tags</FormLabel>
              <div className="flex gap-2 mb-4">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tags and press Enter"
                  style={{
                    backgroundColor: currentTheme.bg.white,
                    borderColor: currentTheme.border.gray100,
                    color: currentTheme.text.primary,
                  }}
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  disabled={(formValuesRef.current.tags || []).length >= 20}
                  style={{
                    borderColor: currentTheme.border.gray100,
                    color: currentTheme.text.primary,
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {(formValuesRef.current.tags || []).map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    style={{
                      backgroundColor: currentTheme.bg.gray100,
                      color: currentTheme.text.primary,
                    }}
                    className="gap-1 px-3 py-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1"
                      style={{ color: currentTheme.text.secondary }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {(formValuesRef.current.tags || []).length === 0 && (
                  <p className="text-sm italic" style={{ color: currentTheme.text.secondary }}>
                    No tags added yet
                  </p>
                )}
              </div>
              <FormDescription style={{ color: currentTheme.text.secondary }}>
                Add relevant keywords to help customers find this product (max 20 tags)
              </FormDescription>
            </div>
          </>
        )}

        {/* Images Tab */}
        {(activeTab === 'images') && (
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

            {/* Images summary */}
            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className="rounded-lg border p-4" style={{
                borderColor: currentTheme.border.gray100,
                backgroundColor: currentTheme.bg.gray100,
              }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium" style={{ color: currentTheme.text.primary }}>
                    Images Summary
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4" style={{ color: currentTheme.text.blue }} />
                      <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                        {existingImages.length} existing
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" style={{ color: currentTheme.text.green }} />
                      <span className="text-sm" style={{ color: currentTheme.text.primary }}>
                        {newImages.length} new
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Inventory Tab */}
        {(activeTab === 'inventory') && (
          <>
            <FormField
              control={form.control}
              name="inventory.trackQuantity"
              render={({ field }) => (
                <FormItem className="rounded-lg border p-4" style={{
                  borderColor: currentTheme.border.gray100,
                  backgroundColor: currentTheme.bg.gray100,
                }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel className="text-base" style={{ color: currentTheme.text.primary }}>
                        Track Inventory
                      </FormLabel>
                      <FormDescription style={{ color: currentTheme.text.secondary }}>
                        Enable stock quantity tracking and alerts
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setHasUnsavedChanges(true);
                        }}
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {formValuesRef.current.inventory?.trackQuantity && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="inventory.quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              field.onChange(value);
                              setHasUnsavedChanges(true);
                            }}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              field.onChange(value);
                            }}
                            style={{
                              backgroundColor: currentTheme.bg.white,
                              borderColor: currentTheme.border.gray100,
                              color: currentTheme.text.primary,
                            }}
                          />
                        </FormControl>
                        <FormDescription style={{ color: currentTheme.text.secondary }}>
                          Current available stock
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inventory.lowStockAlert"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Stock Alert</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="10"
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              field.onChange(value);
                              setHasUnsavedChanges(true);
                            }}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              field.onChange(value);
                            }}
                            style={{
                              backgroundColor: currentTheme.bg.white,
                              borderColor: currentTheme.border.gray100,
                              color: currentTheme.text.primary,
                            }}
                          />
                        </FormControl>
                        <FormDescription style={{ color: currentTheme.text.secondary }}>
                          Get notified when stock falls below this level
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="p-4 rounded-lg border" style={{
                  borderColor: currentTheme.border.gray100,
                  backgroundColor: currentTheme.bg.gray100,
                }}>
                  <h4 className="font-medium mb-2" style={{ color: currentTheme.text.primary }}>
                    Stock Status
                  </h4>
                  {(() => {
                    const inventory = formValuesRef.current.inventory || defaultFormValues.inventory;
                    const stockStatus = productService.getStockStatus(inventory);
                    return (
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stockStatus.color }} />
                        <span style={{ color: stockStatus.color }}>{stockStatus.text}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}

        {/* Specifications Tab */}
        {(activeTab === 'specs') && (
          <>
            <div className="space-y-4">
              {(formValuesRef.current.specifications || []).map((spec, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <Input
                      value={spec.key || ''}
                      onChange={(e) => updateSpecification(index, 'key', e.target.value)}
                      placeholder="Specification name"
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                    />
                  </div>
                  <div className="col-span-6">
                    <Input
                      value={spec.value || ''}
                      onChange={(e) => updateSpecification(index, 'value', e.target.value)}
                      placeholder="Specification value"
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSpecification(index)}
                      disabled={(formValuesRef.current.specifications || []).length <= 1}
                      style={{ color: currentTheme.text.secondary }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={addSpecification}
                variant="outline"
                disabled={(formValuesRef.current.specifications || []).length >= 50}
                style={{
                  borderColor: currentTheme.border.gray100,
                  color: currentTheme.text.primary,
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Specification
              </Button>
              <Button
                type="button"
                onClick={() => {
                  form.setValue('specifications', [{ key: '', value: '' }], { shouldValidate: true });
                  setHasUnsavedChanges(true);
                }}
                variant="ghost"
                style={{ color: currentTheme.text.secondary }}
              >
                Clear All
              </Button>
            </div>
          </>
        )}

        {/* SEO Tab */}
        {(activeTab === 'seo') && (
          <>
            <FormField
              control={form.control}
              name="metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SEO title for search engines"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Appears in browser tabs and search results
                    </FormDescription>
                    <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                      {(field.value || '').length}/60
                    </span>
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
                  <FormLabel>Meta Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      placeholder="SEO description for search results"
                      style={{
                        backgroundColor: currentTheme.bg.white,
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <div className="flex items-center justify-between">
                    <FormDescription style={{ color: currentTheme.text.secondary }}>
                      Brief description for search engine snippets
                    </FormDescription>
                    <span className="text-sm" style={{ color: currentTheme.text.secondary }}>
                      {(field.value || '').length}/160
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}
      </>
    );
  };

  // Render current tab content
  const renderTabContent = () => {
    const currentTab = tabs.find(t => t.id === activeTab);
    if (!currentTab) return null;

    // Show tab errors if any
    const currentTabErrors = tabErrors[activeTab] || [];

    return (
      <Card style={{ borderColor: currentTheme.border.gray100 }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: currentTheme.text.primary }}>
            <currentTab.icon className="h-5 w-5" />
            {currentTab.label}
            {currentTab.required && (
              <span className="text-xs font-normal" style={{ color: currentTheme.text.error }}>
                * Required
              </span>
            )}
          </CardTitle>
          {currentTabErrors.length > 0 && (
            <div className="p-3 rounded-md" style={{
              backgroundColor: `${currentTheme.bg.orange}20`,
              border: `1px solid ${currentTheme.border.orange}`
            }}>
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5" style={{ color: currentTheme.text.orange }} />
                <div className="space-y-1">
                  <p className="text-sm font-medium" style={{ color: currentTheme.text.orange }}>
                    Please fix the following:
                  </p>
                  <ul className="text-xs space-y-0.5">
                    {currentTabErrors.map((error, idx) => (
                      <li key={idx} style={{ color: currentTheme.text.orange }}>
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            {renderFormFields()}
          </Form>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("min-h-screen", className)} style={{ backgroundColor: currentTheme.bg.white }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                style={{ color: currentTheme.text.primary }}
                className="p-0 h-auto"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: currentTheme.text.primary }}>
                  {isEditMode ? 'Edit Product' : 'Create New Product'}
                </h1>
                <p className="mt-2" style={{ color: currentTheme.text.secondary }}>
                  {isEditMode
                    ? 'Update product information and specifications'
                    : 'Add a new product to your catalog'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditMode && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteProduct}
                  disabled={isSubmitting || loading}
                  style={{
                    backgroundColor: currentTheme.bg.gold,
                    color: currentTheme.text.primary,
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || loading}
                style={{
                  borderColor: currentTheme.border.gray100,
                  color: currentTheme.text.primary,
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAsDraft}
                disabled={isSubmitting || loading}
                variant="outline"
                style={{
                  borderColor: currentTheme.border.gray100,
                  color: currentTheme.text.primary,
                }}
              >
                Save as Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || loading}
                className="min-w-[160px]"
                style={{
                  backgroundColor: colors.goldenMustard,
                  color: colors.white,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {isEditMode ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator className="my-6" style={{ backgroundColor: currentTheme.bg.gray100 }} />
        </div>

        {/* Global form errors */}
        {formErrors.length > 0 && (
          <div className="mb-6 p-4 rounded-lg border" style={{
            backgroundColor: `${currentTheme.bg.orange}20`,
            borderColor: currentTheme.border.orange,
          }}>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 mt-0.5" style={{ color: currentTheme.text.orange }} />
              <div className="space-y-1">
                <h4 className="font-medium" style={{ color: currentTheme.text.orange }}>
                  Please fix the following errors:
                </h4>
                <ul className="list-disc list-inside space-y-1">
                  {formErrors.map((error, index) => (
                    <li key={index} className="text-sm" style={{ color: currentTheme.text.orange }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Navigation */}
          <div className="lg:col-span-3">
            <Card style={{ borderColor: currentTheme.border.gray100 }}>
              <CardContent className="p-6">
                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const tabHasErrors = (tabErrors[tab.id] || []).length > 0;
                    const tabStyle = getTabStyle(isActive, tabHasErrors);

                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        style={tabStyle}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all relative',
                          'hover:bg-goldenMustard/20 hover:text-goldenMustard',
                          !isActive && 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{tab.label}</span>
                          {tab.required && !isActive && (
                            <span className="text-xs" style={{ color: currentTheme.text.error }}>
                              *
                            </span>
                          )}
                          {tabHasErrors && (
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </div>
                        {isActive && <ChevronRight className="h-4 w-4" />}
                      </button>
                    );
                  })}
                </nav>

                {/* Form status */}
                <div className="mt-8 p-4 rounded-lg" style={{ backgroundColor: currentTheme.bg.gray100 }}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: currentTheme.text.primary }}>
                        Form Status
                      </span>
                      {Object.keys(form.formState.errors).length > 0 ? (
                        <div className="flex items-center gap-1" style={{ color: currentTheme.text.error }}>
                          <XCircle className="h-4 w-4" />
                          <span className="text-xs">
                            {Object.keys(form.formState.errors).length} error(s)
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1" style={{ color: currentTheme.text.success }}>
                          <Check className="h-4 w-4" />
                          <span className="text-xs">Valid</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span style={{ color: currentTheme.text.secondary }}>Images</span>
                        <span style={{ color: currentTheme.text.primary }}>
                          {existingImages.length + newImages.length}/5
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: currentTheme.text.secondary }}>Tags</span>
                        <span style={{ color: currentTheme.text.primary }}>
                          {(formValuesRef.current.tags || []).length}/20
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ color: currentTheme.text.secondary }}>Specifications</span>
                        <span style={{ color: currentTheme.text.primary }}>
                          {(formValuesRef.current.specifications || []).length}/50
                        </span>
                      </div>
                    </div>

                    {/* Unsaved changes indicator */}
                    {hasUnsavedChanges && (
                      <div className="mt-3 p-2 rounded border" style={{
                        backgroundColor: `${colors.gold}20`,
                        borderColor: colors.gold,
                      }}>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-3 w-3" style={{ color: colors.gold }} />
                          <span className="text-xs" style={{ color: colors.gold }}>
                            You have unsaved changes
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main form content */}
          <div className="lg:col-span-9">
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }} className="space-y-6">
              {renderTabContent()}

              {/* Form Actions */}
              <div className="sticky bottom-6 bg-opacity-95 backdrop-blur-sm border rounded-xl p-4 shadow-lg"
                style={{
                  backgroundColor: currentTheme.bg.white,
                  borderColor: currentTheme.border.gray100,
                }}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentIndex = tabs.findIndex(t => t.id === activeTab);
                        if (currentIndex > 0) {
                          setActiveTab(tabs[currentIndex - 1].id);
                          markTabAsVisited(tabs[currentIndex - 1].id);
                        }
                      }}
                      disabled={activeTab === tabs[0].id}
                      style={{
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const currentIndex = tabs.findIndex(t => t.id === activeTab);
                        if (currentIndex < tabs.length - 1) {
                          handleTabChange(tabs[currentIndex + 1].id);
                        }
                      }}
                      disabled={activeTab === tabs[tabs.length - 1].id}
                      style={{
                        borderColor: currentTheme.border.gray100,
                        color: currentTheme.text.primary,
                      }}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-4 text-sm">
                      {existingImages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4" style={{ color: currentTheme.text.blue }} />
                          <span style={{ color: currentTheme.text.secondary }}>
                            {existingImages.length} Cloudinary images
                          </span>
                        </div>
                      )}
                      {newImages.length > 0 && (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" style={{ color: currentTheme.text.green }} />
                          <span style={{ color: currentTheme.text.secondary }}>
                            {newImages.length} new images
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
                        style={{
                          borderColor: currentTheme.border.gray100,
                          color: currentTheme.text.primary,
                        }}
                      >
                        Save as Draft
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting || loading}
                        className="min-w-[160px]"
                        style={{
                          backgroundColor: colors.goldenMustard,
                          color: colors.white,
                        }}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isEditMode ? 'Updating...' : 'Creating...'}
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            {isEditMode ? 'Update Product' : 'Create Product'}
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