// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/company/professionalTenders/ProfessionalTenderDetailScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Owner-side detail screen.  Drives the lifecycle from one screen.
//
//  • SealedBidBanner at top (visible only for closed workflow)
//  • Status-aware action bar (uses getAvailableActions from types)
//  • Quick stats: bid count (masked when sealed), addenda count, deadline
//  • Tap actions:
//      - publish     → useCreatePublishProfessionalTender
//      - lock        → useLockProfessionalTender
//      - reveal      → useRevealProfessionalTender
//      - close       → useCloseProfessionalTender (with confirm)
//      - edit        → navigate('EditProfessionalTender')
//      - delete      → useDeleteProfessionalTender (with confirm)
//      - addAddendum → navigate('AddendumScreen')
//      - viewAllBids → navigate('IncomingBids')
//
//  P-01: Workflow type shows as SEALED label but value is 'closed'.
//  Sealed-bid integrity: bid amounts NEVER shown unless areSealedBidsViewable().
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import {
  useCloseProfessionalTender,
  useDeleteProfessionalTender,
  useLockProfessionalTender,
  useProfessionalTender,
  usePublishProfessionalTender,
  useRevealProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import ProfessionalTenderStatusBadge from '../../../components/professionalTenders/ProfessionalTenderStatusBadge';
import ProfessionalTenderWorkflowBadge from '../../../components/professionalTenders/ProfessionalTenderWorkflowBadge';
import SealedBidBanner from '../../../components/professionalTenders/SealedBidBanner';
import {
  areSealedBidsViewable,
  getAvailableActions,
  type ProfessionalTender,
  type TenderAction,
} from '../../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTE PARAMS
// ═════════════════════════════════════════════════════════════════════════════

interface RouteParams {
  tenderId: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  ACTION → ICON / LABEL
// ═════════════════════════════════════════════════════════════════════════════

interface ActionDef {
  label: string;
  icon: string;
  /** Visual treatment — 'primary', 'secondary', 'destructive', 'accent' */
  intent: 'primary' | 'secondary' | 'destructive' | 'accent';
  /** Show a confirm Alert before firing. */
  confirm?: { title: string; message: string };
}

const ACTION_META: Record<TenderAction, ActionDef> = {
  publish:      { label: 'Publish',         icon: 'send',                intent: 'primary',     confirm: { title: 'Publish this tender?', message: 'Bidders will be able to see it immediately. This cannot be undone — only addenda can amend a published tender.' } },
  edit:         { label: 'Edit',            icon: 'create-outline',      intent: 'secondary' },
  delete:       { label: 'Delete',          icon: 'trash-outline',       intent: 'destructive', confirm: { title: 'Delete this draft?', message: 'This will permanently remove the tender. This cannot be undone.' } },
  lock:         { label: 'Lock',            icon: 'lock-closed-outline', intent: 'accent',      confirm: { title: 'Lock the tender?', message: 'Locking prevents new bids from being submitted. The tender will move to "locked" status.' } },
  reveal:       { label: 'Reveal Bids',     icon: 'eye-outline',         intent: 'primary',     confirm: { title: 'Reveal sealed bids?', message: 'Once revealed, all bid amounts and bidder identities become visible. This action is logged in the audit trail.' } },
  close:        { label: 'Close Tender',    icon: 'checkmark-done',      intent: 'secondary',   confirm: { title: 'Close this tender?', message: 'Closing concludes the tender. No further bids can be received.' } },
  addAddendum:  { label: 'Add Addendum',    icon: 'document-text-outline', intent: 'secondary' },
  viewAllBids:  { label: 'View All Bids',   icon: 'list-outline',        intent: 'primary' },
};

// ═════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════════════════

const StatTile: React.FC<{
  icon: string;
  label: string;
  value: string;
  hint?: string;
  masked?: boolean;
}> = ({ icon, label, value, hint, masked }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', accent: '#60A5FA' }
    : { bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', accent: '#2563EB' };
  return (
    <View style={[tileStyles.root, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={tileStyles.head}>
        <Ionicons name={icon as any} size={14} color={palette.accent} />
        <Text style={[tileStyles.label, { color: palette.muted }]}>{label}</Text>
      </View>
      <Text style={[tileStyles.value, { color: palette.text }]}>
        {masked ? '🔒 Hidden' : value}
      </Text>
      {!!hint && (
        <Text style={[tileStyles.hint, { color: palette.muted }]} numberOfLines={1}>
          {hint}
        </Text>
      )}
    </View>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode; right?: React.ReactNode }> = ({
  title,
  children,
  right,
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { bg: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8' }
    : { bg: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B' };
  return (
    <View style={[sectionStyles.root, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <View style={sectionStyles.head}>
        <Text style={[sectionStyles.title, { color: palette.text }]}>{title}</Text>
        {right}
      </View>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
};

const InfoRow: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const palette = isDark
    ? { label: '#94A3B8', value: '#F1F5F9', empty: '#64748B' }
    : { label: '#64748B', value: '#0F172A', empty: '#94A3B8' };
  return (
    <View style={infoStyles.row}>
      <Text style={[infoStyles.label, { color: palette.label }]}>{label}</Text>
      <Text
        style={[infoStyles.value, { color: value ? palette.value : palette.empty, fontStyle: value ? 'normal' : 'italic' }]}
      >
        {value || 'Not provided'}
      </Text>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN
// ═════════════════════════════════════════════════════════════════════════════

export const ProfessionalTenderDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = useMemo(
    () => isDark
      ? { background: '#0F172A', surface: '#1E293B', border: '#334155', text: '#F1F5F9', muted: '#94A3B8', subtle: '#64748B', primary: '#60A5FA', primaryFg: '#0F172A', secondary: '#334155', secondaryFg: '#F1F5F9', accent: '#A855F7', accentFg: '#FFFFFF', destructive: '#F87171', destructiveFg: '#0F172A', success: '#22C55E', successFg: '#FFFFFF' }
      : { background: '#F8FAFC', surface: '#FFFFFF', border: '#E2E8F0', text: '#0F172A', muted: '#64748B', subtle: '#94A3B8', primary: '#2563EB', primaryFg: '#FFFFFF', secondary: '#E2E8F0', secondaryFg: '#0F172A', accent: '#7C3AED', accentFg: '#FFFFFF', destructive: '#DC2626', destructiveFg: '#FFFFFF', success: '#16A34A', successFg: '#FFFFFF' },
    [isDark],
  );

  const tenderId = route.params?.tenderId;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useProfessionalTender(tenderId);

  // Refetch when the screen regains focus (e.g. after addendum added)
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const tender: ProfessionalTender | undefined = data?.data;
  const isOwner = !!data?.isOwner;

  // ─── Mutations ──────────────────────────────────────────────────────────
  const publishMut = usePublishProfessionalTender();
  const lockMut    = useLockProfessionalTender();
  const revealMut  = useRevealProfessionalTender();
  const closeMut   = useCloseProfessionalTender();
  const deleteMut  = useDeleteProfessionalTender({
    onSuccess: () => {
      // After delete, pop back to the list
      if (navigation.canGoBack()) navigation.goBack();
    },
  });

  const isMutating =
    publishMut.isPending || lockMut.isPending || revealMut.isPending ||
    closeMut.isPending || deleteMut.isPending;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // ─── Action firing ──────────────────────────────────────────────────────
  const fire = useCallback(
    async (action: TenderAction) => {
      if (!tender || !tenderId) return;
      const meta = ACTION_META[action];
      const run = async () => {
        try {
          switch (action) {
            case 'publish':     await publishMut.mutateAsync(tenderId); break;
            case 'lock':        await lockMut.mutateAsync(tenderId); break;
            case 'reveal':      await revealMut.mutateAsync(tenderId); break;
            case 'close':       await closeMut.mutateAsync(tenderId); break;
            case 'delete':      await deleteMut.mutateAsync(tenderId); break;
            case 'edit':        navigation.navigate('EditProfessionalTender', { tenderId }); break;
            case 'addAddendum': navigation.navigate('AddendumScreen', { tenderId }); break;
            case 'viewAllBids': navigation.navigate('IncomingBids', { tenderId }); break;
          }
        } catch (err: any) {
          Alert.alert(
            `${meta.label} failed`,
            err?.message ?? 'Something went wrong. Please try again.',
          );
        }
      };
      if (meta.confirm) {
        Alert.alert(meta.confirm.title, meta.confirm.message, [
          { text: 'Cancel', style: 'cancel' },
          { text: meta.label, style: action === 'delete' ? 'destructive' : 'default', onPress: run },
        ]);
      } else {
        run();
      }
    },
    [tender, tenderId, publishMut, lockMut, revealMut, closeMut, deleteMut, navigation],
  );

  // ─── Render ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.primary} />
      </View>
    );
  }

  if (isError || !tender) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: palette.background }]}>
        <Ionicons name="alert-circle-outline" size={36} color={palette.muted} />
        <Text style={[styles.errorText, { color: palette.text }]}>
          {(error as any)?.message ?? 'Couldn\'t load this tender.'}
        </Text>
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.btn, { backgroundColor: palette.secondary }]}
        >
          <Text style={[styles.btnLabel, { color: palette.secondaryFg }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const { status, workflowType } = tender;
  const sealedViewable = areSealedBidsViewable(status, workflowType);
  const isSealedHidden = workflowType === 'closed' && !sealedViewable;
  const actions = isOwner ? getAvailableActions(status, workflowType) : [];

  const deadlineDate = new Date(tender.deadline);
  const isPast = deadlineDate.getTime() < Date.now();
  const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / 86_400_000);
  const deadlineStr = deadlineDate.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

  const bidCountLabel = isSealedHidden
    ? 'Sealed'
    : `${tender.bidCount ?? tender.metadata?.totalBids ?? 0}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
          />
        }
      >
        {/* ─── Sealed-bid banner (top) ────────────────────────────────── */}
        <SealedBidBanner
          workflowType={workflowType}
          status={status}
          isRevealed={status === 'revealed' || status === 'closed'}
          deadline={tender.deadline}
          isOwner={isOwner}
          isRevealing={revealMut.isPending}
          onReveal={() => fire('reveal')}
        />

        {/* ─── Title block ────────────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <View style={styles.badgeRow}>
            <ProfessionalTenderStatusBadge status={status} size="md" />
            <ProfessionalTenderWorkflowBadge workflowType={workflowType} size="md" />
          </View>
          <Text style={[styles.title, { color: palette.text }]}>{tender.title}</Text>
          {!!tender.referenceNumber && (
            <Text
              style={[styles.refNum, { color: palette.muted, fontFamily: 'monospace' }]}
            >
              {tender.referenceNumber}
            </Text>
          )}
          {!!tender.briefDescription && (
            <Text style={[styles.brief, { color: palette.muted }]}>
              {tender.briefDescription}
            </Text>
          )}
        </View>

        {/* ─── Quick stats (3 tiles) ──────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatTile
            icon="people-outline"
            label="Bids"
            value={bidCountLabel}
            hint={isSealedHidden ? 'Visible after reveal' : undefined}
            masked={isSealedHidden}
          />
          <StatTile
            icon={isPast ? 'time-outline' : 'calendar-outline'}
            label="Deadline"
            value={isPast ? 'Passed' : daysLeft <= 1 ? 'Today' : `${daysLeft}d`}
            hint={deadlineStr}
          />
          <StatTile
            icon="document-text-outline"
            label="Addenda"
            value={String(tender.addenda?.length ?? 0)}
          />
        </View>

        {/* ─── Action bar (owner only) ───────────────────────────────── */}
        {isOwner && actions.length > 0 && (
          <Section title="Actions">
            <View style={styles.actionGrid}>
              {actions.map((action) => {
                const meta = ACTION_META[action];
                const intent = meta.intent;
                const bg =
                  intent === 'primary'     ? palette.primary :
                  intent === 'destructive' ? palette.destructive :
                  intent === 'accent'      ? palette.accent :
                                             palette.secondary;
                const fg =
                  intent === 'primary'     ? palette.primaryFg :
                  intent === 'destructive' ? palette.destructiveFg :
                  intent === 'accent'      ? palette.accentFg :
                                             palette.secondaryFg;
                return (
                  <Pressable
                    key={action}
                    onPress={() => fire(action)}
                    disabled={isMutating}
                    style={({ pressed }: { pressed: boolean }) => [
                      styles.actionBtn,
                      { backgroundColor: bg, opacity: isMutating ? 0.6 : pressed ? 0.85 : 1 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={meta.label}
                  >
                    <Ionicons name={meta.icon as any} size={16} color={fg} />
                    <Text style={[styles.actionLabel, { color: fg }]} numberOfLines={1}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {(status === 'closed' || status === 'cancelled') && (
              <Text style={[styles.readonlyHint, { color: palette.muted }]}>
                This tender is {status}. No further actions are available.
              </Text>
            )}
          </Section>
        )}

        {/* ─── Description ───────────────────────────────────────────── */}
        <Section title="Description">
          <Text style={[styles.descText, { color: palette.text }]}>
            {tender.description}
          </Text>
        </Section>

        {/* ─── Procurement ──────────────────────────────────────────── */}
        <Section title="Procurement">
          <InfoRow label="Procuring Entity" value={tender.procurement?.procuringEntity} />
          <InfoRow label="Method" value={tender.procurement?.procurementMethod?.replace(/_/g, ' ')} />
          <InfoRow label="Funding Source" value={tender.procurement?.fundingSource} />
          <InfoRow
            label="Bid Security"
            value={
              tender.procurement?.bidSecurityAmount !== undefined
                ? `${tender.procurement.bidSecurityAmount.toLocaleString()} ${tender.procurement.bidSecurityCurrency ?? 'ETB'}`
                : undefined
            }
          />
          {!!tender.procurement?.contactPerson?.name && (
            <InfoRow label="Contact" value={tender.procurement.contactPerson.name} />
          )}
          {!!tender.procurement?.contactPerson?.email && (
            <InfoRow label="Email" value={tender.procurement.contactPerson.email} />
          )}
        </Section>

        {/* ─── Pre-bid meeting (P-14: ROOT level) ────────────────────── */}
        {!!tender.preBidMeeting && (
          <Section title="Pre-Bid Meeting">
            <InfoRow
              label="When"
              value={
                tender.preBidMeeting.date
                  ? new Date(tender.preBidMeeting.date).toLocaleString()
                  : undefined
              }
            />
            <InfoRow label="Location" value={tender.preBidMeeting.location} />
            <InfoRow label="Online Link" value={tender.preBidMeeting.onlineLink} />
            <InfoRow
              label="Attendance"
              value={tender.preBidMeeting.mandatory ? 'Mandatory' : 'Optional'}
            />
          </Section>
        )}

        {/* ─── Eligibility ──────────────────────────────────────────── */}
        {!!tender.eligibility && (
          <Section title="Eligibility">
            <InfoRow
              label="Min Experience"
              value={
                tender.eligibility.minimumExperience !== undefined
                  ? `${tender.eligibility.minimumExperience} years`
                  : undefined
              }
            />
            <InfoRow
              label="Legal Registration"
              value={tender.eligibility.legalRegistrationRequired ? 'Required' : 'Not required'}
            />
            {(tender.eligibility.requiredCertifications?.length ?? 0) > 0 && (
              <View style={styles.certsRow}>
                {tender.eligibility.requiredCertifications!.map((c) => (
                  <View
                    key={c}
                    style={[
                      styles.cert,
                      { backgroundColor: isDark ? '#0F172A' : '#F1F5F9', borderColor: palette.border },
                    ]}
                  >
                    <Text style={[styles.certText, { color: palette.text }]}>{c}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>
        )}

        {/* ─── Addenda count CTA ────────────────────────────────────── */}
        {(tender.addenda?.length ?? 0) > 0 && (
          <Section title={`Addenda (${tender.addenda!.length})`}>
            {tender.addenda!.slice(0, 3).map((a) => (
              <View
                key={a._id}
                style={[styles.addendumRow, { borderColor: palette.border }]}
              >
                <Text style={[styles.addendumTitle, { color: palette.text }]} numberOfLines={1}>
                  {a.title}
                </Text>
                <Text style={[styles.addendumDate, { color: palette.muted }]}>
                  {new Date(a.issuedAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
            {tender.addenda!.length > 3 && (
              <Pressable
                onPress={() => navigation.navigate('AddendumScreen', { tenderId })}
                style={styles.addendumViewAll}
              >
                <Text style={[styles.addendumViewAllText, { color: palette.primary }]}>
                  View all addenda →
                </Text>
              </Pressable>
            )}
          </Section>
        )}

        {/* ─── Footer breathing room ────────────────────────────────── */}
        <View style={{ height: 24 }} />
      </ScrollView>

      {isFetching && !refreshing && (
        <View style={[styles.refetchPill, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <ActivityIndicator size="small" color={palette.primary} />
          <Text style={[styles.refetchText, { color: palette.muted }]}>Refreshing…</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText: { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  btn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnLabel: { fontSize: 13, fontWeight: '700' },

  scrollContent: { padding: 14, gap: 14 },

  titleBlock: { gap: 6 },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  title:   { fontSize: 22, fontWeight: '800', lineHeight: 28, marginTop: 6 },
  refNum:  { fontSize: 12 },
  brief:   { fontSize: 13, lineHeight: 18, marginTop: 4 },

  statsRow: { flexDirection: 'row', gap: 8 },

  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 40,
    flexGrow: 1,
    flexBasis: '46%',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 13, fontWeight: '700' },
  readonlyHint: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },

  descText: { fontSize: 13, lineHeight: 19 },

  certsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  cert: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  certText: { fontSize: 11, fontWeight: '600' },

  addendumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  addendumTitle: { flex: 1, fontSize: 13, fontWeight: '600' },
  addendumDate:  { fontSize: 11 },
  addendumViewAll: { alignItems: 'center', paddingTop: 8 },
  addendumViewAllText: { fontSize: 13, fontWeight: '700' },

  refetchPill: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  refetchText: { fontSize: 12 },
});

const tileStyles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minHeight: 76,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4 },
  value: { fontSize: 18, fontWeight: '800' },
  hint:  { fontSize: 10 },
});

const sectionStyles = StyleSheet.create({
  root: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: { fontSize: 14, fontWeight: '700' },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
});

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, minHeight: 22 },
  label: { width: 130, fontSize: 11, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  value: { flex: 1, fontSize: 13, lineHeight: 18 },
});

export default ProfessionalTenderDetailScreen;
