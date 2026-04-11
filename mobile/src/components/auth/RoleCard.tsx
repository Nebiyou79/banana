import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface RoleCardProps {
  role: string;
  label: string;
  description: string;
  icon: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
  primaryColor: string;
  accentColor?: string;
}

export const RoleCard: React.FC<RoleCardProps> = ({
  label, description, icon, emoji, selected, onPress, primaryColor,
}) => {
  const { theme } = useThemeStore();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: selected ? primaryColor : theme.colors.border,
          borderWidth: selected ? 2 : 1,
        },
        theme.shadows.sm,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: primaryColor + '18' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text>
        <Text style={[styles.desc, { color: theme.colors.textMuted }]}>{description}</Text>
      </View>
      {selected ? (
        <View style={[styles.check, { backgroundColor: primaryColor }]}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </View>
      ) : (
        <View style={[styles.checkEmpty, { borderColor: theme.colors.border }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emoji: { fontSize: 24 },
  content: { flex: 1 },
  label: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  desc: { fontSize: 13, lineHeight: 18 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 24,
    height: 24,
    borderRadius: 99,
    borderWidth: 1.5,
  },
});