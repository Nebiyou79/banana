/**
 * frontend/src/components/Products/ProductForm.tsx  (UPDATED)
 *
 * Full create/edit product form with:
 *  - CategorySelector (hierarchical)
 *  - Cloudinary image upload (create + edit)
 *  - Tab navigation: Basic / Pricing / Category / Images / Inventory / Specs / SEO
 *  - zod validation
 */
'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import {
  Product, CreateProductData, UpdateProductData,
  productService, productToast,
} from '@/services/productService';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { CategorySelector } from './CategorySelector';
import { ImageUploader, ExistingImage } from './ImageUpload';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/social/ui/Badge';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/Form';
import { Separator } from '@/components/ui/Separator';
import {
  Package, DollarSign, Layers, Image as ImageIcon,
  Globe, List, Plus, X, Save, Loader2, RefreshCw,
  ChevronLeft, ChevronRight, AlertCircle, Check, XCircle,
} from 'lucide-react';
import { useRouter } from 'next/router';

// ── Schema ─────────────────────────────────────────────────────────────────────

const schema = z.object({
  name:            z.string().min(1, 'Product name is required').max(120),
  description:     z.string().min(1, 'Description is required').max(2000),
  shortDescription:z.string().max(250).optional().or(z.literal('')),
  priceAmount:     z.union([
    z.string().min(1,'Price is required').refine(v => !isNaN(parseFloat(v)),'Must be a number'),
    z.number().min(0.01,'Price must be > 0'),
  ]),
  priceCurrency:   z.string().min(1),
  priceUnit:       z.string().min(1),
  category:        z.string().min(1,'Category is required'),
  subcategory:     z.string().optional().or(z.literal('')),
  tags:            z.array(z.string()),
  specifications:  z.array(z.object({ key: z.string(), value: z.string() })),
  featured:        z.boolean(),
  sku:             z.string().optional().or(z.literal('')),
  inventoryQty:    z.number().min(0),
  trackQuantity:   z.boolean(),
  lowStockAlert:   z.number().min(0),
  metaTitle:       z.string().max(60).optional().or(z.literal('')),
  metaDescription: z.string().max(160).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

const CURRENCIES = ['USD','EUR','GBP','ETB','CAD','AUD'];
const COMMON_UNITS = ['unit','kg','g','lb','piece','set','pair','dozen','meter','liter','box','pack'];

interface ProductFormProps {
  product?:   Product;
  companyId?: string;
  mode?:      'create' | 'edit';
  onSuccess?: (product: Product) => void;
  onCancel?:  () => void;
}

const TABS = [
  { id: 'basic',     label: 'Basic Info',    icon: Package,   required: true  },
  { id: 'pricing',   label: 'Pricing',       icon: DollarSign,required: true  },
  { id: 'category',  label: 'Category',      icon: Layers,    required: true  },
  { id: 'images',    label: 'Images',        icon: ImageIcon, required: true  },
  { id: 'inventory', label: 'Inventory',     icon: Package,   required: false },
  { id: 'specs',     label: 'Specifications',icon: List,      required: false },
  { id: 'seo',       label: 'SEO',           icon: Globe,     required: false },
] as const;

const dI: FormValues = {
  name:'', description:'', shortDescription:'',
  priceAmount:'', priceCurrency:'USD', priceUnit:'unit',
  category:'', subcategory:'', tags:[], specifications:[{key:'',value:''}],
  featured:false, sku:'', inventoryQty:0, trackQuantity:false, lowStockAlert:10,
  metaTitle:'', metaDescription:'',
};

export const ProductForm: React.FC<ProductFormProps> = ({
  product, companyId, mode='create', onSuccess, onCancel,
}) => {
  const isEdit   = mode === 'edit';
  const router   = useRouter();
  const { breakpoint, getTouchTargetSize } = useResponsive();
  const valuesRef = useRef<FormValues>(dI);
  const initializedRef = useRef(false);

  const [newImages, setNewImages]         = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [primaryIdx, setPrimaryIdx]       = useState(0);
  const [submitting, setSubmitting]       = useState(false);
  const [activeTab, setActiveTab]         = useState('basic');
  const [tagInput, setTagInput]           = useState('');
  const [hasChanges, setHasChanges]       = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: dI,
    mode: 'onChange',
  });

  // Init
  useEffect(() => {
    if (initializedRef.current) return;
    if (isEdit && product) {
      const priceA = product.price?.amount ?? 0;
      const init: FormValues = {
        name:            product.name,
        description:     product.description,
        shortDescription:product.shortDescription || '',
        priceAmount:     typeof priceA === 'number' ? priceA : parseFloat(String(priceA)) || 0,
        priceCurrency:   product.price?.currency   || 'USD',
        priceUnit:       product.price?.unit        || 'unit',
        category:        product.category,
        subcategory:     product.subcategory        || '',
        tags:            product.tags               || [],
        specifications:  product.specifications?.length ? product.specifications : [{key:'',value:''}],
        featured:        product.featured           || false,
        sku:             product.sku                || '',
        inventoryQty:    product.inventory?.quantity      || 0,
        trackQuantity:   product.inventory?.trackQuantity || false,
        lowStockAlert:   product.inventory?.lowStockAlert || 10,
        metaTitle:       product.metaTitle          || '',
        metaDescription: product.metaDescription    || '',
      };
      form.reset(init);
      valuesRef.current = init;
      if (product.images) {
        setExistingImages(product.images.map((img, i) => ({
          secure_url: img.secure_url, public_id: img.public_id,
          altText: img.altText, isPrimary: img.isPrimary || i === 0,
        })));
      }
    } else {
      const sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
      form.reset({ ...dI, sku });
    }
    initializedRef.current = true;
  }, [product, isEdit, form]);

  useEffect(() => {
    const sub = form.watch(v => { valuesRef.current = v as FormValues; setHasChanges(true); });
    return () => sub.unsubscribe();
  }, [form]);

  const tags  = form.watch('tags');
  const specs = form.watch('specifications');
  const trackQty = form.watch('trackQuantity');
  const catVal = form.watch('category');
  const subVal = form.watch('subcategory');

  const handleSubmit = async () => {
    if (submitting) return;
    const v = valuesRef.current;

    if (!isEdit && newImages.length === 0) {
      setActiveTab('images');
      productToast.error('Please upload at least one product image');
      return;
    }

    const valid = await form.trigger();
    if (!valid) { productToast.error('Please fix validation errors'); return; }

    setSubmitting(true);
    try {
      const data: CreateProductData = {
        name:            v.name,
        description:     v.description,
        shortDescription:v.shortDescription,
        price: { amount: typeof v.priceAmount === 'string' ? parseFloat(v.priceAmount) : v.priceAmount, currency: v.priceCurrency, unit: v.priceUnit },
        category:        v.category,
        subcategory:     v.subcategory || undefined,
        tags:            v.tags,
        specifications:  v.specifications.filter(s => s.key && s.value),
        featured:        v.featured,
        sku:             v.sku || undefined,
        inventory:       { quantity: v.inventoryQty, trackQuantity: v.trackQuantity, lowStockAlert: v.lowStockAlert },
        metaTitle:       v.metaTitle || undefined,
        metaDescription: v.metaDescription || undefined,
        companyId,
      };

      let result: Product;
      if (isEdit && product) {
        result = await productService.updateProduct(product._id, data as UpdateProductData, newImages, {
          existingImages: existingImages.map(i => i.public_id!).filter(Boolean),
          imagesToDelete,
          primaryImageIndex: primaryIdx,
        });
      } else {
        result = await productService.createProduct(data, newImages);
      }

      if (onSuccess) onSuccess(result);
      else router.push(`/products/${result._id}`);
    } catch (err: any) {
      productToast.error(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const darkBase = 'dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:placeholder-gray-500 dark:focus:border-[#F1BB03]';

  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic': return (
        <div className="space-y-5">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Product Name *</FormLabel>
              <FormControl>
                <Input {...field} value={field.value||''} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} placeholder="e.g. Wireless Headphones" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="shortDescription" render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Short Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value||''} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase,'min-h-[80px]')} placeholder="Brief summary (max 250 chars)" maxLength={250} />
              </FormControl>
              <div className="flex justify-end"><span className={cn('text-xs',colorClasses.text.secondary)}>{(field.value||'').length}/250</span></div>
            </FormItem>
          )} />

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Full Description *</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value||''} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase,'min-h-[160px]')} placeholder="Detailed product description…" />
              </FormControl>
              <div className="flex justify-between">
                <FormMessage />
                <span className={cn('text-xs',colorClasses.text.secondary)}>{(field.value||'').length}/2000</span>
              </div>
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="sku" render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>SKU</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input {...field} value={field.value||''} className={cn('flex-1',colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} placeholder="PROD-001" />
                  </FormControl>
                  <Button type="button" variant="outline" onClick={() => form.setValue('sku',`PROD-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`)} className={cn(colorClasses.border.gray200,'dark:border-gray-600 dark:text-gray-300')}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </FormItem>
            )} />
          </div>
        </div>
      );

      case 'pricing': return (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="priceAmount" render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Price *</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0.01" value={field.value===''?'':field.value}
                    onChange={e => { const v=e.target.value===''?'':parseFloat(e.target.value)||0; field.onChange(v); }}
                    className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="priceCurrency" render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Currency</FormLabel>
                <FormControl>
                  <select {...field} className={cn('h-10 w-full rounded-md border px-3 text-sm',colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,'dark:bg-gray-800 dark:border-gray-600 dark:text-white')}>
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="priceUnit" render={({ field }) => (
              <FormItem>
                <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Unit</FormLabel>
                <FormControl>
                  <select {...field} className={cn('h-10 w-full rounded-md border px-3 text-sm',colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,'dark:bg-gray-800 dark:border-gray-600 dark:text-white')}>
                    {COMMON_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </FormControl>
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="featured" render={({ field }) => (
            <FormItem className={cn('flex items-center justify-between rounded-xl border p-4',colorClasses.border.gray200,colorClasses.bg.secondary,'dark:bg-gray-800 dark:border-gray-700')}>
              <div>
                <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Featured Product</FormLabel>
                <FormDescription className={cn(colorClasses.text.secondary,'dark:text-gray-400')}>Show in featured sections</FormDescription>
              </div>
              <FormControl><Switch checked={field.value||false} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
        </div>
      );

      case 'category': return (
        <div className="space-y-5">
          <div>
            <label className={cn('block text-sm font-medium mb-2',colorClasses.text.primary,'dark:text-gray-200')}>Category *</label>
            <CategorySelector
              value={{ category: catVal, subcategory: subVal || undefined }}
              onChange={({ category, subcategory }) => {
                form.setValue('category', category, { shouldValidate: true });
                form.setValue('subcategory', subcategory || '');
              }}
              error={form.formState.errors.category?.message}
            />
          </div>

          <div>
            <label className={cn('block text-sm font-medium mb-2',colorClasses.text.primary,'dark:text-gray-200')}>Tags</label>
            <div className="flex gap-2 mb-3">
              <Input value={tagInput} onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'){e.preventDefault(); const t=tagInput.trim().toLowerCase(); if(t&&!tags.includes(t)&&tags.length<20){form.setValue('tags',[...tags,t]);setTagInput('');}} }}
                className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase,'flex-1')}
                placeholder="Add tags…" />
              <Button type="button" variant="outline" onClick={() => { const t=tagInput.trim().toLowerCase(); if(t&&!tags.includes(t)&&tags.length<20){form.setValue('tags',[...tags,t]);setTagInput('');} }} className={cn(colorClasses.border.gray200,'dark:border-gray-600 dark:text-gray-300')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1 dark:bg-gray-700 dark:text-gray-200">
                  {tag}
                  <button type="button" onClick={() => form.setValue('tags',tags.filter(t=>t!==tag))}><X className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      );

      case 'images': return (
        <ImageUploader
          existingImages={existingImages} imagesToDelete={imagesToDelete} primaryImageIndex={primaryIdx}
          onExistingImagesChange={setExistingImages} onImagesToDeleteChange={setImagesToDelete} onPrimaryImageIndexChange={setPrimaryIdx}
          newImages={newImages} onNewImagesChange={setNewImages}
          maxImages={5} multiple required={!isEdit}
          label="Product Images" description="Upload high-quality product images (max 5)"
        />
      );

      case 'inventory': return (
        <div className="space-y-5">
          <FormField control={form.control} name="trackQuantity" render={({ field }) => (
            <FormItem className={cn('flex items-center justify-between rounded-xl border p-4',colorClasses.border.gray200,'dark:bg-gray-800 dark:border-gray-700')}>
              <div>
                <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Track Inventory</FormLabel>
                <FormDescription className={cn(colorClasses.text.secondary,'dark:text-gray-400')}>Enable stock quantity tracking</FormDescription>
              </div>
              <FormControl><Switch checked={field.value||false} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )} />
          {trackQty && (
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="inventoryQty" render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" value={field.value||0} onChange={e=>field.onChange(parseInt(e.target.value)||0)} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} />
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="lowStockAlert" render={({ field }) => (
                <FormItem>
                  <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Low Stock Alert</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" value={field.value||0} onChange={e=>field.onChange(parseInt(e.target.value)||0)} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} />
                  </FormControl>
                </FormItem>
              )} />
            </div>
          )}
        </div>
      );

      case 'specs': return (
        <div className="space-y-3">
          {specs.map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-5">
                <Controller control={form.control} name={`specifications.${i}.key`} render={({ field }) => (
                  <Input {...field} value={field.value||''} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} placeholder="Key" />
                )} />
              </div>
              <div className="col-span-6">
                <Controller control={form.control} name={`specifications.${i}.value`} render={({ field }) => (
                  <Input {...field} value={field.value||''} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} placeholder="Value" />
                )} />
              </div>
              <div className="col-span-1">
                <Button type="button" variant="ghost" size="icon" onClick={() => form.setValue('specifications',specs.filter((_,si)=>si!==i))} disabled={specs.length<=1} className={cn(colorClasses.text.secondary)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={() => form.setValue('specifications',[...specs,{key:'',value:''}])} disabled={specs.length>=50} className={cn(colorClasses.border.gray200,'dark:border-gray-600 dark:text-gray-300')}>
            <Plus className="h-4 w-4 mr-2" /> Add Specification
          </Button>
        </div>
      );

      case 'seo': return (
        <div className="space-y-5">
          <FormField control={form.control} name="metaTitle" render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Meta Title</FormLabel>
              <FormControl>
                <Input {...field} value={field.value||''} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase)} placeholder="SEO title" maxLength={60} />
              </FormControl>
              <div className="flex justify-end"><span className={cn('text-xs',colorClasses.text.secondary)}>{(field.value||'').length}/60</span></div>
            </FormItem>
          )} />
          <FormField control={form.control} name="metaDescription" render={({ field }) => (
            <FormItem>
              <FormLabel className={cn(colorClasses.text.primary,'dark:text-gray-200')}>Meta Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value||''} className={cn(colorClasses.bg.primary,colorClasses.border.gray200,colorClasses.text.primary,darkBase,'min-h-[80px]')} placeholder="SEO description" maxLength={160} />
              </FormControl>
              <div className="flex justify-end"><span className={cn('text-xs',colorClasses.text.secondary)}>{(field.value||'').length}/160</span></div>
            </FormItem>
          )} />
        </div>
      );

      default: return null;
    }
  };

  const currentTabIdx = TABS.findIndex(t => t.id === activeTab);

  return (
    <div className={cn('min-h-screen',colorClasses.bg.primary,'dark:bg-gray-950')}>
      <div className="container mx-auto px-4 py-6 max-w-5xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={cn('text-2xl font-bold',colorClasses.text.primary,'dark:text-white')}>
              {isEdit ? 'Edit Product' : 'Create New Product'}
            </h1>
            <p className={cn('text-sm mt-1',colorClasses.text.secondary,'dark:text-gray-400')}>
              {isEdit ? 'Update product information' : 'Add a new product to your catalogue'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel || (() => router.back())} className={cn(colorClasses.border.gray200,'dark:border-gray-600 dark:text-gray-300')}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className={cn(colorClasses.bg.goldenMustard,colorClasses.text.white,'hover:opacity-90')}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" />{isEdit ? 'Update' : 'Publish'}</>}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar tabs */}
          <div className="col-span-3">
            <div className={cn('rounded-xl border p-3 sticky top-6',colorClasses.border.gray200,'dark:bg-gray-900 dark:border-gray-700')}>
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left mb-1 text-sm transition-colors',
                      isActive ? cn(colorClasses.bg.goldenMustard,'text-white font-semibold') : cn(colorClasses.text.primary,'hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'),
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : colorClasses.text.secondary)} />
                    <span className="truncate">{tab.label}</span>
                    {tab.required && !isActive && <span className="text-red-500 text-[10px] ml-auto">*</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="col-span-9">
            <div className={cn('rounded-xl border p-6',colorClasses.border.gray200,'dark:bg-gray-900 dark:border-gray-700')}>
              <Form {...form}>
                <div className="space-y-1 mb-6">
                  <h2 className={cn('text-lg font-semibold',colorClasses.text.primary,'dark:text-white')}>
                    {TABS.find(t=>t.id===activeTab)?.label}
                  </h2>
                  <Separator className="dark:bg-gray-700" />
                </div>
                {renderTabContent()}
              </Form>
            </div>

            {/* Bottom nav */}
            <div className={cn('sticky bottom-4 mt-4 rounded-xl border p-4 flex justify-between items-center backdrop-blur-md',colorClasses.bg.primary,colorClasses.border.gray200,'dark:bg-gray-900/95 dark:border-gray-700')}>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => { if(currentTabIdx>0) setActiveTab(TABS[currentTabIdx-1].id); }} disabled={currentTabIdx===0} className={cn(colorClasses.border.gray200,'dark:border-gray-600 dark:text-gray-300')}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button type="button" variant="outline" onClick={() => { if(currentTabIdx<TABS.length-1) setActiveTab(TABS[currentTabIdx+1].id); }} disabled={currentTabIdx===TABS.length-1} className={cn(colorClasses.border.gray200,'dark:border-gray-600 dark:text-gray-300')}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className={cn(colorClasses.bg.goldenMustard,colorClasses.text.white,'hover:opacity-90 min-w-[140px]')}>
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isEdit?'Updating…':'Creating…'}</> : <><Save className="h-4 w-4 mr-2" />{isEdit?'Update Product':'Publish Product'}</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;