/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/profile.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { UserProfile, ProfileData, freelancerService } from '@/services/freelancerService';
import CertificationsList from '@/components/freelancer/CertificationsList';
import {
  CameraIcon,
  PencilIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  StarIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  LinkIcon,
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';

// Define proper types for the form data
interface ProfileFormData {
  name: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'expert';
    yearsOfExperience: number;
  }>;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    tiktok?: string;
    telegram?: string;
    twitter?: string;
  };
  freelancerProfile?: {
    headline?: string;
    hourlyRate?: number;
    availability?: 'available' | 'not-available' | 'part-time';
    experienceLevel?: 'entry' | 'intermediate' | 'expert';
    englishProficiency?: 'basic' | 'conversational' | 'fluent' | 'native';
    timezone?: string;
    specialization?: string[];
  };
}

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return 0;
  }
};

// Helper function to format date for input
const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

const FreelancerProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [certifications, setCertifications] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('basic');
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    dateOfBirth: '',
    gender: 'prefer-not-to-say',
    skills: [],
    socialLinks: {
      linkedin: '',
      github: '',
      tiktok: '',
      telegram: '',
      twitter: ''
    },
    freelancerProfile: {
      headline: '',
      hourlyRate: 0,
      availability: 'available',
      experienceLevel: 'intermediate',
      englishProficiency: 'fluent',
      timezone: '',
      specialization: []
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profileData = await freelancerService.getProfile();

      // Load certifications
      let certificationsData: React.SetStateAction<any[]> = [];
      try {
        certificationsData = await freelancerService.getCertifications();
        setCertifications(certificationsData);
      } catch (error) {
        console.warn('Certifications not available yet');
        certificationsData = [];
      }

      // ✅ FIX: Merge certifications into profile data
      const profileWithCertifications = {
        ...profileData,
        certifications: certificationsData
      };

      setProfile(profileWithCertifications);

      const freelancerProfile = profileData.freelancerProfile;

      // FIX: Clean bio field if it contains interface code
      let cleanBio = profileData.bio || '';
      if (cleanBio.includes('interface ProfileData') || cleanBio.includes('export interface')) {
        cleanBio = ''; // Reset bio if it contains code
      }

      setFormData({
        name: profileData.name,
        bio: cleanBio, // Use cleaned bio
        location: profileData.location || '',
        phone: profileData.phone || '',
        website: profileData.website || '',
        dateOfBirth: profileData.dateOfBirth ? formatDateForInput(profileData.dateOfBirth) : '',
        gender: profileData.gender || 'prefer-not-to-say',
        skills: profileData.skills,
        socialLinks: {
          linkedin: profileData.socialLinks?.linkedin || '',
          github: profileData.socialLinks?.github || '',
          tiktok: profileData.socialLinks?.tiktok || '',
          telegram: profileData.socialLinks?.telegram || '',
          twitter: profileData.socialLinks?.twitter || ''
        },
        freelancerProfile: {
          headline: freelancerProfile?.headline || '',
          hourlyRate: freelancerProfile?.hourlyRate || 0,
          availability: (freelancerProfile?.availability as 'available' | 'not-available' | 'part-time') || 'available',
          experienceLevel: (freelancerProfile?.experienceLevel as 'entry' | 'intermediate' | 'expert') || 'intermediate',
          englishProficiency: (freelancerProfile?.englishProficiency as 'basic' | 'conversational' | 'fluent' | 'native') || 'fluent',
          timezone: freelancerProfile?.timezone || '',
          specialization: freelancerProfile?.specialization || []
        }
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // FreelancerProfile.tsx - UPDATED handleSave function
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Format date for backend
      const formattedDateOfBirth = formData.dateOfBirth
        ? new Date(formData.dateOfBirth).toISOString()
        : undefined;

      const saveData: ProfileData = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        dateOfBirth: formattedDateOfBirth,
        gender: formData.gender,
        skills: formData.skills,
        socialLinks: formData.socialLinks,
        freelancerProfile: {
          headline: formData.freelancerProfile?.headline,
          hourlyRate: formData.freelancerProfile?.hourlyRate,
          availability: formData.freelancerProfile?.availability,
          experienceLevel: formData.freelancerProfile?.experienceLevel,
          englishProficiency: formData.freelancerProfile?.englishProficiency,
          timezone: formData.freelancerProfile?.timezone,
          specialization: formData.freelancerProfile?.specialization
        }
      };

      console.log('💾 Saving profile data:', saveData);

      const response = await freelancerService.updateProfile(saveData);

      console.log('✅ Profile saved successfully:', response);

      setProfile(response.profile);
      setIsEditing(false);
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      await freelancerService.uploadAvatar(file);
      await loadProfile();
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  const handleCertificationsUpdate = async (updatedCertifications: any[]) => {
    setCertifications(updatedCertifications);
    // Reload profile to get updated completion score
    await loadProfile();
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('freelancerProfile.')) {
      const profileField = field.replace('freelancerProfile.', '');
      setFormData(prev => ({
        ...prev,
        freelancerProfile: {
          ...prev.freelancerProfile!,
          [profileField]: value
        }
      }));
    } else if (field.startsWith('socialLinks.')) {
      const socialField = field.replace('socialLinks.', '');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks!,
          [socialField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAvailabilityChange = (value: string) => {
    if (value === 'available' || value === 'not-available' || value === 'part-time') {
      handleInputChange('freelancerProfile.availability', value);
    }
  };

  const handleExperienceLevelChange = (value: string) => {
    if (value === 'entry' || value === 'intermediate' || value === 'expert') {
      handleInputChange('freelancerProfile.experienceLevel', value);
    }
  };

  const handleEnglishProficiencyChange = (value: string) => {
    if (value === 'basic' || value === 'conversational' || value === 'fluent' || value === 'native') {
      handleInputChange('freelancerProfile.englishProficiency', value);
    }
  };

  const addSkill = (skillName: string) => {
    if (skillName.trim()) {
      const newSkill = {
        name: skillName.trim(),
        level: 'intermediate' as const,
        yearsOfExperience: 1
      };
      handleInputChange('skills', [...formData.skills, newSkill]);
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = formData.skills.filter((_, i) => i !== index);
    handleInputChange('skills', newSkills);
  };

  // Helper function to get social platform icon
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return '🔗';
      case 'github':
        return '💻';
      case 'tiktok':
        return '🎵';
      case 'telegram':
        return '📱';
      case 'twitter':
        return '🐦';
      default:
        return '🔗';
    }
  };

  // Helper function to get social platform name
  const getSocialPlatformName = (platform: string) => {
    switch (platform) {
      case 'linkedin':
        return 'LinkedIn';
      case 'github':
        return 'GitHub';
      case 'tiktok':
        return 'TikTok';
      case 'telegram':
        return 'Telegram';
      case 'twitter':
        return 'Twitter/X';
      default:
        return platform;
    }
  };

  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </FreelancerLayout>
    );
  }

  if (!profile) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-primary text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Profile Not Found
            </h2>
            <p className="text-muted-foreground">Unable to load your profile. Please try again.</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;

  return (
    <FreelancerLayout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-primary-foreground/20 flex items-center justify-center overflow-hidden border-2 border-primary-foreground shadow-xl">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-12 h-12 text-primary-foreground" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-primary-foreground text-primary p-2 rounded-full shadow-lg cursor-pointer hover:bg-primary-foreground/90 transition-colors">
                      <CameraIcon className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>

                <div>
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  {profile.freelancerProfile?.headline && (
                    <p className="text-primary-foreground/80 text-lg mt-1">
                      {profile.freelancerProfile.headline}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 mt-3">
                    {profile.verificationStatus === 'full' && (
                      <div className="flex items-center bg-primary-foreground/20 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckBadgeIcon className="w-4 h-4 mr-1" />
                        Verified
                      </div>
                    )}
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 mr-1 text-amber-300" />
                      {profile.freelancerProfile?.ratings?.average.toFixed(1) || '0.0'}
                      <span className="text-primary-foreground/80 ml-1">
                        ({profile.freelancerProfile?.ratings?.count || 0} reviews)
                      </span>
                    </div>
                    {/* Age display */}
                    {age && (
                      <div className="flex items-center bg-primary-foreground/20 px-3 py-1 rounded-full text-sm font-medium">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {age} years old
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 lg:mt-0">
                <button
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  className="flex items-center px-6 py-3 bg-primary-foreground text-primary rounded-xl font-semibold hover:bg-primary-foreground/90 transition-all duration-200 shadow-lg"
                >
                  <PencilIcon className="w-5 h-5 mr-2" />
                  {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl shadow-sm border border-border p-6 sticky top-8">
                <nav className="space-y-2">
                  {[
                    { id: 'basic', name: 'Basic Information', icon: UserCircleIcon },
                    { id: 'professional', name: 'Professional Details', icon: BriefcaseIcon },
                    { id: 'skills', name: 'Skills & Expertise', icon: StarIcon },
                    { id: 'certifications', name: 'Certifications', icon: AcademicCapIcon },
                    { id: 'social', name: 'Social Links', icon: LinkIcon },
                    { id: 'contact', name: 'Contact Info', icon: EnvelopeIcon }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 ${activeSection === item.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:bg-accent'
                        }`}
                    >
                      <item.icon className={`w-5 h-5 mr-3 ${activeSection === item.id ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  ))}
                </nav>

                {/* Contact Info Preview */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    {profile.email && (
                      <div className="flex items-center text-muted-foreground">
                        <EnvelopeIcon className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center text-muted-foreground">
                        <MapPinIcon className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">{profile.location}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center text-muted-foreground">
                        <PhoneIcon className="w-4 h-4 mr-3 text-primary" />
                        <span className="text-sm">{profile.phone}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center text-muted-foreground">
                        <GlobeAltIcon className="w-4 h-4 mr-3 text-primary" />
                        <a href={profile.website} className="text-sm text-primary hover:text-primary/80">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Age and Gender Preview */}
                  {(age || profile.gender) && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-4">Personal Details</h4>
                      <div className="space-y-2">
                        {age && (
                          <div className="flex items-center text-muted-foreground">
                            <CalendarIcon className="w-4 h-4 mr-3 text-primary" />
                            <span className="text-sm">{age} years old</span>
                          </div>
                        )}
                        {profile.gender && profile.gender !== 'prefer-not-to-say' && (
                          <div className="flex items-center text-muted-foreground">
                            <UserIcon className="w-4 h-4 mr-3 text-primary" />
                            <span className="text-sm capitalize">{profile.gender}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Social Links Preview */}
                  {profile.socialLinks && Object.values(profile.socialLinks).some(link => link) && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="font-semibold text-foreground mb-4">Social Profiles</h4>
                      <div className="space-y-2">
                        {Object.entries(profile.socialLinks).map(([platform, url]) =>
                          url && (
                            <div key={platform} className="flex items-center text-muted-foreground">
                              <span className="w-4 h-4 mr-3">{getSocialIcon(platform)}</span>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:text-primary/80"
                              >
                                {getSocialPlatformName(platform)}
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {/* Form Content */}
                <div className="p-8">
                  {/* Basic Information */}
                  {activeSection === 'basic' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                          <UserCircleIcon className="w-6 h-6 mr-3 text-primary" />
                          Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Professional Headline
                            </label>
                            <input
                              type="text"
                              value={formData.freelancerProfile?.headline}
                              onChange={(e) => handleInputChange('freelancerProfile.headline', e.target.value)}
                              disabled={!isEditing}
                              placeholder="e.g., Senior UI/UX Designer & Frontend Developer"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                          </div>

                          {/* Date of Birth Field */}
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Date of Birth
                            </label>
                            <div className="space-y-2">
                              <input
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                disabled={!isEditing}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                              />
                              {age && (
                                <div className="text-sm text-muted-foreground flex items-center">
                                  <CalendarIcon className="w-4 h-4 mr-2" />
                                  Age: {age} years old
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Gender Field */}
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Gender
                            </label>
                            <select
                              value={formData.gender}
                              onChange={(e) => handleInputChange('gender', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                              <option value="prefer-not-to-say">Prefer not to say</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Location
                            </label>
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              disabled={!isEditing}
                              placeholder="City, Country"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Professional Bio
                            </label>
                            <textarea
                              value={formData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              disabled={!isEditing}
                              rows={6}
                              placeholder="Tell clients about yourself, your experience, and what you specialize in. A great bio helps you stand out and attract the right projects..."
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                            <div className="text-sm text-muted-foreground mt-2">
                              {formData.bio?.length || 0}/2000 characters
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professional Details */}
                  {activeSection === 'professional' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                          <BriefcaseIcon className="w-6 h-6 mr-3 text-primary" />
                          Professional Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Hourly Rate ($)
                            </label>
                            <div className="relative">
                              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <input
                                type="number"
                                value={formData.freelancerProfile?.hourlyRate}
                                onChange={(e) => handleInputChange('freelancerProfile.hourlyRate', Number(e.target.value))}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Experience Level
                            </label>
                            <select
                              value={formData.freelancerProfile?.experienceLevel}
                              onChange={(e) => handleExperienceLevelChange(e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            >
                              <option value="entry">Entry Level (0-2 years)</option>
                              <option value="intermediate">Intermediate (2-5 years)</option>
                              <option value="expert">Expert (5+ years)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Availability
                            </label>
                            <select
                              value={formData.freelancerProfile?.availability}
                              onChange={(e) => handleAvailabilityChange(e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            >
                              <option value="available">Available (Full-time)</option>
                              <option value="part-time">Part Time</option>
                              <option value="not-available">Not Available</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              English Proficiency
                            </label>
                            <select
                              value={formData.freelancerProfile?.englishProficiency}
                              onChange={(e) => handleEnglishProficiencyChange(e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            >
                              <option value="basic">Basic</option>
                              <option value="conversational">Conversational</option>
                              <option value="fluent">Fluent</option>
                              <option value="native">Native/Bilingual</option>
                            </select>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Timezone
                            </label>
                            <select
                              value={formData.freelancerProfile?.timezone}
                              onChange={(e) => handleInputChange('freelancerProfile.timezone', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            >
                              <option value="">Select your timezone</option>
                              <option value="EST">Eastern Time (EST)</option>
                              <option value="CST">Central Time (CST)</option>
                              <option value="PST">Pacific Time (PST)</option>
                              <option value="GMT">Greenwich Mean Time (GMT)</option>
                              <option value="CET">Central European Time (CET)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills & Expertise */}
                  {activeSection === 'skills' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                          <StarIcon className="w-6 h-6 mr-3 text-primary" />
                          Skills & Expertise
                        </h3>

                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-foreground mb-3">
                            Your Skills ({formData.skills.length} added)
                          </label>

                          <div className="flex flex-wrap gap-3 mb-4">
                            {formData.skills.map((skill, index) => (
                              <div
                                key={index}
                                className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-semibold border border-primary/20 flex items-center group"
                              >
                                {skill.name}
                                {isEditing && (
                                  <button
                                    onClick={() => removeSkill(index)}
                                    className="ml-2 text-primary hover:text-primary/80 transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}

                            {formData.skills.length === 0 && (
                              <div className="text-muted-foreground italic">
                                No skills added yet. Add your first skill to get started.
                              </div>
                            )}
                          </div>

                          {isEditing && (
                            <div className="flex gap-3">
                              <input
                                type="text"
                                placeholder="Add a skill (e.g., React, UI/UX Design, Python)"
                                className="flex-1 px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-muted-foreground"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    const target = e.target as HTMLInputElement;
                                    addSkill(target.value);
                                    target.value = '';
                                  }
                                }}
                              />
                              <button
                                onClick={() => {
                                  const input = document.querySelector('input[placeholder*="Add a skill"]') as HTMLInputElement;
                                  if (input?.value) {
                                    addSkill(input.value);
                                    input.value = '';
                                  }
                                }}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                              >
                                Add Skill
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="bg-primary/10 rounded-xl p-6 border border-primary/20">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center">
                            <StarIcon className="w-5 h-5 mr-2 text-primary" />
                            Pro Tip
                          </h4>
                          <p className="text-foreground/80 text-sm">
                            Add relevant skills that match your expertise. Clients often search for freelancers with specific skills.
                            Include both technical and soft skills for better visibility.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {activeSection === 'certifications' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                          <AcademicCapIcon className="w-6 h-6 mr-3 text-primary" />
                          Professional Certifications
                        </h3>

                        <CertificationsList
                          certifications={certifications}
                          onCertificationsUpdate={handleCertificationsUpdate}
                        />
                      </div>
                    </div>
                  )}

                  {/* Social Links Section */}
                  {activeSection === 'social' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                          <LinkIcon className="w-6 h-6 mr-3 text-primary" />
                          Social Links
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              LinkedIn URL
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks?.linkedin || ''}
                              onChange={(e) => handleInputChange('socialLinks.linkedin', e.target.value)}
                              disabled={!isEditing}
                              placeholder="https://linkedin.com/in/yourprofile"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Format: https://linkedin.com/in/username
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              GitHub URL
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks?.github || ''}
                              onChange={(e) => handleInputChange('socialLinks.github', e.target.value)}
                              disabled={!isEditing}
                              placeholder="https://github.com/yourusername"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Format: https://github.com/username
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              TikTok URL
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks?.tiktok || ''}
                              onChange={(e) => handleInputChange('socialLinks.tiktok', e.target.value)}
                              disabled={!isEditing}
                              placeholder="https://tiktok.com/@yourusername"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Format: https://tiktok.com/@username
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Telegram URL
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks?.telegram || ''}
                              onChange={(e) => handleInputChange('socialLinks.telegram', e.target.value)}
                              disabled={!isEditing}
                              placeholder="https://t.me/yourusername"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Format: https://t.me/username
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Twitter/X URL
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks?.twitter || ''}
                              onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                              disabled={!isEditing}
                              placeholder="https://twitter.com/yourusername or https://x.com/yourusername"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Format: https://twitter.com/username or https://x.com/username
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 bg-primary/10 rounded-xl p-6 border border-primary/20">
                          <h4 className="font-semibold text-foreground mb-2 flex items-center">
                            <LinkIcon className="w-5 h-5 mr-2 text-primary" />
                            Pro Tip
                          </h4>
                          <p className="text-foreground/80 text-sm">
                            Add your social profiles to help clients learn more about your work and professional background.
                            Make sure your profiles are professional and up-to-date. Adding multiple social links improves your profile completeness.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {activeSection === 'contact' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center">
                          <EnvelopeIcon className="w-6 h-6 mr-3 text-primary" />
                          Contact Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Email Address
                            </label>
                            <div className="flex items-center px-4 py-3 bg-muted rounded-xl border border-input">
                              <EnvelopeIcon className="w-5 h-5 text-muted-foreground mr-3" />
                              <span className="text-muted-foreground">{profile.email}</span>
                              <div className="ml-auto bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                Primary
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2">
                              Your email address is used for account notifications and cannot be changed here.
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Website
                            </label>
                            <input
                              type="url"
                              value={formData.website}
                              onChange={(e) => handleInputChange('website', e.target.value)}
                              disabled={!isEditing}
                              placeholder="https://yourportfolio.com"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-foreground mb-3">
                              Location
                            </label>
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              disabled={!isEditing}
                              placeholder="City, Country"
                              className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted transition-colors text-foreground placeholder:text-muted-foreground"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="px-8 py-6 border-t border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Make sure to save your changes before leaving this page.
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 bg-muted text-muted-foreground rounded-xl hover:bg-muted/80 transition-all duration-200 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl"
                        >
                          {isSaving ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                              Saving Changes...
                            </div>
                          ) : (
                            'Save All Changes'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default FreelancerProfile;