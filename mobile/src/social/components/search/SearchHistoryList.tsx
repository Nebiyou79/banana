import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { SearchHistoryEntry } from '../../services/socialSearchService';
import SectionHeader from '../shared/SectionHeader';

interface Props {
  history: SearchHistoryEntry[];
  onPressEntry: (entry: SearchHistoryEntry) => void;
  onRemoveEntry: (entry: SearchHistoryEntry) => void;
  onClearAll: () => void;
}

const Row: React.FC<{
  entry: SearchHistoryEntry;
  onPress: () => void;
  onRemove: () => void;
}> = memo(({ entry, onPress, onRemove }) => {
  const theme = useSocialTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: theme.border }]}
    >
      <Ionicons name="time-outline" size={18} color={theme.muted} />
      <Text
        style={[styles.text, { color: theme.text }]}
        numberOfLines={1}
      >
        {entry.query}
      </Text>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.removeBtn}
        accessibilityLabel={`Remove ${entry.query} from history`}
      >
        <Ionicons name="close" size={18} color={theme.muted} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

Row.displayName = 'SearchHistoryRow';

/**
 * List of recent search queries with inline remove + clear-all header action.
 */
const SearchHistoryList: React.FC<Props> = memo(
  ({ history, onPressEntry, onRemoveEntry, onClearAll }) => {
    if (!history?.length) return null;
    return (
      <View>
        <SectionHeader
          title="Recent"
          actionLabel="Clear all"
          onActionPress={onClearAll}
        />
        {history.map((entry) => (
          <Row
            key={`${entry.query}_${entry.timestamp}`}
            entry={entry}
            onPress={() => onPressEntry(entry)}
            onRemove={() => onRemoveEntry(entry)}
          />
        ))}
      </View>
    );
  }
);

SearchHistoryList.displayName = 'SearchHistoryList';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    minHeight: 48,
  },
  text: { flex: 1, fontSize: 14 },
  removeBtn: {
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchHistoryList;