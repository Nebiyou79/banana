import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useSocialTheme, ROLE_SPLASH_LABELS } from '../theme/socialTheme';
import type { UserRole } from '../types';

/**
 * Maps each role to the route name of its root navigator.
 * Adjust the right-hand values if your repo uses different names.
 */
const ROLE_ROOT: Record<UserRole, string> = {
  candidate: 'CandidateRoot',
  freelancer: 'FreelancerRoot',
  company: 'CompanyRoot',
  organization: 'OrganizationRoot',
};

/**
 * "Home" tab inside SocialNavigator. Shows a brief friendly message, then
 * resets navigation back to the role's root navigator so the user exits
 * the social module cleanly.
 */
const HomeSplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const role = (useAuthStore((s) => s.role) ?? 'candidate') as UserRole;
  const theme = useSocialTheme();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    const t = setTimeout(() => {
      try {
        navigation
          .getParent()
          ?.getParent()
          ?.reset({
            index: 0,
            routes: [{ name: ROLE_ROOT[role] }],
          });
      } catch {
        // If navigator names differ, fall back to goBack()
        navigation.goBack();
      }
    }, 900);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Animated.View style={{ opacity, alignItems: 'center' }}>
        <Text style={[styles.emoji]}>🍌</Text>
        <Text style={[styles.text, { color: theme.primary }]}>
          Returning to {ROLE_SPLASH_LABELS[role].network}…
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  text: { fontSize: 16, fontWeight: '700' },
});

export default HomeSplashScreen;