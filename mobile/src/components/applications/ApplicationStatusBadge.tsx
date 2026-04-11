import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ApplicationStatus, STATUS_COLOR, STATUS_LABEL } from '../../services/applicationService';

interface Props {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

export const ApplicationStatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const color = STATUS_COLOR[status] ?? '#9CA3AF';
  const label = STATUS_LABEL[status] ?? status;
  const isSm  = size === 'sm';

  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor: color + '20',
          borderColor: color + '40',
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 3 : 5,
        },
      ]}
    >
      <View style={[s.dot, { backgroundColor: color, width: isSm ? 5 : 6, height: isSm ? 5 : 6 }]} />
      <Text style={[s.label, { color, fontSize: isSm ? 10 : 12 }]}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
    gap: 5,
  },
  dot: {
    borderRadius: 99,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
