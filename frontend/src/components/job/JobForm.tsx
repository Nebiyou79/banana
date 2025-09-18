/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { Job } from '@/services/jobService';

interface JobFormData {
  title: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  type: string;
  location: string;
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
    period?: string;
  };
  category: string;
  experienceLevel: string;
  status: string;
  applicationDeadline: string;
  remote: boolean;
}

interface JobFormProps {
  initialData?: Job;
  onSubmit: (data: any) => void;
  loading?: boolean;
  onCancel?: () => void;
}

const JobForm: React.FC<JobFormProps> = ({ initialData, onSubmit, loading, onCancel }) => {
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    requirements: [''],
    responsibilities: [''],
    skills: [''],
    type: 'full-time',
    location: '',
    salary: {
      min: 0,
      max: 0,
      currency: 'USD',
      period: 'yearly'
    },
    category: '',
    experienceLevel: 'mid',
    status: 'draft',
    applicationDeadline: '',
    remote: false
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description,
        requirements: initialData.requirements.length > 0 ? initialData.requirements : [''],
        responsibilities: initialData.responsibilities.length > 0 ? initialData.responsibilities : [''],
        skills: initialData.skills.length > 0 ? initialData.skills : [''],
        type: initialData.type,
        location: initialData.location,
        salary: initialData.salary || {
          min: 0,
          max: 0,
          currency: 'USD',
          period: 'yearly'
        },
        category: initialData.category || '',
        experienceLevel: initialData.experienceLevel,
        status: initialData.status,
        applicationDeadline: initialData.applicationDeadline ? new Date(initialData.applicationDeadline).toISOString().split('T')[0] : '',
        remote: initialData.remote
      });
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleArrayChange = (field: 'requirements' | 'responsibilities' | 'skills', index: number, value: string) => {
    setFormData(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return { ...prev, [field]: newArray };
    });
  };

  const addArrayItem = (field: 'requirements' | 'responsibilities' | 'skills') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayItem = (field: 'requirements' | 'responsibilities' | 'skills', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

const handleSalaryChange = (field: keyof NonNullable<JobFormData['salary']>, value: string) => {
  setFormData(prev => ({
    ...prev,
    salary: {
      ...prev.salary,
      [field]: field === 'min' || field === 'max' ? Number(value) || 0 : value
    }
  }));
};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      requirements: formData.requirements.filter(req => req.trim() !== ''),
      responsibilities: formData.responsibilities.filter(resp => resp.trim() !== ''),
      skills: formData.skills.filter(skill => skill.trim() !== ''),
      salary: formData.salary?.min && formData.salary?.max ? formData.salary : undefined
    };
    
    onSubmit(submitData);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {initialData ? 'Edit Job' : 'Create New Job'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder="e.g. Senior Frontend Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. New York, NY"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Type *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Experience Level *
            </label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="entry">Entry Level</option>
              <option value="mid">Mid Level</option>
              <option value="senior">Senior Level</option>
              <option value="lead">Lead</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. Software Development"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Deadline
            </label>
            <input
              type="date"
              name="applicationDeadline"
              value={formData.applicationDeadline}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="remote"
              checked={formData.remote}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Remote Work Available
            </label>
          </div>
        </div>

        {/* Salary Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Salary</label>
              <input
                type="number"
                value={formData.salary?.min || ''}
                onChange={(e) => handleSalaryChange('min', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Salary</label>
              <input
                type="number"
                value={formData.salary?.max || ''}
                onChange={(e) => handleSalaryChange('max', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={formData.salary?.currency || 'USD'}
                onChange={(e) => handleSalaryChange('currency', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={formData.salary?.period || 'yearly'}
                onChange={(e) => handleSalaryChange('period', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hourly">Hourly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the job responsibilities, requirements, and benefits..."
          />
        </div>

        {/* Array Fields */}
        {(['requirements', 'responsibilities', 'skills'] as const).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.charAt(0).toUpperCase() + field.slice(1)} *
            </label>
            <div className="space-y-2">
              {formData[field].map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleArrayChange(field, index, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={`Add ${field.slice(0, -1)}...`}
                  />
                  <button
                    type="button"
                    onClick={() => removeArrayItem(field, index)}
                    className="px-4 py-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(field)}
                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
              >
                + Add {field.slice(0, -1)}
              </button>
            </div>
          </div>
        ))}

        {/* Form Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Update Job' : 'Create Job'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default JobForm;