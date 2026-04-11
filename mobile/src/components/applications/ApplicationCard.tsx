import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Application } from '../../services/applicationService';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';

interface Props {
  application: Application;
  onPress: () => void;
  colors: any;
  typography: any;
}

const fmt = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const ApplicationCard: React.FC<Props> = ({ application, onPress, colors, typography }) => {
  const owner = application.job.company ?? application.job.organization;
  const ownerName = owner?.name ?? 'Unknown';
  const logoUrl = owner?.logo ?? (owner as any)?.logoUrl;
  const initials = ownerName.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  return (
    <TouchableOpacity
      style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Left: logo */}
      <View style={s.logoWrap}>
        {logoUrl ? (
          <Image source={{ uri: logoUrl }} style={s.logo} />
        ) : (
          <View style={[s.logo, { backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: typography.sm }}>
              {initials}
            </Text>
          </View>
        )}
      </View>

      {/* Middle: info */}
      <View style={s.info}>
        <Text style={[s.title, { color: colors.text, fontSize: typography.base }]} numberOfLines={1}>
          {application.job.title}
        </Text>
        <Text style={[s.company, { color: colors.textSecondary, fontSize: typography.sm }]} numberOfLines={1}>
          {ownerName}
        </Text>
        <View style={s.row}>
          <ApplicationStatusBadge status={application.status} size="sm" />
        </View>
        <Text style={[s.date, { color: colors.textMuted, fontSize: typography.xs }]}>
          Applied {fmt(application.createdAt)}
        </Text>
        {application.companyResponse?.message && (
          <Text style={[s.response, { color: colors.textMuted, fontSize: typography.xs }]} numberOfLines={1}>
            "{application.companyResponse.message}"
          </Text>
        )}
      </View>

      {/* Right: chevron */}
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

const LOGO = 48;

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  logoWrap: {},
  logo: {
    width: LOGO,
    height: LOGO,
    borderRadius: 12,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontWeight: '700',
  },
  company: {
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    marginTop: 2,
  },
  date: {},
  response: {
    fontStyle: 'italic',
    marginTop: 2,
  },
});
