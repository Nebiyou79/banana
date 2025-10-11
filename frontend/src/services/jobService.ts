/* eslint-disable @typescript-eslint/no-explicit-any */
// services/jobService.ts - FIXED ERROR HANDLING
import api from '@/lib/axios';
import { handleError, handleSuccess, handleInfo } from '@/lib/error-handler';

// Ethiopian Location Interface
export interface EthiopianLocation {
  region: string;
  city: string;
  subCity?: string;
  woreda?: string;
  specificLocation?: string;
  country: string;
  timezone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Job Salary Interface
export interface JobSalary {
  min?: number;
  max?: number;
  currency: 'ETB' | 'USD' | 'EUR' | 'GBP';
  period: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  isPublic: boolean;
  isNegotiable: boolean;
}

// Ethiopian Requirements Interface
export interface EthiopianRequirements {
  workPermitRequired: boolean;
  knowledgeOfLocalLanguages: string[];
  drivingLicense: boolean;
  governmentClearance: boolean;
}

// Main Job Interface
export interface Job {
  _id: string;
  title: string;
  description: string;
  shortDescription?: string;
  requirements: string[];
  responsibilities: string[];
  benefits: string[];
  skills: string[];
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'volunteer' | 'remote' | 'hybrid';
  location: EthiopianLocation;
  salary?: JobSalary;
  category: string;
  subCategory?: string;
  experienceLevel: 'fresh-graduate' | 'entry-level' | 'mid-level' | 'senior-level' | 'managerial' | 'director' | 'executive';
  educationLevel?: 'high-school' | 'diploma' | 'bachelors' | 'masters' | 'phd' | 'none-required';
  ethiopianRequirements: EthiopianRequirements;
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived';
  remote: 'remote' | 'hybrid' | 'on-site';
  workArrangement: 'office' | 'field-work' | 'both';
  company: {
    _id: string;
    name: string;
    logoUrl?: string;
    verified: boolean;
    industry?: string;
    size?: string;
    website?: string;
    description?: string;
    country?: string;
  };
  createdBy: string;
  applicationCount: number;
  viewCount: number;
  saveCount: number;
  featured: boolean;
  urgent: boolean;
  premium: boolean;
  tags: string[];
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  applications?: any[];
  views?: number;
}

// Ethiopian Region Interface
export interface EthiopianRegion {
  name: string;
  slug: string;
  cities: string[];
}

// Jobs Response Interface
export interface JobsResponse {
  success: boolean;
  data: Job[];
  pagination?: {
    current: number;
    totalPages: number;
    totalResults: number;
    resultsPerPage: number;
  };
  filters?: any;
  stats?: any;
}

// Job Filters Interface
export interface JobFilters {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  city?: string;
  type?: string;
  category?: string;
  remote?: string;
  experienceLevel?: string;
  educationLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: 'ETB' | 'USD' | 'EUR' | 'GBP';
  skills?: string[];
  company?: string;
  featured?: boolean;
  urgent?: boolean;
  workArrangement?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Application Data Interface
export interface ApplicationData {
  coverLetter: string;
  proposal: string;
  bidAmount?: number;
}

// Single Job Response Interface
export interface JobResponse {
  success: boolean;
  data: Job;
  message?: string;
}

// Company Jobs Response Interface
export interface CompanyJobsResponse {
  success: boolean;
  data: Job[];
  pagination: {
    current: number;
    totalPages: number;
    totalResults: number;
  };
}

// Categories Response Interface
export interface CategoriesResponse {
  success: boolean;
  data: Array<{_id: string, count: number}>;
}

// Error handling function
const handleApiError = (error: any, defaultMessage: string): never => {
  if (error.response?.data?.message) {
    handleError(error.response.data.message);
    throw new Error(error.response.data.message);
  } else if (error.message) {
    handleError(error.message);
    throw error;
  } else {
    handleError(defaultMessage);
    throw new Error(defaultMessage);
  }
};

// Validation functions
const validateJobData = (data: Partial<Job>): void => {
  if (data.title && data.title.trim().length < 5) {
    throw new Error('Job title must be at least 5 characters long');
  }
  
  if (data.title && data.title.trim().length > 100) {
    throw new Error('Job title cannot exceed 100 characters');
  }
  
  if (data.description && data.description.length < 50) {
    throw new Error('Job description must be at least 50 characters long');
  }
  
  if (data.description && data.description.length > 5000) {
    throw new Error('Description cannot exceed 5000 characters');
  }
  
  if (data.shortDescription && data.shortDescription.length > 200) {
    throw new Error('Short description cannot exceed 200 characters');
  }
};

export const jobService = {
  // Get all jobs with Ethiopian market filters
  getJobs: async (params?: JobFilters): Promise<JobsResponse> => {
    try {
      const response = await api.get<JobsResponse>('/job', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch jobs') as never;
    }
  },

  // Get single job
  getJob: async (id: string): Promise<Job> => {
    try {
      if (!id) {
        throw new Error('Job ID is required');
      }
      
      const response = await api.get<JobResponse>(`/job/${id}`);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to fetch job');
      }
      
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch job') as never;
    }
  },

  // Get company's jobs
  getCompanyJobs: async (params?: { page?: number; limit?: number; status?: string }): Promise<CompanyJobsResponse> => {
    try {
      const response = await api.get<CompanyJobsResponse>('/job/company/my-jobs', { params });
      return response.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to fetch company jobs') as never;
    }
  },

  // Create job
  createJob: async (data: Partial<Job>): Promise<Job> => {
    try {
      validateJobData(data);
      
      console.log('📤 Sending job data to backend:', JSON.stringify(data, null, 2));
      
      const response = await api.post<JobResponse>('/job', data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to create job');
      }
      
      handleSuccess('Job created successfully');
      return response.data.data;
    } catch (error: any) {
      console.error('❌ Job creation failed:', error);
      console.log('📋 Response data:', error.response?.data);
      return handleApiError(error, 'Failed to create job') as never;
    }
  },

  // Update job
  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    try {
      if (!id) {
        throw new Error('Job ID is required');
      }
      
      validateJobData(data);
      
      const response = await api.put<JobResponse>(`/job/${id}`, data);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.message || 'Failed to update job');
      }
      
      handleSuccess('Job updated successfully');
      return response.data.data;
    } catch (error: any) {
      return handleApiError(error, 'Failed to update job') as never;
    }
  },

  // Delete job
  deleteJob: async (id: string): Promise<void> => {
    try {
      if (!id) {
        throw new Error('Job ID is required');
      }
      
      const response = await api.delete(`/job/${id}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete job');
      }
      
      handleSuccess('Job deleted successfully');
    } catch (error: any) {
      return handleApiError(error, 'Failed to delete job') as never;
    }
  },
  // Add these methods to your existing jobService object

// Get organization's jobs
getOrganizationJobs: async (params?: { page?: number; limit?: number; status?: string }): Promise<CompanyJobsResponse> => {
  try {
    const response = await api.get<CompanyJobsResponse>('/job/organization/my-jobs', { params });
    return response.data;
  } catch (error: any) {
    return handleApiError(error, 'Failed to fetch organization opportunities') as never;
  }
},

// Create job for organization
createOrganizationJob: async (data: Partial<Job>): Promise<Job> => {
  try {
    validateJobData(data);
    
    console.log('📤 Sending organization opportunity data to backend:', JSON.stringify(data, null, 2));
    
    const response = await api.post<JobResponse>('/job/organization', data);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to create opportunity');
    }
    
    handleSuccess('Opportunity created successfully');
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Organization opportunity creation failed:', error);
    console.log('📋 Response data:', error.response?.data);
    return handleApiError(error, 'Failed to create opportunity') as never;
  }
},

// Update organization job
updateOrganizationJob: async (id: string, data: Partial<Job>): Promise<Job> => {
  try {
    if (!id) {
      throw new Error('Opportunity ID is required');
    }
    
    validateJobData(data);
    
    const response = await api.put<JobResponse>(`/job/organization/${id}`, data);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update opportunity');
    }
    
    handleSuccess('Opportunity updated successfully');
    return response.data.data;
  } catch (error: any) {
    return handleApiError(error, 'Failed to update opportunity') as never;
  }
},

// Delete organization job
deleteOrganizationJob: async (id: string): Promise<void> => {
  try {
    if (!id) {
      throw new Error('Opportunity ID is required');
    }
    
    const response = await api.delete(`/job/organization/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete opportunity');
    }
    
    handleSuccess('Opportunity deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'Failed to delete opportunity') as never;
  }
},

  // Get job categories
  getCategories: async (): Promise<Array<{_id: string, count: number}>> => {
    try {
      const response = await api.get<CategoriesResponse>('/job/categories');
      return response.data.data;
    } catch (error: any) {
      handleInfo('Using default categories');
      // Return default categories if API fails
      return [
        { _id: 'software-development', count: 0 },
        { _id: 'web-development', count: 0 },
        { _id: 'marketing', count: 0 },
        { _id: 'sales', count: 0 },
        { _id: 'design', count: 0 },
        { _id: 'other', count: 0 }
      ];
    }
  },

  // Helper to format salary for display
  formatSalary: (salary?: JobSalary): string => {
    if (!salary) return 'Negotiable';
    
    const { min, max, currency, period, isNegotiable } = salary;
    
    if (isNegotiable) return 'Negotiable';
    
    if (min && max) {
      return `${min.toLocaleString()} - ${max.toLocaleString()} ${currency} / ${period}`;
    } else if (min) {
      return `From ${min.toLocaleString()} ${currency} / ${period}`;
    } else if (max) {
      return `Up to ${max.toLocaleString()} ${currency} / ${period}`;
    }
    
    return 'Negotiable';
  },

  // Helper to get job type label
  getJobTypeLabel: (type: string): string => {
    const labels: Record<string, string> = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      'contract': 'Contract',
      'internship': 'Internship',
      'temporary': 'Temporary',
      'volunteer': 'Volunteer',
      'remote': 'Remote',
      'hybrid': 'Hybrid'
    };
    return labels[type] || type;
  },

  // Helper to get experience level label
  getExperienceLabel: (level: string): string => {
    const labels: Record<string, string> = {
      'fresh-graduate': 'Fresh Graduate',
      'entry-level': 'Entry Level',
      'mid-level': 'Mid Level',
      'senior-level': 'Senior Level',
      'managerial': 'Managerial',
      'director': 'Director',
      'executive': 'Executive'
    };
    return labels[level] || level;
  },

  // Helper to get education level label
  getEducationLabel: (level?: string): string => {
    const labels: Record<string, string> = {
      'high-school': 'High School',
      'diploma': 'Diploma',
      'bachelors': "Bachelor's",
      'masters': "Master's",
      'phd': 'PhD',
      'none-required': 'Not Required'
    };
    return level ? labels[level] || level : 'Not Specified';
  },

  // Get Ethiopian regions
  getEthiopianRegions: (): EthiopianRegion[] => {
    return [
      {
        name: 'Addis Ababa',
        slug: 'addis-ababa',
        cities: ['Addis Ababa', 'Akaki Kaliti', 'Arada', 'Bole', 'Gulele', 'Kirkos', 'Kolfe Keranio', 'Lideta', 'Nifas Silk Lafto', 'Yeka']
      },
      {
        name: 'Amhara',
        slug: 'amhara',
        cities: ['Bahir Dar', 'Gondar', 'Dessie', 'Debre Markos', 'Debre Birhan', 'Woldia', 'Kombolcha']
      },
      {
        name: 'Oromia',
        slug: 'oromia',
        cities: ['Adama', 'Nazret', 'Jimma', 'Bishoftu', 'Ambo', 'Shashamane', 'Nekemte', 'Adama', 'Assela']
      },
      {
        name: 'Tigray',
        slug: 'tigray',
        cities: ['Mekele', 'Adigrat', 'Axum', 'Adwa', 'Shire', 'Humera', 'Alamata']
      },
      {
        name: 'SNNPR',
        slug: 'snnpr',
        cities: ['Hawassa', 'Arba Minch', 'Dila', 'Wolaita Sodo', 'Hosaena', 'Durame', 'Wondo Genet']
      },
      {
        name: 'Somali',
        slug: 'somali',
        cities: ['Jijiga', 'Degehabur', 'Gode', 'Kebri Dahar', 'Warder', 'Shilavo']
      },
      {
        name: 'Afar',
        slug: 'afar',
        cities: ['Semera', 'Asayita', 'Awash', 'Logiya', 'Dubti', 'Gewane']
      },
      {
        name: 'Benishangul-Gumuz',
        slug: 'benishangul-gumuz',
        cities: ['Assosa', 'Metekel', 'Gilgil Beles', 'Mambuk']
      },
      {
        name: 'Gambela',
        slug: 'gambela',
        cities: ['Gambela', 'Itang', 'Abobo', 'Gore']
      },
      {
        name: 'Harari',
        slug: 'harari',
        cities: ['Harar', 'Dire Dawa Administrative Council']
      },
      {
        name: 'Sidama',
        slug: 'sidama',
        cities: ['Hawassa', 'Yirgalem', 'Leku', 'Aleta Wondo', 'Chuko']
      },
      {
        name: 'South West Ethiopia',
        slug: 'south-west-ethiopia',
        cities: ['Bonga', 'Mizan Teferi', 'Tepi', 'Tercha', 'Maji']
      },
      {
        name: 'Dire Dawa',
        slug: 'dire-dawa',
        cities: ['Dire Dawa']
      },
      {
        name: 'International',
        slug: 'international',
        cities: ['Remote Worldwide', 'Multiple Locations', 'Global']
      }
    ];
  },

  // Get valid job categories that match backend
  getJobCategories: (): Array<{value: string, label: string}> => {
    return [
      // Technology & IT
      { value: 'software-development', label: 'Software Development' },
      { value: 'web-development', label: 'Web Development' },
      { value: 'mobile-development', label: 'Mobile Development' },
      { value: 'frontend-development', label: 'Frontend Development' },
      { value: 'backend-development', label: 'Backend Development' },
      { value: 'full-stack-development', label: 'Full Stack Development' },
      { value: 'devops', label: 'DevOps' },
      { value: 'cloud-computing', label: 'Cloud Computing' },
      { value: 'data-science', label: 'Data Science' },
      { value: 'machine-learning', label: 'Machine Learning' },
      { value: 'artificial-intelligence', label: 'Artificial Intelligence' },
      { value: 'cybersecurity', label: 'Cybersecurity' },
      { value: 'it-support', label: 'IT Support' },
      { value: 'network-administration', label: 'Network Administration' },
      { value: 'database-administration', label: 'Database Administration' },
      { value: 'system-administration', label: 'System Administration' },
      
      // Business & Management
      { value: 'accounting-finance', label: 'Accounting & Finance' },
      { value: 'banking-insurance', label: 'Banking & Insurance' },
      { value: 'management', label: 'Management' },
      { value: 'project-management', label: 'Project Management' },
      { value: 'product-management', label: 'Product Management' },
      { value: 'business-development', label: 'Business Development' },
      { value: 'strategy-consulting', label: 'Strategy & Consulting' },
      { value: 'operations', label: 'Operations' },
      
      // Sales & Marketing
      { value: 'sales', label: 'Sales' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'digital-marketing', label: 'Digital Marketing' },
      { value: 'social-media-marketing', label: 'Social Media Marketing' },
      { value: 'content-marketing', label: 'Content Marketing' },
      { value: 'seo-sem', label: 'SEO & SEM' },
      { value: 'brand-management', label: 'Brand Management' },
      { value: 'public-relations', label: 'Public Relations' },
      { value: 'market-research', label: 'Market Research' },
      
      // Creative & Design
      { value: 'graphic-design', label: 'Graphic Design' },
      { value: 'ui-ux-design', label: 'UI/UX Design' },
      { value: 'web-design', label: 'Web Design' },
      { value: 'motion-graphics', label: 'Motion Graphics' },
      { value: 'video-production', label: 'Video Production' },
      { value: 'photography', label: 'Photography' },
      { value: 'content-writing', label: 'Content Writing' },
      { value: 'copywriting', label: 'Copywriting' },
      { value: 'translation', label: 'Translation' },
      
      // Engineering
      { value: 'civil-engineering', label: 'Civil Engineering' },
      { value: 'electrical-engineering', label: 'Electrical Engineering' },
      { value: 'mechanical-engineering', label: 'Mechanical Engineering' },
      { value: 'chemical-engineering', label: 'Chemical Engineering' },
      { value: 'industrial-engineering', label: 'Industrial Engineering' },
      { value: 'automotive-engineering', label: 'Automotive Engineering' },
      { value: 'aerospace-engineering', label: 'Aerospace Engineering' },
      
      // Healthcare
      { value: 'medical-doctor', label: 'Medical Doctor' },
      { value: 'nursing', label: 'Nursing' },
      { value: 'pharmacy', label: 'Pharmacy' },
      { value: 'dentistry', label: 'Dentistry' },
      { value: 'medical-laboratory', label: 'Medical Laboratory' },
      { value: 'public-health', label: 'Public Health' },
      { value: 'healthcare-administration', label: 'Healthcare Administration' },
      { value: 'physiotherapy', label: 'Physiotherapy' },
      
      // Education
      { value: 'teaching', label: 'Teaching' },
      { value: 'lecturing', label: 'Lecturing' },
      { value: 'academic-research', label: 'Academic Research' },
      { value: 'educational-administration', label: 'Educational Administration' },
      { value: 'tutoring', label: 'Tutoring' },
      { value: 'curriculum-development', label: 'Curriculum Development' },
      { value: 'special-education', label: 'Special Education' },
      
      // Other Professional
      { value: 'human-resources', label: 'Human Resources' },
      { value: 'recruitment', label: 'Recruitment' },
      { value: 'legal', label: 'Legal' },
      { value: 'logistics', label: 'Logistics' },
      { value: 'supply-chain', label: 'Supply Chain' },
      { value: 'procurement', label: 'Procurement' },
      { value: 'quality-control', label: 'Quality Control' },
      { value: 'hospitality-tourism', label: 'Hospitality & Tourism' },
      { value: 'customer-service', label: 'Customer Service' },
      { value: 'administrative', label: 'Administrative' },
      { value: 'secretarial', label: 'Secretarial' },
      { value: 'receptionist', label: 'Receptionist' },
      
      // Trades & Services
      { value: 'construction', label: 'Construction' },
      { value: 'architecture', label: 'Architecture' },
      { value: 'interior-design', label: 'Interior Design' },
      { value: 'real-estate', label: 'Real Estate' },
      { value: 'property-management', label: 'Property Management' },
      { value: 'agriculture', label: 'Agriculture' },
      { value: 'agribusiness', label: 'Agribusiness' },
      { value: 'farming', label: 'Farming' },
      { value: 'veterinary', label: 'Veterinary' },
      { value: 'environmental', label: 'Environmental' },
      
      // Creative Arts & Media
      { value: 'journalism', label: 'Journalism' },
      { value: 'broadcasting', label: 'Broadcasting' },
      { value: 'publishing', label: 'Publishing' },
      { value: 'music', label: 'Music' },
      { value: 'performing-arts', label: 'Performing Arts' },
      { value: 'fashion', label: 'Fashion' },
      
      // Other
      { value: 'ngo-development', label: 'NGO & Development' },
      { value: 'social-work', label: 'Social Work' },
      { value: 'community-development', label: 'Community Development' },
      { value: 'religious', label: 'Religious' },
      { value: 'security', label: 'Security' },
      { value: 'driving-delivery', label: 'Driving & Delivery' },
      { value: 'cleaning-maintenance', label: 'Cleaning & Maintenance' },
      { value: 'beauty-wellness', label: 'Beauty & Wellness' },
      { value: 'sports-fitness', label: 'Sports & Fitness' },
      { value: 'other', label: 'Other' }
    ];
  },

  // Get salary ranges for Ethiopian market
  getSalaryRanges: (currency: string = 'ETB') => {
    const ranges = {
      ETB: [
        { label: 'Under 2,000 ETB', min: 0, max: 2000 },
        { label: '2,000 - 5,000 ETB', min: 2000, max: 5000 },
        { label: '5,000 - 10,000 ETB', min: 5000, max: 10000 },
        { label: '10,000 - 20,000 ETB', min: 10000, max: 20000 },
        { label: '20,000 - 50,000 ETB', min: 20000, max: 50000 },
        { label: '50,000+ ETB', min: 50000, max: null }
      ],
      USD: [
        { label: 'Under $500', min: 0, max: 500 },
        { label: '$500 - $1,000', min: 500, max: 1000 },
        { label: '$1,000 - $2,000', min: 1000, max: 2000 },
        { label: '$2,000 - $5,000', min: 2000, max: 5000 },
        { label: '$5,000+', min: 5000, max: null }
      ],
      EUR: [
        { label: 'Under €500', min: 0, max: 500 },
        { label: '€500 - €1,000', min: 500, max: 1000 },
        { label: '€1,000 - €2,000', min: 1000, max: 2000 },
        { label: '€2,000 - €5,000', min: 2000, max: 5000 },
        { label: '€5,000+', min: 5000, max: null }
      ],
      GBP: [
        { label: 'Under £500', min: 0, max: 500 },
        { label: '£500 - £1,000', min: 500, max: 1000 },
        { label: '£1,000 - £2,000', min: 1000, max: 2000 },
        { label: '£2,000 - £5,000', min: 2000, max: 5000 },
        { label: '£5,000+', min: 5000, max: null }
      ]
    };
    return ranges[currency as keyof typeof ranges] || ranges.ETB;
  }
};