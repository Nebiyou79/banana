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
import { cn } from '@/lib/utils';
import { useResponsive } from '@/hooks/useResponsive';
import { colorClasses } from '@/utils/color';

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
    return 0;
  }
};

const formatDateForInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
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
  const { breakpoint, isTouch, getTouchTargetSize } = useResponsive();

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

      let certificationsData: React.SetStateAction<any[]> = [];
      try {
        certificationsData = await freelancerService.getCertifications();
        setCertifications(certificationsData);
      } catch (error) {
        console.warn('Certifications not available yet');
        certificationsData = [];
      }

      const profileWithCertifications = {
        ...profileData,
        certifications: certificationsData
      };

      setProfile(profileWithCertifications);

      const freelancerProfile = profileData.freelancerProfile;

      let cleanBio = profileData.bio || '';
      if (cleanBio.includes('interface ProfileData') || cleanBio.includes('export interface')) {
        cleanBio = '';
      }

      setFormData({
        name: profileData.name,
        bio: cleanBio,
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

  const handleSave = async () => {
    try {
      setIsSaving(true);

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

      const response = await freelancerService.updateProfile(saveData);
      setProfile(response.profile);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update profile:', error);
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

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return '🔗';
      case 'github': return '💻';
      case 'tiktok': return '🎵';
      case 'telegram': return '📱';
      case 'twitter': return '🐦';
      default: return '🔗';
    }
  };

  const getSocialPlatformName = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn';
      case 'github': return 'GitHub';
      case 'tiktok': return 'TikTok';
      case 'telegram': return 'Telegram';
      case 'twitter': return 'Twitter/X';
      default: return platform;
    }
  };

  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
        </div>
      </FreelancerLayout>
    );
  }

  if (!profile) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className={cn("text-6xl mb-4", colorClasses.text.amber)}>⚠️</div>
            <h2 className={cn("text-2xl font-bold mb-2", colorClasses.text.primary)}>
              Profile Not Found
            </h2>
            <p className={colorClasses.text.muted}>Unable to load your profile. Please try again.</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  const age = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;

  return (
    <FreelancerLayout>
      <div className={cn(
        "min-h-screen transition-colors duration-200",
        "bg-gray-50 dark:bg-gray-900"
      )}>
        {/* Header */}
        <div className={cn(
          "bg-gradient-to-r",
          "from-emerald-600 to-emerald-700",
          "dark:from-emerald-800 dark:to-emerald-900",
          "text-white py-6 sm:py-8"
        )}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="relative mx-auto sm:mx-0">
                  <div className={cn(
                    "rounded-full flex items-center justify-center overflow-hidden",
                    "border-2 border-white shadow-xl",
                    "w-20 h-20 sm:w-24 sm:h-24", // Responsive sizing
                    "bg-white/20"
                  )}>
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <label className={cn(
                      "absolute bottom-0 right-0",
                      "bg-white text-emerald-600",
                      "p-1.5 sm:p-2 rounded-full shadow-lg cursor-pointer",
                      "hover:bg-gray-100 transition-colors",
                      getTouchTargetSize('sm')
                    )}>
                      <CameraIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                      />
                    </label>
                  )}
                </div>

                <div className="text-center sm:text-left">
                  <h1 className={cn(
                    "font-bold",
                    "text-2xl sm:text-3xl" // Responsive text
                  )}>{profile.name}</h1>
                  {profile.freelancerProfile?.headline && (
                    <p className={cn(
                      "mt-1",
                      "text-sm sm:text-base", // Responsive text
                      "text-emerald-100 dark:text-emerald-200"
                    )}>
                      {profile.freelancerProfile.headline}
                    </p>
                  )}

                  <div className={cn(
                    "flex flex-wrap justify-center sm:justify-start",
                    "items-center gap-3 sm:gap-4 mt-3"
                  )}>
                    {profile.verificationStatus === 'full' && (
                      <div className={cn(
                        "flex items-center",
                        "bg-white/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full",
                        "text-xs sm:text-sm font-medium"
                      )}>
                        <CheckBadgeIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Verified
                      </div>
                    )}
                    <div className="flex items-center">
                      <StarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-amber-300" />
                      <span className="text-xs sm:text-sm">
                        {profile.freelancerProfile?.ratings?.average.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-xs sm:text-sm text-emerald-100 ml-1">
                        ({profile.freelancerProfile?.ratings?.count || 0})
                      </span>
                    </div>
                    {age && (
                      <div className={cn(
                        "flex items-center",
                        "bg-white/20 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full",
                        "text-xs sm:text-sm font-medium"
                      )}>
                        <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        {age} years
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 lg:mt-0 text-center sm:text-left">
                <button
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  className={cn(
                    "flex items-center justify-center",
                    "px-4 sm:px-6 py-2 sm:py-3",
                    "text-sm sm:text-base", // Responsive text
                    "bg-white text-emerald-600 dark:text-emerald-700",
                    "rounded-xl font-semibold",
                    "hover:bg-gray-100 transition-all duration-200",
                    "shadow-lg hover:shadow-xl mx-auto sm:mx-0",
                    getTouchTargetSize('md')
                  )}
                >
                  <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-4 sm:-mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className={cn(
                "rounded-2xl shadow-sm border p-4 sm:p-6",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700",
                "sticky top-4"
              )}>
                <nav className="space-y-1 sm:space-y-2">
                  {[
                    { id: 'basic', name: 'Basic Info', icon: UserCircleIcon },
                    { id: 'professional', name: 'Professional', icon: BriefcaseIcon },
                    { id: 'skills', name: 'Skills', icon: StarIcon },
                    { id: 'certifications', name: 'Certifications', icon: AcademicCapIcon },
                    { id: 'social', name: 'Social Links', icon: LinkIcon },
                    { id: 'contact', name: 'Contact', icon: EnvelopeIcon }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full flex items-center",
                        "px-3 sm:px-4 py-2 sm:py-3",
                        "rounded-xl text-left transition-all duration-200",
                        "text-sm sm:text-base", // Responsive text
                        activeSection === item.id
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700',
                        getTouchTargetSize('sm')
                      )}
                    >
                      <item.icon className={cn(
                        "mr-2 sm:mr-3",
                        "w-4 h-4 sm:w-5 sm:h-5",
                        activeSection === item.id
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-400 dark:text-gray-500'
                      )} />
                      {breakpoint === 'mobile' && item.id === 'professional' ? 'Work' :
                        breakpoint === 'mobile' && item.id === 'certifications' ? 'Certs' :
                          breakpoint === 'mobile' && item.id === 'social' ? 'Links' : item.name}
                    </button>
                  ))}
                </nav>

                {/* Contact Info Preview - Hidden on mobile */}
                {breakpoint !== 'mobile' && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className={cn(
                      "font-semibold mb-4",
                      "text-gray-900 dark:text-white"
                    )}>Contact Info</h4>
                    <div className="space-y-3">
                      {profile.email && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <EnvelopeIcon className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-sm truncate">{profile.email}</span>
                        </div>
                      )}
                      {profile.location && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <MapPinIcon className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-sm truncate">{profile.location}</span>
                        </div>
                      )}
                      {profile.phone && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400">
                          <PhoneIcon className="w-4 h-4 mr-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-sm truncate">{profile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className={cn(
                "rounded-2xl shadow-sm border overflow-hidden",
                "bg-white dark:bg-gray-800",
                "border-gray-200 dark:border-gray-700"
              )}>
                {/* Form Content */}
                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Basic Information */}
                  {activeSection === 'basic' && (
                    <div className="space-y-6 sm:space-y-8">
                      <h3 className={cn(
                        "font-bold flex items-center",
                        "text-xl sm:text-2xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <UserCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                        Basic Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              "disabled:text-gray-500 dark:disabled:text-gray-400",
                              getTouchTargetSize('sm')
                            )}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Professional Headline
                          </label>
                          <input
                            type="text"
                            value={formData.freelancerProfile?.headline}
                            onChange={(e) => handleInputChange('freelancerProfile.headline', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g., Senior UI/UX Designer"
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            disabled={!isEditing}
                            max={new Date().toISOString().split('T')[0]}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                          {age && (
                            <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Age: {age} years
                            </div>
                          )}
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Gender
                          </label>
                          <select
                            value={formData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                          </select>
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            disabled={!isEditing}
                            placeholder="City, Country"
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Professional Bio
                          </label>
                          <textarea
                            value={formData.bio}
                            onChange={(e) => handleInputChange('bio', e.target.value)}
                            disabled={!isEditing}
                            rows={breakpoint === 'mobile' ? 4 : 6}
                            placeholder="Tell clients about yourself..."
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                              "resize-none",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                          <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                            {formData.bio?.length || 0}/2000
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Professional Details */}
                  {activeSection === 'professional' && (
                    <div className="space-y-6 sm:space-y-8">
                      <h3 className={cn(
                        "font-bold flex items-center",
                        "text-xl sm:text-2xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <BriefcaseIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                        Professional Details
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Hourly Rate ($)
                          </label>
                          <div className="relative">
                            <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            <input
                              type="number"
                              value={formData.freelancerProfile?.hourlyRate}
                              onChange={(e) => handleInputChange('freelancerProfile.hourlyRate', Number(e.target.value))}
                              disabled={!isEditing}
                              className={cn(
                                "w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3",
                                "border rounded-xl",
                                "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                                "text-sm sm:text-base", // Responsive text
                                "bg-white dark:bg-gray-900",
                                "border-gray-300 dark:border-gray-600",
                                "text-gray-900 dark:text-white",
                                "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                                getTouchTargetSize('sm')
                              )}
                            />
                          </div>
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Experience Level
                          </label>
                          <select
                            value={formData.freelancerProfile?.experienceLevel}
                            onChange={(e) => handleInputChange('freelancerProfile.experienceLevel', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          >
                            <option value="entry">Entry (0-2 years)</option>
                            <option value="intermediate">Intermediate (2-5 years)</option>
                            <option value="expert">Expert (5+ years)</option>
                          </select>
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Availability
                          </label>
                          <select
                            value={formData.freelancerProfile?.availability}
                            onChange={(e) => handleInputChange('freelancerProfile.availability', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          >
                            <option value="available">Full-time</option>
                            <option value="part-time">Part Time</option>
                            <option value="not-available">Not Available</option>
                          </select>
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            English Proficiency
                          </label>
                          <select
                            value={formData.freelancerProfile?.englishProficiency}
                            onChange={(e) => handleInputChange('freelancerProfile.englishProficiency', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          >
                            <option value="basic">Basic</option>
                            <option value="conversational">Conversational</option>
                            <option value="fluent">Fluent</option>
                            <option value="native">Native</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Timezone
                          </label>
                          <select
                            value={formData.freelancerProfile?.timezone}
                            onChange={(e) => handleInputChange('freelancerProfile.timezone', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          >
                            <option value="">Select timezone</option>
                            <option value="EST">Eastern Time (EST)</option>
                            <option value="CST">Central Time (CST)</option>
                            <option value="PST">Pacific Time (PST)</option>
                            <option value="GMT">GMT</option>
                            <option value="CET">Central European (CET)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Skills & Expertise */}
                  {activeSection === 'skills' && (
                    <div className="space-y-6 sm:space-y-8">
                      <h3 className={cn(
                        "font-bold flex items-center",
                        "text-xl sm:text-2xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                        Skills & Expertise
                      </h3>

                      <div>
                        <label className={cn(
                          "block font-semibold mb-3",
                          "text-sm sm:text-base", // Responsive text
                          "text-gray-700 dark:text-gray-300"
                        )}>
                          Your Skills ({formData.skills.length} added)
                        </label>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {formData.skills.map((skill, index) => (
                            <div
                              key={index}
                              className={cn(
                                "px-3 py-1.5 sm:px-4 sm:py-2",
                                "rounded-xl text-xs sm:text-sm font-semibold",
                                "flex items-center group",
                                "bg-emerald-50 dark:bg-emerald-900/30",
                                "text-emerald-700 dark:text-emerald-300",
                                "border border-emerald-200 dark:border-emerald-800"
                              )}
                            >
                              {skill.name}
                              {isEditing && (
                                <button
                                  onClick={() => removeSkill(index)}
                                  className="ml-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          ))}

                          {formData.skills.length === 0 && (
                            <div className="text-sm sm:text-base text-gray-500 dark:text-gray-400 italic">
                              No skills added yet.
                            </div>
                          )}
                        </div>

                        {isEditing && (
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <input
                              type="text"
                              placeholder="Add a skill..."
                              className={cn(
                                "flex-1 px-3 sm:px-4 py-2 sm:py-3",
                                "border rounded-xl",
                                "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                                "text-sm sm:text-base", // Responsive text
                                "bg-white dark:bg-gray-900",
                                "border-gray-300 dark:border-gray-600",
                                "text-gray-900 dark:text-white",
                                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                getTouchTargetSize('sm')
                              )}
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
                              className={cn(
                                "px-4 sm:px-6 py-2 sm:py-3",
                                "rounded-xl font-semibold",
                                "text-sm sm:text-base", // Responsive text
                                "bg-emerald-600 hover:bg-emerald-700",
                                "text-white",
                                "transition-colors",
                                getTouchTargetSize('md')
                              )}
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>

                      <div className={cn(
                        "rounded-xl p-4 sm:p-6",
                        "bg-emerald-50 dark:bg-emerald-900/20",
                        "border border-emerald-200 dark:border-emerald-800"
                      )}>
                        <h4 className={cn(
                          "font-semibold mb-2 flex items-center",
                          "text-sm sm:text-base", // Responsive text
                          "text-gray-900 dark:text-white"
                        )}>
                          <StarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                          Pro Tip
                        </h4>
                        <p className={cn(
                          "text-xs sm:text-sm", // Responsive text
                          "text-gray-600 dark:text-gray-400"
                        )}>
                          Add relevant skills that match your expertise. Include both technical and soft skills.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {activeSection === 'certifications' && (
                    <div className="space-y-6 sm:space-y-8">
                      <h3 className={cn(
                        "font-bold flex items-center",
                        "text-xl sm:text-2xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <AcademicCapIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                        Certifications
                      </h3>

                      <CertificationsList
                        certifications={certifications}
                        onCertificationsUpdate={handleCertificationsUpdate}
                      />
                    </div>
                  )}

                  {/* Social Links */}
                  {activeSection === 'social' && (
                    <div className="space-y-6 sm:space-y-8">
                      <h3 className={cn(
                        "font-bold flex items-center",
                        "text-xl sm:text-2xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                        Social Links
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {['linkedin', 'github', 'tiktok', 'telegram', 'twitter'].map((platform) => (
                          <div key={platform} className="sm:col-span-1">
                            <label className={cn(
                              "block font-semibold mb-2 sm:mb-3 capitalize",
                              "text-xs sm:text-sm", // Responsive text
                              "text-gray-700 dark:text-gray-300"
                            )}>
                              {getSocialPlatformName(platform)}
                            </label>
                            <input
                              type="url"
                              value={formData.socialLinks?.[platform as keyof typeof formData.socialLinks] || ''}
                              onChange={(e) => handleInputChange(`socialLinks.${platform}`, e.target.value)}
                              disabled={!isEditing}
                              placeholder={`https://${platform}.com/...`}
                              className={cn(
                                "w-full px-3 sm:px-4 py-2 sm:py-3",
                                "border rounded-xl",
                                "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                                "text-sm sm:text-base", // Responsive text
                                "bg-white dark:bg-gray-900",
                                "border-gray-300 dark:border-gray-600",
                                "text-gray-900 dark:text-white",
                                "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                                "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                                getTouchTargetSize('sm')
                              )}
                            />
                          </div>
                        ))}
                      </div>

                      <div className={cn(
                        "rounded-xl p-4 sm:p-6",
                        "bg-emerald-50 dark:bg-emerald-900/20",
                        "border border-emerald-200 dark:border-emerald-800"
                      )}>
                        <h4 className={cn(
                          "font-semibold mb-2 flex items-center",
                          "text-sm sm:text-base", // Responsive text
                          "text-gray-900 dark:text-white"
                        )}>
                          <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                          Pro Tip
                        </h4>
                        <p className={cn(
                          "text-xs sm:text-sm", // Responsive text
                          "text-gray-600 dark:text-gray-400"
                        )}>
                          Add professional social profiles to build trust with clients.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {activeSection === 'contact' && (
                    <div className="space-y-6 sm:space-y-8">
                      <h3 className={cn(
                        "font-bold flex items-center",
                        "text-xl sm:text-2xl", // Responsive text
                        "text-gray-900 dark:text-white"
                      )}>
                        <EnvelopeIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-emerald-600 dark:text-emerald-400" />
                        Contact Information
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div className="sm:col-span-2">
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Email Address
                          </label>
                          <div className={cn(
                            "flex items-center px-3 sm:px-4 py-2 sm:py-3",
                            "rounded-xl border",
                            "bg-gray-50 dark:bg-gray-900",
                            "border-gray-300 dark:border-gray-600",
                            "text-gray-600 dark:text-gray-400"
                          )}>
                            <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-400" />
                            <span className="text-sm sm:text-base truncate">{profile.email}</span>
                            <span className={cn(
                              "ml-auto px-2 py-1 rounded text-xs font-medium",
                              "bg-emerald-100 dark:bg-emerald-900/30",
                              "text-emerald-700 dark:text-emerald-300"
                            )}>
                              Primary
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            disabled={!isEditing}
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                        </div>

                        <div>
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Website
                          </label>
                          <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                            disabled={!isEditing}
                            placeholder="https://..."
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className={cn(
                            "block font-semibold mb-2 sm:mb-3",
                            "text-xs sm:text-sm", // Responsive text
                            "text-gray-700 dark:text-gray-300"
                          )}>
                            Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleInputChange('location', e.target.value)}
                            disabled={!isEditing}
                            placeholder="City, Country"
                            className={cn(
                              "w-full px-3 sm:px-4 py-2 sm:py-3",
                              "border rounded-xl",
                              "focus:outline-none focus:ring-2 focus:ring-emerald-500",
                              "text-sm sm:text-base", // Responsive text
                              "bg-white dark:bg-gray-900",
                              "border-gray-300 dark:border-gray-600",
                              "text-gray-900 dark:text-white",
                              "placeholder:text-gray-400 dark:placeholder:text-gray-500",
                              "disabled:bg-gray-100 dark:disabled:bg-gray-800",
                              getTouchTargetSize('sm')
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className={cn(
                    "px-4 sm:px-6 lg:px-8 py-4 sm:py-6",
                    "border-t",
                    "bg-gray-50 dark:bg-gray-900",
                    "border-gray-200 dark:border-gray-700"
                  )}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                        Save your changes before leaving.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                        <button
                          onClick={() => setIsEditing(false)}
                          className={cn(
                            "px-4 sm:px-6 py-2 sm:py-3",
                            "rounded-xl font-semibold",
                            "text-sm sm:text-base", // Responsive text
                            "bg-gray-200 dark:bg-gray-700",
                            "text-gray-700 dark:text-gray-300",
                            "hover:bg-gray-300 dark:hover:bg-gray-600",
                            "transition-colors",
                            getTouchTargetSize('md')
                          )}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className={cn(
                            "px-4 sm:px-8 py-2 sm:py-3",
                            "rounded-xl font-semibold",
                            "text-sm sm:text-base", // Responsive text
                            "bg-emerald-600 hover:bg-emerald-700",
                            "text-white",
                            "disabled:opacity-50",
                            "shadow-lg hover:shadow-xl",
                            "transition-all",
                            getTouchTargetSize('md')
                          )}
                        >
                          {isSaving ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Saving...
                            </div>
                          ) : (
                            'Save Changes'
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