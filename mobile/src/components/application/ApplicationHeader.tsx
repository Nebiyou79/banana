/**
 * src/components/application/ApplicationHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Gradient header for application detail screens.
 *
 * FIXED: Now uses the shared Avatar component for both candidate and company
 * avatars, ensuring consistent rendering and proper fallback behavior.
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha, formatShortDate } from '../../theme/utils';
import { SPACING, RADIUS } from '../../theme/tokens';
import {
  Application,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_COLORS_DARK,
} from '../../services/applicationService';
import { Avatar } from '../shared/Avatar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name?: string): string =>
  (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

/**
 * Build the appropriate Avatar entity based on role.
 * For candidate: shows candidate's avatar
 * For employer: shows company/organization logo
 */
const buildAvatarEntity = (application: Application, role: 'candidate' | 'employer') => {
  if (role === 'employer') {
    // Show candidate avatar
    return {
      type: 'candidate' as const,
      name: application.userInfo?.name ?? application.candidate?.name ?? 'Candidate',
      avatar: application.candidate?.avatar ?? (application.userInfo as any)?.avatar,
      profileImage: application.candidate?.avatar ?? (application.userInfo as any)?.profileImage,
    };
  }
  
  // Show company/organization logo
  const isOrg = application.job?.jobType === 'organization';
  const owner = isOrg
    ? (application.job?.organization as any)
    : (application.job?.company as any);

  if (!owner) {
    return {
      type: (isOrg ? 'organization' : 'company') as 'organization' | 'company',
      name: isOrg ? 'Organization' : 'Company',
    };
  }

  const logoUrl = 
    owner.logoUrl || 
    owner.logo || 
    owner.avatarUrl || 
    owner.avatar || 
    owner.imageUrl || 
    owner.profileImage;

  return {
    type: (isOrg ? 'organization' : 'company') as 'organization' | 'company',
    name: owner.name || (isOrg ? 'Organization' : 'Company'),
    logoUrl: typeof logoUrl === 'string' && logoUrl.startsWith('http') ? logoUrl : undefined,
    logo: typeof logoUrl === 'string' && logoUrl.startsWith('http') ? logoUrl : undefined,
    verified: owner.verified || false,
  };
};

// ─── Gradient palettes ────────────────────────────────────────────────────────

const CANDIDATE_GRADIENT: [string, string, string] = ['#1D4ED8', '#2563EB', '#0F2040'];
const EMPLOYER_GRADIENT:  [string, string, string] = ['#065F46', '#059669', '#0A2540'];

// ─── Props ────────────────────────────────────────────────────────────────────

interface ApplicationHeaderProps {
  application: Application;
  role: 'candidate' | 'employer';
  onBack: () => void;
  onShare?: () => void;
}

// ─── StatItem ─────────────────────────────────────────────────────────────────

interface StatItemProps {
  icon: string;
  label: string;
  value: string;
}

const StatItem = React.memo<StatItemProps>(({ icon, label, value }) => (
  <View style={stat.item}>
    <Ionicons name={icon as any} size={13} color="rgba(255,255,255,0.70)" />
    <Text style={stat.value}>{value}</Text>
    <Text style={stat.label}>{label}</Text>
  </View>
));
StatItem.displayName = 'ApplicationHeader.StatItem';

const stat = StyleSheet.create({
  item:  { flex: 1, alignItems: 'center', gap: 2 },
  value: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  label: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '600' },
});

// ─── Component ───────────────────────────────────────────────────────────────

export const ApplicationHeader: React.FC<ApplicationHeaderProps> = ({
  application,
  role,
  onBack,
  onShare,
}) => {
  const { colors: c, isDark } = useTheme();
  const isEmployer  = role === 'employer';
  const gradColors  = isEmployer ? EMPLOYER_GRADIENT : CANDIDATE_GRADIENT;

  // ── Status colours ─────────────────────────────────────────────────────────
  const SC          = isDark ? STATUS_COLORS_DARK : STATUS_COLORS;
  const sc          = SC[application.status as ApplicationStatus] ?? SC['applied'];
  const statusLabel =
    STATUS_LABELS[application.status as ApplicationStatus] ??
    application.status;

  // ✅ FIXED: Use shared Avatar entity builder
  const avatarEntity = useMemo(
    () => buildAvatarEntity(application, role),
    [application, role]
  );

  const isOrg = application.job?.jobType === 'organization';
  const owner = isOrg
    ? (application.job?.organization as any)
    : (application.job?.company as any);

  const mainName = isEmployer
    ? (application.userInfo?.name ??
       application.candidate?.name ??
       'Candidate')
    : (application.job?.title ?? 'Position');

  const subName = isEmployer
    ? (application.userInfo?.email ??
       application.candidate?.email ??
       '')
    : (owner?.name ?? '');

  const isVerified = !isEmployer && !!(owner?.verified);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const appliedDate = formatShortDate(application.createdAt);
  const cvCount     = application.selectedCVs?.length ?? 0;
  const refCount    = application.references?.length  ?? 0;
  const expCount    = application.workExperience?.length ?? 0;
  const jobType     = isOrg ? 'Org' : 'Company';

  // ── Memoised styles ────────────────────────────────────────────────────────
  const s = useMemo(
    () =>
      StyleSheet.create({
        gradient: { paddingBottom: 0 },

        nav: {
          flexDirection:     'row',
          alignItems:        'center',
          paddingHorizontal: SPACING.md,
          paddingTop:        14,
          paddingBottom:     SPACING.sm,
        },
        navBtn: {
          width:          44,
          height:         44,
          alignItems:     'center',
          justifyContent: 'center',
        },
        navTitle: {
          flex:       1,
          textAlign:  'center',
          color:      '#FFFFFF',
          fontWeight: '700',
          fontSize:   16,
        },

        heroRow: {
          flexDirection:     'row',
          alignItems:        'flex-start',
          gap:               14,
          paddingHorizontal: SPACING.lg,
          paddingVertical:   SPACING.md,
        },

        nameBlock: { flex: 1, gap: 4 },
        mainName:  { color: '#FFFFFF', fontSize: 18, fontWeight: '800', lineHeight: 22 },
        subName:   { color: withAlpha('#FFFFFF', 0.75), fontSize: 13 },

        statusPill: {
          flexDirection:     'row',
          alignItems:        'center',
          gap:               5,
          alignSelf:         'flex-start',
          paddingHorizontal: 10,
          paddingVertical:   4,
          borderRadius:      RADIUS.full,
          borderWidth:       1,
          marginTop:         2,
        },
        statusDot:  { width: 7, height: 7, borderRadius: 4 },
        statusText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

        statsBar: {
          flexDirection:     'row',
          backgroundColor:   withAlpha('#000000', 0.20),
          paddingVertical:   10,
          paddingHorizontal: SPACING.lg,
          alignItems:        'center',
        },
        statDivider: {
          width:            1,
          height:           28,
          backgroundColor:  withAlpha('#FFFFFF', 0.20),
          marginHorizontal: 4,
        },
      }),
    [isDark],
  );

  return (
    <LinearGradient
      colors={gradColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.gradient}
    >
      {/* Nav row */}
      <View style={s.nav}>
        <TouchableOpacity
          onPress={onBack}
          style={s.navBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={s.navTitle} numberOfLines={1}>
          {isEmployer ? 'Application Review' : 'My Application'}
        </Text>

        {onShare ? (
          <TouchableOpacity
            onPress={onShare}
            style={s.navBtn}
            accessibilityRole="button"
            accessibilityLabel="Share"
          >
            <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <View style={s.navBtn} />
        )}
      </View>

      {/* ✅ FIXED: Avatar + name block using shared Avatar component */}
      <View style={s.heroRow}>
        <Avatar
          entity={avatarEntity}
          size={64}
          borderRadius={RADIUS.lg}
          style={{ borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' }}
        />

        <View style={s.nameBlock}>
          <Text style={s.mainName} numberOfLines={2}>
            {mainName}
          </Text>

          {subName ? (
            <Text style={s.subName} numberOfLines={1}>
              {subName}
            </Text>
          ) : null}

          <View
            style={[
              s.statusPill,
              {
                backgroundColor: withAlpha(sc.dot, 0.19),
                borderColor:     withAlpha(sc.dot, 0.38),
              },
            ]}
          >
            <View style={[s.statusDot, { backgroundColor: sc.dot }]} />
            <Text style={s.statusText}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* Stats bar */}
      <View style={s.statsBar}>
        <StatItem icon="calendar-outline"      label="Applied" value={appliedDate} />
        <View style={s.statDivider} />
        <StatItem icon="document-text-outline" label="CVs"     value={String(cvCount)} />
        <View style={s.statDivider} />
        <StatItem icon="people-outline"        label="Refs"    value={String(refCount)} />
        <View style={s.statDivider} />
        <StatItem icon="briefcase-outline"     label="Exp"     value={String(expCount)} />

        {!isEmployer && (
          <>
            <View style={s.statDivider} />
            <StatItem icon="business-outline"  label="Type"    value={jobType} />
          </>
        )}
      </View>
    </LinearGradient>
  );
};