import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useAddService, useUpdateService } from '../../hooks/useFreelancer';
import { AppButton, AppInput, SelectInput } from '../shared/FormComponents';
import type { FreelancerServiceItem, ServiceFormData } from '../../types/freelancer';

interface Props {
  visible: boolean;
  service: FreelancerServiceItem | null;
  onClose: () => void;
}

const PRICE_TYPES = [
  { label: 'Fixed Price', value: 'fixed' },
  { label: 'Per Hour',    value: 'hourly' },
  { label: 'Negotiable',  value: 'negotiable' },
];

const CATEGORIES = [
  { label: 'Web Development',  value: 'Web Development' },
  { label: 'Mobile App',       value: 'Mobile App' },
  { label: 'UI/UX Design',     value: 'Design' },
  { label: 'Digital Marketing',value: 'Marketing' },
  { label: 'Content Writing',  value: 'Writing' },
  { label: 'Consulting',       value: 'Consulting' },
  { label: 'Data & Analytics', value: 'Data' },
  { label: 'Other',            value: 'Other' },
];

const EMPTY: ServiceFormData = {
  title: '', description: '', category: '', price: undefined,
  priceType: 'fixed', deliveryTime: '', isActive: true,
};

interface FormErrors { title?: string }

const ServiceFormModal: React.FC<Props> = ({ visible, service, onClose }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing } = theme;

  const [form, setForm] = useState<ServiceFormData>(EMPTY);
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
        priceType:    service.priceType ?? 'fixed',
        deliveryTime: service.deliveryTime ?? '',
        isActive:     service.isActive !== false,
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [service, visible]);

  const set = (key: keyof ServiceFormData, value: unknown) =>
    setForm(p => ({ ...p, [key]: value }));

  const validate = () => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = 'Service title is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = { ...form };
    if (isEditing && service) {
      updateMutation.mutate({ id: service._id, data: payload }, { onSuccess: onClose });
    } else {
      addMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Modal Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            onChangeText={v => set('title', v)}
            placeholder="E.g. Full-Stack Web Application Development"
            error={errors.title}
            leftIcon="construct-outline"
          />

          {/* Category */}
          <SelectInput
            label="Category"
            value={form.category ?? ''}
            options={CATEGORIES}
            onSelect={v => set('category', v)}
            placeholder="Select a category"
          />

          {/* Description */}
          <AppInput
            label="Description"
            value={form.description ?? ''}
            onChangeText={v => set('description', v)}
            placeholder="Describe what you offer, deliverables, and what the client gets…"
            multiline
            numberOfLines={4}
            leftIcon="document-text-outline"
          />

          {/* Pricing */}
          <View style={styles.priceRow}>
            <AppInput
              label="Price ($)"
              value={form.price?.toString() ?? ''}
              onChangeText={v => set('price', v ? Number(v) : undefined)}
              placeholder="500"
              keyboardType="numeric"
              leftIcon="pricetag-outline"
              containerStyle={{ flex: 1, marginRight: spacing[3] }}
            />
            <SelectInput
              label="Type"
              value={form.priceType ?? 'fixed'}
              options={PRICE_TYPES}
              onSelect={v => set('priceType', v as 'fixed' | 'hourly' | 'negotiable')}
            />
          </View>

          {/* Delivery Time */}
          <AppInput
            label="Delivery Time"
            value={form.deliveryTime ?? ''}
            onChangeText={v => set('deliveryTime', v)}
            placeholder="E.g. 3 business days, 1 week…"
            leftIcon="time-outline"
          />

          {/* Active Toggle */}
          <TouchableOpacity
            onPress={() => set('isActive', !form.isActive)}
            style={[
              styles.toggleRow,
              { borderColor: colors.border, borderRadius: borderRadius.md, backgroundColor: colors.surface },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.sm, fontWeight: '600', color: colors.text }}>Active Service</Text>
              <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2 }}>
                Visible to clients on your profile
              </Text>
            </View>
            <View style={[
              styles.toggle,
              { backgroundColor: form.isActive ? colors.primary : colors.border, borderRadius: 14 },
            ]}>
              <View style={[styles.knob, { alignSelf: form.isActive ? 'flex-end' : 'flex-start' }]} />
            </View>
          </TouchableOpacity>

          {/* Submit */}
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

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  toggle: {
    width: 44,
    height: 26,
    padding: 3,
    justifyContent: 'center',
  },
  knob: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});

export default ServiceFormModal;
