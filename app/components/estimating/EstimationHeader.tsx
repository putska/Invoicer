// components/estimating/EstimationHeader.tsx

import React from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { Estimate, Bid } from "../../types";

interface EstimationHeaderProps {
  viewMode: "estimates" | "bids" | "elevations";
  selectedEstimate: Estimate | null;
  selectedBid: Bid | null;
  onBack: () => void;
  onNewEstimate: () => void;
  onNewBid: () => void;
  onNewElevation: () => void;
  onNewOpening: () => void;
  selectedElevation: any;
}

const EstimationHeader: React.FC<EstimationHeaderProps> = ({
  viewMode,
  selectedEstimate,
  selectedBid,
  selectedElevation,
  onBack,
  onNewEstimate,
  onNewBid,
  onNewElevation,
  onNewOpening,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Glazing Estimation System
          </h1>
          <p className="text-gray-600 mt-2">
            Manage estimates, bids, and elevations for glazing projects
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-4">
          {viewMode !== "estimates" && (
            <button
              onClick={onBack}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
          )}

          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 text-sm rounded-md ${
                viewMode === "estimates"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600"
              }`}
            >
              Estimates
            </span>
            {selectedEstimate && (
              <>
                <span className="text-gray-400">/</span>
                <span
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === "bids"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600"
                  }`}
                >
                  Bids
                </span>
              </>
            )}
            {selectedBid && (
              <>
                <span className="text-gray-400">/</span>
                <span
                  className={`px-3 py-1 text-sm rounded-md ${
                    viewMode === "elevations"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600"
                  }`}
                >
                  Elevations
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {viewMode === "estimates" && (
            <button
              onClick={onNewEstimate}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New Estimate
            </button>
          )}

          {viewMode === "bids" && selectedEstimate && (
            <button
              onClick={onNewBid}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              New Bid
            </button>
          )}

          {viewMode === "elevations" && selectedBid && (
            <>
              <button
                onClick={onNewElevation}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Elevation
              </button>
              {selectedElevation && (
                <button
                  onClick={onNewOpening}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  New Opening
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstimationHeader;
