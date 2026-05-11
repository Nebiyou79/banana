// src/screens/professional/tenders/ProfessionalTenderDetailScreen.tsx

import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import { withAlpha } from '../../../theme/utils';
import {
  useDeleteProfessionalTender,
  useProfessionalTender,
  usePublishProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import type { ProfessionalTender } from '../../../types/professionalTender';

interface RouteParams {
  tenderId: string;
}

const ProfessionalTenderDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const tenderId = route.params?.tenderId;

  const {
    data: tenderData,
    isLoading,
    refetch,
    isRefetching,
  } = useProfessionalTender(tenderId);

  const deleteMutation  = useDeleteProfessionalTender();
  const publishMutation = usePublishProfessionalTender();

  const tender: ProfessionalTender | undefined = tenderData?.data;

  const handleDelete = useCallback(() => {
    if (!tender) return;
    Alert.alert(
      'Delete Tender',
      `Delete "${tender.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteMutation.mutate(tenderId, {
              onSuccess: () => navigation.goBack(),
            }),
        },
      ]
    );
  }, [tender, deleteMutation, tenderId, navigation]);

  const handlePublish = useCallback(() => {
    if (!tender) return;
    Alert.alert('Publish Tender', `Publish "${tender.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Publish', onPress: () => publishMutation.mutate(tenderId) },
    ]);
  }, [tender, publishMutation, tenderId]);

  if (isLoading || !tender) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={styles.center}>
          {isLoading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.textMuted }]}>
                Tender not found.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backLink, { borderColor: colors.border }]}
                accessibilityRole="button"
              >
                <Text style={[styles.backLinkText, { color: colors.text }]}>Go Back</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const isDraft     = tender.status === 'draft';
  const bidsCount   = tender.metadata?.totalBids ?? tender.bidCount ?? 0;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Nav bar */}
      <View style={[styles.navBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.navBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          Tender Detail
        </Text>
        <Pressable
          onPress={() => navigation.navigate('EditProfessionalTender', { tenderId })}
          style={styles.navAction}
          accessibilityRole="button"
          accessibilityLabel="Edit tender"
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xxl },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Title block */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{tender.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
              <Text style={[styles.statusText, { color: colors.primary }]}>
                {tender.status.toUpperCase()}
              </Text>
            </View>
          </View>
          {tender.referenceNumber && (
            <Text style={[styles.refNum, { color: colors.textMuted, fontFamily: 'monospace' }]}>
              {tender.referenceNumber}
            </Text>
          )}
          {tender.procurementCategory && (
            <Text style={[styles.category, { color: colors.textMuted }]}>
              {tender.procurementCategory}
            </Text>
          )}
        </View>

        {/* Deadline + bids row */}
        <View style={styles.infoRow}>
          <View style={[styles.infoChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.infoChipText, { color: colors.textMuted }]}>
              {tender.deadline
                ? new Date(tender.deadline).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })
                : 'No deadline'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('IncomingBids', { tenderId })}
            accessibilityRole="button"
            style={[styles.infoChip, { backgroundColor: withAlpha(colors.primary, 0.10), borderColor: withAlpha(colors.primary, 0.25) }]}
          >
            <Ionicons name="people-outline" size={14} color={colors.primary} />
            <Text style={[styles.infoChipText, { color: colors.primary }]}>
              {bidsCount} bid{bidsCount !== 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {tender.briefDescription && (
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
            <Text style={[styles.body, { color: colors.text }]}>{tender.briefDescription}</Text>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.body, { color: colors.text }]}>
            {tender.description.replace(/<[^>]+>/g, ' ').trim()}
          </Text>
        </View>

        {/* Workflow */}
        <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Workflow</Text>
          <Text style={[styles.body, { color: colors.text }]}>
            {tender.workflowType === 'closed'
              ? 'Sealed / Closed bidding — bids hidden until revealed'
              : 'Open bidding — bid amounts visible as received'}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {isDraft && (
            <TouchableOpacity
              onPress={handlePublish}
              disabled={publishMutation.isPending}
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              accessibilityRole="button"
            >
              {publishMutation.isPending ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Text style={[styles.actionBtnText, { color: colors.textInverse }]}>
                  Publish Tender
                </Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate('IncomingBids', { tenderId })}
            style={[
              styles.actionBtn,
              {
                backgroundColor: withAlpha(colors.primary, 0.10),
                borderWidth: 1,
                borderColor: withAlpha(colors.primary, 0.30),
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>
              View Bids ({bidsCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('AddendumScreen', { tenderId })}
            style={[
              styles.actionBtn,
              {
                backgroundColor: withAlpha(colors.info, 0.10),
                borderWidth: 1,
                borderColor: withAlpha(colors.info, 0.30),
              },
            ]}
            accessibilityRole="button"
          >
            <Text style={[styles.actionBtnText, { color: colors.info }]}>
              Addenda &amp; Amendments
            </Text>
          </TouchableOpacity>

          {isDraft && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleteMutation.isPending}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: withAlpha(colors.danger, 0.08),
                  borderWidth: 1,
                  borderColor: withAlpha(colors.danger, 0.25),
                },
              ]}
              accessibilityRole="button"
            >
              {deleteMutation.isPending ? (
                <ActivityIndicator color={colors.danger} size="small" />
              ) : (
                <Text style={[styles.actionBtnText, { color: colors.danger }]}>
                  Delete Tender
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  errorText: { fontSize: 15 },
  backLink: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1, minHeight: 44, justifyContent: 'center' },
  backLinkText: { fontSize: 14, fontWeight: '600' },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  navBack: { padding: 8, minHeight: 44, justifyContent: 'center' },
  navTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  navAction: { padding: 8, minHeight: 44, justifyContent: 'center' },

  content: { padding: 16, gap: 12 },

  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 6 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontSize: 20, fontWeight: '800', lineHeight: 27 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  refNum: { fontSize: 11 },
  category: { fontSize: 13 },

  infoRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  infoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, minHeight: 36,
  },
  infoChipText: { fontSize: 13, fontWeight: '600' },

  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  body: { fontSize: 14, lineHeight: 22 },

  actions: { gap: 10, marginTop: 4, marginBottom: 24 },
  actionBtn: { borderRadius: 13, paddingVertical: 14, alignItems: 'center', minHeight: 50, justifyContent: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
});

export default ProfessionalTenderDetailScreen;