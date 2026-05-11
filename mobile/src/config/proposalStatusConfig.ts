// src/config/proposalStatusConfig.ts
import type { ThemeColors } from '../theme/color';
import { withAlpha } from '../theme/utils';

export const PROPOSAL_STATUS = (c: ThemeColors) => ({
  pending:   { label: 'Pending',   color: c.warning,      bg: withAlpha(c.warning,      0.16) },
  accepted:  { label: 'Accepted',  color: c.success,      bg: withAlpha(c.success,      0.16) },
  rejected:  { label: 'Rejected',  color: c.danger,       bg: withAlpha(c.danger,       0.16) },
  withdrawn: { label: 'Withdrawn', color: c.textMuted,    bg: withAlpha(c.textMuted,    0.16) },
  awarded:   { label: 'Awarded',   color: c.organization, bg: withAlpha(c.organization, 0.16) },
});