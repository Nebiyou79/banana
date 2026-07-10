// mobile/src/components/freelanceTenders/FreelanceTenderForm/Step1Basics.tsx
// FIXES: F-02, F-06
// UPDATED: useTheme() instead of useThemeStore(), all colors from theme

import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useTheme } from '../../../hooks/useTheme';
import { MIN_TOUCH_TARGET } from '../../../theme/tokens';
import type { FreelanceTenderFormData } from '../../../types/freelanceTender';

export interface Step1BasicsProps {
  data: Pick<FreelanceTenderFormData, 'title' | 'briefDescription' | 'procurementCategory' | 'maxApplications' | 'deadline'>;
  onChange: (patch: Partial<FreelanceTenderFormData>) => void;
  errors: Record<string, string>;
  categories: Record<string, string[]>;
}

// ─── Category options ─────────────────────────────────────────────────────────

function buildCategoryOptions(cats: Record<string, string[]>): Array<{ label: string; value: string }> {
  const opts: Array<{ label: string; value: string }> = [];
  Object.entries(cats).forEach(([parent, subs]) => {
    subs.forEach((sub) => {
      opts.push({ label: `${parent.replace(/_/g, ' ')} › ${sub}`, value: sub });
    });
  });
  return opts;
}

// ─── Inline DatePickerField ───────────────────────────────────────────────────

interface DatePickerFieldProps {
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  mode?: 'date' | 'datetime';
  minimumDate?: Date;
  error?: boolean;
}

const DatePickerField: React.FC<DatePickerFieldProps> = ({
  value,
  onChange,
  placeholder,
  mode = 'datetime',
  minimumDate,
  error,
}) => {
  const { colors: c } = useTheme();
  const [open, setOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const display = value
    ? (() => {
        const d = new Date(value);
        if (isNaN(d.getTime())) return value;
        return d.toLocaleString(undefined, {
          year: 'numeric', month: 'short', day: '2-digit',
          hour: '2-digit', minute: '2-digit',
        });
      })()
    : '';

  const openPicker = () => {
    setPickerMode('date');
    setTempDate(value ? new Date(value) : new Date());
    setOpen(true);
  };

  const handleChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (!selected) return;
      if (mode === 'datetime' && pickerMode === 'date') {
        setTempDate(selected);
        setPickerMode('time');
        setTimeout(() => setOpen(true), 100);
        return;
      }
      const final =
        mode === 'datetime' && tempDate
          ? new Date(
              tempDate.getFullYear(),
              tempDate.getMonth(),
              tempDate.getDate(),
              selected.getHours(),
              selected.getMinutes(),
            )
          : selected;
      onChange(final.toISOString());
    } else {
      if (selected) {
        setTempDate(selected);
        onChange(selected.toISOString());
      }
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={openPicker}
        style={[
          styles.dateField,
          {
            backgroundColor: c.inputBg,
            borderColor: error ? c.danger : c.border,
          },
        ]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Pick ${mode === 'datetime' ? 'date and time' : 'date'}`}
      >
        <Calendar size={16} color={c.textMuted} strokeWidth={2.2} />
        <Text
          style={{
            flex: 1,
            color: display ? c.text : c.textMuted,
            fontSize: 15,
          }}
        >
          {display || placeholder || 'Select date…'}
        </Text>
      </TouchableOpacity>
      {open && (
        <DateTimePicker
          value={tempDate ?? new Date()}
          mode={Platform.OS === 'ios' ? (mode === 'datetime' ? 'datetime' : 'date') : pickerMode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minimumDate}
        />
      )}
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

const Step1Basics: React.FC<Step1BasicsProps> = ({ data, onChange, errors, categories }) => {
  const { colors: c, radius, spacing, type } = useTheme();

  const inputStyle = [
    styles.input,
    {
      backgroundColor: c.inputBg,
      borderColor: c.border,
      color: c.text,
      borderRadius: radius.md,
    },
  ];

  const labelStyle = [styles.label, { color: c.text }];
  const errorStyle = [styles.error, { color: c.danger }];
  const hintStyle = [styles.hint, { color: c.textMuted }];

  const categoryOptions = buildCategoryOptions(categories);
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);

  return (
    <View style={styles.container}>
      {/* Title */}
      <View style={styles.field}>
        <Text style={labelStyle}>
          Job Title <Text style={errorStyle}>*</Text>
        </Text>
        <TextInput
          style={inputStyle}
          value={data.title}
          onChangeText={(v) => onChange({ title: v })}
          placeholder="e.g. React Developer for SaaS Dashboard"
          placeholderTextColor={c.textMuted}
          maxLength={200}
          returnKeyType="next"
        />
        {errors.title ? <Text style={errorStyle}>{errors.title}</Text> : null}
      </View>

      {/* Brief Description */}
      <View style={styles.field}>
        <Text style={labelStyle}>Brief Description</Text>
        <TextInput
          style={[inputStyle, styles.multiline]}
          value={data.briefDescription ?? ''}
          onChangeText={(v) => onChange({ briefDescription: v })}
          placeholder="One or two sentences summarising the project…"
          placeholderTextColor={c.textMuted}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={hintStyle}>{(data.briefDescription ?? '').length}/500 – shown on listing cards</Text>
      </View>

      {/* Category selector */}
      <View style={styles.field}>
        <Text style={labelStyle}>
          Category <Text style={errorStyle}>*</Text>
        </Text>
        <TouchableOpacity
          style={[inputStyle, styles.selector]}
          onPress={() => setShowCategoryPicker((v) => !v)}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.selectorText,
              { color: data.procurementCategory ? c.text : c.textMuted },
            ]}
            numberOfLines={1}
          >
            {data.procurementCategory
              ? categoryOptions.find((o) => o.value === data.procurementCategory)?.label ??
                data.procurementCategory
              : 'Select category…'}
          </Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>▾</Text>
        </TouchableOpacity>
        {errors.procurementCategory ? (
          <Text style={errorStyle}>{errors.procurementCategory}</Text>
        ) : null}

        {showCategoryPicker && (
          <ScrollView
            style={[
              styles.categoryList,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                height: Platform.OS === 'ios' ? 240 : undefined,
                maxHeight: 240,
              },
            ]}
            nestedScrollEnabled
          >
            {categoryOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.categoryItem,
                  data.procurementCategory === opt.value && {
                    backgroundColor: c.primaryBg,
                  },
                ]}
                onPress={() => {
                  onChange({ procurementCategory: opt.value });
                  setShowCategoryPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.categoryItemText,
                    {
                      color: data.procurementCategory === opt.value ? c.primary : c.text,
                      fontWeight: data.procurementCategory === opt.value ? '700' : '400',
                    },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Deadline */}
      <View style={styles.field}>
        <Text style={labelStyle}>
          Application Deadline <Text style={errorStyle}>*</Text>
        </Text>
        <DatePickerField
          value={data.deadline}
          onChange={(iso) => onChange({ deadline: iso })}
          placeholder="Select application deadline"
          mode="datetime"
          minimumDate={new Date(Date.now() + 86_400_000)}
          error={!!errors.deadline}
        />
        {errors.deadline ? <Text style={errorStyle}>{errors.deadline}</Text> : null}
      </View>

      {/* Max Applications */}
      <View style={styles.field}>
        <Text style={labelStyle}>Max Applications</Text>
        <TextInput
          style={inputStyle}
          value={data.maxApplications != null ? String(data.maxApplications) : ''}
          onChangeText={(v) => onChange({ maxApplications: v ? Number(v) : undefined })}
          placeholder="Unlimited"
          placeholderTextColor={c.textMuted}
          keyboardType="numeric"
          returnKeyType="done"
        />
        <Text style={hintStyle}>Leave blank for unlimited applicants</Text>
        {errors.maxApplications ? <Text style={errorStyle}>{errors.maxApplications}</Text> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 4 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: MIN_TOUCH_TARGET + 6,
  },
  multiline: {
    minHeight: 90,
    paddingTop: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET + 6,
  },
  selectorText: { flex: 1, fontSize: 15 },
  categoryList: {
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 4,
  },
  categoryItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  categoryItemText: { fontSize: 14 },
  error: { fontSize: 12, marginTop: 4 },
  hint: { fontSize: 11, marginTop: 4 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: MIN_TOUCH_TARGET + 6,
    borderWidth: 1,
    borderRadius: 10,
  },
});

export default Step1Basics;