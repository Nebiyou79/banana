/**
 * screens/freelancer/FreelancerShortlistScreen.tsx
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import { useShortlist, useToggleShortlist } from '../../hooks/useFreelancerMarketplace';
import { FreelancerCard, FreelancerCardSkeleton } from '../../components/freelancer/FreelancerCard';
import { FreelancerListItem } from '../../services/freelancerMarketplaceService';
import { FreelancersStackParamList } from './FreelancerDetailScreen';

type Props = NativeStackScreenProps<FreelancersStackParamList, 'FreelancerShortlist'>;

export const FreelancerShortlistScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, radius, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch, isRefetching } = useShortlist(page);
  const { mutate: toggleShortlist, isPending: toggling } = useToggleShortlist();

  const freelancers: FreelancerListItem[] = useMemo(() => data?.freelancers ?? [], [data]);
  const pagination = data?.pagination;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>Saved Freelancers</Text>
          {pagination && pagination.total > 0 && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>
              {pagination.total} freelancer{pagination.total !== 1 ? 's' : ''} saved
            </Text>
          )}
        </View>
        <View style={{ width: 44 }} />
      </View>

      {isLoading ? (
        <View style={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <FreelancerCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={freelancers}
          keyExtractor={item => item._id}
          numColumns={2}
          refreshing={isRefetching}
          onRefresh={() => { setPage(1); refetch(); }}
          renderItem={({ item }) => (
            <FreelancerCard
              freelancer={item}
              onPress={() => navigation.navigate('FreelancerDetail', { freelancerId: item._id })}
              onToggleShortlist={() => toggleShortlist(item._id)}
              isShortlistLoading={toggling}
              style={{ margin: 6 }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={[styles.emptyIconWrap, { backgroundColor: withAlpha(colors.primary, 0.08), borderRadius: 40 }]}>
                <Ionicons name="bookmark-outline" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No saved freelancers</Text>
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                Tap the bookmark icon on any freelancer card to save them here.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('FreelancerMarketplace')}
                style={[styles.browseBtn, { backgroundColor: colors.primary, borderRadius: radius.xl }]}
              >
                <Ionicons name="people-outline" size={16} color="#fff" />
                <Text style={styles.browseBtnText}>Browse Freelancers</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            pagination && pagination.totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  onPress={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  style={[styles.pageBtn, {
                    borderColor: colors.border,
                    opacity: page <= 1 ? 0.4 : 1,
                    borderRadius: radius.md,
                  }]}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.pageText, { color: colors.textSecondary }]}>
                  {page} / {pagination.totalPages}
                </Text>
                <TouchableOpacity
                  onPress={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  style={[styles.pageBtn, {
                    borderColor: colors.border,
                    opacity: page >= pagination.totalPages ? 0.4 : 1,
                    borderRadius: radius.md,
                  }]}
                >
                  <Ionicons name="chevron-forward" size={18} color={colors.text} />
                </TouchableOpacity>
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.lg }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1,
  },
  backBtn: { padding: 8, width: 44 },
  title: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 1 },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 10 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyIconWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 8, paddingHorizontal: 24, paddingVertical: 13,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  pagination: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 16, marginVertical: 16,
  },
  pageBtn: { padding: 8, borderWidth: 1 },
  pageText: { fontSize: 13, fontWeight: '600' },
});