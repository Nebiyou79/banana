// pages/dashboard/freelancer/portfolio.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { PortfolioItem, PortfolioFormData, freelancerService } from '@/services/freelancerService';
import PortfolioList from '@/components/freelancer/PortfolioList';
import PortfolioForm from '@/components/freelancer/PortfolioForm';
import { colorClasses, getTheme } from '@/utils/color';
import { PlusIcon, PhotoIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';

const FreelancerPortfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for dark mode preference
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, []);

  const loadPortfolio = async () => {
    try {
      setIsLoading(true);
      const response = await freelancerService.getPortfolio();
      setPortfolioItems(response.items);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (data: PortfolioFormData) => {
    try {
      setIsSubmitting(true);
      await freelancerService.addPortfolioItem(data);
      await loadPortfolio();
      setShowForm(false);
    } catch (error) {
      console.error('Failed to add portfolio item:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = async (data: PortfolioFormData) => {
    if (!editingItem) return;
    
    try {
      setIsSubmitting(true);
      await freelancerService.updatePortfolioItem(editingItem._id, data);
      await loadPortfolio();
      setEditingItem(null);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to update portfolio item:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await freelancerService.deletePortfolioItem(id);
      await loadPortfolio();
    } catch (error) {
      console.error('Failed to delete portfolio item:', error);
    }
  };

  const handleEditClick = (item: PortfolioItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const theme = getTheme(isDarkMode ? 'dark' : 'light');

  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className={`flex items-center justify-center min-h-96 ${
          isDarkMode ? 'bg-gray-900' : 'bg-white'
        }`}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className={`mt-4 font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Loading your portfolio...</p>
          </div>
        </div>
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      <div className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className={`mb-6 sm:mb-8 rounded-2xl p-4 sm:p-6 border ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-amber-100'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center mb-2">
                  <h1 className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.darkNavy}`}>
                    My Portfolio
                  </h1>
                  <div className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center ${
                    isDarkMode 
                      ? 'bg-amber-900/30 text-amber-300' 
                      : 'bg-amber-50 text-amber-700'
                  }`}>
                    <CloudArrowUpIcon className="w-3 h-3 mr-1" />
                    Cloudinary
                  </div>
                </div>
                <p className={`text-sm sm:text-base ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Showcase your best work and attract potential clients with Cloudinary-powered media
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-semibold shadow-lg shadow-amber-500/25 text-sm sm:text-base whitespace-nowrap ${
                  portfolioItems.length === 0 ? 'w-full lg:w-auto' : ''
                }`}
              >
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Add New Project
              </button>
            </div>
          </div>

          {/* Portfolio Stats */}
          {portfolioItems.length > 0 && (
            <div className={`mb-6 sm:mb-8 rounded-2xl p-4 border ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-amber-100'
            }`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {portfolioItems.length}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Total Projects
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {portfolioItems.filter(item => item.featured).length}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Featured
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {portfolioItems.filter(item => item.mediaUrls?.length > 0).length}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    With Images
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl sm:text-3xl font-bold mb-1 ${
                    isDarkMode ? 'text-amber-400' : 'text-amber-600'
                  }`}>
                    {Math.max(...portfolioItems.map(item => item.mediaUrls?.length || 0))}
                  </div>
                  <div className={`text-xs sm:text-sm font-medium ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Max Images
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Content */}
          <PortfolioList
            items={portfolioItems}
            onEdit={handleEditClick}
            onDelete={handleDeleteItem}
            isOwnProfile={true}
            emptyMessage={
              <div className={`text-center py-8 sm:py-12 md:py-16 rounded-2xl border-2 border-dashed ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-amber-800/50' 
                  : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
              }`}>
                <div className={`w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 ${
                  isDarkMode ? 'text-amber-500' : 'text-amber-400'
                }`}>
                  <PhotoIcon className="w-full h-full opacity-60" />
                </div>
                <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 ${colorClasses.text.darkNavy}`}>
                  No Portfolio Items Yet
                </h3>
                <p className={`text-sm sm:text-base md:text-lg max-w-md mx-auto leading-relaxed mb-6 sm:mb-8 px-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Showcase your best work with Cloudinary-powered media to demonstrate your skills and attract potential clients.
                  Add your first project to start building your professional portfolio.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className={`px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-semibold text-sm sm:text-base md:text-lg shadow-lg shadow-amber-500/25 flex items-center justify-center mx-auto`}
                >
                  <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Create Your First Project
                </button>
                <p className={`mt-4 text-xs sm:text-sm ${colorClasses.text.gray600}`}>
                  <CloudArrowUpIcon className="w-3 h-3 inline mr-1" />
                  Powered by Cloudinary for fast, optimized uploads
                </p>
              </div>
            }
          />

          {/* Portfolio Form Modal */}
          {showForm && (
            <PortfolioForm
              item={editingItem}
              onSubmit={editingItem ? handleEditItem : handleAddItem}
              onCancel={handleFormClose}
              isLoading={isSubmitting}
            />
          )}
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default FreelancerPortfolio;