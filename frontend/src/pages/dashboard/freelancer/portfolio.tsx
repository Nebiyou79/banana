/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PortfolioFormData, PortfolioItem, portfolioService } from '@/services/portfolioService';
import { useAuth } from '@/contexts/AuthContext';
import { PlusIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import PortfolioList from '@/components/freelancer/PortfolioList';
import PortfolioForm from '@/components/freelancer/PortfolioForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const PortfolioPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch portfolio items
  const { 
    data: portfolioItems = [], 
    isLoading, 
    error: fetchError, 
    refetch 
  } = useQuery({
    queryKey: ['portfolio'],
    queryFn: portfolioService.getPortfolio,
    enabled: !!user,
  });

  // Add/Update mutation
  const portfolioMutation = useMutation({
    mutationFn: (data: { id?: string; data: PortfolioFormData }) => 
      data.id 
        ? portfolioService.updatePortfolioItem(data.id, data.data)
        : portfolioService.addPortfolioItem(data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setShowForm(false);
      setEditingItem(null);
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save portfolio item');
    }
  });

  // Update the handleAddItem function
  const handleAddItem = (data: PortfolioFormData) => {
    portfolioMutation.mutate({
      id: editingItem?._id,
      data
    });
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: portfolioService.deletePortfolioItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to delete portfolio item');
    }
  });

  const handleEditItem = (item: PortfolioItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDeleteItem = (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  useEffect(() => {
    if (fetchError) {
      setError((fetchError as Error).message || 'Failed to load portfolio');
    }
  }, [fetchError]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout requiredRole="freelancer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Portfolio</h1>
            <p className="text-gray-600">
              Showcase your best work to potential clients and employers
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center"
              title="Refresh portfolio"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center shadow-lg shadow-blue-500/25"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Add New Item
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex justify-between items-center">
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-800 hover:text-red-900 font-bold text-lg"
            >
              ×
            </button>
          </div>
        )}

        <PortfolioList
          items={portfolioItems}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          isOwnProfile={true}
          emptyMessage="You haven't added any portfolio items yet. Showcase your work to stand out!"
        />

        {showForm && (
          <PortfolioForm
            item={editingItem}
            onSubmit={handleAddItem}
            onCancel={handleCancelForm}
            isLoading={portfolioMutation.isPending}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default PortfolioPage;