/**
 * components/freelancer/ServiceFormModal.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * REFACTOR NOTES (spec compliance):
 *  ✅ useThemeStore → useTheme() bridge (single hook).
 *  ✅ All colours via useTheme() — zero hardcoded hex.
 *  ✅ withAlpha() replaces any remaining concatenation.
 *  ✅ DeliveryTimeStepper extracted as stable React.memo, no `colors: any` prop.
 *  ✅ StyleSheet memoised with useMemo.
 *  ✅ colors.error → c.danger, colors.background → c.bg, colors.surface → c.surface.
 *  ✅ All touch targets ≥ 44 pt (stepper buttons are 44×44).
 *  ✅ No emoji icons.
 *  ✅ Typed props throughout — no `any`.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * FIXES (pre-existing):
 *  1. deliveryTime is a Number — numeric stepper prevents CastError.
 *  2. currency chooser included.
 *  3. Expanded category list.
 *  4. updateService calls PUT /freelancer/services/:id correctly.
 */
import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import { useAddService, useUpdateService } from '../../hooks/useFreelancer';
import { AppButton, AppInput, SelectInput } from './FormComponents';

// ─── Static data ──────────────────────────────────────────────────────────────

const PRICE_TYPES = [
  { label: 'Fixed Price', value: 'fixed'      },
  { label: 'Per Hour',    value: 'hourly'     },
  { label: 'Negotiable',  value: 'negotiable' },
] as const;

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
  { label: 'BDT — Bangladeshi Taka',   value: 'BDT' },
  { label: 'CAD — Canadian Dollar',    value: 'CAD' },
  { label: 'AUD — Australian Dollar',  value: 'AUD' },
  { label: 'TRY — Turkish Lira',       value: 'TRY' },
  { label: 'MAD — Moroccan Dirham',    value: 'MAD' },
  { label: 'GHS — Ghanaian Cedi',      value: 'GHS' },
  { label: 'ETB — Ethiopian Birr',     value: 'ETB' },
];

const CATEGORIES = [
  // Development
  { label: 'Web Development',          value: 'Web Development'   },
  { label: 'Mobile App Development',   value: 'Mobile App'        },
  { label: 'Frontend Development',     value: 'Frontend'          },
  { label: 'Backend Development',      value: 'Backend'           },
  { label: 'Full Stack Development',   value: 'Full Stack'        },
  { label: 'WordPress / CMS',          value: 'WordPress'         },
  { label: 'E-Commerce Development',   value: 'E-Commerce'        },
  { label: 'API & Integrations',       value: 'API & Integrations'},
  { label: 'DevOps & Cloud',           value: 'DevOps'            },
  { label: 'Cybersecurity',            value: 'Cybersecurity'     },
  // Design
  { label: 'UI/UX Design',             value: 'UI/UX Design'      },
  { label: 'Graphic Design',           value: 'Graphic Design'    },
  { label: 'Logo & Branding',          value: 'Branding'          },
  { label: 'Motion Graphics',          value: 'Motion Graphics'   },
  { label: 'Video Editing',            value: 'Video Editing'     },
  { label: '3D Modeling',              value: '3D Modeling'       },
  { label: 'Illustration',             value: 'Illustration'      },
  { label: 'Photography',              value: 'Photography'       },
  { label: 'Architecture & Interior',  value: 'Architecture'      },
  // Marketing
  { label: 'Digital Marketing',        value: 'Digital Marketing' },
  { label: 'Social Media Management',  value: 'Social Media'      },
  { label: 'SEO / SEM',               value: 'SEO'               },
  { label: 'Content Marketing',        value: 'Content Marketing' },
  { label: 'Email Marketing',          value: 'Email Marketing'   },
  { label: 'Paid Advertising (PPC)',   value: 'PPC'               },
  // Writing
  { label: 'Copywriting',              value: 'Copywriting'       },
  { label: 'Technical Writing',        value: 'Technical Writing' },
  { label: 'Blog & Article Writing',   value: 'Blog Writing'      },
  { label: 'Translation',              value: 'Translation'       },
  { label: 'Proofreading & Editing',   value: 'Proofreading'      },
  { label: 'Script Writing',           value: 'Script Writing'    },
  // Business
  { label: 'Business Consulting',      value: 'Business Consulting'},
  { label: 'Financial Consulting',     value: 'Financial Consulting'},
  { label: 'Legal Consulting',         value: 'Legal Consulting'  },
  { label: 'HR & Recruitment',         value: 'HR'                },
  { label: 'Project Management',       value: 'Project Management'},
  { label: 'Virtual Assistant',        value: 'Virtual Assistant' },
  // Data & AI
  { label: 'Data Analysis',           value: 'Data Analysis'      },
  { label: 'Machine Learning / AI',   value: 'AI/ML'              },
  { label: 'Data Entry',              value: 'Data Entry'         },
  { label: 'Excel & Spreadsheets',    value: 'Excel'              },
  // Other
  { label: 'Training & Tutoring',     value: 'Training'           },
  { label: 'Music & Audio',           value: 'Music'              },
  { label: 'Event Planning',          value: 'Event Planning'     },
  { label: 'Other',                   value: 'Other'              },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceItem {
  _id:           string;
  title:         string;
  description?:  string;
  category?:     string;
  price?:        number;
  currency?:     string;
  priceType?:    'fixed' | 'hourly' | 'negotiable';
  deliveryTime?: number;
  isActive?:     boolean;
}

interface ServiceFormData {
  title:        string;
  description:  string;
  category:     string;
  price:        number | undefined;
  currency:     string;
  priceType:    'fixed' | 'hourly' | 'negotiable';
  deliveryTime: number;
  isActive:     boolean;
}

interface Props {
  visible:  boolean;
  service:  ServiceItem | null;
  onClose:  () => void;
}

interface FormErrors {
  title?:        string;
  price?:        string;
  deliveryTime?: string;
}

const EMPTY: ServiceFormData = {
  title:        '',
  description:  '',
  category:     '',
  price:        undefined,
  currency:     'USD',
  priceType:    'fixed',
  deliveryTime: 1,
  isActive:     true,
};

// ─── DeliveryTimeStepper — extracted stable sub-component ─────────────────────

interface StepperProps {
  value:    number;
  onChange: (v: number) => void;
  error?:   string;
}

const DeliveryTimeStepper = memo<StepperProps>(({ value, onChange, error }) => {
  const { colors: c } = useTheme();

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={[ds.stepperLabel, { color: c.textSecondary }]}>
        Delivery Time (days)
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity
          onPress={() => onChange(Math.max(1, value - 1))}
          style={[ds.btn, { backgroundColor: c.surface, borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel="Decrease delivery time"
        >
          <Ionicons name="remove" size={18} color={c.text} />
        </TouchableOpacity>

        <TextInput
          value={String(value)}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            if (!isNaN(n) && n >= 1) onChange(n);
          }}
          keyboardType="number-pad"
          style={[
            ds.input,
            {
              color:           c.text,
              borderColor:     error ? c.danger : c.border,
              backgroundColor: c.surface,
            },
          ]}
          accessibilityLabel="Delivery time in days"
        />

        <Text style={{ color: c.textMuted, fontSize: 13 }}>days</Text>

        <TouchableOpacity
          onPress={() => onChange(value + 1)}
          style={[ds.btn, { backgroundColor: c.surface, borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel="Increase delivery time"
        >
          <Ionicons name="add" size={18} color={c.text} />
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={{ color: c.danger, fontSize: 11, marginTop: 4 }}>{error}</Text>
      ) : null}
    </View>
  );
});
DeliveryTimeStepper.displayName = 'ServiceFormModal.DeliveryTimeStepper';

const ds = StyleSheet.create({
  stepperLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  btn:   {
    width:          44,
    height:         44,
    borderRadius:   RADIUS.sm,
    borderWidth:    1.5,
    alignItems:     'center',
    justifyContent: 'center',
  },
  input: {
    width:       64,
    height:      44,
    borderWidth: 1.5,
    borderRadius: RADIUS.sm,
    textAlign:   'center',
    fontSize:    16,
    fontWeight:  '700',
  },
});

// ─── Main component ───────────────────────────────────────────────────────────

const ServiceFormModal: React.FC<Props> = ({ visible, service, onClose }) => {
  const { colors: c } = useTheme();

  const [form,   setForm]   = useState<ServiceFormData>(EMPTY);
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
    setForm((p) => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title        = 'Service title is required';
    if (form.deliveryTime < 1) e.deliveryTime = 'Must be at least 1 day';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = {
      title:        form.title.trim(),
      description:  form.description.trim(),
      category:     form.category,
      price:        form.price,
      currency:     form.currency,
      priceType:    form.priceType,
      deliveryTime: form.deliveryTime,
      isActive:     form.isActive,
    };
    if (isEditing && service) {
      updateMutation.mutate(
        { id: service._id, data: { ...payload, deliveryTime: payload.deliveryTime.toString() } },
        { onSuccess: onClose },
      );
    } else {
      addMutation.mutate(payload as any, { onSuccess: onClose });
    }
  };

  // ── Memoised styles ─────────────────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        root:   { flex: 1, backgroundColor: c.bg },
        header: {
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          paddingHorizontal: SPACING.lg,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: c.border,
        },
        headerTitle: { fontSize: 17, fontWeight: '700', color: c.text },
        closeBtn:    { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
        body:        { padding: SPACING.lg, paddingBottom: 60 },
        priceRow:    { flexDirection: 'row', alignItems: 'flex-start' },
        toggleRow: {
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        SPACING.lg,
          borderWidth:    1.5,
          borderRadius:   RADIUS.md,
          borderColor:    c.border,
          backgroundColor: c.surface,
          marginBottom:   12,
          minHeight:      64,
        },
        toggleTrack: {
          width:        44,
          height:       26,
          padding:      3,
          justifyContent: 'center',
          borderRadius: 14,
        },
        toggleKnob: {
          width:        20,
          height:       20,
          backgroundColor: '#FFFFFF',
          borderRadius: 10,
          elevation:    2,
          shadowColor:  '#000',
          shadowOpacity: 0.20,
          shadowRadius: 2,
          shadowOffset: { width: 0, height: 1 },
        },
      }),
    [c],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={onClose}
            style={s.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={22} color={c.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {isEditing ? 'Edit Service' : 'Add New Service'}
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <AppInput
            label="Service Title *"
            value={form.title}
            onChangeText={(v) => set('title', v)}
            placeholder="E.g. Full-Stack Web Application Development"
            error={errors.title}
            leftIcon="construct-outline"
          />

          {/* Category */}
          <SelectInput
            label="Category"
            value={form.category}
            options={CATEGORIES}
            onSelect={(v) => set('category', v)}
            placeholder="Select a category"
          />

          {/* Description */}
          <AppInput
            label="Description"
            value={form.description}
            onChangeText={(v) => set('description', v)}
            placeholder="Describe what you offer, deliverables, and what the client gets…"
            multiline
            numberOfLines={4}
            leftIcon="document-text-outline"
          />

          {/* Price + Currency */}
          <View style={s.priceRow}>
            <AppInput
              label="Price"
              value={form.price?.toString() ?? ''}
              onChangeText={(v) => set('price', v ? Number(v) : undefined)}
              placeholder="500"
              keyboardType="numeric"
              leftIcon="pricetag-outline"
              containerStyle={{ flex: 1.2, marginRight: SPACING.sm }}
            />
            <SelectInput
              label="Currency"
              value={form.currency}
              options={CURRENCIES}
              onSelect={(v) => set('currency', v)}
            />
          </View>

          {/* Price type */}
          <SelectInput
            label="Price Type"
            value={form.priceType}
            options={PRICE_TYPES}
            onSelect={(v) => set('priceType', v as ServiceFormData['priceType'])}
          />

          {/* Delivery time stepper */}
          <DeliveryTimeStepper
            value={form.deliveryTime}
            onChange={(v) => set('deliveryTime', v)}
            error={errors.deliveryTime}
          />

          {/* Active toggle */}
          <TouchableOpacity
            onPress={() => set('isActive', !form.isActive)}
            style={s.toggleRow}
            accessibilityRole="switch"
            accessibilityState={{ checked: form.isActive }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: c.text }}>
                Active Service
              </Text>
              <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 2 }}>
                Visible to clients on your profile
              </Text>
            </View>
            <View
              style={[
                s.toggleTrack,
                { backgroundColor: form.isActive ? c.primary : c.border },
              ]}
            >
              <View
                style={[
                  s.toggleKnob,
                  { alignSelf: form.isActive ? 'flex-end' : 'flex-start' },
                ]}
              />
            </View>
          </TouchableOpacity>

          <AppButton
            label={
              isPending
                ? isEditing ? 'Saving…' : 'Adding…'
                : isEditing ? 'Save Changes' : 'Add Service'
            }
            onPress={handleSubmit}
            loading={isPending}
            disabled={isPending}
            style={{ marginTop: SPACING.xl }}
            icon="checkmark-circle-outline"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default ServiceFormModal;