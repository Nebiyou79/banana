/**
 * screens/freelancer/PortfolioFormScreens.tsx
 *
 * FIXES:
 * 1. Multi-image upload: ImagePickerGrid now uses a ref to accumulate URLs,
 *    so selecting 5 images saves all 5 (not just the last one).
 * 2. Currency chooser on budget field.
 * 3. Expanded categories covering all common freelance niches.
 * 4. Edit mode pre-fills all existing images and fields correctly.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';

import { useTheme }        from '../../hooks/useTheme';
import { freelancerService } from '../../services/freelancerService';
import { FREELANCER_KEYS }  from '../../hooks/useFreelancer';
import { AppInput, SelectInput, AppButton, TagInput, SwitchField } from '../../components/freelancer/FormComponents';
import { ImagePickerGrid }  from '../../components/shared/ImagePickerGrid';
import toast                from '../../lib/toast';
import api                  from '../../lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#8B5CF6';

const PORTFOLIO_CATEGORIES = [
  // Tech
  { label: 'Web Development',         value: 'Web Development' },
  { label: 'Mobile App',              value: 'Mobile App' },
  { label: 'Full Stack',              value: 'Full Stack' },
  { label: 'Frontend',               value: 'Frontend' },
  { label: 'Backend',                value: 'Backend' },
  { label: 'WordPress / CMS',        value: 'WordPress' },
  { label: 'E-Commerce',             value: 'E-Commerce' },
  { label: 'API & Integrations',     value: 'API' },
  { label: 'DevOps / Cloud',         value: 'DevOps' },
  { label: 'Cybersecurity',          value: 'Cybersecurity' },
  // Design
  { label: 'UI/UX Design',           value: 'UI/UX' },
  { label: 'Graphic Design',         value: 'Graphic Design' },
  { label: 'Logo & Branding',        value: 'Branding' },
  { label: 'Motion Graphics',        value: 'Motion Graphics' },
  { label: 'Video Editing',          value: 'Video Editing' },
  { label: '3D Modeling / CAD',      value: '3D Modeling' },
  { label: 'Illustration',           value: 'Illustration' },
  { label: 'Photography',            value: 'Photography' },
  { label: 'Architecture',           value: 'Architecture' },
  { label: 'Interior Design',        value: 'Interior Design' },
  // Media
  { label: 'Film / Documentary',     value: 'Film' },
  { label: 'Podcast Production',     value: 'Podcast' },
  { label: 'Music Production',       value: 'Music' },
  { label: 'Voice Over',             value: 'Voice Over' },
  // Marketing & Content
  { label: 'Digital Marketing',      value: 'Digital Marketing' },
  { label: 'Social Media',           value: 'Social Media' },
  { label: 'SEO / SEM',             value: 'SEO' },
  { label: 'Content Strategy',       value: 'Content Strategy' },
  { label: 'Copywriting',            value: 'Copywriting' },
  { label: 'Blog & Articles',        value: 'Blog Writing' },
  { label: 'Translation',            value: 'Translation' },
  // Business
  { label: 'Business Consulting',    value: 'Consulting' },
  { label: 'Financial Analysis',     value: 'Finance' },
  { label: 'Legal',                  value: 'Legal' },
  { label: 'Data Analysis',          value: 'Data Analysis' },
  { label: 'AI / Machine Learning',  value: 'AI/ML' },
  { label: 'Training & Education',   value: 'Training' },
  { label: 'Event Planning',         value: 'Events' },
  { label: 'Other',                  value: 'Other' },
];

const CURRENCIES = [
  { label: 'USD — US Dollar',          value: 'USD' },
  { label: 'EUR — Euro',               value: 'EUR' },
  { label: 'GBP — British Pound',      value: 'GBP' },
  { label: 'AED — UAE Dirham',         value: 'AED' },
  { label: 'SAR — Saudi Riyal',        value: 'SAR' },
  { label: 'EGP — Egyptian Pound',     value: 'EGP' },
  { label: 'NGN — Nigerian Naira',     value: 'NGN' },
  { label: 'KES — Kenyan Shilling',    value: 'KES' },
  { label: 'ZAR — South African Rand', value: 'ZAR' },
  { label: 'INR — Indian Rupee',       value: 'INR' },
  { label: 'PKR — Pakistani Rupee',    value: 'PKR' },
  { label: 'CAD — Canadian Dollar',    value: 'CAD' },
  { label: 'AUD — Australian Dollar',  value: 'AUD' },
  { label: 'TRY — Turkish Lira',       value: 'TRY' },
  { label: 'MAD — Moroccan Dirham',    value: 'MAD' },
  { label: 'GHS — Ghanaian Cedi',      value: 'GHS' },
];

const BUDGET_TYPES = [
  { label: 'Fixed',   value: 'fixed' },
  { label: 'Hourly',  value: 'hourly' },
  { label: 'Daily',   value: 'daily' },
  { label: 'Monthly', value: 'monthly' },
];

const VISIBILITY_OPTIONS = [
  { label: 'Public',  value: 'public' },
  { label: 'Private', value: 'private' },
];

// ─── Form State ───────────────────────────────────────────────────────────────

interface PortfolioForm {
  title: string;
  description: string;
  category: string;
  mediaUrls: string[];       // Cloudinary URLs accumulated
  projectUrl: string;
  client: string;
  technologies: string[];
  budget: string;
  currency: string;
  budgetType: string;
  duration: string;
  completionDate: string;
  featured: boolean;
  visibility: string;
}

interface FormErrors {
  title?: string;
  mediaUrls?: string;
}

const EMPTY_FORM: PortfolioForm = {
  title: '', description: '', category: '', mediaUrls: [],
  projectUrl: '', client: '', technologies: [],
  budget: '', currency: 'USD', budgetType: 'fixed',
  duration: '', completionDate: '', featured: false, visibility: 'public',
};

// ─── Shared Form Component ────────────────────────────────────────────────────

const PortfolioForm: React.FC<{
  initialForm?: Partial<PortfolioForm>;
  onSubmit: (form: PortfolioForm) => Promise<void>;
  submitLabel: string;
  isLoading: boolean;
}> = ({ initialForm, onSubmit, submitLabel, isLoading }) => {
  const { colors, type: typo, spacing } = useTheme();
  const [form, setForm]     = useState<PortfolioForm>({ ...EMPTY_FORM, ...initialForm });
  const [errors, setErrors] = useState<FormErrors>({});

  // Sync when initialForm changes (edit mode loads async)
  useEffect(() => {
    if (initialForm) setForm(prev => ({ ...prev, ...initialForm }));
  }, [JSON.stringify(initialForm)]);

  const set = <K extends keyof PortfolioForm>(key: K, value: PortfolioForm[K]) =>
    setForm(p => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim())       e.title     = 'Project title is required';
    if (form.mediaUrls.length < 1) e.mediaUrls = 'At least one image is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Images — FIX: ImagePickerGrid now accumulates all URLs correctly */}
      <ImagePickerGrid
        label="Project Images *"
        value={form.mediaUrls}
        onChange={urls => set('mediaUrls', urls)}
        maxImages={8}
        error={errors.mediaUrls}
      />

      {/* Title */}
      <AppInput
        label="Project Title *"
        value={form.title}
        onChangeText={(v: string) => set('title', v)}
        placeholder="E.g. E-Commerce Platform for FashionBrand"
        error={errors.title}
        leftIcon="briefcase-outline"
      />

      {/* Category */}
      <SelectInput
        label="Category"
        value={form.category}
        options={PORTFOLIO_CATEGORIES}
        onSelect={(v: string) => set('category', v)}
        placeholder="Select category"
      />

      {/* Description */}
      <AppInput
        label="Description"
        value={form.description}
        onChangeText={(v: string) => set('description', v)}
        placeholder="Describe the project, your role, and outcomes…"
        multiline
        numberOfLines={5}
        leftIcon="document-text-outline"
      />

      {/* Technologies */}
      <TagInput
        label="Technologies Used"
        tags={form.technologies}
        onAdd={t => set('technologies', [...form.technologies, t])}
        onRemove={i => set('technologies', form.technologies.filter((_, idx) => idx !== i))}
        placeholder="E.g. React, Node.js, MongoDB…"
        accentColor={ACCENT}
      />

      {/* Client */}
      <AppInput
        label="Client"
        value={form.client}
        onChangeText={(v: string) => set('client', v)}
        placeholder="Client or company name"
        leftIcon="person-outline"
      />

      {/* Budget + Currency + Type */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <AppInput
          label="Budget"
          value={form.budget}
          onChangeText={(v: string) => set('budget', v)}
          placeholder="5000"
          keyboardType="numeric"
          leftIcon="cash-outline"
          containerStyle={{ flex: 1 }}
        />
        <SelectInput
          label="Currency"
          value={form.currency}
          options={CURRENCIES}
          onSelect={(v: string) => set('currency', v)}
        />
      </View>
      <SelectInput
        label="Budget Type"
        value={form.budgetType}
        options={BUDGET_TYPES}
        onSelect={(v: string) => set('budgetType', v)}
      />

      {/* Project URL */}
      <AppInput
        label="Project URL"
        value={form.projectUrl}
        onChangeText={(v: string) => set('projectUrl', v)}
        placeholder="https://yourproject.com"
        keyboardType="url"
        leftIcon="globe-outline"
      />

      {/* Duration */}
      <AppInput
        label="Duration"
        value={form.duration}
        onChangeText={(v: string) => set('duration', v)}
        placeholder="E.g. 3 months, 6 weeks"
        leftIcon="time-outline"
      />

      {/* Completion Date */}
      <AppInput
        label="Completion Date"
        value={form.completionDate}
        onChangeText={(v: string) => set('completionDate', v)}
        placeholder="YYYY-MM-DD"
        leftIcon="calendar-outline"
      />

      {/* Visibility */}
      <SelectInput
        label="Visibility"
        value={form.visibility}
        options={VISIBILITY_OPTIONS}
        onSelect={(v: string) => set('visibility', v)}
      />

      {/* Featured */}
      <SwitchField
        label="Featured Project"
        value={form.featured}
        onChange={v => set('featured', v)}
        accentColor={ACCENT}
      />

      <AppButton
        label={isLoading ? `${submitLabel}…` : submitLabel}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        color={ACCENT}
        icon="checkmark-circle-outline"
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
};

// ─── Header ───────────────────────────────────────────────────────────────────

const Header: React.FC<{ title: string; onBack: () => void; colors: any }> = ({ title, onBack, colors }) => (
  <View style={[sh.wrap, { backgroundColor: colors.bgCard, borderBottomColor: colors.borderPrimary }]}>
    <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
    </TouchableOpacity>
    <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 17 }}>{title}</Text>
    <View style={{ width: 32 }} />
  </View>
);

const sh = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
});

// ─── Add Portfolio Screen ─────────────────────────────────────────────────────

export const AddPortfolioScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const handleSubmit = useCallback(async (form: PortfolioForm) => {
    setSaving(true);
    try {
      const payload = {
        title:          form.title,
        description:    form.description,
        category:       form.category || undefined,
        mediaUrls:      form.mediaUrls,
        projectUrl:     form.projectUrl || undefined,
        client:         form.client || undefined,
        technologies:   form.technologies,
        budget:         form.budget ? Number(form.budget) : undefined,
        currency:       form.currency,
        budgetType:     form.budgetType,
        duration:       form.duration || undefined,
        completionDate: form.completionDate || undefined,
        featured:       form.featured,
        visibility:     form.visibility,
      };
      await api.post('/freelancer/portfolio', payload);
      await queryClient.invalidateQueries({ queryKey: FREELANCER_KEYS.portfolio });
      toast.success('Portfolio item added!');
      navigation.goBack();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Failed to add item');
    } finally {
      setSaving(false);
    }
  }, [navigation, queryClient]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bgPrimary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Add Portfolio Item" onBack={() => navigation.goBack()} colors={colors} />
      <PortfolioForm
        onSubmit={handleSubmit}
        submitLabel="Add to Portfolio"
        isLoading={saving}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Edit Portfolio Screen ────────────────────────────────────────────────────

type EditRouteParams = { itemId: string };

export const EditPortfolioScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<RouteProp<{ params: EditRouteParams }, 'params'>>();
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { itemId } = route.params;
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<Partial<PortfolioForm>>({});

  // Load existing item
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<any>(`/freelancer/portfolio/${itemId}`);
        const item = res.data?.data ?? res.data;
        if (!cancelled) {
          const existingUrls = (item.mediaUrls ?? []).filter((u: string) => u?.includes('cloudinary.com'));
          setInitial({
            title:          item.title ?? '',
            description:    item.description ?? '',
            category:       item.category ?? '',
            mediaUrls:      existingUrls,
            projectUrl:     item.projectUrl ?? '',
            client:         item.client ?? '',
            technologies:   item.technologies ?? [],
            budget:         item.budget?.toString() ?? '',
            currency:       item.currency ?? 'USD',
            budgetType:     item.budgetType ?? 'fixed',
            duration:       item.duration ?? '',
            completionDate: item.completionDate?.split('T')[0] ?? '',
            featured:       item.featured ?? false,
            visibility:     item.visibility ?? 'public',
          });
        }
      } catch (err: any) {
        toast.error('Failed to load portfolio item');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [itemId]);

  const handleSubmit = useCallback(async (form: PortfolioForm) => {
    setSaving(true);
    try {
      const payload = {
        title:          form.title,
        description:    form.description,
        category:       form.category || undefined,
        mediaUrls:      form.mediaUrls,
        projectUrl:     form.projectUrl || undefined,
        client:         form.client || undefined,
        technologies:   form.technologies,
        budget:         form.budget ? Number(form.budget) : undefined,
        currency:       form.currency,
        budgetType:     form.budgetType,
        duration:       form.duration || undefined,
        completionDate: form.completionDate || undefined,
        featured:       form.featured,
        visibility:     form.visibility,
      };
      await api.put(`/freelancer/portfolio/${itemId}`, payload);
      await queryClient.invalidateQueries({ queryKey: FREELANCER_KEYS.portfolio });
      toast.success('Portfolio item updated!');
      navigation.goBack();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Failed to update item');
    } finally {
      setSaving(false);
    }
  }, [itemId, navigation, queryClient]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <Header title="Edit Portfolio Item" onBack={() => navigation.goBack()} colors={colors} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bgPrimary }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title="Edit Portfolio Item" onBack={() => navigation.goBack()} colors={colors} />
      <PortfolioForm
        initialForm={initial}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        isLoading={saving}
      />
    </KeyboardAvoidingView>
  );
};