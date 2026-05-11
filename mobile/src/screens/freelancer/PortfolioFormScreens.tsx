/**
 * screens/freelancer/PortfolioFormScreens.tsx
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme }          from '../../hooks/useTheme';
import { withAlpha }         from '../../theme/utils';
import { FONT_SIZE }         from '../../theme/tokens';
import { freelancerService } from '../../services/freelancerService';
import { FREELANCER_KEYS }   from '../../hooks/useFreelancer';
import {
  AppInput, SelectInput, AppButton, TagInput, SwitchField,
} from '../../components/freelancer/FormComponents';
import { ImagePickerGrid }   from '../../components/shared/ImagePickerGrid';
import toast                 from '../../lib/toast';
import api                   from '../../lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const PORTFOLIO_CATEGORIES = [
  { label: 'Web Development',        value: 'Web Development' },
  { label: 'Mobile App',             value: 'Mobile App' },
  { label: 'Full Stack',             value: 'Full Stack' },
  { label: 'Frontend',               value: 'Frontend' },
  { label: 'Backend',                value: 'Backend' },
  { label: 'WordPress / CMS',        value: 'WordPress' },
  { label: 'E-Commerce',             value: 'E-Commerce' },
  { label: 'API & Integrations',     value: 'API' },
  { label: 'DevOps / Cloud',         value: 'DevOps' },
  { label: 'Cybersecurity',          value: 'Cybersecurity' },
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
  { label: 'Film / Documentary',     value: 'Film' },
  { label: 'Podcast Production',     value: 'Podcast' },
  { label: 'Music Production',       value: 'Music' },
  { label: 'Voice Over',             value: 'Voice Over' },
  { label: 'Digital Marketing',      value: 'Digital Marketing' },
  { label: 'Social Media',           value: 'Social Media' },
  { label: 'SEO / SEM',              value: 'SEO' },
  { label: 'Content Strategy',       value: 'Content Strategy' },
  { label: 'Copywriting',            value: 'Copywriting' },
  { label: 'Blog & Articles',        value: 'Blog Writing' },
  { label: 'Translation',            value: 'Translation' },
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
  { label: 'ETB — Ethiopian Birr',     value: 'ETB' },
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

// ─── Form state ───────────────────────────────────────────────────────────────

interface PortfolioFormData {
  title: string;
  description: string;
  category: string;
  mediaUrls: string[];
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

const EMPTY_FORM: PortfolioFormData = {
  title: '', description: '', category: '', mediaUrls: [],
  projectUrl: '', client: '', technologies: [],
  budget: '', currency: 'USD', budgetType: 'fixed',
  duration: '', completionDate: '', featured: false, visibility: 'public',
};

// ─── Shared inner form ────────────────────────────────────────────────────────

const PortfolioFormBody: React.FC<{
  initialForm?: Partial<PortfolioFormData>;
  onSubmit: (form: PortfolioFormData) => Promise<void>;
  submitLabel: string;
  isLoading: boolean;
  accentColor: string;
}> = ({ initialForm, onSubmit, submitLabel, isLoading, accentColor }) => {
  const [form, setForm] = useState<PortfolioFormData>({ ...EMPTY_FORM, ...initialForm });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (initialForm) setForm(prev => ({ ...prev, ...initialForm }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialForm)]);

  const set = <K extends keyof PortfolioFormData>(key: K, value: PortfolioFormData[K]) =>
    setForm(p => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim())        e.title     = 'Project title is required';
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
      <ImagePickerGrid
        label="Project Images *"
        value={form.mediaUrls}
        onChange={urls => set('mediaUrls', urls)}
        maxImages={8}
        error={errors.mediaUrls}
      />

      <AppInput
        label="Project Title *"
        value={form.title}
        onChangeText={(v: string) => set('title', v)}
        placeholder="E.g. E-Commerce Platform for FashionBrand"
        error={errors.title}
        leftIcon="briefcase-outline"
      />

      <SelectInput
        label="Category"
        value={form.category}
        options={PORTFOLIO_CATEGORIES}
        onSelect={(v: string) => set('category', v)}
        placeholder="Select category"
      />

      <AppInput
        label="Description"
        value={form.description}
        onChangeText={(v: string) => set('description', v)}
        placeholder="Describe the project, your role, and outcomes…"
        multiline
        numberOfLines={5}
        leftIcon="document-text-outline"
      />

      <TagInput
        label="Technologies Used"
        tags={form.technologies}
        onAdd={(t: string) => set('technologies', [...form.technologies, t])}
        onRemove={(i: number) => set('technologies', form.technologies.filter((_, idx) => idx !== i))}
        placeholder="E.g. React, Node.js, MongoDB…"
        accentColor={accentColor}
      />

      <AppInput
        label="Client"
        value={form.client}
        onChangeText={(v: string) => set('client', v)}
        placeholder="Client or company name"
        leftIcon="person-outline"
      />

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

      <AppInput
        label="Project URL"
        value={form.projectUrl}
        onChangeText={(v: string) => set('projectUrl', v)}
        placeholder="https://yourproject.com"
        keyboardType="url"
        leftIcon="globe-outline"
      />

      <AppInput
        label="Duration"
        value={form.duration}
        onChangeText={(v: string) => set('duration', v)}
        placeholder="E.g. 3 months, 6 weeks"
        leftIcon="time-outline"
      />

      <AppInput
        label="Completion Date"
        value={form.completionDate}
        onChangeText={(v: string) => set('completionDate', v)}
        placeholder="YYYY-MM-DD"
        leftIcon="calendar-outline"
      />

      <SelectInput
        label="Visibility"
        value={form.visibility}
        options={VISIBILITY_OPTIONS}
        onSelect={(v: string) => set('visibility', v)}
      />

      <SwitchField
        label="Featured Project"
        value={form.featured}
        onChange={(v: boolean) => set('featured', v)}
        accentColor={accentColor}
      />

      <AppButton
        label={isLoading ? `${submitLabel}…` : submitLabel}
        onPress={handleSubmit}
        loading={isLoading}
        disabled={isLoading}
        color={accentColor}
        icon="checkmark-circle-outline"
        style={{ marginTop: 8 }}
      />
    </ScrollView>
  );
};

// ─── Shared header ────────────────────────────────────────────────────────────

const ScreenHeader: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => {
  const { colors } = useTheme();
  return (
    <View style={[sh.wrap, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
      <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="arrow-back" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.base }}>{title}</Text>
      <View style={{ width: 32 }} />
    </View>
  );
};

const sh = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

// ─── Add Portfolio Screen ─────────────────────────────────────────────────────

export const AddPortfolioScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // beforeRemove guard
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsub;
  }, [navigation, isDirty]);

  const accentColor = colors.organization;

  const handleSubmit = useCallback(async (form: PortfolioFormData) => {
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
      setIsDirty(false);
      navigation.goBack();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Failed to add item');
    } finally {
      setSaving(false);
    }
  }, [navigation, queryClient]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Add Portfolio Item" onBack={() => navigation.goBack()} />
        <PortfolioFormBody
          onSubmit={handleSubmit}
          submitLabel="Add to Portfolio"
          isLoading={saving}
          accentColor={accentColor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── Edit Portfolio Screen ────────────────────────────────────────────────────

type EditRouteParams = { itemId: string };

export const EditPortfolioScreen: React.FC = () => {
  const navigation  = useNavigation<any>();
  const route       = useRoute<RouteProp<{ params: EditRouteParams }, 'params'>>();
  const { colors }  = useTheme();
  const insets      = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { itemId } = route.params;
  const [saving, setSaving]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [initial, setInitial] = useState<Partial<PortfolioFormData>>({});
  const [isDirty, setIsDirty] = useState(false);

  // beforeRemove guard
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirty) return;
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to leave?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ],
      );
    });
    return unsub;
  }, [navigation, isDirty]);

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

  const accentColor = colors.organization;

  const handleSubmit = useCallback(async (form: PortfolioFormData) => {
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
      setIsDirty(false);
      navigation.goBack();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err.message ?? 'Failed to update item');
    } finally {
      setSaving(false);
    }
  }, [itemId, navigation, queryClient]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
        <ScreenHeader title="Edit Portfolio Item" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScreenHeader title="Edit Portfolio Item" onBack={() => navigation.goBack()} />
        <PortfolioFormBody
          initialForm={initial}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          isLoading={saving}
          accentColor={accentColor}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};