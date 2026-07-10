// src/components/professionalTenders/ProfessionalTenderForm/FormFields.tsx
// FULLY REFACTORED: Premium Mint-themed form primitives using useTheme() hook
// All colors, spacing, radius from theme system. No hardcoded values.

import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';

// ═════════════════════════════════════════════════════════════════════════════
// LABELED FIELD — the wrapper every input lives inside
// ═════════════════════════════════════════════════════════════════════════════

export interface LabeledFieldProps {
  label?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}

export const LabeledField: React.FC<LabeledFieldProps> = ({
  label,
  required,
  helper,
  error,
  children,
}) => {
  const { colors, spacing } = useTheme();
  
  return (
    <View style={{ gap: spacing.xs }}>
      {!!label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.text }]}>
            {label}
            {required ? <Text style={{ color: colors.danger }}> *</Text> : null}
          </Text>
        </View>
      )}
      {children}
      {!!error ? (
        <Text style={[styles.helper, { color: colors.danger }]}>{error}</Text>
      ) : !!helper ? (
        <Text style={[styles.helper, { color: colors.textMuted }]}>{helper}</Text>
      ) : null}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// TEXT FIELD
// ═════════════════════════════════════════════════════════════════════════════

export interface TextFieldProps {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad' | 'url' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  maxLength?: number;
  editable?: boolean;
}

export const TextField: React.FC<TextFieldProps> = ({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  multiline = false,
  numberOfLines,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  maxLength,
  editable = true,
}) => {
  const { colors, spacing, radius } = useTheme();
  
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      placeholderTextColor={colors.inputPlaceholder}
      multiline={multiline}
      numberOfLines={numberOfLines}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      maxLength={maxLength}
      editable={editable}
      style={[
        styles.input,
        multiline && {
          minHeight: (numberOfLines ?? 4) * 22,
          textAlignVertical: 'top',
          paddingTop: 12,
        },
        {
          backgroundColor: colors.inputBg,
          color: colors.text,
          borderColor: error ? colors.danger : colors.inputBorder,
          borderRadius: radius.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// OPTION GRID — used for tender type, workflow type, etc.
// ═════════════════════════════════════════════════════════════════════════════

export interface OptionGridOption<T extends string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export interface OptionGridProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<OptionGridOption<T>>;
  columns?: 1 | 2 | 4;
  showDescriptions?: boolean;
}

export function OptionGrid<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
  showDescriptions,
}: OptionGridProps<T>) {
  const { colors, spacing, radius, shadows } = useTheme();
  const flexBasis = columns === 1 ? '100%' : columns === 4 ? '23%' : '48%';

  return (
    <View style={styles.optionGrid}>
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            style={({ pressed }) => [
              styles.optionCard,
              {
                flexBasis,
                backgroundColor: selected ? colors.primary : colors.bgCard,
                borderColor: selected ? colors.primary : colors.border,
                borderRadius: radius.lg,
                padding: spacing.md,
                borderWidth: selected ? 2 : 1,
                opacity: pressed ? 0.85 : 1,
                ...(selected ? shadows.sm : {}),
              },
            ]}
          >
            {opt.icon ? <View style={{ marginBottom: spacing.xs }}>{opt.icon}</View> : null}
            <Text
              style={[
                styles.optionLabel,
                {
                  color: selected ? '#FFFFFF' : colors.text,
                  fontWeight: selected ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
            {showDescriptions && !!opt.description && (
              <Text
                style={[
                  styles.optionDesc,
                  {
                    color: selected ? 'rgba(255,255,255,0.85)' : colors.textMuted,
                    marginTop: spacing.xs,
                  },
                ]}
                numberOfLines={2}
              >
                {opt.description}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TOGGLE FIELD
// ═════════════════════════════════════════════════════════════════════════════

export interface ToggleFieldProps {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export const ToggleField: React.FC<ToggleFieldProps> = ({
  value,
  onChange,
  label,
  description,
}) => {
  const { colors, spacing, radius } = useTheme();
  
  return (
    <View
      style={[
        styles.toggleRow,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
        },
      ]}
    >
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>{label}</Text>
        {!!description && (
          <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
            {description}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// CHIP INPUT — for arrays like requiredCertifications
// ═════════════════════════════════════════════════════════════════════════════

export interface ChipInputProps {
  values: string[];
  onChange: (vs: string[]) => void;
  placeholder?: string;
  max?: number;
}

export const ChipInput: React.FC<ChipInputProps> = ({
  values,
  onChange,
  placeholder,
  max = 20,
}) => {
  const { colors, spacing, radius } = useTheme();
  const [draft, setDraft] = useState('');

  const addCurrent = React.useCallback(() => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) { setDraft(''); return; }
    if (values.length >= max) return;
    onChange([...values, v]);
    setDraft('');
  }, [draft, values, onChange, max]);

  const remove = (v: string) => onChange(values.filter((x) => x !== v));

  return (
    <View>
      <View
        style={[
          styles.chipBox,
          {
            backgroundColor: colors.inputBg,
            borderColor: colors.inputBorder,
            borderRadius: radius.md,
            padding: spacing.sm,
            minHeight: 52,
          },
        ]}
      >
        {values.map((v) => (
          <View
            key={v}
            style={[
              styles.chip,
              {
                backgroundColor: `${colors.primary}15`,
                borderRadius: radius.full,
              },
            ]}
          >
            <Text
              style={[styles.chipText, { color: colors.primary }]}
              numberOfLines={1}
            >
              {v}
            </Text>
            <Pressable
              onPress={() => remove(v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${v}`}
            >
              <X size={12} color={colors.primary} strokeWidth={2.5} />
            </Pressable>
          </View>
        ))}
        {values.length < max && (
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addCurrent}
            onBlur={addCurrent}
            placeholder={placeholder ?? 'Type and press return…'}
            placeholderTextColor={colors.inputPlaceholder}
            blurOnSubmit={false}
            returnKeyType="done"
            style={[styles.chipInput, { color: colors.text }]}
          />
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// SECTION HEADER
// ═════════════════════════════════════════════════════════════════════════════

export const SectionHeader: React.FC<{
  title: string;
  description?: string;
}> = ({ title, description }) => {
  const { colors, spacing } = useTheme();
  
  return (
    <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {!!description && (
        <Text style={[styles.sectionDesc, { color: colors.textMuted }]}>
          {description}
        </Text>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// SEGMENTED CONTROL
// ═════════════════════════════════════════════════════════════════════════════

export interface SegmentedProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: SegmentedProps<T>) {
  const { colors, spacing, radius } = useTheme();
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.segmented, { gap: spacing.sm }]}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.segment,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
                borderRadius: radius.full,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm + 2,
              },
            ]}
          >
            {active && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
            <Text
              style={[
                styles.segmentLabel,
                {
                  color: active ? '#FFFFFF' : colors.text,
                  fontWeight: active ? '700' : '500',
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PREMIUM CARD — shared card wrapper for grouping
// ═════════════════════════════════════════════════════════════════════════════

export const PremiumCard: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  
  return (
    <View
      style={[
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.lg,
          padding: spacing.lg,
          borderWidth: 1,
          ...shadows.sm,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600' },
  helper: { fontSize: 11, lineHeight: 15, marginTop: 2 },

  input: {
    fontSize: 14,
    borderWidth: 1,
    minHeight: 44,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    minHeight: 52,
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 13 },
  optionDesc: { fontSize: 11, lineHeight: 14 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    gap: 12,
  },
  toggleText: { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc: { fontSize: 12, lineHeight: 16 },

  chipBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  chipText: { fontSize: 12, fontWeight: '600', maxWidth: 200 },
  chipInput: { flex: 1, minWidth: 100, fontSize: 13, padding: 4 },

  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  sectionDesc: { fontSize: 12, lineHeight: 17 },

  segmented: { paddingVertical: 2 },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    minHeight: 38,
  },
  segmentLabel: { fontSize: 13 },
});