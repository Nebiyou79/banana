// src/components/organization/OrganizationForm.tsx
import React, { useState, useEffect } from 'react';
import { organizationService, OrganizationProfile } from '@/services/organizationService';
import { colors, colorClasses } from '@/utils/color';

interface OrganizationFormProps {
  organization?: OrganizationProfile | null;
  onSubmit?: (data: OrganizationProfile) => void;
  mode?: 'create' | 'edit';
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  organization,
  onSubmit,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<Partial<OrganizationProfile>>({
    name: '',
    registrationNumber: '',
    organizationType: 'non-profit',
    industry: '',
    description: '',
    address: '',
    phone: '',
    website: '',
    mission: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (organization && mode === 'edit') {
      setFormData({
        name: organization.name || '',
        registrationNumber: organization.registrationNumber || '',
        organizationType: organization.organizationType || 'non-profit',
        industry: organization.industry || '',
        description: organization.description || '',
        address: organization.address || '',
        phone: organization.phone || '',
        website: organization.website || '',
        mission: organization.mission || ''
      });
    }
  }, [organization, mode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Organization name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Organization name must be at least 2 characters long';
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    if (formData.mission && formData.mission.length > 500) {
      newErrors.mission = 'Mission statement cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let result: OrganizationProfile;
      
      if (mode === 'create') {
        result = await organizationService.createOrganization(formData);
      } else {
        result = await organizationService.updateMyOrganization(formData);
      }

      if (onSubmit) {
        onSubmit(result);
      }
    } catch (error) {
      // Error handling is done in the service
    } finally {
      setLoading(false);
    }
  };

  const organizationTypeOptions = organizationService.getOrganizationTypeOptions();

  return (
    <div className={`min-h-screen ${colorClasses.bg.gray100} py-8`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className={`${colorClasses.bg.white} rounded-2xl shadow-lg p-8`}>
          <div className="text-center mb-8">
            <h1 className={`text-3xl font-bold ${colorClasses.text.darkNavy} mb-2`}>
              {mode === 'create' ? 'Create Organization Profile' : 'Edit Organization Profile'}
            </h1>
            <p className={`${colorClasses.text.gray400}`}>
              {mode === 'create' 
                ? 'Set up your organization profile to start posting opportunities' 
                : 'Update your organization information'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                  Organization Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.name 
                      ? 'border-red-500 focus:ring-red-200' 
                      : `${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`
                  }`}
                  placeholder="Enter organization name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`}
                  placeholder="Enter registration number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                  Organization Type
                </label>
                <select
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`}
                >
                  {organizationTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`}
                  placeholder="Enter industry"
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                    errors.website 
                      ? 'border-red-500 focus:ring-red-200' 
                      : `${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`
                  }`}
                  placeholder="https://example.com"
                />
                {errors.website && (
                  <p className="text-red-500 text-sm mt-1">{errors.website}</p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`}
                placeholder="Enter full address"
              />
            </div>

            {/* Description & Mission */}
            <div>
              <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                Organization Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.description 
                    ? 'border-red-500 focus:ring-red-200' 
                    : `${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`
                }`}
                placeholder="Describe your organization, its values, and what you do..."
              />
              <div className="flex justify-between text-sm mt-1">
                {errors.description ? (
                  <p className="text-red-500">{errors.description}</p>
                ) : (
                  <p className={`${colorClasses.text.gray400}`}>
                    {formData.description?.length || 0}/1000 characters
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-medium ${colorClasses.text.darkNavy} mb-2`}>
                Mission Statement
              </label>
              <textarea
                name="mission"
                value={formData.mission}
                onChange={handleChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:outline-none ${
                  errors.mission 
                    ? 'border-red-500 focus:ring-red-200' 
                    : `${colorClasses.border.gray400} focus:ring-${colorClasses.border.gold} focus:border-${colorClasses.border.gold}`
                }`}
                placeholder="What is your organization's mission and purpose?"
              />
              <div className="flex justify-between text-sm mt-1">
                {errors.mission ? (
                  <p className="text-red-500">{errors.mission}</p>
                ) : (
                  <p className={`${colorClasses.text.gray400}`}>
                    {formData.mission?.length || 0}/500 characters
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  loading 
                    ? `${colorClasses.bg.gray400} cursor-not-allowed` 
                    : `${colorClasses.bg.goldenMustard} hover:${colorClasses.bg.gold} transform hover:scale-105`
                }`}
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                  </span>
                ) : (
                  mode === 'create' ? 'Create Organization' : 'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};