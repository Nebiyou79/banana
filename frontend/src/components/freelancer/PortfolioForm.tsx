/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PortfolioItem } from '@/services/portfolioService';
import { 
  XMarkIcon, 
  PhotoIcon, 
  CloudArrowUpIcon,
  LinkIcon,
  TagIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

interface PortfolioFormProps {
  item?: PortfolioItem | null;
  onSubmit: (data: PortfolioFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface PortfolioFormData {
  title: string;
  description: string;
  mediaUrl: string;
  projectUrl?: string;
  category?: string;
  technologies?: string[];
  budget?: string;
  duration?: string;
  client?: string;
  completionDate?: string;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ item, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState<PortfolioFormData>({
    title: item?.title || '',
    description: item?.description || '',
    mediaUrl: item?.mediaUrl || '',
    projectUrl: item?.projectUrl || '',
    category: item?.category || '',
    technologies: item?.technologies || [],
    budget: item?.budget || '',
    duration: item?.duration || '',
    client: item?.client || '',
    completionDate: item?.completionDate || ''
  });

  const [imageError, setImageError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [newTechnology, setNewTechnology] = useState('');

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        mediaUrl: item.mediaUrl || '',
        projectUrl: item.projectUrl || '',
        category: item.category || '',
        technologies: item.technologies || [],
        budget: item.budget || '',
        duration: item.duration || '',
        client: item.client || '',
        completionDate: item.completionDate || ''
      });
      setImageError(false);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof PortfolioFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setUploadedFile(file);
        handleInputChange('mediaUrl', URL.createObjectURL(file));
        setImageError(false);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        setUploadedFile(file);
        handleInputChange('mediaUrl', URL.createObjectURL(file));
        setImageError(false);
      }
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const addTechnology = () => {
    if (newTechnology.trim() && !formData.technologies?.includes(newTechnology.trim())) {
      handleInputChange('technologies', [...(formData.technologies || []), newTechnology.trim()]);
      setNewTechnology('');
    }
  };

  const removeTechnology = (tech: string) => {
    handleInputChange('technologies', formData.technologies?.filter(t => t !== tech) || []);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn overflow-y-auto py-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {item ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            </h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              disabled={isLoading}
            >
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Project Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="e.g., E-commerce Website Development"
                required
                disabled={isLoading}
              />
            </div>

            {/* Project Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Project Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Describe the project, your role, challenges faced, and the outcome..."
                required
                disabled={isLoading}
              />
            </div>

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="">Select category</option>
                  <option value="web-development">Web Development</option>
                  <option value="mobile-app">Mobile App</option>
                  <option value="ui-ux">UI/UX Design</option>
                  <option value="e-commerce">E-commerce</option>
                  <option value="api-development">API Development</option>
                  <option value="devops">DevOps</option>
                  <option value="consulting">Consulting</option>
                </select>
              </div>

              {/* Client */}
              <div>
                <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <input
                  type="text"
                  id="client"
                  value={formData.client}
                  onChange={(e) => handleInputChange('client', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Client name or company"
                  disabled={isLoading}
                />
              </div>

              {/* Budget */}
              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget
                </label>
                <div className="relative">
                  <CurrencyDollarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., $5,000 or $50/hour"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <div className="relative">
                  <ClockIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 3 months, 2 weeks"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Completion Date */}
              <div>
                <label htmlFor="completionDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Date
                </label>
                <div className="relative">
                  <CalendarIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    id="completionDate"
                    value={formData.completionDate}
                    onChange={(e) => handleInputChange('completionDate', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Project URL */}
              <div>
                <label htmlFor="projectUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Project URL
                </label>
                <div className="relative">
                  <LinkIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    id="projectUrl"
                    value={formData.projectUrl}
                    onChange={(e) => handleInputChange('projectUrl', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://live-project.com"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Technologies */}
            <div>
              <label htmlFor="technologies" className="block text-sm font-medium text-gray-700 mb-2">
                Technologies & Skills
              </label>
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={newTechnology}
                    onChange={(e) => setNewTechnology(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add technology (React, Node.js, etc.)"
                    disabled={isLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechnology();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addTechnology}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
                  disabled={isLoading || !newTechnology.trim()}
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.technologies?.map((tech, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm flex items-center">
                    {tech}
                    <button
                      type="button"
                      onClick={() => removeTechnology(tech)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      disabled={isLoading}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Project Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Image *
              </label>
              
              {/* Drag & Drop Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <CloudArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag & drop your image here, or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
              </div>

              {/* URL Input as fallback */}
              <div className="mt-4">
                <label htmlFor="mediaUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter image URL *
                </label>
                <input
                  type="url"
                  id="mediaUrl"
                  value={formData.mediaUrl}
                  onChange={(e) => {
                    handleInputChange('mediaUrl', e.target.value);
                    setImageError(false);
                    setUploadedFile(null);
                  }}
                  placeholder="https://example.com/project-screenshot.jpg"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {(formData.mediaUrl || uploadedFile) && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden border relative">
                  {formData.mediaUrl && !imageError ? (
                    <Image 
                      src={formData.mediaUrl} 
                      alt="Preview"
                      width={500}
                      height={500}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <PhotoIcon className="w-12 h-12 mb-2" />
                      <p className="text-sm">Unable to load image</p>
                      <p className="text-xs">Please check the URL or upload a new file</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !formData.title.trim() || !formData.description.trim() || !formData.mediaUrl.trim()}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {item ? 'Updating...' : 'Adding...'}
                </div>
              ) : (
                item ? 'Update Project' : 'Add Project'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioForm;