// components/verification/DocumentChecklist.tsx
import React from 'react';
import { colorClasses } from '@/utils/color';
import { DocumentRequirement } from '@/services/apointmentService'; // Fixed import path

interface DocumentChecklistProps {
    requirements: DocumentRequirement[];
    verificationType: string;
}

const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
    requirements,
    verificationType
}) => {
    const requiredCount = requirements.filter(doc => doc.required).length;
    const optionalCount = requirements.length - requiredCount;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                    Documents to Bring ({requiredCount} required, {optionalCount} optional)
                </h3>
                <div className="flex gap-2">
                    <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                        Required
                    </span>
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        Optional
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requirements.map((doc, index) => (
                    <div
                        key={doc.id}
                        className={`p-4 border rounded-lg ${doc.required
                            ? 'border-red-200 bg-red-50'
                            : 'border-blue-200 bg-blue-50'
                            }`}
                    >
                        <div className="flex items-start">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3 ${doc.required ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                {index + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="font-medium text-gray-900">{doc.title}</h4>
                                    {doc.required ? (
                                        <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded">
                                            Required
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                            Optional
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{doc.description}</p>

                                {doc.example && (
                                    <div className="text-xs text-gray-500 mb-1">
                                        <strong>Example:</strong> {doc.example}
                                    </div>
                                )}

                                {doc.notes && (
                                    <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                                        <strong>Note:</strong> {doc.notes}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">📋 Important Instructions:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Bring <strong>original documents</strong> or certified copies</li>
                    <li>• Photocopies should be clear and legible</li>
                    <li>• All documents must be current and valid</li>
                    <li>• Arrive 15 minutes before your appointment time</li>
                    <li>• Processing time: 3-5 business days after verification</li>
                    <li>• Contact us if you need to reschedule: verification@bananalink.com</li>
                </ul>
            </div>
        </div>
    );
};

export default DocumentChecklist;