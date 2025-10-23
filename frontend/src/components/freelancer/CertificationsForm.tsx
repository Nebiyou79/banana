/* eslint-disable @typescript-eslint/no-explicit-any */
// components/freelancer/CertificationsForm.tsx
'use client';

import React, { useState } from 'react';
import { CertificationFormData, freelancerService } from '@/services/freelancerService';
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
}

const CertificationsForm: React.FC<CertificationsFormProps> = ({
  certification,
  onSave,
  onCancel,
  isEditing = false
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AcademicCapIcon className="w-6 h-6 text-green-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? 'Edit Certification' : 'Add New Certification'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Certification Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Certification Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., AWS Certified Solutions Architect"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Issuing Organization */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Issuing Organization *
            </label>
            <input
              type="text"
              required
              value={formData.issuer}
              onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
              placeholder="e.g., Amazon Web Services"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Issue & Expiry Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Issue Date *
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Expiry Date (Optional)
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Credential ID & URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Credential ID (Optional)
              </label>
              <input
                type="text"
                value={formData.credentialId}
                onChange={(e) => setFormData(prev => ({ ...prev, credentialId: e.target.value }))}
                placeholder="e.g., AWS-123456"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Credential URL (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="url"
                  value={formData.credentialUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, credentialUrl: e.target.value }))}
                  placeholder="https://verify.certification.org/..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Skills Gained */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Skills Gained (Optional)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleSkillKeyPress}
                placeholder="Add a skill gained from this certification"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
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
                    className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium flex items-center group"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-green-500 hover:text-green-700 transition-colors"
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Describe what you learned, key achievements, or how this certification enhances your expertise..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-colors"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-all duration-200 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? (
                <div className="flex items-center">
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