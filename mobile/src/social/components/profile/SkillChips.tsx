import React, { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { Skill } from '../../types';
import Chip from '../shared/Chip';

interface Props {
  skills?: (string | Skill)[];
  /** Maximum visible without pressing "+N more" */
  maxVisible?: number;
  onSkillPress?: (name: string) => void;
}

const toName = (s: string | Skill): string =>
  typeof s === 'string' ? s : s?.name ?? '';

/**
 * Grid of skill chips. Truncates to `maxVisible` and exposes a "+N more"
 * chip the user can tap to reveal the rest.
 */
const SkillChips: React.FC<Props> = memo(
  ({ skills, maxVisible = 8, onSkillPress }) => {
    const theme = useSocialTheme();
    const [expanded, setExpanded] = useState(false);

    const names = (skills ?? [])
      .map(toName)
      .filter((n) => n.length > 0);

    if (names.length === 0) {
      return (
        <Text style={[styles.empty, { color: theme.muted }]}>
          No skills added yet.
        </Text>
      );
    }

    const visible = expanded ? names : names.slice(0, maxVisible);
    const hiddenCount = names.length - visible.length;

    return (
      <View style={styles.grid}>
        {visible.map((name, i) => (
          <Chip
            key={`${name}_${i}`}
            label={name}
            onPress={onSkillPress ? () => onSkillPress(name) : undefined}
            compact
          />
        ))}
        {hiddenCount > 0 ? (
          <Chip
            label={`+${hiddenCount} more`}
            onPress={() => setExpanded(true)}
            compact
          />
        ) : null}
      </View>
    );
  }
);

SkillChips.displayName = 'SkillChips';

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { fontSize: 13, paddingVertical: 4 },
});

export default SkillChips;
