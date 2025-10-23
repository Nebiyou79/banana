// utils/profileCompletionCalculator.ts
import { UserProfile } from '@/services/freelancerService';

export interface CompletionResult {
  score: number;
  completedFields: string[];
  missingFields: string[];
  suggestions: string[];
}

export class ProfileCompletionCalculator {
  static calculateCompletion(profile: UserProfile): CompletionResult {
    const completedFields: string[] = [];
    const missingFields: string[] = [];
    const suggestions: string[] = [];

    // Basic Information (25%)
    if (profile.name?.trim()) completedFields.push('Name');
    else missingFields.push('Name');
    
    if (profile.email) completedFields.push('Email');
    else missingFields.push('Email');
    
    if (profile.avatar) completedFields.push('Profile Photo');
    else {
      missingFields.push('Profile Photo');
      suggestions.push('Upload a professional profile photo');
    }
    
    if (profile.bio?.trim() && profile.bio.length > 50) completedFields.push('Bio');
    else {
      missingFields.push('Bio');
      suggestions.push('Write a detailed bio (50+ characters)');
    }
    
    if (profile.location?.trim()) completedFields.push('Location');
    else {
      missingFields.push('Location');
      suggestions.push('Add your location');
    }
    
    if (profile.phone?.trim()) completedFields.push('Phone');
    else missingFields.push('Phone');

    // Professional Details (30%)
    if (profile.freelancerProfile?.headline?.trim()) completedFields.push('Professional Headline');
    else {
      missingFields.push('Professional Headline');
      suggestions.push('Add a professional headline');
    }
    
    if (profile.skills && profile.skills.length >= 3) completedFields.push('Skills');
    else {
      missingFields.push('Skills');
      suggestions.push('Add at least 3 skills');
    }
    
    if (profile.freelancerProfile?.experienceLevel) completedFields.push('Experience Level');
    else {
      missingFields.push('Experience Level');
      suggestions.push('Set your experience level');
    }
    
    if (profile.freelancerProfile?.hourlyRate && profile.freelancerProfile.hourlyRate > 0) completedFields.push('Hourly Rate');
    else {
      missingFields.push('Hourly Rate');
      suggestions.push('Set your hourly rate');
    }
    
    if (profile.freelancerProfile?.availability) completedFields.push('Availability');
    else {
      missingFields.push('Availability');
      suggestions.push('Set your availability');
    }

    // Experience & Education (25%)
    if (profile.experience && profile.experience.length > 0) completedFields.push('Work Experience');
    else {
      missingFields.push('Work Experience');
      suggestions.push('Add your work experience');
    }
    
    if (profile.education && profile.education.length > 0) completedFields.push('Education');
    else {
      missingFields.push('Education');
      suggestions.push('Add your education background');
    }
    
    if (profile.portfolio && profile.portfolio.length >= 2) completedFields.push('Portfolio');
    else {
      missingFields.push('Portfolio');
      suggestions.push('Add at least 2 portfolio items');
    }

    // Certifications (10%)
    if (profile.freelancerProfile?.certifications && profile.freelancerProfile.certifications.length > 0) completedFields.push('Certifications');
    else {
      missingFields.push('Certifications');
      suggestions.push('Add professional certifications');
    }

    // Additional Information (10%)
    if (profile.website?.trim()) completedFields.push('Website');
    else missingFields.push('Website');
    
    if (profile.socialLinks && Object.values(profile.socialLinks).some(link => link)) completedFields.push('Social Links');
    else missingFields.push('Social Links');
    
    if (profile.freelancerProfile?.timezone) completedFields.push('Timezone');
    else missingFields.push('Timezone');
    
    if (profile.freelancerProfile?.englishProficiency) completedFields.push('English Proficiency');
    else missingFields.push('English Proficiency');

    // Calculate score (weighted)
    const totalFields = completedFields.length + missingFields.length;
    const score = Math.round((completedFields.length / totalFields) * 100);

    return {
      score,
      completedFields,
      missingFields,
      suggestions: suggestions.slice(0, 5) // Limit to top 5 suggestions
    };
  }

  static getCompletionStatus(score: number): { status: string; description: string; icon: string } {
    if (score >= 90) {
      return {
        status: 'Excellent',
        description: 'Your profile is fully optimized!',
        icon: '🏆'
      };
    } else if (score >= 80) {
      return {
        status: 'Very Good',
        description: 'Great profile! Almost there.',
        icon: '⭐'
      };
    } else if (score >= 70) {
      return {
        status: 'Good',
        description: 'Good start, keep improving!',
        icon: '👍'
      };
    } else if (score >= 50) {
      return {
        status: 'Fair',
        description: 'Complete more sections to improve visibility',
        icon: '📈'
      };
    } else {
      return {
        status: 'Needs Work',
        description: 'Complete your profile to get more clients',
        icon: '🚧'
      };
    }
  }
}