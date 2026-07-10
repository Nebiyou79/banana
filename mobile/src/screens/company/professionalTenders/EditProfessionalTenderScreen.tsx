// src/screens/company/professionalTenders/EditProfessionalTenderScreen.tsx
//
// FIX: Same bottom-edge double-padding fix as CreateProfessionalTenderScreen.
// See that file for the full explanation.

import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import ProfessionalTenderForm from '../../../components/professionalTenders/ProfessionalTenderForm';

interface RouteParams {
  tenderId: string;
}

export const EditProfessionalTenderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<{ key: string; name: string; params: RouteParams }>();
  const { colors } = useTheme();

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

  const handleRedirectToAddendum = useCallback(
    (id: string) => {
      navigation.replace?.('AddendumScreen', { tenderId: id });
    },
    [navigation],
  );

  if (!tenderId) {
    return (
      // Error state — no tabs here, safe to include bottom edge
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.bg }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.errorWrap}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Missing tender id.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    // FIX: edges={['top']} only — navigator owns the bottom offset.
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
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