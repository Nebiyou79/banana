import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useFreelancerPortfolio, useDeletePortfolioItem } from '../../hooks/useFreelancer';
import { PortfolioCard, PortfolioListItem } from '../../components/freelancer/PortfolioCard';
import { ScreenWrapper, ScreenHeader, LoadingState, EmptyState, PillButton } from '../../components/shared/UIComponents';
import type { PortfolioItem } from '../../types/freelancer';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

export const PortfolioListScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { theme } = useThemeStore();
  const { colors, spacing, typography, borderRadius } = theme;

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const { data, isLoading, refetch, isRefetching } = useFreelancerPortfolio({ limit: 50 });
  const deleteMutation = useDeletePortfolioItem();

  const items = data?.items ?? [];
  const categories = ['all', ...Array.from(new Set(items.map(i => i.category).filter(Boolean) as string[]))];

  const filtered = filterCategory === 'all' ? items : items.filter(i => i.category === filterCategory);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(
      'Delete Portfolio Item',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(id),
        },
      ]
    );
  }, [deleteMutation]);

  const handleEdit = useCallback((item: PortfolioItem) => {
    navigation.navigate('EditPortfolio', { itemId: item._id });
  }, [navigation]);

  const handlePress = useCallback((item: PortfolioItem) => {
    navigation.navigate('PortfolioDetails', { itemId: item._id });
  }, [navigation]);

  // Stats row
  const featured = items.filter(i => i.featured).length;
  const totalImages = items.reduce((acc, i) => acc + (i.mediaUrls?.filter(u => u?.includes('cloudinary.com')).length ?? 0), 0);

  const renderHeader = () => (
    <View>
      {/* Stats Row */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {[
          { label: 'Projects', value: items.length, icon: 'folder-outline' as const },
          { label: 'Featured', value: featured, icon: 'star-outline' as const },
          { label: 'Images', value: totalImages, icon: 'images-outline' as const },
        ].map((stat, i) => (
          <View key={i} style={[styles.statItem, i < 2 && { borderRightWidth: 1, borderRightColor: colors.border }]}>
            <Ionicons name={stat.icon} size={16} color={colors.primary} />
            <Text style={{ fontSize: typography.xl, fontWeight: '800', color: colors.text, marginTop: 4 }}>
              {stat.value}
            </Text>
            <Text style={{ fontSize: typography.xs, color: colors.textMuted }}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter pills */}
      {categories.length > 1 && (
        <View style={styles.filterRow}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={c => c}
            contentContainerStyle={{ paddingHorizontal: spacing[4] }}
            renderItem={({ item: cat }) => (
              <PillButton
                label={cat === 'all' ? 'All' : cat}
                active={filterCategory === cat}
                onPress={() => setFilterCategory(cat)}
              />
            )}
          />
        </View>
      )}

      {/* View toggle */}
      <View style={[styles.viewToggleRow, { paddingHorizontal: spacing[4] }]}>
        <Text style={{ fontSize: typography.sm, color: colors.textMuted }}>
          {filtered.length} project{filtered.length !== 1 ? 's' : ''}
        </Text>
        <View style={[styles.viewToggle, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
          {(['grid', 'list'] as const).map(mode => (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={[
                styles.viewToggleBtn,
                {
                  backgroundColor: viewMode === mode ? colors.primary : 'transparent',
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Ionicons
                name={mode === 'grid' ? 'grid-outline' : 'list-outline'}
                size={16}
                color={viewMode === mode ? '#fff' : colors.textMuted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  if (isLoading) return (
    <ScreenWrapper>
      <ScreenHeader
        title="My Portfolio"
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add', onPress: () => navigation.navigate('AddPortfolio') }}
      />
      <LoadingState message="Loading portfolio…" />
    </ScreenWrapper>
  );

  return (
    <ScreenWrapper>
      <ScreenHeader
        title="My Portfolio"
        subtitle={`${items.length} project${items.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
        rightAction={{ icon: 'add', onPress: () => navigation.navigate('AddPortfolio') }}
      />

      {viewMode === 'grid' ? (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: spacing[4] }}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 4 }}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="images-outline"
              title="No portfolio items"
              subtitle="Add your first project to showcase your work to potential clients."
              action={{ label: 'Add Project', onPress: () => navigation.navigate('AddPortfolio') }}
            />
          }
          renderItem={({ item }) => (
            <PortfolioCard
              item={item}
              onPress={handlePress}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isOwner
            />
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i._id}
          contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: 100, paddingTop: 4 }}
          ListHeaderComponent={renderHeader}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon="images-outline"
              title="No portfolio items"
              subtitle="Add your first project to showcase your work."
              action={{ label: 'Add Project', onPress: () => navigation.navigate('AddPortfolio') }}
            />
          }
          renderItem={({ item }) => (
            <PortfolioListItem
              item={item}
              onPress={handlePress}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isOwner
            />
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={() => navigation.navigate('AddPortfolio')}
        style={[styles.fab, { backgroundColor: colors.primary, borderRadius: 28 }]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  filterRow: {
    marginBottom: 12,
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  viewToggleBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
