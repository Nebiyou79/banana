// ─────────────────────────────────────────────────────────────────────────────
//  src/components/freelanceTenders/index.ts
//  Barrel — re-exports every FreelanceTender component
// ─────────────────────────────────────────────────────────────────────────────

// Atomic UI components
export { default as FreelanceTenderBudgetTag }    from './FreelanceTenderBudgetTag';
export { default as FreelanceTenderDeadlineTimer } from './FreelanceTenderDeadlineTimer';
export { default as FreelanceTenderEmptyState }   from './FreelanceTenderEmptyState';
export { default as FreelanceTenderFiltersSheet } from './FreelanceTenderFilters';
export { default as FreelanceTenderSkeleton }     from './FreelanceTenderSkeleton';
export { default as FreelanceTenderSkillTags }    from './FreelanceTenderSkillTags';
export { default as FreelanceTenderStatusBadge }  from './FreelanceTenderStatusBadge';

// Card variants
export {
  default as FreelanceTenderCard,               // auto-selects by role
  FreelanceTenderBrowserCard,                   // freelancer browsing view
  FreelanceTenderOwnerCard,                     // company/org owner view
} from './FreelanceTenderCard';

// Detail screens
export { default as FreelanceTenderBrowserDetail } from './FreelanceTenderBrowserDetail';
export { default as FreelanceTenderOwnerDetail }   from './FreelanceTenderOwnerDetail';

// Prop type re-exports
export type { FreelanceTenderBudgetTagProps }      from './FreelanceTenderBudgetTag';
export type { FreelanceTenderDeadlineTimerProps }  from './FreelanceTenderDeadlineTimer';
export type { FreelanceTenderEmptyStateProps }     from './FreelanceTenderEmptyState';
export type { FreelanceTenderFiltersProps }        from './FreelanceTenderFilters';
export type { FreelanceTenderSkeletonProps }       from './FreelanceTenderSkeleton';
export type { FreelanceTenderStatusBadgeProps }    from './FreelanceTenderStatusBadge';
export type {
  FreelanceTenderCardProps,
  FreelanceTenderBrowserCardProps,
  FreelanceTenderOwnerCardProps,
}                                                  from './FreelanceTenderCard';
export type { FreelanceTenderBrowserDetailProps }  from './FreelanceTenderBrowserDetail';
export type { FreelanceTenderOwnerDetailProps }    from './FreelanceTenderOwnerDetail';
