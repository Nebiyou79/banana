// src/components/proposals/ProposalCard.tsx
// Banana Mobile App — Module 6B: Proposals
// Card component for both freelancer (my proposals) and company (received proposals) list views.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Image,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { ProposalStatusBadge } from './ProposalStatusBadge';
import type { ProposalListItem, ProposalTender, ProposalUser } from '../../types/proposal';

interface ProposalCardProps {
  proposal: ProposalListItem;
  viewMode: 'freelancer' | 'company';
  onPress?: () => void;
  onShortlistToggle?: () => void;
  style?: ViewStyle;
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor(diff / 3_600_000);
  if (d > 30) return `${Math.floor(d / 30)}mo ago`;
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  return 'Just now';
}

function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  viewMode,
  onPress,
  onShortlistToggle,
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;

  // Safe extraction of populated fields
  const freelancer =
    typeof proposal.freelancer === 'object'
      ? (proposal.freelancer as ProposalUser)
      : null;
  const freelancerProfile =
    typeof proposal.freelancerProfile === 'object'
      ? (proposal.freelancerProfile as { headline?: string; ratings?: { average: number; count: number } })
      : null;
  const tender =
    typeof proposal.tender === 'object'
      ? (proposal.tender as ProposalTender)
      : null;

  const isAwarded = proposal.status === 'awarded';
  const isRejected = proposal.status === 'rejected';

  // What to show in the title area depends on view mode
  const titleText =
    viewMode === 'freelancer'
      ? tender?.title ?? 'Untitled Tender'
      : freelancer?.name ?? 'Freelancer';

  const subtitleText =
    viewMode === 'freelancer'
      ? (() => {
          const owner = tender?.ownerEntity;
          if (typeof owner === 'object' && owner !== null) {
            return (owner as { name?: string }).name ?? tender?.ownerEntityModel ?? '';
          }
          return tender?.ownerEntityModel ?? '';
        })()
      : freelancerProfile?.headline ?? freelancer?.location ?? '';

  const avatarUrl =
    viewMode === 'freelancer' ? null : freelancer?.avatar ?? null;
  const avatarInitials =
    viewMode === 'freelancer'
      ? (tender?.title ?? 'T').charAt(0).toUpperCase()
      : getInitials(freelancer?.name);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: isAwarded
            ? '#10B981'
            : proposal.isShortlisted
            ? 'rgba(241,187,3,0.5)'
            : colors.border,
        },
        style,
      ]}
    >
      {/* Top accent strip */}
      <View
        style={[
          styles.accentStrip,
          {
            backgroundColor: isAwarded
              ? '#10B981'
              : isRejected
              ? '#EF4444'
              : proposal.isShortlisted
              ? '#F1BB03'
              : proposal.status === 'under_review'
              ? '#3B82F6'
              : 'transparent',
          },
        ]}
      />

      {/* Awarded banner */}
      {isAwarded && (
        <View style={styles.awardedBanner}>
          <Text style={styles.awardedText}>🏆 Contract Awarded</Text>
        </View>
      )}
      {proposal.isShortlisted && !isAwarded && (
        <View style={[styles.shortlistedBanner, { backgroundColor: 'rgba(241,187,3,0.08)' }]}>
          <Text style={[styles.shortlistedText, { color: '#D97706' }]}>⭐ Shortlisted</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Header row */}
        <View style={styles.headerRow}>
          {/* Avatar */}
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isAwarded
                  ? 'rgba(16,185,129,0.15)'
                  : 'rgba(241,187,3,0.15)',
              },
            ]}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImg}
              />
            ) : (
              <Text
                style={[
                  styles.avatarText,
                  { color: isAwarded ? '#059669' : '#D97706' },
                ]}
              >
                {avatarInitials}
              </Text>
            )}
          </View>

          {/* Title + subtitle */}
          <View style={styles.titleBlock}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {titleText}
            </Text>
            {subtitleText ? (
              <Text
                style={[styles.subtitle, { color: colors.textMuted }]}
                numberOfLines={1}
              >
                {subtitleText}
              </Text>
            ) : null}
          </View>

          {/* Status badge + shortlist for company view */}
          <View style={styles.rightActions}>
            <ProposalStatusBadge status={proposal.status} size="sm" />
            {viewMode === 'company' && onShortlistToggle && (
              <TouchableOpacity
                onPress={onShortlistToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.shortlistBtn}
              >
                <Text style={styles.shortlistIcon}>
                  {proposal.isShortlisted ? '⭐' : '☆'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bid amount */}
        <Text style={[styles.amount, { color: '#F1BB03' }]}>
          {formatAmount(proposal.proposedAmount, proposal.currency ?? 'ETB')}
          {proposal.bidType === 'hourly' ? '/hr' : ''}
        </Text>

        {/* Meta pills */}
        <View style={styles.pills}>
          {proposal.deliveryTime && (
            <View
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.pillText, { color: colors.textMuted }]}>
                ⏱ {proposal.deliveryTime.value} {proposal.deliveryTime.unit}
              </Text>
            </View>
          )}
          {proposal.availability && (
            <View
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.pillText, { color: colors.textMuted }]}>
                {proposal.availability === 'full-time'
                  ? 'Full-time'
                  : proposal.availability === 'part-time'
                  ? 'Part-time'
                  : 'Flexible'}
              </Text>
            </View>
          )}
          {viewMode === 'company' && freelancerProfile?.ratings && (
            <View
              style={[
                styles.pill,
                { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' },
              ]}
            >
              <Text style={[styles.pillText, { color: '#D97706' }]}>
                ⭐ {freelancerProfile.ratings.average.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Cover letter excerpt */}
        {proposal.coverLetter && (
          <Text
            style={[styles.coverExcerpt, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {proposal.coverLetter}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          {proposal.submittedAt && (
            <Text style={[styles.footerMeta, { color: colors.textMuted }]}>
              {viewMode === 'freelancer' ? 'Submitted' : 'Applied'}{' '}
              {timeAgo(proposal.submittedAt)}
            </Text>
          )}
          <Text style={[styles.viewMore, { color: '#F1BB03' }]}>
            View details →
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  accentStrip: {
    height: 3,
    width: '100%',
  },
  awardedBanner: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  awardedText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  shortlistedBanner: {
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  shortlistedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  body: {
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '800',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  rightActions: {
    alignItems: 'flex-end',
    gap: 6,
    flexShrink: 0,
  },
  shortlistBtn: {
    padding: 2,
  },
  shortlistIcon: {
    fontSize: 18,
  },
  amount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  coverExcerpt: {
    fontSize: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  footerMeta: {
    fontSize: 11,
  },
  viewMore: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ProposalCard;
