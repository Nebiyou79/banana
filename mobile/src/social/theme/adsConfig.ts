import type { UserRole, AdConfig, AdPlacement } from '../types';

/**
 * Ad configurations per role. Each ad declares the placements where it is allowed
 * to surface. There are NO add-to-cart or buy flows — ads are purely CTAs that
 * route into existing in-app features (CV generator, portfolio, job posting, etc.).
 */
export const ADS_CONFIG: Record<UserRole, AdConfig[]> = {
  candidate: [
    {
      id: 'cand_cv',
      role: 'candidate',
      placement: ['feed', 'myPosts'],
      title: 'Land Your Dream Job',
      subtitle:
        'Build a professional CV in minutes and get noticed by top employers.',
      ctaText: 'Build My CV',
      ctaRoute: 'CVGenerator',
      icon: 'document-text-outline',
    },
    {
      id: 'cand_verify',
      role: 'candidate',
      placement: ['profile', 'savedPosts'],
      title: 'Get Verified ✓',
      subtitle:
        'Verified profiles get 3× more interview calls. Verify your identity now.',
      ctaText: 'Verify Profile',
      ctaRoute: 'Verification',
      icon: 'shield-checkmark-outline',
    },
    {
      id: 'cand_network',
      role: 'candidate',
      placement: ['search', 'network'],
      title: 'Grow Your Network',
      subtitle:
        '500+ recruiters are active this week. Connect and get discovered.',
      ctaText: 'Explore Network',
      ctaRoute: 'Network',
      icon: 'people-outline',
    },
  ],
  freelancer: [
    {
      id: 'free_portfolio',
      role: 'freelancer',
      placement: ['feed', 'myPosts'],
      title: 'Showcase Your Work',
      subtitle:
        'Upgrade your portfolio and reach 10,000+ companies looking for talent.',
      ctaText: 'Edit Portfolio',
      ctaRoute: 'Portfolio',
      icon: 'briefcase-outline',
    },
    {
      id: 'free_projects',
      role: 'freelancer',
      placement: ['savedPosts', 'network'],
      title: 'New Projects Match You',
      subtitle:
        "3 new projects match your skills this week. Don't miss out.",
      ctaText: 'View Projects',
      ctaRoute: 'FreelancerMarketplace',
      icon: 'rocket-outline',
    },
    {
      id: 'free_profile',
      role: 'freelancer',
      placement: ['profile', 'editProfile'],
      title: 'Pro Tip: Complete Your Profile',
      subtitle:
        'Freelancers with complete profiles earn 40% more. Add your certifications.',
      ctaText: 'Complete Profile',
      ctaRoute: 'EditProfile',
      icon: 'star-outline',
    },
  ],
  company: [
    {
      id: 'comp_talent',
      role: 'company',
      placement: ['feed', 'myPosts'],
      title: 'Find Qualified Talent',
      subtitle:
        'Post a job and connect with 5,000+ active candidates in your industry.',
      ctaText: 'Post a Job',
      ctaRoute: 'PostJob',
      icon: 'person-add-outline',
    },
    {
      id: 'comp_analytics',
      role: 'company',
      placement: ['profile', 'network'],
      title: 'Company Analytics',
      subtitle:
        "See who's viewing your company page and optimize your hiring funnel.",
      ctaText: 'View Insights',
      ctaRoute: 'CompanyDashboard',
      icon: 'bar-chart-outline',
    },
    {
      id: 'comp_brand',
      role: 'company',
      placement: ['search', 'savedPosts'],
      title: 'Build Your Employer Brand',
      subtitle:
        'Companies with rich profiles get 2× more applications. Stand out.',
      ctaText: 'Enhance Profile',
      ctaRoute: 'EditProfile',
      icon: 'business-outline',
    },
  ],
  organization: [
    {
      id: 'org_volunteer',
      role: 'organization',
      placement: ['feed', 'myPosts'],
      title: 'Connect With Volunteers',
      subtitle:
        '500+ volunteers in your area are looking for causes to support.',
      ctaText: 'Post Opportunity',
      ctaRoute: 'PostOpportunity',
      icon: 'heart-outline',
    },
    {
      id: 'org_grant',
      role: 'organization',
      placement: ['network', 'savedPosts'],
      title: 'Grant Opportunities Available',
      subtitle:
        "2 new grant programs match your organization's mission this month.",
      ctaText: 'Explore Grants',
      ctaRoute: 'Tenders',
      icon: 'cash-outline',
    },
    {
      id: 'org_impact',
      role: 'organization',
      placement: ['profile', 'editProfile'],
      title: 'Measure Your Impact',
      subtitle:
        'Track reach, engagement, and program outcomes all in one place.',
      ctaText: 'View Dashboard',
      ctaRoute: 'OrgDashboard',
      icon: 'analytics-outline',
    },
  ],
};

/**
 * Returns an ad for the given role + placement. Rotates hourly so the same
 * placement doesn't always show the same ad when multiple candidates exist.
 */
export const getAdForPlacement = (
  role: UserRole,
  placement: AdPlacement
): AdConfig | null => {
  const ads = ADS_CONFIG[role]?.filter((a) => a.placement.includes(placement));
  if (!ads?.length) return null;
  return ads[Math.floor(Date.now() / 3600000) % ads.length];
};

/**
 * Inject an ad list-item into an existing list at a fixed frequency.
 * Generic over T so the caller passes its own AdCard list-item representation.
 * No ad is inserted after the last item.
 */
export const injectAdsIntoFeed = <T>(
  items: T[],
  adItem: T,
  frequency = 5
): T[] => {
  const result: T[] = [];
  items.forEach((item, i) => {
    result.push(item);
    if ((i + 1) % frequency === 0 && i < items.length - 1) {
      result.push(adItem);
    }
  });
  return result;
};
