// components/estimating/BidForm.tsx

"use client";

import React, { useState } from "react";
import { CreateBidInput, UpdateBidInput, Bid } from "../../types";

interface BidFormProps {
  estimateId: number;
  bid?: Bid | null;
  onSubmit: (data: CreateBidInput | UpdateBidInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const BidForm: React.FC<BidFormProps> = ({
  estimateId,
  bid,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = !!bid;

  const [formData, setFormData] = useState<CreateBidInput>({
    estimateId,
    bidNumber: bid?.bidNumber || "",
    name: bid?.name || "",
    description: bid?.description || "",
    stage: bid?.stage || "initial_budget",
    parentBidId: bid?.parentBidId || undefined,
    preparedBy: bid?.preparedBy || "",
    overheadPercentage: bid?.overheadPercentage
      ? parseFloat(bid.overheadPercentage)
      : 10,
    profitPercentage: bid?.profitPercentage
      ? parseFloat(bid.profitPercentage)
      : 8,
    contingencyPercentage: bid?.contingencyPercentage
      ? parseFloat(bid.contingencyPercentage)
      : 5,
    proposedStartDate: bid?.proposedStartDate || undefined,
    proposedCompletionDate: bid?.proposedCompletionDate || undefined,
    deliveryWeeks: bid?.deliveryWeeks || undefined,
    alternateRequested: bid?.alternateRequested || false,
    alternateDescription: bid?.alternateDescription || "",
    valueEngineeringNotes: bid?.valueEngineeringNotes || "",
    exclusions: bid?.exclusions || "",
    assumptions: bid?.assumptions || "",
    notes: bid?.notes || "",
    internalNotes: bid?.internalNotes || "",
    sortOrder: bid?.sortOrder || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bidNumber.trim()) {
      newErrors.bidNumber = "Bid number is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Bid name is required";
    }

    if (
      formData.overheadPercentage &&
      (formData.overheadPercentage < 0 || formData.overheadPercentage > 100)
    ) {
      newErrors.overheadPercentage =
        "Overhead percentage must be between 0 and 100";
    }

    if (
      formData.profitPercentage &&
      (formData.profitPercentage < 0 || formData.profitPercentage > 100)
    ) {
      newErrors.profitPercentage =
        "Profit percentage must be between 0 and 100";
    }

    if (
      formData.contingencyPercentage &&
      (formData.contingencyPercentage < 0 ||
        formData.contingencyPercentage > 100)
    ) {
      newErrors.contingencyPercentage =
        "Contingency percentage must be between 0 and 100";
    }

    if (formData.deliveryWeeks && formData.deliveryWeeks < 0) {
      newErrors.deliveryWeeks = "Delivery weeks cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "date") {
      const dateValue = value ? new Date(value) : undefined;
      setFormData((prev) => ({ ...prev, [name]: dateValue }));
    } else if (
      [
        "overheadPercentage",
        "profitPercentage",
        "contingencyPercentage",
        "deliveryWeeks",
        "sortOrder",
      ].includes(name)
    ) {
      const numericValue = value === "" ? undefined : parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting bid:", error);
    }
  };

  // Format date for input fields
  const formatDateForInput = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6">
          {isEditing ? "Edit Bid" : "Create New Bid"}
        </h2>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bidNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bid Number *
              </label>
              <input
                type="text"
                id="bidNumber"
                name="bidNumber"
                value={formData.bidNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.bidNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., BID-001"
              />
              {errors.bidNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.bidNumber}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bid Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., Initial Budget, Final Bid"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Stage and Prepared By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="stage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bid Stage
              </label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="initial_budget">Initial Budget</option>
                <option value="hard_budget">Hard Budget</option>
                <option value="initial_pricing">Initial Pricing</option>
                <option value="firm_estimate">Firm Estimate</option>
                <option value="final_bid">Final Bid</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="preparedBy"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Prepared By
              </label>
              <input
                type="text"
                id="preparedBy"
                name="preparedBy"
                value={formData.preparedBy}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Estimator name"
              />
            </div>
          </div>

          {/* Percentages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="overheadPercentage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Overhead Percentage (%)
              </label>
              <input
                type="number"
                id="overheadPercentage"
                name="overheadPercentage"
                value={formData.overheadPercentage || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.overheadPercentage
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                step="0.1"
                min="0"
                max="100"
                placeholder="10.0"
              />
              {errors.overheadPercentage && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.overheadPercentage}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="profitPercentage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Profit Percentage (%)
              </label>
              <input
                type="number"
                id="profitPercentage"
                name="profitPercentage"
                value={formData.profitPercentage || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.profitPercentage ? "border-red-500" : "border-gray-300"
                }`}
                step="0.1"
                min="0"
                max="100"
                placeholder="8.0"
              />
              {errors.profitPercentage && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.profitPercentage}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="contingencyPercentage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contingency Percentage (%)
              </label>
              <input
                type="number"
                id="contingencyPercentage"
                name="contingencyPercentage"
                value={formData.contingencyPercentage || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.contingencyPercentage
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                step="0.1"
                min="0"
                max="100"
                placeholder="5.0"
              />
              {errors.contingencyPercentage && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contingencyPercentage}
                </p>
              )}
            </div>
          </div>

          {/* Project Dates and Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="proposedStartDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Proposed Start Date
              </label>
              <input
                type="date"
                id="proposedStartDate"
                name="proposedStartDate"
                value={formatDateForInput(formData.proposedStartDate)}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="proposedCompletionDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Proposed Completion Date
              </label>
              <input
                type="date"
                id="proposedCompletionDate"
                name="proposedCompletionDate"
                value={formatDateForInput(formData.proposedCompletionDate)}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="deliveryWeeks"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Delivery (Weeks)
              </label>
              <input
                type="number"
                id="deliveryWeeks"
                name="deliveryWeeks"
                value={formData.deliveryWeeks || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.deliveryWeeks ? "border-red-500" : "border-gray-300"
                }`}
                min="0"
                placeholder="0"
              />
              {errors.deliveryWeeks && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.deliveryWeeks}
                </p>
              )}
            </div>
          </div>

          {/* Alternate Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="alternateRequested"
                name="alternateRequested"
                checked={formData.alternateRequested}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="alternateRequested"
                className="ml-2 block text-sm text-gray-900"
              >
                Alternate Requested
              </label>
            </div>

            <div>
              <label
                htmlFor="sortOrder"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sort Order
              </label>
              <input
                type="number"
                id="sortOrder"
                name="sortOrder"
                value={formData.sortOrder || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bid description..."
            />
          </div>

          {/* Alternate Description (if alternate requested) */}
          {formData.alternateRequested && (
            <div>
              <label
                htmlFor="alternateDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Alternate Description
              </label>
              <textarea
                id="alternateDescription"
                name="alternateDescription"
                value={formData.alternateDescription}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the alternate option..."
              />
            </div>
          )}

          {/* Value Engineering and Technical Notes */}
          <div>
            <label
              htmlFor="valueEngineeringNotes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Value Engineering Notes
            </label>
            <textarea
              id="valueEngineeringNotes"
              name="valueEngineeringNotes"
              value={formData.valueEngineeringNotes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Value engineering suggestions..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="exclusions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Exclusions
              </label>
              <textarea
                id="exclusions"
                name="exclusions"
                value={formData.exclusions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Items excluded from this bid..."
              />
            </div>

            <div>
              <label
                htmlFor="assumptions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Assumptions
              </label>
              <textarea
                id="assumptions"
                name="assumptions"
                value={formData.assumptions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Assumptions made for this bid..."
              />
            </div>
          </div>

          {/* Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="notes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Public notes..."
              />
            </div>

            <div>
              <label
                htmlFor="internalNotes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Internal Notes
              </label>
              <textarea
                id="internalNotes"
                name="internalNotes"
                value={formData.internalNotes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Internal notes (not visible to client)..."
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Preview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Bid #:</span>
                <p>{formData.bidNumber || "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Name:</span>
                <p>{formData.name || "Untitled Bid"}</p>
              </div>
              <div>
                <span className="font-medium">Stage:</span>
                <p>{formData.stage?.replace("_", " ") || "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Prepared By:</span>
                <p>{formData.preparedBy || "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Overhead:</span>
                <p>{formData.overheadPercentage || 0}%</p>
              </div>
              <div>
                <span className="font-medium">Profit:</span>
                <p>{formData.profitPercentage || 0}%</p>
              </div>
              <div>
                <span className="font-medium">Contingency:</span>
                <p>{formData.contingencyPercentage || 0}%</p>
              </div>
              <div>
                <span className="font-medium">Delivery:</span>
                <p>{formData.deliveryWeeks || 0} weeks</p>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : isEditing ? (
                "Update Bid"
              ) : (
                "Create Bid"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BidForm;
