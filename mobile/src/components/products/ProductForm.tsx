import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { CreateProductData, ImageAsset, ProductImage } from '../../services/productService';

// ── Validation schema ──────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  shortDescription: z.string().max(160).optional(),
  price: z.number({ invalid_type_error: 'Price must be a number' }).min(0.01, 'Price is required'),
  currency: z.enum(['USD', 'ETB', 'GBP', 'EUR', 'CAD']).default('USD'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  specifications: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  inventoryQuantity: z.number().min(0).optional(),
  trackQuantity: z.boolean().optional(),
  sku: z.string().optional(),
  featured: z.boolean().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Props ──────────────────────────────────────────────────────────────────────

interface ProductFormProps {
  initialData?: Partial<CreateProductData & { images: ProductImage[] }>;
  onSubmit: (
    data: CreateProductData,
    imageAssets: ImageAsset[],
    existingImageIds: string[]
  ) => void;
  isLoading?: boolean;
  mode: 'create' | 'edit';
}

const CURRENCIES = ['USD', 'ETB', 'GBP', 'EUR', 'CAD'] as const;

// ── Component ──────────────────────────────────────────────────────────────────

export const ProductForm: React.FC<ProductFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
  mode,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, spacing } = theme;

  // Image state
  const [newImageAssets, setNewImageAssets] = useState<ImageAsset[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>(
    initialData?.images ?? []
  );
  const [tagInput, setTagInput] = useState('');

  const totalImages = existingImages.length + newImageAssets.length;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      category: initialData?.category ?? '',
      subcategory: initialData?.subcategory ?? '',
      shortDescription: initialData?.shortDescription ?? '',
      price: initialData?.price ?? ('' as any),
      currency: (initialData?.currency as any) ?? 'USD',
      description: initialData?.description ?? '',
      specifications: initialData?.specifications ?? [{ key: '', value: '' }],
      inventoryQuantity: initialData?.inventory?.quantity ?? 0,
      trackQuantity: initialData?.inventory?.trackQuantity ?? false,
      sku: initialData?.sku ?? '',
      featured: initialData?.featured ?? false,
      tags: initialData?.tags ?? [],
    },
  });

  const trackQuantity = watch('trackQuantity');
  const tags = watch('tags') ?? [];
  const specs = watch('specifications') ?? [];
  const selectedCurrency = watch('currency');

  // ── Image picker ─────────────────────────────────────────────────────────────

  const pickImages = useCallback(async () => {
    const remaining = 5 - totalImages;
    if (remaining <= 0) {
      Alert.alert('Limit reached', 'Maximum 5 images per product.');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow access to your photo library to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.85,
    });

    if (!result.canceled) {
      const picked: ImageAsset[] = result.assets.map((a) => ({
        uri: a.uri,
        name: a.fileName ?? `product_${Date.now()}.jpg`,
        type: a.mimeType ?? 'image/jpeg',
      }));
      setNewImageAssets((prev) => [...prev, ...picked].slice(0, 5 - existingImages.length));
    }
  }, [totalImages, existingImages.length]);

  const removeExistingImage = (publicId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.public_id !== publicId));
  };

  const removeNewImage = (index: number) => {
    setNewImageAssets((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Tags ──────────────────────────────────────────────────────────────────────

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || tags.includes(tag) || tags.length >= 10) return;
    setValue('tags', [...tags, tag]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setValue('tags', tags.filter((t) => t !== tag));
  };

  // ── Specs ─────────────────────────────────────────────────────────────────────

  const addSpec = () => {
    setValue('specifications', [...specs, { key: '', value: '' }]);
  };

  const removeSpec = (index: number) => {
    setValue('specifications', specs.filter((_, i) => i !== index));
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const onFormSubmit = (values: FormValues) => {
    const data: CreateProductData = {
      name: values.name,
      description: values.description,
      shortDescription: values.shortDescription,
      price: values.price,
      currency: values.currency,
      category: values.category,
      subcategory: values.subcategory,
      tags: values.tags,
      featured: values.featured,
      inventory: {
        quantity: values.inventoryQuantity ?? 0,
        trackQuantity: values.trackQuantity ?? false,
      },
      sku: values.sku,
      specifications: values.specifications?.filter((s) => s.key && s.value),
    };

    const existingImageIds = existingImages.map((img) => img.public_id);
    onSubmit(data, newImageAssets, existingImageIds);
  };

  // ── Helpers ───────────────────────────────────────────────────────────────────

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderColor: colors.border,
    color: colors.text,
    borderRadius: borderRadius.md,
  };

  const labelStyle = { color: colors.textSecondary };
  const errorStyle = { color: colors.error };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: spacing[4], gap: spacing[5], paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── SECTION: Basic Info ── */}
      <SectionHeader label="Basic Info" colors={colors} />

      <Field label="Product Name *" error={errors.name?.message} labelStyle={labelStyle} errorStyle={errorStyle}>
        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <TextInput
              {...field}
              onChangeText={field.onChange}
              style={[styles.input, inputStyle]}
              placeholder="e.g. Wireless Headphones"
              placeholderTextColor={colors.placeholder}
            />
          )}
        />
      </Field>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Category *" error={errors.category?.message} labelStyle={labelStyle} errorStyle={errorStyle}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <TextInput
                  {...field}
                  onChangeText={field.onChange}
                  style={[styles.input, inputStyle]}
                  placeholder="e.g. Electronics"
                  placeholderTextColor={colors.placeholder}
                />
              )}
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Subcategory" labelStyle={labelStyle} errorStyle={errorStyle}>
            <Controller
              control={control}
              name="subcategory"
              render={({ field }) => (
                <TextInput
                  {...field}
                  onChangeText={field.onChange}
                  style={[styles.input, inputStyle]}
                  placeholder="e.g. Audio"
                  placeholderTextColor={colors.placeholder}
                />
              )}
            />
          </Field>
        </View>
      </View>

      <Field label="Short Description (max 160)" labelStyle={labelStyle} errorStyle={errorStyle}>
        <Controller
          control={control}
          name="shortDescription"
          render={({ field }) => (
            <TextInput
              {...field}
              onChangeText={field.onChange}
              style={[styles.input, inputStyle, { height: 60 }]}
              multiline
              maxLength={160}
              placeholder="Brief summary for listings…"
              placeholderTextColor={colors.placeholder}
            />
          )}
        />
      </Field>

      {/* Price row */}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Field label="Price *" error={errors.price?.message} labelStyle={labelStyle} errorStyle={errorStyle}>
            <Controller
              control={control}
              name="price"
              render={({ field }) => (
                <TextInput
                  onChangeText={(v) => field.onChange(parseFloat(v) || 0)}
                  value={field.value ? String(field.value) : ''}
                  style={[styles.input, inputStyle]}
                  placeholder="0.00"
                  placeholderTextColor={colors.placeholder}
                  keyboardType="decimal-pad"
                />
              )}
            />
          </Field>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={[styles.label, labelStyle]}>Currency</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {CURRENCIES.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setValue('currency', c)}
                style={[
                  styles.currencyChip,
                  {
                    backgroundColor: selectedCurrency === c ? colors.primary : colors.inputBg,
                    borderColor: selectedCurrency === c ? colors.primary : colors.border,
                  },
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

      {/* ── SECTION: Description ── */}
      <SectionHeader label="Description" colors={colors} />

      <Field label="Full Description *" error={errors.description?.message} labelStyle={labelStyle} errorStyle={errorStyle}>
        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <TextInput
              {...field}
              onChangeText={field.onChange}
              style={[styles.input, inputStyle, { height: 120, textAlignVertical: 'top', paddingTop: 10 }]}
              multiline
              placeholder="Describe your product in detail…"
              placeholderTextColor={colors.placeholder}
            />
          )}
        />
      </Field>

      {/* Specifications */}
      <Field label="Specifications" labelStyle={labelStyle} errorStyle={errorStyle}>
        <View style={{ gap: 8 }}>
          {specs.map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Controller
                control={control}
                name={`specifications.${i}.key`}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    onChangeText={field.onChange}
                    style={[styles.input, inputStyle, { flex: 1 }]}
                    placeholder="Key"
                    placeholderTextColor={colors.placeholder}
                  />
                )}
              />
              <Controller
                control={control}
                name={`specifications.${i}.value`}
                render={({ field }) => (
                  <TextInput
                    {...field}
                    onChangeText={field.onChange}
                    style={[styles.input, inputStyle, { flex: 1 }]}
                    placeholder="Value"
                    placeholderTextColor={colors.placeholder}
                  />
                )}
              />
              <TouchableOpacity onPress={() => removeSpec(i)}>
                <Ionicons name="close-circle" size={20} color={colors.error} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={addSpec}
            style={[styles.addBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
              Add Specification
            </Text>
          </TouchableOpacity>
        </View>
      </Field>

      {/* ── SECTION: Inventory & SKU ── */}
      <SectionHeader label="Inventory & Details" colors={colors} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[styles.label, labelStyle]}>Track Inventory</Text>
        <Controller
          control={control}
          name="trackQuantity"
          render={({ field }) => (
            <Switch
              value={field.value ?? false}
              onValueChange={field.onChange}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          )}
        />
      </View>

      {trackQuantity && (
        <Field label="Stock Quantity" labelStyle={labelStyle} errorStyle={errorStyle}>
          <Controller
            control={control}
            name="inventoryQuantity"
            render={({ field }) => (
              <TextInput
                onChangeText={(v) => field.onChange(parseInt(v) || 0)}
                value={field.value ? String(field.value) : '0'}
                style={[styles.input, inputStyle]}
                placeholder="0"
                placeholderTextColor={colors.placeholder}
                keyboardType="number-pad"
              />
            )}
          />
        </Field>
      )}

      <Field label="SKU (optional)" labelStyle={labelStyle} errorStyle={errorStyle}>
        <Controller
          control={control}
          name="sku"
          render={({ field }) => (
            <TextInput
              {...field}
              onChangeText={field.onChange}
              style={[styles.input, inputStyle]}
              placeholder="e.g. PROD-001"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="characters"
            />
          )}
        />
      </Field>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={[styles.label, labelStyle]}>Featured Product</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>Show in featured sections</Text>
        </View>
        <Controller
          control={control}
          name="featured"
          render={({ field }) => (
            <Switch
              value={field.value ?? false}
              onValueChange={field.onChange}
              trackColor={{ true: '#FBBF24', false: colors.border }}
            />
          )}
        />
      </View>

      {/* ── SECTION: Tags ── */}
      <SectionHeader label="Tags" colors={colors} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            returnKeyType="done"
            style={[styles.input, inputStyle, { flex: 1 }]}
            placeholder="Add a tag…"
            placeholderTextColor={colors.placeholder}
          />
          <TouchableOpacity
            onPress={addTag}
            style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
          {tags.map((tag) => (
            <View
              key={tag}
              style={[styles.tag, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
            >
              <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '600' }}>#{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)}>
                <Ionicons name="close" size={13} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
          {tags.length === 0 && (
            <Text style={{ fontSize: 12, color: colors.textMuted }}>No tags yet. Tags help buyers find your product.</Text>
          )}
        </View>
        <Text style={{ fontSize: 11, color: colors.textMuted }}>{tags.length}/10 tags</Text>
      </View>

      {/* ── SECTION: Images ── */}
      <SectionHeader label="Product Images" colors={colors} />

      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>
          Images are uploaded with the product. Tap × to remove. Max 5 total.
        </Text>

        {/* Existing images (edit mode) */}
        {existingImages.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {existingImages.map((img) => (
              <View key={img.public_id} style={styles.thumbWrap}>
                <Image source={{ uri: img.secure_url }} style={styles.thumb} resizeMode="cover" />
                {img.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Ionicons name="star" size={9} color="#0A2540" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeExistingImage(img.public_id)}
                >
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* New images */}
        {newImageAssets.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {newImageAssets.map((asset, i) => (
              <View key={i} style={styles.thumbWrap}>
                <Image source={{ uri: asset.uri }} style={styles.thumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeNewImage(i)}
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
            style={[
              styles.addImageBtn,
              { borderColor: colors.border, backgroundColor: colors.inputBg },
            ]}
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
              Add Images ({totalImages}/5)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Submit ── */}
      <TouchableOpacity
        onPress={handleSubmit(onFormSubmit)}
        disabled={isLoading}
        style={[
          styles.submitBtn,
          { backgroundColor: isLoading ? colors.textMuted : colors.primary },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            {mode === 'create' ? 'Create Product' : 'Save Changes'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ label: string; colors: any }> = ({ label, colors }) => (
  <View style={[sectionHeaderStyles.row, { borderBottomColor: colors.border }]}>
    <Text style={[sectionHeaderStyles.label, { color: colors.text }]}>{label}</Text>
  </View>
);

const sectionHeaderStyles = StyleSheet.create({
  row: { borderBottomWidth: 1, paddingBottom: 6 },
  label: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
});

const Field: React.FC<{
  label: string;
  error?: string;
  children: React.ReactNode;
  labelStyle?: any;
  errorStyle?: any;
}> = ({ label, error, children, labelStyle, errorStyle }) => (
  <View style={{ gap: 6 }}>
    <Text style={[styles.label, labelStyle]}>{label}</Text>
    {children}
    {error && <Text style={[{ fontSize: 12 }, errorStyle]}>{error}</Text>}
  </View>
);

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600' },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, height: 44 },
  currencyChip: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, borderWidth: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addTagBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, justifyContent: 'center' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  thumbWrap: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  primaryBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: '#FBBF24',
    borderRadius: 999,
    padding: 3,
  },
  removeBtn: { position: 'absolute', top: 2, right: 2 },
  addImageBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
