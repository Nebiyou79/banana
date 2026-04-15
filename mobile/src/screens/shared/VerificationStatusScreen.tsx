/**
 * src/screens/shared/VerificationStatusScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium mobile verification dashboard.
 * Skeleton loading states, FlashList for checklist, haptic-ready CTAs.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
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
  width = '100%', height = 16, radius = 8,
}) => {
  const { theme } = useThemeStore();
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
        width: typeof width === 'string'
          ? width.endsWith('%')
            ? `${parseFloat(width)}%` as `${number}%`
            : width
          : width,
        height,
        borderRadius: radius,
        backgroundColor: theme.colors.border,
        opacity: anim,
      }}
    />
  );
};

const SkeletonCard = () => (
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
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius, shadows, spacing } = theme;
  const { role }  = useAuthStore();
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
      <View style={[ci.row, { borderBottomColor: colors.border }]}>
        <View style={[ci.icon, { backgroundColor: done ? accent + '18' : colors.border + '40', borderRadius: borderRadius.md }]}>
          <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={done ? accent : colors.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text }}>{item.label}</Text>
          <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 2, lineHeight: 15 }}>{item.description}</Text>
        </View>
        <View style={[ci.badge, { backgroundColor: done ? accent + '18' : colors.border + '40', borderRadius: 99 }]}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: done ? accent : colors.textMuted }}>
            {done ? 'Done' : 'Pending'}
          </Text>
        </View>
      </View>
    );
  }, [details, accent, colors, typography, borderRadius]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>Verification</Text>
          <View style={{ width: 24 }} />
        </View>
        <SkeletonCard />
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="cloud-offline-outline" size={52} color={colors.textMuted} />
        <Text style={{ color: colors.textMuted, fontSize: typography.base, marginTop: 12 }}>Failed to load status</Text>
        <TouchableOpacity onPress={() => refetch()} style={[s.retryBtn, { borderColor: accent, borderRadius: borderRadius.lg, marginTop: 16 }]}>
          <Text style={{ color: accent, fontWeight: '700', fontSize: typography.sm }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>Verification</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Ionicons name="refresh-outline" size={22} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[4] ?? 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Status hero card */}
        <View style={[s.heroCard, { backgroundColor: badge.color + '12', borderColor: badge.color + '35', borderRadius: borderRadius.xl, ...shadows.md }]}>
          <View style={[s.heroBadgeIcon, { backgroundColor: badge.color + '20' }]}>
            <Ionicons name={badge.icon as any} size={36} color={badge.color} />
          </View>
          <Text style={{ fontSize: typography.xl, fontWeight: '800', color: badge.color, marginTop: 12 }}>
            {badge.label}
          </Text>
          {safeData.verificationMessage ? (
            <Text style={{ fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>
              {safeData.verificationMessage}
            </Text>
          ) : null}

          {/* Progress bar */}
          <View style={[s.progBg, { backgroundColor: colors.border + '60', marginTop: 18 }]}>
            <View style={[s.progFill, { width: `${progress}%` as any, backgroundColor: badge.color }]} />
          </View>
          <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 8 }}>
            {progress}% complete
          </Text>

          {/* Last verified */}
          {details.lastVerified && (
            <Text style={{ fontSize: typography.xs, color: colors.textMuted, marginTop: 6, fontStyle: 'italic' }}>
              Last verified: {new Date(details.lastVerified).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          )}
        </View>

        {/* Admin notes */}
        {details.verificationNotes && (
          <View style={[s.noteCard, { backgroundColor: colors.infoLight ?? '#EFF6FF', borderRadius: borderRadius.lg, marginTop: 16 }]}>
            <Ionicons name="clipboard-outline" size={15} color={colors.info ?? '#3B82F6'} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: typography.xs, fontWeight: '700', color: colors.info ?? '#3B82F6' }}>
                Admin Notes
              </Text>
              <Text style={{ fontSize: typography.xs, color: colors.info ?? '#3B82F6', lineHeight: 16, marginTop: 3 }}>
                {details.verificationNotes}
              </Text>
            </View>
          </View>
        )}

        {/* Checklist */}
        <Text style={{ fontSize: typography.base, fontWeight: '700', color: colors.text, marginTop: 24, marginBottom: 12 }}>
          Verification Checklist
        </Text>
        <View style={[s.checkList, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.xl, ...shadows.sm }]}>
          <FlashList
            data={CHECK_ITEMS}
            scrollEnabled={false}
            renderItem={renderCheckItem}
          />
        </View>

        {/* CTA */}
        {canRequest && (
          <TouchableOpacity
            onPress={() => navigation.navigate('RequestVerification')}
            style={[s.ctaBtn, { backgroundColor: accent, borderRadius: borderRadius.xl, marginTop: 24, ...shadows.lg }]}
            activeOpacity={0.87}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
            <Text style={{ fontSize: typography.base, fontWeight: '700', color: '#fff', marginLeft: 10 }}>
              {status === 'none' ? 'Start Verification' : 'Complete Verification'}
            </Text>
          </TouchableOpacity>
        )}

        {status === 'full' && (
          <View style={[s.fullyVerifiedBanner, { backgroundColor: '#D1FAE5', borderRadius: borderRadius.xl, marginTop: 24 }]}>
            <Ionicons name="checkmark-circle" size={22} color="#059669" />
            <Text style={{ fontSize: typography.sm, fontWeight: '700', color: '#059669', marginLeft: 10 }}>
              Your account is fully verified ✓
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  heroCard:   { borderWidth: 1, padding: 24, alignItems: 'center' },
  heroBadgeIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  progBg:     { width: '100%', height: 8, borderRadius: 99, overflow: 'hidden' },
  progFill:   { height: 8, borderRadius: 99 },
  noteCard:   { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderWidth: 1, borderColor: '#BFDBFE' },
  checkList:  { borderWidth: 1, overflow: 'hidden' },
  ctaBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  fullyVerifiedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  retryBtn:   { paddingHorizontal: 24, paddingVertical: 12, borderWidth: 1.5 },
});

const ci = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  icon:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: { paddingHorizontal: 10, paddingVertical: 4 },
});
