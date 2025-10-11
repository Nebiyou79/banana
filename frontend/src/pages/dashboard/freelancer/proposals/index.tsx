// /src/pages/freelancer/proposals/index.tsx
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ProposalCard } from '@/components/tenders/ProposalCard';
import { useProposals } from '@/hooks/useProposals';
import { useAuth } from '@/contexts/AuthContext';

const FreelancerProposalsPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { proposals, loading, error, fetchUserProposals } = useProposals();
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchUserProposals();
  }, [fetchUserProposals]);

  const filteredProposals = statusFilter === 'all' 
    ? proposals 
    : proposals.filter(p => p.status === statusFilter);

  if (!user || user.role !== 'freelancer') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-red-600">Access denied. Freelancer account required.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Head>
          <title>My Proposals - Freelancer Dashboard</title>
        </Head>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">My Proposals</h1>
          <p className="text-gray-600">
            Track the status of your submitted proposals and manage your applications
          </p>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4">
            {['all', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? 'No proposals found' : `No ${statusFilter} proposals`}
            </h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'all' 
                ? "You haven't submitted any proposals yet."
                : `You don't have any ${statusFilter} proposals.`
              }
            </p>
            <button
              onClick={() => router.push('/tenders')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Browse Tenders
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal._id}
                proposal={proposal}
                showActions={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FreelancerProposalsPage;