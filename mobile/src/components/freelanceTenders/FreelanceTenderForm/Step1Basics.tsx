// mobile/src/components/freelanceTenders/FreelanceTenderForm/Step1Basics.tsx

import React, { memo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeStore } from '../../../store/themeStore';
import type { FreelanceTenderFormData } from '../../../types/freelanceTender';

export interface Step1BasicsProps {
  data: Pick<FreelanceTenderFormData, 'title' | 'briefDescription' | 'procurementCategory' | 'maxApplications' | 'deadline'>;
  onChange: (patch: Partial<FreelanceTenderFormData>) => void;
  errors: Record<string, string>;
  categories: Record<string, string[]>;
}

// Flat list of all subcategories prefixed by their parent for display
function buildCategoryOptions(cats: Record<string, string[]>): Array<{ label: string; value: string }> {
  const opts: Array<{ label: string; value: string }> = [];
  Object.entries(cats).forEach(([parent, subs]) => {
    subs.forEach((sub) => {
      opts.push({ label: `${parent.replace(/_/g, ' ')} › ${sub}`, value: sub });
    });
  });
  return opts;
}

// Minimum deadline: 1 day from now
function minDeadlineISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 16);
}

const Step1Basics: React.FC<Step1BasicsProps> = memo(({ data, onChange, errors, categories }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;

  const inputStyle = [
    styles.input,
    {
      backgroundColor: c.surface ?? c.card,
      borderColor: c.border ?? c.textMuted + '44',
      color: c.text,
    },
  ];

  const labelStyle = [styles.label, { color: c.text }];
  const errorStyle = [styles.error, { color: c.error ?? '#EF4444' }];
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
          <Text style={{ color: c.textMuted }}>▾</Text>
        </TouchableOpacity>
        {errors.procurementCategory ? (
          <Text style={errorStyle}>{errors.procurementCategory}</Text>
        ) : null}

        {showCategoryPicker && (
          <ScrollView
            style={[
              styles.categoryList,
              { backgroundColor: c.surface ?? c.card, borderColor: c.border ?? c.textMuted + '44' },
            ]}
            nestedScrollEnabled
          >
            {categoryOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.categoryItem,
                  data.procurementCategory === opt.value && {
                    backgroundColor: c.primary + '18',
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
                      color:
                        data.procurementCategory === opt.value ? c.primary : c.text,
                      fontWeight:
                        data.procurementCategory === opt.value ? '700' : '400',
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
        {/* React Native doesn't have a native datetime-local input.
            We use a plain TextInput expecting ISO format; in production
            integrate with @react-native-community/datetimepicker. */}
        <TextInput
          style={inputStyle}
          value={data.deadline ? data.deadline.slice(0, 16) : ''}
          onChangeText={(v) => onChange({ deadline: v })}
          placeholder="YYYY-MM-DDTHH:MM"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          returnKeyType="next"
        />
        <Text style={hintStyle}>Format: YYYY-MM-DDTHH:MM (at least 1 day from now)</Text>
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
});

Step1Basics.displayName = 'Step1Basics';

const styles = StyleSheet.create({
  container: { gap: 4 },
  field: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 50,
  },
  multiline: {
    minHeight: 90,
    paddingTop: 12,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  selectorText: { flex: 1, fontSize: 15 },
  categoryList: {
    maxHeight: 240,
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
});

export default Step1Basics;