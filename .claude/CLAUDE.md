# CLAUDE.md — Project Source of Truth

## Project Overview
A multi-role job/tender platform (Candidate, Freelancer, Company, Org, Admin). 
**Current Phase:** Transitioning from Web/Backend completion to React Native Mobile development.

## Strategic Mandate
- **Logic Parity:** The Mobile app must be a functional mirror of the Web/Backend.
- **Source of Truth:** Backend `models/`, `controllers/`, and Web `services/` are the definitive guides for data shapes and API logic.
- **Zero Hallucination:** Do not invent API endpoints. If a mobile feature requires a backend change, flag it as a "Backend Dependency."

## Mobile Architecture Standards (React Native)
- **Styling:** Use a centralized Theme Factory (no hardcoded colors/spacing).
- **Performance:** Use `@shopify/flash-list` for all feeds. Memoize list items.
- **Forms:** Use `react-hook-form` + `Zod` validation. All forms must use `KeyboardAwareScrollView`.
- **Navigation:** Role-based stacks (CandidateStack vs. CompanyStack) managed via `AuthContext`.
- **State:** Use TanStack Query (React Query) for server state and custom hooks for logic.
- **UX:** Minimum touch target 44x44px. Include Skeleton Loaders and Empty States for all lists.

## Folder Structure (Mobile)
- `src/api/`: Axios instance & interceptors.
- `src/components/`: Atomic UI (atoms, molecules, organisms).
- `src/hooks/`: Custom hooks (useJobs, useAuth, etc.).
- `src/navigation/`: Typed navigators and route configs.
- `src/screens/`: Feature-specific views.
- `src/services/`: API communication layers (JobService, ApplicationService).
- `src/theme/`: Design tokens and styling utilities.

## Critical Workflows
1. **Auth:** JWT-based. Mobile uses Secure Storage for token persistence.
2. **Job Postings:** Company creates via `JobForm.tsx`. Logic must match Backend `Job` model.
3. **Applications:** Candidate applies with CV/Cover Letter. Status updates trigger notifications.