import React from "react";

interface VerificationStatusProps {
  status: "Unverified" | "Partially Verified" | "Fully Verified";
  onTakeExam: () => void;
  onOfficeVerify: () => void;
}

const VerificationStatus: React.FC<VerificationStatusProps> = ({ status, onTakeExam, onOfficeVerify }) => {
  return (
    <div className="bg-white shadow p-6 rounded">
      <h2 className="text-lg font-bold mb-2">Verification Status</h2>
      <p className="mb-4">Current Status: <span className="font-semibold">{status}</span></p>
      {status === "Unverified" && (
        <button
          onClick={onTakeExam}
          className="bg-yellow-400 bg-yellow-700 text-white px-4 py-2 rounded mr-3"
        >
          Take Exam
        </button>
      )}
      {status === "Partially Verified" && (
        <button
          onClick={onOfficeVerify}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Confirm Office Verification
        </button>
      )}
    </div>
  );
};

export default VerificationStatus;
