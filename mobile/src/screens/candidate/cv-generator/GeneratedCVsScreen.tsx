/**
 * src/screens/candidate/cv-generator/GeneratedCVsScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium CV library. Uses FlashList + skeleton loading states.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { RefreshControl } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CandidateStackParamList } from '../../../navigation/CandidateNavigator';
import { GeneratedCVCard } from '../../../components/cv/GeneratedCVCard';
import { useGeneratedCVs, useDownloadCV } from '../../../hooks/useCvGenerator';
import { useThemeStore } from '../../../store/themeStore';
import type { GeneratedCV } from '../../../services/cvGeneratorService';

type Props = NativeStackScreenProps<CandidateStackParamList, 'GeneratedCVs'>;

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton: React.FC<{ width?: number | string; height?: number; radius?: number }> = ({
  width = '100%', height = 16, radius = 8,
}) => {
  const { theme } = useThemeStore();
  const anim = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);
  return <Animated.View style={{ width, height, borderRadius: radius, backgroundColor: theme.colors.border, opacity: anim }} />;
};

const SkeletonCVCard = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, marginHorizontal: 16, marginVertical: 6, gap: 12 }}>
    <Skeleton width={46} height={54} radius={10} />
    <View style={{ flex: 1, gap: 8 }}>
      <Skeleton height={14} width="70%" />
      <Skeleton height={11} width="45%" />
      <Skeleton height={11} width="55%" />
    </View>
    <View style={{ gap: 8 }}>
      <Skeleton width={36} height={36} radius={8} />
      <Skeleton width={36} height={36} radius={8} />
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export const GeneratedCVsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius, shadows } = theme;

  const { data: cvs = [], isLoading, refetch } = useGeneratedCVs();
  const downloadMut = useDownloadCV();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = useCallback((cv: GeneratedCV) => {
    setDownloadingId(cv._id);
    downloadMut.mutate(
      { cvId: cv._id, fileName: cv.originalName ?? cv.fileName },
      { onSettled: () => setDownloadingId(null) },
    );
  }, [downloadMut]);

  const handleRegenerate = useCallback((cv: GeneratedCV) => {
    navigation.navigate('CvPreview', {
      templateId:     cv.templateId,
      templateName:   cv.originalName ?? cv.templateId,
      regenerateCvId: cv._id,
    });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: GeneratedCV }) => (
    <GeneratedCVCard
      cv={item}
      isDownloading={downloadingId === item._id}
      isRegenerating={false}
      onDownload={() => handleDownload(item)}
      onRegenerate={() => handleRegenerate(item)}
    />
  ), [downloadingId, handleDownload, handleRegenerate]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>My Generated CVs</Text>
          {cvs.length > 0 && (
            <View style={[s.countBadge, { backgroundColor: colors.primary, borderRadius: borderRadius.full }]}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>{cvs.length}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('CvTemplates')}>
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary banner */}
      {cvs.length > 0 && (
        <View style={[s.summaryBanner, { backgroundColor: colors.primaryLight, borderBottomColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
          <Text style={{ fontSize: 12, color: colors.primary, marginLeft: 6 }}>
            {cvs.filter(c => c.isPrimary).length > 0
              ? 'Your primary CV is shown first on your profile.'
              : 'Tip: Set a CV as Primary to feature it on your profile.'}
          </Text>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View>
          {[...Array(4)].map((_, i) => <SkeletonCVCard key={i} />)}
        </View>
      ) : (
        <FlashList
          data={[...cvs].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))}
          estimatedItemSize={88}
          keyExtractor={cv => cv._id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={s.emptyState}>
              <View style={[s.emptyIconWrap, { backgroundColor: colors.primaryLight, borderRadius: borderRadius.xl }]}>
                <Ionicons name="document-outline" size={48} color={colors.primary} />
              </View>
              <Text style={{ fontSize: typography.md, fontWeight: '700', color: colors.text, marginTop: 20 }}>
                No CVs yet
              </Text>
              <Text style={{ fontSize: typography.sm, color: colors.textMuted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32, lineHeight: 20 }}>
                Generate your first professional CV in seconds from your profile data.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('CvTemplates')}
                style={[s.emptyBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg, ...shadows.md }]}
              >
                <Ionicons name="add-outline" size={18} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm, marginLeft: 6 }}>
                  Generate Your First CV
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  countBadge:    { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  summaryBanner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1 },
  emptyState:    { alignItems: 'center', paddingTop: 72, paddingHorizontal: 24 },
  emptyIconWrap: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  emptyBtn:      { flexDirection: 'row', alignItems: 'center', marginTop: 22, paddingHorizontal: 24, paddingVertical: 14 },
});
