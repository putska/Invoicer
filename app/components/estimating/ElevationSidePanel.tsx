// components/estimating/ElevationSidePanel.tsx

import React from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { ElevationWithOpenings, OpeningWithDetails } from "../../types";

interface ElevationSidePanelProps {
  selectedOpening: OpeningWithDetails | null;
  selectedElevation: ElevationWithOpenings | null;
  onEditElevation: (elevation: ElevationWithOpenings) => void;
  onEditOpening: (opening: OpeningWithDetails) => void;
  onDeleteOpening: (openingId: number) => void;
  onNewElevation: () => void;
  onNewOpening: () => void;
}

const ElevationSidePanel: React.FC<ElevationSidePanelProps> = ({
  selectedOpening,
  selectedElevation,
  onEditElevation,
  onEditOpening,
  onDeleteOpening,
  onNewElevation,
  onNewOpening,
}) => {
  return (
    <div className="space-y-6">
      {/* Selected Opening Details */}
      {selectedOpening && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Opening Details</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => onEditOpening(selectedOpening)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                title="Edit Opening"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDeleteOpening(selectedOpening.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                title="Delete Opening"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Name:</strong> {selectedOpening.name}
            </p>
            <p>
              <strong>Type:</strong> {selectedOpening.openingType || "Standard"}
            </p>
            <p>
              <strong>Position:</strong> {selectedOpening.startPosition}" from
              left
            </p>
            <p>
              <strong>Size:</strong> {selectedOpening.width}" ×{" "}
              {selectedOpening.height}"
            </p>
            <p>
              <strong>Sill Height:</strong> {selectedOpening.sillHeight}"
            </p>
            <p>
              <strong>Area:</strong>{" "}
              {(
                parseFloat(selectedOpening.width) *
                parseFloat(selectedOpening.height)
              ).toFixed(1)}{" "}
              sq ft
            </p>
            {selectedOpening.hasTransom && selectedOpening.transomHeight && (
              <p>
                <strong>Transom:</strong> {selectedOpening.transomHeight}" high
              </p>
            )}
            <div className="pt-2 border-t border-gray-200">
              <p>
                <strong>Material Cost:</strong> $
                {parseFloat(selectedOpening.totalMaterialCost).toLocaleString()}
              </p>
              <p>
                <strong>Labor Cost:</strong> $
                {parseFloat(selectedOpening.totalLaborCost).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <button
            onClick={onNewElevation}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Add Elevation
          </button>
          {selectedElevation && (
            <button
              onClick={onNewOpening}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Opening
            </button>
          )}
        </div>
      </div>

      {/* Elevation Info */}
      {selectedElevation && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Elevation Info</h3>
            <button
              onClick={() => onEditElevation(selectedElevation)}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              title="Edit Elevation"
            >
              <Edit className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Name:</strong> {selectedElevation.name}
            </p>
            <p>
              <strong>Type:</strong>{" "}
              {selectedElevation.elevationType.replace("_", " ")}
            </p>
            <p>
              <strong>Width:</strong> {selectedElevation.totalWidth}'
            </p>
            <p>
              <strong>Height:</strong> {selectedElevation.totalHeight}'
            </p>
            <p>
              <strong>Floor:</strong> {selectedElevation.floorNumber}
            </p>
            <p>
              <strong>Openings:</strong>{" "}
              {selectedElevation.openings?.length || 0}
            </p>
            <p>
              <strong>Total Area:</strong>{" "}
              {(
                parseFloat(selectedElevation.totalWidth) *
                parseFloat(selectedElevation.totalHeight)
              ).toFixed(1)}{" "}
              sq ft
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElevationSidePanel;
