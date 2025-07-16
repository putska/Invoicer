// components/estimating/ErrorMessage.tsx

import React from "react";

interface ErrorMessageProps {
  error: string | null;
  onDismiss: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
        <div className="ml-auto">
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;
