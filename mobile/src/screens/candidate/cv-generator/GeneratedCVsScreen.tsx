/**
 * src/screens/candidate/cv-generator/GeneratedCVsScreen.tsx
 * Step 3 — list of previously generated CVs with download + regenerate actions.
 */

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CandidateStackParamList } from '../../../navigation/CandidateNavigator';
import { GeneratedCVCard } from '../../../components/cv/GeneratedCVCard';
import { useGeneratedCVs, useDownloadCV } from '../../../hooks/useCvGenerator';
import { useThemeStore } from '../../../store/themeStore';
import { GeneratedCV } from '../../../services/cvGeneratorService';

type Props = NativeStackScreenProps<CandidateStackParamList, 'GeneratedCVs'>;

export const GeneratedCVsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, typography, borderRadius } = theme;

  const { data: cvs = [], isLoading, refetch } = useGeneratedCVs();
  const downloadMut = useDownloadCV();

  // Track per-CV loading state for button spinners
  const [downloadingId,   setDownloadingId]   = useState<string | null>(null);

  const handleDownload = (cv: GeneratedCV) => {
    setDownloadingId(cv._id);
    downloadMut.mutate(
      { cvId: cv._id, fileName: cv.originalName ?? cv.fileName },
      { onSettled: () => setDownloadingId(null) },
    );
  };

  const handleRegenerate = (cv: GeneratedCV) => {
    navigation.navigate('CvPreview', {
      templateId:    cv.templateId,
      templateName:  cv.originalName ?? cv.templateId,
      regenerateCvId: cv._id,
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: typography.lg, fontWeight: '700', color: colors.text }}>
            My Generated CVs
          </Text>
          {cvs.length > 0 && (
            <View
              style={[
                styles.countBadge,
                { backgroundColor: colors.primary, borderRadius: borderRadius.full },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }}>
                {cvs.length}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('CvTemplates')}>
          <Ionicons name="add-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* ── CV list ─────────────────────────────────────────────── */}
      <FlatList
        data={cvs}
        keyExtractor={cv => cv._id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <GeneratedCVCard
            cv={item}
            isDownloading={downloadingId === item._id}
            isRegenerating={false}
            onDownload={() => handleDownload(item)}
            onRegenerate={() => handleRegenerate(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={68} color={colors.border} />
            <Text
              style={{
                fontSize:  typography.md,
                fontWeight: '700',
                color:     colors.text,
                marginTop: 16,
              }}
            >
              No CVs generated yet
            </Text>
            <Text
              style={{
                fontSize:     typography.sm,
                color:        colors.textMuted,
                textAlign:    'center',
                marginTop:    6,
                paddingHorizontal: 32,
                lineHeight:   20,
              }}
            >
              Pick a template and generate your first professional CV in seconds.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('CvTemplates')}
              style={[
                styles.emptyBtn,
                { backgroundColor: colors.primary, borderRadius: borderRadius.lg },
              ]}
            >
              <Ionicons name="add-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm, marginLeft: 6 }}>
                Generate Your First CV
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical:   12,
    borderBottomWidth: 1,
  },
  countBadge: {
    width:          22,
    height:         22,
    alignItems:     'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems:  'center',
    paddingTop:  80,
    paddingHorizontal: 24,
    gap: 0,
  },
  emptyBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    marginTop:      20,
    paddingHorizontal: 24,
    paddingVertical:   14,
  },
});