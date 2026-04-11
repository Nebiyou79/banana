import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { verificationService, VERIFICATION_FALLBACK } from '../../services/verificationService';

// ─── Role accent colours ──────────────────────────────────────────────────────
const ROLE_COLOR: Record<string, string> = {
  candidate:    '#F59E0B',
  freelancer:   '#10B981',
  company:      '#3B82F6',
  organization: '#8B5CF6',
};

const useAccent = () => {
  const { role } = useAuthStore();
  return ROLE_COLOR[role ?? 'candidate'] ?? '#F59E0B';
};

// ─── Check row ────────────────────────────────────────────────────────────────
const CheckRow: React.FC<{
  label: string;
  done: boolean;
  description: string;
  accent: string;
}> = ({ label, done, description, accent }) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;
  return (
    <View style={[vs.checkRow, { borderColor: colors.border }]}>
      <View style={[vs.checkIcon, { backgroundColor: done ? accent + '20' : colors.border + '40' }]}>
        <Ionicons
          name={done ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={done ? accent : colors.textMuted}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[vs.checkLabel, { color: colors.text, fontSize: typography.base }]}>{label}</Text>
        <Text style={[vs.checkDesc,  { color: colors.textMuted, fontSize: typography.xs }]}>{description}</Text>
      </View>
      {done && (
        <View style={[vs.doneBadge, { backgroundColor: accent + '15' }]}>
          <Text style={[vs.doneText, { color: accent, fontSize: typography.xs }]}>Done</Text>
        </View>
      )}
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const VerificationStatusScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<any>();
  const accent = useAccent();

  const { data, isLoading, refetch, isError } = useQuery({
    queryKey: ['verification', 'me'],
    queryFn: async () => {
      const res = await verificationService.getMyStatus();
      return res ?? VERIFICATION_FALLBACK ?? {
        verificationStatus: 'none' as const,
        verificationDetails: { profileVerified: false, socialVerified: false, documentsVerified: false, emailVerified: false, phoneVerified: false },
        verificationMessage: '',
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: (count, err: any) => err?.response?.status === 404 ? false : count < 1,
  });

  const status  = data?.verificationStatus ?? 'none';
  const details = data?.verificationDetails;
  const badge   = verificationService.getBadgeConfig(status);
  const progress = details ? verificationService.calculateProgress(details) : 0;

  const checks = details ? [
    { label: 'Profile Verified',   done: details.profileVerified,   description: 'Your basic profile information is complete and reviewed.' },
    { label: 'Email Verified',     done: details.emailVerified,     description: 'Your email address has been confirmed.' },
    { label: 'Phone Verified',     done: details.phoneVerified,     description: 'Your phone number has been confirmed.' },
    { label: 'Documents Verified', done: details.documentsVerified, description: 'Identity or business documents have been reviewed.' },
    { label: 'Social Verified',    done: details.socialVerified,    description: 'Your social profiles have been linked and verified.' },
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[vs.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={vs.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[vs.headerTitle, { color: colors.text, fontSize: typography.lg }]}>Verification</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={vs.center}>
          <ActivityIndicator color={accent} size="large" />
        </View>
      ) : isError ? (
        <View style={vs.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
          <Text style={[vs.emptyText, { color: colors.textMuted, fontSize: typography.base }]}>Failed to load</Text>
          <TouchableOpacity style={[vs.retryBtn, { borderColor: accent }]} onPress={() => refetch()}>
            <Text style={[{ color: accent, fontWeight: '600', fontSize: typography.sm }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing[5] }} showsVerticalScrollIndicator={false}>
          {/* Status card */}
          <View style={[vs.statusCard, { backgroundColor: badge.color + '12', borderColor: badge.color + '40' }]}>
            <Ionicons name={badge.icon as any} size={40} color={badge.color} />
            <Text style={[vs.statusLabel, { color: badge.color, fontSize: typography.xl }]}>{badge.label}</Text>
            {data?.verificationMessage ? (
              <Text style={[vs.statusMsg, { color: colors.textMuted, fontSize: typography.sm }]}>
                {data.verificationMessage}
              </Text>
            ) : null}

            {/* Progress bar */}
            <View style={[vs.progBarBg, { backgroundColor: colors.border, marginTop: 14 }]}>
              <View style={[vs.progBarFill, { width: `${progress}%` as any, backgroundColor: badge.color }]} />
            </View>
            <Text style={[vs.progLabel, { color: colors.textMuted, fontSize: typography.xs }]}>
              {progress}% complete
            </Text>
          </View>

          {/* Checks */}
          <Text style={[vs.sectionTitle, { color: colors.text, fontSize: typography.base, marginTop: 8 }]}>
            Verification Checklist
          </Text>
          <View style={[vs.checkList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {checks.map((c, i) => (
              <CheckRow key={c.label} {...c} accent={accent} />
            ))}
          </View>

          {/* CTA */}
          {status !== 'full' && (
            <TouchableOpacity
              style={[vs.ctaBtn, { backgroundColor: accent }]}
              onPress={() => navigation.navigate('RequestVerification')}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color="#fff" />
              <Text style={[vs.ctaText, { color: '#fff', fontSize: typography.base }]}>
                Request Verification
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const vs = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52, borderBottomWidth: 1 },
  headerTitle: { fontWeight: '700' },
  backBtn:     { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText:   { textAlign: 'center' },
  retryBtn:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 8, marginTop: 4 },
  statusCard:  { borderWidth: 1, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
  statusLabel: { fontWeight: '800', marginTop: 10, marginBottom: 4 },
  statusMsg:   { textAlign: 'center', lineHeight: 20 },
  progBarBg:   { width: '100%', height: 8, borderRadius: 99, overflow: 'hidden' },
  progBarFill: { height: 8, borderRadius: 99 },
  progLabel:   { marginTop: 6 },
  sectionTitle:{ fontWeight: '700', marginBottom: 12 },
  checkList:   { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  checkRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  checkIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkLabel:  { fontWeight: '600', marginBottom: 2 },
  checkDesc:   { lineHeight: 16 },
  doneBadge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  doneText:    { fontWeight: '600' },
  ctaBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 20 },
  ctaText:     { fontWeight: '700' },
});

// Re-export for import convenience
export { VERIFICATION_FALLBACK };