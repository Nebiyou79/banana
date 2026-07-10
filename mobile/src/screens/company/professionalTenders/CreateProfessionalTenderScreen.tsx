// src/screens/company/professionalTenders/CreateProfessionalTenderScreen.tsx
//
// FIX: Removed edges={['bottom']} from SafeAreaView.
// FIX: Changed replace to navigate so back button works from detail screen.
//
// Root cause of the "buttons pushed too high" bug:
//   This screen is rendered inside a bottom-tab navigator whose tab bar
//   already reports its height to React Navigation. React Navigation then
//   automatically adds that height as bottom padding/inset to every child
//   screen. If the screen ALSO applies a bottom safe-area edge via
//   SafeAreaView, it adds the device's home-indicator inset a second time —
//   stacking on top of the tab bar offset and shoving the footer buttons
//   visibly upward.
//
//   Fix: use edges={['top']} only. The navigator handles bottom spacing.
//   The form's own footer (Cancel/Next) sits flush above the tab bar
//   with exactly the right gap.
//
// Navigation fix:
//   Changed navigation.replace to navigation.navigate so that pressing back
//   from ProfessionalTenderDetail properly returns to MyProfessionalTenders
//   screen instead of having nowhere to go.

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
      // FIX: Use navigate instead of replace so back button works.
      // This pushes ProfessionalTenderDetail onto the stack, preserving
      // MyProfessionalTenders underneath for back navigation.
      navigation.navigate('ProfessionalTenderDetail', { tenderId: id });
    },
    [navigation],
  );

  const handleCancel = useCallback(() => {
    if (navigation.canGoBack()) navigation.goBack();
  }, [navigation]);

  return (
    // FIX: edges={['top']} only — navigator owns the bottom offset.
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg }]}
      edges={['top']}
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