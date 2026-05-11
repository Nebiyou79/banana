// src/screens/shared/RequestVerificationScreen.tsx
// MIGRATED: useTheme() only, AppHeader, spacing/radius tokens, Ionicons only
// FIX preserved: slots pre-select today, mock fallback, consistent slot comparison

import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
  StatusBar, Animated, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { z } from 'zod';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useAuthStore } from '../../store/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import {
  useAppointmentSlots,
  useOfficeLocation,
  useBookAppointment,
} from '../../hooks/useVerification';
import { verificationService,AppointmentSlot, getUserId, type AppointmentRequest } from '../../services/verificationService';
const detailsSchema = z.object({
  fullName:        z.string().min(2, 'Full name is required'),
  email:           z.string().email('Enter a valid email address'),
  phone:           z.string().min(7, 'Enter a valid phone number'),
  additionalNotes: z.string().optional(),
});
type DetailsFields = z.infer<typeof detailsSchema>;

const VERIFICATION_TYPES = [
  { key: 'candidate',    label: 'Candidate',    icon: 'person-outline' as const,   desc: 'Individual job seeker' },
  { key: 'freelancer',   label: 'Freelancer',   icon: 'rocket-outline' as const,   desc: 'Independent professional' },
  { key: 'company',      label: 'Company',      icon: 'business-outline' as const, desc: 'Business entity' },
  { key: 'organization', label: 'Organization', icon: 'people-outline' as const,   desc: 'Non-profit / NGO' },
] as const;
type VerType = typeof VERIFICATION_TYPES[number]['key'];

const STEPS = ['Type', 'Schedule', 'Details', 'Confirm'] as const;

const generateMockSlots = (date: string): AppointmentSlot[] => {
  const times = [
    { start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' },
    { start: '10:00', end: '10:30' }, { start: '10:30', end: '11:00' },
    { start: '11:00', end: '11:30' }, { start: '13:00', end: '13:30' },
    { start: '13:30', end: '14:00' }, { start: '14:00', end: '14:30' },
    { start: '14:30', end: '15:00' }, { start: '15:00', end: '15:30' },
    { start: '15:30', end: '16:00' }, { start: '16:00', end: '16:30' },
  ];
  return times.map((t, i) => ({ id: `mock-${date}-${i}`, startTime: t.start, endTime: t.end, isAvailable: true }));
};

const generateDateOptions = () => {
  const dates: Array<{ value: string; label: string; dayName: string; dayNum: string; month: string }> = [];
  const today = new Date();
  for (let i = 0; i <= 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) {
      dates.push({
        value:   date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum:  String(date.getDate()),
        month:   date.toLocaleDateString('en-US', { month: 'short' }),
        label:   date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
      });
    }
  }
  return dates;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton: React.FC<{ width?: number | string; height?: number; radius?: number }> = ({
  width = '100%', height = 16, radius: r = 8,
}) => {
  const { colors: c } = useTheme();
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View style={{ width: width as any, height, borderRadius: r, backgroundColor: c.skeleton, opacity: anim }} />
  );
};

// ─── Step bar ─────────────────────────────────────────────────────────────────
const StepBar: React.FC<{ current: number }> = ({ current }) => {
  const { colors: c, spacing } = useTheme();
  return (
    <View style={[sb.row, { paddingVertical: spacing.md }]}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View style={[sb.dot, {
                backgroundColor: done ? c.success : active ? c.primary : c.border,
              }]}>
                {done
                  ? <Ionicons name="checkmark" size={10} color={c.textInverse} />
                  : <Text style={{ color: active ? c.textInverse : c.textMuted, fontSize: 9, fontWeight: '800' }}>{i + 1}</Text>
                }
              </View>
              <Text style={{
                fontSize: 9, fontWeight: active ? '700' : '400', marginTop: 4,
                color: active ? c.primary : done ? c.success : c.textMuted,
              }}>
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[sb.line, { backgroundColor: done ? c.success : c.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};
const sb = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  dot:  { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, height: 2, marginHorizontal: 4, marginTop: 12 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export const RequestVerificationScreen: React.FC = () => {
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const insets     = useSafeAreaInsets();
  const { user }   = useAuthStore();
  const navigation = useNavigation<any>();

  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<VerType>('candidate');

  const dateOptions = useMemo(() => generateDateOptions(), []);
  const [selectedDate, setSelectedDate] = useState<string>(
    dateOptions[0]?.value ?? new Date().toISOString().split('T')[0],
  );
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  const [details, setDetails] = useState<DetailsFields>({
    fullName: user?.name ?? '', email: user?.email ?? '', phone: '', additionalNotes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof DetailsFields, string>>>({});

  const { data: slotsData, isLoading: loadingSlots, isError: slotsError } = useAppointmentSlots(selectedDate, selectedType);
  const { data: officeData } = useOfficeLocation();
  const bookAppointment      = useBookAppointment();

  const availableSlots = useMemo(() => {
    const apiSlots = (slotsData?.slots ?? []).filter(s => s.isAvailable);
    if (!loadingSlots && (apiSlots.length === 0 || slotsError)) return generateMockSlots(selectedDate);
    return apiSlots;
  }, [slotsData, loadingSlots, slotsError, selectedDate]);

  const canAdvance = useMemo(() => {
    if (step === 0) return !!selectedType;
    if (step === 1) return !!selectedDate && !!selectedSlot;
    if (step === 2) return detailsSchema.safeParse(details).success;
    return true;
  }, [step, selectedType, selectedDate, selectedSlot, details]);

  const handleNext = useCallback(() => {
    if (step === 2) {
      const result = detailsSchema.safeParse(details);
      if (!result.success) {
        const errs: typeof fieldErrors = {};
        result.error.errors.forEach(e => { errs[e.path[0] as keyof DetailsFields] = e.message; });
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
    }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  }, [step, details]);

const handleSubmit = useCallback(async () => {
  if (!selectedDate || !selectedSlot) { 
    Alert.alert('Missing Info', 'Please select a date and time slot.'); 
    return; 
  }
  
  // FIX: Use getUserId helper to handle different ID property names
  const userId = getUserId(user);
  
  if (!userId) { 
    Alert.alert('Not Logged In', 'Please log in to book an appointment.'); 
    return; 
  }

  const payload: AppointmentRequest = {
    userId, 
    fullName: details.fullName, 
    email: details.email, 
    phone: details.phone,
    verificationType: selectedType, 
    appointmentDate: selectedDate,
    appointmentTime: selectedSlot.start, 
    additionalNotes: details.additionalNotes,
    role: user?.role || selectedType,
  };

  bookAppointment.mutate(payload, {
    onSuccess: () => Alert.alert(
      'Appointment Booked!',
      `Confirmed for ${selectedDate} at ${selectedSlot.start}. Check your email for details.`,
      [{ text: 'Done', onPress: () => navigation.goBack() }],
    ),
    onError: (err: any) => {
      console.error('Booking error:', err);
      Alert.alert('Booking Failed', err?.response?.data?.message ?? err?.message ?? 'Please try again.');
    },
  });
}, [user, selectedDate, selectedSlot, details, selectedType, bookAppointment, navigation]);

  // ── Step renders ──────────────────────────────────────────────────────────
  const renderTypeStep = () => (
    <View style={{ gap: spacing.md }}>
      <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginBottom: spacing.xs }]}>What best describes you?</Text>
      {VERIFICATION_TYPES.map(t => {
        const active = selectedType === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => setSelectedType(t.key)}
            style={[S.typeCard, {
              backgroundColor: active ? withAlpha(c.primary, 0.14) : c.surface,
              borderColor:     active ? c.primary : c.border,
              borderWidth:     active ? 2 : 1,
              borderRadius:    radius.xl,
            }]}
            activeOpacity={0.85}
          >
            <View style={[S.typeIcon, { backgroundColor: active ? c.primary : withAlpha(c.border, 0.6), borderRadius: radius.lg }]}>
              <Ionicons name={t.icon} size={22} color={active ? c.textInverse : c.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={[type.bodySm, { color: active ? c.primary : c.text, fontWeight: '700' }]}>{t.label}</Text>
              <Text style={[type.caption, { color: c.textMuted, marginTop: 2 }]}>{t.desc}</Text>
            </View>
            <View style={[S.radio, { borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primary : 'transparent' }]}>
              {active && <View style={S.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderScheduleStep = () => (
    <View style={{ gap: spacing.xl }}>
      {officeData && (
        <View style={[S.officeCard, { backgroundColor: c.infoBg, borderColor: withAlpha(c.info, 0.4), borderRadius: radius.lg }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Ionicons name="location-outline" size={15} color={c.info} />
            <Text style={[type.caption, { color: c.info, fontWeight: '700', marginLeft: spacing.sm }]}>Verification Office</Text>
          </View>
          <Text style={[type.caption, { color: c.text, lineHeight: 18 }]}>{officeData.address}</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 4 }]}>{officeData.workingHours} · {officeData.contactPhone}</Text>
        </View>
      )}

      <View>
        <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginBottom: spacing.sm }]}>Select a date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 6, paddingHorizontal: 2 }}>
          {dateOptions.map(d => {
            const active = selectedDate === d.value;
            return (
              <TouchableOpacity
                key={d.value}
                onPress={() => { setSelectedDate(d.value); setSelectedSlot(null); }}
                style={[S.dateChip, {
                  backgroundColor: active ? c.primary : c.surface,
                  borderColor:     active ? c.primary : c.border,
                  borderRadius:    radius.lg,
                  borderWidth:     active ? 2 : 1,
                }]}
                activeOpacity={0.8}
              >
                <Text style={[type.caption, { color: active ? withAlpha('#FFF', 0.85) : c.textMuted, textAlign: 'center' }]}>{d.dayName}</Text>
                <Text style={{ fontSize: 20, fontWeight: '800', color: active ? c.textInverse : c.text, textAlign: 'center' }}>{d.dayNum}</Text>
                <Text style={[type.caption, { color: active ? withAlpha('#FFF', 0.85) : c.textMuted, textAlign: 'center' }]}>{d.month}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>Available time slots</Text>
          {!loadingSlots && (
            <View style={[S.slotCountBadge, { backgroundColor: c.primaryBg }]}>
              <Text style={[type.caption, { color: c.primary, fontWeight: '700' }]}>{availableSlots.length} open</Text>
            </View>
          )}
        </View>

        {loadingSlots ? (
          <View style={S.slotGrid}>
            {[...Array(8)].map((_, i) => (
              <View key={i} style={{ width: '47%' }}>
                <Skeleton height={56} radius={12} />
              </View>
            ))}
          </View>
        ) : (
          <View style={S.slotGrid}>
            {availableSlots.map(item => {
              const active = selectedSlot?.start === item.startTime;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setSelectedSlot({ start: item.startTime, end: item.endTime })}
                  style={[S.slotChip, {
                    backgroundColor: active ? c.primary : c.surface,
                    borderColor:     active ? c.primary : c.border,
                    borderRadius:    radius.md,
                    borderWidth:     active ? 2 : 1,
                  }]}
                  activeOpacity={0.8}
                >
                  <Ionicons name="time-outline" size={13} color={active ? withAlpha('#FFF', 0.9) : c.textMuted} />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: active ? c.textInverse : c.text }}>{item.startTime}</Text>
                    <Text style={[type.caption, { color: active ? withAlpha('#FFF', 0.75) : c.textMuted }]}>– {item.endTime}</Text>
                  </View>
                  {active && (
                    <View style={[S.slotCheck, { backgroundColor: c.textInverse }]}>
                      <Ionicons name="checkmark" size={11} color={c.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {selectedSlot && (
          <View style={[S.selectedSlotBanner, { backgroundColor: c.primaryBg, borderColor: withAlpha(c.primary, 0.4) }]}>
            <Ionicons name="checkmark-circle" size={16} color={c.primary} />
            <Text style={[type.bodySm, { color: c.primary, fontWeight: '700', marginLeft: spacing.sm }]}>
              Selected: {selectedSlot.start} – {selectedSlot.end}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ gap: spacing.lg }}>
        <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>Your details</Text>
        {([
          { key: 'fullName' as const, label: 'Full Name *',     placeholder: 'Enter your full name',  keyboard: 'default' as const },
          { key: 'email'    as const, label: 'Email Address *', placeholder: 'you@example.com',       keyboard: 'email-address' as const },
          { key: 'phone'    as const, label: 'Phone Number *',  placeholder: '+251 91 234 5678',       keyboard: 'phone-pad' as const },
        ]).map(field => (
          <View key={field.key}>
            <Text style={[type.caption, { color: c.textMuted, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
              {field.label}
            </Text>
            <TextInput
              value={details[field.key] as string}
              onChangeText={v => {
                setDetails(d => ({ ...d, [field.key]: v }));
                if (fieldErrors[field.key]) setFieldErrors(e => ({ ...e, [field.key]: undefined }));
              }}
              placeholder={field.placeholder}
              placeholderTextColor={c.inputPlaceholder}
              keyboardType={field.keyboard}
              autoCapitalize={field.key === 'fullName' ? 'words' : 'none'}
              style={[S.input, {
                color:           c.text,
                backgroundColor: c.inputBg,
                borderColor:     fieldErrors[field.key] ? c.danger : c.inputBorder,
                borderRadius:    radius.md,
              }]}
            />
            {fieldErrors[field.key] && (
              <Text style={[type.caption, { color: c.danger, marginTop: 4 }]}>{fieldErrors[field.key]}</Text>
            )}
          </View>
        ))}
        <View>
          <Text style={[type.caption, { color: c.textMuted, fontWeight: '600', marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
            Additional Notes (optional)
          </Text>
          <TextInput
            value={details.additionalNotes}
            onChangeText={v => setDetails(d => ({ ...d, additionalNotes: v }))}
            placeholder="Any special requirements or documents to bring…"
            placeholderTextColor={c.inputPlaceholder}
            multiline numberOfLines={3}
            style={[S.input, {
              color: c.text, backgroundColor: c.inputBg, borderColor: c.inputBorder,
              borderRadius: radius.md, height: 90, textAlignVertical: 'top',
            }]}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const renderConfirmStep = () => {
    const typeLabel = VERIFICATION_TYPES.find(t => t.key === selectedType)?.label ?? selectedType;
    const dateLabel = dateOptions.find(d => d.value === selectedDate)?.label ?? selectedDate;
    return (
      <View style={{ gap: spacing.lg }}>
        <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>Confirm your appointment</Text>
        <View style={[S.summaryCard, { backgroundColor: c.surface, borderRadius: radius.xl, borderColor: c.border }]}>
          {[
            { icon: 'shield-checkmark-outline', label: 'Type',  value: typeLabel },
            { icon: 'calendar-outline',         label: 'Date',  value: dateLabel },
            { icon: 'time-outline',             label: 'Time',  value: selectedSlot ? `${selectedSlot.start} – ${selectedSlot.end}` : '—' },
            { icon: 'person-outline',           label: 'Name',  value: details.fullName },
            { icon: 'mail-outline',             label: 'Email', value: details.email },
            { icon: 'call-outline',             label: 'Phone', value: details.phone },
          ].map((row, i) => (
            <View key={row.label} style={[S.summaryRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
              <View style={[S.summaryIcon, { backgroundColor: c.primaryBg, borderRadius: radius.sm }]}>
                <Ionicons name={row.icon as any} size={14} color={c.primary} />
              </View>
              <Text style={[type.caption, { color: c.textMuted, width: 52 }]}>{row.label}</Text>
              <Text style={[type.bodySm, { flex: 1, fontWeight: '600', color: c.text }]} numberOfLines={1}>{row.value}</Text>
            </View>
          ))}
        </View>
        {details.additionalNotes ? (
          <View style={[S.noteBox, { backgroundColor: c.primaryBg, borderRadius: radius.lg }]}>
            <Ionicons name="document-text-outline" size={15} color={c.primary} />
            <Text style={[type.caption, { flex: 1, color: c.text, marginLeft: spacing.sm, lineHeight: 16 }]}>{details.additionalNotes}</Text>
          </View>
        ) : null}
        <View style={[S.noteBox, { backgroundColor: c.successBg, borderRadius: radius.lg }]}>
          <Ionicons name="checkmark-circle-outline" size={15} color={c.success} />
          <Text style={[type.caption, { flex: 1, color: c.success, marginLeft: spacing.sm, lineHeight: 16 }]}>
            You will receive an email confirmation after booking. Arrive 5 minutes early.
          </Text>
        </View>
      </View>
    );
  };

  const stepContent = [renderTypeStep, renderScheduleStep, renderDetailsStep, renderConfirmStep];
  const isLastStep  = step === STEPS.length - 1;
  const isSubmitting = bookAppointment.isPending;

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <AppHeader
        title="Book Verification"
        showBack
        onBack={() => step > 0 ? setStep(prev => prev - 1) : navigation.goBack()}
      />

      {/* Step bar */}
      <View style={[S.stepBarContainer, { backgroundColor: c.surface, paddingHorizontal: spacing.xl }]}>
        <StepBar current={step} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {stepContent[step]?.()}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[S.footer, {
        backgroundColor: c.surface,
        borderTopColor:  c.border,
        paddingBottom:   insets.bottom + spacing.md,
        paddingHorizontal: spacing.md,
        paddingTop:      spacing.md,
      }]}>
        {step > 0 && (
          <TouchableOpacity
            onPress={() => setStep(prev => prev - 1)}
            style={[S.btnSecondary, { borderColor: c.border, borderRadius: radius.lg }]}
          >
            <Ionicons name="arrow-back" size={16} color={c.text} />
            <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginLeft: 4 }]}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={isLastStep ? handleSubmit : handleNext}
          disabled={!canAdvance || isSubmitting}
          style={[S.btnPrimary, {
            backgroundColor: !canAdvance || isSubmitting ? withAlpha(c.primary, 0.6) : c.primary,
            borderRadius:    radius.lg,
            flex:            step === 0 ? 1 : 2,
            opacity:         !canAdvance ? 0.55 : 1,
          }]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={c.textInverse} size="small" />
          ) : (
            <>
              <Text style={[type.body, { color: c.textInverse, fontWeight: '700' }]}>
                {isLastStep ? 'Confirm Booking' : 'Continue'}
              </Text>
              <Ionicons
                name={isLastStep ? 'checkmark-circle-outline' : 'arrow-forward'}
                size={17}
                color={c.textInverse}
                style={{ marginLeft: 6 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:             { flex: 1 },
  stepBarContainer: {},
  typeCard:         { flexDirection: 'row', alignItems: 'center', padding: 16 },
  typeIcon:         { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  radio:            { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot:         { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  officeCard:       { padding: 14, borderWidth: 1 },
  dateChip:         { width: 62, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  slotGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip:         { width: '47%', flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, position: 'relative' },
  slotCheck:        { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  slotCountBadge:   { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  selectedSlotBanner: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, borderRadius: 10, borderWidth: 1 },
  input:            { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  summaryCard:      { borderWidth: 1, overflow: 'hidden' },
  summaryRow:       { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  summaryIcon:      { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  noteBox:          { flexDirection: 'row', alignItems: 'flex-start', padding: 12 },
  footer:           { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 10, borderTopWidth: 1 },
  btnSecondary:     { flex: 1, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, gap: 4 },
  btnPrimary:       { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
});

export default RequestVerificationScreen;