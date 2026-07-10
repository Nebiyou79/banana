// src/screens/company/bids/SubmitBidScreen.tsx
// Thin wrapper around BidForm wizard component
// ─────────────────────────────────────────────────────────────────────────────
// FIXED: Removed infinite loop by removing refetch useEffect
// FIXED: Navigation uses direct navigation calls
// FIXED: initialFinancial properly extracted from financialBreakdown.items
// FIXED: isEditMode enabled when updating an existing submitted bid
// FIXED: Safe fallbacks for all initial values

import React, { useEffect, useRef, useMemo } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, StyleSheet, Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../../../hooks/useTheme';
import { useGetMyBid } from '../../../hooks/useBid';
import { useProfessionalTender } from '../../../hooks/useProfessionalTender';
import { BidForm } from '../../../components/bids/BidForm';
import { BidStatus } from '../../../types/bid';
import type { CoverSheetFormValues } from '../../../components/bids/BidCoverSheetForm';
import type { CPOFormValues } from '../../../components/bids/BidCPOForm';

// ── Route params ──────────────────────────────────────────────────────────────

interface RouteParams { tenderId: string }

// ── Component ─────────────────────────────────────────────────────────────────

const SubmitBidScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { tenderId } = route.params as RouteParams;
  const { colors } = useTheme();
  
  // Use ref to track if we've already navigated
  const hasNavigated = useRef(false);

  const { data: tender, isLoading: tenderLoading } = useProfessionalTender(tenderId);
  const { data: existingBid, hasBid, isLoading: bidLoading } = useGetMyBid(tenderId);

  const isLoading = tenderLoading || bidLoading;
  
  // Determine if we're updating an existing bid
  const isUpdateMode: boolean = !!(hasBid && existingBid && existingBid.status === BidStatus.Submitted);

  // ═══ Extract initial values from existing bid (with safe fallbacks) ═══
// In SubmitBidScreen.tsx, fix the initialCoverSheet useMemo:

const initialCoverSheet: Partial<CoverSheetFormValues> | undefined = useMemo(() => {
  if (!existingBid?.coverSheet) return undefined;
  const cs = existingBid.coverSheet;
  return {
    companyName: cs.companyName ?? '',
    representative: (cs as any).representative ?? cs.authorizedRepresentative ?? '',
    representativeTitle: cs.representativeTitle ?? '',
    companyEmail: cs.companyEmail ?? '',
    companyPhone: cs.companyPhone ?? '',
    companyAddress: cs.companyAddress ?? '',
    tinNumber: cs.tinNumber ?? '',
    licenseNumber: cs.licenseNumber ?? '',
    totalBidValue: String(cs.totalBidValue ?? ''),
    currency: cs.currency ?? 'ETB',
    bidValidityPeriod: cs.bidValidityPeriod ? String(cs.bidValidityPeriod) : '',
    // FIX: Convert null | undefined | boolean → boolean
    declarationAccepted: cs.declarationAccepted === true,
  } as Partial<CoverSheetFormValues>;
}, [existingBid]);

  const initialTechnical: string | undefined = useMemo(() => {
    return existingBid?.technicalProposal || undefined;
  }, [existingBid]);

  // ═══ FIXED: Extract items array from financialBreakdown ═══
  const initialFinancial = useMemo(() => {
    if (!existingBid?.financialBreakdown) return undefined;
    
    // Handle both array and { items: [...] } formats
    let items: any[] = [];
    if (Array.isArray(existingBid.financialBreakdown)) {
      items = existingBid.financialBreakdown;
    } else if ((existingBid.financialBreakdown as any).items) {
      items = (existingBid.financialBreakdown as any).items;
    }
    
    if (items.length === 0) return undefined;
    
    // Map to the format BidForm expects
    return items.map((item: any) => ({
      description: item.description ?? '',
      quantity: item.quantity ?? 0,
      unit: item.unit ?? '',
      unitPrice: item.unitPrice ?? 0,
      totalPrice: item.totalPrice ?? 0,
      category: item.category ?? 'other',
    }));
  }, [existingBid]);

  const initialCPO: Partial<CPOFormValues> | undefined = useMemo(() => {
    if (!existingBid?.cpo) return undefined;
    const cpo = existingBid.cpo;
    return {
      bidSecurityType: cpo.bidSecurityType ?? 'cpo',
      cpoNumber: cpo.cpoNumber ?? '',
      cpoAmount: cpo.amount != null ? String(cpo.amount) : '',
      cpoCurrency: cpo.currency ?? 'ETB',
      cpoIssuingBank: cpo.issuingBank ?? '',
      cpoIssueDate: cpo.issueDate ?? '',
      cpoExpiryDate: cpo.expiryDate ?? '',
    };
  }, [existingBid]);

  // ═══ Navigation logic ═══
  useEffect(() => {
    // Only navigate once and only when data is loaded
    if (!bidLoading && !hasNavigated.current) {
      if (hasBid && existingBid) {
        // If the bid has no status, it's a draft - stay on form
        if (!existingBid.status) {
          return;
        }
        
        // ONLY redirect if the bid is ALREADY SUBMITTED
        // (for now we allow editing submitted bids too, so DON'T redirect)
        // If you want to block re-submission, uncomment below:
        // if (existingBid.status === BidStatus.Submitted) {
        //   hasNavigated.current = true;
        //   navigation.replace('MyBidDetail', { 
        //     tenderId, 
        //     bidId: existingBid._id 
        //   });
        // }
      }
    }
  }, [bidLoading, hasBid, existingBid, tenderId, navigation]);

  // ═══ Loading state ═══
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]}>
        <View style={styles.fullCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const tenderData = (tender as any)?.data ?? tender;
  const tenderCurrency = tenderData?.currency ?? 'ETB';

  // ═══ Debug log ═══
  console.log('📋 SubmitBidScreen state:');
  console.log('  isUpdateMode:', isUpdateMode);
  console.log('  hasBid:', hasBid);
  console.log('  existingBid?._id:', existingBid?._id);
  console.log('  initialFinancial items:', initialFinancial?.length ?? 0);
  console.log('  initialCoverSheet:', initialCoverSheet ? 'present' : 'undefined');
  console.log('  initialTechnical:', initialTechnical ? `${initialTechnical.substring(0, 50)}...` : 'undefined');
  console.log('  initialCPO:', initialCPO ? 'present' : 'undefined');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isUpdateMode ? 'Update Bid' : 'Submit Bid'}
          </Text>
          {tenderData?.referenceNumber && (
            <Text style={[styles.headerSub, { color: colors.textMuted }]} numberOfLines={1}>
              {tenderData.referenceNumber}
            </Text>
          )}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Bid Form */}
      <BidForm
        tenderId={tenderId}
        tenderCurrency={tenderCurrency}
        isEditMode={isUpdateMode}
        existingBidId={existingBid?._id}
        initialCoverSheet={initialCoverSheet}
        initialTechnical={initialTechnical}
        initialFinancial={initialFinancial}
        initialCPO={initialCPO}
        onSuccess={() => {
          if (isUpdateMode && existingBid) {
            navigation.replace('MyBidDetail', { tenderId, bidId: existingBid._id });
          } else {
            navigation.goBack();
          }
        }}
        onCancel={() => navigation.goBack()}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, gap: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 11, fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }) },
});

export default SubmitBidScreen;