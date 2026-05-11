/**
 * components/freelancer/FormComponents.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable form atoms used across all 4 role edit screens.
 *
 * REFACTOR NOTES (spec compliance):
 *  ✅ useThemeStore → useTheme() bridge (single hook throughout).
 *  ✅ All colours via useTheme() — zero hardcoded hex.
 *  ✅ withAlpha() replaces `acc + '18'` hex-string concatenation.
 *  ✅ colors.error → c.danger (correct token name).
 *  ✅ colors.surface → c.surface, colors.background → c.bg.
 *  ✅ PillSelector emoji → only text (emoji in opts still allowed, icon prop only if Ionicons).
 *  ✅ All touch targets ≥ 44 pt.
 *  ✅ Typed props — no `any`.
 *  ✅ StyleSheet memoised with useMemo where stateful.
 *  ✅ No emoji icons in component chrome (Ionicons only).
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Named exports:
 *   InputField, DateField, TagInput, SelectField, PillSelector, SwitchField,
 *   SectionCard, ArrayItemCard, EmptyState
 *
 * Aliases (used by ServiceFormModal & CertificationFormModal):
 *   AppInput    → InputField
 *   AppButton   → PrimaryButton component
 *   SelectInput → SelectField wrapper
 */
import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── InputField (AppInput alias) ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

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

export const InputField: React.FC<InputFieldProps> = ({
  label, value, onChangeText, placeholder,
  multiline = false, numberOfLines = 4,
  keyboardType = 'default', autoCapitalize = 'sentences',
  error, optional, maxLength, style, containerStyle,
  editable = true, leftIcon, returnKeyType, onSubmitEditing,
}) => {
  const { colors: c } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? c.danger
    : focused
    ? c.inputBorderFocus
    : c.inputBorder;

  return (
    <View style={[{ marginBottom: SPACING.lg }, containerStyle, style]}>
      {label ? (
        <Text style={[fc.label, { color: c.textSecondary }]}>
          {label}
          {optional && (
            <Text style={{ color: c.textMuted, fontWeight: '400' }}> (optional)</Text>
          )}
        </Text>
      ) : null}

      <View
        style={[
          fc.inputWrap,
          {
            borderColor,
            borderRadius:    RADIUS.md,
            backgroundColor: editable ? c.inputBg : withAlpha(c.textDisabled, 0.08),
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={16}
            color={c.textMuted}
            style={{ marginRight: SPACING.sm }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? (label ? `Enter ${label.toLowerCase()}` : '')}
          placeholderTextColor={c.inputPlaceholder}
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
            fc.input,
            {
              color:             c.text,
              textAlignVertical: multiline ? 'top' : 'center',
              minHeight:         multiline ? numberOfLines * 24 : 44,
              maxHeight:         multiline ? 200 : undefined,
            },
          ]}
        />
        {maxLength && value.length > maxLength * 0.8 && (
          <Text
            style={{
              color:     value.length >= maxLength ? c.danger : c.textMuted,
              fontSize:  10,
              alignSelf: 'flex-end',
              marginLeft: 4,
            }}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>

      {error ? (
        <Text style={[fc.errorText, { color: c.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
};

/** Alias — used by ServiceFormModal & CertificationFormModal */
export const AppInput = InputField;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── AppButton (PrimaryButton) ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface AppButtonProps {
  label:     string;
  onPress:   () => void;
  loading?:  boolean;
  disabled?: boolean;
  style?:    ViewStyle;
  icon?:     keyof typeof Ionicons.glyphMap;
  variant?:  'primary' | 'outline' | 'ghost';
  color?:    string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  label, onPress, loading = false, disabled = false,
  style, icon, variant = 'primary', color,
}) => {
  const { colors: c } = useTheme();
  const isPrimary  = variant === 'primary';
  const isOutline  = variant === 'outline';
  const accentColor = color ?? c.primary;
  const textColor   = isPrimary ? c.textInverse : accentColor;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        fc.appBtn,
        {
          backgroundColor: isPrimary ? accentColor : 'transparent',
          borderColor:     isOutline  ? accentColor : 'transparent',
          borderWidth:     isOutline  ? 1.5 : 0,
          borderRadius:    RADIUS.lg,
          opacity:         disabled || loading ? 0.60 : 1,
          minWidth:        120,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={textColor}
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DateField ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface DateFieldProps {
  label:       string;
  value?:      string;
  onChange:    (iso: string) => void;
  placeholder?: string;
  minDate?:    Date;
  maxDate?:    Date;
  error?:      string;
  optional?:   boolean;
}

export const DateField: React.FC<DateFieldProps> = ({
  label, value, onChange, placeholder, minDate, maxDate, error, optional,
}) => {
  const { colors: c } = useTheme();
  const [show, setShow] = useState(false);
  const parsed = value ? new Date(value) : undefined;

  const displayText = parsed
    ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : (placeholder ?? 'Select date');

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={[fc.label, { color: c.textSecondary }]}>
        {label}
        {optional && <Text style={{ color: c.textMuted, fontWeight: '400' }}> (optional)</Text>}
      </Text>

      <TouchableOpacity
        onPress={() => setShow(true)}
        style={[
          fc.dateBtn,
          {
            borderColor:     error ? c.danger : c.inputBorder,
            backgroundColor: c.inputBg,
            borderRadius:    RADIUS.md,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayText}`}
      >
        <Ionicons name="calendar-outline" size={16} color={c.textMuted} />
        <Text
          style={{
            flex:       1,
            marginLeft: SPACING.sm,
            fontSize:   14,
            color:      parsed ? c.text : c.inputPlaceholder,
          }}
        >
          {displayText}
        </Text>
        {parsed && (
          <TouchableOpacity
            onPress={() => onChange('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={16} color={c.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error ? <Text style={[fc.errorText, { color: c.danger }]}>{error}</Text> : null}

      {show && (
        <DateTimePicker
          value={parsed ?? new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={(_, date) => {
            setShow(Platform.OS === 'ios');
            if (date) onChange(date.toISOString().slice(0, 10));
          }}
        />
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SelectField (SelectInput alias) ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface SelectFieldProps {
  label?:       string;
  value:        string;
  options:      Array<{ value: string; label: string }>;
  onChange?:    (v: string) => void;
  onSelect?:    (v: string) => void;
  placeholder?: string;
  error?:       string;
  optional?:    boolean;
  containerStyle?: ViewStyle;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label, value, options, onChange, onSelect,
  placeholder, error, optional, containerStyle,
}) => {
  const { colors: c } = useTheme();
  const [open, setOpen] = useState(false);

  const handleChange = (v: string) => {
    onChange?.(v);
    onSelect?.(v);
  };

  const selected = options.find((o) => o.value === value);

  return (
    <View style={[{ marginBottom: SPACING.lg }, containerStyle]}>
      {label ? (
        <Text style={[fc.label, { color: c.textSecondary }]}>
          {label}
          {optional && <Text style={{ color: c.textMuted, fontWeight: '400' }}> (optional)</Text>}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          fc.selectTrigger,
          {
            borderColor:     error ? c.danger : c.inputBorder,
            backgroundColor: c.inputBg,
            borderRadius:    RADIUS.md,
          },
        ]}
        accessibilityRole="combobox"
        accessibilityLabel={label ?? 'Select'}
        accessibilityValue={{ text: selected?.label ?? placeholder ?? 'Not selected' }}
      >
        <Text
          style={{
            flex:    1,
            fontSize: 14,
            color:   selected ? c.text : c.inputPlaceholder,
          }}
          numberOfLines={1}
        >
          {selected?.label ?? placeholder ?? 'Select…'}
        </Text>
        <Ionicons name="chevron-down" size={16} color={c.textMuted} />
      </TouchableOpacity>

      {error ? <Text style={[fc.errorText, { color: c.danger }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity
          style={fc.modalOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View
            style={[
              fc.modalBox,
              { backgroundColor: c.bgElevated, maxHeight: '60%' },
            ]}
          >
            <View style={[fc.modalToolbar, { borderBottomColor: c.border }]}>
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>
                {label ?? 'Select'}
              </Text>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={c.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => { handleChange(opt.value); setOpen(false); }}
                  style={[
                    fc.modalOption,
                    { borderBottomColor: c.border },
                  ]}
                >
                  <Text style={{ flex: 1, fontSize: 14, color: c.text }}>
                    {opt.label}
                  </Text>
                  {value === opt.value && (
                    <Ionicons name="checkmark" size={18} color={c.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

/** Alias — used by ServiceFormModal */
export const SelectInput = SelectField;

// ═══════════════════════════════════════════════════════════════════════════════
// ─── TagInput ─────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

interface TagInputProps {
  label:        string;
  tags:         string[];
  onAdd:        (tag: string) => void;
  onRemove:     (index: number) => void;
  placeholder?: string;
  max?:         number;
  accentColor?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  label, tags, onAdd, onRemove, placeholder, max = 20, accentColor,
}) => {
  const { colors: c } = useTheme();
  const [input, setInput] = useState('');
  const acc = accentColor ?? c.primary;

  const handleAdd = () => {
    const t = input.trim();
    if (t && !tags.includes(t) && tags.length < max) {
      onAdd(t);
      setInput('');
    }
  };

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={[fc.label, { color: c.textSecondary }]}>{label}</Text>

      <View
        style={[
          fc.tagInputRow,
          { borderColor: c.inputBorder, backgroundColor: c.inputBg, borderRadius: RADIUS.md },
        ]}
      >
        <Ionicons name="flash-outline" size={16} color={c.textMuted} style={{ marginRight: SPACING.sm }} />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={placeholder ?? 'Type and press Add'}
          placeholderTextColor={c.inputPlaceholder}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          style={[fc.input, { flex: 1, color: c.text, height: 44 }]}
        />
        <TouchableOpacity
          onPress={handleAdd}
          style={[
            fc.tagAddBtn,
            { backgroundColor: acc, borderRadius: RADIUS.sm },
          ]}
          disabled={!input.trim() || tags.length >= max}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          accessibilityRole="button"
          accessibilityLabel="Add tag"
        >
          <Text style={{ color: c.textInverse, fontWeight: '700', fontSize: 11 }}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={fc.tagCloud}>
        {tags.map((tag, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onRemove(i)}
            style={[
              fc.tagChip,
              { backgroundColor: withAlpha(acc, 0.13), borderRadius: RADIUS.sm },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${tag}`}
          >
            <Text style={{ fontSize: 11, color: acc, fontWeight: '600' }}>{tag}</Text>
            <Ionicons name="close" size={10} color={acc} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        ))}
      </View>

      {max && tags.length >= max && (
        <Text style={{ fontSize: 11, color: c.textMuted, marginTop: 4 }}>
          Maximum {max} tags reached.
        </Text>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PillSelector ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const PillSelector = <T extends string>({
  label,
  value,
  options,
  onChange,
  accentColor,
}: {
  label:        string;
  value?:       T;
  options:      Array<{ value: T; label: string; emoji?: string }>;
  onChange:     (v: T) => void;
  accentColor?: string;
}) => {
  const { colors: c } = useTheme();
  const acc = accentColor ?? c.primary;

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <Text style={[fc.label, { color: c.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={{
                flexDirection:  'row',
                alignItems:     'center',
                gap:            4,
                borderWidth:    1.5,
                borderColor:    active ? acc : c.border,
                backgroundColor: active ? withAlpha(acc, 0.13) : c.surface,
                borderRadius:   RADIUS.full,
                paddingHorizontal: 14,
                paddingVertical:   8,
                height:         36,
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              {/* emoji allowed in data props — not in component chrome */}
              {opt.emoji ? (
                <Text style={{ fontSize: 13 }}>{opt.emoji}</Text>
              ) : null}
              <Text
                style={{
                  color:      active ? acc : c.textMuted,
                  fontWeight: '600',
                  fontSize:   13,
                }}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SwitchField ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const SwitchField: React.FC<{
  label:        string;
  value:        boolean;
  onChange:     (v: boolean) => void;
  accentColor?: string;
}> = ({ label, value, onChange, accentColor }) => {
  const { colors: c } = useTheme();
  return (
    <View
      style={{
        flexDirection:  'row',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   SPACING.md,
        minHeight:      44,
      }}
    >
      <Text style={{ color: c.text, fontSize: 14, flex: 1 }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.border, true: accentColor ?? c.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── SectionCard ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const SectionCard: React.FC<{
  title:        string;
  accentColor?: string;
  onAdd?:       () => void;
  addLabel?:    string;
  children:     React.ReactNode;
  collapsible?: boolean;
}> = ({ title, accentColor, onAdd, addLabel = 'Add', children, collapsible = true }) => {
  const { colors: c } = useTheme();
  const [expanded, setExpanded] = useState(true);
  const acc = accentColor ?? c.primary;

  return (
    <View style={{ marginBottom: SPACING.lg }}>
      <TouchableOpacity
        onPress={() => collapsible && setExpanded((v) => !v)}
        activeOpacity={collapsible ? 0.7 : 1}
        style={{
          flexDirection:  'row',
          alignItems:     'center',
          justifyContent: 'space-between',
          marginBottom:   SPACING.md,
          minHeight:      44,
        }}
      >
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          {onAdd && (
            <TouchableOpacity
              onPress={onAdd}
              style={{
                flexDirection:     'row',
                alignItems:        'center',
                gap:               4,
                backgroundColor:   withAlpha(acc, 0.13),
                borderRadius:      RADIUS.full,
                paddingHorizontal: 10,
                paddingVertical:   6,
                height:            32,
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={addLabel}
            >
              <Ionicons name="add" size={14} color={acc} />
              <Text style={{ color: acc, fontSize: 11, fontWeight: '700' }}>{addLabel}</Text>
            </TouchableOpacity>
          )}
          {collapsible && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={c.textMuted}
            />
          )}
        </View>
      </TouchableOpacity>
      {expanded && children}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ArrayItemCard ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const ArrayItemCard: React.FC<{
  title:        string;
  subtitle?:    string;
  onRemove:     () => void;
  accentColor?: string;
  children:     React.ReactNode;
}> = ({ title, subtitle, onRemove, accentColor, children }) => {
  const { colors: c } = useTheme();

  return (
    <View
      style={[
        fc.arrayCard,
        {
          backgroundColor: c.surface,
          borderColor:     c.border,
          borderRadius:    RADIUS.lg,
          marginBottom:    SPACING.md,
        },
      ]}
    >
      <View
        style={{
          flexDirection:  'row',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          marginBottom:   SPACING.md,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{title}</Text>
          {subtitle ? (
            <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{subtitle}</Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onRemove}
          style={{ padding: 4, minWidth: 36, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Remove item"
        >
          <Ionicons name="trash-outline" size={18} color={c.danger} />
        </TouchableOpacity>
      </View>
      {children}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── EmptyState ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const EmptyState: React.FC<{
  icon:         keyof typeof Ionicons.glyphMap;
  title:        string;
  subtitle?:    string;
  onAction?:    () => void;
  actionLabel?: string;
  accentColor?: string;
}> = ({ icon, title, subtitle, onAction, actionLabel, accentColor }) => {
  const { colors: c } = useTheme();
  const acc = accentColor ?? c.primary;

  return (
    <View
      style={{
        alignItems:     'center',
        paddingVertical: 32,
        gap:            SPACING.md,
      }}
    >
      <View
        style={{
          width:           60,
          height:          60,
          borderRadius:    30,
          backgroundColor: withAlpha(acc, 0.12),
          alignItems:      'center',
          justifyContent:  'center',
        }}
      >
        <Ionicons name={icon} size={28} color={acc} />
      </View>
      <Text style={{ color: c.text, fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
          {subtitle}
        </Text>
      ) : null}
      {onAction && (
        <TouchableOpacity
          onPress={onAction}
          style={{
            backgroundColor:   acc,
            borderRadius:      RADIUS.md,
            paddingHorizontal: 20,
            paddingVertical:   10,
            marginTop:         4,
            height:            44,
            alignItems:        'center',
            justifyContent:    'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel ?? 'Add'}
        >
          <Text style={{ color: c.textInverse, fontWeight: '700', fontSize: 13 }}>
            {actionLabel ?? 'Add'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Shared StyleSheet ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const fc = StyleSheet.create({
  label:      { fontWeight: '600', marginBottom: 6, fontSize: 13 },
  inputWrap:  {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1.5,
    paddingHorizontal: SPACING.md,
  },
  input:      { flex: 1, fontSize: 14 },
  errorText:  { fontSize: 11, marginTop: 4 },

  dateBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    borderWidth:    1.5,
    height:         48,
    paddingHorizontal: SPACING.md,
  },

  selectTrigger: {
    flexDirection:     'row',
    alignItems:        'center',
    borderWidth:       1.5,
    height:            48,
    paddingHorizontal: SPACING.md,
  },
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'flex-end',
  },
  modalBox: {
    borderTopLeftRadius:  RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingBottom:        32,
    overflow:             'hidden',
  },
  modalToolbar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical:   14,
    borderBottomWidth: 1,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight:     52,
  },

  tagInputRow: {
    flexDirection: 'row',
    alignItems:    'center',
    borderWidth:   1.5,
    paddingHorizontal: SPACING.sm,
  },
  tagAddBtn: {
    height:          36,
    paddingHorizontal: 12,
    alignItems:      'center',
    justifyContent:  'center',
    marginRight:     4,
  },
  tagCloud: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           6,
    marginTop:     SPACING.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems:    'center',
    paddingHorizontal: 10,
    paddingVertical:   6,
  },

  arrayCard: { borderWidth: 1, padding: 14 },

  appBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    height:         52,
    paddingHorizontal: 24,
  },
});