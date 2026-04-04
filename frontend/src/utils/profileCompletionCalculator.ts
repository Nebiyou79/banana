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

    // Basic Information (30%)
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

    // Professional Details (40%)
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

    // Freelancer Specific (30%)
    if (profile.portfolio && profile.portfolio.length >= 2) completedFields.push('Portfolio');
    else {
      missingFields.push('Portfolio');
      suggestions.push('Add at least 2 portfolio items');
    }

    if (profile.certifications && profile.certifications.length > 0) completedFields.push('Certifications');
    else {
      missingFields.push('Certifications');
      suggestions.push('Add professional certifications');
    }

    // Calculate score
    const totalFields = completedFields.length + missingFields.length;
    const score = Math.round((completedFields.length / totalFields) * 100);

    return {
      score,
      completedFields,
      missingFields,
      suggestions: suggestions.slice(0, 5)
    };
  }
}