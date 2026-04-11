import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { Button } from '../../components/ui/Button';
import { AuthHeader } from '../../components/auth/AuthHeader';
import { RoleCard } from '../../components/auth/RoleCard';
import { roleConfig, ROLES } from '../../constants/roles';
import type { Role } from '../../constants/roles';
import { useAuthStore } from '../../store/authStore';
import { toast } from '../../lib/toast';
import type { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const SELECTABLE_ROLES: Role[] = [
  ROLES.CANDIDATE,
  ROLES.FREELANCER,
  ROLES.COMPANY,
  ROLES.ORGANIZATION,
];

export const RoleSelectScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const navigation = useNavigation<Nav>();
  const { user, setUser } = useAuthStore();

  const [selected, setSelected] = useState<Role>(user?.role ?? ROLES.CANDIDATE);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      // TODO: Call POST /api/v1/auth/update-role when backend provides endpoint
      setUser({ role: selected });
      toast.info(`You selected: ${roleConfig[selected].label}`, 'Role Selected');
    } catch (err: any) {
      toast.error('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: spacing[5], paddingVertical: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          title="Choose your role"
          subtitle="Select how you'll be using Banana. You can change this later."
        />

        {SELECTABLE_ROLES.map((role) => {
          const cfg = roleConfig[role];
          return (
            <RoleCard
              key={role}
              role={role}
              label={cfg.label}
              description={cfg.description}
              icon={cfg.icon}
              emoji={cfg.emoji}
              selected={selected === role}
              onPress={() => setSelected(role)}
              primaryColor={cfg.primaryColor}
            />
          );
        })}

        <View style={[styles.noteBox, { backgroundColor: colors.warningLight, borderRadius: theme.borderRadius.lg }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
          <Text style={[styles.noteText, { color: colors.warning, fontSize: typography.xs }]}>
            Role is saved locally until the backend provides POST /auth/update-role.
          </Text>
        </View>

        <Button
          title={`Continue as ${roleConfig[selected].label}`}
          onPress={handleContinue}
          loading={loading}
          disabled={loading}
          fullWidth
          size="lg"
          style={{ marginTop: 20 }}
        />

        <TouchableOpacity
          style={styles.backRow}
          onPress={() => navigation.navigate('Login')}
        >
          <Ionicons name="arrow-back-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.backText, { color: colors.textMuted, fontSize: typography.sm }]}>
            Back to login
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll:    { flexGrow: 1 },
  noteBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, marginTop: 4 },
  noteText:  { flex: 1, lineHeight: 16 },
  backRow:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 },
  backText:  {},
});