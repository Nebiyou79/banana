import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

interface FormErrorProps {
  message?: string;
  visible: boolean;
}

export const FormError: React.FC<FormErrorProps> = ({ message, visible }) => {
  const { theme } = useThemeStore();

  if (!visible || !message) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.errorLight, borderColor: theme.colors.error + '40' }]}>
      <Ionicons name="alert-circle-outline" size={16} color={theme.colors.error} />
      <Text style={[styles.text, { color: theme.colors.error }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  text: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
});