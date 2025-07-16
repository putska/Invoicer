// components/estimating/ElevationsView.tsx

import React from "react";
import { Edit, Plus, Building } from "lucide-react";
import { Bid, ElevationWithOpenings, OpeningWithDetails } from "../../types";
import ElevationSidePanel from "./ElevationSidePanel";
import ElevationViewer from "./ElevationViewer";
import SimpleGridViewer from "./SimpleGridViewer";
import VisualGridViewer from "./VisualGridViewer";
import InteractiveGridEditor from "./InteractiveGridEditor";
import ImprovedGridEditor from "./ImprovedGridEditor";

interface ElevationsViewProps {
  selectedBid: Bid;
  elevations: ElevationWithOpenings[];
  selectedElevation: ElevationWithOpenings | null;
  selectedOpening: OpeningWithDetails | null;
  onElevationSelect: (elevation: ElevationWithOpenings) => void;
  onOpeningSelect: (opening: OpeningWithDetails) => void;
  onEditElevation: (elevation: ElevationWithOpenings) => void;
  onEditOpening: (opening: OpeningWithDetails) => void;
  onDeleteOpening: (openingId: number) => void;
  onNewElevation: () => void;
  onNewOpening: () => void;
}

const ElevationsView: React.FC<ElevationsViewProps> = ({
  selectedBid,
  elevations,
  selectedElevation,
  selectedOpening,
  onElevationSelect,
  onOpeningSelect,
  onEditElevation,
  onEditOpening,
  onDeleteOpening,
  onNewElevation,
  onNewOpening,
}) => {
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
          Elevations for {selectedBid.name}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Bid #:</span>
            <p className="font-medium">{selectedBid.bidNumber}</p>
          </div>
          <div>
            <span className="text-gray-500">Stage:</span>
            <span
              className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStageColor(
                selectedBid.stage
              )}`}
            >
              {selectedBid.stage.replace("_", " ")}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Total:</span>
            <p className="font-medium">
              ${parseFloat(selectedBid.totalBidAmount).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Elevations:</span>
            <p className="font-medium">{elevations.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Elevations List */}
        <div className={selectedElevation ? "xl:col-span-1" : "xl:col-span-3"}>
          {elevations.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No elevations found
              </h3>
              <p className="text-gray-600 mb-4">
                Create an elevation for this bid to get started.
              </p>
              <button
                onClick={onNewElevation}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Create First Elevation
              </button>
            </div>
          ) : (
            <div
              className={
                selectedElevation
                  ? "space-y-3"
                  : "grid grid-cols-1 md:grid-cols-2 gap-6"
              }
            >
              {elevations.map((elevation) => (
                <div
                  key={elevation.id}
                  className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                    selectedElevation?.id === elevation.id
                      ? "border-blue-500 shadow-md"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => onElevationSelect(elevation)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {elevation.name}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditElevation(elevation);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit Elevation"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong>Type:</strong>{" "}
                        {elevation.elevationType.replace("_", " ")}
                      </p>
                      <p>
                        <strong>Dimensions:</strong> {elevation.totalWidth}' ×{" "}
                        {elevation.totalHeight}'
                      </p>
                      <p>
                        <strong>Openings:</strong>{" "}
                        {elevation.openings?.length || 0}
                      </p>
                    </div>

                    {elevation.openings?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Openings:
                        </h4>
                        <div className="space-y-1">
                          {(elevation.openings || []).map((opening) => (
                            <div
                              key={opening.id}
                              className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                                selectedOpening?.id === opening.id
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-50 hover:bg-gray-100"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpeningSelect(opening);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="flex justify-between">
                                    <span className="font-medium">
                                      {opening.name}
                                    </span>
                                    <span>
                                      {opening.width}" × {opening.height}"
                                    </span>
                                  </div>
                                  <div className="text-gray-500">
                                    {opening.openingType || "Standard"} • @
                                    {opening.startPosition}"
                                  </div>
                                </div>
                                <div className="flex space-x-1 ml-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onEditOpening(opening);
                                    }}
                                    className="p-1 text-gray-400 hover:text-blue-600"
                                    title="Edit Opening"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Elevation Viewer */}
        {selectedElevation && (
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ElevationViewer
                elevation={selectedElevation}
                onOpeningSelect={onOpeningSelect}
                selectedOpeningId={selectedOpening?.id}
                scale={35}
              />
            </div>
          </div>
        )}
        {selectedOpening && (
          <div className="mt-6 space-y-6">
            {/* Keep your existing SimpleGridViewer */}
            {/* Uncomment this line to use the Visual Grid Viewer */}
            {/* <SimpleGridViewer
              openingId={selectedOpening.id}
              openingName={selectedOpening.name}
            /> */}

            {/* Add the new Visual Grid Viewer */}
            {/* Uncomment this line to use the Visual Grid Viewer */}
            {/* <VisualGridViewer openingId={selectedOpening.id} /> */}

            {/* Add the new Interactive Grid Editor */}
            <ImprovedGridEditor openingId={selectedOpening.id} />
          </div>
        )}

        {/* Side Panel */}
        <ElevationSidePanel
          selectedOpening={selectedOpening}
          selectedElevation={selectedElevation}
          onEditElevation={onEditElevation}
          onEditOpening={onEditOpening}
          onDeleteOpening={onDeleteOpening}
          onNewElevation={onNewElevation}
          onNewOpening={onNewOpening}
        />
      </div>
    </div>
  );
};

export default ElevationsView;
