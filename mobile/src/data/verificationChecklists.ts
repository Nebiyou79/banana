// src/data/verificationChecklists.ts
export interface ChecklistSection {
  icon: string;
  category: string;
  items: string[];
}

export interface DocumentRequirement {
  id: string;
  title: string;
  description: string;
  required: boolean;
  example?: string;
  notes?: string;
}

// Candidate Verification Data
export const candidateChecklist: ChecklistSection[] = [
  {
    icon: 'person-outline',
    category: "Personal Identification",
    items: [
      "Full legal name matches government-issued ID",
      "Valid ID verified (passport, driver's license, national ID)",
      "Current residential address confirmed",
      "Contact details (email, phone number) verified and active",
      "Social media or professional profiles match candidate identity"
    ]
  },
  {
    icon: 'briefcase-outline',
    category: "Employment History",
    items: [
      "Employment history matches resume/CV",
      "Previous employers contacted for reference verification",
      "Dates of employment confirmed",
      "Job titles and responsibilities verified",
      "Reason for leaving previous positions confirmed"
    ]
  },
  {
    icon: 'school-outline',
    category: "Education & Credentials",
    items: [
      "Highest degree/diploma verified with issuing institution",
      "Course, major, and graduation date confirmed",
      "Certifications or licenses verified (if applicable)",
      "Professional memberships validated",
      "No discrepancies found in academic background"
    ]
  },
  {
    icon: 'shield-checkmark-outline',
    category: "Skills & Competence",
    items: [
      "Claimed skills validated through practical tests or assignments",
      "Technical/professional tools proficiency verified",
      "Language proficiency confirmed (if relevant)",
      "Soft skills assessed (communication, teamwork, reliability)",
      "References confirm candidate's claimed abilities"
    ]
  },
  {
    icon: 'flag-outline',
    category: "Background & Legal Checks",
    items: [
      "Criminal record check completed (if allowed by law)",
      "Identity and background screening passed",
      "No ongoing legal cases or sanctions (if relevant to the role)",
      "Visa/work permit verified (for foreign candidates)",
      "No record of professional misconduct or fraud"
    ]
  },
  {
    icon: 'people-outline',
    category: "Reference Verification",
    items: [
      "Minimum of two professional references contacted",
      "Reference identities confirmed (e.g., official email/position)",
      "References provide consistent positive feedback",
      "References confirm job performance and reliability"
    ]
  }
];

export const candidateDocuments: DocumentRequirement[] = [
  {
    id: 'id_doc',
    title: 'Government-issued ID',
    description: 'Valid passport, driver\'s license, or national ID card',
    required: true,
    example: 'Passport, National ID Card, Driver\'s License',
    notes: 'Must be current and valid'
  },
  {
    id: 'resume',
    title: 'Updated Resume/CV',
    description: 'Current resume with complete employment history',
    required: true,
    example: 'PDF or Word document with work experience',
    notes: 'Should match information provided in your profile'
  },
  {
    id: 'education',
    title: 'Education Certificates',
    description: 'Diplomas, degrees, or certificates from recognized institutions',
    required: true,
    example: 'University degree, college diploma, professional certification',
    notes: 'Certified copies accepted'
  },
  {
    id: 'references',
    title: 'Professional References',
    description: 'Contact information for 2-3 professional references',
    required: true,
    example: 'Previous managers, colleagues, or clients',
    notes: 'Include name, position, company, email, and phone'
  },
  {
    id: 'portfolio',
    title: 'Work Portfolio (Optional)',
    description: 'Examples of past work or projects',
    required: false,
    example: 'GitHub profile, Behance portfolio, writing samples',
    notes: 'Helps verify skills and experience'
  }
];

// Freelancer Verification Data
export const freelancerChecklist: ChecklistSection[] = [
  {
    icon: 'person-outline',
    category: "Personal & Identity Verification",
    items: [
      "Full legal name provided and matches ID",
      "Government-issued ID verified (passport, driver's license, or national ID)",
      "Current address and contact details confirmed (email, phone, etc.)",
      "Profile photo is real and consistent across platforms",
      "Tax ID or freelancer registration number provided (if applicable)"
    ]
  },
  {
    icon: 'briefcase-outline',
    category: "Professional Background",
    items: [
      "Verified work history and experience (previous clients or employers)",
      "Resume or CV reviewed and consistent with online profiles",
      "Education or certifications verified (if relevant to the work)",
      "Professional licenses verified (if required for the service)",
      "LinkedIn or portfolio website verified and active"
    ]
  },
  {
    icon: 'star-outline',
    category: "Skills & Work Samples",
    items: [
      "Portfolio or examples of completed work reviewed",
      "References or testimonials from past clients checked",
      "Skill tests or trial tasks completed successfully (optional)",
      "Tools and software proficiency verified (e.g., Adobe, Excel, coding, etc.)"
    ]
  },
  {
    icon: 'shield-checkmark-outline',
    category: "Legal & Business Compliance",
    items: [
      "Freelancer agreement signed (contract or service agreement)",
      "Non-disclosure agreement (NDA) signed (if required)",
      "Tax compliance confirmed (freelancer provides invoices with tax info)",
      "Business registration certificate (if operating as a sole proprietor or company)",
      "Insurance coverage (if relevant, e.g., professional liability)"
    ]
  },
  {
    icon: 'cash-outline',
    category: "Payment & Financial Verification",
    items: [
      "Payment terms clearly defined in writing",
      "Bank or PayPal account matches freelancer's name",
      "No record of payment disputes or fraud reports",
      "Agreed payment schedule (e.g., milestones, hourly, per project)",
      "Invoice format compliant with your accounting/tax requirements"
    ]
  },
  {
    icon: 'chatbubbles-outline',
    category: "Communication & Reliability",
    items: [
      "Communication tested and professional (response time, clarity)",
      "Availability and time zone confirmed",
      "Agreed project management tools in place",
      "Agreed method for progress updates and deadlines",
      "Backup plan for unexpected absence or delays"
    ]
  },
  {
    icon: 'people-outline',
    category: "Reputation & Background Check",
    items: [
      "Checked freelancer's profiles on major platforms",
      "Reviewed ratings, feedback, and dispute history",
      "No record of plagiarism or professional misconduct",
      "Social media or web presence consistent and professional"
    ]
  }
];

export const freelancerDocuments: DocumentRequirement[] = [
  {
    id: 'id_doc',
    title: 'Government-issued ID',
    description: 'Valid passport, driver\'s license, or national ID card',
    required: true,
    example: 'Passport, National ID Card, Driver\'s License'
  },
  {
    id: 'portfolio',
    title: 'Work Portfolio',
    description: 'Examples of past freelance work or projects',
    required: true,
    example: 'Website portfolio, GitHub, Behance, Upwork profile',
    notes: 'Include at least 3 work samples'
  },
  {
    id: 'tax_id',
    title: 'Tax Information',
    description: 'Tax ID, VAT number, or freelancer registration',
    required: true,
    example: 'TIN, VAT number, Business registration',
    notes: 'For international freelancers, provide equivalent documentation'
  },
  {
    id: 'references',
    title: 'Client References',
    description: 'Contact information for 2-3 previous clients',
    required: true,
    example: 'Previous clients with project details',
    notes: 'Include company name, contact person, and project scope'
  },
  {
    id: 'certificates',
    title: 'Professional Certificates',
    description: 'Relevant certifications or training completions',
    required: false,
    example: 'AWS certification, Google Analytics, PMP',
    notes: 'Optional but recommended for higher trust score'
  }
];

// Company Verification Data
export const companyChecklist: ChecklistSection[] = [
  {
    icon: 'business-outline',
    category: "Basic Company Information",
    items: [
      "Legal name of the company matches official registration",
      "Company registration/incorporation number verified",
      "Registration authority confirmed",
      "Registered physical address verified (not a virtual office or P.O. Box only)",
      "Website, phone number, and email verified and active",
      "Business logo and branding consistent across all documents and platforms"
    ]
  },
  {
    icon: 'scale-outline',
    category: "Legal Status & Ownership",
    items: [
      "Type of entity verified (LLC, Corporation, Partnership, NGO, etc.)",
      "Articles of incorporation / business registration certificate obtained",
      "Ownership and shareholders identified",
      "Directors and key officers verified (names match public registry)",
      "No disqualified directors or fake identities involved"
    ]
  },
  {
    icon: 'shield-checkmark-outline',
    category: "Licenses & Permits",
    items: [
      "Valid business license(s) verified",
      "Industry-specific licenses obtained",
      "Tax registration number (TIN, VAT, EIN, GST, etc.) verified",
      "Import/export license valid (if applicable)",
      "Professional or regulatory body memberships confirmed"
    ]
  },
  {
    icon: 'document-text-outline',
    category: "Legal & Regulatory Compliance",
    items: [
      "Company is in 'good standing' with corporate registry",
      "No record of legal disputes, sanctions, or blacklisting",
      "Labor law compliance verified (contracts, benefits, etc.)",
      "Data privacy and cybersecurity compliance",
      "Anti-corruption and anti-money laundering policies in place",
      "Environmental or safety regulations followed (if relevant)"
    ]
  },
  {
    icon: 'cash-outline',
    category: "Financial Verification",
    items: [
      "Tax filings up to date (proof provided)",
      "Recent audited or certified financial statements reviewed",
      "Bank account under company name verified",
      "No record of insolvency, bankruptcy, or outstanding debts",
      "Credit report checked (if available)"
    ]
  },
  {
    icon: 'people-outline',
    category: "Reputation & Background",
    items: [
      "Company website and social media presence reviewed",
      "Online reviews, ratings, and client feedback checked",
      "Media reports or press coverage reviewed for credibility",
      "References from previous clients, partners, or suppliers verified",
      "No record of fraudulent or unethical business practices"
    ]
  },
  {
    icon: 'document-text-outline',
    category: "Contracts & Legal Documents",
    items: [
      "Company provides a standard service or supply contract",
      "Contract reviewed and signed by authorized signatory",
      "Non-disclosure agreement (NDA) or confidentiality clauses included",
      "Terms of payment and delivery clearly defined",
      "Intellectual property rights clarified (if relevant)",
      "Insurance certificates reviewed (e.g., liability, workers' comp)"
    ]
  }
];

export const companyDocuments: DocumentRequirement[] = [
  {
    id: 'registration',
    title: 'Business Registration Certificate',
    description: 'Official certificate of incorporation or business registration',
    required: true,
    example: 'Certificate of Incorporation, Business License',
    notes: 'Must be from recognized government authority'
  },
  {
    id: 'tax_id',
    title: 'Tax Registration Certificate',
    description: 'Tax identification number registration',
    required: true,
    example: 'TIN Certificate, VAT Registration',
    notes: 'Include tax clearance certificate if available'
  },
  {
    id: 'license',
    title: 'Industry License/Permit',
    description: 'Any industry-specific licenses or permits required',
    required: true,
    example: 'Construction license, Financial services license, Healthcare permit',
    notes: 'Check if your industry requires special licensing'
  },
  {
    id: 'financials',
    title: 'Financial Statements',
    description: 'Recent audited or certified financial statements',
    required: true,
    example: 'Balance sheet, Profit & Loss statement',
    notes: 'Last 2 years preferred'
  },
  {
    id: 'bank_account',
    title: 'Bank Account Verification',
    description: 'Proof of bank account under company name',
    required: true,
    example: 'Bank letter, Voided check, Bank statement',
    notes: 'Account must be active and in good standing'
  },
  {
    id: 'directors',
    title: 'Director/Shareholder Information',
    description: 'List of directors and major shareholders',
    required: true,
    example: 'Register of Directors, Shareholder list',
    notes: 'Include identification for each director'
  }
];

// Organization Verification Data
export const organizationChecklist: ChecklistSection[] = [
  {
    icon: 'business-outline',
    category: "Basic Identification",
    items: [
      "Legal name of the organization matches official records",
      "Business registration or incorporation certificate obtained",
      "Business registration number verified with relevant authority",
      "Physical business address confirmed (not just a P.O. box)",
      "Contact details (phone, email, website) verified and active"
    ]
  },
  {
    icon: 'scale-outline',
    category: "Legal Status & Structure",
    items: [
      "Type of organization verified (e.g., LLC, Corporation, NGO, Partnership)",
      "Articles of incorporation / constitution / bylaws reviewed",
      "Ownership structure and shareholders identified",
      "Board of directors or key officers listed and verified",
      "No conflicts of interest or disqualified persons involved"
    ]
  },
  {
    icon: 'shield-checkmark-outline',
    category: "Licenses & Permits",
    items: [
      "All required local, state, and federal business licenses obtained",
      "Industry-specific permits valid and up to date",
      "Proof of tax registration (e.g., VAT, EIN, PAN, etc.)",
      "Export/import licenses (if applicable)",
      "Environmental, safety, or professional certifications (if applicable)"
    ]
  },
  {
    icon: 'document-text-outline',
    category: "Compliance & Legal Standing",
    items: [
      "The organization is in good standing with corporate registry",
      "No record of current or past legal disputes, sanctions, or suspensions",
      "Compliance with labor laws and employment regulations",
      "Data protection and privacy compliance (e.g., GDPR, CCPA)",
      "Anti-money laundering (AML) and anti-corruption compliance policies in place"
    ]
  },
  {
    icon: 'cash-outline',
    category: "Financial Verification",
    items: [
      "Tax filings up to date and available for review",
      "Recent financial statements audited or certified",
      "Banking details verified (registered under company name)",
      "No record of insolvency or bankruptcy"
    ]
  },
  {
    icon: 'people-outline',
    category: "Reputation & Background",
    items: [
      "Company website and online presence verified",
      "Reviews, testimonials, or public records checked",
      "No negative media or regulatory reports",
      "References from clients, partners, or suppliers verified"
    ]
  },
  {
    icon: 'document-text-outline',
    category: "Contracts & Legal Documents",
    items: [
      "Standard contracts reviewed for legal soundness",
      "Non-disclosure and confidentiality agreements in place",
      "Intellectual property (trademarks, patents, copyrights) verified",
      "Insurance coverage valid and adequate"
    ]
  }
];

export const organizationDocuments: DocumentRequirement[] = [
  {
    id: 'registration',
    title: 'Organization Registration Certificate',
    description: 'Official registration certificate from relevant authority',
    required: true,
    example: 'Certificate of Incorporation, NGO Registration',
    notes: 'Must be from recognized government or regulatory body'
  },
  {
    id: 'constitution',
    title: 'Constitution or Bylaws',
    description: 'Governing documents of the organization',
    required: true,
    example: 'Articles of Association, Bylaws, Constitution',
    notes: 'Should include mission, structure, and governance'
  },
  {
    id: 'tax_exempt',
    title: 'Tax Exempt Certificate (if applicable)',
    description: 'Proof of tax-exempt status',
    required: false,
    example: '501(c)(3) determination letter, Charity registration',
    notes: 'For non-profit organizations only'
  },
  {
    id: 'board_list',
    title: 'Board of Directors List',
    description: 'Current board members and their positions',
    required: true,
    example: 'Board roster with names and titles',
    notes: 'Include any changes in last 12 months'
  },
  {
    id: 'annual_report',
    title: 'Annual Report',
    description: 'Most recent annual report or activity summary',
    required: true,
    example: 'Annual report, Impact report, Activity summary',
    notes: 'Should cover previous fiscal year'
  },
  {
    id: 'financials',
    title: 'Audited Financial Statements',
    description: 'Recent audited financial statements',
    required: true,
    example: 'Audit report, Financial review',
    notes: 'Recommended for larger organizations'
  }
];

export const getChecklistByRole = (role: string): ChecklistSection[] => {
  switch (role) {
    case 'candidate':
      return candidateChecklist;
    case 'freelancer':
      return freelancerChecklist;
    case 'company':
      return companyChecklist;
    case 'organization':
      return organizationChecklist;
    default:
      return candidateChecklist;
  }
};

export const getDocumentsByRole = (role: string): DocumentRequirement[] => {
  switch (role) {
    case 'candidate':
      return candidateDocuments;
    case 'freelancer':
      return freelancerDocuments;
    case 'company':
      return companyDocuments;
    case 'organization':
      return organizationDocuments;
    default:
      return candidateDocuments;
  }
};

export const getRoleStats = (role: string) => {
  switch (role) {
    case 'candidate':
      return {
        categories: 6,
        checkpoints: 30,
        minutes: 45,
        days: '3-5',
        color: '#F59E0B',
        gradient: ['#F59E0B', '#F97316']
      };
    case 'freelancer':
      return {
        categories: 7,
        checkpoints: 35,
        minutes: 45,
        days: '1-2',
        color: '#10B981',
        gradient: ['#10B981', '#059669']
      };
    case 'company':
      return {
        categories: 7,
        checkpoints: 41,
        minutes: 90,
        days: '5-7',
        color: '#3B82F6',
        gradient: ['#3B82F6', '#2563EB']
      };
    case 'organization':
      return {
        categories: 7,
        checkpoints: 38,
        minutes: 90,
        days: '5-7',
        color: '#8B5CF6',
        gradient: ['#8B5CF6', '#6D28D9']
      };
    default:
      return {
        categories: 6,
        checkpoints: 30,
        minutes: 45,
        days: '3-5',
        color: '#F59E0B',
        gradient: ['#F59E0B', '#F97316']
      };
  }
};