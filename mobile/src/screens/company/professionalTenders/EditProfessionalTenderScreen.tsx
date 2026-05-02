// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/company/professionalTenders/EditProfessionalTenderScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Thin wrapper around the 7-step ProfessionalTenderForm for *edit* mode.
//
//  • tenderId comes from route.params
//  • Form internally calls useProfessionalTenderEditData(tenderId)
//  • If status !== 'draft' → form fires onRedirectToAddendum, which we wire
//    to navigate.replace('AddendumScreen', { tenderId })
//  • onSuccess(id) → navigate.replace to detail
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import ProfessionalTenderForm from '../../../components/professionalTenders/ProfessionalTenderForm';

interface RouteParams {
  tenderId: string;
}

export const EditProfessionalTenderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const isDark = useThemeStore((s) => s.theme.isDark);
  const background = isDark ? '#0F172A' : '#F8FAFC';

  const tenderId = route.params?.tenderId;

  const handleSuccess = useCallback(
    (id: string) => {
      navigation.replace?.('ProfessionalTenderDetail', { tenderId: id });
    },
    [navigation],
  );

  const handleCancel = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  /**
   * Edit-lock redirect: when the form detects a non-draft tender, it bounces
   * us to the AddendumScreen.  This is defense-in-depth — the form also
   * shows an alert if this prop is missing, but wiring it is the correct UX.
   */
  const handleRedirectToAddendum = useCallback(
    (id: string) => {
      navigation.replace?.('AddendumScreen', { tenderId: id });
    },
    [navigation],
  );

  if (!tenderId) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={['bottom']}>
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: isDark ? '#F1F5F9' : '#0F172A' }]}>
            Missing tender id.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={['bottom']}>
      <View style={styles.formWrap}>
        <ProfessionalTenderForm
          tenderId={tenderId}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          onRedirectToAddendum={handleRedirectToAddendum}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  formWrap: { flex: 1 },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14 },
});

export default EditProfessionalTenderScreen;
