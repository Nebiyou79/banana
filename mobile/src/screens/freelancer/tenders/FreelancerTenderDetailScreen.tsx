// screens/freelancer/tenders/FreelancerTenderDetailScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Thin screen wrapper — all UI lives inside FreelanceTenderBrowserDetail.
// Responsibilities here: route params, navigation callbacks, SafeAreaView.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../../../hooks/useTheme';
import FreelanceTenderBrowserDetail from '../../../components/freelanceTenders/FreelanceTenderBrowserDetail';

type RouteParams = { tenderId: string };

const FreelancerTenderDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation  = useNavigation<any>();
  const route       = useRoute<RouteProp<{ FreelancerTenderDetail: RouteParams }, 'FreelancerTenderDetail'>>();
  const { tenderId } = route.params;

  // Navigate to the proposal submission screen
  const handleApplyPress = useCallback(
    (id: string) => navigation.navigate('SubmitProposal', { tenderId: id }),
    [navigation],
  );

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.bg }]}
      edges={['top']}
    >
      <FreelanceTenderBrowserDetail
        tenderId={tenderId}
        onApplyPress={handleApplyPress}
        onBack={handleBack}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default FreelancerTenderDetailScreen;