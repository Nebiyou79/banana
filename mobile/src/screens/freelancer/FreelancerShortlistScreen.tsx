/**
 * mobile/src/screens/freelancers/FreelancerShortlistScreen.tsx
 *
 * Company's saved / shortlisted freelancers.
 * Accessible from the bookmark icon in FreelancerMarketplaceScreen.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import {
  useShortlist,
  useToggleShortlist,
} from '../../hooks/useFreelancerMarketplace';
import {
  FreelancerCard,
  FreelancerCardSkeleton,
} from '../../components/freelancers/FreelancerCard';
import { FreelancerListItem } from '../../services/freelancerMarketplaceService';
import { FreelancersStackParamList } from './FreelancerMarketplaceScreen';

type Props = NativeStackScreenProps<FreelancersStackParamList, 'FreelancerShortlist'>;

export const FreelancerShortlistScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;

  const { data, isLoading, refetch, isRefetching } = useShortlist(1);
  const { mutate: toggleShortlist } = useToggleShortlist();

  const freelancers: FreelancerListItem[] = useMemo(
    () => data?.freelancers ?? [],
    [data],
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Saved Freelancers</Text>
        <View style={{ width: 40 }} />
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
          keyExtractor={(item) => item._id}
          estimatedItemSize={200}
          numColumns={2}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <FreelancerCard
              freelancer={item}
              onPress={() =>
                navigation.navigate('FreelancerDetail', { freelancerId: item._id })
              }
              onToggleShortlist={() => toggleShortlist(item._id)}
              style={{ margin: 6 }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={52} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                No saved freelancers
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                Bookmark freelancers while browsing to save them here.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('FreelancerMarketplace')}
                style={[styles.browseBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg }]}
              >
                <Text style={styles.browseBtnText}>Browse Freelancers</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, width: 40 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  browseBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
