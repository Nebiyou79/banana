// pages/dashboard/freelancer/portfolio.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import { PortfolioItem, PortfolioFormData, freelancerService } from '@/services/freelancerService';
import PortfolioList from '@/components/freelancer/PortfolioList';
import PortfolioForm from '@/components/freelancer/PortfolioForm';
import { colorClasses } from '@/utils/color';
import { PlusIcon, PhotoIcon } from '@heroicons/react/24/outline';

const FreelancerPortfolio = () => {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  if (isLoading) {
    return (
      <FreelancerLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      </FreelancerLayout>
    );
  }

  return (
    <FreelancerLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className={`text-2xl font-bold ${colorClasses.text.darkNavy}`}>
              My Portfolio
            </h1>
            <p className="text-gray-600 mt-1">
              Showcase your best work and attract potential clients
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 flex items-center px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-semibold shadow-lg shadow-amber-500/25"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Project
          </button>
        </div>

        {/* Portfolio Content */}
        <PortfolioList
          items={portfolioItems}
          onEdit={handleEditClick}
          onDelete={handleDeleteItem}
          isOwnProfile={true}
          emptyMessage={
            <div className="text-center py-16">
              <div className="w-32 h-32 mx-auto mb-6 text-amber-400">
                <PhotoIcon className="w-full h-full opacity-60" />
              </div>
              <h3 className={`text-2xl font-bold ${colorClasses.text.darkNavy} mb-4`}>
                No Portfolio Items Yet
              </h3>
              <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed mb-8">
                Showcase your best work to demonstrate your skills and attract potential clients. 
                Add your first project to start building your professional portfolio.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 font-semibold text-lg shadow-lg shadow-amber-500/25"
              >
                <PlusIcon className="w-5 h-5 mr-2 inline" />
                Create Your First Project
              </button>
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
    </FreelancerLayout>
  );
};

export default FreelancerPortfolio;