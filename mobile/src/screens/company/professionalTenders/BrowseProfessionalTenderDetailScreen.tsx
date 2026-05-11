// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/browse/BrowseProfessionalTenderDetailScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import {
  useProfessionalTender,
  useSavedProfessionalTenders,
  useToggleSavedProfessionalTender,
} from '../../../hooks/useProfessionalTender';
import BrowseTenderDetails from '../../../components/professionalTenders/BrowseTenderDetails';
import type { ProfessionalTender, TenderAttachment } from '../../../types/professionalTender';

// ═════════════════════════════════════════════════════════════════════════════
//  ROUTE PARAMS
// ═════════════════════════════════════════════════════════════════════════════

interface RouteParams {
  tenderId: string;
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export const BrowseProfessionalTenderDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors } = useTheme();
  const tenderId   = route.params?.tenderId;

  const { data, isLoading, isError, error, refetch } = useProfessionalTender(tenderId);
  const tender = data?.data;

  // Refetch on focus so returning from a placed bid reflects fresh state
  useFocusEffect(
    useCallback(() => { refetch(); }, [refetch]),
  );

  // ─── Save toggle (backed by real service) ──────────────────────────────
  const { data: savedData }   = useSavedProfessionalTenders();
  const savedIds              = new Set((savedData?.tenders ?? []).map((t) => t._id));
  const isSaved               = tenderId ? savedIds.has(tenderId) : false;
  const toggleSaveMutation    = useToggleSavedProfessionalTender();
  const saveBusy              = toggleSaveMutation.isPending;

  const toggleSave = useCallback(() => {
    if (!tenderId) return;
    toggleSaveMutation.mutate({ id: tenderId });
  }, [tenderId, toggleSaveMutation]);

  // ─── Action handlers ───────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  const handlePlaceBid = useCallback(() => {
    if (!tender) return;
    Alert.alert(
      'Place Bid',
      'The bid submission form ships in a later module. From here you would proceed to a multi-step form to submit your technical and financial proposal.',
      [{ text: 'OK' }],
    );
  }, [tender]);

  const handleViewBid = useCallback((bidId: string) => {
    Alert.alert('View Bid', `Bid id: ${bidId.slice(-8)}\n\nDetail screen ships in the Bids module.`);
  }, []);

  const handleShare = useCallback(async () => {
    if (!tender) return;
    try {
      const message = [
        tender.title,
        tender.referenceNumber ? `Ref: ${tender.referenceNumber}` : null,
        tender.briefDescription,
      ].filter(Boolean).join('\n\n');
      await Share.share({ message, title: tender.title });
    } catch (err: any) {
      Alert.alert("Couldn't share", err?.message ?? 'Share unavailable.');
    }
  }, [tender]);

  const handleAskQuestion = useCallback(() => {
    Alert.alert(
      'Ask a Question',
      'A Q&A module is planned for a later release. For now, contact details for the procuring entity are visible in the Details tab.',
    );
  }, []);

const handleDownloadAttachment = useCallback(async (attachment: TenderAttachment) => {
  const url = attachment.url as unknown as string;
  
  if (!url) {
    Alert.alert('Download unavailable', 'No download URL is available for this file.');
    return;
  }
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) throw new Error('No app available to open this URL');
    await Linking.openURL(url);
  } catch (err: any) {
    Alert.alert("Couldn't open file", err?.message ?? 'Try again.');
  }
}, []);

  const handleViewEntityProfile = useCallback((entityId: string) => {
    Alert.alert(
      'View Profile',
      `Company id: ${entityId.slice(-8)}\n\nThe public company profile screen ships in a later pass.`,
    );
  }, []);

  // ─── Loading ────────────────────────────────────────────────────────────
  if (isLoading || (!tender && !isError)) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !tender) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.text }]}>
          {(error as any)?.message ?? "Couldn't load this tender."}
        </Text>
        <Pressable
          onPress={handleBack}
          style={[styles.btn, { backgroundColor: colors.primary }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={[styles.btnLabel, { color: colors.textInverse }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  // ─── Determine isInvited ───────────────────────────────────────────────
  const isInvited = (() => {
    if (typeof (tender as any).isInvited === 'boolean') return (tender as any).isInvited;
    return undefined;
  })();

  return (
    <BrowseTenderDetails
      tender={tender}
      isInvited={isInvited}
      isSaved={isSaved}
      onToggleSave={toggleSave}
      onPlaceBid={handlePlaceBid}
      onViewBid={handleViewBid}
      onShare={handleShare}
      onAskQuestion={handleAskQuestion}
      onDownloadAttachment={handleDownloadAttachment}
      onViewEntityProfile={handleViewEntityProfile}
      onBack={handleBack}
    />
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText:  { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  btn:        { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  btnLabel:   { fontSize: 13, fontWeight: '700' },
});

export default BrowseProfessionalTenderDetailScreen;