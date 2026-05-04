/**
 * mobile/src/components/products/ProductForm.tsx  (UPDATED)
 *
 * Key additions:
 *  - Hierarchical category / subcategory picker
 *  - Fetches taxonomy from server via useProductCategories
 *  - Subcategory list resets when category changes
 *  - price.unit field
 *  - All existing fields preserved
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Image, StyleSheet, Switch, ActivityIndicator, Alert, Modal,
  FlatList, SafeAreaView,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useProductCategories } from '../../hooks/useProducts';
import { CreateProductData, ImageAsset, ProductImage, CategoryItem } from '../../services/productService';
import useTheme from '../../hooks/useThemes';

// ── Validation ─────────────────────────────────────────────────────────────────

const schema = z.object({
  name:               z.string().min(3, 'Name must be at least 3 characters'),
  category:           z.string().min(1, 'Category is required'),
  subcategory:        z.string().optional(),
  shortDescription:   z.string().max(160).optional(),
  price:              z.number({ invalid_type_error: 'Price must be a number' }).min(0.01, 'Price is required'),
  currency:           z.enum(['USD', 'ETB', 'GBP', 'EUR', 'CAD']).default('USD'),
  unit:               z.string().optional(),
  description:        z.string().min(20, 'Description must be at least 20 characters'),
  specifications:     z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  inventoryQuantity:  z.number().min(0).optional(),
  trackQuantity:      z.boolean().optional(),
  sku:                z.string().optional(),
  featured:           z.boolean().optional(),
  tags:               z.array(z.string()).max(10).optional(),
});

type FormValues = z.infer<typeof schema>;

const CURRENCIES = ['USD', 'ETB', 'GBP', 'EUR', 'CAD'] as const;
const COMMON_UNITS = ['unit', 'kg', 'g', 'lb', 'piece', 'set', 'pair', 'dozen', 'meter', 'liter', 'box', 'pack'];

interface ProductFormProps {
  initialData?: Partial<CreateProductData & { images: ProductImage[] }>;
  onSubmit: (data: CreateProductData, imageAssets: ImageAsset[], existingImageIds: string[]) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

// ── Category picker modal ──────────────────────────────────────────────────────

interface CategoryPickerProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  selectedCategory: string;
  selectedSubcategory: string;
  onSelectCategory: (id: string) => void;
  onSelectSubcategory: (id: string) => void;
  colors: Record<string, string>;
}

const CategoryPickerModal: React.FC<CategoryPickerProps> = ({
  visible, onClose, categories,
  selectedCategory, selectedSubcategory,
  onSelectCategory, onSelectSubcategory,
  colors,
}) => {
  const [step, setStep] = useState<'category' | 'subcategory'>('category');
  const activeCat = categories.find(c => c.id === selectedCategory);

  const handleCategoryPress = (catId: string) => {
    onSelectCategory(catId);
    const cat = categories.find(c => c.id === catId);
    if (cat?.subcategories?.length) {
      setStep('subcategory');
    } else {
      onClose();
    }
  };

  const handleSubcatPress = (subId: string) => {
    onSelectSubcategory(subId);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={[cpStyles.header, { borderBottomColor: colors.borderPrimary }]}>
          {step === 'subcategory' && (
            <TouchableOpacity onPress={() => setStep('category')} style={cpStyles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          <Text style={[cpStyles.title, { color: colors.textPrimary }]}>
            {step === 'category' ? 'Select Category' : `${activeCat?.label} › Subcategory`}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={step === 'category' ? categories : activeCat?.subcategories ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = step === 'category'
              ? selectedCategory === item.id
              : selectedSubcategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => step === 'category' ? handleCategoryPress(item.id) : handleSubcatPress(item.id)}
                style={[
                  cpStyles.item,
                  {
                    backgroundColor: isSelected ? `${colors.accent}14` : colors.bgSurface,
                    borderColor:     isSelected ? colors.accent          : colors.borderPrimary,
                  },
                ]}
              >
                {step === 'category' && (item as CategoryItem).icon && (
                  <Ionicons
                    name={((item as CategoryItem).icon) as keyof typeof Ionicons.glyphMap}
                    size={18}
                    color={isSelected ? colors.accent : colors.textMuted}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isSelected ? colors.accent : colors.textPrimary }}>
                    {item.label}
                  </Text>
                  {step === 'category' && (item as CategoryItem).subcategories?.length > 0 && (
                    <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>
                      {(item as CategoryItem).subcategories.length} subcategories
                    </Text>
                  )}
                </View>
                {step === 'category' && (item as CategoryItem).subcategories?.length > 0
                  ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  : isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                }
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};

const cpStyles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  backBtn:{ padding: 4, marginRight: 8 },
  title:  { flex: 1, fontSize: 18, fontWeight: '700' },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1, gap: 12,
  },
});

// ── Main form component ────────────────────────────────────────────────────────

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData, onSubmit, isLoading = false, mode,
}) => {
  const { colors, type, spacing, isDark } = useTheme();

  const { data: serverCategories = [] } = useProductCategories();

  const [newImages, setNewImages]         = useState<ImageAsset[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>(initialData?.images ?? []);
  const [tagInput, setTagInput]           = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showUnitPicker, setShowUnitPicker]   = useState(false);

  const totalImages = existingImages.length + newImages.length;

  const {
    control, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:              initialData?.name              ?? '',
      category:          initialData?.category          ?? '',
      subcategory:       initialData?.subcategory       ?? '',
      shortDescription:  initialData?.shortDescription  ?? '',
      price:             initialData?.price             ?? ('' as unknown as number),
      currency:          (initialData?.currency as FormValues['currency']) ?? 'USD',
      unit:              initialData?.unit              ?? 'unit',
      description:       initialData?.description       ?? '',
      specifications:    initialData?.specifications    ?? [{ key: '', value: '' }],
      inventoryQuantity: initialData?.inventory?.quantity ?? 0,
      trackQuantity:     initialData?.inventory?.trackQuantity ?? false,
      sku:               initialData?.sku               ?? '',
      featured:          initialData?.featured          ?? false,
      tags:              initialData?.tags              ?? [],
    },
  });

  const trackQuantity   = watch('trackQuantity');
  const tags            = watch('tags')           ?? [];
  const specs           = watch('specifications') ?? [];
  const selectedCatId   = watch('category');
  const selectedSubcatId = watch('subcategory');
  const selectedUnit    = watch('unit');
  const selectedCurrency = watch('currency');

  const selectedCat = serverCategories.find(c => c.id === selectedCatId);

  // ── Image picker ─────────────────────────────────────────────────────────────

  const pickImages = useCallback(async () => {
    const remaining = 5 - totalImages;
    if (remaining <= 0) { Alert.alert('Limit reached', 'Maximum 5 images per product.'); return; }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (!result.canceled) {
      const picked: ImageAsset[] = result.assets.map(a => ({
        uri:  a.uri,
        name: a.fileName ?? `product_${Date.now()}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      }));
      setNewImages(prev => [...prev, ...picked].slice(0, 5 - existingImages.length));
    }
  }, [totalImages, existingImages.length]);

  // ── Tags ──────────────────────────────────────────────────────────────────────

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setValue('tags', [...tags, tag]);
    setTagInput('');
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const onFormSubmit = (values: FormValues) => {
    const data: CreateProductData = {
      name:             values.name,
      description:      values.description,
      shortDescription: values.shortDescription,
      price:            values.price,
      currency:         values.currency,
      unit:             values.unit,
      category:         values.category,
      subcategory:      values.subcategory,
      tags:             values.tags,
      featured:         values.featured,
      inventory: {
        quantity:      values.inventoryQuantity ?? 0,
        trackQuantity: values.trackQuantity ?? false,
      },
      sku:              values.sku,
      specifications:   values.specifications?.filter(s => s.key && s.value),
    };
    onSubmit(data, newImages, existingImages.map(i => i.public_id));
  };

  const inputStyle = { backgroundColor: colors.inputBg, borderColor: colors.borderPrimary, color: colors.textPrimary };

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.xs, gap: spacing.xs, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Basic ── */}
        <SectionLabel label="Basic Info" colors={colors} />

        <FieldWrap label="Product Name *" error={errors.name?.message} colors={colors}>
          <Controller control={control} name="name" render={({ field }) => (
            <TextInput {...field} onChangeText={field.onChange} style={[styles.input, inputStyle]}
              placeholder="e.g. Wireless Headphones" placeholderTextColor={colors.inputPlaceholder} />
          )} />
        </FieldWrap>

        {/* ── Category / Subcategory ── */}
        <SectionLabel label="Category" colors={colors} />

        <TouchableOpacity
          onPress={() => setShowCategoryPicker(true)}
          style={[styles.selectorBtn, inputStyle]}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: selectedCatId ? colors.textPrimary : colors.inputPlaceholder }}>
              {selectedCat?.label ?? 'Select Category *'}
            </Text>
            {selectedSubcatId && (
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {selectedCat?.subcategories.find(s => s.id === selectedSubcatId)?.label ?? selectedSubcatId}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
        </TouchableOpacity>
        {errors.category && (
          <Text style={{ color: colors.error, fontSize: 12 }}>{errors.category.message}</Text>
        )}

        {/* ── Pricing ── */}
        <SectionLabel label="Pricing" colors={colors} />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <FieldWrap label="Price *" error={errors.price?.message} colors={colors} style={{ flex: 1 }}>
            <Controller control={control} name="price" render={({ field }) => (
              <TextInput
                onChangeText={v => field.onChange(parseFloat(v) || 0)}
                value={field.value ? String(field.value) : ''}
                style={[styles.input, inputStyle]}
                placeholder="0.00" placeholderTextColor={colors.inputPlaceholder}
                keyboardType="decimal-pad"
              />
            )} />
          </FieldWrap>

          <View style={{ gap: 4 }}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Currency</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {CURRENCIES.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setValue('currency', c)}
                  style={[
                    styles.currencyChip,
                    { backgroundColor: selectedCurrency === c ? colors.accent : colors.inputBg, borderColor: selectedCurrency === c ? colors.accent : colors.borderPrimary },
                  ]}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: selectedCurrency === c ? '#fff' : colors.textMuted }}>
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Unit picker */}
        <FieldWrap label="Price Unit" colors={colors}>
          <TouchableOpacity
            onPress={() => setShowUnitPicker(true)}
            style={[styles.selectorBtn, inputStyle]}
          >
            <Text style={{ fontSize: 14, color: colors.textPrimary }}>{selectedUnit || 'unit'}</Text>
            <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </FieldWrap>

        {/* ── Description ── */}
        <SectionLabel label="Description" colors={colors} />

        <FieldWrap label="Short Description (max 160)" colors={colors}>
          <Controller control={control} name="shortDescription" render={({ field }) => (
            <TextInput {...field} onChangeText={field.onChange}
              style={[styles.input, inputStyle, { height: 60 }]}
              multiline maxLength={160}
              placeholder="Brief summary for listings…" placeholderTextColor={colors.inputPlaceholder} />
          )} />
        </FieldWrap>

        <FieldWrap label="Full Description *" error={errors.description?.message} colors={colors}>
          <Controller control={control} name="description" render={({ field }) => (
            <TextInput {...field} onChangeText={field.onChange}
              style={[styles.input, inputStyle, { height: 120, textAlignVertical: 'top', paddingTop: 10 }]}
              multiline placeholder="Detailed product description…" placeholderTextColor={colors.inputPlaceholder} />
          )} />
        </FieldWrap>

        {/* Specifications */}
        <FieldWrap label="Specifications" colors={colors}>
          <View style={{ gap: 8 }}>
            {specs.map((_, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Controller control={control} name={`specifications.${i}.key`} render={({ field }) => (
                  <TextInput {...field} onChangeText={field.onChange}
                    style={[styles.input, inputStyle, { flex: 1 }]} placeholder="Key" placeholderTextColor={colors.inputPlaceholder} />
                )} />
                <Controller control={control} name={`specifications.${i}.value`} render={({ field }) => (
                  <TextInput {...field} onChangeText={field.onChange}
                    style={[styles.input, inputStyle, { flex: 1 }]} placeholder="Value" placeholderTextColor={colors.inputPlaceholder} />
                )} />
                <TouchableOpacity onPress={() => setValue('specifications', specs.filter((_, si) => si !== i))}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => setValue('specifications', [...specs, { key: '', value: '' }])}
              style={[styles.addBtn, { borderColor: colors.borderPrimary }]}
            >
              <Ionicons name="add" size={16} color={colors.accent} />
              <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '600' }}>Add Specification</Text>
            </TouchableOpacity>
          </View>
        </FieldWrap>

        {/* ── Inventory ── */}
        <SectionLabel label="Inventory & Details" colors={colors} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Track Inventory</Text>
          <Controller control={control} name="trackQuantity" render={({ field }) => (
            <Switch value={field.value ?? false} onValueChange={field.onChange}
              trackColor={{ true: colors.accent, false: colors.borderPrimary }} />
          )} />
        </View>

        {trackQuantity && (
          <FieldWrap label="Stock Quantity" colors={colors}>
            <Controller control={control} name="inventoryQuantity" render={({ field }) => (
              <TextInput
                onChangeText={v => field.onChange(parseInt(v) || 0)}
                value={field.value ? String(field.value) : '0'}
                style={[styles.input, inputStyle]} placeholder="0"
                placeholderTextColor={colors.inputPlaceholder} keyboardType="number-pad" />
            )} />
          </FieldWrap>
        )}

        <FieldWrap label="SKU (optional)" colors={colors}>
          <Controller control={control} name="sku" render={({ field }) => (
            <TextInput {...field} onChangeText={field.onChange} style={[styles.input, inputStyle]}
              placeholder="e.g. PROD-001" placeholderTextColor={colors.inputPlaceholder} autoCapitalize="characters" />
          )} />
        </FieldWrap>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Featured Product</Text>
          <Controller control={control} name="featured" render={({ field }) => (
            <Switch value={field.value ?? false} onValueChange={field.onChange}
              trackColor={{ true: '#FBBF24', false: colors.borderPrimary }} />
          )} />
        </View>

        {/* ── Tags ── */}
        <SectionLabel label="Tags" colors={colors} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={tagInput} onChangeText={setTagInput} onSubmitEditing={addTag}
            returnKeyType="done" style={[styles.input, inputStyle, { flex: 1 }]}
            placeholder="Add a tag…" placeholderTextColor={colors.inputPlaceholder}
          />
          <TouchableOpacity
            onPress={addTag}
            style={[styles.addTagBtn, { backgroundColor: colors.accent }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {tags.map(tag => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.accentBg, borderColor: colors.accent }]}>
              <Text style={{ fontSize: 12, color: colors.accent, fontWeight: '600' }}>#{tag}</Text>
              <TouchableOpacity onPress={() => setValue('tags', tags.filter(t => t !== tag))}>
                <Ionicons name="close" size={13} color={colors.accent} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Images ── */}
        <SectionLabel label="Product Images" colors={colors} />
        <Text style={{ fontSize: 12, color: colors.textMuted }}>Max 5 images. First image is primary.</Text>

        {existingImages.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {existingImages.map(img => (
              <View key={img.public_id} style={styles.thumbWrap}>
                <Image source={{ uri: img.secure_url }} style={styles.thumb} resizeMode="cover" />
                {img.isPrimary && (
                  <View style={styles.primaryBadge}><Ionicons name="star" size={9} color="#0A2540" /></View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setExistingImages(p => p.filter(i => i.public_id !== img.public_id))}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {newImages.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {newImages.map((img, i) => (
              <View key={i} style={styles.thumbWrap}>
                <Image source={{ uri: img.uri }} style={styles.thumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => setNewImages(p => p.filter((_, idx) => idx !== i))}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {totalImages < 5 && (
          <TouchableOpacity
            onPress={pickImages}
            style={[styles.addImageBtn, { borderColor: colors.borderPrimary, backgroundColor: colors.inputBg }]}
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
            <Text style={{ color: colors.accent, fontWeight: '600', fontSize: 14 }}>
              Add Images ({totalImages}/5)
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Submit ── */}
        <TouchableOpacity
          onPress={handleSubmit(onFormSubmit)}
          disabled={isLoading}
          style={[styles.submitBtn, { backgroundColor: isLoading ? colors.textMuted : colors.accent }]}
        >
          {isLoading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>{mode === 'create' ? 'Create Product' : 'Save Changes'}</Text>
          }
        </TouchableOpacity>
      </ScrollView>

      {/* ── Category picker modal ── */}
      <CategoryPickerModal
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        categories={serverCategories}
        selectedCategory={selectedCatId}
        selectedSubcategory={selectedSubcatId ?? ''}
        onSelectCategory={id => { setValue('category', id); setValue('subcategory', ''); }}
        onSelectSubcategory={id => setValue('subcategory', id)}
        colors={colors as Record<string, string>}
      />

      {/* ── Unit picker modal ── */}
      <Modal visible={showUnitPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: (colors as Record<string, string>).background }}>
          <View style={[cpStyles.header, { borderBottomColor: (colors as Record<string, string>).border }]}>
            <Text style={[cpStyles.title, { color: (colors as Record<string, string>).text }]}>Price Unit</Text>
            <TouchableOpacity onPress={() => setShowUnitPicker(false)}>
              <Ionicons name="close" size={22} color={(colors as Record<string, string>).text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={COMMON_UNITS}
            keyExtractor={u => u}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { setValue('unit', item); setShowUnitPicker(false); }}
                style={[
                  cpStyles.item,
                  {
                    backgroundColor: selectedUnit === item ? `${(colors as Record<string, string>).primary}14` : (colors as Record<string, string>).surface,
                    borderColor:     selectedUnit === item ? (colors as Record<string, string>).primary          : (colors as Record<string, string>).border,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, fontWeight: '500', color: selectedUnit === item ? (colors as Record<string, string>).primary : (colors as Record<string, string>).text }}>
                  {item}
                </Text>
                {selectedUnit === item && <Ionicons name="checkmark-circle" size={18} color={(colors as Record<string, string>).primary} />}
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ label: string; colors: Record<string, string> }> = ({ label, colors }) => (
  <View style={[slStyles.row, { borderBottomColor: colors.borderPrimary }]}>
    <Text style={[slStyles.label, { color: colors.textPrimary }]}>{label}</Text>
  </View>
);
const slStyles = StyleSheet.create({
  row:   { borderBottomWidth: 1, paddingBottom: 4 },
  label: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3 },
});

const FieldWrap: React.FC<{
  label: string; error?: string;
  children: React.ReactNode; colors: Record<string, string>; style?: object;
}> = ({ label, error, children, colors, style }) => (
  <View style={[{ gap: 5 }, style]}>
    <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    {children}
    {error && <Text style={{ fontSize: 12, color: colors.error }}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  label:       { fontSize: 13, fontWeight: '600' },
  input:       { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, height: 44 },
  selectorBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, height: 48, borderWidth: 1, gap: 8,
  },
  currencyChip:{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderStyle: 'dashed', padding: 10,
    borderRadius: 8, justifyContent: 'center',
  },
  addTagBtn:   { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1,
  },
  thumbWrap:   { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb:       { width: '100%', height: '100%' },
  primaryBadge:{ position: 'absolute', top: 4, left: 4, backgroundColor: '#FBBF24', borderRadius: 999, padding: 3 },
  removeBtn:   { position: 'absolute', top: 2, right: 2 },
  addImageBtn: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 12,
    height: 90, alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitBtn:   { height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  submitText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
});
