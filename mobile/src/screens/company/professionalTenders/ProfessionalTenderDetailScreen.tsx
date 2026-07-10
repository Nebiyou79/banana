// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/professional/tenders/ProfessionalTenderDetailScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FIXED: Added onViewBidDetail to navigate to OwnerBidDetail
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import {
  useDeleteProfessionalTender,
  useProfessionalTender,
  usePublishProfessionalTender,
  useRevealProfessionalTender,
  useCloseProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import OwnerTenderDetails from '../../../components/professionalTenders/OwnerTenderDetails';
import type {
  ProfessionalTender,
  TenderAction,
  TenderAttachment,
} from '../../../types/professionalTender';

// ─── Route params ─────────────────────────────────────────────────────────────

interface RouteParams {
  tenderId: string;
  fromMyTenders?: boolean;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const ProfessionalTenderDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors } = useTheme();

  const tenderId = route.params?.tenderId;

  const {
    data:        tenderData,
    isLoading,
    isError,
    error,
    refetch,
  } = useProfessionalTender(tenderId);

  const tender: ProfessionalTender | undefined = tenderData?.data;

  // ─── Mutations ─────────────────────────────────────────────────────────
  const deleteMutation  = useDeleteProfessionalTender();
  const publishMutation = usePublishProfessionalTender();
  const revealMutation  = useRevealProfessionalTender();
  const closeMutation   = useCloseProfessionalTender();

  // ─── Back navigation ───────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('ProfessionalTenders', {
        screen: 'MyProfessionalTenders',
      });
    }
  }, [navigation]);

  // ─── Reveal bids ───────────────────────────────────────────────────────
  const handleRevealBids = useCallback(() => {
    if (!tender) return;
    Alert.alert(
      'Reveal Bids',
      'Once revealed, all bid amounts become visible to you. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Reveal',
          onPress: () =>
            revealMutation.mutate(tenderId, { onSuccess: () => refetch() }),
        },
      ],
    );
  }, [tender, tenderId, revealMutation, refetch]);

  // ─── Owner action dispatch ─────────────────────────────────────────────
  const handleAction = useCallback(
    (action: TenderAction) => {
      if (!tender) return;

      switch (action) {
        case 'edit':
          navigation.navigate('EditProfessionalTender', { tenderId });
          break;

        case 'publish':
          Alert.alert('Publish Tender', `Publish "${tender.title}"?`, [
            { text: 'Cancel', style: 'cancel' },
            {
              text:    'Publish',
              onPress: () =>
                publishMutation.mutate(tenderId, { onSuccess: () => refetch() }),
            },
          ]);
          break;

        case 'delete':
          Alert.alert(
            'Delete Tender',
            `Delete "${tender.title}"? This cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text:    'Delete',
                style:   'destructive',
                onPress: () =>
                  deleteMutation.mutate(tenderId, { onSuccess: () => handleBack() }),
              },
            ],
          );
          break;

        case 'reveal':
          handleRevealBids();
          break;

        case 'addAddendum':
          navigation.navigate('AddendumScreen', { tenderId });
          break;

        case 'viewAllBids':
          navigation.navigate('IncomingBids', { tenderId });
          break;

        case 'close':
          Alert.alert(
            'Close Tender',
            `Close "${tender.title}"? Bidding will stop.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text:    'Close',
                style:   'destructive',
                onPress: () =>
                  closeMutation.mutate(tenderId, { onSuccess: () => refetch() }),
              },
            ],
          );
          break;

        default:
          break;
      }
    },
    [
      tender,
      tenderId,
      navigation,
      publishMutation,
      deleteMutation,
      closeMutation,
      handleBack,
      handleRevealBids,
      refetch,
    ],
  );

  // ─── View single bid detail ────────────────────────────────────────────
  const handleViewBidDetail = useCallback(
    (bidId: string) => {
      navigation.navigate('OwnerBidDetail', { bidId, tenderId });
    },
    [navigation, tenderId],
  );

  // ─── Attachment handlers ───────────────────────────────────────────────
  const handleDownloadAttachment = useCallback(async (attachment: TenderAttachment) => {
    const url = (attachment as any).url as string | undefined;
    if (!url) {
      Alert.alert('Download unavailable', 'No URL available for this file.');
      return;
    }
    try {
      const can = await Linking.canOpenURL(url);
      if (!can) throw new Error('No app to open this URL');
      await Linking.openURL(url);
    } catch (err: any) {
      Alert.alert("Couldn't open file", err?.message ?? 'Try again.');
    }
  }, []);

  const handleUploadAttachment = useCallback(() => {
    Alert.alert('Upload', 'Attachment upload coming in the next sprint.');
  }, []);

  const handleRemoveAttachment = useCallback((attachment: TenderAttachment) => {
    Alert.alert('Remove Attachment', `Remove "${attachment.originalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text:    'Remove',
        style:   'destructive',
        onPress: () => Alert.alert('Info', 'Remove coming soon.'),
      },
    ]);
  }, []);

  // ─── Loading state ─────────────────────────────────────────────────────
  if (isLoading || (!tender && !isError)) {
    return (
      <SafeAreaView style={[S.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={S.navBar}>
          <Pressable
            onPress={handleBack}
            style={S.navBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={S.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────
  if (isError || !tender) {
    return (
      <SafeAreaView style={[S.root, { backgroundColor: colors.bg }]} edges={['top']}>
        <View style={[S.navBar, { borderBottomColor: colors.border }]}>
          <Pressable
            onPress={handleBack}
            style={S.navBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={[S.navTitle, { color: colors.text }]}>Tender Detail</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={S.center}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
          <Text style={[S.errorText, { color: colors.text }]}>
            {(error as any)?.message ?? 'Could not load this tender.'}
          </Text>
          <Pressable
            onPress={handleBack}
            style={[S.backBtn, { backgroundColor: colors.primary }]}
            accessibilityRole="button"
          >
            <Text style={[S.backBtnText, { color: colors.textInverse }]}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Derived state ─────────────────────────────────────────────────────
  const isMutating =
    publishMutation.isPending ||
    deleteMutation.isPending  ||
    revealMutation.isPending  ||
    closeMutation.isPending;

  // ─── Main render ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[S.root, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Nav bar */}
      <View style={[S.navBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleBack}
          style={S.navBack}
          accessibilityRole="button"
          accessibilityLabel="Back to My Tenders"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <Text style={[S.navTitle, { color: colors.text }]} numberOfLines={1}>
          {tender.title}
        </Text>

        <Pressable
          onPress={() => navigation.navigate('EditProfessionalTender', { tenderId })}
          style={S.navAction}
          accessibilityRole="button"
          accessibilityLabel="Edit tender"
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
        </Pressable>
      </View>

      {/* Owner tabbed detail view */}
      <OwnerTenderDetails
        tender={tender}
        onAction={handleAction}
        isMutating={isMutating}
        onRevealBids={handleRevealBids}
        isRevealing={revealMutation.isPending}
        onUploadAttachment={handleUploadAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        onDownloadAttachment={handleDownloadAttachment}
        onIssueAddendum={() => navigation.navigate('AddendumScreen', { tenderId })}
        onViewAllBids={() => navigation.navigate('IncomingBids', { tenderId })}
        onViewBidDetail={handleViewBidDetail}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  root:   { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },

  navBar: {
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 8,
    paddingVertical:   6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight:         52,
  },
  navBack:   { padding: 8, minHeight: 44, justifyContent: 'center' },
  navTitle:  { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center', marginHorizontal: 4 },
  navAction: { padding: 8, minHeight: 44, justifyContent: 'center' },

  errorText:   { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  backBtn:     { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  backBtnText: { fontSize: 13, fontWeight: '700' },
});

export default ProfessionalTenderDetailScreen;