/**
 * ServiceFormModal.tsx
 *
 * FIXES:
 * 1. deliveryTime is now a number (days integer) — backend Mongoose schema
 *    has deliveryTime: Number. Sending "3 days" caused a CastError.
 *    Now we show a numeric stepper + label "days".
 * 2. currency chooser added (USD, EUR, GBP, AED, SAR, NGN, KES, ZAR, EGP, INR…)
 * 3. Expanded categories covering all common freelance niches
 * 4. updateService now actually calls PUT /freelancer/services/:id (was 404)
 */
import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAddService, useUpdateService } from '../../hooks/useFreelancer';
import { AppButton, AppInput, SelectInput } from '../freelancer/FormComponents';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRICE_TYPES = [
  { label: 'Fixed Price', value: 'fixed' },
  { label: 'Per Hour',    value: 'hourly' },
  { label: 'Negotiable',  value: 'negotiable' },
];

const CURRENCIES = [
  { label: 'USD — US Dollar',           value: 'USD' },
  { label: 'EUR — Euro',                value: 'EUR' },
  { label: 'GBP — British Pound',       value: 'GBP' },
  { label: 'AED — UAE Dirham',          value: 'AED' },
  { label: 'SAR — Saudi Riyal',         value: 'SAR' },
  { label: 'EGP — Egyptian Pound',      value: 'EGP' },
  { label: 'NGN — Nigerian Naira',      value: 'NGN' },
  { label: 'KES — Kenyan Shilling',     value: 'KES' },
  { label: 'ZAR — South African Rand',  value: 'ZAR' },
  { label: 'INR — Indian Rupee',        value: 'INR' },
  { label: 'PKR — Pakistani Rupee',     value: 'PKR' },
  { label: 'BDT — Bangladeshi Taka',    value: 'BDT' },
  { label: 'CAD — Canadian Dollar',     value: 'CAD' },
  { label: 'AUD — Australian Dollar',   value: 'AUD' },
  { label: 'TRY — Turkish Lira',        value: 'TRY' },
  { label: 'MAD — Moroccan Dirham',     value: 'MAD' },
  { label: 'GHS — Ghanaian Cedi',       value: 'GHS' },
];

const CATEGORIES = [
  // Development
  { label: 'Web Development',            value: 'Web Development' },
  { label: 'Mobile App Development',     value: 'Mobile App' },
  { label: 'Frontend Development',       value: 'Frontend' },
  { label: 'Backend Development',        value: 'Backend' },
  { label: 'Full Stack Development',     value: 'Full Stack' },
  { label: 'WordPress / CMS',           value: 'WordPress' },
  { label: 'E-Commerce Development',    value: 'E-Commerce' },
  { label: 'API & Integrations',        value: 'API & Integrations' },
  { label: 'DevOps & Cloud',            value: 'DevOps' },
  { label: 'Cybersecurity',             value: 'Cybersecurity' },
  // Design
  { label: 'UI/UX Design',             value: 'UI/UX Design' },
  { label: 'Graphic Design',           value: 'Graphic Design' },
  { label: 'Logo & Branding',          value: 'Branding' },
  { label: 'Motion Graphics',          value: 'Motion Graphics' },
  { label: 'Video Editing',            value: 'Video Editing' },
  { label: '3D Modeling',              value: '3D Modeling' },
  { label: 'Illustration',             value: 'Illustration' },
  { label: 'Photography',              value: 'Photography' },
  { label: 'Architecture & Interior',  value: 'Architecture' },
  // Marketing
  { label: 'Digital Marketing',        value: 'Digital Marketing' },
  { label: 'Social Media Management',  value: 'Social Media' },
  { label: 'SEO / SEM',               value: 'SEO' },
  { label: 'Content Marketing',        value: 'Content Marketing' },
  { label: 'Email Marketing',          value: 'Email Marketing' },
  { label: 'Influencer Marketing',     value: 'Influencer Marketing' },
  { label: 'Paid Advertising (PPC)',   value: 'PPC' },
  // Writing
  { label: 'Copywriting',              value: 'Copywriting' },
  { label: 'Technical Writing',        value: 'Technical Writing' },
  { label: 'Blog & Article Writing',   value: 'Blog Writing' },
  { label: 'Translation',              value: 'Translation' },
  { label: 'Proofreading & Editing',   value: 'Proofreading' },
  { label: 'Script Writing',           value: 'Script Writing' },
  // Business
  { label: 'Business Consulting',      value: 'Business Consulting' },
  { label: 'Financial Consulting',     value: 'Financial Consulting' },
  { label: 'Legal Consulting',         value: 'Legal Consulting' },
  { label: 'HR & Recruitment',         value: 'HR' },
  { label: 'Project Management',       value: 'Project Management' },
  { label: 'Virtual Assistant',        value: 'Virtual Assistant' },
  // Data & AI
  { label: 'Data Analysis',           value: 'Data Analysis' },
  { label: 'Machine Learning / AI',   value: 'AI/ML' },
  { label: 'Data Entry',              value: 'Data Entry' },
  { label: 'Excel & Spreadsheets',    value: 'Excel' },
  // Other
  { label: 'Training & Tutoring',     value: 'Training' },
  { label: 'Music & Audio',           value: 'Music' },
  { label: 'Event Planning',          value: 'Event Planning' },
  { label: 'Other',                   value: 'Other' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceItem {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  priceType?: 'fixed' | 'hourly' | 'negotiable';
  deliveryTime?: number;   // days integer
  isActive?: boolean;
}

interface ServiceFormData {
  title: string;
  description: string;
  category: string;
  price: number | undefined;
  currency: string;
  priceType: 'fixed' | 'hourly' | 'negotiable';
  deliveryTime: number;    // days integer
  isActive: boolean;
}

interface Props {
  visible: boolean;
  service: ServiceItem | null;
  onClose: () => void;
}

interface FormErrors { title?: string; price?: string; deliveryTime?: string }

const EMPTY: ServiceFormData = {
  title: '', description: '', category: '', price: undefined,
  currency: 'USD', priceType: 'fixed', deliveryTime: 1, isActive: true,
};

// ─── Delivery Time Stepper ────────────────────────────────────────────────────

const DeliveryTimeStepper: React.FC<{
  value: number;
  onChange: (v: number) => void;
  colors: any;
  typography: any;
  error?: string;
}> = ({ value, onChange, colors, typography, error }) => (
  <View style={{ marginBottom: 16 }}>
    <Text style={{ fontSize: typography.sm, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 }}>
      Delivery Time (days)
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <TouchableOpacity
        onPress={() => onChange(Math.max(1, value - 1))}
        style={[ds.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="remove" size={18} color={colors.text} />
      </TouchableOpacity>
      <TextInput
        value={String(value)}
        onChangeText={t => {
          const n = parseInt(t, 10);
          if (!isNaN(n) && n >= 1) onChange(n);
        }}
        keyboardType="number-pad"
        style={[ds.input, { color: colors.text, borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface }]}
      />
      <Text style={{ color: colors.textMuted, fontSize: typography.sm }}>days</Text>
      <TouchableOpacity
        onPress={() => onChange(value + 1)}
        style={[ds.btn, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <Ionicons name="add" size={18} color={colors.text} />
      </TouchableOpacity>
    </View>
    {error && <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 4 }}>{error}</Text>}
  </View>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ServiceFormModal: React.FC<Props> = ({ visible, service, onClose }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing } = theme;

  const [form, setForm]   = useState<ServiceFormData>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const isEditing = Boolean(service);

  const addMutation    = useAddService();
  const updateMutation = useUpdateService();
  const isPending = addMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (service) {
      setForm({
        title:        service.title ?? '',
        description:  service.description ?? '',
        category:     service.category ?? '',
        price:        service.price,
        currency:     service.currency ?? 'USD',
        priceType:    service.priceType ?? 'fixed',
        deliveryTime: service.deliveryTime ?? 1,
        isActive:     service.isActive !== false,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [service, visible]);

  const set = <K extends keyof ServiceFormData>(key: K, value: ServiceFormData[K]) =>
    setForm(p => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim())            e.title        = 'Service title is required';
    if (form.deliveryTime < 1)         e.deliveryTime = 'Must be at least 1 day';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    // Payload matches backend schema: deliveryTime is Number
    const payload = {
      title:        form.title.trim(),
      description:  form.description.trim(),
      category:     form.category,
      price:        form.price,
      currency:     form.currency,
      priceType:    form.priceType,
      deliveryTime: form.deliveryTime,   // integer — no more CastError
      isActive:     form.isActive,
    };
    if (isEditing && service) {
      updateMutation.mutate({ id: service._id, data: { ...payload, deliveryTime: payload.deliveryTime.toString() } }, { onSuccess: onClose });
    } else {
      addMutation.mutate(payload as any, { onSuccess: onClose });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>
            {isEditing ? 'Edit Service' : 'Add New Service'}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ padding: spacing[4], paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <AppInput
            label="Service Title *"
            value={form.title}
            onChangeText={(v: string) => set('title', v)}
            placeholder="E.g. Full-Stack Web Application Development"
            error={errors.title}
            leftIcon="construct-outline"
          />

          {/* Category */}
          <SelectInput
            label="Category"
            value={form.category}
            options={CATEGORIES}
            onSelect={(v: string) => set('category', v)}
            placeholder="Select a category"
          />

          {/* Description */}
          <AppInput
            label="Description"
            value={form.description}
            onChangeText={(v: string) => set('description', v)}
            placeholder="Describe what you offer, deliverables, and what the client gets…"
            multiline
            numberOfLines={4}
            leftIcon="document-text-outline"
          />

          {/* Price + Currency */}
          <View style={styles.row}>
            <AppInput
              label="Price"
              value={form.price?.toString() ?? ''}
              onChangeText={(v: any) => set('price', v ? Number(v) : undefined)}
              placeholder="500"
              keyboardType="numeric"
              leftIcon="pricetag-outline"
              containerStyle={{ flex: 1.2, marginRight: spacing[2] }}
            />
            <SelectInput
              label="Currency"
              value={form.currency}
              options={CURRENCIES}
              onSelect={(v: string) => set('currency', v)}
            />
          </View>

          {/* Price type */}
          <SelectInput
            label="Price Type"
            value={form.priceType}
            options={PRICE_TYPES}
            onSelect={(v: string) => set('priceType', v as 'fixed' | 'hourly' | 'negotiable')}
          />

          {/* Delivery time — number stepper (not free text) */}
          <DeliveryTimeStepper
            value={form.deliveryTime}
            onChange={v => set('deliveryTime', v)}
            colors={colors}
            typography={typography}
            error={errors.deliveryTime}
          />

          {/* Active toggle */}
          <TouchableOpacity
            onPress={() => set('isActive', !form.isActive)}
            style={[styles.toggleRow, { borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surface }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.sm, fontWeight: '600', color: colors.text }}>Active Service</Text>
              <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2 }}>
                Visible to clients on your profile
              </Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: form.isActive ? colors.primary : colors.border, borderRadius: 14 }]}>
              <View style={[styles.knob, { alignSelf: form.isActive ? 'flex-end' : 'flex-start' }]} />
            </View>
          </TouchableOpacity>

          <AppButton
            label={isPending ? (isEditing ? 'Saving…' : 'Adding…') : (isEditing ? 'Save Changes' : 'Add Service')}
            onPress={handleSubmit}
            loading={isPending}
            disabled={isPending}
            style={{ marginTop: spacing[5] }}
            icon="checkmark-circle-outline"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const ds = StyleSheet.create({
  btn:   { width: 40, height: 40, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  input: { width: 64, height: 40, borderWidth: 1.5, borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: '700' },
});

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderWidth: 1.5, marginBottom: 12 },
  toggle: { width: 44, height: 26, padding: 3, justifyContent: 'center' },
  knob: { width: 20, height: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } },
});

export default ServiceFormModal;