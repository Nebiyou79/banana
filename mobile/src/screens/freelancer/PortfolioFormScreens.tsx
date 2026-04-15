/**
 * PortfolioFormScreens.tsx
 *
 * Add + Edit portfolio forms.
 * Key upgrades:
 *  - Images picked from device gallery/camera → uploaded to Cloudinary via backend
 *  - Calendar date pickers for completionDate
 *  - All fields from the backend PortfolioItem model
 *  - Validation on required fields
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import {
  usePortfolioItem,
  useAddPortfolioItem,
  useUpdatePortfolioItem,
} from '../../hooks/useFreelancer';
import { ScreenWrapper, ScreenHeader, LoadingState } from '../../components/shared/UIComponents';
import { ImagePickerGrid } from '../../components/shared/ImagePickerGrid';
import { DatePickerField } from '../../components/shared/DatePickerField';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';
import type { PortfolioFormData } from '../../types/freelancer';

type Nav  = NativeStackNavigationProp<FreelancerStackParamList>;
type EditRoute = RouteProp<FreelancerStackParamList, 'EditPortfolio'>;

const ACCENT = '#10B981';

// ─── Option constants ─────────────────────────────────────────────────────────

const CATEGORIES = [
  'Web Development', 'Mobile App', 'UI/UX Design', 'E-commerce',
  'API Development', 'DevOps', 'Data Science', 'Machine Learning',
  'Blockchain', 'Consulting', 'Other',
];

const BUDGET_TYPES = [
  { label: 'Fixed',   value: 'fixed' },
  { label: '/hr',     value: 'hourly' },
  { label: '/day',    value: 'daily' },
  { label: '/month',  value: 'monthly' },
];

const VISIBILITY_OPTS = [
  { label: '🌍 Public',  value: 'public' },
  { label: '🔒 Private', value: 'private' },
];

const EMPTY_FORM: PortfolioFormData = {
  title: '', description: '', mediaUrls: [],
  projectUrl: '', category: '', technologies: [],
  budget: undefined, budgetType: 'fixed',
  duration: '', client: '', completionDate: '',
  featured: false, visibility: 'public',
};

interface FormErrors {
  title?: string;
  description?: string;
  mediaUrls?: string;
}

// ─── Shared form ──────────────────────────────────────────────────────────────

interface FormProps {
  navigation: Nav;
  editItem?: ReturnType<typeof usePortfolioItem>['data'];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ label: string; icon: keyof typeof Ionicons.glyphMap }> = ({ label, icon }) => {
  const { theme } = useThemeStore();
  return (
    <View style={[sh.row, { borderBottomColor: theme.colors.border, marginBottom: 16, paddingBottom: 10, marginTop: 8 }]}>
      <View style={[sh.iconBox, { backgroundColor: ACCENT + '18' }]}>
        <Ionicons name={icon} size={14} color={ACCENT} />
      </View>
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: theme.typography.sm, marginLeft: 8 }}>
        {label}
      </Text>
      <View style={[sh.line, { backgroundColor: theme.colors.border }]} />
    </View>
  );
};

const InlineSelect: React.FC<{
  label: string; value: string; options: { label: string; value: string }[];
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => {
  const { theme } = useThemeStore();
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.sm, fontWeight: '600', marginBottom: 8 }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map(o => (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              sh.optBtn,
              {
                backgroundColor: value === o.value ? ACCENT : theme.colors.surface,
                borderColor:     value === o.value ? ACCENT : theme.colors.border,
              },
            ]}
          >
            <Text style={{ color: value === o.value ? '#fff' : theme.colors.text, fontSize: theme.typography.xs, fontWeight: '600' }}>
              {o.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const Field: React.FC<{
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; icon?: keyof typeof Ionicons.glyphMap;
  multiline?: boolean; keyboardType?: 'default' | 'numeric' | 'url';
  error?: string;
}> = ({ label, value, onChangeText, placeholder, icon, multiline = false, keyboardType = 'default', error }) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.textSecondary, fontSize: typography.sm, fontWeight: '600', marginBottom: 6 }}>
        {label}
      </Text>
      <View style={[
        sh.inputBox,
        { backgroundColor: colors.surface, borderColor: error ? colors.error : colors.border, minHeight: multiline ? 90 : 50 },
      ]}>
        {icon && <Ionicons name={icon} size={16} color={colors.textMuted} style={{ marginRight: 8 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          multiline={multiline}
          keyboardType={keyboardType}
          style={[
            sh.input,
            { color: colors.text, textAlignVertical: multiline ? 'top' : 'center', paddingTop: multiline ? 8 : 0 },
          ]}
        />
      </View>
      {error && <Text style={{ color: colors.error, fontSize: typography.xs, marginTop: 3 }}>{error}</Text>}
    </View>
  );
};

// ─── Main form component ──────────────────────────────────────────────────────

const PortfolioFormContent: React.FC<FormProps> = ({ navigation, editItem }) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;

  const isEditing = Boolean(editItem);
  const [form, setForm]     = useState<PortfolioFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [techInput, setTechInput] = useState('');

  const addMutation    = useAddPortfolioItem();
  const updateMutation = useUpdatePortfolioItem();
  const isPending = addMutation.isPending || updateMutation.isPending;

  // Populate when editing
  useEffect(() => {
    if (editItem) {
      setForm({
        title:          editItem.title ?? '',
        description:    editItem.description ?? '',
        mediaUrls:      editItem.mediaUrls?.filter(u => u?.includes('cloudinary.com')) ?? [],
        projectUrl:     editItem.projectUrl ?? '',
        category:       editItem.category ?? '',
        technologies:   editItem.technologies ?? [],
        budget:         editItem.budget,
        budgetType:     editItem.budgetType ?? 'fixed',
        duration:       editItem.duration ?? '',
        client:         editItem.client ?? '',
        completionDate: editItem.completionDate?.split('T')[0] ?? '',
        featured:       editItem.featured ?? false,
        visibility:     editItem.visibility ?? 'public',
      });
    }
  }, [editItem]);

  const set = <K extends keyof PortfolioFormData>(key: K, value: PortfolioFormData[K]) =>
    setForm(p => ({ ...p, [key]: value }));

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.mediaUrls.length) e.mediaUrls = 'At least one image is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const addTech = () => {
    const t = techInput.trim();
    if (t && !form.technologies?.includes(t)) set('technologies', [...(form.technologies ?? []), t]);
    setTechInput('');
  };

  const removeTech = (t: string) =>
    set('technologies', (form.technologies ?? []).filter(x => x !== t));

  const handleSubmit = () => {
    if (!validate()) return;
    if (isEditing && editItem) {
      updateMutation.mutate({ id: editItem._id, data: form }, { onSuccess: () => navigation.goBack() });
    } else {
      addMutation.mutate(form, { onSuccess: () => navigation.goBack() });
    }
  };

  return (
    <ScreenWrapper>
      <ScreenHeader
        title={isEditing ? 'Edit Project' : 'Add New Project'}
        subtitle="Your work · Cloudinary CDN"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing[4], paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Images ────────────────────────────────────────────── */}
        <SectionHeader label="Project Images" icon="images-outline" />
        <ImagePickerGrid
          value={form.mediaUrls}
          onChange={urls => set('mediaUrls', urls)}
          maxImages={8}
          label="Project Photos *"
          error={errors.mediaUrls}
        />

        {/* ── Basic Info ────────────────────────────────────────── */}
        <SectionHeader label="Basic Information" icon="information-circle-outline" />
        <Field
          label="Project Title *"
          value={form.title}
          onChangeText={v => set('title', v)}
          placeholder="E.g. E-commerce Website for FashionCo"
          icon="folder-outline"
          error={errors.title}
        />
        <Field
          label="Description *"
          value={form.description}
          onChangeText={v => set('description', v)}
          placeholder="Describe the project, your role, challenges, and the outcome…"
          multiline
          error={errors.description}
        />
        <Field
          label="Client / Company"
          value={form.client ?? ''}
          onChangeText={v => set('client', v)}
          placeholder="E.g. Acme Corp"
          icon="business-outline"
        />
        <Field
          label="Project URL"
          value={form.projectUrl ?? ''}
          onChangeText={v => set('projectUrl', v)}
          placeholder="https://live-project.com"
          icon="globe-outline"
          keyboardType="url"
        />

        {/* ── Category ──────────────────────────────────────────── */}
        <SectionHeader label="Category" icon="pricetag-outline" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {CATEGORIES.map(cat => {
            const val = cat.toLowerCase().replace(/ /g, '-');
            const active = form.category === val;
            return (
              <TouchableOpacity
                key={val}
                onPress={() => set('category', active ? '' : val)}
                style={[
                  sh.optBtn,
                  { backgroundColor: active ? ACCENT : colors.surface, borderColor: active ? ACCENT : colors.border },
                ]}
              >
                <Text style={{ color: active ? '#fff' : colors.text, fontSize: typography.xs, fontWeight: '600' }}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Project Details ───────────────────────────────────── */}
        <SectionHeader label="Project Details" icon="briefcase-outline" />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Budget ($)"
              value={form.budget?.toString() ?? ''}
              onChangeText={v => set('budget', v ? Number(v) : undefined)}
              placeholder="5000"
              icon="pricetag-outline"
              keyboardType="numeric"
            />
          </View>
          <View style={{ width: 130 }}>
            <InlineSelect
              label="Type"
              value={form.budgetType ?? 'fixed'}
              options={BUDGET_TYPES}
              onChange={v => set('budgetType', v as PortfolioFormData['budgetType'])}
            />
          </View>
        </View>

        <Field
          label="Duration"
          value={form.duration ?? ''}
          onChangeText={v => set('duration', v)}
          placeholder="E.g. 3 months, 2 weeks"
          icon="time-outline"
        />

        {/* ── Completion Date (calendar picker) ─────────────────── */}
        <DatePickerField
          label="Completion Date"
          value={form.completionDate ?? ''}
          onChange={v => set('completionDate', v)}
          placeholder="Pick completion date"
          maxDate={new Date()}
          optional
        />

        {/* ── Visibility ────────────────────────────────────────── */}
        <InlineSelect
          label="Visibility"
          value={form.visibility ?? 'public'}
          options={VISIBILITY_OPTS}
          onChange={v => set('visibility', v as 'public' | 'private')}
        />

        {/* ── Technologies ──────────────────────────────────────── */}
        <SectionHeader label="Technologies" icon="code-slash-outline" />
        <View style={[sh.techInputRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <TextInput
            value={techInput}
            onChangeText={setTechInput}
            placeholder="E.g. React Native, Node.js…"
            placeholderTextColor={colors.placeholder}
            style={[sh.techInput, { color: colors.text }]}
            returnKeyType="done"
            onSubmitEditing={addTech}
          />
          <TouchableOpacity onPress={addTech} style={[sh.addTechBtn, { backgroundColor: ACCENT }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={sh.tagWrap}>
          {(form.technologies ?? []).map((t, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => removeTech(t)}
              style={[sh.tag, { backgroundColor: '#6366F118', borderColor: '#6366F130' }]}
            >
              <Text style={{ fontSize: typography.xs, color: '#6366F1', fontWeight: '600' }}>{t}</Text>
              <Ionicons name="close" size={10} color="#6366F1" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Featured toggle ───────────────────────────────────── */}
        <TouchableOpacity
          onPress={() => set('featured', !form.featured)}
          style={[sh.toggleRow, { backgroundColor: colors.surface, borderColor: form.featured ? ACCENT + '60' : colors.border }]}
        >
          <View style={[sh.toggleIcon, { backgroundColor: ACCENT + '18' }]}>
            <Ionicons name="star-outline" size={16} color={ACCENT} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Featured Project</Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>Pin to top of your portfolio</Text>
          </View>
          <View style={[sh.toggle, { backgroundColor: form.featured ? ACCENT : colors.border }]}>
            <View style={[sh.knob, { alignSelf: form.featured ? 'flex-end' : 'flex-start' }]} />
          </View>
        </TouchableOpacity>

        {/* ── Submit ────────────────────────────────────────────── */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isPending}
          style={[sh.submitBtn, { backgroundColor: isPending ? ACCENT + '80' : ACCENT }]}
        >
          {isPending
            ? <ActivityIndicator color="#fff" />
            : <>
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.base, marginLeft: 8 }}>
                  {isEditing ? 'Save Changes' : 'Add Project'}
                </Text>
              </>}
        </TouchableOpacity>
      </ScrollView>
    </ScreenWrapper>
  );
};

// ─── Exported screens ─────────────────────────────────────────────────────────

export const AddPortfolioScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  return <PortfolioFormContent navigation={navigation} />;
};

export const EditPortfolioScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<EditRoute>();
  const { data: item, isLoading } = usePortfolioItem(params.itemId);

  if (isLoading) return (
    <ScreenWrapper>
      <ScreenHeader title="Edit Project" onBack={() => navigation.goBack()} />
      <LoadingState />
    </ScreenWrapper>
  );

  return <PortfolioFormContent navigation={navigation} editItem={item} />;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const sh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  line: { flex: 1, height: 1, marginLeft: 10 },
  iconBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  inputBox: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12 },
  input: { flex: 1, fontSize: 15 },
  optBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99, borderWidth: 1.5 },
  techInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingLeft: 12, marginBottom: 8 },
  techInput: { flex: 1, height: 44, fontSize: 14 },
  addTechBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 16 },
  toggleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 44, height: 26, borderRadius: 14, padding: 3, justifyContent: 'center' },
  knob: { width: 20, height: 20, backgroundColor: '#fff', borderRadius: 10, elevation: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 14, marginTop: 8 },
});