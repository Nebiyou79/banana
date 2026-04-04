# CLAUDE.md

## Project Overview
This repository contains the backend and web frontend for a multi-role job/tender platform with these roles:
- Candidate
- Freelancer
- Company
- Organization
- Admin

The mobile app will be built later in React Native and must reuse this backend and existing API patterns.

## Core Goal
Keep the codebase clean, scalable, and modular. Prefer reuse over rewriting. Maintain compatibility between backend, web frontend, and future mobile app.

## Product Scope
### Phase 1
- Authentication
- Role-based dashboards
- Candidate profile/CV
- Freelancer portfolio
- Company and organization profile management
- Job/tender posting and browsing
- Applications/proposals
- Notifications
- Admin management

### Phase 2
- React Native mobile app
- Social feed/networking
- Messaging enhancements
- Payments and subscriptions
- Push notifications
- Advanced integrations

## Working Rules
- Always inspect existing files before creating new structure.
- Reuse existing backend endpoints, models, services, and validation logic whenever possible.
- Do not invent new endpoints unless the backend truly lacks a required capability.
- Keep feature code separated by domain.
- Keep UI reusable and shared where possible.
- Follow the existing folder structure and naming conventions already used in the repo.
- Prefer small, composable components and services.
- If a feature depends on missing backend data or endpoints, list the dependency clearly instead of guessing.

## Backend Conventions
- Respect existing auth and role-based access control.
- Preserve request/response shapes unless a change is explicitly necessary.
- Keep controllers thin and move business logic into services where appropriate.
- Keep validation explicit.
- Keep model fields aligned with actual app workflows.

## Frontend Conventions
- Use feature-based organization.
- Keep services separate from screens/components.
- Use shared UI components for buttons, inputs, modals, cards, loaders, and empty states.
- Centralize API access in one layer.
- Separate theme tokens, constants, and helpers from screens.
- Keep mobile-specific UI and navigation isolated from web code.

## Mobile App Goals
The future React Native app should:
- Reuse the existing backend
- Support role-based navigation
- Support dark and light themes
- Have a clean design system
- Be modular and maintainable
- Mirror the web app’s business logic without duplicating backend code

## Important Domains
- Auth: login, register, logout, current user, role routing
- Candidate: profile, CV, jobs, applications, notifications
- Freelancer: profile, portfolio, gigs/tenders, proposals, messaging
- Company: profile, jobs, applicants, analytics, messaging
- Organization: profile, jobs/tenders, applicants, messaging
- Admin: users, roles, verification, moderation, settings
- Social feed: posts, likes, comments, notifications
- Payments: subscriptions, checkout, billing history, webhooks

## Implementation Priority
When building new features:
1. Authentication and app bootstrap
2. Theme and shared UI
3. API and state management
4. Role-based navigation
5. Feature screens by role
6. Notifications and messaging
7. Social feed
8. Payments and advanced features

## Output Preference
When asked for architecture or implementation help:
- Start with a concise architecture plan
- Then provide folder structure
- Then list files needed
- Then provide implementation steps
- Then provide code only after the structure is agreed