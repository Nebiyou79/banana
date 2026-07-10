// ─────────────────────────────────────────────────────────────────────────────
//  src/components/professionalTenders/BrowseTenderDetails.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FIXED (per TENDER_BID_SCREENS_UI_FIX.md §0.1, §0.2, §0.4, §0.8):
//   • Replaced useThemeStore + local palette → useTheme()
//   • All colors through colors.* tokens
//   • Insets on ScrollView paddingBottom
//   • Tab strip active uses colors.primary (gold)
//   • Bookmark button uses theme tokens

import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import TenderHeader from './TenderHeader';
import SealedBidBanner from './SealedBidBanner';
import {
  TenderProcurementInfo,
  TenderEligibilityInfo,
  TenderEvaluationInfo,
  TenderDatesInfo,
} from './TenderInfoComponents';
import TenderAttachmentList from './TenderAttachmentList';
import TenderAddendumList from './TenderAddendumList';
import TenderEntityCard from './TenderEntityCard';
import { SectionCard } from './_shared';
import type {
  ProfessionalTender,
  TenderAttachment,
} from '../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  PROPS
// ═════════════════════════════════════════════════════════════════════════════

export type BrowseTabKey =
  | 'overview'
  | 'details'
  | 'attachments'
  | 'addenda'
  | 'actions'
  | 'entity';

export interface BrowseTenderDetailsProps {
  tender: ProfessionalTender;
  isInvited?: boolean;
  isSaved?: boolean;
  onToggleSave?: () => void;
  onPlaceBid?: () => void;
  onViewBid?: (bidId: string) => void;
  onShare?: () => void;
  onAskQuestion?: () => void;
  onDownloadAttachment?: (attachment: TenderAttachment) => void;
  onViewEntityProfile?: (entityId: string) => void;
  initialTab?: BrowseTabKey;
  onBack?: () => void;
}

// ═════════════════════════════════════════════════════════════════════════════
//  TAB DEFINITIONS
// ═════════════════════════════════════════════════════════════════════════════

interface TabDef { key: BrowseTabKey; label: string; icon: string }

const TABS: ReadonlyArray<TabDef> = [
  { key: 'overview',    label: 'Overview',    icon: 'grid-outline'          },
  { key: 'details',     label: 'Details',     icon: 'document-text-outline' },
  { key: 'attachments', label: 'Attachments', icon: 'folder-open-outline'   },
  { key: 'addenda',     label: 'Addenda',     icon: 'albums-outline'        },
  { key: 'actions',     label: 'Actions',     icon: 'paper-plane-outline'   },
  { key: 'entity',      label: 'Entity',      icon: 'business-outline'      },
];

// ═════════════════════════════════════════════════════════════════════════════
//  TAB STRIP — useTheme() instead of palette
// ═════════════════════════════════════════════════════════════════════════════

const TabStrip: React.FC<{
  current:        BrowseTabKey;
  onChange:       (k: BrowseTabKey) => void;
  badges?:        Partial<Record<BrowseTabKey, number>>;
  emphasizedTabs?: BrowseTabKey[];
}> = ({ current, onChange, badges, emphasizedTabs }) => {
  const { colors } = useTheme();

  return (
    <View style={[tabS.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tabS.row}
      >
        {TABS.map((t) => {
          const isActive  = t.key === current;
          const fg        = isActive ? colors.primary : colors.textMuted;
          const badge     = badges?.[t.key];
          const emphasize = emphasizedTabs?.includes(t.key) && !isActive;

          return (
            <Pressable
              key={t.key}
              onPress={() => onChange(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={t.label}
              style={({ pressed }: { pressed: boolean }) => [
                tabS.tab,
                {
                  borderBottomColor: isActive ? colors.primary : 'transparent',
                  opacity:           pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name={t.icon as any} size={15} color={fg} />
              <Text style={[tabS.label, { color: fg }]} numberOfLines={1}>
                {t.label}
              </Text>
              {badge !== undefined && badge > 0 && (
                <View style={[tabS.badge, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
                  <Text style={[tabS.badgeText, { color: colors.primary }]}>
                    {badge > 99 ? '99+' : badge}
                  </Text>
                </View>
              )}
              {emphasize && (
                <View style={[tabS.dot, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const tabS = StyleSheet.create({
  bar:       { borderBottomWidth: 1 },
  row:       { paddingHorizontal: 8 },
  tab:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 2.5, minHeight: 44 },
  label:     { fontSize: 13, fontWeight: '700' },
  badge:     { minWidth: 18, height: 18, paddingHorizontal: 5, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, fontWeight: '800' },
  dot:       { width: 6, height: 6, borderRadius: 999, marginLeft: 2 },
});

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

const BrowseTenderDetails: React.FC<BrowseTenderDetailsProps> = ({
  tender,
  isInvited,
  isSaved,
  onToggleSave,
  onPlaceBid,
  onViewBid,
  onShare,
  onAskQuestion,
  onDownloadAttachment,
  onViewEntityProfile,
  initialTab = 'overview',
  onBack,
}) => {
  const [tab, setTab] = useState<BrowseTabKey>(initialTab);
  const { colors, spacing, type } = useTheme();
  const insets = useSafeAreaInsets();

  const ownerEntity   = typeof tender.ownerEntity === 'object' ? tender.ownerEntity : undefined;
  const ownerEntityId = typeof tender.ownerEntity === 'string'
    ? tender.ownerEntity
    : ownerEntity?._id;

  const badges = useMemo(() => ({
    attachments: tender.attachments?.length ?? 0,
    addenda:     tender.addenda?.length ?? 0,
  }), [tender.attachments, tender.addenda]);

  const emphasizedTabs: BrowseTabKey[] = useMemo(() => {
    const canBid = (tender.status === 'published' || tender.status === 'locked')
      && new Date(tender.deadline).getTime() > Date.now();
    return canBid && !tender.myBid ? ['actions'] : [];
  }, [tender.status, tender.deadline, tender.myBid]);

  // Bookmark button — uses theme tokens (no hardcoded rgba)
  const headerRightAction = onToggleSave ? (
    <Pressable
      onPress={onToggleSave}
      hitSlop={10}
      style={[
        styles.bookmarkBtn,
        { backgroundColor: withAlpha(colors.bg, 0.20) },
      ]}
      accessibilityRole="button"
      accessibilityLabel={isSaved ? 'Remove from saved' : 'Save tender'}
    >
      <Ionicons
        name={isSaved ? 'bookmark' : 'bookmark-outline'}
        size={18}
        color={colors.bg}
      />
    </Pressable>
  ) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <TenderHeader
        tender={tender}
        variant="browser"
        onBack={onBack}
        rightAction={headerRightAction}
      />

      <TabStrip
        current={tab}
        onChange={setTab}
        badges={badges}
        emphasizedTabs={emphasizedTabs}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── OVERVIEW ────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <View style={styles.stack}>
            <SealedBidBanner
              workflowType={tender.workflowType}
              status={tender.status}
              isRevealed={tender.status === 'revealed' || tender.status === 'closed'}
              deadline={tender.deadline}
              isOwner={false}
            />

            <SectionCard icon="reader-outline" title="Description">
              <Text style={[styles.descText, { color: colors.text }]} numberOfLines={6}>
                {tender.description}
              </Text>
              {tender.description.length > 300 && (
                <Pressable onPress={() => setTab('details')} hitSlop={6} accessibilityRole="button">
                  <Text style={[styles.readMore, { color: colors.primary }]}>
                    Read more in Details →
                  </Text>
                </Pressable>
              )}
            </SectionCard>

            {/* Quick CTA */}
            <Pressable
              onPress={() => setTab('actions')}
              style={({ pressed }: { pressed: boolean }) => [
                styles.quickCta,
                {
                  backgroundColor: colors.surface,
                  borderColor:     colors.border,
                  opacity:         pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Go to actions"
            >
              <Ionicons name="paper-plane" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.quickCtaTitle, { color: colors.text }]}>
                  {tender.myBid ? 'View your bid' : 'Ready to bid?'}
                </Text>
                <Text style={[styles.quickCtaDesc, { color: colors.textMuted }]}>
                  Open the Actions tab for bid options.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        )}

        {/* ── DETAILS ─────────────────────────────────────────────── */}
        {tab === 'details' && (
          <View style={styles.stack}>
            <SectionCard icon="reader-outline" title="Description">
              <Text style={[styles.descText, { color: colors.text }]}>
                {tender.description}
              </Text>
            </SectionCard>
            <TenderProcurementInfo tender={tender} />
            <TenderEligibilityInfo tender={tender} />
            <TenderEvaluationInfo tender={tender} />
            <TenderDatesInfo tender={tender} />
          </View>
        )}

        {/* ── ATTACHMENTS ──────────────────────────────────────────── */}
        {tab === 'attachments' && (
          <View style={styles.stack}>
            <TenderAttachmentList
              attachments={tender.attachments ?? []}
              mode="browser"
              onDownload={onDownloadAttachment}
            />
          </View>
        )}

        {/* ── ADDENDA ──────────────────────────────────────────────── */}
        {tab === 'addenda' && (
          <View style={styles.stack}>
            <TenderAddendumList addenda={tender.addenda ?? []} mode="browser" />
          </View>
        )}

        {/* ── ACTIONS ──────────────────────────────────────────────── */}
        {tab === 'actions' && (
          <View style={styles.stack}>
            {/* Bid CTA */}
            {!tender.myBid && onPlaceBid && (
              <Pressable
                onPress={onPlaceBid}
                style={({ pressed }) => [
                  styles.bidCta,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.88 : 1 },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="send" size={18} color={colors.textInverse} />
                <Text style={[styles.bidCtaText, { color: colors.textInverse }]}>
                  Place a Bid
                </Text>
              </Pressable>
            )}
            {tender.myBid && onViewBid && (
              <Pressable
                onPress={() => onViewBid((tender.myBid as any)._id ?? '')}
                style={({ pressed }) => [
                  styles.bidCta,
                  { backgroundColor: withAlpha(colors.primary, 0.12), borderWidth: 1, borderColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
                accessibilityRole="button"
              >
                <Ionicons name="eye-outline" size={18} color={colors.primary} />
                <Text style={[styles.bidCtaText, { color: colors.primary }]}>
                  View My Bid
                </Text>
              </Pressable>
            )}
            {/* Save / Share / Q&A */}
            <View style={styles.secondaryActions}>
              {onToggleSave && (
                <Pressable
                  onPress={onToggleSave}
                  style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={16} color={isSaved ? colors.primary : colors.textMuted} />
                  <Text style={[type.caption, { color: isSaved ? colors.primary : colors.textMuted, fontWeight: '600' }]}>
                    {isSaved ? 'Saved' : 'Save'}
                  </Text>
                </Pressable>
              )}
              {onShare && (
                <Pressable
                  onPress={onShare}
                  style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name="share-outline" size={16} color={colors.textMuted} />
                  <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>Share</Text>
                </Pressable>
              )}
              {onAskQuestion && (
                <Pressable
                  onPress={onAskQuestion}
                  style={[styles.secondaryBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Ionicons name="help-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={[type.caption, { color: colors.textMuted, fontWeight: '600' }]}>Ask</Text>
                </Pressable>
              )}
            </View>
            {/* Invited notice */}
            {isInvited && (
              <SectionCard icon="mail-open-outline" title="Invitation">
                <Text style={[styles.descText, { color: colors.text }]}>
                  You have been specifically invited to bid on this tender.
                </Text>
              </SectionCard>
            )}
          </View>
        )}

        {/* ── ENTITY ───────────────────────────────────────────────── */}
        {tab === 'entity' && (
          <View style={styles.stack}>
            <TenderEntityCard
              entityId={ownerEntityId}
              entity={ownerEntity}
              ownerRole={tender.ownerRole}
              onViewProfile={onViewEntityProfile}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root:         { flex: 1 },
  scrollContent:{ padding: 14 },
  stack:        { gap: 12 },

  bookmarkBtn:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  descText:     { fontSize: 13, lineHeight: 19 },
  readMore:     { fontSize: 12, fontWeight: '700', marginTop: 6 },

  quickCta:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  quickCtaTitle: { fontSize: 14, fontWeight: '700' },
  quickCtaDesc:  { fontSize: 12, marginTop: 2 },

  bidCta:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, minHeight: 50 },
  bidCtaText:    { fontSize: 15, fontWeight: '700' },

  secondaryActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, minHeight: 40,
    flexGrow: 1, justifyContent: 'center',
  },
});

export default BrowseTenderDetails;