1️⃣ Social Dashboard Component

This is the wrapper layout for all social pages:

File: /components/social/SocialDashboard.tsx

Purpose: Wraps all social pages (Feed, Profile, Messages, etc.)

Structure:

Left: SocialSidebar (links to Feed, Profile, Messages, Settings, etc.)

Center: Main Content (page-specific content like feed or profile)

Right: Advertisement area (for now one advert, expandable later)

Top: Optional SocialNavbar for mobile menu toggle or quick actions

Responsibilities:

Handle responsive layout (sidebar collapsible on mobile, fixed on desktop)

Maintain state for active page (highlight sidebar links)

Provide a back button to the main role dashboard

Ensure user authentication & role validation (optional: reuse DashboardLayout logic)

Components used:

SocialSidebar

SocialNavbar (optional)

children – page content

AdvertisementCard – right side ad

Services used:

None directly in layout; pages will fetch their own data via services

UI/UX suggestions:

Minimalist sidebar with clear icons

Fixed width on desktop, slide-in on mobile

Subtle shadows and card borders for the content area

Rounded corners, consistent spacing (8–16px padding)

Hover effects on sidebar links (smooth color transition)

Right side ad subtle card, visually separated

2️⃣ Pages Overview

All pages will use SocialDashboardLayout, so layout is consistent. Each page’s main content goes in the center column.

Page	Route	Purpose	Components	Services
Feed	/dashboard/[role]/social	Main social feed for posts and interactions	PostCard, CreatePost, LikeButton, CommentItem, ShareButton	postService, likeService, commentService, followService
Profile	/dashboard/[role]/social/profile	View/edit user profile, posts, network	ProfileHeader, ProfileCompletionCard, ProfileTabs, EditProfileModal, PostCard, LikeButton, CommentItem	profileService, roleProfileService, postService, likeService, commentService, followService
Messages	/dashboard/[role]/social/messages	Chat with other users	MessageList, MessageInput, ChatHeader	messageService, followService
Suggested Users	/dashboard/[role]/social/suggested	Discover new users to follow	SuggestedUser, FollowButton	profileService, followService
Notifications	/dashboard/[role]/social/notifications	Show all social notifications	NotificationItem	notificationService
3️⃣ Feed Page Deep Dive

File: /pages/dashboard/[role]/social/index.tsx

Main Responsibilities:

Show all posts from followed users or global feed

Allow creating a post (CreatePost)

Display each post with PostCard (like, comment, share)

Allow interaction: liking, commenting, sharing

Update real-time (optional via WebSocket)

Components used:

SocialDashboardLayout

CreatePost

PostCard

LikeButton

CommentItem

ShareButton

AdvertisementCard (right column)

Services used:

postService – fetch posts, create new posts

likeService – toggle like/unlike

commentService – fetch and add comments

followService – display if the post author is followed

UI/UX:

Feed center column, full-width cards

Card shadows, rounded corners, spacing between posts

Floating CreatePost at top or as first card

Right-side ad should be visually distinct but not distracting

4️⃣ Profile Page Deep Dive

File: /pages/dashboard/[role]/social/profile.tsx

Main Responsibilities:

Display user profile information (ProfileHeader)

Show profile completion progress (ProfileCompletionCard)

Profile tabs: About, Experience, Network, Posts

Allow editing profile via EditProfileModal

Show user posts with PostCard + interactions

Allow following/unfollowing

Components used:

SocialDashboardLayout

ProfileHeader

ProfileCompletionCard

ProfileTabs

EditProfileModal

PostCard

LikeButton

CommentItem

FollowButton

AdvertisementCard

Services used:

profileService – get/update profile info

roleProfileService – get role-specific profile info

postService, likeService, commentService, followService

UI/UX:

Profile picture + cover photo at top

Tabs clearly separated with a sticky tab header

Posts section scrollable, cards separated

Right-side ad same style as feed

5️⃣ Messages Page Deep Dive

File: /pages/dashboard/[role]/social/messages.tsx

Main Responsibilities:

Display user conversations in a list (MessageList)

Chat interface (ChatHeader + MessageInput)

Load messages per conversation

Show online/offline status

Optional: real-time updates

Components used:

SocialDashboardLayout

MessageList

ChatHeader

MessageInput

AdvertisementCard

Services used:

messageService – fetch conversations, send messages

followService – show follow status in chats

UI/UX:

Left column: conversation list (optional: sticky on desktop)

Center: chat messages scrollable

Right: ad card

Clean chat bubbles with timestamps and avatars

6️⃣ Suggested Users & Notifications Pages

Suggested Users: shows people to follow, uses SuggestedUser + FollowButton.

Notifications: list of events, uses NotificationItem.

Both use SocialDashboardLayout with right ad.

7️⃣ Additional Components You Might Need
Component	Purpose
AdvertisementCard	Right column ad (image, link)
SocialNavbar	Optional top navbar for quick actions, search
MessageList	Render conversation list
MessageInput	Chat input box
NotificationItem	Display notifications
ChatHeader	Chat title + user info
SuggestedUserCard	Card for suggested user
8️⃣ Premium UI Design Guidelines

Cards: Rounded corners (8–12px), subtle shadow, clean spacing

Typography: Use consistent fonts, size hierarchy: Titles 2xl–3xl, body 14–16px

Colors: Primary accent (#E63946) for interactions (like, follow), secondary muted gray (#F3F4F6) for backgrounds, white cards (#FFFFFF)

Hover Effects: Smooth transition for buttons/cards

Grid Layout: 3-column desktop (Sidebar – Main – Ads), 1-column mobile (Sidebar collapsible)

Spacing: 16px padding inside cards, 24–32px between sections

Interactive Buttons: Like, Follow, Share, Comment should have icons + subtle hover animations

Advertisements: Should blend but not overpower, minimal shadow, hover effect optional
9. PUBLIC PROFILE VIEW

This is the page used to view another user’s profile, not your own.

Route
/dashboard/[role]/social/profile/[userId]

Purpose

Allow Candidate, Company, Freelancer, Organization users to view any other user’s profile

Show:

Cover photo

Profile picture

Name, role, bio

Action buttons (Follow, Message, View Posts)

Professional info (depending on role)

Their posts (PostCard)

Followers / Following counts

Should use only the public fields
No private details (phone, email, admin fields, drafts, etc.)

Components used

SocialDashboardLayout

PublicProfileHeader (similar to ProfileHeader but without Edit button)

PublicProfileTabs: Posts | About | Connections

PostCard + like/comment/share services

FollowButton

MessageButton

AdvertisementCard

Services used

profileService.getPublicProfile(userId)

postService.getUserPosts(userId)

followService.follow(userId)

followService.unfollow(userId)

messageService.startConversation(userId)

UI/UX

Same layout as your own profile but with:

No edit button

More emphasis on connections

CTA buttons on top (Follow, Message)

Clean separation of tabs

Fully responsive, same spacing system as feed & profile pages

🎨 2. FULL UI COLOR & STYLE GUIDE

To guarantee clean, professional, consistent design across:

Dashboard layout

Components

Pages

I’m giving you a complete premium UI system — this will make everything look unified.

🎨 A. COLOR SYSTEM (GLOBAL)

Use these exact colors across all dashboards, components, pages.

Primary Colors
Name	Hex	Usage
Primary Blue	#1A73E8	Buttons, links, main accents
Primary Dark Navy	#0F172A	Titles, sidebar text
Primary Mustard	#EAB308	Highlights, small accents, stats
Neutral Colors
Name	Hex	Usage
White	#FFFFFF	Card backgrounds
Light Gray	#F1F5F9	Page backgrounds
Gray-100	#F8FAFC	Soft backgrounds
Gray-300	#CBD5E1	Borders, separators
Gray-500	#64748B	Secondary text
Gray-700	#334155	Body text
Support Colors
Name	Hex
Success Green	#10B981
Error Red	#EF4444
Info Blue	#3B82F6
🖼 B. TYPOGRAPHY SYSTEM
Headings

h1: 2xl / bold / text-darkNavy

h2: xl / semibold / text-darkNavy

h3: lg / semibold / text-gray-800

h4: base / semibold / text-gray-700

Body Text

Default: text-base text-gray-700

Muted: text-sm text-gray-500

Special

Button text: text-sm font-semibold text-white

Small labels: text-xs uppercase tracking-wide text-gray-500

🎛 C. SPACING SYSTEM

Use consistent spacing:

Token	Value
xs	4px
sm	8px
md	16px
lg	24px
xl	32px
2xl	48px