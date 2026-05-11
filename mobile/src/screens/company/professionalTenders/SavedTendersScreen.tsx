// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/browse/SavedTendersScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useSavedProfessionalTenders,
  useToggleSavedProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import ProfessionalTenderStatusBadge from '../../../components/professionalTenders/ProfessionalTenderStatusBadge';
import ProfessionalTenderWorkflowBadge from '../../../components/professionalTenders/ProfessionalTenderWorkflowBadge';
import type { ProfessionalTenderListItem } from '../../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  CARD
// ═════════════════════════════════════════════════════════════════════════════

const SavedCard = React.memo<{
  item: ProfessionalTenderListItem;
  onPress: () => void;
  onUnsave: () => void;
  busy?: boolean;
}>(({ item, onPress, onUnsave, busy }) => {
  const { colors } = useTheme();

  const deadline = new Date(item.deadline);
  const isPast   = deadline.getTime() < Date.now();
  const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000);

  const handleUnsave = () => {
    Alert.alert(
      'Remove from saved?',
      'You can save it again from the browse screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: onUnsave },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.bgCard, borderColor: colors.border, opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Open saved tender ${item.title}`}
    >
      <View style={styles.cardHead}>
        <View style={styles.badges}>
          <ProfessionalTenderStatusBadge status={item.status} />
          <ProfessionalTenderWorkflowBadge workflowType={item.workflowType} size="sm" />
        </View>
        <Pressable
          onPress={handleUnsave}
          disabled={busy}
          hitSlop={8}
          style={({ pressed }) => [
            styles.unsaveBtn,
            { opacity: busy ? 0.5 : pressed ? 0.7 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Remove from saved"
        >
          <Ionicons name="bookmark" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
        {item.title}
      </Text>

      {!!item.briefDescription && (
        <Text style={[styles.brief, { color: colors.textMuted }]} numberOfLines={2}>
          {item.briefDescription}
        </Text>
      )}

      <View style={[styles.footer, { borderTopColor: withAlpha(colors.border, 0.5) }]}>
        <View style={styles.meta}>
          <Ionicons
            name={isPast ? 'time' : 'calendar-outline'}
            size={12}
            color={isPast ? colors.danger : colors.textMuted}
          />
          <Text
            style={[styles.metaStrong, { color: isPast ? colors.danger : colors.text }]}
            numberOfLines={1}
          >
            {isPast
              ? 'Closed'
              : daysLeft <= 1
                ? 'Closes today'
                : `${daysLeft} days left`}
          </Text>
        </View>
        {!!item.procurementCategory && (
          <View style={styles.meta}>
            <Ionicons name="pricetag-outline" size={12} color={colors.textMuted} />
            <Text
              style={[styles.metaSub, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {item.procurementCategory}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

// ═════════════════════════════════════════════════════════════════════════════
//  SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export const SavedTendersScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  // ── Real hooks wired to the service ─────────────────────────────────────
  const { data, isLoading } = useSavedProfessionalTenders();
  const saved               = data?.tenders ?? [];
  const toggleSave          = useToggleSavedProfessionalTender();

  const goToDetail = useCallback(
    (id: string) => navigation.navigate('BrowseProfessionalTenderDetail', { tenderId: id }),
    [navigation],
  );

  const goToBrowse = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('BrowseProfessionalTenders');
  }, [navigation]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      'Clear all saved tenders?',
      `This will remove all ${saved.length} saved tenders. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            saved.forEach((t) => toggleSave.mutate({ id: t._id }));
          },
        },
      ],
    );
  }, [saved, toggleSave]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Tenders</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            {saved.length} saved
          </Text>
        </View>
        {saved.length > 0 ? (
          <Pressable
            onPress={handleClearAll}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Clear all saved tenders"
          >
            <Text style={[styles.headerClearText, { color: colors.textMuted }]}>Clear</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={styles.fullCenter}>
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading…</Text>
        </View>
      ) : saved.length === 0 ? (
        <View style={styles.fullCenter}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="bookmark-outline" size={36} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved tenders</Text>
          <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
            Tap the bookmark icon on any tender to save it for later.
          </Text>
          <Pressable
            onPress={goToBrowse}
            style={({ pressed }) => [
              styles.emptyCta,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Browse tenders"
          >
            <Ionicons name="search-outline" size={16} color={colors.textInverse} />
            <Text style={[styles.emptyCtaText, { color: colors.textInverse }]}>
              Browse tenders
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item: ProfessionalTenderListItem) => item._id}
          renderItem={({ item }: { item: ProfessionalTenderListItem }) => (
            <SavedCard
              item={item}
              onPress={() => goToDetail(item._id)}
              onUnsave={() => toggleSave.mutate({ id: item._id })}
              busy={toggleSave.isPending}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        />
      )}
    </SafeAreaView>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: 1,
    minHeight: 52,
  },
  backBtn:      { minWidth: 40, minHeight: 44, justifyContent: 'center' },
  headerCenter: { flex: 1 },
  headerTitle:  { fontSize: 18, fontWeight: '800' },
  headerSub:    { fontSize: 11 },
  headerClearText: { fontSize: 13, fontWeight: '700' },

  fullCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: { fontSize: 13 },

  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyDesc:  { fontSize: 13, lineHeight: 18, textAlign: 'center', maxWidth: 280 },
  emptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
    minHeight: 44,
  },
  emptyCtaText: { fontSize: 13, fontWeight: '700' },

  listContent: { padding: 14, paddingBottom: 32 },

  card: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badges:    { flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 },
  unsaveBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  brief: { fontSize: 12, lineHeight: 17 },

  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 200 },
  metaStrong: { fontSize: 12, fontWeight: '600' },
  metaSub:    { fontSize: 11 },
});

export default SavedTendersScreen;