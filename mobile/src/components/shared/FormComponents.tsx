// FormComponents.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Modal, Platform, Animated, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';

interface InputFieldProps {
  label: string;
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
  editable?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder, multiline = false,
  numberOfLines = 4, keyboardType = 'default', autoCapitalize = 'sentences',
  error, optional, maxLength, style, editable = true, leftIcon,
}) => {
  const { colors, radius, type, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[{ opacity: fadeAnim, marginBottom: spacing.lg }, style]}>
      <Text style={[s.label, type.caption, { color: colors.textSecondary }]}>
        {label}
        {optional && <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>
      <View style={[s.inputWrap, {
        borderColor: error ? colors.error : focused ? colors.accent : colors.borderPrimary,
        backgroundColor: colors.bgCard,
        borderRadius: radius.md,
      }]}>
        {leftIcon && <Ionicons name={leftIcon} size={16} color={colors.textMuted} style={{ marginRight: 8 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[s.input, type.body, { color: colors.textPrimary, minHeight: multiline ? numberOfLines * 24 : 44, flex: 1 }]}
        />
      </View>
      {error && <Text style={[type.caption, { color: colors.error, marginTop: spacing.xs }]}>{error}</Text>}
    </Animated.View>
  );
};

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

const formatDisplay = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const { colors, radius, type, spacing } = useTheme();
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
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[s.label, type.caption, { color: colors.textSecondary }]}>
        {label}
        {optional && <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => { setTemp(toDate(value)); setShow(true); }}
        activeOpacity={0.8}
        style={[s.inputWrap, {
          borderColor: error ? colors.error : colors.borderPrimary,
          backgroundColor: colors.bgCard,
          borderRadius: radius.md,
          height: 50,
        }]}
      >
        <Ionicons name="calendar-outline" size={18} color={display ? colors.accent : colors.textMuted} style={{ marginRight: 8 }} />
        <Text style={[type.body, { flex: 1, color: display ? colors.textPrimary : colors.textMuted }]}>{display || placeholder}</Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        )}
      </TouchableOpacity>
      {error && <Text style={[type.caption, { color: colors.error, marginTop: spacing.xs }]}>{error}</Text>}

      {Platform.OS === 'android' && show && (
        <DateTimePicker value={temp} mode="date" display="default" onChange={handleChange} minimumDate={minDate} maximumDate={maxDate} />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
              <View style={[s.modalToolbar, { borderBottomColor: colors.borderPrimary }]}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={[type.body, { color: colors.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[type.body, { fontWeight: '700', color: colors.textPrimary }]}>{label}</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={[type.body, { fontWeight: '700', color: colors.accent }]}>Done</Text>
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

interface TagInputProps {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  max?: number;
  accentColor?: string;
}

export const TagInput: React.FC<TagInputProps> = ({ label, tags, onAdd, onRemove, placeholder, max = 20, accentColor }) => {
  const { colors, radius, type, spacing } = useTheme();
  const acc = accentColor ?? colors.accent;
  const [draft, setDraft] = useState('');

  const submit = () => {
    const t = draft.trim();
    if (t && !tags.includes(t) && tags.length < max) {
      onAdd(t);
      setDraft('');
    }
  };

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[s.label, type.caption, { color: colors.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          returnKeyType="done"
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          placeholderTextColor={colors.textMuted}
          style={[type.body, { flex: 1, color: colors.textPrimary, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: colors.borderPrimary, borderRadius: radius.md, paddingHorizontal: 12, height: 44 }]}
        />
        <TouchableOpacity
          onPress={submit}
          style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: acc, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onRemove(i)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.accent + '40', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 }}
          >
            <Text style={[type.caption, { color: acc, fontWeight: '600' }]}>{tag}</Text>
            <Ionicons name="close" size={10} color={acc} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[type.caption, { color: colors.textMuted, marginTop: spacing.xs }]}>{tags.length}/{max} · Tap to remove</Text>
    </View>
  );
};

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({ label, value, options, onChange, placeholder, error, optional }) => {
  const { colors, radius, type, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[s.label, type.caption, { color: colors.textSecondary }]}>
        {label}
        {optional && <Text style={{ color: colors.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[s.inputWrap, { borderColor: error ? colors.error : colors.borderPrimary, backgroundColor: colors.bgCard, borderRadius: radius.md, height: 50 }]}
      >
        <Text style={[type.body, { flex: 1, color: selected ? colors.textPrimary : colors.textMuted }]}>
          {selected?.label ?? placeholder ?? `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {error && <Text style={[type.caption, { color: colors.error, marginTop: spacing.xs }]}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[s.modalBox, { backgroundColor: colors.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '60%' }]}>
            <View style={[s.modalToolbar, { borderBottomColor: colors.borderPrimary }]}>
              <Text style={[type.body, { fontWeight: '700', color: colors.textPrimary }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderPrimary }}
                >
                  <Text style={[type.body, { flex: 1, color: colors.textPrimary }]}>{opt.label}</Text>
                  {value === opt.value && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export const PillSelector = <T extends string>({
  label, value, options, onChange, accentColor,
}: {
  label: string;
  value?: T;
  options: Array<{ value: T; label: string; emoji?: string }>;
  onChange: (v: T) => void;
  accentColor?: string;
}) => {
  const { colors, radius, type, spacing } = useTheme();
  const acc = accentColor ?? colors.accent;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[s.label, type.caption, { color: colors.textSecondary }]}>{label}</Text>
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
                borderColor: active ? acc : colors.borderPrimary,
                backgroundColor: active ? colors.accentBg : colors.bgCard,
                borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8,
              }}
            >
              {opt.emoji && <Text>{opt.emoji}</Text>}
              <Text style={[type.caption, { color: active ? acc : colors.textMuted, fontWeight: '600' }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const SwitchField: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accentColor?: string;
}> = ({ label, value, onChange, accentColor }) => {
  const { colors, type, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
      <Text style={[type.bodySm, { color: colors.textPrimary, flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.borderPrimary, true: accentColor ?? colors.accent }}
        thumbColor="#fff"
      />
    </View>
  );
};

export const SectionCard: React.FC<{
  title: string;
  accentColor?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}> = ({ title, accentColor, onAdd, addLabel = 'Add', children, collapsible = true }) => {
  const { colors, radius, type, spacing } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const acc = accentColor ?? colors.accent;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <TouchableOpacity
        onPress={() => collapsible && setExpanded(v => !v)}
        activeOpacity={collapsible ? 0.7 : 1}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}
      >
        <Text style={[type.bodySm, { fontWeight: '700', color: colors.textPrimary }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onAdd && (
            <TouchableOpacity
              onPress={onAdd}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.accentBg, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Ionicons name="add" size={14} color={acc} />
              <Text style={[type.caption, { color: acc, fontWeight: '700' }]}>{addLabel}</Text>
            </TouchableOpacity>
          )}
          {collapsible && <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />}
        </View>
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
};

export const ArrayItemCard: React.FC<{
  title: string;
  subtitle?: string;
  onRemove: () => void;
  accentColor?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, onRemove, accentColor, children }) => {
  const { colors, radius, type, spacing } = useTheme();
  const acc = accentColor ?? colors.accent;

  return (
    <View style={[s.arrayCard, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.lg, marginBottom: spacing.md }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodySm, { color: colors.textPrimary, fontWeight: '700' }]}>{title}</Text>
          {subtitle && <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={onRemove} style={{ padding: 4 }}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
};

export const EmptyState: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  accentColor?: string;
}> = ({ icon, title, subtitle, onAction, actionLabel, accentColor }) => {
  const { colors, radius, type, spacing } = useTheme();
  const acc = accentColor ?? colors.accent;

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.section, gap: spacing.md }}>
      <View style={{ width: 60, height: 60, borderRadius: radius.full, backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={28} color={acc} />
      </View>
      <Text style={[type.bodySm, { fontWeight: '700', color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center' }]}>{subtitle}</Text>}
      {onAction && (
        <TouchableOpacity onPress={onAction} style={{ backgroundColor: acc, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 10, marginTop: spacing.xs }}>
          <Text style={[type.bodySm, { color: '#fff', fontWeight: '700' }]}>{actionLabel ?? 'Add'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12 },
  input: { textAlignVertical: 'top' },
  arrayCard: { borderWidth: 1, padding: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { paddingBottom: 32, overflow: 'hidden' },
  modalToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
});