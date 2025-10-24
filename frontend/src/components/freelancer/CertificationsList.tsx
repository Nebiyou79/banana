// components/freelancer/CertificationsList.tsx
'use client';

import React, { useState } from 'react';
import { Certification, freelancerService } from '@/services/freelancerService';
import CertificationsForm from './CertificationsForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AcademicCapIcon,
  CalendarIcon,
  LinkIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface CertificationsListProps {
  certifications: Certification[];
  onCertificationsUpdate: (certifications: Certification[], profileCompletion: number) => void;
}

const CertificationsList: React.FC<CertificationsListProps> = ({
  certifications,
  onCertificationsUpdate
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certificationToDelete, setCertificationToDelete] = useState<string | null>(null);

  const handleAddCertification = () => {
    setEditingCertification(null);
    setShowForm(true);
  };

  const handleEditCertification = (certification: Certification) => {
    setEditingCertification(certification);
    setShowForm(true);
  };

  const handleDeleteClick = (certificationId: string) => {
    setCertificationToDelete(certificationId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!certificationToDelete) return;

    setIsDeleting(certificationToDelete);
    try {
      const response = await freelancerService.deleteCertification(certificationToDelete);
      const updatedCertifications = certifications.filter(cert => cert._id !== certificationToDelete);
      onCertificationsUpdate(updatedCertifications, response.profileCompletion);
      setShowDeleteModal(false);
      setCertificationToDelete(null);
    } catch (error) {
      console.error('Failed to delete certification:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCertificationToDelete(null);
  };

  const handleFormSave = (certification: Certification, profileCompletion: number) => {
    let updatedCertifications;
    if (editingCertification) {
      updatedCertifications = certifications.map(cert =>
        cert._id === certification._id ? certification : cert
      );
    } else {
      updatedCertifications = [...certifications, certification];
    }
    
    onCertificationsUpdate(updatedCertifications, profileCompletion);
    setShowForm(false);
    setEditingCertification(null);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCertification(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return new Date(expiryDate) <= thirtyDaysFromNow && new Date(expiryDate) >= new Date();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center">
          <AcademicCapIcon className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Certifications</h3>
            <p className="text-sm text-gray-500 mt-1">
              Showcase your professional certifications and qualifications
            </p>
          </div>
        </div>
        <button
          onClick={handleAddCertification}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-200 font-semibold"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add Certification
        </button>
      </div>

      {/* Certifications List */}
      <div className="p-6">
        {certifications.length === 0 ? (
          <div className="text-center py-12">
            <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Certifications Added</h4>
            <p className="text-gray-500 mb-6">
              Add your professional certifications to enhance your profile credibility.
            </p>
            <button
              onClick={handleAddCertification}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-semibold"
            >
              Add Your First Certification
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {certifications.map((certification) => (
              <div
                key={certification._id}
                className="border border-gray-200 rounded-xl p-6 hover:border-green-300 transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Certification Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                          {certification.name}
                        </h4>
                        <p className="text-gray-600 font-medium">{certification.issuer}</p>
                      </div>
                      
                      {/* Status Badges */}
                      <div className="flex items-center space-x-2">
                        {certification.expiryDate && (
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isExpired(certification.expiryDate)
                              ? 'bg-red-100 text-red-800'
                              : isExpiringSoon(certification.expiryDate)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {isExpired(certification.expiryDate)
                              ? 'Expired'
                              : isExpiringSoon(certification.expiryDate)
                              ? 'Expiring Soon'
                              : 'Active'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Certification Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Issued: {formatDate(certification.issueDate)}</span>
                      </div>
                      
                      {certification.expiryDate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Expires: {formatDate(certification.expiryDate)}</span>
                        </div>
                      )}
                      
                      {certification.credentialId && (
                        <div className="flex items-center text-sm text-gray-600">
                          <DocumentTextIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <span>ID: {certification.credentialId}</span>
                        </div>
                      )}
                      
                      {certification.credentialUrl && (
                        <div className="flex items-center text-sm">
                          <LinkIcon className="w-4 h-4 mr-2 text-gray-400" />
                          <a
                            href={certification.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 font-medium"
                          >
                            Verify Credential
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {certification.skills && certification.skills.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Skills Gained:</h5>
                        <div className="flex flex-wrap gap-2">
                          {certification.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {certification.description && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2">Description:</h5>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {certification.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCertification(certification)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Edit certification"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(certification._id)}
                      disabled={isDeleting === certification._id}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete certification"
                    >
                      {isDeleting === certification._id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Certification"
        message="Are you sure you want to delete this certification? This action cannot be undone."
        confirmText="Delete Certification"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting !== null}
      />

      {/* Certification Form Modal */}
      {showForm && (
        <CertificationsForm
          certification={editingCertification}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
          isEditing={!!editingCertification}
        />
      )}
    </div>
  );
};

export default CertificationsList;