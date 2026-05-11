// src/utils/userHelpers.ts
/**
 * Helper functions to safely get user information
 */

export const getUserDisplayName = (user: any, profile?: any): string => {
  if (!user) return '';
  
  // Check profile first as it might have the latest data
  if (profile) {
    if (profile.companyName) return profile.companyName;
    if (profile.organizationName) return profile.organizationName;
    if (profile.businessName) return profile.businessName;
    if (profile.name) return profile.name;
    if (profile.fullName) return profile.fullName;
    if (profile.displayName) return profile.displayName;
  }
  
  // Then check user object
  // Try different possible property names
  const nameProps = [
    'name',
    'companyName', 
    'organizationName',
    'businessName',
    'fullName',
    'displayName',
    'company',
    'organization',
    'business',
    'employerName',
    'orgName',
    'company_name',
    'organization_name'
  ];
  
  for (const prop of nameProps) {
    if (user[prop] && typeof user[prop] === 'string' && user[prop].trim()) {
      return user[prop];
    }
  }
  
  // If we have email, try to extract name from email
  if (user.email) {
    const emailName = user.email.split('@')[0];
    // Convert email name to proper case (e.g., john.doe -> John Doe)
    const formatted = emailName
      .split(/[._-]/)
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
    return formatted;
  }
  
  return '';
};

export const getUserFirstName = (user: any, profile?: any): string => {
  const fullName = getUserDisplayName(user, profile);
  if (!fullName) return '';
  
  // For companies/organizations, return the full name if it's short
  if (fullName.length < 20 && !fullName.includes(' ')) {
    return fullName;
  }
  
  // For individuals, return first name
  const parts = fullName.split(' ');
  return parts[0];
};

export const getUserInitials = (user: any, profile?: any): string => {
  const fullName = getUserDisplayName(user, profile);
  if (!fullName) return '?';
  
  // For company names, try to get first letters of each word (max 2)
  const words = fullName.split(' ').filter(w => w.length > 0);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }
  
  // For multi-word names, take first letter of first two words
  const initials = words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  return initials;
};

// Also add a helper to get the user's role display name
export const getRoleDisplayName = (role: string): string => {
  const roleMap: Record<string, string> = {
    'candidate': 'Candidate',
    'freelancer': 'Freelancer',
    'company': 'Company',
    'organization': 'Organization',
    'admin': 'Admin'
  };
  return roleMap[role] || role;
};