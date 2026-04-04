Project Design & Specification Outline
User Roles & Responsibilities

Each system user role should be clearly documented with its tasks and use-cases. According to software requirements best practices, all user roles must be listed and each role’s responsibilities described in relation to the system
home.adelphi.edu
. For example, roles in this platform include Candidate, Freelancer, Company, Organization, and Admin. Each role interacts with various feature modules (Jobs, Profiles, Applications, Messaging, etc.), and their privileges and workflows should be spelled out.

Candidate: Searches and filters job listings, saves favorites, applies to jobs, and manages their profile or CV (including uploads). They receive and read application responses via the messaging system.

Freelancer: (Independent professional) Similar to Candidate: browses projects or gigs, submits proposals/bids, edits their profile/CV, and negotiates with companies.

Company / Organization: Creates and edits job or project postings, reviews candidate applications, shortlists candidates, and communicates with applicants via messaging. They manage the company/organization profile and view analytics or dashboards for their listings.

Admin: Oversees the entire platform – manages user accounts and roles (verifies companies, approves resumes, etc.), configures industries/categories, monitors content, and handles high-level features (e.g. system settings, reports). Admin also sets up role-based permissions and ensures compliance with requirements
home.adelphi.edu
home.adelphi.edu
.

Listing these roles and their feature-specific tasks (e.g. who can post jobs, who can apply, who can message whom) ensures clarity on each user’s scope and helps coordinate development of separate modules.

Feature Breakdown by Phase

It’s important to distinguish core Phase 1 features from planned Phase 2 enhancements. In product planning, teams “identify what functionalities are essential and what can wait for future phases” to prevent scope creep
bwf.com
. Thus, Phase 1 (Web app) should focus on the minimum viable feature set, while Phase 2 (Mobile apps, payments, subscriptions) is scoped as a separate set of features. Each phase can be documented in its own section.

Phase 1 – Web Application Features:

Jobs/Opportunities: User roles like Companies/Organizations can create, edit and manage job or project listings. Candidates and Freelancers can browse listings, use advanced search and filters (by skill, location, keyword), sort results, and save favorites.

Profiles & CVs: Every user can build and update a profile. This includes a resume/CV builder or upload (templates for resumes or proposals), skills/experience entries, and profile photos. Users can set privacy/preferences and add portfolio items or certifications.

Applications Tracking: Candidates/Freelancers can apply to listed jobs (possibly auto-apply to matching jobs). Companies/Organizations see a list of applicants per job and can update application status (e.g. reviewed, shortlisted, rejected). This workflow should include application history and status updates.

Messaging & Notifications: An internal messaging system lets users (e.g. candidate ↔ company) exchange messages about opportunities. Critical events (new application, message, profile views, etc.) trigger in-app and email notifications. A notification center or badge counter keeps users informed of new activity.

Admin Dashboard & Settings: Admin users access management modules (e.g. user/role management, industry/category creation, verification checks). They also see platform metrics (number of jobs, active users) and can moderate content if needed.

Phase 2 – Mobile & Premium Features: (Documented separately for roadmap context)

Mobile App: A mobile-native interface (iOS/Android) with push notifications for messages/applications. The mobile version replicates core job search, profile editing, and messaging features in a responsive design.

Payments & Subscriptions: Introduce monetization: e.g. companies pay per job posting or subscribe to premium plans; freelancers/candidates subscribe for perks (featured profile, extra applications). Backend integration with a payment gateway (Stripe, PayPal) and subscription management must be designed.

Additional Integrations: As examples: social login (OAuth with Google/Facebook), analytics/tracking, or third-party services (e.g. calendar integration for interview scheduling). These can be listed as future capabilities.

This phase-based breakdown keeps the Phase 1 scope focused while still acknowledging the “Phase 2” roadmap in the documentation
bwf.com
.

Data Models & Backend Logic

The specification should detail the system’s data model (database schemas) and key backend components for each feature
rst.software
bacancytechnology.com
. In other words, define what collections (in MongoDB) or tables exist and what fields they contain, plus how different modules (controllers/routes) operate. A high-level architecture diagram and module description is recommended: outline frontend, backend, and database responsibilities
bacancytechnology.com
.

User / Profile: Schema for all users (candidates, freelancers, company reps, etc.) including fields like name, email, role, passwordHash, profileDetails (bio, skills), resume (file or text sections), and subscriptionStatus. Backend logic: user registration/login, profile creation/editing, and role-based access control.

Company/Organization Profile: If separate from User, schema holds company name, description, industry/category, location, contact info, verification status, etc. Logic: company registration, profile management, and posting permissions.

Job Posting: Schema with jobId, companyId, title, description, requirements, salary, location, createdAt, and possibly status (open/closed). Backend: routes/controllers for creating/editing/deleting listings by authorized company users, and for retrieving listings (with search/filter queries).

Application: Schema linking candidates to jobs: fields applicationId, jobId, userId, coverLetter, resumeSnapshot, status (applied, reviewed, accepted, rejected), timestamps. Logic: allow candidates to apply (create record), companies to update status and add comments, with history tracking.

Messaging: Schema for in-app messages: messageId, senderId, receiverId, content, sentAt, readFlag. Logic: endpoints for sending messages between users, fetching conversation threads, marking messages as read, and triggering notifications on new messages.

Notifications: (Optional collection) to queue alerts: notificationId, userId, type (e.g. “new_message”, “application_update”), relatedId, createdAt, seen. Logic: generate a notification entry on key events (new job matches, application replies, etc.) and provide API for clients to fetch/clear them.

Payment/Subscription: (Phase 2) Schema for subscriptions/plans: planId, userId, planType, price, startDate, endDate, status. Logic: integrate payment API, handle plan upgrades/downgrades, webhook handlers for payment success/failure.

Each data model should reference others appropriately (e.g. userId in Applications, companyId in Job). In the backend, implement modules (controllers/services) for CRUD operations and business rules per feature (e.g. a “Jobs” controller to handle posting/searching jobs). As one guide notes, a product spec should include a System Architecture section with modules and data flow: e.g. “frontend, backend, database” components and how data moves between them
bacancytechnology.com
. This helps developers understand how each schema and API fits into the overall system.

Folder and File Structure

Finally, outline a clear project structure for code organization. A typical layout may separate the frontend and backend:
🔐 1. Authentication & Roles
Backend

Models

User.ts

name, email, passwordHash, role (candidate | freelancer | company | org | admin)

verificationStatus, profileCompleted

Controllers

authController.ts

registerUser(req,res)

loginUser(req,res)

logoutUser(req,res)

getCurrentUser(req,res)

Middleware

authMiddleware.ts → JWT verification

roleMiddleware.ts → restrict access per role

Routes

authRoutes.ts

POST /api/auth/register

POST /api/auth/login

POST /api/auth/logout

GET /api/auth/me

Frontend

Pages

pages/login.tsx

pages/register.tsx

Services

services/authService.ts → login, register, logout, getCurrentUser

Context

AuthContext.tsx → stores current user + role globally

Components

AuthForm.tsx

RoleRedirect.tsx

Workflow
User registers → role assigned → login → redirect to role-based dashboard.

👤 2. Candidate Profile Management
Backend

Models

Extend User.ts:

skills, education, experience, cvUrl, portfolio[]

Controllers

candidateController.ts

getProfile(req,res)

updateProfile(req,res)

uploadCV(req,res)

Routes

candidateRoutes.ts

GET /api/candidate/profile

PUT /api/candidate/profile

POST /api/candidate/cv

Frontend

Pages

pages/dashboard/candidate/profile.tsx

Services

services/candidateService.ts → getProfile, updateProfile, uploadCV

Components

ProfileForm.tsx
CVUpload.tsx

🎨 3. Freelancer / Portfolio Management
Backend

Models

Extend User.ts with:

portfolio: [{title, description, mediaUrl}]

Controllers

freelancerController.ts

getPortfolio(req,res)

addPortfolioItem(req,res)

updatePortfolioItem(req,res)

deletePortfolioItem(req,res)

Routes

freelancerRoutes.ts

GET /api/freelancer/portfolio

POST /api/freelancer/portfolio

PUT /api/freelancer/portfolio/:id

DELETE /api/freelancer/portfolio/:id

Frontend

Pages

pages/dashboard/freelancer/portfolio.tsx

Services

services/freelancerService.ts → CRUD portfolio

Components

PortfolioList.tsx

PortfolioCard.tsx

PortfolioForm.tsx

🏢 4. Company & Organization Management
Backend

Models

Company.js

name, tin, industry, logoUrl, bannerUrl, description, verified

Controllers

companyController.js

createCompany(req,res)

getCompanyProfile(req,res)

updateCompanyProfile(req,res)

Routes

companyRoutes.js

POST /api/companies

GET /api/companies/:id

PUT /api/companies/:id

Frontend

Pages

pages/dashboard/company/profile.tsx

Services

services/companyService.ts

Components

CompanyForm.tsx

CompanyCard.tsx

💼 5. Job & Tender Management
Backend

Models

Job.ts → {title, description, skills, salary, location, createdBy}

Controllers

jobController.ts

createJob (Company/Admin)

getJobs

getJob

updateJob (Company/Admin)

deleteJob (Company/Admin)

Routes

jobRoutes.ts

Frontend

Candidate Pages

pages/dashboard/candidate/jobs.tsx

Company Pages

pages/dashboard/company/jobs.tsx

Admin Pages

pages/dashboard/admin/jobs.tsx

Services

services/jobService.ts

Components

JobList.tsx

JobCard.tsx

JobForm.tsx

📥 6. Applications & Proposals
Backend

Models

Application.ts → {jobId, candidateId, coverLetter, status}

Proposal.ts → {tenderId, freelancerId, bidAmount, proposalText, status}

Controllers

applicationController.ts

applyJob(req,res)

getUserApplications(req,res)

getApplicationsForJob(req,res)

proposalController.ts

CRUD proposals

Routes

applicationRoutes.ts

proposalRoutes.ts

Frontend

Candidate Pages

pages/dashboard/candidate/applications.tsx

Freelancer Pages

pages/dashboard/freelancer/proposals.tsx

Services

services/applicationService.ts

services/proposalService.ts

Components

ApplicationList.tsx

ProposalForm.tsx

✅ 7. Verification System (Exams + Office Check)
Backend

Models

Exam.ts → {questions: [{question, options[], correctOption}]}

Verification.ts → {userId, status: 'Unverified' | 'Partial' | 'Full'}

Controllers

examController.ts

createExam (Admin)

getExams

submitExam (Candidate/Freelancer)

verificationController.ts

updateVerificationStatus (Admin)

Routes

examRoutes.ts

verificationRoutes.ts

Frontend

Candidate Pages

pages/dashboard/candidate/verification.tsx

Admin Pages

pages/dashboard/admin/exams.tsx

Services

services/examService.ts

services/verificationService.ts

Components

ExamForm.tsx

ExamTaking.tsx

VerificationStatus.tsx

🔔 8. Notifications
Backend

Models

Notification.ts → {userId, message, read}

Controllers

notificationController.ts

getNotifications(req,res)

markAsRead(req,res)

Routes

notificationRoutes.ts

Frontend

Components

NotificationBell.tsx

NotificationList.tsx

Services

services/notificationService.ts

📩 9. Messaging & Networking (Phase 2 Expansion)
Backend

Models

Message.ts → {senderId, receiverId, content, createdAt, read}

Post.ts → {userId, content, mediaUrl, likes, comments}

Controllers

messageController.ts → send, fetch threads

postController.ts → CRUD posts, likes, comments

Routes

messageRoutes.ts

postRoutes.ts

Frontend

Pages

pages/messages.tsx

pages/network.tsx

Services

services/messageService.ts

services/postService.ts

Components

ChatWindow.tsx

PostCard.tsx

PostForm.tsx

💳 10. Payments & Subscriptions (Phase 2)
Backend

Models

Subscription.ts → {userId, plan, startDate, endDate, status}

Payment.ts → {userId, amount, gateway, status}

Controllers

paymentController.ts → create checkout session, webhook handlers

subscriptionController.ts → activate plan, cancel, upgrade

Routes

paymentRoutes.ts

subscriptionRoutes.ts

Frontend

Pages

pages/pricing.tsx

pages/dashboard/admin/payments.tsx

Services

services/paymentService.ts

services/subscriptionService.ts

Components

PricingTable.tsx

CheckoutButton.tsx

🖥️ 11. Layout & Navigation
Frontend
Components
Layout.tsx
Sidebar.tsx
Header.tsx
ProtectedRoute.tsx
Shared UI
Button.tsx
Input.tsx
Modal.tsx
🔄 Example Workflows
Candidate:
Register → Login → Dashboard → Profile (upload CV) → Browse Jobs → Apply → Take Exam → Wait for verification → Get notifications.
Freelancer:
Register → Build portfolio → Apply to tenders with proposals → Track proposals → Messaging with companies.
Company:
Register → Verify TIN → Create job posts → Manage applicants → Message shortlisted candidates.
Admin:
Login → Manage users → Verify profiles/companies → Create exams → Manage jobs & tenders → Moderate posts.
backend/
├── src/
│   ├── config/
│   │   ├── db.ts
│   │   └── env.ts
│   │
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   └── errorHandler.ts
│   │
│   ├── models/
│   │   ├── User.ts
│   │   ├── Company.ts
│   │   ├── Job.ts
│   │   ├── Application.ts
│   │   ├── Proposal.ts
│   │   ├── Exam.ts
│   │   ├── Verification.ts
│   │   ├── Notification.ts
│   │   ├── Message.ts        (Phase 2)
│   │   ├── Post.ts           (Phase 2)
│   │   ├── Subscription.ts   (Phase 2)
│   │   └── Payment.ts        (Phase 2)
│   │
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── candidateController.ts
│   │   ├── freelancerController.ts
│   │   ├── companyController.ts
│   │   ├── jobController.ts
│   │   ├── applicationController.ts
│   │   ├── proposalController.ts
│   │   ├── examController.ts
│   │   ├── verificationController.ts
│   │   ├── notificationController.ts
│   │   ├── adminController.ts
│   │   ├── messageController.ts      (Phase 2)
│   │   ├── postController.ts         (Phase 2)
│   │   ├── paymentController.ts      (Phase 2)
│   │   └── subscriptionController.ts (Phase 2)
│   │
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── candidateRoutes.ts
│   │   ├── freelancerRoutes.ts
│   │   ├── companyRoutes.ts
│   │   ├── jobRoutes.ts
│   │   ├── applicationRoutes.ts
│   │   ├── proposalRoutes.ts
│   │   ├── examRoutes.ts
│   │   ├── verificationRoutes.ts
│   │   ├── notificationRoutes.ts
│   │   ├── adminRoutes.ts
│   │   ├── messageRoutes.ts         (Phase 2)
│   │   ├── postRoutes.ts            (Phase 2)
│   │   ├── paymentRoutes.ts         (Phase 2)
│   │   └── subscriptionRoutes.ts    (Phase 2)
│   │
│   ├── utils/
│   │   ├── token.ts
│   │   ├── fileUpload.ts
│   │   └── validators.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── package.json
├── tsconfig.json
└── .env
Frontend
frontend/
├── pages/
│   ├── index.tsx               (Landing Page)
│   ├── login.tsx
│   ├── register.tsx
│   │
│   ├── dashboard/
│   │   ├── candidate/
│   │   │   ├── index.tsx       (Overview)
│   │   │   ├── profile.tsx
│   │   │   ├── jobs.tsx
│   │   │   ├── applications.tsx
│   │   │   └── verification.tsx
│   │   │
│   │   ├── freelancer/
│   │   │   ├── index.tsx
│   │   │   └── portfolio.tsx
│   │   │
│   │   ├── company/
│   │   │   ├── index.tsx
│   │   │   ├── profile.tsx
│   │   │   └── jobs.tsx
│   │   │
│   │   ├── org/
│   │   │   ├── index.tsx
│   │   │   └── jobs.tsx
│   │   │
│   │   └── admin/
│   │       ├── index.tsx
│   │       ├── jobs.tsx
│   │       ├── candidates.tsx
│   │       ├── exams.tsx
│   │       ├── companies.tsx
│   │       └── payments.tsx (Phase 2)
│
├── components/
│   ├── layout/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── auth/
│   │   ├── AuthForm.tsx
│   │   └── RoleRedirect.tsx
│   │
│   ├── candidate/
│   │   ├── ProfileForm.tsx
│   │   ├── CVUpload.tsx
│   │   └── ApplicationList.tsx
│   │
│   ├── freelancer/
│   │   ├── PortfolioList.tsx
│   │   ├── PortfolioCard.tsx
│   │   └── PortfolioForm.tsx
│   │
│   ├── company/
│   │   ├── CompanyForm.tsx
│   │   ├── CompanyCard.tsx
│   │   └── ApplicantList.tsx
│   │
│   ├── jobs/
│   │   ├── JobList.tsx
│   │   ├── JobCard.tsx
│   │   └── JobForm.tsx
│   │
│   ├── verification/
│   │   ├── ExamForm.tsx
│   │   ├── ExamTaking.tsx
│   │   └── VerificationStatus.tsx
│   │
│   ├── notifications/
│   │   ├── NotificationBell.tsx
│   │   └── NotificationList.tsx
│   │
│   ├── messaging/ (Phase 2)
│   │   ├── ChatWindow.tsx
│   │   └── ChatList.tsx
│   │
│   ├── posts/ (Phase 2)
│   │   ├── PostCard.tsx
│   │   └── PostForm.tsx
│   │
│   ├── payments/ (Phase 2)
│   │   ├── PricingTable.tsx
│   │   └── CheckoutButton.tsx
│   │
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
│
├── context/
│   ├── AuthContext.tsx
│   ├── NotificationContext.tsx
│   └── UIContext.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useJobs.ts
│   ├── useNotifications.ts
│   └── useForm.ts
│
├── services/
│   ├── api.ts
│   ├── authService.ts
│   ├── candidateService.ts
│   ├── freelancerService.ts
│   ├── companyService.ts
│   ├── jobService.ts
│   ├── applicationService.ts
│   ├── proposalService.ts
│   ├── examService.ts
│   ├── verificationService.ts
│   ├── notificationService.ts
│   ├── messageService.ts        (Phase 2)
│   ├── postServ

