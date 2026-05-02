// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/company/professionalTenders/CreateProfessionalTenderScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Thin wrapper around the 7-step ProfessionalTenderForm for *create* mode.
//
//  • No tenderId prop → form renders empty
//  • onSuccess(id) → replace stack with detail screen
//  • onCancel       → go back
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useThemeStore } from '../../../store/themeStore';
import ProfessionalTenderForm from '../../../components/professionalTenders/ProfessionalTenderForm';

export const CreateProfessionalTenderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);
  const background = isDark ? '#0F172A' : '#F8FAFC';

  const handleSuccess = useCallback(
    (id: string) => {
      // Replace so Back doesn't return to the empty form
      navigation.replace?.('ProfessionalTenderDetail', { tenderId: id });
    },
    [navigation],
  );

  const handleCancel = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: background }]} edges={['bottom']}>
      <View style={styles.formWrap}>
        <ProfessionalTenderForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  formWrap: { flex: 1 },
});

export default CreateProfessionalTenderScreen;
