// src/screens/company/professionalTenders/CreateProfessionalTenderScreen.tsx

import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../../hooks/useTheme';
import ProfessionalTenderForm from '../../../components/professionalTenders/ProfessionalTenderForm';

export const CreateProfessionalTenderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const handleSuccess = useCallback(
    (id: string) => {
      navigation.replace?.('ProfessionalTenderDetail', { tenderId: id });
    },
    [navigation],
  );

  const handleCancel = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg }]}
      edges={['bottom']}
    >
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