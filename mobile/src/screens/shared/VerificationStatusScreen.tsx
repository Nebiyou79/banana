// src/screens/shared/VerificationStatusScreen.tsx
// MIGRATED: useTheme() only, AppHeader, spacing/radius tokens, Ionicons only, FlashList

import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { useAuthStore } from '../../store/authStore';
import { AppHeader } from '../../components/ui/AppHeader';
import {
  useMyVerificationStatus,
} from '../../hooks/useVerification';
import { verificationService, VERIFICATION_FALLBACK, VerificationDetails } from '../../services/verificationService';

const ROLE_COLOR: Record<string, string> = {
  candidate:    '#F59E0B',
  freelancer:   '#10B981',
  company:      '#3B82F6',
  organization: '#8B5CF6',
  admin:        '#EF4444',
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
        Animated.timing(anim, { toValue: 1,   duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        width:         width as any,
        height,
        borderRadius:  r,
        backgroundColor: c.skeleton,
        opacity:       anim,
      }}
    />
  );
};

const SkeletonCard = () => {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: 14, padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Skeleton width={64} height={64} radius={32} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton height={18} width="60%" />
          <Skeleton height={13} width="40%" />
        </View>
      </View>
      <Skeleton height={10} />
      <Skeleton height={10} width="80%" />
      {[...Array(5)].map((_, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
          <Skeleton width={38} height={38} radius={10} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton height={13} width="55%" />
            <Skeleton height={11} width="70%" />
          </View>
          <Skeleton width={52} height={22} radius={12} />
        </View>
      ))}
    </View>
  );
};

// ─── Check item ───────────────────────────────────────────────────────────────
interface CheckItem {
  key: keyof VerificationDetails;
  label: string;
  description: string;
}

const CHECK_ITEMS: CheckItem[] = [
  { key: 'profileVerified',   label: 'Profile Verified',   description: 'Basic profile information is complete and reviewed.' },
  { key: 'emailVerified',     label: 'Email Verified',     description: 'Your email address has been confirmed.' },
  { key: 'phoneVerified',     label: 'Phone Verified',     description: 'Your phone number has been confirmed.' },
  { key: 'documentsVerified', label: 'Documents Verified', description: 'Identity or business documents have been reviewed.' },
  { key: 'socialVerified',    label: 'Social Verified',    description: 'Your social profiles have been linked and verified.' },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export const VerificationStatusScreen: React.FC = () => {
  const { colors: c, spacing, radius, type, shadows } = useTheme();
  const insets     = useSafeAreaInsets();
  const { role }   = useAuthStore();
  const navigation = useNavigation<any>();
  const accent     = ROLE_COLOR[role ?? 'candidate'] ?? '#F59E0B';

  const { data, isLoading, refetch, isError } = useMyVerificationStatus();

  const safeData = data ?? VERIFICATION_FALLBACK;
  const status   = safeData.verificationStatus;
  const details  = safeData.verificationDetails;
  const badge    = verificationService.getBadgeConfig(status);
  const progress = verificationService.calculateProgress(details);
  const canRequest = verificationService.canRequestVerification(status, details.lastVerified);

  const renderCheckItem = useCallback(({ item }: { item: CheckItem }) => {
    const done = details[item.key] as boolean;
    return (
      <View style={[ci.row, { borderBottomColor: c.border }]}>
        <View style={[ci.icon, { backgroundColor: done ? withAlpha(accent, 0.18) : withAlpha(c.border, 0.4), borderRadius: radius.md }]}>
          <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={done ? accent : c.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[type.bodySm, { color: c.text, fontWeight: '700' }]}>{item.label}</Text>
          <Text style={[type.caption, { color: c.textMuted, marginTop: 2, lineHeight: 15 }]}>{item.description}</Text>
        </View>
        <View style={[ci.badge, { backgroundColor: done ? withAlpha(accent, 0.18) : withAlpha(c.border, 0.4), borderRadius: 99 }]}>
          <Text style={[type.caption, { color: done ? accent : c.textMuted, fontWeight: '700' }]}>
            {done ? 'Done' : 'Pending'}
          </Text>
        </View>
      </View>
    );
  }, [details, accent, c, type, radius]);

  if (isLoading) {
    return (
      <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <AppHeader
          title="Verification"
          showBack
          onBack={() => navigation.goBack()}
          rightAction={<TouchableOpacity onPress={() => refetch()} hitSlop={8}><Ionicons name="refresh-outline" size={22} color={c.textMuted} /></TouchableOpacity>}
        />
        <SkeletonCard />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top', 'bottom']}>
        <AppHeader title="Verification" showBack onBack={() => navigation.goBack()} />
        <View style={S.center}>
          <Ionicons name="cloud-offline-outline" size={52} color={c.textMuted} />
          <Text style={[type.bodySm, { color: c.textMuted, marginTop: spacing.md }]}>Failed to load status</Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={[S.retryBtn, { borderColor: accent, borderRadius: radius.lg }]}
          >
            <Text style={[type.bodySm, { color: accent, fontWeight: '700' }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[S.safe, { backgroundColor: c.bg }]} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <AppHeader
        title="Verification"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={<TouchableOpacity onPress={() => refetch()} hitSlop={8}><Ionicons name="refresh-outline" size={22} color={c.textMuted} /></TouchableOpacity>}
      />

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status hero */}
        <View style={[S.heroCard, { backgroundColor: withAlpha(badge.color, 0.12), borderColor: withAlpha(badge.color, 0.35), borderRadius: radius.xl, ...shadows.md }]}>
          <View style={[S.heroBadgeIcon, { backgroundColor: withAlpha(badge.color, 0.20) }]}>
            <Ionicons name={badge.icon as any} size={36} color={badge.color} />
          </View>
          <Text style={[type.h2, { color: badge.color, marginTop: spacing.md, fontWeight: '800' }]}>
            {badge.label}
          </Text>
          {safeData.verificationMessage ? (
            <Text style={[type.bodySm, { color: c.textMuted, textAlign: 'center', marginTop: spacing.sm, lineHeight: 20 }]}>
              {safeData.verificationMessage}
            </Text>
          ) : null}

          {/* Progress bar */}
          <View style={[S.progBg, { backgroundColor: withAlpha(c.border, 0.6), marginTop: spacing.lg }]}>
            <View style={[S.progFill, { width: `${progress}%` as any, backgroundColor: badge.color }]} />
          </View>
          <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm }]}>
            {progress}% complete
          </Text>

          {details.lastVerified && (
            <Text style={[type.caption, { color: c.textMuted, marginTop: spacing.sm, fontStyle: 'italic' }]}>
              Last verified: {new Date(details.lastVerified).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </View>

        {/* Admin notes */}
        {details.verificationNotes && (
          <View style={[S.noteCard, { backgroundColor: c.infoBg, borderRadius: radius.lg, borderColor: withAlpha(c.info, 0.3), marginTop: spacing.lg }]}>
            <Ionicons name="clipboard-outline" size={15} color={c.info} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={[type.caption, { color: c.info, fontWeight: '700' }]}>Admin Notes</Text>
              <Text style={[type.caption, { color: c.info, lineHeight: 16, marginTop: 3 }]}>{details.verificationNotes}</Text>
            </View>
          </View>
        )}

        {/* Checklist */}
        <Text style={[type.bodySm, { color: c.text, fontWeight: '700', marginTop: spacing.xl, marginBottom: spacing.md }]}>
          Verification Checklist
        </Text>
        <View style={[S.checkList, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.xl, ...shadows.sm }]}>
          <FlashList
            data={CHECK_ITEMS}
            scrollEnabled={false}
            renderItem={renderCheckItem}
            keyExtractor={item => item.key}
          />
        </View>

        {/* CTA */}
        {canRequest && (
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestVerification')}
            style={[S.ctaBtn, { backgroundColor: accent, borderRadius: radius.xl, marginTop: spacing.xl, ...shadows.lg }]}
            activeOpacity={0.87}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color={c.textInverse} />
            <Text style={[type.body, { color: c.textInverse, fontWeight: '700', marginLeft: spacing.sm }]}>
              {status === 'none' ? 'Start Verification' : 'Complete Verification'}
            </Text>
          </TouchableOpacity>
        )}

        {status === 'full' && (
          <View style={[S.fullyVerifiedBanner, { backgroundColor: c.successBg, borderRadius: radius.xl, marginTop: spacing.xl }]}>
            <Ionicons name="checkmark-circle" size={22} color={c.success} />
            <Text style={[type.bodySm, { color: c.success, fontWeight: '700', marginLeft: spacing.sm }]}>
              Your account is fully verified
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  heroCard: { borderWidth: 1, padding: 24, alignItems: 'center' },
  heroBadgeIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  progBg:  { width: '100%', height: 8, borderRadius: 99, overflow: 'hidden' },
  progFill:{ height: 8, borderRadius: 99 },
  noteCard:{ flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderWidth: 1 },
  checkList:{ borderWidth: 1, overflow: 'hidden' },
  ctaBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  fullyVerifiedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  retryBtn:{ paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1.5 },
});

const ci = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge:{ paddingHorizontal: 10, paddingVertical: 4 },
});

export default VerificationStatusScreen;