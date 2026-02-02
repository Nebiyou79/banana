// components/freelancer/CertificationsList.tsx
'use client';

import React, { useState } from 'react';
import { Certification, freelancerService } from '@/services/freelancerService';
import CertificationsForm from './CertificationsForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { colorClasses, ThemeMode } from '@/utils/color';
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
  themeMode?: ThemeMode;
}

const CertificationsList: React.FC<CertificationsListProps> = ({
  certifications,
  onCertificationsUpdate,
  themeMode = 'light'
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
      month: 'short',
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
    <div className={`rounded-xl sm:rounded-2xl shadow-sm border ${colorClasses.bg.white} ${colorClasses.border.gray400}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 border-b ${colorClasses.border.gray400}`}>
        <div className="flex items-center mb-3 sm:mb-0">
          <AcademicCapIcon className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 ${colorClasses.text.teal}`} />
          <div>
            <h3 className={`text-lg sm:text-xl font-bold ${colorClasses.text.darkNavy}`}>
              Certifications
            </h3>
            <p className={`text-xs sm:text-sm mt-1 ${colorClasses.text.gray600}`}>
              Showcase your professional certifications and qualifications
            </p>
          </div>
        </div>
        <button
          onClick={handleAddCertification}
          className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:shadow-md transition-all duration-200 font-semibold w-full sm:w-auto justify-center ${colorClasses.bg.teal} ${colorClasses.text.white}`}
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Add Certification
        </button>
      </div>

      {/* Certifications List */}
      <div className="p-3 sm:p-6">
        {certifications.length === 0 ? (
          <div className="text-center py-6 sm:py-12">
            <AcademicCapIcon className={`w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 ${colorClasses.text.gray400}`} />
            <h4 className={`text-base sm:text-lg font-semibold mb-1 sm:mb-2 ${colorClasses.text.darkNavy}`}>
              No Certifications Added
            </h4>
            <p className={`text-xs sm:text-sm ${colorClasses.text.gray600} mb-4 sm:mb-6`}>
              Add your professional certifications to enhance your profile credibility.
            </p>
            <button
              onClick={handleAddCertification}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:shadow-md transition-colors font-semibold ${colorClasses.bg.teal} ${colorClasses.text.white}`}
            >
              Add Your First Certification
            </button>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {certifications.map((certification) => {
              const expired = isExpired(certification.expiryDate);
              const expiringSoon = isExpiringSoon(certification.expiryDate);

              return (
                <div
                  key={certification._id}
                  className={`border rounded-lg sm:rounded-xl p-3 sm:p-6 transition-all duration-200 group hover:shadow-sm ${colorClasses.border.gray400}`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between">
                    <div className="flex-1 w-full">
                      {/* Certification Header */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3">
                        <div className="mb-2 sm:mb-0">
                          <h4 className={`text-base sm:text-lg font-bold mb-1 ${colorClasses.text.darkNavy}`}>
                            {certification.name}
                          </h4>
                          <p className={`text-sm font-medium ${colorClasses.text.gray600}`}>
                            {certification.issuer}
                          </p>
                        </div>

                        {/* Status Badges */}
                        {certification.expiryDate && (
                          <div className="mb-2 sm:mb-0">
                            <div className={`px-2.5 sm:px-3 py-1 rounded-full text-xs font-medium ${expired
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                : expiringSoon
                                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300'
                                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                              }`}>
                              {expired ? 'Expired' : expiringSoon ? 'Expiring Soon' : 'Active'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Certification Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                        <div className={`flex items-center text-xs sm:text-sm ${colorClasses.text.gray600}`}>
                          <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span>Issued: {formatDate(certification.issueDate)}</span>
                        </div>

                        {certification.expiryDate && (
                          <div className={`flex items-center text-xs sm:text-sm ${colorClasses.text.gray600}`}>
                            <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span>Expires: {formatDate(certification.expiryDate)}</span>
                          </div>
                        )}

                        {certification.credentialId && (
                          <div className={`flex items-center text-xs sm:text-sm ${colorClasses.text.gray600}`}>
                            <DocumentTextIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">ID: {certification.credentialId}</span>
                          </div>
                        )}

                        {certification.credentialUrl && (
                          <div className="flex items-center text-xs sm:text-sm">
                            <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <a
                              href={certification.credentialUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`${colorClasses.text.teal} hover:underline font-medium truncate`}
                            >
                              Verify Credential
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {certification.skills && certification.skills.length > 0 && (
                        <div className="mb-3 sm:mb-4">
                          <h5 className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
                            Skills Gained:
                          </h5>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {certification.skills.map((skill, index) => (
                              <span
                                key={index}
                                className={`px-2 py-1 sm:px-3 sm:py-1 rounded-lg text-xs sm:text-sm font-medium ${colorClasses.bg.blue} ${colorClasses.text.white}`}
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
                          <h5 className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${colorClasses.text.gray800}`}>
                            Description:
                          </h5>
                          <p className={`text-xs sm:text-sm leading-relaxed ${colorClasses.text.gray600} line-clamp-2`}>
                            {certification.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions - Desktop */}
                    <div className="hidden sm:flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
                      <button
                        onClick={() => handleEditCertification(certification)}
                        className={`p-2 rounded-lg transition-colors ${colorClasses.text.gray400} hover:${colorClasses.text.teal} hover:${colorClasses.bg.gray100}`}
                        title="Edit certification"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(certification._id)}
                        disabled={isDeleting === certification._id}
                        className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${colorClasses.text.gray400} hover:${colorClasses.text.orange} hover:${colorClasses.bg.gray100}`}
                        title="Delete certification"
                      >
                        {isDeleting === certification._id ? (
                          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Actions - Mobile */}
                    <div className="flex sm:hidden items-center justify-end space-x-2 mt-3 pt-3 border-t">
                      <button
                        onClick={() => handleEditCertification(certification)}
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}
                      >
                        <PencilIcon className="w-3 h-3 mr-1.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(certification._id)}
                        disabled={isDeleting === certification._id}
                        className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-xs font-medium disabled:opacity-50 ${colorClasses.bg.orange} ${colorClasses.text.white}`}
                      >
                        {isDeleting === certification._id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5"></div>
                            Deleting
                          </>
                        ) : (
                          <>
                            <TrashIcon className="w-3 h-3 mr-1.5" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
          themeMode={themeMode}
        />
      )}
    </div>
  );
};

export default CertificationsList;