/**
 * screens/freelancer/PortfolioDetailsScreen.tsx
 * Uses GET /freelancer/portfolio/:id from backend.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, Linking, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { usePortfolioItem, useDeletePortfolioItem } from '../../hooks/useFreelancer';
import { getOptimizedUrl } from '../../services/freelancerService';
import { ScreenWrapper, ScreenHeader, LoadingState, EmptyState } from '../../components/shared/UIComponents';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

const { width } = Dimensions.get('window');
type Nav   = NativeStackNavigationProp<FreelancerStackParamList>;
type Route = RouteProp<FreelancerStackParamList, 'PortfolioDetails'>;

export const PortfolioDetailsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { params }  = useRoute<Route>();
  const { theme }   = useThemeStore();
  const { colors, spacing, typography, borderRadius } = theme;

  const [activeImage, setActiveImage] = useState(0);
  const { data: item, isLoading, error } = usePortfolioItem(params.itemId);
  const deleteMutation = useDeletePortfolioItem();

  const imageUrls = (item?.mediaUrls ?? []).filter(u => u?.includes('cloudinary.com'));

  const handleDelete = () => {
    Alert.alert('Delete Project', 'This cannot be undone. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          deleteMutation.mutate(params.itemId, {
            onSuccess: () => navigation.goBack(),
          });
        },
      },
    ]);
  };

  if (isLoading) return (
    <ScreenWrapper>
      <ScreenHeader title="Project Details" onBack={() => navigation.goBack()} />
      <LoadingState message="Loading project…" />
    </ScreenWrapper>
  );

  if (!item || error) return (
    <ScreenWrapper>
      <ScreenHeader title="Project Details" onBack={() => navigation.goBack()} />
      <EmptyState icon="alert-circle-outline" title="Project not found" subtitle="This project may have been removed." />
    </ScreenWrapper>
  );

  const BUDGET_TYPE_LABELS: Record<string, string> = {
    fixed: 'Fixed', hourly: '/hr', daily: '/day', monthly: '/mo',
  };

  return (
    <ScreenWrapper>
      <ScreenHeader
        title={item.title}
        onBack={() => navigation.goBack()}
        rightAction={{
          icon: 'pencil-outline',
          onPress: () => navigation.navigate('EditPortfolio', { itemId: item._id }),
        }}
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        {imageUrls.length > 0 && (
          <View>
            <Image
              source={{ uri: getOptimizedUrl(imageUrls[activeImage], 800, 500) }}
              style={[styles.heroImage, { width }]}
              resizeMode="cover"
            />
            {imageUrls.length > 1 && (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailRow}
                  style={[styles.thumbnailScroll, { backgroundColor: colors.surface }]}
                >
                  {imageUrls.map((url, i) => (
                    <TouchableOpacity key={i} onPress={() => setActiveImage(i)}>
                      <Image
                        source={{ uri: getOptimizedUrl(url, 80, 80) }}
                        style={[
                          styles.thumbnail,
                          {
                            borderColor: i === activeImage ? colors.primary : colors.border,
                            borderRadius: borderRadius.md,
                            opacity: i === activeImage ? 1 : 0.6,
                          },
                        ]}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {/* Dots */}
                <View style={styles.dotsRow}>
                  {imageUrls.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, {
                        backgroundColor: i === activeImage ? colors.primary : colors.border,
                      }]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        <View style={{ padding: spacing[5] }}>
          {/* Title & badges */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography['2xl'], fontWeight: '800', color: colors.text }}>
                {item.title}
              </Text>
              <View style={styles.metaBadges}>
                {item.featured && (
                  <View style={[styles.metaBadge, { backgroundColor: '#F59E0B20', borderRadius: 10 }]}>
                    <Ionicons name="star" size={11} color="#F59E0B" />
                    <Text style={{ fontSize: 10, color: '#F59E0B', fontWeight: '700', marginLeft: 3 }}>Featured</Text>
                  </View>
                )}
                {item.visibility && (
                  <View style={[styles.metaBadge, {
                    backgroundColor: item.visibility === 'public' ? colors.successLight : colors.border,
                    borderRadius: 10,
                  }]}>
                    <Ionicons
                      name={item.visibility === 'public' ? 'globe-outline' : 'lock-closed-outline'}
                      size={10}
                      color={item.visibility === 'public' ? colors.success : colors.textMuted}
                    />
                    <Text style={{
                      fontSize: 10, fontWeight: '700', marginLeft: 3,
                      color: item.visibility === 'public' ? colors.success : colors.textMuted,
                    }}>
                      {item.visibility === 'public' ? 'Public' : 'Private'}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsGrid, {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.xl,
            borderColor: colors.border,
          }]}>
            {item.budget != null && (
              <View style={[styles.statCell, { borderRightWidth: 1, borderRightColor: colors.border }]}>
                <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: typography.base, fontWeight: '800', color: colors.primary, marginTop: 4 }}>
                  ${item.budget.toLocaleString()}{item.budgetType ? BUDGET_TYPE_LABELS[item.budgetType] : ''}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Budget</Text>
              </View>
            )}
            {item.duration && (
              <View style={[styles.statCell, { borderRightWidth: item.client ? 1 : 0, borderRightColor: colors.border }]}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: typography.base, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                  {item.duration}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Duration</Text>
              </View>
            )}
            {item.client && (
              <View style={styles.statCell}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={{ fontSize: typography.sm, fontWeight: '700', color: colors.text, marginTop: 4 }} numberOfLines={1}>
                  {item.client}
                </Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Client</Text>
              </View>
            )}
          </View>

          {/* Description */}
          {item.description && (
            <View style={{ marginTop: spacing[5] }}>
              <SectionTitle icon="document-text-outline" label="About This Project" />
              <Text style={{ fontSize: typography.base, color: colors.textSecondary, lineHeight: 24 }}>
                {item.description}
              </Text>
            </View>
          )}

          {/* Technologies */}
          {item.technologies && item.technologies.length > 0 && (
            <View style={{ marginTop: spacing[5] }}>
              <SectionTitle icon="code-slash-outline" label="Technologies Used" />
              <View style={styles.tagWrap}>
                {item.technologies.map((t, i) => (
                  <View key={i} style={[styles.techTag, {
                    backgroundColor: colors.primaryLight,
                    borderRadius: borderRadius.md,
                  }]}>
                    <Text style={{ fontSize: typography.xs, color: colors.primary, fontWeight: '600' }}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Live link */}
          {item.projectUrl && (
            <TouchableOpacity
              onPress={() => Linking.openURL(item.projectUrl!)}
              style={[styles.linkBtn, {
                backgroundColor: colors.primaryLight,
                borderRadius: borderRadius.lg,
                borderColor: colors.primary + '40',
              }]}
            >
              <Ionicons name="open-outline" size={18} color={colors.primary} />
              <Text style={{ fontSize: typography.sm, color: colors.primary, fontWeight: '700', marginLeft: 8 }}>
                View Live Project
              </Text>
              <Ionicons name="chevron-forward" size={14} color={colors.primary} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          )}

          {/* Actions */}
          <View style={[styles.actionsRow, { marginTop: spacing[6] }]}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditPortfolio', { itemId: item._id })}
              style={[styles.actionBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg, flex: 1 }]}
            >
              <Ionicons name="pencil-outline" size={16} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm, marginLeft: 6 }}>Edit Project</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionBtn, { backgroundColor: colors.errorLight, borderRadius: borderRadius.lg, width: 50 }]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const SectionTitle: React.FC<{ icon: keyof typeof Ionicons.glyphMap; label: string }> = ({ icon, label }) => {
  const { theme } = useThemeStore();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <Ionicons name={icon} size={16} color={theme.colors.primary} />
      <Text style={{ fontSize: theme.typography.base, fontWeight: '700', color: theme.colors.text, marginLeft: 8 }}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  heroImage:      { height: 280 },
  thumbnailScroll:{ paddingVertical: 10 },
  thumbnailRow:   { paddingHorizontal: 16, gap: 8 },
  thumbnail:      { width: 64, height: 64, borderWidth: 2 },
  dotsRow:        { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  dot:            { width: 6, height: 6, borderRadius: 3 },
  titleRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  metaBadges:     { flexDirection: 'row', gap: 6, marginTop: 8 },
  metaBadge:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4 },
  statsGrid:      { flexDirection: 'row', borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  statCell:       { flex: 1, alignItems: 'center', paddingVertical: 16 },
  tagWrap:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techTag:        { paddingHorizontal: 12, paddingVertical: 6 },
  linkBtn:        { flexDirection: 'row', alignItems: 'center', padding: 16, marginTop: 20, borderWidth: 1 },
  actionsRow:     { flexDirection: 'row', gap: 10 },
  actionBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50 },
});