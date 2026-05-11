// src/screens/company/professionalTenders/IncomingBidsScreen.tsx

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useProfessionalTender,
  useRevealProfessionalTender,
  useTenderBids,
} from '../../../hooks/useProfessionalTender';
import SealedBidBanner from '../../../components/professionalTenders/SealedBidBanner';
import {
  areSealedBidsViewable,
  type ProfessionalTenderBid,
} from '../../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTE PARAMS
// ═════════════════════════════════════════════════════════════════════════════

interface RouteParams {
  tenderId: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TONE HELPERS
// ═════════════════════════════════════════════════════════════════════════════

type Tone = 'neutral' | 'blue' | 'amber' | 'purple' | 'green' | 'red';

function useToneColors(tone: Tone, isDark: boolean, colors: ReturnType<typeof useTheme>['colors']) {
  switch (tone) {
    case 'neutral': return { bg: withAlpha(colors.textMuted, 0.15), fg: isDark ? colors.textSecondary : colors.textMuted };
    case 'blue':    return { bg: colors.infoBg,                      fg: colors.info };
    case 'amber':   return { bg: colors.warningBg,                   fg: colors.warning };
    case 'purple':  return { bg: withAlpha(colors.organization, 0.15), fg: colors.organization };
    case 'green':   return { bg: colors.successBg,                   fg: colors.success };
    case 'red':     return { bg: colors.dangerBg,                    fg: colors.danger };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
//  STATS BAR
// ═════════════════════════════════════════════════════════════════════════════

interface BidStats {
  total: number;
  submitted: number;
  underReview: number;
  shortlisted: number;
  awarded: number;
  rejected: number;
}

const computeStats = (bids: ProfessionalTenderBid[]): BidStats => {
  const stats: BidStats = { total: bids.length, submitted: 0, underReview: 0, shortlisted: 0, awarded: 0, rejected: 0 };
  for (const b of bids) {
    switch (b.status) {
      case 'submitted':    stats.submitted++; break;
      case 'under_review': stats.underReview++; break;
      case 'shortlisted':  stats.shortlisted++; break;
      case 'awarded':      stats.awarded++; break;
      case 'rejected':     stats.rejected++; break;
    }
  }
  return stats;
};

const StatPill: React.FC<{ label: string; value: number; tone: Tone }> = ({ label, value, tone }) => {
  const { colors, isDark } = useTheme();
  const { bg, fg } = useToneColors(tone, isDark, colors);
  return (
    <View style={[pillStyles.root, { backgroundColor: bg }]}>
      <Text style={[pillStyles.value, { color: fg }]}>{value}</Text>
      <Text style={[pillStyles.label, { color: fg }]}>{label}</Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  BID STATUS BADGE
// ═════════════════════════════════════════════════════════════════════════════

const BID_STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  submitted:           { label: 'Submitted',  tone: 'blue' },
  under_review:        { label: 'Under Review', tone: 'amber' },
  shortlisted:         { label: 'Shortlisted', tone: 'purple' },
  interview_scheduled: { label: 'Interview',   tone: 'purple' },
  awarded:             { label: 'Awarded',     tone: 'green' },
  rejected:            { label: 'Rejected',    tone: 'red' },
  withdrawn:           { label: 'Withdrawn',   tone: 'neutral' },
};

const BidStatusBadge: React.FC<{ label: string; tone: Tone }> = ({ label, tone }) => {
  const { colors, isDark } = useTheme();
  const { bg, fg } = useToneColors(tone, isDark, colors);
  return (
    <View style={[badgeStyles.root, { backgroundColor: bg }]}>
      <Text style={[badgeStyles.label, { color: fg }]}>{label.toUpperCase()}</Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  BID CARD
// ═════════════════════════════════════════════════════════════════════════════

const formatAmount = (amount?: number, currency: string = 'ETB'): string => {
  if (amount === undefined || amount === null) return '—';
  return `${amount.toLocaleString()} ${currency}`;
};

const resolveBidderName = (bid: ProfessionalTenderBid): string => {
  if (typeof bid.bidderCompany === 'object' && bid.bidderCompany?.name) {
    return bid.bidderCompany.name;
  }
  return 'Bidder';
};

const BidCard: React.FC<{
  bid: ProfessionalTenderBid;
  index: number;
  contentsHidden: boolean;
}> = ({ bid, index, contentsHidden }) => {
  const { colors } = useTheme();
  const statusMeta = BID_STATUS_LABELS[bid.status] ?? { label: bid.status, tone: 'neutral' as Tone };
  const submittedAt = new Date(bid.submittedAt);

  return (
    <View style={[cardStyles.root, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
      {/* Header */}
      <View style={cardStyles.head}>
        <View style={[cardStyles.indexBadge, { backgroundColor: colors.bg }]}>
          <Text style={[cardStyles.indexText, { color: colors.textMuted }]}>#{index + 1}</Text>
        </View>
        <View style={cardStyles.headText}>
          {contentsHidden ? (
            <View style={cardStyles.sealedRow}>
              <Ionicons name="lock-closed" size={13} color={colors.textMuted} />
              <Text style={[cardStyles.sealedLabel, { color: colors.textMuted }]}>
                Sealed bidder
              </Text>
            </View>
          ) : (
            <Text style={[cardStyles.bidderName, { color: colors.text }]} numberOfLines={1}>
              {resolveBidderName(bid)}
            </Text>
          )}
          <Text style={[cardStyles.submitted, { color: colors.textSecondary }]}>
            Submitted{' '}
            {submittedAt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })}
            {' · '}
            {submittedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <BidStatusBadge label={statusMeta.label} tone={statusMeta.tone} />
      </View>

      {/* Amount row */}
      <View style={[cardStyles.amountRow, { borderTopColor: colors.border }]}>
        <Text style={[cardStyles.amountLabel, { color: colors.textMuted }]}>BID AMOUNT</Text>
        {contentsHidden ? (
          <View style={cardStyles.sealedAmount}>
            <Ionicons name="lock-closed" size={14} color={colors.textMuted} />
            <Text style={[cardStyles.sealedAmountText, { color: colors.textMuted }]}>
              Hidden until reveal
            </Text>
          </View>
        ) : (
          <Text style={[cardStyles.amountValue, { color: colors.text }]}>
            {formatAmount(bid.bidAmount, bid.currency ?? 'ETB')}
          </Text>
        )}
      </View>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  EMPTY STATE
// ═════════════════════════════════════════════════════════════════════════════

const EmptyBids: React.FC<{ message: string; submessage?: string }> = ({ message, submessage }) => {
  const { colors } = useTheme();
  return (
    <View style={emptyStyles.root}>
      <View style={[emptyStyles.iconWrap, { backgroundColor: colors.bgCard }]}>
        <Ionicons name="people-outline" size={32} color={colors.textMuted} />
      </View>
      <Text style={[emptyStyles.title, { color: colors.text }]}>{message}</Text>
      {!!submessage && (
        <Text style={[emptyStyles.desc, { color: colors.textMuted }]}>{submessage}</Text>
      )}
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════

export const IncomingBidsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const tenderId = route.params?.tenderId;

  const { data: tenderData, isLoading: tenderLoading, refetch: refetchTender } =
    useProfessionalTender(tenderId);
  const tender = tenderData?.data;

  const sealedViewable = tender
    ? areSealedBidsViewable(tender.status, tender.workflowType)
    : true;
  const bidsAreFetchable = !!tender && (tender.workflowType === 'open' || sealedViewable);

  const {
    data: bidsData,
    isLoading: bidsLoading,
    refetch: refetchBids,
  } = useTenderBids(tenderId, { enabled: bidsAreFetchable });

  const revealMut = useRevealProfessionalTender();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchTender(),
      bidsAreFetchable ? refetchBids() : Promise.resolve(),
    ]);
    setRefreshing(false);
  }, [refetchTender, refetchBids, bidsAreFetchable]);

  const handleReveal = useCallback(() => {
    if (!tenderId) return;
    Alert.alert(
      'Reveal sealed bids?',
      'Once revealed, all bid amounts and bidder identities become visible. This action is permanent and is logged in the audit trail.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal Bids',
          onPress: async () => {
            try {
              await revealMut.mutateAsync(tenderId);
              await refetchBids();
            } catch (err: any) {
              Alert.alert('Couldn\'t reveal bids', err?.message ?? 'Please try again.');
            }
          },
        },
      ],
    );
  }, [tenderId, revealMut, refetchBids]);

  if (tenderLoading || !tender) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const allBids = bidsData ?? [];
  const contentsHidden = tender.workflowType === 'closed' && !sealedViewable;
  const stats = contentsHidden ? null : computeStats(allBids);
  const sealedCount = tender.bidCount ?? tender.metadata?.totalBids ?? 0;

  const listHeader = (
    <View style={styles.headerCol}>
      <SealedBidBanner
        workflowType={tender.workflowType}
        status={tender.status}
        isRevealed={tender.status === 'revealed' || tender.status === 'closed'}
        deadline={tender.deadline}
        isOwner
        isRevealing={revealMut.isPending}
        onReveal={handleReveal}
      />

      <View style={[styles.contextBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <Text style={[styles.contextLabel, { color: colors.textMuted }]}>BIDS FOR</Text>
        <Text style={[styles.contextTitle, { color: colors.text }]} numberOfLines={2}>
          {tender.title}
        </Text>
        {!!tender.referenceNumber && (
          <Text style={[styles.contextRef, { color: colors.textMuted, fontFamily: 'monospace' }]}>
            {tender.referenceNumber}
          </Text>
        )}
      </View>

      {!contentsHidden && stats && stats.total > 0 && (
        <View style={styles.statsRow}>
          <StatPill label="TOTAL"       value={stats.total}       tone="neutral" />
          <StatPill label="REVIEW"      value={stats.underReview} tone="amber" />
          <StatPill label="SHORTLISTED" value={stats.shortlisted} tone="purple" />
          <StatPill label="AWARDED"     value={stats.awarded}     tone="green" />
        </View>
      )}

      {contentsHidden && (
        <View style={[styles.sealedCountCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Ionicons name="lock-closed" size={20} color={colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sealedCountTitle, { color: colors.text }]}>
              {sealedCount} sealed bid{sealedCount === 1 ? '' : 's'} received
            </Text>
            <Text style={[styles.sealedCountDesc, { color: colors.textMuted }]}>
              Bid amounts and bidder identities are hidden until you reveal them.
            </Text>
          </View>
        </View>
      )}

      {bidsAreFetchable && bidsLoading && (
        <View style={styles.bidsLoadingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.bidsLoadingText, { color: colors.textMuted }]}>
            Loading bids…
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      <FlashList
        data={contentsHidden ? [] : allBids}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }: { item: ProfessionalTenderBid; index: number }) => (
          <BidCard bid={item} index={index} contentsHidden={false} />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          contentsHidden ? null : (
            <EmptyBids
              message="No bids yet"
              submessage={
                tender.status === 'draft'
                  ? 'Bids will appear here after the tender is published.'
                  : 'Bids will appear here as bidders submit them.'
              }
            />
          )
        }
        contentContainerStyle={{
          padding: 14,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerCol: { gap: 12, marginBottom: 4 },

  contextBar: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  contextLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  contextTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  contextRef:   { fontSize: 11 },

  statsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },

  sealedCountCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  sealedCountTitle: { fontSize: 13, fontWeight: '700' },
  sealedCountDesc:  { fontSize: 11, lineHeight: 15, marginTop: 2 },

  bidsLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  bidsLoadingText: { fontSize: 12 },
});

const cardStyles = StyleSheet.create({
  root: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  indexBadge: {
    width: 28, height: 28,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  indexText:  { fontSize: 11, fontWeight: '700' },
  headText:   { flex: 1, gap: 2 },
  bidderName: { fontSize: 14, fontWeight: '700' },
  submitted:  { fontSize: 11 },
  sealedRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sealedLabel:{ fontSize: 13, fontWeight: '600', fontStyle: 'italic' },

  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  amountLabel:      { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  amountValue:      { fontSize: 16, fontWeight: '800' },
  sealedAmount:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sealedAmountText: { fontSize: 12, fontWeight: '600', fontStyle: 'italic' },
});

const pillStyles = StyleSheet.create({
  root: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 22,
  },
  value: { fontSize: 11, fontWeight: '800' },
  label: { fontSize: 9,  fontWeight: '700', letterSpacing: 0.5 },
});

const emptyStyles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    gap: 8,
  },
  iconWrap: {
    width: 64, height: 64,
    borderRadius: 999,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 14, fontWeight: '700' },
  desc:  { fontSize: 12, textAlign: 'center', lineHeight: 17, maxWidth: 260 },
});

const badgeStyles = StyleSheet.create({
  root: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
});

export default IncomingBidsScreen;