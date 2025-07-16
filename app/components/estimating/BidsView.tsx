// components/estimating/BidsView.tsx

import React from "react";
import { Edit, Eye, FileText, Plus } from "lucide-react";
import { Estimate, Bid } from "../../types";

interface BidsViewProps {
  selectedEstimate: Estimate;
  bids: Bid[];
  onBidSelect: (bid: Bid) => void;
  onEditBid: (bid: Bid) => void;
  onNewBid: () => void;
}

const BidsView: React.FC<BidsViewProps> = ({
  selectedEstimate,
  bids,
  onBidSelect,
  onEditBid,
  onNewBid,
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

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "initial_budget":
        return "bg-gray-100 text-gray-800";
      case "hard_budget":
        return "bg-blue-100 text-blue-800";
      case "initial_pricing":
        return "bg-yellow-100 text-yellow-800";
      case "firm_estimate":
        return "bg-orange-100 text-orange-800";
      case "final_bid":
        return "bg-purple-100 text-purple-800";
      case "submitted":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Bids for {selectedEstimate.name}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Estimate #:</span>
            <p className="font-medium">{selectedEstimate.estimateNumber}</p>
          </div>
          <div>
            <span className="text-gray-500">Location:</span>
            <p className="font-medium">{selectedEstimate.location || "N/A"}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <span
              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                selectedEstimate.status
              )}`}
            >
              {selectedEstimate.status.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total Bids:</span>
            <p className="font-medium">{bids.length}</p>
          </div>
        </div>
      </div>

      {bids.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No bids found
          </h3>
          <p className="text-gray-600 mb-4">
            Create a bid for this estimate to get started.
          </p>
          <button
            onClick={onNewBid}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Create First Bid
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bids.map((bid) => (
            <div
              key={bid.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {bid.name}
                    </h3>
                    <p className="text-sm text-gray-500">{bid.bidNumber}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(
                        bid.stage
                      )}`}
                    >
                      {bid.stage.replace("_", " ")}
                    </span>
                    {bid.isActive && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                    <button
                      onClick={() => onEditBid(bid)}
                      className="p-1 text-gray-400 hover:text-blue-600"
                      title="Edit Bid"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Overhead:</span>
                    <span>
                      {parseFloat(bid.overheadPercentage).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit:</span>
                    <span>{parseFloat(bid.profitPercentage).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="text-lg font-semibold text-gray-900 mb-4">
                  Total: ${parseFloat(bid.totalBidAmount).toLocaleString()}
                </div>

                <button
                  onClick={() => onBidSelect(bid)}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  View Elevations
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BidsView;
