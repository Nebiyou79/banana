/**
 * components/shared/FormComponents.tsx
 * Reusable form atoms used across all 4 role edit screens.
 *
 * Named exports:
 *   InputField, DateField, TagInput, SelectField, PillSelector, SwitchField,
 *   SectionCard, ArrayItemCard, EmptyState
 *
 * Aliases (used by ServiceFormModal & CertificationFormModal):
 *   AppInput    → InputField
 *   AppButton   → new PrimaryButton component
 *   SelectInput → SelectField wrapper
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Modal,
  Platform,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  optional?: boolean;
  maxLength?: number;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  editable?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  returnKeyType?: 'done' | 'next' | 'search' | 'send';
  onSubmitEditing?: () => void;
}

interface DateFieldProps {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  optional?: boolean;
}

interface TagInputProps {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  max?: number;
  accentColor?: string;
}

interface SelectFieldProps {
  label?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange?: (v: string) => void;
  onSelect?: (v: string) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
}

// ─── InputField ───────────────────────────────────────────────────────────────

export const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder, multiline = false,
  numberOfLines = 4, keyboardType = 'default', autoCapitalize = 'sentences',
  error, optional, maxLength, style, containerStyle, editable = true, leftIcon,
  returnKeyType, onSubmitEditing,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const [focused, setFocused] = useState(false);

  return (
    <View style={[{ marginBottom: spacing[4] }, containerStyle, style]}>
      {label ? (
        <Text style={[s.label, { color: colors.textSecondary, fontSize: typography.sm }]}>
          {label}
          {optional && <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>}
        </Text>
      ) : null}
      <View style={[
        s.inputWrap,
        {
          borderColor: error ? colors.error : focused ? colors.primary : colors.border,
          backgroundColor: editable ? colors.surface : colors.surface,
          borderRadius: borderRadius.md,
        }
      ]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? (label ? `Enter ${label.toLowerCase()}` : '')}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            s.input,
            {
              color: colors.text,
              fontSize: typography.base,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight: multiline ? numberOfLines * 24 : 44,
              flex: 1,
            }
          ]}
        />
        {maxLength && value.length > maxLength * 0.8 && (
          <Text style={{ color: colors.textMuted, fontSize: 10, alignSelf: 'flex-end', marginLeft: 4 }}>
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
      {error && (
        <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
};

// ─── AppInput — alias for InputField (used by ServiceFormModal, CertFormModal) ─
export const AppInput = InputField;

// ─── AppButton ────────────────────────────────────────────────────────────────

interface AppButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'outline' | 'ghost';
  color?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label, onPress, loading = false, disabled = false,
  style, icon, variant = 'primary', color,
}) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography } = theme;

  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const accentColor = color ?? colors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        s.appBtn,
        {
          backgroundColor: isPrimary ? accentColor : isOutline ? 'transparent' : 'transparent',
          borderColor: isOutline ? accentColor : 'transparent',
          borderWidth: isOutline ? 1.5 : 0,
          borderRadius: borderRadius.lg,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? '#fff' : accentColor} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={isPrimary ? '#fff' : accentColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={{
            color: isPrimary ? '#fff' : accentColor,
            fontWeight: '700',
            fontSize: typography.sm,
          }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── SelectInput — alias for SelectField with onSelect prop support ───────────

export const SelectInput: React.FC<SelectFieldProps> = (props) => {
  return <SelectField {...props} onChange={props.onSelect ?? props.onChange ?? (() => {})} />;
};

// ─── DateField ────────────────────────────────────────────────────────────────

const formatDisplay = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const toDate = (iso?: string): Date => {
  if (!iso) return new Date();
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
};

export const DateField: React.FC<DateFieldProps> = ({
  label, value, onChange, placeholder = 'Select date',
  minDate, maxDate, error, optional,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState<Date>(toDate(value));

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selected) {
        onChange(selected.toISOString().split('T')[0]);
      }
    } else {
      if (selected) setTemp(selected);
    }
  };

  const handleIOSConfirm = () => {
    onChange(temp.toISOString().split('T')[0]);
    setShow(false);
  };

  const display = formatDisplay(value);

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text style={[s.label, { color: colors.textSecondary, fontSize: typography.sm }]}>
        {label}
        {optional && <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => { setTemp(toDate(value)); setShow(true); }}
        activeOpacity={0.8}
        style={[
          s.inputWrap,
          {
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
            borderRadius: borderRadius.md,
            height: 50,
          }
        ]}
      >
        <Ionicons name="calendar-outline" size={18} color={display ? colors.primary : colors.textMuted} style={{ marginRight: 8 }} />
        <Text style={{ flex: 1, fontSize: typography.base, color: display ? colors.text : colors.textMuted }}>
          {display || placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        )}
      </TouchableOpacity>
      {error && <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 4 }}>{error}</Text>}

      {Platform.OS === 'android' && show && (
        <DateTimePicker value={temp} mode="date" display="default" onChange={handleChange} minimumDate={minDate} maximumDate={maxDate} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: colors.surface }]}>
              <View style={[s.modalToolbar, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={{ color: colors.textMuted, fontSize: typography.base }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>{label}</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={{ color: colors.primary, fontWeight: '700', fontSize: typography.base }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker value={temp} mode="date" display="spinner" onChange={handleChange} minimumDate={minDate} maximumDate={maxDate} style={{ width: '100%', height: 200 }} />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

// ─── TagInput ─────────────────────────────────────────────────────────────────

export const TagInput: React.FC<TagInputProps> = ({
  label, tags, onAdd, onRemove, placeholder, max = 20, accentColor,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const acc = accentColor ?? colors.primary;
  const [draft, setDraft] = useState('');

  const submit = () => {
    const t = draft.trim();
    if (t && !tags.includes(t) && tags.length < max) {
      onAdd(t);
      setDraft('');
    }
  };

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text style={[s.label, { color: colors.textSecondary, fontSize: typography.sm }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          returnKeyType="done"
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          placeholderTextColor={colors.textMuted}
          style={[s.input, { flex: 1, color: colors.text, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: borderRadius.md, paddingHorizontal: 12, height: 44, fontSize: typography.base }]}
        />
        <TouchableOpacity
          onPress={submit}
          style={{ width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: acc, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onRemove(i)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${acc}18`, borderWidth: 1, borderColor: `${acc}40`, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 }}
          >
            <Text style={{ color: acc, fontSize: typography.xs, fontWeight: '600' }}>{tag}</Text>
            <Ionicons name="close" size={10} color={acc} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 4 }}>
        {tags.length}/{max} · Tap to remove
      </Text>
    </View>
  );
};

// ─── SelectField ──────────────────────────────────────────────────────────────

export const SelectField: React.FC<SelectFieldProps> = ({
  label, value, options, onChange, placeholder, error, optional,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  const handleChange = onChange ?? (() => {});

  return (
    <View style={{ marginBottom: spacing[4] }}>
      {label ? (
        <Text style={[s.label, { color: colors.textSecondary, fontSize: typography.sm }]}>
          {label}
          {optional && <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>}
        </Text>
      ) : null}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[s.inputWrap, { borderColor: error ? colors.error : colors.border, backgroundColor: colors.surface, borderRadius: borderRadius.md, height: 50 }]}
      >
        <Text style={{ flex: 1, fontSize: typography.base, color: selected ? colors.text : colors.textMuted }}>
          {selected?.label ?? placeholder ?? (label ? `Select ${label}` : 'Select…')}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 4 }}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[s.modalBox, { backgroundColor: colors.surface, maxHeight: '60%' }]}>
            <View style={[s.modalToolbar, { borderBottomColor: colors.border }]}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>{label ?? 'Select'}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { handleChange(opt.value); setOpen(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}
                >
                  <Text style={{ flex: 1, fontSize: typography.base, color: colors.text }}>{opt.label}</Text>
                  {value === opt.value && <Ionicons name="checkmark" size={18} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── PillSelector ─────────────────────────────────────────────────────────────

export const PillSelector = <T extends string>({
  label, value, options, onChange, accentColor,
}: {
  label: string;
  value?: T;
  options: Array<{ value: T; label: string; emoji?: string }>;
  onChange: (v: T) => void;
  accentColor?: string;
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const acc = accentColor ?? colors.primary;

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <Text style={[s.label, { color: colors.textSecondary, fontSize: typography.sm }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                borderWidth: 1.5,
                borderColor: active ? acc : colors.border,
                backgroundColor: active ? `${acc}18` : colors.surface,
                borderRadius: 99, paddingHorizontal: 14, paddingVertical: 8,
              }}
            >
              {opt.emoji && <Text>{opt.emoji}</Text>}
              <Text style={{ color: active ? acc : colors.textMuted, fontWeight: '600', fontSize: typography.sm }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── SwitchField ──────────────────────────────────────────────────────────────

export const SwitchField: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accentColor?: string;
}> = ({ label, value, onChange, accentColor }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[3] }}>
      <Text style={{ color: colors.text, fontSize: typography.sm, flex: 1 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: accentColor ?? colors.primary }}
        thumbColor="#fff"
      />
    </View>
  );
};

// ─── SectionCard ──────────────────────────────────────────────────────────────

export const SectionCard: React.FC<{
  title: string;
  accentColor?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}> = ({ title, accentColor, onAdd, addLabel = 'Add', children, collapsible = true }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const [expanded, setExpanded] = useState(true);
  const acc = accentColor ?? colors.primary;

  return (
    <View style={{ marginBottom: spacing[4] }}>
      <TouchableOpacity
        onPress={() => collapsible && setExpanded(v => !v)}
        activeOpacity={collapsible ? 0.7 : 1}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[3] }}
      >
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onAdd && (
            <TouchableOpacity
              onPress={onAdd}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${acc}18`, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Ionicons name="add" size={14} color={acc} />
              <Text style={{ color: acc, fontSize: typography.xs, fontWeight: '700' }}>{addLabel}</Text>
            </TouchableOpacity>
          )}
          {collapsible && (
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
};

// ─── ArrayItemCard ────────────────────────────────────────────────────────────

export const ArrayItemCard: React.FC<{
  title: string;
  subtitle?: string;
  onRemove: () => void;
  accentColor?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, onRemove, accentColor, children }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const acc = accentColor ?? colors.primary;

  return (
    <View style={[s.arrayCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg, marginBottom: spacing[3] }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing[3] }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>{title}</Text>
          {subtitle && <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 2 }}>{subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────────

export const EmptyState: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  accentColor?: string;
}> = ({ icon, title, subtitle, onAction, actionLabel, accentColor }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing, borderRadius } = theme;
  const acc = accentColor ?? colors.primary;

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing[8], gap: spacing[3] }}>
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: `${acc}18`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={28} color={acc} />
      </View>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>{title}</Text>
      {subtitle && <Text style={{ color: colors.textMuted, fontSize: typography.sm, textAlign: 'center' }}>{subtitle}</Text>}
      {onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{ backgroundColor: acc, borderRadius: borderRadius.md, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm }}>{actionLabel ?? 'Add'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12 },
  input: { flex: 1 },
  arrayCard: { borderWidth: 1, padding: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 32, overflow: 'hidden' },
  modalToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  appBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    paddingHorizontal: 24,
  },
});