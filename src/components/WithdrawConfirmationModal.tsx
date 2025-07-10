import React from 'react';
import { X, AlertTriangle, ArrowLeft } from 'lucide-react';

interface WithdrawConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWithdrawing: boolean;
  jobTitle: string;
  companyName: string;
  applicationStatus: string;
}

const WithdrawConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isWithdrawing,
  jobTitle,
  companyName,
  applicationStatus
}: WithdrawConfirmationModalProps) => {
  if (!isOpen) return null;

  const getWarningMessage = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'Your application is still being reviewed. Withdrawing will remove it from consideration.';
      case 'under_review':
        return 'Your application is currently under review by the hiring team. Withdrawing will stop the review process.';
      case 'interview_scheduled':
        return 'You have an interview scheduled for this position. Withdrawing will cancel the interview and remove your application.';
      default:
        return 'Withdrawing will remove your application from consideration.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Withdraw Application</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-1">{jobTitle}</h4>
            <p className="text-gray-600 text-sm">{companyName}</p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-700">
              Are you sure you want to withdraw your application for this position?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Warning:</strong> {getWarningMessage(applicationStatus)}
              </p>
            </div>

            <p className="text-gray-600 text-sm">
              Once withdrawn, you will not be able to restore this application. You would need to apply again if the position is still available.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            disabled={isWithdrawing}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isWithdrawing}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isWithdrawing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Withdrawing...</span>
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                <span>Withdraw Application</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawConfirmationModal;