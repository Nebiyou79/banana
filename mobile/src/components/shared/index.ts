// src/components/shared/index.ts
// ─── Shared components barrel ──────────────────────────────────────────────────

export { AppHeader } from '../ui/AppHeader';
export { ScreenContainer } from './ScreenContainer';
export { PrimaryButton } from './PrimaryButton';
export { EmptyState } from './EmptyState';

// Re-export defaults too for convenience
export { default as AppHeaderDefault }       from '../ui/AppHeader';
export { default as ScreenContainerDefault } from './ScreenContainer';
export { default as PrimaryButtonDefault }   from './PrimaryButton';
export { default as EmptyStateDefault }      from './EmptyState';
