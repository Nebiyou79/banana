// src/pages/candidate/verification.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { FiShield, FiFileText, FiCheckCircle, FiUserCheck } from 'react-icons/fi';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const CandidateVerificationPage: React.FC = () => {
  const router = useRouter();

  return (
    <DashboardLayout requiredRole="candidate">
          <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiShield className="text-blue-600 text-3xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Candidate Verification
          </h1>
          <p className="text-gray-600">
            We are preparing a secure and simple verification process to validate your profile.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Verification Steps (Coming Soon)
          </h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Verify your email address</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Upload your identification documents</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Verify your phone number</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Complete profile verification</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </button>
            <button
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              disabled
            >
              Notify Me When Ready
            </button>
          </div>
        </div>
      </div>
    </div>
    </DashboardLayout>

  );
};

export default CandidateVerificationPage;
