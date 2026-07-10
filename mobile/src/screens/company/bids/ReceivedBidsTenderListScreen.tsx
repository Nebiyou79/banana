// src/screens/company/bids/ReceivedBidsTenderListScreen.tsx
// Owner-side: List of posted tenders — tap one to see its incoming bids.
// Mirrors web: /dashboard/company/tenders/my-bids/index.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useState, useMemo } from 'react';
import {
  View, Text, Pressable, RefreshControl, ActivityIndicator, StyleSheet, FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { useMyPostedProfessionalTenders } from '../../../hooks/useProfessionalTender';
import { ProfessionalTenderListItem } from '../../../types/professionalTender';

// ── Status pill colors ──────────────────────────────────────────────────────

const STATUS_PILL: Record<string, { bg: string; text: string }> = {
  draft:     { bg: '#F3F4F6', text: '#6B7280' },
  published: { bg: '#D1FAE5', text: '#047857' },
  open:      { bg: '#D1FAE5', text: '#047857' },
  locked:    { bg: '#EDE9FE', text: '#6D28D9' },
  closed:    { bg: '#FEE2E2', text: '#B91C1C' },
  revealed:  { bg: '#DBEAFE', text: '#1D4ED8' },
  awarded:   { bg: '#FEF3C7', text: '#92400E' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch { return iso; }
}

// ── Tender Card ──────────────────────────────────────────────────────────────

interface TenderCardProps {
  tender: ProfessionalTenderListItem;
  onPress: (tenderId: string) => void;
}

const TenderCard: React.FC<TenderCardProps> = ({ tender, onPress }) => {
  const { colors, radius } = useTheme();
  const isSealed = (tender as any).workflowType === 'closed';
  const pill = STATUS_PILL[tender.status] ?? STATUS_PILL.draft;
  const bidCount = (tender as any).bidCount ?? 0;

  return (
    <Pressable
      onPress={() => onPress(tender._id)}
      style={({ pressed }) => [
        cardStyles.card,
        {
          backgroundColor: colors.bgCard,
          borderColor: colors.border,
          borderRadius: radius.xl,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Color strip */}
      <View style={[cardStyles.strip, { backgroundColor: isSealed ? '#8B5CF6' : '#10B981' }]} />

      <View style={cardStyles.body}>
        {/* Header */}
        <View style={cardStyles.header}>
          <View style={{ flex: 1 }}>
            {(tender as any).category && (
              <Text style={[cardStyles.category, { color: colors.textMuted }]}>
                {(tender as any).category}
              </Text>
            )}
            <Text style={[cardStyles.title, { color: colors.text }]} numberOfLines={2}>
              {tender.title}
            </Text>
            {(tender as any).referenceNumber && (
              <Text style={[cardStyles.ref, { color: colors.textMuted }]}>
                Ref: {(tender as any).referenceNumber}
              </Text>
            )}
          </View>
          <View style={cardStyles.badges}>
            <View style={[cardStyles.statusPill, { backgroundColor: pill.bg }]}>
              <Text style={[cardStyles.statusText, { color: pill.text }]}>
                {tender.status}
              </Text>
            </View>
            <View style={[cardStyles.typePill, { 
              backgroundColor: isSealed ? '#EDE9FE' : '#D1FAE5',
            }]}>
              <Text style={[cardStyles.typeText, { 
                color: isSealed ? '#6D28D9' : '#047857',
              }]}>
                {isSealed ? '🔒 Sealed' : '🔓 Open'}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={[cardStyles.divider, { backgroundColor: colors.border }]} />

        {/* Bid info */}
        <View style={cardStyles.bidRow}>
          <View style={[cardStyles.bidCount, { backgroundColor: colors.bg }]}>
            <Text style={[cardStyles.bidCountNum, { color: colors.primary }]}>
              {bidCount}
            </Text>
            <Text style={[cardStyles.bidCountLabel, { color: colors.textMuted }]}>
              Bid{bidCount !== 1 ? 's' : ''}
            </Text>
          </View>
          {tender.deadline && (
            <Text style={[cardStyles.deadline, { color: colors.textMuted }]}>
              Deadline: {formatDate(tender.deadline)}
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={cardStyles.footer}>
          <View style={{ flex: 1 }} />
          <Text style={[cardStyles.viewText, { color: colors.primary }]}>
            View Bids →
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

// ── Main Screen ──────────────────────────────────────────────────────────────

export const ReceivedBidsTenderListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, spacing } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useMyPostedProfessionalTenders({ limit: 50 });

  const tenders: ProfessionalTenderListItem[] = useMemo(() => {
    if (!data) return [];
    return (data as any).tenders ?? (data as any).data ?? [];
  }, [data]);

  const handleTenderPress = useCallback((tenderId: string) => {
    // Navigate to IncomingBidsDetail in the Bids stack
    navigation.navigate('IncomingBidsDetail', { tenderId });
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Received Bids</Text>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
          {tenders.length} tender{tenders.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={tenders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={
          <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="documents-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No tenders posted yet</Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              Post your first tender to start receiving bids.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TenderCard tender={item} onPress={handleTenderPress} />
        )}
      />
    </SafeAreaView>
  );
};

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12 },
  emptyCard: { alignItems: 'center', gap: 10, padding: 32, borderRadius: 16, borderWidth: 1, marginTop: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center' },
});

const cardStyles = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden', flexDirection: 'row' },
  strip: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, padding: 14, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  category: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  ref: { fontSize: 11, marginTop: 2 },
  badges: { alignItems: 'flex-end', gap: 4 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 9, fontWeight: '700', textTransform: 'capitalize' },
  typePill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  typeText: { fontSize: 9, fontWeight: '700' },
  divider: { height: 1 },
  bidRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bidCount: { alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, minWidth: 60 },
  bidCountNum: { fontSize: 20, fontWeight: '800' },
  bidCountLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase' },
  deadline: { fontSize: 11 },
  footer: { flexDirection: 'row', alignItems: 'center' },
  viewText: { fontSize: 12, fontWeight: '700' },
});

export default ReceivedBidsTenderListScreen;