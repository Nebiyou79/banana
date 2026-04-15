/**
 * ProfileAtoms.tsx
 * Shared atomic components for all three role dashboards & profiles.
 * ─ ProfileHeader       – cover + avatar + badge + edit CTA
 * ─ StatTile            – icon + big number + label card
 * ─ SkeletonCard        – animated placeholder rectangle
 * ─ SectionBlock        – titled, bordered content container
 * ─ VerificationPill    – coloured status badge
 * ─ RoleBadge           – coloured role label
 */

import React, { useEffect, useRef, ReactNode } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  Animated, ViewStyle, TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProfileHeaderProps {
  name:            string;
  headline?:       string;
  avatarUrl?:      string | null;
  coverUrl?:       string | null;
  accentColor:     string;
  verifiedFull?:   boolean;
  onEdit?:         () => void;
  rightSlot?:      ReactNode;   // optional badge/stat in top-right corner
}

export interface StatTileProps {
  label:   string;
  value:   number | string;
  icon:    string;             // Ionicons name
  color:   string;
  onPress?: () => void;
}

export interface SkeletonCardProps {
  height?:  number;
  radius?:  number;
  style?:   ViewStyle;
}

export interface SectionBlockProps {
  title:    string;
  children: ReactNode;
  style?:   ViewStyle;
  action?:  { label: string; onPress: () => void };
}

export type VerificationStatus = 'none' | 'partial' | 'full';

export interface VerificationPillProps {
  status: VerificationStatus;
}

export interface RoleBadgeProps {
  role:        string;
  accentColor: string;
}

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  height = 80,
  radius = 14,
  style,
}) => {
  const { theme } = useThemeStore();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View
      style={[
        { height, borderRadius: radius, backgroundColor: theme.colors.skeleton, opacity: anim },
        style,
      ]}
    />
  );
};

// ─── StatTile ─────────────────────────────────────────────────────────────────

export const StatTile: React.FC<StatTileProps> = React.memo(
  ({ label, value, icon, color, onPress }) => {
    const { theme } = useThemeStore();
    const { colors, typography } = theme;

    return (
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress}
        style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[s.statIcon, { backgroundColor: color + '1A' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={[s.statVal, { color: colors.text }]}>{value}</Text>
        <Text style={[s.statLbl, { color: colors.textMuted, fontSize: typography.xs }]}>{label}</Text>
      </TouchableOpacity>
    );
  },
);

// ─── ProfileHeader ────────────────────────────────────────────────────────────

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  headline,
  avatarUrl,
  coverUrl,
  accentColor,
  verifiedFull = false,
  onEdit,
  rightSlot,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View>
      {/* Cover */}
      <View style={[s.cover, { backgroundColor: accentColor + '28' }]}>
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : null}
        {/* Gradient overlay */}
        <View style={[StyleSheet.absoluteFillObject, s.coverOverlay]} />
      </View>

      {/* Avatar row */}
      <View style={[s.avatarRow, { paddingHorizontal: spacing[5] }]}>
        <View style={[s.avatarWrap, { borderColor: colors.background }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={s.avatar} />
          ) : (
            <View style={[s.avatar, { backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: typography.xl }}>{initials}</Text>
            </View>
          )}
          {verifiedFull && (
            <View style={[s.verifiedBadge, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
        </View>

        {rightSlot ?? null}

        {onEdit && (
          <TouchableOpacity
            style={[s.editBtn, { backgroundColor: accentColor }]}
            onPress={onEdit}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={14} color="#fff" />
            <Text style={[s.editBtnText, { fontSize: typography.sm }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Name + headline */}
      <View style={{ paddingHorizontal: spacing[5], marginTop: 6 }}>
        <Text style={[s.name, { color: colors.text, fontSize: typography['2xl'] }]}>{name}</Text>
        {headline ? (
          <Text style={[s.headline, { color: colors.textMuted, fontSize: typography.sm }]}>{headline}</Text>
        ) : null}
      </View>
    </View>
  );
};

// ─── SectionBlock ─────────────────────────────────────────────────────────────

export const SectionBlock: React.FC<SectionBlockProps> = ({
  title,
  children,
  style,
  action,
}) => {
  const { theme } = useThemeStore();
  const { colors, typography } = theme;

  return (
    <View style={[s.sectionBlock, { borderTopColor: colors.border }, style]}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionTitle, { color: colors.text, fontSize: typography.base }]}>{title}</Text>
        {action ? (
          <TouchableOpacity onPress={action.onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: colors.primary, fontSize: typography.xs, fontWeight: '600' }}>{action.label}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {children}
    </View>
  );
};

// ─── VerificationPill ─────────────────────────────────────────────────────────

const V_CONFIG: Record<VerificationStatus, { color: string; label: string; icon: string }> = {
  full:    { color: '#10B981', label: 'Verified',         icon: 'shield-checkmark' },
  partial: { color: '#F59E0B', label: 'Partial',          icon: 'shield-half' },
  none:    { color: '#94A3B8', label: 'Not Verified',     icon: 'shield-outline' },
};

export const VerificationPill: React.FC<VerificationPillProps> = ({ status }) => {
  const { color, label, icon } = V_CONFIG[status];
  return (
    <View style={[s.pill, { backgroundColor: color + '1A', borderColor: color + '40' }]}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text style={[s.pillText, { color }]}>{label}</Text>
    </View>
  );
};

// ─── RoleBadge ────────────────────────────────────────────────────────────────

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, accentColor }) => (
  <View style={[s.roleBadge, { backgroundColor: accentColor + '1A' }]}>
    <Text style={[s.roleBadgeText, { color: accentColor }]}>{role}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // cover
  cover:         { height: 148 },
  coverOverlay:  { backgroundColor: 'rgba(0,0,0,0.08)' },
  // avatar
  avatarRow:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: -44, marginBottom: 8 },
  avatarWrap:    { width: 88, height: 88, borderRadius: 44, borderWidth: 3, overflow: 'hidden' },
  avatar:        { width: '100%', height: '100%' },
  verifiedBadge: { position: 'absolute', bottom: 2, right: 2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  // name
  name:     { fontWeight: '800', letterSpacing: -0.4, marginBottom: 2 },
  headline: { lineHeight: 18, marginBottom: 4 },
  // edit btn
  editBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99 },
  editBtnText: { color: '#fff', fontWeight: '700' },
  // stat tile
  statCard: { flex: 1, minWidth: '44%', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statVal:  { fontWeight: '800', fontSize: 24 },
  statLbl:  { fontWeight: '500', textAlign: 'center' },
  // section block
  sectionBlock:  { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 18, marginTop: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontWeight: '700' },
  // pill
  pill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1 },
  pillText: { fontSize: 11, fontWeight: '600' },
  // role badge
  roleBadge:     { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, marginTop: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
});