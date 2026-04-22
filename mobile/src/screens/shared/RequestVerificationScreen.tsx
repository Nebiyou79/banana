/**
 * src/screens/shared/RequestVerificationScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Professional Booking System — mobile equivalent of AppointmentModal.tsx.
 *
 * FIXES vs prior version:
 *  • Time-slot FlashList replaced with a plain View/map — numColumns on a
 *    non-scrollable FlashList is unreliable; the 2-column grid is now a
 *    flexWrap View which always populates correctly.
 *  • Slot selection state comparison fixed (was comparing startTime to
 *    item.startTime after already unwrapping; now consistent).
 *  • Slots loading skeleton improved.
 *  • Date pre-fills today so users immediately see available slots.
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons }     from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { z }            from 'zod';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import {
  useAppointmentSlots,
  useOfficeLocation,
  useBookAppointment,
} from '../../hooks/useVerification';
import type { AppointmentRequest } from '../../services/verificationService';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const detailsSchema = z.object({
  fullName:        z.string().min(2, 'Full name is required'),
  email:           z.string().email('Enter a valid email address'),
  phone:           z.string().min(7, 'Enter a valid phone number'),
  additionalNotes: z.string().optional(),
});

type DetailsFields = z.infer<typeof detailsSchema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const VERIFICATION_TYPES = [
  { key: 'candidate',    label: 'Candidate',    icon: 'person-outline',   desc: 'Individual job seeker' },
  { key: 'freelancer',   label: 'Freelancer',   icon: 'rocket-outline',   desc: 'Independent professional' },
  { key: 'company',      label: 'Company',      icon: 'business-outline', desc: 'Business entity' },
  { key: 'organization', label: 'Organization', icon: 'people-outline',   desc: 'Non-profit / NGO' },
] as const;

type VerType = typeof VERIFICATION_TYPES[number]['key'];

const STEPS = ['Type', 'Schedule', 'Details', 'Confirm'] as const;

// ─── Date generator — weekdays only, next 30 days ────────────────────────────

const generateDateOptions = () => {
  const dates: Array<{
    value: string;
    label: string;
    dayName: string;
    dayNum: string;
    month: string;
  }> = [];
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
        label:   date.toLocaleDateString('en-US', {
          weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
        }),
      });
    }
  }
  return dates;
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ width?: number | string; height?: number; radius?: number }> = ({
  width = '100%', height = 16, radius = 8,
}) => {
  const { theme } = useThemeStore();
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return (
    <Animated.View
      style={{
        width: width as any,
        height,
        borderRadius: radius,
        backgroundColor: theme.colors.border,
        opacity: anim,
      }}
    />
  );
};

// ─── Step bar ─────────────────────────────────────────────────────────────────

const StepBar: React.FC<{ current: number }> = ({ current }) => {
  const { theme: { colors } } = useThemeStore();
  return (
    <View style={sb.row}>
      {STEPS.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={[
                  sb.dot,
                  {
                    backgroundColor:
                      done   ? colors.success :
                      active ? colors.primary :
                      colors.border,
                  },
                ]}
              >
                {done ? (
                  <Ionicons name="checkmark" size={10} color="#fff" />
                ) : (
                  <Text style={{ color: active ? '#fff' : colors.textMuted, fontSize: 9, fontWeight: '800' }}>
                    {i + 1}
                  </Text>
                )}
              </View>
              <Text style={{
                fontSize: 9,
                fontWeight: active ? '700' : '400',
                color: active ? colors.primary : done ? colors.success : colors.textMuted,
                marginTop: 4,
              }}>
                {label}
              </Text>
            </View>
            {i < STEPS.length - 1 && (
              <View style={[sb.line, { backgroundColor: done ? colors.success : colors.border }]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const sb = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', paddingVertical: 14 },
  dot:  { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  line: { flex: 1, height: 2, marginHorizontal: 4, marginTop: 12 },
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const RequestVerificationScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, borderRadius, shadows } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<any>();

  const [step, setStep] = useState(0);

  // Step 0 — type
  const [selectedType, setSelectedType] = useState<VerType>('candidate');

  // Step 1 — date + slot
  const dateOptions = useMemo(() => generateDateOptions(), []);
  // Pre-select today's date so slots load immediately
  const [selectedDate, setSelectedDate] = useState<string>(
    dateOptions[0]?.value ?? '',
  );
  const [selectedSlot, setSelectedSlot] = useState<{ start: string; end: string } | null>(null);

  // Step 2 — details
  const [details, setDetails] = useState<DetailsFields>({
    fullName:        user?.name  ?? '',
    email:           user?.email ?? '',
    phone:           '',
    additionalNotes: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof DetailsFields, string>>>({});

  // Data hooks
  const { data: slotsData, isLoading: loadingSlots } = useAppointmentSlots(selectedDate, selectedType);
  const { data: officeData }                         = useOfficeLocation();
  const bookAppointment = useBookAppointment();

  // Only show available slots
  const availableSlots = useMemo(
    () => (slotsData?.slots ?? []).filter((s) => s.isAvailable),
    [slotsData],
  );

  // ── Navigation guards ─────────────────────────────────────────────────────

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
        result.error.errors.forEach((e) => {
          errs[e.path[0] as keyof DetailsFields] = e.message;
        });
        setFieldErrors(errs);
        return;
      }
      setFieldErrors({});
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }, [step, details]);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!user?._id || !selectedDate || !selectedSlot) return;
    const payload: AppointmentRequest = {
      userId:           user._id,
      fullName:         details.fullName,
      email:            details.email,
      phone:            details.phone,
      verificationType: selectedType,
      appointmentDate:  selectedDate,
      appointmentTime:  selectedSlot.start,
      additionalNotes:  details.additionalNotes,
    };
    bookAppointment.mutate(payload, {
      onSuccess: () => navigation.goBack(),
    });
  }, [user, selectedDate, selectedSlot, details, selectedType, bookAppointment, navigation]);

  // ── Render steps ──────────────────────────────────────────────────────────

  const renderTypeStep = () => (
    <View style={{ gap: 12 }}>
      <Text style={[s.sectionTitle, { color: colors.text }]}>What best describes you?</Text>
      {VERIFICATION_TYPES.map((t) => {
        const active = selectedType === t.key;
        return (
          <TouchableOpacity
            key={t.key}
            onPress={() => setSelectedType(t.key)}
            style={[
              s.typeCard,
              {
                backgroundColor: active ? colors.primaryLight ?? colors.card : colors.card,
                borderColor:     active ? colors.primary : colors.border,
                borderWidth:     active ? 2 : 1,
                borderRadius:    borderRadius.xl,
              },
            ]}
            activeOpacity={0.85}
          >
            <View
              style={[
                s.typeIcon,
                {
                  backgroundColor: active ? colors.primary : colors.border + '60',
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Ionicons name={t.icon as any} size={22} color={active ? '#fff' : colors.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: active ? colors.primary : colors.text }}>
                {t.label}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{t.desc}</Text>
            </View>
            <View
              style={[
                s.radio,
                { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : 'transparent' },
              ]}
            >
              {active && <View style={s.radioDot} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderScheduleStep = () => (
    <View style={{ gap: 20 }}>
      {/* Office info */}
      {officeData && (
        <View
          style={[
            s.officeCard,
            {
              backgroundColor: (colors.info ?? '#EFF6FF'),
              borderColor: (colors.info ?? '#3B82F6') + '40',
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="location-outline" size={15} color={colors.info ?? '#3B82F6'} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.info ?? '#3B82F6', marginLeft: 6 }}>
              Verification Office
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.text, lineHeight: 18 }}>{officeData.address}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>
            {officeData.workingHours} · {officeData.contactPhone}
          </Text>
        </View>
      )}

      {/* Date picker */}
      <View>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Select a date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 6, paddingHorizontal: 2 }}
        >
          {dateOptions.map((d) => {
            const active = selectedDate === d.value;
            return (
              <TouchableOpacity
                key={d.value}
                onPress={() => {
                  setSelectedDate(d.value);
                  setSelectedSlot(null);   // clear slot when date changes
                }}
                style={[
                  s.dateChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor:     active ? colors.primary : colors.border,
                    borderRadius:    borderRadius.lg,
                  },
                ]}
              >
                <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : colors.textMuted, textAlign: 'center' }}>
                  {d.dayName}
                </Text>
                <Text style={{ fontSize: 18, fontWeight: '800', color: active ? '#fff' : colors.text, textAlign: 'center' }}>
                  {d.dayNum}
                </Text>
                <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.8)' : colors.textMuted, textAlign: 'center' }}>
                  {d.month}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Time slots ─────────────────────────────────────── */}
      {selectedDate && (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 0 }]}>
              Available slots
            </Text>
            {!loadingSlots && (
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {availableSlots.length} open
              </Text>
            )}
          </View>

          {loadingSlots ? (
            /* Skeleton grid */
            <View style={s.slotGrid}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={s.slotSkeletonWrap}>
                  <Skeleton height={52} radius={12} />
                </View>
              ))}
            </View>
          ) : availableSlots.length === 0 ? (
            <View
              style={[
                s.emptySlots,
                { backgroundColor: colors.card, borderRadius: borderRadius.lg },
              ]}
            >
              <Ionicons name="calendar-outline" size={32} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 18 }}>
                No slots available on this date.{'\n'}Please select another day.
              </Text>
            </View>
          ) : (
            /* ── 2-column flexWrap grid — reliable on all RN versions ── */
            <View style={s.slotGrid}>
              {availableSlots.map((item) => {
                const active = selectedSlot?.start === item.startTime;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() =>
                      setSelectedSlot({ start: item.startTime, end: item.endTime })
                    }
                    style={[
                      s.slotChip,
                      {
                        backgroundColor: active ? colors.primary : colors.card,
                        borderColor:     active ? colors.primary : colors.border,
                        borderRadius:    borderRadius.md,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="time-outline"
                      size={13}
                      color={active ? 'rgba(255,255,255,0.9)' : colors.textMuted}
                    />
                    <View style={{ marginLeft: 5 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: active ? '#fff' : colors.text,
                        }}
                      >
                        {item.startTime}
                      </Text>
                      <Text style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.7)' : colors.textMuted }}>
                        – {item.endTime}
                      </Text>
                    </View>
                    {active && (
                      <View style={s.slotCheck}>
                        <Ionicons name="checkmark" size={11} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderDetailsStep = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ gap: 16 }}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Your details</Text>
        {(
          [
            { key: 'fullName' as const, label: 'Full Name *',     placeholder: 'Enter your full name',  keyboard: 'default' as const },
            { key: 'email'    as const, label: 'Email Address *', placeholder: 'you@example.com',       keyboard: 'email-address' as const },
            { key: 'phone'    as const, label: 'Phone Number *',  placeholder: '+251 91 234 5678',       keyboard: 'phone-pad' as const },
          ] as const
        ).map((field) => (
          <View key={field.key}>
            <Text style={[s.fieldLabel, { color: colors.textMuted }]}>{field.label}</Text>
            <TextInput
              value={details[field.key] as string}
              onChangeText={(v) => {
                setDetails((d) => ({ ...d, [field.key]: v }));
                if (fieldErrors[field.key]) setFieldErrors((e) => ({ ...e, [field.key]: undefined }));
              }}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textMuted}
              keyboardType={field.keyboard}
              autoCapitalize={field.key === 'fullName' ? 'words' : 'none'}
              style={[
                s.input,
                {
                  color:           colors.text,
                  backgroundColor: colors.card,
                  borderColor:     fieldErrors[field.key] ? '#EF4444' : colors.border,
                  borderRadius:    borderRadius.md,
                },
              ]}
            />
            {fieldErrors[field.key] && (
              <Text style={{ fontSize: 11, color: '#EF4444', marginTop: 4 }}>
                {fieldErrors[field.key]}
              </Text>
            )}
          </View>
        ))}

        <View>
          <Text style={[s.fieldLabel, { color: colors.textMuted }]}>Additional Notes</Text>
          <TextInput
            value={details.additionalNotes}
            onChangeText={(v) => setDetails((d) => ({ ...d, additionalNotes: v }))}
            placeholder="Any special requirements…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            style={[
              s.input,
              {
                color:           colors.text,
                backgroundColor: colors.card,
                borderColor:     colors.border,
                borderRadius:    borderRadius.md,
                height:          90,
                textAlignVertical: 'top',
              },
            ]}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  const renderConfirmStep = () => {
    const typeLabel = VERIFICATION_TYPES.find((t) => t.key === selectedType)?.label ?? selectedType;
    const dateLabel = dateOptions.find((d) => d.value === selectedDate)?.label ?? selectedDate;
    return (
      <View style={{ gap: 16 }}>
        <Text style={[s.sectionTitle, { color: colors.text }]}>Confirm your appointment</Text>
        <View style={[s.summaryCard, { backgroundColor: colors.card, borderRadius: borderRadius.xl, borderColor: colors.border }]}>
          {[
            { icon: 'shield-checkmark-outline', label: 'Type',  value: typeLabel },
            { icon: 'calendar-outline',         label: 'Date',  value: dateLabel },
            { icon: 'time-outline',             label: 'Time',  value: `${selectedSlot?.start} – ${selectedSlot?.end}` },
            { icon: 'person-outline',           label: 'Name',  value: details.fullName },
            { icon: 'mail-outline',             label: 'Email', value: details.email },
            { icon: 'call-outline',             label: 'Phone', value: details.phone },
          ].map((row, i) => (
            <View
              key={row.label}
              style={[
                s.summaryRow,
                i > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
              ]}
            >
              <View style={[s.summaryIcon, { backgroundColor: (colors.primaryLight ?? colors.card), borderRadius: borderRadius.sm }]}>
                <Ionicons name={row.icon as any} size={14} color={colors.primary} />
              </View>
              <Text style={{ fontSize: 11, color: colors.textMuted, width: 52 }}>{row.label}</Text>
              <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {officeData && (
          <View style={[s.noteBox, { backgroundColor: colors.info ?? '#EFF6FF', borderRadius: borderRadius.lg }]}>
            <Ionicons name="information-circle-outline" size={15} color={colors.info ?? '#3B82F6'} />
            <Text style={{ flex: 1, fontSize: 12, color: colors.info ?? '#3B82F6', marginLeft: 8, lineHeight: 16 }}>
              Please bring a valid ID and any supporting documents to {officeData.address}.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const stepContent = [renderTypeStep, renderScheduleStep, renderDetailsStep, renderConfirmStep];
  const isLastStep  = step === STEPS.length - 1;
  const isSubmitting = bookAppointment.isPending;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background ?? colors.banana }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background ?? colors.banana}
      />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => (step > 0 ? setStep((prev) => prev - 1) : navigation.goBack())}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>
          Book Verification
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Step bar */}
      <View style={{ backgroundColor: colors.surface ?? colors.secondary, paddingHorizontal: 20 }}>
        <StepBar current={step} />
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {stepContent[step]?.()}
      </ScrollView>

      {/* Footer CTA */}
      <View style={[s.footer, { backgroundColor: colors.surface ?? colors.secondary, borderTopColor: colors.border }]}>
        {step > 0 && (
          <TouchableOpacity
            onPress={() => setStep((prev) => prev - 1)}
            style={[s.btnSecondary, { borderColor: colors.border, borderRadius: borderRadius.lg }]}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text }}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={isLastStep ? handleSubmit : handleNext}
          disabled={!canAdvance || isSubmitting}
          style={[
            s.btnPrimary,
            {
              backgroundColor:
                !canAdvance || isSubmitting
                  ? (colors.primaryLight ?? '#FEF3C7')
                  : colors.primary,
              borderRadius: borderRadius.lg,
              flex: step === 0 ? 1 : 2,
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
                {isLastStep ? 'Confirm Booking' : 'Continue'}
              </Text>
              <Ionicons
                name={isLastStep ? 'checkmark-circle-outline' : 'arrow-forward'}
                size={16}
                color="#fff"
                style={{ marginLeft: 6 }}
              />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },

  /* Type step */
  typeCard:   { flexDirection: 'row', alignItems: 'center', padding: 16 },
  typeIcon:   { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  radio:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot:   { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },

  /* Office */
  officeCard: { padding: 14, borderWidth: 1 },

  /* Date chip */
  dateChip:   { width: 58, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', borderWidth: 1.5 },

  /* Slot grid — flexWrap 2-column */
  slotGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotSkeletonWrap: { width: '47%' },
  slotChip: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    position: 'relative',
  },
  slotCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlots: { alignItems: 'center', paddingVertical: 32 },

  /* Details */
  fieldLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input:      { borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },

  /* Confirm */
  summaryCard:  { borderWidth: 1, overflow: 'hidden' },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  summaryIcon:  { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  noteBox:      { flexDirection: 'row', alignItems: 'flex-start', padding: 12 },

  /* Footer */
  footer:       { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 12, gap: 10, borderTopWidth: 1 },
  btnSecondary: { flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  btnPrimary:   { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});