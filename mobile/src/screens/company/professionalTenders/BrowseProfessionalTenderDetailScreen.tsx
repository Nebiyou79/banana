// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/browse/BrowseProfessionalTenderDetailScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  FIXED:
//   • colors.textInverse instead of hardcoded string in error state button
//   • useFocusEffect refetch on return from bid form
//   • All theme tokens consistent
//   • FIXED: Navigation uses direct navigate since SubmitBid is in same stack

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

interface RouteParams { tenderId: string }

export const BrowseProfessionalTenderDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route      = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors } = useTheme();
  const tenderId   = route.params?.tenderId;

  const { data, isLoading, isError, error, refetch } = useProfessionalTender(tenderId);
  const tender = data?.data;

  // Refetch on focus so returning from bid form shows fresh state
  useFocusEffect(
    useCallback(() => { refetch(); }, [refetch]),
  );

  // Save toggle
  const { data: savedData }   = useSavedProfessionalTenders();
  const savedIds              = new Set((savedData?.tenders ?? []).map((t) => t._id));
  const isSaved               = tenderId ? savedIds.has(tenderId) : false;
  const toggleSaveMutation    = useToggleSavedProfessionalTender();

  const toggleSave = useCallback(() => {
    if (!tenderId) return;
    toggleSaveMutation.mutate({ id: tenderId });
  }, [tenderId, toggleSaveMutation]);

  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  // FIXED: Navigate directly to SubmitBid since it's in the same CompanyProfEntryStack
const handlePlaceBid = useCallback(() => {
  if (!tender) return;
  
  // Navigate to SubmitBidScreen instead of directly submitting
  navigation.navigate('SubmitBid', { 
    tenderId: tender._id 
  });
}, [tender, navigation]);

  // FIXED: Navigate directly to MyBidDetail since it might be in the same or parent stack
  const handleViewBid = useCallback((bidId: string) => {
    // Try navigating in current stack first, fall back to parent
    try {
      navigation.navigate('MyBidDetail', { bidId, tenderId });
    } catch {
      // If MyBidDetail is not in current stack, try parent navigator
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('MyBidDetail', { bidId, tenderId });
      }
    }
  }, [navigation, tenderId]);

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
      'Q&A module planned for a later release. Contact details are in the Entity tab.',
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
    navigation.navigate('PublicCompanyProfile', { companyId: entityId });
  }, [navigation]);

  // Loading state
  if (isLoading || (!tender && !isError)) {
    return (
      <View style={[styles.fullCenter, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Error state
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

const styles = StyleSheet.create({
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  errorText:  { fontSize: 14, textAlign: 'center', maxWidth: 280 },
  btn:        { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, minHeight: 44, justifyContent: 'center' },
  btnLabel:   { fontSize: 13, fontWeight: '700' },
});

export default BrowseProfessionalTenderDetailScreen;