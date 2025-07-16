// components/estimating/EstimateForm.tsx

"use client";

import React, { useState } from "react";
import {
  CreateEstimateInput,
  UpdateEstimateInput,
  Estimate,
} from "../../types";

interface EstimateFormProps {
  estimate?: Estimate | null;
  onSubmit: (data: CreateEstimateInput | UpdateEstimateInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const EstimateForm: React.FC<EstimateFormProps> = ({
  estimate,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = !!estimate;

  const [formData, setFormData] = useState<CreateEstimateInput>({
    estimateNumber: estimate?.estimateNumber || "",
    name: estimate?.name || "",
    description: estimate?.description || "",
    buildingType: estimate?.buildingType || "",
    location: estimate?.location || "",
    architect: estimate?.architect || "",
    contractor: estimate?.contractor || "",
    owner: estimate?.owner || "",
    bidDate: estimate?.bidDate || undefined,
    projectStartDate: estimate?.projectStartDate || undefined,
    projectEndDate: estimate?.projectEndDate || undefined,
    totalSquareFootage: estimate?.totalSquareFootage
      ? parseFloat(estimate.totalSquareFootage)
      : undefined,
    storiesBelowGrade: estimate?.storiesBelowGrade || 0,
    storiesAboveGrade: estimate?.storiesAboveGrade || 1,
    estimatedValue: estimate?.estimatedValue
      ? parseFloat(estimate.estimatedValue)
      : undefined,
    confidenceLevel: estimate?.confidenceLevel || undefined,
    competitionLevel: estimate?.competitionLevel || undefined,
    relationshipStatus: estimate?.relationshipStatus || "",
    primaryContact: estimate?.primaryContact || "",
    contactEmail: estimate?.contactEmail || "",
    contactPhone: estimate?.contactPhone || "",
    assignedEstimator: estimate?.assignedEstimator || "",
    salesPerson: estimate?.salesPerson || "",
    notes: estimate?.notes || "",
    internalNotes: estimate?.internalNotes || "",
    sortOrder: estimate?.sortOrder || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.estimateNumber.trim()) {
      newErrors.estimateNumber = "Estimate number is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Estimate name is required";
    }

    if (formData.contactEmail && !formData.contactEmail.includes("@")) {
      newErrors.contactEmail = "Valid email address is required";
    }

    if (formData.totalSquareFootage && formData.totalSquareFootage < 0) {
      newErrors.totalSquareFootage = "Square footage cannot be negative";
    }

    if (formData.storiesBelowGrade && formData.storiesBelowGrade < 0) {
      newErrors.storiesBelowGrade = "Stories below grade cannot be negative";
    }

    if (formData.storiesAboveGrade && formData.storiesAboveGrade < 1) {
      newErrors.storiesAboveGrade = "Stories above grade must be at least 1";
    }

    if (formData.estimatedValue && formData.estimatedValue < 0) {
      newErrors.estimatedValue = "Estimated value cannot be negative";
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

    if (type === "date") {
      const dateValue = value ? new Date(value) : undefined;
      setFormData((prev) => ({ ...prev, [name]: dateValue }));
    } else if (
      [
        "totalSquareFootage",
        "storiesBelowGrade",
        "storiesAboveGrade",
        "estimatedValue",
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
      console.error("Error submitting estimate:", error);
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
          {isEditing ? "Edit Estimate" : "Create New Estimate"}
        </h2>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="estimateNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Estimate Number *
              </label>
              <input
                type="text"
                id="estimateNumber"
                name="estimateNumber"
                value={formData.estimateNumber}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.estimateNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., EST-2024-001"
              />
              {errors.estimateNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.estimateNumber}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Name *
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
                placeholder="e.g., Downtown Office Building"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="buildingType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Building Type
              </label>
              <input
                type="text"
                id="buildingType"
                name="buildingType"
                value={formData.buildingType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Office, Retail, Healthcare"
              />
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 123 Main St, Downtown"
              />
            </div>
          </div>

          {/* Project Team */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="architect"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Architect
              </label>
              <input
                type="text"
                id="architect"
                name="architect"
                value={formData.architect}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Smith & Associates"
              />
            </div>

            <div>
              <label
                htmlFor="contractor"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contractor
              </label>
              <input
                type="text"
                id="contractor"
                name="contractor"
                value={formData.contractor}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., ABC Construction"
              />
            </div>

            <div>
              <label
                htmlFor="owner"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Owner
              </label>
              <input
                type="text"
                id="owner"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., XYZ Development"
              />
            </div>
          </div>

          {/* Project Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="bidDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bid Date
              </label>
              <input
                type="date"
                id="bidDate"
                name="bidDate"
                value={formatDateForInput(formData.bidDate)}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="projectStartDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project Start Date
              </label>
              <input
                type="date"
                id="projectStartDate"
                name="projectStartDate"
                value={formatDateForInput(formData.projectStartDate)}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="projectEndDate"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Project End Date
              </label>
              <input
                type="date"
                id="projectEndDate"
                name="projectEndDate"
                value={formatDateForInput(formData.projectEndDate)}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Building Details */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="totalSquareFootage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Total Square Footage
              </label>
              <input
                type="number"
                id="totalSquareFootage"
                name="totalSquareFootage"
                value={formData.totalSquareFootage || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.totalSquareFootage
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                min="0"
                placeholder="0"
              />
              {errors.totalSquareFootage && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.totalSquareFootage}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="storiesBelowGrade"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Stories Below Grade
              </label>
              <input
                type="number"
                id="storiesBelowGrade"
                name="storiesBelowGrade"
                value={formData.storiesBelowGrade || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.storiesBelowGrade
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                min="0"
                placeholder="0"
              />
              {errors.storiesBelowGrade && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.storiesBelowGrade}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="storiesAboveGrade"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Stories Above Grade
              </label>
              <input
                type="number"
                id="storiesAboveGrade"
                name="storiesAboveGrade"
                value={formData.storiesAboveGrade || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.storiesAboveGrade
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                min="1"
                placeholder="1"
              />
              {errors.storiesAboveGrade && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.storiesAboveGrade}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="estimatedValue"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Estimated Value ($)
              </label>
              <input
                type="number"
                id="estimatedValue"
                name="estimatedValue"
                value={formData.estimatedValue || ""}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.estimatedValue ? "border-red-500" : "border-gray-300"
                }`}
                min="0"
                placeholder="0"
              />
              {errors.estimatedValue && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.estimatedValue}
                </p>
              )}
            </div>
          </div>

          {/* Assessment Levels */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="confidenceLevel"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confidence Level
              </label>
              <select
                id="confidenceLevel"
                name="confidenceLevel"
                value={formData.confidenceLevel || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select confidence level</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="competitionLevel"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Competition Level
              </label>
              <select
                id="competitionLevel"
                name="competitionLevel"
                value={formData.competitionLevel || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select competition level</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="primaryContact"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Primary Contact
              </label>
              <input
                type="text"
                id="primaryContact"
                name="primaryContact"
                value={formData.primaryContact}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contact name"
              />
            </div>

            <div>
              <label
                htmlFor="relationshipStatus"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Relationship Status
              </label>
              <input
                type="text"
                id="relationshipStatus"
                name="relationshipStatus"
                value={formData.relationshipStatus}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., New client, Repeat customer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contact Email
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.contactEmail ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="contact@example.com"
              />
              {errors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.contactEmail}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="contactPhone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Contact Phone
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          {/* Team Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="assignedEstimator"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Assigned Estimator
              </label>
              <input
                type="text"
                id="assignedEstimator"
                name="assignedEstimator"
                value={formData.assignedEstimator}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Estimator name"
              />
            </div>

            <div>
              <label
                htmlFor="salesPerson"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sales Person
              </label>
              <input
                type="text"
                id="salesPerson"
                name="salesPerson"
                value={formData.salesPerson}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sales person name"
              />
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

          {/* Notes */}
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
              placeholder="Project description..."
            />
          </div>

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
                <span className="font-medium">Estimate #:</span>
                <p>{formData.estimateNumber || "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Project:</span>
                <p>{formData.name || "Untitled Project"}</p>
              </div>
              <div>
                <span className="font-medium">Building Type:</span>
                <p>{formData.buildingType || "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Location:</span>
                <p>{formData.location || "Not specified"}</p>
              </div>
              <div>
                <span className="font-medium">Square Footage:</span>
                <p>
                  {formData.totalSquareFootage?.toLocaleString() ||
                    "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Stories:</span>
                <p>
                  {formData.storiesBelowGrade}B + {formData.storiesAboveGrade}AG
                </p>
              </div>
              <div>
                <span className="font-medium">Estimated Value:</span>
                <p>
                  $
                  {formData.estimatedValue?.toLocaleString() || "Not specified"}
                </p>
              </div>
              <div>
                <span className="font-medium">Confidence:</span>
                <p>{formData.confidenceLevel || "Not specified"}</p>
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
                "Update Estimate"
              ) : (
                "Create Estimate"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimateForm;
