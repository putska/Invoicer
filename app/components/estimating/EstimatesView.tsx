// components/estimating/EstimatesView.tsx

import React from "react";
import { Edit, FileText, Building, Plus } from "lucide-react";
import { Estimate } from "../../types";

interface EstimatesViewProps {
  estimates: Estimate[];
  onEstimateSelect: (estimate: Estimate) => void;
  onEditEstimate: (estimate: Estimate) => void;
  onNewEstimate: () => void;
}

const EstimatesView: React.FC<EstimatesViewProps> = ({
  estimates,
  onEstimateSelect,
  onEditEstimate,
  onNewEstimate,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "bid_submitted":
        return "bg-blue-100 text-blue-800";
      case "awarded":
        return "bg-purple-100 text-purple-800";
      case "lost":
        return "bg-red-100 text-red-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (estimates.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No estimates found
        </h3>
        <p className="text-gray-600 mb-4">
          Create your first estimate to get started.
        </p>
        <button
          onClick={onNewEstimate}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 inline mr-2" />
          Create First Estimate
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {estimates.map((estimate) => (
        <div
          key={estimate.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {estimate.name}
                </h3>
                <p className="text-sm text-gray-500">
                  {estimate.estimateNumber}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                    estimate.status
                  )}`}
                >
                  {estimate.status.replace("_", " ")}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEstimate(estimate);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  title="Edit Estimate"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Location:</strong> {estimate.location || "N/A"}
              </p>
              <p>
                <strong>Architect:</strong> {estimate.architect || "N/A"}
              </p>
              <p>
                <strong>Contractor:</strong> {estimate.contractor || "N/A"}
              </p>
              <p>
                <strong>Estimator:</strong>{" "}
                {estimate.assignedEstimator || "N/A"}
              </p>
              {estimate.estimatedValue && (
                <p>
                  <strong>Est. Value:</strong> $
                  {parseFloat(estimate.estimatedValue).toLocaleString()}
                </p>
              )}
              {estimate.bidDate && (
                <p>
                  <strong>Bid Date:</strong>{" "}
                  {new Date(estimate.bidDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => onEstimateSelect(estimate)}
                className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                <FileText className="w-4 h-4 inline mr-2" />
                View Bids
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EstimatesView;
