// src/components/bids/BidComplianceChecklist.tsx
// FIX: Removed 'company_profile' and 'cpo_document' from STANDARD_DOCS.
// The Bid.js Mongoose schema's complianceChecklist.documentType enum only allows
// compliance-specific document types, NOT company_profile or cpo_document.
// Sending those values crashes with ValidationError: `company_profile` is not a valid enum value.

import { useState } from 'react';
import { colorClasses } from '@/utils/color';
import { Bid, BidDocumentType, ComplianceItem } from '@/services/bidService';
import { useUpdateComplianceChecklist } from '@/hooks/useBid';

interface BidComplianceChecklistProps {
  bid: Bid;
  tenderId: string;
  isOwner: boolean;
  isEditable?: boolean;
}

// FIX: Only include documentTypes that are valid enum values in the Bid.complianceChecklist schema.
// 'company_profile' and 'cpo_document' are NOT valid compliance checklist types.
const STANDARD_DOCS: { type: BidDocumentType; label: string; icon: string }[] = [
  { type: 'business_license',  label: 'Business License',              icon: '📋' },
  { type: 'tin_certificate',   label: 'TIN Certificate',               icon: '📋' },
  { type: 'vat_certificate',   label: 'VAT Certificate',               icon: '📋' },
  { type: 'tax_clearance',     label: 'Tax Clearance Certificate (TCC)', icon: '✅' },
  { type: 'trade_registration',label: 'Trade Registration',             icon: '📋' },
  { type: 'compliance',        label: 'General Compliance Document',    icon: '✅' },
  { type: 'performance_bond',  label: 'Performance Bond',              icon: '🏦' },
];

export const BidComplianceChecklist = ({
  bid,
  tenderId,
  isOwner,
  isEditable = false,
}: BidComplianceChecklistProps) => {
  const { mutate: updateChecklist, isPending } = useUpdateComplianceChecklist();

  const [items, setItems] = useState<ComplianceItem[]>(() =>
    STANDARD_DOCS.map((doc) => {
      const saved = bid.complianceChecklist?.find((c) => c.documentType === doc.type);
      return (
        saved ?? {
          documentType: doc.type,
          submitted: false,
          verifiedByOwner: false,
          notes: '',
        }
      );
    })
  );

  const canEdit = isOwner && isEditable;

  const toggleVerified = (index: number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, verifiedByOwner: !item.verifiedByOwner } : item
    );
    setItems(updated);
    updateChecklist({ tenderId, bidId: bid._id, complianceItems: updated });
  };

  const toggleSubmitted = (index: number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, submitted: !item.submitted } : item
    );
    setItems(updated);
  };

  const updateNote = (index: number, notes: string) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, notes } : item)));
  };

  const handleSave = () => {
    updateChecklist({ tenderId, bidId: bid._id, complianceItems: items });
  };

  const submittedCount = items.filter((i) => i.submitted).length;
  const verifiedCount  = items.filter((i) => i.verifiedByOwner).length;
  const allGood = submittedCount === items.length;

  return (
    <div className={`rounded-2xl border ${colorClasses.border.secondary} ${colorClasses.bg.primary} overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${colorClasses.border.secondary} ${colorClasses.bg.surface}`}>
        <div>
          <h3 className={`text-sm font-bold ${colorClasses.text.primary}`}>
            ✅ Compliance Document Checklist
          </h3>
          <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>
            {submittedCount}/{items.length} submitted
            {isOwner && ` · ${verifiedCount} verified`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Overall status chip */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            allGood
              ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]'
              : `${colorClasses.bg.amberLight} ${colorClasses.text.amber700}`
          }`}>
            {allGood ? '✅ Complete' : `${items.length - submittedCount} pending`}
          </span>
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#F1BB03] text-[#0A2540] hover:opacity-80 disabled:opacity-50 transition-all"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <ul className={`divide-y ${colorClasses.border.secondary}`}>
        {items.map((item, index) => {
          const doc = STANDARD_DOCS.find((d) => d.type === item.documentType);
          const label = doc?.label ?? item.documentType.replace(/_/g, ' ');
          const icon  = doc?.icon ?? '📄';

          return (
            <li key={item.documentType} className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors">
              <div className="flex items-start gap-3">
                {/* Submitted toggle */}
                {canEdit ? (
                  <button
                    onClick={() => toggleSubmitted(index)}
                    className={`mt-0.5 w-5 h-5 rounded shrink-0 flex items-center justify-center border-2 transition-all ${
                      item.submitted
                        ? 'border-[#10B981] bg-[#10B981] text-white'
                        : `border-gray-300 dark:border-gray-600 ${colorClasses.bg.surface}`
                    }`}
                  >
                    {item.submitted && <span className="text-xs font-bold">✓</span>}
                  </button>
                ) : (
                  <span className={`mt-0.5 shrink-0 text-base leading-none ${
                    item.submitted ? 'text-[#10B981]' : `${colorClasses.text.muted} opacity-40`
                  }`}>
                    {item.submitted ? '✓' : icon}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-medium ${
                      item.submitted ? colorClasses.text.primary : colorClasses.text.muted
                    }`}>
                      {label}
                    </p>
                    {item.verifiedByOwner && (
                      <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399]">
                        ✓ Verified
                      </span>
                    )}
                    {!item.submitted && (
                      <span className={`text-xs ${colorClasses.text.muted} opacity-60`}>
                        Not submitted
                      </span>
                    )}
                  </div>

                  {canEdit ? (
                    <input
                      type="text"
                      value={item.notes ?? ''}
                      onChange={(e) => updateNote(index, e.target.value)}
                      placeholder="Add notes…"
                      className={`mt-1.5 w-full text-xs rounded-lg border ${colorClasses.border.secondary} ${colorClasses.bg.surface} ${colorClasses.text.primary} px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#F1BB03]/40 transition-all`}
                    />
                  ) : (
                    item.notes && (
                      <p className={`text-xs ${colorClasses.text.muted} mt-0.5`}>{item.notes}</p>
                    )
                  )}
                </div>

                {/* Verify button (owner only) */}
                {canEdit && item.submitted && (
                  <button
                    onClick={() => toggleVerified(index)}
                    className={`shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all min-w-[64px] ${
                      item.verifiedByOwner
                        ? 'bg-[#D1FAE5] dark:bg-[#064E3B] text-[#047857] dark:text-[#34D399] hover:opacity-80'
                        : `${colorClasses.bg.surface} ${colorClasses.text.muted} border ${colorClasses.border.secondary} hover:border-[#2AA198] hover:text-[#2AA198]`
                    }`}
                  >
                    {item.verifiedByOwner ? 'Unverify' : 'Verify'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BidComplianceChecklist;