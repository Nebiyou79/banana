// mobile/src/screens/freelancer/tenders/FreelancerSavedTendersScreen.tsx

import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../../store/themeStore';
import { useSavedFreelanceTenders } from '../../../hooks/useFreelanceTender';
import type { FreelanceTenderListItem } from '../../../types/freelanceTender';
import FreelanceTenderCard from '../../../components/freelanceTenders/FreelanceTenderCard';
import FreelanceTenderSkeleton from '../../../components/freelanceTenders/FreelanceTenderSkeleton';
import FreelanceTenderEmptyState from '../../../components/freelanceTenders/FreelanceTenderEmptyState';

const FreelancerSavedTendersScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const navigation = useNavigation<any>();

  const { data, isLoading, refetch, isRefetching } = useSavedFreelanceTenders();
  const tenders: FreelanceTenderListItem[] = data?.tenders ?? [];

  const renderItem = useCallback(
    ({ item }: { item: FreelanceTenderListItem }) => (
      <FreelanceTenderCard
        tender={{ ...item, isSaved: true }}
        onPress={() => navigation.navigate('FreelancerTenderDetail', { tenderId: item._id })}
        role="freelancer"
      />
    ),
    [navigation]
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.background ?? c.card }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border ?? c.textMuted + '22' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.backText, { color: c.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: c.text }]}>Saved Tenders</Text>
        <View style={styles.headerRight}>
          {!isLoading && (
            <Text style={[styles.countText, { color: c.textMuted }]}>
              {tenders.length}
            </Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <FreelanceTenderSkeleton count={4} />
      ) : (
        <FlashList
          data={tenders}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={c.primary}
            />
          }
          ListEmptyComponent={
            <FreelanceTenderEmptyState
              message="No saved tenders yet"
              actionLabel="Browse Tenders"
              onAction={() => navigation.navigate('FreelancerBrowseTenders')}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 15, fontWeight: '600' },
  screenTitle: { fontSize: 17, fontWeight: '700' },
  headerRight: { minWidth: 44, alignItems: 'flex-end' },
  countText: { fontSize: 14, fontWeight: '600' },
  list: { padding: 16 },
});

export default FreelancerSavedTendersScreen;