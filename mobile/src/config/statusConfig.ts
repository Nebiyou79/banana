// src/config/statusConfig.ts
import type { ThemeColors } from '../theme/color';
import { withAlpha } from '../theme/utils';

export const JOB_STATUS = (c: ThemeColors) => ({
  active:  { label: 'Active',  color: c.success,      bg: withAlpha(c.success,      0.16), stripe: c.success },
  draft:   { label: 'Draft',   color: c.textMuted,    bg: withAlpha(c.textMuted,    0.16), stripe: c.textMuted },
  paused:  { label: 'Paused',  color: c.warning,      bg: withAlpha(c.warning,      0.16), stripe: c.warning },
  closed:  { label: 'Closed',  color: c.danger,       bg: withAlpha(c.danger,       0.16), stripe: c.danger },
  expired: { label: 'Expired', color: c.danger,       bg: withAlpha(c.danger,       0.16), stripe: c.danger },
});

export const APPLICATION_STATUS = (c: ThemeColors) => ({
  submitted:    { label: 'Submitted',    color: c.info,         bg: withAlpha(c.info,         0.16) },
  under_review: { label: 'Under review', color: c.warning,      bg: withAlpha(c.warning,      0.16) },
  shortlisted:  { label: 'Shortlisted',  color: c.success,      bg: withAlpha(c.success,      0.16) },
  rejected:     { label: 'Rejected',     color: c.danger,       bg: withAlpha(c.danger,       0.16) },
  hired:        { label: 'Hired',        color: c.organization, bg: withAlpha(c.organization, 0.16) },
});

export const TENDER_STATUS = (c: ThemeColors) => ({
  draft:     { label: 'Draft',     color: c.textMuted,    bg: withAlpha(c.textMuted,    0.16) },
  open:      { label: 'Open',      color: c.success,      bg: withAlpha(c.success,      0.16) },
  closing:   { label: 'Closing',   color: c.warning,      bg: withAlpha(c.warning,      0.16) },
  closed:    { label: 'Closed',    color: c.danger,       bg: withAlpha(c.danger,       0.16) },
  cancelled: { label: 'Cancelled', color: c.danger,       bg: withAlpha(c.danger,       0.16) },
  awarded:   { label: 'Awarded',   color: c.organization, bg: withAlpha(c.organization, 0.16) },
});