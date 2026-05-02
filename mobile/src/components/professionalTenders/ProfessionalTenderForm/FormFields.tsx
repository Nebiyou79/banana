// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/ProfessionalTenderForm/FormFields.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Shared form primitives consumed by Step1–Step7.  Kept tiny and themed
//  so step components stay declarative — they describe what fields exist,
//  not how they look.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useMemo } from 'react';
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
import { useThemeStore } from '../../../store/themeStore';

// ═════════════════════════════════════════════════════════════════════════════
//  PALETTE HELPER
// ═════════════════════════════════════════════════════════════════════════════

const usePalette = () => {
  const theme = useThemeStore((s) => s.theme);
  const isDark = !!theme.isDark;
  return useMemo(
    () => ({
      isDark,
      surface:        isDark ? '#1E293B' : '#FFFFFF',
      inputBg:        isDark ? '#0F172A' : '#F8FAFC',
      border:         isDark ? '#334155' : '#E2E8F0',
      borderFocus:    isDark ? '#60A5FA' : '#2563EB',
      borderError:    isDark ? '#F87171' : '#DC2626',
      text:           isDark ? '#F1F5F9' : '#0F172A',
      textMuted:      isDark ? '#94A3B8' : '#64748B',
      textSubtle:     isDark ? '#64748B' : '#94A3B8',
      placeholder:    isDark ? '#64748B' : '#94A3B8',
      primary:        isDark ? '#60A5FA' : '#2563EB',
      primaryFg:      '#FFFFFF',
      error:          isDark ? '#F87171' : '#DC2626',
      errorBg:        isDark ? 'rgba(248,113,113,0.10)' : '#FEF2F2',
      success:        isDark ? '#34D399' : '#16A34A',
      chipBg:         isDark ? '#1E3A5F' : '#DBEAFE',
      chipFg:         isDark ? '#93C5FD' : '#1D4ED8',
    }),
    [isDark],
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  LABELED FIELD — the wrapper every input lives inside
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
  const p = usePalette();
  return (
    <View style={styles.fieldRoot}>
      {!!label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: p.text }]}>
            {label}
            {required ? <Text style={{ color: p.error }}> *</Text> : null}
          </Text>
        </View>
      )}
      {children}
      {!!error ? (
        <Text style={[styles.helper, { color: p.error }]}>{error}</Text>
      ) : !!helper ? (
        <Text style={[styles.helper, { color: p.textMuted }]}>{helper}</Text>
      ) : null}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  TEXT FIELD
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
  const p = usePalette();
  return (
    <TextInput
      value={value ?? ''}
      onChangeText={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      placeholderTextColor={p.placeholder}
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
          backgroundColor: p.inputBg,
          color: p.text,
          borderColor: error ? p.borderError : p.border,
        },
      ]}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  OPTION GRID — used for tender type, workflow type, etc.
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
  /** 2 or 4 columns. Defaults to 2 on mobile. */
  columns?: 1 | 2 | 4;
  /** Render description text under labels. */
  showDescriptions?: boolean;
}

export function OptionGrid<T extends string>({
  value,
  onChange,
  options,
  columns = 2,
  showDescriptions,
}: OptionGridProps<T>) {
  const p = usePalette();
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
            style={({ pressed }: { pressed: boolean }) => [
              styles.optionCard,
              {
                flexBasis,
                backgroundColor: selected ? p.primary : p.inputBg,
                borderColor: selected ? p.primary : p.border,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {opt.icon ? <View style={{ marginBottom: 6 }}>{opt.icon}</View> : null}
            <Text
              style={[
                styles.optionLabel,
                { color: selected ? p.primaryFg : p.text },
              ]}
              numberOfLines={1}
            >
              {opt.label}
            </Text>
            {showDescriptions && !!opt.description && (
              <Text
                style={[
                  styles.optionDesc,
                  { color: selected ? p.primaryFg : p.textMuted },
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
//  TOGGLE FIELD
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
  const p = usePalette();
  return (
    <View style={[styles.toggleRow, { backgroundColor: p.inputBg, borderColor: p.border }]}>
      <View style={styles.toggleText}>
        <Text style={[styles.toggleLabel, { color: p.text }]}>{label}</Text>
        {!!description && (
          <Text style={[styles.toggleDesc, { color: p.textMuted }]}>{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: p.border, true: p.primary }}
        thumbColor={p.surface}
      />
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  CHIP INPUT — for arrays like requiredCertifications
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
  const p = usePalette();
  const [draft, setDraft] = React.useState('');

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
      <View style={[styles.chipBox, { backgroundColor: p.inputBg, borderColor: p.border }]}>
        {values.map((v) => (
          <View key={v} style={[styles.chip, { backgroundColor: p.chipBg }]}>
            <Text style={[styles.chipText, { color: p.chipFg }]} numberOfLines={1}>
              {v}
            </Text>
            <Pressable
              onPress={() => remove(v)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${v}`}
            >
              <X size={12} color={p.chipFg} strokeWidth={2.5} />
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
            placeholderTextColor={p.placeholder}
            blurOnSubmit={false}
            returnKeyType="done"
            style={[
              styles.chipInput,
              { color: p.text },
            ]}
          />
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  SECTION (used inside steps for visual grouping)
// ═════════════════════════════════════════════════════════════════════════════

export const SectionHeader: React.FC<{ title: string; description?: string }> = ({
  title,
  description,
}) => {
  const p = usePalette();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: p.text }]}>{title}</Text>
      {!!description && (
        <Text style={[styles.sectionDesc, { color: p.textMuted }]}>{description}</Text>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  SEGMENTED CONTROL — compact horizontal toggle (currency, evaluation method)
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
  const p = usePalette();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.segmented}
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
                backgroundColor: active ? p.primary : p.inputBg,
                borderColor: active ? p.primary : p.border,
              },
            ]}
          >
            {active && <Check size={13} color={p.primaryFg} strokeWidth={2.5} />}
            <Text
              style={[
                styles.segmentLabel,
                { color: active ? p.primaryFg : p.text },
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
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  fieldRoot: { gap: 6 },
  labelRow:  { flexDirection: 'row', alignItems: 'center' },
  label:     { fontSize: 13, fontWeight: '600' },
  helper:    { fontSize: 11, lineHeight: 15, marginTop: 2 },

  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 44,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 52,
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 13, fontWeight: '700' },
  optionDesc:  { fontSize: 11, marginTop: 4, lineHeight: 14 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  toggleText:  { flex: 1, gap: 2 },
  toggleLabel: { fontSize: 14, fontWeight: '600' },
  toggleDesc:  { fontSize: 12, lineHeight: 16 },

  chipBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    minHeight: 52,
    padding: 8,
    borderWidth: 1,
    borderRadius: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: '100%',
  },
  chipText:  { fontSize: 12, fontWeight: '600', maxWidth: 200 },
  chipInput: { flex: 1, minWidth: 100, fontSize: 13, padding: 4 },

  sectionHeader: { marginBottom: 8, gap: 2 },
  sectionTitle:  { fontSize: 15, fontWeight: '700' },
  sectionDesc:   { fontSize: 12, lineHeight: 17 },

  segmented: { gap: 8, paddingVertical: 2 },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 38,
  },
  segmentLabel: { fontSize: 13, fontWeight: '600' },
});
