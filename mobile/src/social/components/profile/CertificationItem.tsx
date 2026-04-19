import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Certification } from '../../types';
import Chip from '../shared/Chip';

interface Props {
  cert: Certification;
}

const formatDate = (d?: string): string => {
  if (!d) return '';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
  });
};

const CertificationItem: React.FC<Props> = memo(({ cert }) => {
  const theme = useSocialTheme();
  const issued = formatDate(cert.issueDate);
  const expires = formatDate(cert.expiryDate);

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: `${theme.primary}1F` },
        ]}
      >
        <Ionicons name="ribbon-outline" size={18} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.text }]}>{cert.name}</Text>
        <Text style={[styles.issuer, { color: theme.subtext }]}>
          {cert.issuer}
        </Text>
        {(issued || expires) ? (
          <Text style={[styles.meta, { color: theme.muted }]}>
            {issued ? `Issued ${issued}` : ''}
            {expires ? `${issued ? ' · ' : ''}Expires ${expires}` : ''}
          </Text>
        ) : null}

        {cert.skills && cert.skills.length > 0 ? (
          <View style={styles.skills}>
            {cert.skills.slice(0, 5).map((s, i) => (
              <Chip key={`${s}_${i}`} label={s} compact />
            ))}
          </View>
        ) : null}

        {cert.credentialUrl ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(cert.credentialUrl!)}
            activeOpacity={0.7}
            style={styles.credBtn}
          >
            <Ionicons
              name="open-outline"
              size={14}
              color={theme.primary}
            />
            <Text style={[styles.credText, { color: theme.primary }]}>
              Show credential
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
});

CertificationItem.displayName = 'CertificationItem';

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 14, fontWeight: '700' },
  issuer: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 11, marginTop: 2 },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  credBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    minHeight: 36,
  },
  credText: { fontSize: 12, fontWeight: '600' },
});

export default CertificationItem;
