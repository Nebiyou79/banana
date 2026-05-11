// src/components/shared/FormComponents.tsx
// ─── Shared form atoms ─────────────────────────────────────────────────────────
// ALL colors/spacing/radius from useTheme() — zero hardcoded hex.
// withAlpha() replaces all `color + 'XX'` patterns.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, Modal, Platform, Animated, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

// ─── InputField ────────────────────────────────────────────────────────────────

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
  const { colors: c, radius, type, spacing } = useTheme();
  const [focused, setFocused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
  }, []);

  const borderColor = error ? c.danger : focused ? c.inputBorderFocus : c.inputBorder;
  const bgColor = error ? withAlpha(c.danger, 0.04) : !editable ? withAlpha(c.textDisabled, 0.08) : c.inputBg;

  return (
    <Animated.View style={[{ opacity: fadeAnim, marginBottom: spacing.lg }, style]}>
      <Text style={[s.label, type.caption, { color: c.textSecondary }]}>
        {label}
        {optional && <Text style={{ color: c.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>
      <View style={[s.inputWrap, {
        borderColor,
        backgroundColor: bgColor,
        borderRadius: radius.md,
        minHeight: multiline ? numberOfLines * 24 + 24 : 48,
        ...(multiline ? { maxHeight: 200 } : {}),
      }]}>
        {leftIcon && (
          <Ionicons name={leftIcon} size={16} color={focused ? c.primary : c.textMuted} style={{ marginRight: 8 }} />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          placeholderTextColor={c.inputPlaceholder}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            s.input,
            type.body,
            {
              color: c.text,
              flex: 1,
              ...(multiline ? { textAlignVertical: 'top', paddingVertical: spacing.sm } : {}),
            },
          ]}
        />
      </View>
      {error && (
        <Text style={[type.caption, { color: c.danger, marginTop: spacing.xs }]}>{error}</Text>
      )}
    </Animated.View>
  );
};

// ─── DateField ─────────────────────────────────────────────────────────────────

const _formatDisplay = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const _toDate = (iso?: string): Date => {
  if (!iso) return new Date();
  const d = new Date(iso);
  return isNaN(d.getTime()) ? new Date() : d;
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

export const DateField: React.FC<DateFieldProps> = ({
  label, value, onChange, placeholder = 'Select date',
  minDate, maxDate, error, optional,
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const [show, setShow] = useState(false);
  const [temp, setTemp] = useState<Date>(_toDate(value));

  const handleChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'set' && selected) onChange(selected.toISOString().split('T')[0]);
    } else {
      if (selected) setTemp(selected);
    }
  };

  const handleIOSConfirm = () => {
    onChange(temp.toISOString().split('T')[0]);
    setShow(false);
  };

  const display = _formatDisplay(value);

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[s.label, type.caption, { color: c.textSecondary }]}>
        {label}
        {optional && <Text style={{ color: c.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => { setTemp(_toDate(value)); setShow(true); }}
        activeOpacity={0.8}
        style={[s.inputWrap, {
          borderColor: error ? c.danger : c.inputBorder,
          backgroundColor: c.inputBg,
          borderRadius: radius.md,
          height: 48,
        }]}
      >
        <Ionicons name="calendar-outline" size={18} color={display ? c.primary : c.textMuted} style={{ marginRight: 8 }} />
        <Text style={[type.body, { flex: 1, color: display ? c.text : c.inputPlaceholder }]}>
          {display || placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={16} color={c.textMuted} />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={14} color={c.textMuted} />
        )}
      </TouchableOpacity>
      {error && <Text style={[type.caption, { color: c.danger, marginTop: spacing.xs }]}>{error}</Text>}

      {Platform.OS === 'android' && show && (
        <DateTimePicker value={temp} mode="date" display="default" onChange={handleChange} minimumDate={minDate} maximumDate={maxDate} />
      )}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide" onRequestClose={() => setShow(false)}>
          <View style={s.modalOverlay}>
            <View style={[s.modalBox, { backgroundColor: c.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
              <View style={[s.modalToolbar, { borderBottomColor: c.border }]}>
                <TouchableOpacity onPress={() => setShow(false)}>
                  <Text style={[type.body, { color: c.textMuted }]}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[type.body, { fontWeight: '700', color: c.text }]}>{label}</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={[type.body, { fontWeight: '700', color: c.primary }]}>Done</Text>
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

// ─── TagInput ──────────────────────────────────────────────────────────────────

interface TagInputProps {
  label: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (index: number) => void;
  placeholder?: string;
  max?: number;
  accentColor?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label, tags, onAdd, onRemove, placeholder, max = 20, accentColor,
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const acc = accentColor ?? c.primary;
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
      <Text style={[s.label, type.caption, { color: c.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={submit}
          returnKeyType="done"
          placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
          placeholderTextColor={c.inputPlaceholder}
          style={[
            type.body,
            {
              flex: 1, color: c.text,
              backgroundColor: c.inputBg,
              borderWidth: 1.5, borderColor: c.inputBorder,
              borderRadius: radius.md,
              paddingHorizontal: 12, height: 44,
            },
          ]}
        />
        <TouchableOpacity
          onPress={submit}
          style={{ width: 44, height: 44, borderRadius: radius.md, backgroundColor: acc, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={22} color={c.textInverse} />
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {tags.map((tag, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onRemove(i)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 4,
              backgroundColor: withAlpha(acc, 0.12),
              borderWidth: 1, borderColor: withAlpha(acc, 0.4),
              borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5,
            }}
          >
            <Text style={[type.caption, { color: acc, fontWeight: '600' }]}>{tag}</Text>
            <Ionicons name="close" size={10} color={acc} />
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.xs }]}>
        {tags.length}/{max} · Tap tag to remove
      </Text>
    </View>
  );
};

// ─── SelectField ───────────────────────────────────────────────────────────────

interface SelectFieldProps {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label, value, options, onChange, placeholder, error, optional,
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[s.label, type.caption, { color: c.textSecondary }]}>
        {label}
        {optional && <Text style={{ color: c.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[s.inputWrap, {
          borderColor: error ? c.danger : c.inputBorder,
          backgroundColor: c.inputBg,
          borderRadius: radius.md,
          height: 48,
        }]}
      >
        <Text style={[type.body, { flex: 1, color: selected ? c.text : c.inputPlaceholder }]} numberOfLines={1}>
          {selected?.label ?? placeholder ?? `Select ${label}`}
        </Text>
        <Ionicons name="chevron-down" size={16} color={c.textMuted} />
      </TouchableOpacity>
      {error && <Text style={[type.caption, { color: c.danger, marginTop: spacing.xs }]}>{error}</Text>}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={[s.modalBox, { backgroundColor: c.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, maxHeight: '60%' }]}>
            <View style={[s.modalToolbar, { borderBottomColor: c.border }]}>
              <Text style={[type.bodySm, { fontWeight: '700', color: c.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={8}>
                <Ionicons name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {options.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { onChange(opt.value); setOpen(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}
                >
                  <Text style={[type.body, { flex: 1, color: c.text }]}>{opt.label}</Text>
                  {value === opt.value && <Ionicons name="checkmark" size={18} color={c.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// ─── PillSelector ──────────────────────────────────────────────────────────────

export const PillSelector = <T extends string>({
  label, value, options, onChange, accentColor,
}: {
  label: string;
  value?: T;
  options: Array<{ value: T; label: string; emoji?: string }>;
  onChange: (v: T) => void;
  accentColor?: string;
}) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const acc = accentColor ?? c.primary;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[s.label, type.caption, { color: c.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                borderWidth: 1.5,
                borderColor: active ? acc : c.border,
                backgroundColor: active ? withAlpha(acc, 0.12) : c.inputBg,
                borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8,
              }}
            >
              {opt.emoji && <Text style={{ fontSize: 14 }}>{opt.emoji}</Text>}
              <Text style={[type.caption, { color: active ? acc : c.textMuted, fontWeight: '600' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── SwitchField ───────────────────────────────────────────────────────────────

export const SwitchField: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  accentColor?: string;
  sublabel?: string;
}> = ({ label, value, onChange, accentColor, sublabel }) => {
  const { colors: c, type, spacing } = useTheme();

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
      <View style={{ flex: 1, marginRight: spacing.md }}>
        <Text style={[type.bodySm, { color: c.text, fontWeight: '600' }]}>{label}</Text>
        {sublabel && <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.border, true: accentColor ?? c.primary }}
        thumbColor={c.textInverse}
      />
    </View>
  );
};

// ─── SectionCard ───────────────────────────────────────────────────────────────

export const SectionCard: React.FC<{
  title: string;
  accentColor?: string;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  collapsible?: boolean;
}> = ({ title, accentColor, onAdd, addLabel = 'Add', children, collapsible = true }) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const acc = accentColor ?? c.primary;

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <TouchableOpacity
        onPress={() => collapsible && setExpanded(v => !v)}
        activeOpacity={collapsible ? 0.7 : 1}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}
      >
        <Text style={[type.bodySm, { fontWeight: '700', color: c.text }]}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onAdd && (
            <TouchableOpacity
              onPress={onAdd}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: withAlpha(acc, 0.12),
                borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 6,
              }}
            >
              <Ionicons name="add" size={14} color={acc} />
              <Text style={[type.caption, { color: acc, fontWeight: '700' }]}>{addLabel}</Text>
            </TouchableOpacity>
          )}
          {collapsible && (
            <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.textMuted} />
          )}
        </View>
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
};

// ─── ArrayItemCard ─────────────────────────────────────────────────────────────

export const ArrayItemCard: React.FC<{
  title: string;
  subtitle?: string;
  onRemove: () => void;
  accentColor?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, onRemove, accentColor, children }) => {
  const { colors: c, radius, type, spacing } = useTheme();

  return (
    <View style={[s.arrayCard, {
      backgroundColor: c.bgCard,
      borderColor: c.border,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
    }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.md }}>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>{title}</Text>
          {subtitle && <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{subtitle}</Text>}
        </View>
        <TouchableOpacity onPress={onRemove} style={{ padding: 4 }} hitSlop={8}>
          <Ionicons name="trash-outline" size={18} color={c.danger} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
};

// ─── FormEmptyState ────────────────────────────────────────────────────────────
// Named FormEmptyState to avoid conflicts with the UI EmptyState component.

export const FormEmptyState: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onAction?: () => void;
  actionLabel?: string;
  accentColor?: string;
}> = ({ icon, title, subtitle, onAction, actionLabel, accentColor }) => {
  const { colors: c, radius, type, spacing } = useTheme();
  const acc = accentColor ?? c.primary;

  return (
    <View style={{ alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md }}>
      <View style={{
        width: 60, height: 60,
        borderRadius: radius.full,
        backgroundColor: withAlpha(acc, 0.12),
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={28} color={acc} />
      </View>
      <Text style={[type.bodySm, { fontWeight: '700', color: c.text, textAlign: 'center' }]}>{title}</Text>
      {subtitle && (
        <Text style={[type.caption, { color: c.textMuted, textAlign: 'center' }]}>{subtitle}</Text>
      )}
      {onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{ backgroundColor: acc, borderRadius: radius.md, paddingHorizontal: 20, paddingVertical: 10, marginTop: spacing.xs }}
        >
          <Text style={[type.bodySm, { color: c.textInverse, fontWeight: '700' }]}>{actionLabel ?? 'Add'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Shared styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  label:        { fontWeight: '600', marginBottom: 6 },
  inputWrap:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 12 },
  input:        { textAlignVertical: 'top' },
  arrayCard:    { borderWidth: 1, padding: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox:     { paddingBottom: 32, overflow: 'hidden' },
  modalToolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
});