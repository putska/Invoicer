"use client";
import { useState } from "react";
import { StartDateChangeConfirmation } from "../types"; // Adjust import path as needed

interface StartDateConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: (adjustLabor: boolean) => void;
  onCancel: () => void;
}

export default function StartDateConfirmationDialog({
  isOpen,
  onConfirm,
  onCancel,
}: StartDateConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Start Date Change Detected
        </h3>
        <p className="text-gray-700 mb-6">
          You've changed the project start date. Do you want to adjust all field
          labor records based on this new start date?
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(false)}
            className="px-4 py-2 text-gray-700 bg-yellow-200 rounded-md hover:bg-yellow-300 transition-colors"
          >
            No, Don't Adjust Labor
          </button>
          <button
            onClick={() => onConfirm(true)}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
          >
            Yes, Adjust Labor
          </button>
        </div>
      </div>
    </div>
  );
}
