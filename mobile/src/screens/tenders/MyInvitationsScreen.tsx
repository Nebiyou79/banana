// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/MyInvitationsScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Shows all professional tender invitations received by the current company.
//
//  Backend: GET /professional-tenders/my-invitations
//           POST /professional-tenders/:id/invitations/:inviteId/respond
//
//  Features:
//   • Tab filter: Pending / Accepted / Declined / All
//   • Each card shows: tender title, ref number, deadline, status, issuer
//   • Accept / Decline actions with confirmation dialogs
//   • Tap card → navigate to the tender detail (BrowseProfessionalTenderDetail)
//   • Pull-to-refresh, pagination (load more on scroll end)
//   • useTheme() throughout — zero hardcoded colors
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { AppHeader } from '../../components/ui/AppHeader';
import {
  useMyInvitations,
  useRespondToInvitation,
} from '../../hooks/useProfessionalTender';
import type {
  TenderInvitation,
  TenderWithMyInvitation,
} from '../../types/professionalTender';

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterStatus = 'pending' | 'accepted' | 'declined' | 'all';

const FILTER_TABS: ReadonlyArray<{ key: FilterStatus; label: string }> = [
  { key: 'pending',  label: 'Pending'  },
  { key: 'accepted', label: 'Accepted' },
  { key: 'declined', label: 'Declined' },
  { key: 'all',      label: 'All'      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function deadlineLabel(iso: string): { text: string; urgent: boolean; past: boolean } {
  const d    = new Date(iso);
  const ms   = d.getTime() - Date.now();
  if (ms <= 0)         return { text: 'Deadline passed', urgent: false, past: true };
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 1)       return { text: 'Closes today',       urgent: true,  past: false };
  if (days <= 3)       return { text: `${days} days left`,  urgent: true,  past: false };
  return               { text: `${days} days left`,         urgent: false, past: false };
}

function statusColors(
  status: TenderInvitation['invitationStatus'],
  colors: ReturnType<typeof useTheme>['colors'],
): { fg: string; bg: string } {
  switch (status) {
    case 'pending':  return { fg: colors.warning,   bg: withAlpha(colors.warning, 0.12)   };
    case 'accepted': return { fg: colors.success,   bg: withAlpha(colors.success, 0.12)   };
    case 'declined': return { fg: colors.danger,    bg: withAlpha(colors.danger, 0.12)    };
    case 'expired':  return { fg: colors.textMuted, bg: withAlpha(colors.textMuted, 0.10) };
    default:         return { fg: colors.primary,   bg: withAlpha(colors.primary, 0.10)   };
  }
}

function tenderStatusColor(
  status: string,
  colors: ReturnType<typeof useTheme>['colors'],
): string {
  switch (status) {
    case 'published': return colors.success;
    case 'draft':     return colors.textMuted;
    case 'locked':    return colors.warning;
    case 'closed':    return colors.danger;
    case 'awarded':   return colors.secondary ?? colors.primary;
    default:          return colors.primary;
  }
}

// ─── Invitation card ──────────────────────────────────────────────────────────

interface InvitationCardProps {
  item:        TenderWithMyInvitation;
  onPress:     () => void;
  onAccept:    (inviteId: string) => void;
  onDecline:   (inviteId: string) => void;
  isMutating:  boolean;
}

const InvitationCard: React.FC<InvitationCardProps> = React.memo(
  ({ item, onPress, onAccept, onDecline, isMutating }) => {
    const { colors, radius, type, shadows } = useTheme();

    // We show one card per tender — the first matching invitation drives the CTA
    const primaryInvite = item.myInvitations[0];
    if (!primaryInvite) return null;

    const invStatus = primaryInvite.invitationStatus;
    const sc        = statusColors(invStatus, colors);
    const dl        = deadlineLabel(item.deadline);
    const isPending = invStatus === 'pending';
    const tColor    = tenderStatusColor(item.status, colors);
    const ownerName = item.owner?.name ?? 'Unknown issuer';

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          card.root,
          {
            backgroundColor: colors.surface,
            borderColor:     colors.border,
            borderRadius:    radius.lg,
            opacity:         pressed ? 0.92 : 1,
            ...shadows.sm,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Tender invitation: ${item.title}`}
      >
        {/* ── Header row: invitation status badge + tender status dot ── */}
        <View style={card.headerRow}>
          <View style={[card.invBadge, { backgroundColor: sc.bg, borderRadius: radius.full }]}>
            <Ionicons
              name={
                invStatus === 'accepted' ? 'checkmark-circle' :
                invStatus === 'declined' ? 'close-circle'     :
                invStatus === 'expired'  ? 'time'             :
                                           'mail-outline'
              }
              size={12}
              color={sc.fg}
            />
            <Text style={[type.caption, { color: sc.fg, fontWeight: '700', textTransform: 'capitalize' }]}>
              {invStatus}
            </Text>
          </View>

          {/* Tender status pill */}
          <View style={[card.tenderStatusPill, { backgroundColor: withAlpha(tColor, 0.10), borderRadius: radius.full }]}>
            <View style={[card.dot, { backgroundColor: tColor }]} />
            <Text style={[type.caption, { color: tColor, fontWeight: '600', textTransform: 'capitalize' }]}>
              {item.status.replace(/_/g, ' ')}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </View>

        {/* ── Tender title ── */}
        <Text style={[card.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {/* ── Reference number ── */}
        {!!item.referenceNumber && (
          <View style={card.metaRow}>
            <Ionicons name="barcode-outline" size={12} color={colors.textMuted} />
            <Text style={[type.caption, { color: colors.textMuted, fontVariant: ['tabular-nums'] }]} numberOfLines={1}>
              {item.referenceNumber}
            </Text>
          </View>
        )}

        {/* ── Issuer ── */}
        <View style={card.metaRow}>
          <Ionicons name="business-outline" size={12} color={colors.textMuted} />
          <Text style={[type.caption, { color: colors.textMuted }]} numberOfLines={1}>
            {ownerName}
          </Text>
        </View>

        {/* ── Deadline ── */}
        <View style={card.metaRow}>
          <Ionicons
            name={dl.past ? 'time' : dl.urgent ? 'alarm-outline' : 'calendar-outline'}
            size={12}
            color={dl.past || dl.urgent ? colors.danger : colors.textMuted}
          />
          <Text
            style={[
              type.caption,
              {
                color:      dl.past || dl.urgent ? colors.danger : colors.textMuted,
                fontWeight: dl.urgent ? '700' : '400',
              },
            ]}
            numberOfLines={1}
          >
            Deadline: {dl.text}
          </Text>
        </View>

        {/* ── Invitation message (if any) ── */}
        {!!primaryInvite.message && (
          <View
            style={[
              card.messageBubble,
              {
                backgroundColor: withAlpha(colors.primary, 0.07),
                borderRadius:    radius.sm,
                borderLeftColor: colors.primary,
              },
            ]}
          >
            <Text style={[type.caption, { color: colors.textMuted, fontStyle: 'italic' }]} numberOfLines={3}>
              "{primaryInvite.message}"
            </Text>
          </View>
        )}

        {/* ── Action buttons — only for pending invitations ── */}
        {isPending && (
          <View style={[card.actionsRow, { borderTopColor: withAlpha(colors.border, 0.7) }]}>
            <Pressable
              onPress={() => onDecline(primaryInvite._id)}
              disabled={isMutating}
              style={({ pressed }) => [
                card.actionBtn,
                {
                  backgroundColor: withAlpha(colors.danger, 0.10),
                  borderColor:     withAlpha(colors.danger, 0.25),
                  borderRadius:    radius.md,
                  opacity:         isMutating ? 0.5 : pressed ? 0.80 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Decline invitation"
            >
              <Ionicons name="close-circle-outline" size={15} color={colors.danger} />
              <Text style={[type.caption, { color: colors.danger, fontWeight: '700' }]}>Decline</Text>
            </Pressable>

            <Pressable
              onPress={() => onAccept(primaryInvite._id)}
              disabled={isMutating}
              style={({ pressed }) => [
                card.actionBtn,
                card.acceptBtn,
                {
                  backgroundColor: colors.primary,
                  borderRadius:    radius.md,
                  opacity:         isMutating ? 0.5 : pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Accept invitation"
            >
              {isMutating ? (
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={15} color={colors.textInverse} />
                  <Text style={[type.caption, { color: colors.textInverse, fontWeight: '700' }]}>Accept</Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Already responded — show responded-at timestamp */}
        {!isPending && !!primaryInvite.respondedAt && (
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 8 }]}>
            Responded {new Date(primaryInvite.respondedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        )}
      </Pressable>
    );
  },
);
InvitationCard.displayName = 'InvitationCard';

const card = StyleSheet.create({
  root:            { padding: 14, borderWidth: 1, gap: 8 },
  headerRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  invBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3 },
  tenderStatusPill:{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3 },
  dot:             { width: 6, height: 6, borderRadius: 3 },
  title:           { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  metaRow:         { flexDirection: 'row', alignItems: 'center', gap: 5 },
  messageBubble:   { padding: 10, borderLeftWidth: 3, marginTop: 4 },
  actionsRow:      { flexDirection: 'row', gap: 8, paddingTop: 12, borderTopWidth: 1, marginTop: 4 },
  actionBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderWidth: 1, minHeight: 40 },
  acceptBtn:       { borderWidth: 0 },
});

// ─── Empty state ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ filter: FilterStatus }> = ({ filter }) => {
  const { colors, type, radius } = useTheme();
  const messages: Record<FilterStatus, { icon: string; title: string; desc: string }> = {
    pending:  { icon: 'mail-outline',          title: 'No pending invitations',  desc: 'When a company invites you to bid on a tender, it will appear here.'        },
    accepted: { icon: 'checkmark-circle-outline', title: 'No accepted invitations', desc: 'Invitations you have accepted will show here.'                            },
    declined: { icon: 'close-circle-outline',  title: 'No declined invitations', desc: 'Invitations you have declined will show here.'                               },
    all:      { icon: 'albums-outline',         title: 'No invitations yet',      desc: 'You have not received any tender invitations. Check back later.'             },
  };
  const m = messages[filter];
  return (
    <View style={empty.root}>
      <View style={[empty.iconWrap, { backgroundColor: withAlpha(colors.primary, 0.08), borderRadius: radius.full }]}>
        <Ionicons name={m.icon as any} size={32} color={colors.textMuted} />
      </View>
      <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', marginTop: 12 }]}>{m.title}</Text>
      <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center', maxWidth: 280, marginTop: 4, lineHeight: 17 }]}>
        {m.desc}
      </Text>
    </View>
  );
};

const empty = StyleSheet.create({
  root:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 4 },
  iconWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

const MyInvitationsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing, radius, type } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<FilterStatus>('pending');
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMyInvitations({
    status: activeFilter === 'all' ? undefined : activeFilter,
    limit:  15,
  });

  const invitations: TenderWithMyInvitation[] = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.invitations),
    [data],
  );
  const totalCount = data?.pages?.[0]?.pagination?.total ?? 0;

  // ── Respond mutation ──────────────────────────────────────────────────
  const respondMutation = useRespondToInvitation();

  const handleAccept = useCallback(
    (tenderId: string, inviteId: string, tenderTitle: string) => {
      Alert.alert(
        'Accept Invitation',
        `Accept the invitation for "${tenderTitle}"?\n\nYou'll be eligible to submit a bid on this tender.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Accept',
            onPress: () => {
              setRespondingId(inviteId);
              respondMutation.mutate(
                { tenderId, inviteId, response: 'accepted' },
                {
                  onSuccess: () => setRespondingId(null),
                  onError:   () => setRespondingId(null),
                },
              );
            },
          },
        ],
      );
    },
    [respondMutation],
  );

  const handleDecline = useCallback(
    (tenderId: string, inviteId: string, tenderTitle: string) => {
      Alert.alert(
        'Decline Invitation',
        `Decline the invitation for "${tenderTitle}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text:    'Decline',
            style:   'destructive',
            onPress: () => {
              setRespondingId(inviteId);
              respondMutation.mutate(
                { tenderId, inviteId, response: 'declined' },
                {
                  onSuccess: () => setRespondingId(null),
                  onError:   () => setRespondingId(null),
                },
              );
            },
          },
        ],
      );
    },
    [respondMutation],
  );

  // ── Navigate to tender detail ─────────────────────────────────────────
  const goToDetail = useCallback(
    (tenderId: string) => {
      navigation.navigate('BrowseProfessionalTenderDetail', { tenderId });
    },
    [navigation],
  );

  // ── Render row ────────────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }: { item: TenderWithMyInvitation }) => (
      <InvitationCard
        item={item}
        onPress={() => goToDetail(item._id)}
        onAccept={(inviteId) => handleAccept(item._id, inviteId, item.title)}
        onDecline={(inviteId) => handleDecline(item._id, inviteId, item.title)}
        isMutating={respondingId === item.myInvitations[0]?._id && respondMutation.isPending}
      />
    ),
    [goToDetail, handleAccept, handleDecline, respondingId, respondMutation.isPending],
  );

  const keyExtractor = useCallback((item: TenderWithMyInvitation) => item._id, []);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Filter tab rendering ──────────────────────────────────────────────
  const renderFilterTab = (tab: typeof FILTER_TABS[number]) => {
    const isActive = activeFilter === tab.key;
    return (
      <Pressable
        key={tab.key}
        onPress={() => setActiveFilter(tab.key)}
        style={[
          S.filterTab,
          {
            backgroundColor: isActive ? colors.primary : colors.surface,
            borderColor:     isActive ? colors.primary : colors.border,
            borderRadius:    radius.full,
          },
        ]}
        accessibilityRole="button"
        accessibilityState={{ selected: isActive }}
      >
        <Text
          style={[
            type.caption,
            {
              color:      isActive ? colors.textInverse : colors.textMuted,
              fontWeight: isActive ? '700' : '500',
            },
          ]}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[S.root, { backgroundColor: colors.bg }]} edges={['top']}>
      <AppHeader
        title="My Invitations"
        subtitle={
          totalCount > 0
            ? `${totalCount} invitation${totalCount === 1 ? '' : 's'}`
            : 'Tender invitations sent to you'
        }
        centerTitle={false}
        rightAction={
          isFetching && !isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : undefined
        }
      />

      {/* ── Filter tabs ──────────────────────────────────────────────── */}
      <View style={[S.filterRow, { borderBottomColor: colors.border }]}>
        {FILTER_TABS.map(renderFilterTab)}
      </View>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[type.caption, { color: colors.textMuted, marginTop: 8 }]}>
            Loading invitations…
          </Text>
        </View>
      ) : isError ? (
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
          <Text style={[type.bodySm, { color: colors.text, fontWeight: '700', marginTop: 8 }]}>
            Couldn't load invitations
          </Text>
          <Text style={[type.caption, { color: colors.textMuted, textAlign: 'center', maxWidth: 280 }]}>
            {(error as any)?.message ?? 'Something went wrong. Pull down to retry.'}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[S.retryBtn, { backgroundColor: colors.primary, borderRadius: radius.md }]}
          >
            <Text style={[type.bodySm, { color: colors.textInverse, fontWeight: '700' }]}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={invitations}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={[
            S.listContent,
            invitations.length === 0 && S.listEmpty,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState filter={activeFilter} />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={S.listFooter}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : hasNextPage ? (
              <View style={S.listFooter}>
                <Text style={[type.caption, { color: colors.textMuted }]}>
                  Showing {invitations.length} of {totalCount}
                </Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:        { flex: 1 },

  filterRow:   {
    flexDirection:  'row',
    gap:            8,
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderBottomWidth: 1,
    flexWrap:       'wrap',
  },
  filterTab:   {
    paddingHorizontal: 14,
    paddingVertical:    6,
    borderWidth: 1,
    minHeight:  32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: { padding: 14 },
  listEmpty:   { flexGrow: 1 },
  listFooter:  { padding: 16, alignItems: 'center' },

  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  retryBtn:    { paddingHorizontal: 18, paddingVertical: 9, marginTop: 8 },
});

export default MyInvitationsScreen;