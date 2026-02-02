/* eslint-disable @typescript-eslint/no-explicit-any */
// components/freelancer/CertificationsForm.tsx
'use client';

import React, { useState } from 'react';
import { CertificationFormData, freelancerService } from '@/services/freelancerService';
import { colorClasses, getTheme, ThemeMode } from '@/utils/color';
import {
  XMarkIcon,
  CalendarIcon,
  LinkIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface CertificationsFormProps {
  certification?: any;
  onSave: (certification: any, profileCompletion: number) => void;
  onCancel: () => void;
  isEditing?: boolean;
  themeMode?: ThemeMode;
}

const CertificationsForm: React.FC<CertificationsFormProps> = ({
  certification,
  onSave,
  onCancel,
  isEditing = false,
  themeMode = 'light'
}) => {
  const [formData, setFormData] = useState<CertificationFormData>({
    name: certification?.name || '',
    issuer: certification?.issuer || '',
    issueDate: certification?.issueDate ? new Date(certification.issueDate).toISOString().split('T')[0] : '',
    expiryDate: certification?.expiryDate ? new Date(certification.expiryDate).toISOString().split('T')[0] : '',
    credentialId: certification?.credentialId || '',
    credentialUrl: certification?.credentialUrl || '',
    description: certification?.description || '',
    skills: certification?.skills || []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState('');

  const theme = getTheme(themeMode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let response;
      if (isEditing && certification?._id) {
        response = await freelancerService.updateCertification(certification._id, formData);
      } else {
        response = await freelancerService.addCertification(formData);
      }

      onSave(response.certification, response.profileCompletion);
    } catch (error) {
      console.error('Failed to save certification:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills?.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter(skill => skill !== skillToRemove) || []
    }));
  };

  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className={`fixed inset-0 bg-black/60 dark:bg-black/70 flex items-center justify-center p-2 sm:p-4 z-50 backdrop-blur-sm ${colorClasses.text.darkNavy}`}>
      <div className={`rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-y-auto ${colorClasses.bg.darkNavy} ${colorClasses.border.darkNavy} border`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 sm:p-6 border-b ${colorClasses.border.gray400}`}>
          <div className="flex items-center">
            <AcademicCapIcon className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 ${colorClasses.text.teal}`} />
            <h2 className={`text-lg sm:text-xl font-bold ${colorClasses.text.darkNavy}`}>
              {isEditing ? 'Edit Certification' : 'Add New Certification'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className={`p-1 sm:p-2 rounded-lg hover:${colorClasses.bg.gray100} transition-colors ${colorClasses.text.gray400} hover:${colorClasses.text.gray800}`}
            aria-label="Close form"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Certification Name */}
          <div>
            <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
              Certification Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., AWS Certified Solutions Architect"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
              style={{ backgroundColor: theme.bg.primary }}
            />
          </div>

          {/* Issuing Organization */}
          <div>
            <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
              Issuing Organization *
            </label>
            <input
              type="text"
              required
              value={formData.issuer}
              onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
              placeholder="e.g., Amazon Web Services"
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
              style={{ backgroundColor: theme.bg.primary }}
            />
          </div>

          {/* Issue & Expiry Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
                Issue Date *
              </label>
              <div className="relative">
                <CalendarIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${colorClasses.text.gray400}`} />
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
                  style={{ backgroundColor: theme.bg.primary }}
                />
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
                Expiry Date (Optional)
              </label>
              <div className="relative">
                <CalendarIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${colorClasses.text.gray400}`} />
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
                  style={{ backgroundColor: theme.bg.primary }}
                />
              </div>
            </div>
          </div>

          {/* Credential ID & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
                Credential ID (Optional)
              </label>
              <input
                type="text"
                value={formData.credentialId}
                onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
                placeholder="e.g., AWS-123456"
                className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
                style={{ backgroundColor: theme.bg.primary }}
              />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
                Credential URL (Optional)
              </label>
              <div className="relative">
                <LinkIcon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 ${colorClasses.text.gray400}`} />
                <input
                  type="url"
                  value={formData.credentialUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))}
                  placeholder="https://verify.certification.org/..."
                  className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
                  style={{ backgroundColor: theme.bg.primary }}
                />
              </div>
            </div>
          </div>

          {/* Skills Gained */}
          <div>
            <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
              Skills Gained (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleSkillKeyPress}
                placeholder="Add a skill gained from this certification"
                className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
                style={{ backgroundColor: theme.bg.primary }}
              />
              <button
                type="button"
                onClick={addSkill}
                className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:opacity-90 transition-all font-semibold ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}
              >
                Add
              </button>
            </div>

            {/* Skills List */}
            {formData.skills && formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <div
                    key={index}
                    className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg text-sm font-medium flex items-center group ${colorClasses.bg.teal} ${colorClasses.text.white}`}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className={`ml-2 ${colorClasses.text.white} hover:opacity-70 transition-opacity`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Describe what you learned, key achievements, or how this certification enhances your expertise..."
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all ${colorClasses.border.gray400} ${colorClasses.text.gray800}`}
              style={{ backgroundColor: theme.bg.primary }}
            />
          </div>

          {/* Form Actions */}
          <div className={`flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 sm:pt-6 border-t ${colorClasses.border.gray400}`}>
            <button
              type="button"
              onClick={onCancel}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:opacity-90 transition-all duration-200 font-semibold w-full sm:w-auto ${colorClasses.bg.gray800} ${colorClasses.text.white}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 w-full sm:w-auto ${colorClasses.text.white} bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {isEditing ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                isEditing ? 'Update Certification' : 'Add Certification'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CertificationsForm;