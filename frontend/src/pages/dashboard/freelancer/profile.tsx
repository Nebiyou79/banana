/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/profile.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { UserProfile, ProfileData, freelancerService } from '@/services/freelancerService';
// import ProfileCompletion from '@/components/freelancer/ProfileCompletion';
import CertificationsList from '@/components/freelancer/CertificationsList';
import { colorClasses } from '@/utils/color';
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
  UserCircleIcon
} from '@heroicons/react/24/outline';

// Define proper types for the form data
interface ProfileFormData {
  name: string;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  skills: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'expert';
    yearsOfExperience: number;
  }>;
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
    skills: [],
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
      setProfile(profileData);
      
      // Load certifications
      try {
        const certs = await freelancerService.getCertifications();
        setCertifications(certs);
      } catch (error) {
        console.warn('Certifications not available yet');
        setCertifications([]);
      }
      
      const freelancerProfile = profileData.freelancerProfile;
      
      setFormData({
        name: profileData.name,
        bio: profileData.bio || '',
        location: profileData.location || '',
        phone: profileData.phone || '',
        website: profileData.website || '',
        skills: profileData.skills,
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
      const saveData: ProfileData = {
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        phone: formData.phone,
        website: formData.website,
        skills: formData.skills,
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
    } catch (error) {
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

  const handleCertificationsUpdate = async (updatedCertifications: any[], profileCompletion: number) => {
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

  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </FreelancerLayout>
    );
  }

  if (!profile) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="text-green-500 text-6xl mb-4">⚠️</div>
            <h2 className={`text-2xl font-bold ${colorClasses.text.darkNavy} mb-2`}>
              Profile Not Found
            </h2>
            <p className="text-gray-600">Unable to load your profile. Please try again.</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                    {profile.avatar ? (
                      <img 
                        src={profile.avatar} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="w-12 h-12 text-white" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-white text-green-600 p-2 rounded-full shadow-lg cursor-pointer hover:bg-green-50 transition-colors">
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
                    <p className="text-green-100 text-lg mt-1">
                      {profile.freelancerProfile.headline}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-3">
                    {profile.verificationStatus === 'full' && (
                      <div className="flex items-center bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        <CheckBadgeIcon className="w-4 h-4 mr-1" />
                        Verified
                      </div>
                    )}
                    <div className="flex items-center">
                      <StarIcon className="w-4 h-4 mr-1 text-amber-300" />
                      {profile.freelancerProfile?.ratings?.average.toFixed(1) || '0.0'}
                      <span className="text-green-200 ml-1">
                        ({profile.freelancerProfile?.ratings?.count || 0} reviews)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 lg:mt-0">
                <button
                  onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
                  className="flex items-center px-6 py-3 bg-white text-green-700 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 shadow-lg"
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sticky top-8">
                <nav className="space-y-2">
                  {[
                    { id: 'basic', name: 'Basic Information', icon: UserCircleIcon },
                    { id: 'professional', name: 'Professional Details', icon: BriefcaseIcon },
                    { id: 'skills', name: 'Skills & Expertise', icon: StarIcon },
                    { id: 'certifications', name: 'Certifications', icon: AcademicCapIcon },
                    { id: 'contact', name: 'Contact Info', icon: EnvelopeIcon }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                        activeSection === item.id
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 mr-3 ${
                        activeSection === item.id ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  ))}
                </nav>

                {/* Contact Info Preview */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4">Contact Information</h4>
                  <div className="space-y-3">
                    {profile.email && (
                      <div className="flex items-center text-gray-600">
                        <EnvelopeIcon className="w-4 h-4 mr-3 text-green-500" />
                        <span className="text-sm">{profile.email}</span>
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-3 text-green-500" />
                        <span className="text-sm">{profile.location}</span>
                      </div>
                    )}
                    {profile.phone && (
                      <div className="flex items-center text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-3 text-green-500" />
                        <span className="text-sm">{profile.phone}</span>
                      </div>
                    )}
                    {profile.website && (
                      <div className="flex items-center text-gray-600">
                        <GlobeAltIcon className="w-4 h-4 mr-3 text-green-500" />
                        <a href={profile.website} className="text-sm text-green-600 hover:text-green-700">
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Form Content */}
                <div className="p-8">
                  {/* Basic Information */}
                  {activeSection === 'basic' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <UserCircleIcon className="w-6 h-6 mr-3 text-green-500" />
                          Basic Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Full Name *
                            </label>
                            <input
                              type="text"
                              value={formData.name}
                              onChange={(e) => handleInputChange('name', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Professional Headline
                            </label>
                            <input
                              type="text"
                              value={formData.freelancerProfile?.headline}
                              onChange={(e) => handleInputChange('freelancerProfile.headline', e.target.value)}
                              disabled={!isEditing}
                              placeholder="e.g., Senior UI/UX Designer & Frontend Developer"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Location
                            </label>
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              disabled={!isEditing}
                              placeholder="City, Country"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Professional Bio
                            </label>
                            <textarea
                              value={formData.bio}
                              onChange={(e) => handleInputChange('bio', e.target.value)}
                              disabled={!isEditing}
                              rows={6}
                              placeholder="Tell clients about yourself, your experience, and what you specialize in. A great bio helps you stand out and attract the right projects..."
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-gray-50 transition-colors"
                            />
                            <div className="text-sm text-gray-500 mt-2">
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
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <BriefcaseIcon className="w-6 h-6 mr-3 text-green-500" />
                          Professional Details
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Hourly Rate ($)
                            </label>
                            <div className="relative">
                              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="number"
                                value={formData.freelancerProfile?.hourlyRate}
                                onChange={(e) => handleInputChange('freelancerProfile.hourlyRate', Number(e.target.value))}
                                disabled={!isEditing}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Experience Level
                            </label>
                            <select
                              value={formData.freelancerProfile?.experienceLevel}
                              onChange={(e) => handleExperienceLevelChange(e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            >
                              <option value="entry">Entry Level (0-2 years)</option>
                              <option value="intermediate">Intermediate (2-5 years)</option>
                              <option value="expert">Expert (5+ years)</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Availability
                            </label>
                            <select
                              value={formData.freelancerProfile?.availability}
                              onChange={(e) => handleAvailabilityChange(e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            >
                              <option value="available">Available (Full-time)</option>
                              <option value="part-time">Part Time</option>
                              <option value="not-available">Not Available</option>
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              English Proficiency
                            </label>
                            <select
                              value={formData.freelancerProfile?.englishProficiency}
                              onChange={(e) => handleEnglishProficiencyChange(e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            >
                              <option value="basic">Basic</option>
                              <option value="conversational">Conversational</option>
                              <option value="fluent">Fluent</option>
                              <option value="native">Native/Bilingual</option>
                            </select>
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Timezone
                            </label>
                            <select
                              value={formData.freelancerProfile?.timezone}
                              onChange={(e) => handleInputChange('freelancerProfile.timezone', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            >
                              <option value="">Select your timezone</option>
                              <option value="EST">Eastern Time (EST)</option>
                              <option value="CST">Central Time (CST)</option>
                              <option value="PST">Pacific Time (PST)</option>
                              <option value="GMT">Greenwich Mean Time (GMT)</option>
                              <option value="CET">Central European Time (CET)</option>
                              {/* Add more timezones as needed */}
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
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <StarIcon className="w-6 h-6 mr-3 text-green-500" />
                          Skills & Expertise
                        </h3>
                        
                        <div className="mb-6">
                          <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Your Skills ({formData.skills.length} added)
                          </label>
                          
                          <div className="flex flex-wrap gap-3 mb-4">
                            {formData.skills.map((skill, index) => (
                              <div 
                                key={index}
                                className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-4 py-2 rounded-xl text-sm font-semibold border border-green-200 flex items-center group"
                              >
                                {skill.name}
                                {isEditing && (
                                  <button
                                    onClick={() => removeSkill(index)}
                                    className="ml-2 text-green-500 hover:text-green-700 transition-colors"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            
                            {formData.skills.length === 0 && (
                              <div className="text-gray-500 italic">
                                No skills added yet. Add your first skill to get started.
                              </div>
                            )}
                          </div>
                          
                          {isEditing && (
                            <div className="flex gap-3">
                              <input
                                type="text"
                                placeholder="Add a skill (e.g., React, UI/UX Design, Python)"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                                className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
                              >
                                Add Skill
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <StarIcon className="w-5 h-5 mr-2 text-blue-600" />
                            Pro Tip
                          </h4>
                          <p className="text-blue-700 text-sm">
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
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <AcademicCapIcon className="w-6 h-6 mr-3 text-green-500" />
                          Professional Certifications
                        </h3>
                        
                        <CertificationsList
                          certifications={certifications}
                          onCertificationsUpdate={handleCertificationsUpdate}
                        />
                      </div>
                    </div>
                  )}

                  {/* Contact Information */}
                  {activeSection === 'contact' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                          <EnvelopeIcon className="w-6 h-6 mr-3 text-green-500" />
                          Contact Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Email Address
                            </label>
                            <div className="flex items-center px-4 py-3 bg-gray-50 rounded-xl border border-gray-300">
                              <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                              <span className="text-gray-600">{profile.email}</span>
                              <div className="ml-auto bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                Primary
                              </div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                              Your email address is used for account notifications and cannot be changed here.
                            </p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Phone Number
                            </label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleInputChange('phone', e.target.value)}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Website
                            </label>
                            <input
                              type="url"
                              value={formData.website}
                              onChange={(e) => handleInputChange('website', e.target.value)}
                              disabled={!isEditing}
                              placeholder="https://yourportfolio.com"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                              Location
                            </label>
                            <input
                              type="text"
                              value={formData.location}
                              onChange={(e) => handleInputChange('location', e.target.value)}
                              disabled={!isEditing}
                              placeholder="City, Country"
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-50 transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                {isEditing && (
                  <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Make sure to save your changes before leaving this page.
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={isSaving}
                          className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl"
                        >
                          {isSaving ? (
                            <div className="flex items-center">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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