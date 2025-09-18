/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { portfolioService } from '@/services/portfolioService';
import { 
  CameraIcon, 
  PlusIcon, 
  XMarkIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const FreelancerProfile: React.FC = () => {
  const { user: authUser, refetchUser } = useAuth();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    phone: '',
    website: '',
    skills: [] as string[],
  });
  const [newSkill, setNewSkill] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch freelancer profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['freelancerProfile'],
    queryFn: portfolioService.getProfile,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: authUser?.email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        phone: profile.phone || '',
        website: profile.website || '',
        skills: profile.skills || [],
      });
    }
  }, [profile, authUser]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: portfolioService.updateProfile,
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['freelancerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      refetchUser();
      setSuccessMessage('Profile updated successfully!');
      setErrorMessage('');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      setErrorMessage(error.message || 'Failed to update profile');
      setSuccessMessage('');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill),
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
          <DashboardLayout requiredRole="freelancer">
                  <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          Failed to load profile: {(error as Error).message}
        </div>
      </div>
          </DashboardLayout>
    );
  }

  return (
  <DashboardLayout requiredRole="freelancer">
        <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Freelancer Profile</h1>
        <p className="text-gray-600">Complete your profile to attract more clients</p>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-xl mb-6 flex items-center">
          <CheckBadgeIcon className="w-5 h-5 mr-2" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-2xl font-bold">
                {authUser?.name?.charAt(0).toUpperCase()}
              </div>
              <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100 transition-colors">
                <CameraIcon className="w-4 h-4 text-blue-600" />
              </button>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{authUser?.name}</h2>
              <p className="text-blue-100">{authUser?.email}</p>
              <div className="flex items-center mt-2">
                <span className="bg-blue-800 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                  {authUser?.role}
                </span>
                <span className="ml-2 bg-green-800 bg-opacity-50 px-3 py-1 rounded-full text-sm">
                  {profile?.verificationStatus || 'none'} verification
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={updateProfileMutation.isPending}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Tell clients about yourself, your experience, and what you can offer..."
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="City, Country"
                disabled={updateProfileMutation.isPending}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+1234567890"
                disabled={updateProfileMutation.isPending}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website/Portfolio
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://yourportfolio.com"
              disabled={updateProfileMutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add a skill"
                disabled={updateProfileMutation.isPending}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                disabled={updateProfileMutation.isPending || !newSkill.trim()}
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm flex items-center">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                    disabled={updateProfileMutation.isPending}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center transition-colors duration-200"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>

  );
};

export default FreelancerProfile;