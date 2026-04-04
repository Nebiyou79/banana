// Centralized advertisement data management

export interface BaseAdData {
    id: string;
    title: string;
    subtitle: string;
    link: string;
    image: string;
    cta: string;
    sponsored: boolean;
    priority: number; // 1-10, higher = more important
    startDate: string;
    endDate?: string;
    tags: string[];
    impressions: number;
    clicks: number;
}

export interface CandidateAdData extends BaseAdData {
    type: 'candidate';
    jobTitle: string;
    company: string;
    salary: string;
    location: string;
    featured?: boolean;
    jobMatch?: number;
    applicants?: number;
    experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Executive';
    employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
}

export interface CompanyAdData extends BaseAdData {
    type: 'company';
    service: string;
    company: string;
    clients: number;
    rating: number;
    industry: string;
    enterprise?: boolean;
    metrics: {
        roi: string;
        savings: string;
        support: string;
    };
}

export interface FreelancerAdData extends BaseAdData {
    type: 'freelancer';
    projectType: string;
    budget: string;
    duration: string;
    skills: string[];
    rating: number;
    urgent?: boolean;
    proposals?: number;
    clientVerified?: boolean;
}

export interface OrganizationAdData extends BaseAdData {
    type: 'organization';
    cause: string;
    volunteers: number;
    impact: string;
    location: string;
    partners: string[];
    verified?: boolean;
    metrics: {
        fundsRaised: string;
        projects: number;
        communities: number;
    };
}

export type AdData = CandidateAdData | CompanyAdData | FreelancerAdData | OrganizationAdData;

// Ad configuration for different user roles
export interface RoleAdConfig {
    candidate: CandidateAdData[];
    company: CompanyAdData[];
    freelancer: FreelancerAdData[];
    organization: OrganizationAdData[];
    admin: AdData[]; // Admin sees a mix
}

// Filter ads based on date and priority
export const filterActiveAds = (ads: AdData[], limit?: number): AdData[] => {
    const now = new Date();
    const activeAds = ads.filter(ad => {
        const startDate = new Date(ad.startDate);
        const endDate = ad.endDate ? new Date(ad.endDate) : null;
        return startDate <= now && (!endDate || endDate >= now);
    });

    // Sort by priority (highest first), then by impressions (least shown first for rotation)
    const sorted = activeAds.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return a.impressions - b.impressions;
    });

    return limit ? sorted.slice(0, limit) : sorted;
};

// Get ads for specific role
export const getAdsForRole = (role: string, config: RoleAdConfig, limit: number = 3): AdData[] => {
    switch (role) {
        case 'candidate':
            return filterActiveAds(config.candidate, limit);
        case 'company':
            return filterActiveAds(config.company, limit);
        case 'freelancer':
            return filterActiveAds(config.freelancer, limit);
        case 'organization':
            return filterActiveAds(config.organization, limit);
        case 'admin':
            // Admin gets a mix of all ads
            const allAds = [
                ...config.candidate,
                ...config.company,
                ...config.freelancer,
                ...config.organization
            ];
            return filterActiveAds(allAds, limit);
        default:
            return filterActiveAds(config.candidate, limit); // Default to candidate
    }
};

// Track ad impression (in a real app, this would call an API)
export const trackImpression = (adId: string) => {
    // This would update the ad's impression count in the database
    console.log(`Tracked impression for ad: ${adId}`);
};

// Track ad click (in a real app, this would call an API)
export const trackClick = (adId: string) => {
    // This would update the ad's click count in the database
    console.log(`Tracked click for ad: ${adId}`);
};

// Sample ad data - in production, this would come from a database/API
export const adConfig: RoleAdConfig = {
    candidate: [
        // 2 Candidate Ads
        {
            id: 'candidate-1',
            type: 'candidate',
            title: 'Land Your Dream Tech Job',
            subtitle: 'Connect with top tech companies hiring now. Get personalized job matches and interview coaching.',
            link: 'https://example.com/jobs/tech',
            image: '/ads/candidate/tech-jobs.jpg',
            cta: 'View Jobs',
            sponsored: true,
            priority: 9,
            startDate: '2024-01-01',
            tags: ['tech', 'jobs', 'career', 'development'],
            impressions: 1245,
            clicks: 234,
            jobTitle: 'Senior Full Stack Developer',
            company: 'Google',
            salary: '$180k - $250k',
            location: 'Remote/Hybrid',
            featured: true,
            jobMatch: 92,
            applicants: 30,
            experienceLevel: 'Senior',
            employmentType: 'Full-time'
        },
        {
            id: 'candidate-2',
            type: 'candidate',
            title: 'Career Growth Accelerator',
            subtitle: 'Master in-demand skills with our certification programs. 94% placement rate after completion.',
            link: 'https://example.com/courses',
            image: '/ads/candidate/career-growth.jpg',
            cta: 'Explore Courses',
            sponsored: true,
            priority: 8,
            startDate: '2024-01-01',
            tags: ['learning', 'certification', 'skills', 'growth'],
            impressions: 987,
            clicks: 156,
            jobTitle: 'AI/ML Specialist',
            company: 'Microsoft',
            salary: '$150k - $220k',
            location: 'Seattle, WA',
            jobMatch: 87,
            applicants: 42,
            experienceLevel: 'Mid',
            employmentType: 'Full-time'
        }
    ],
    company: [
        // 3 Company Ads
        {
            id: 'company-1',
            type: 'company',
            title: 'Scale Your Hiring Process',
            subtitle: 'AI-powered recruitment platform that reduces hiring time by 70% and improves candidate quality.',
            link: 'https://example.com/hr-solutions',
            image: '/ads/company/hr-solutions.jpg',
            cta: 'Book Demo',
            sponsored: true,
            priority: 9,
            startDate: '2024-01-01',
            tags: ['hr', 'recruitment', 'ai', 'hiring'],
            impressions: 876,
            clicks: 145,
            service: 'HR Technology',
            company: 'TalentFlow AI',
            clients: 1500,
            rating: 4.8,
            industry: 'HR Tech',
            enterprise: true,
            metrics: {
                roi: '47%',
                savings: '$12k',
                support: '24/7'
            }
        },
        {
            id: 'company-2',
            type: 'company',
            title: 'Enterprise Cloud Solutions',
            subtitle: 'Secure, scalable cloud infrastructure with 99.9% uptime guarantee and 24/7 expert support.',
            link: 'https://example.com/cloud',
            image: '/ads/company/cloud-services.jpg',
            cta: 'Get Quote',
            sponsored: true,
            priority: 8,
            startDate: '2024-01-01',
            tags: ['cloud', 'enterprise', 'security', 'infrastructure'],
            impressions: 654,
            clicks: 98,
            service: 'Cloud Services',
            company: 'CloudSecure Inc',
            clients: 800,
            rating: 4.9,
            industry: 'Technology',
            enterprise: true,
            metrics: {
                roi: '35%',
                savings: '$25k',
                support: '24/7'
            }
        },
        {
            id: 'company-3',
            type: 'company',
            title: 'AI-Powered Recruitment Suite',
            subtitle: 'Automate your hiring pipeline with intelligent screening, video interviews, and analytics dashboard.',
            link: 'https://example.com/recruitment-ai',
            image: '/ads/company/recruitment-ai.jpg',
            cta: 'Start Free Trial',
            sponsored: true,
            priority: 7,
            startDate: '2024-01-01',
            tags: ['recruitment', 'ai', 'automation', 'analytics'],
            impressions: 432,
            clicks: 76,
            service: 'Recruitment Software',
            company: 'HireSmart AI',
            clients: 1200,
            rating: 4.7,
            industry: 'SaaS',
            metrics: {
                roi: '52%',
                savings: '$18k',
                support: 'Business Hours'
            }
        }
    ],
    freelancer: [
        // 1 Freelancer Ad
        {
            id: 'freelancer-1',
            type: 'freelancer',
            title: 'High-Paying Remote Projects',
            subtitle: 'Access premium freelance projects with budgets starting at $10k. Work with global clients.',
            link: 'https://example.com/freelance-projects',
            image: '/ads/freelancer/tool-suite.jpg',
            cta: 'Browse Projects',
            sponsored: true,
            priority: 9,
            startDate: '2024-01-01',
            tags: ['freelance', 'projects', 'remote', 'contract'],
            impressions: 765,
            clicks: 123,
            projectType: 'Mobile App Development',
            budget: '$15,000 - $25,000',
            duration: '6-8 weeks',
            skills: ['React Native', 'Firebase', 'AWS', 'UI/UX'],
            rating: 4.9,
            urgent: true,
            proposals: 5,
            clientVerified: true
        }
    ],
    organization: [
        // 1 Organization Ad
        {
            id: 'org-1',
            type: 'organization',
            title: 'Climate Action Initiative',
            subtitle: 'Join our global network fighting climate change. Plant trees, reduce carbon, and educate communities.',
            link: 'https://example.com/climate-action',
            image: '/ads/organization/climate-action.jpg',
            cta: 'Join Movement',
            sponsored: true,
            priority: 8,
            startDate: '2024-01-01',
            tags: ['climate', 'environment', 'sustainability', 'volunteer'],
            impressions: 654,
            clicks: 98,
            cause: 'Environmental',
            volunteers: 50000,
            impact: '1M+ trees planted',
            location: 'Global',
            partners: ['WWF', 'Greenpeace', 'UNEP'],
            verified: true,
            metrics: {
                fundsRaised: '$2.5M',
                projects: 45,
                communities: 120
            }
        }
    ],
    admin: [] // Will be populated dynamically
};