// /src/pages/freelancer/saved-tenders/index.tsx
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { TenderCard } from '@/components/tenders/TenderCard';
import { useAuth } from '@/contexts/AuthContext';
import { Tender } from '@/services/tenderService';

// Mock data for saved tenders - you'll need to implement actual API calls
const mockSavedTenders: Tender[] = [
  {
    _id: '1',
    title: 'Website Development Project',
    description: 'We need a modern website for our business with e-commerce functionality.',
    budget: 50000,
    deadline: '2024-03-15T00:00:00.000Z',
    category: 'IT',
    status: 'open',
    location: 'Remote',
    company: {
      _id: 'company1',
      name: 'Tech Solutions Inc.',
      logo: '',
      industry: 'Technology'
    },
    createdBy: {
      _id: 'user1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z'
  }
];

const SavedTendersPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [savedTenders, setSavedTenders] = useState<Tender[]>(mockSavedTenders);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Implement actual API call to fetch saved tenders
    setLoading(true);
    setTimeout(() => {
      setSavedTenders(mockSavedTenders);
      setLoading(false);
    }, 1000);
  }, []);

  const removeFromSaved = (tenderId: string) => {
    setSavedTenders(prev => prev.filter(t => t._id !== tenderId));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-600">Please login to view saved tenders</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Head>
          <title>Saved Tenders - {user.name}</title>
        </Head>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Saved Tenders</h1>
          <p className="text-gray-600">
            Your bookmarked tenders for easy access and quick application
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : savedTenders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-400 text-6xl mb-4">⭐</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No saved tenders</h3>
            <p className="text-gray-600 mb-4">
              You haven`t saved any tenders yet. Browse tenders and click the save icon to add them here.
            </p>
            <button
              onClick={() => router.push('/tenders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse Tenders
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTenders.map((tender) => (
              <div key={tender._id} className="relative">
                <TenderCard tender={tender} />
                <button
                  onClick={() => removeFromSaved(tender._id)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-red-50 text-red-600"
                  title="Remove from saved"
                >
                  ❌
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedTendersPage;