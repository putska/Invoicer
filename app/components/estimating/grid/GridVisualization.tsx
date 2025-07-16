// components/estimating/grid/GridVisualization.tsx - Updated for segmented horizontals
"use client";

import React from "react";
import { Edit3 } from "lucide-react";

interface GridMullion {
  id: number;
  gridType: string;
  gridColumn?: number | null;
  gridRow?: number | null;
  gridSegment?: number | null; // New field for horizontal segments
  componentName: string;
  length: string;
  customPosition: number | null;
  startX?: number | null; // New field for segment start position
  endX?: number | null; // New field for segment end position
  isActive: boolean;
}

interface GridGlassPanel {
  id: number;
  gridColumn: number;
  gridRow: number;
  x: string;
  y: string;
  width: string;
  height: string;
  isTransom: boolean;
  isActive: boolean;
}

interface OpeningWithGrid {
  id: number;
  name: string;
  width: string;
  height: string;
  gridColumns: number;
  gridRows: number;
  mullionWidth: string;
  gridMullions?: GridMullion[];
  gridGlassPanels?: GridGlassPanel[];
}

interface GridVisualizationProps {
  gridData: OpeningWithGrid;
  visibleMullions: GridMullion[];
  activeGlassPanels: GridGlassPanel[];
  selectedMullion: GridMullion | null;
  hoveredMullion: number | null;
  showMullionLabels: boolean;
  showPanelLabels: boolean;
  scale: number;
  onMullionClick: (mullion: GridMullion, event: React.MouseEvent) => void;
  onMullionHover: (mullionId: number | null) => void;
}

export const GridVisualization: React.FC<GridVisualizationProps> = ({
  gridData,
  visibleMullions,
  activeGlassPanels,
  selectedMullion,
  hoveredMullion,
  showMullionLabels,
  showPanelLabels,
  scale,
  onMullionClick,
  onMullionHover,
}) => {
  const openingWidth = parseFloat(gridData.width);
  const openingHeight = parseFloat(gridData.height);
  const scaledWidth = openingWidth * scale;
  const scaledHeight = openingHeight * scale;
  const canvasWidth = scaledWidth + 100;
  const canvasHeight = scaledHeight + 100;
  const offsetX = 50;
  const offsetY = 50;

  const renderMullion = (mullion: GridMullion, index: number) => {
    const isSelected = selectedMullion?.id === mullion.id;
    const isHovered = hoveredMullion === mullion.id;
    const mullionWidthPixels = Math.max(
      2,
      (parseFloat(gridData.mullionWidth) * scale) / 12
    );

    let x1, y1, x2, y2;

    if (mullion.gridType === "vertical") {
      const position =
        mullion.customPosition !== null
          ? mullion.customPosition
          : (mullion.gridColumn || 0) * (openingWidth / gridData.gridColumns);

      const xPos = offsetX + position * scale;
      x1 = x2 = xPos;
      y1 = offsetY;
      y2 = offsetY + scaledHeight;
    } else if (mullion.gridType === "horizontal") {
      const position =
        mullion.customPosition !== null
          ? mullion.customPosition
          : (mullion.gridRow || 0) * (openingHeight / gridData.gridRows);

      const yPos = offsetY + scaledHeight - position * scale;

      // For horizontal mullions, use startX and endX for segmented positioning
      const startX =
        mullion.startX !== null && mullion.startX !== undefined
          ? mullion.startX
          : 0;
      const endX =
        mullion.endX !== null && mullion.endX !== undefined
          ? mullion.endX
          : openingWidth;

      x1 = offsetX + startX * scale;
      x2 = offsetX + endX * scale;
      y1 = y2 = yPos;
    } else {
      // Perimeter mullions
      switch (mullion.gridType) {
        case "sill":
          // Sill segments use startX and endX
          const sillStartX =
            mullion.startX !== null && mullion.startX !== undefined
              ? mullion.startX
              : 0;
          const sillEndX =
            mullion.endX !== null && mullion.endX !== undefined
              ? mullion.endX
              : openingWidth;
          x1 = offsetX + sillStartX * scale;
          x2 = offsetX + sillEndX * scale;
          y1 = y2 = offsetY + scaledHeight;
          break;
        case "head":
          // Head segments use startX and endX
          const headStartX =
            mullion.startX !== null && mullion.startX !== undefined
              ? mullion.startX
              : 0;
          const headEndX =
            mullion.endX !== null && mullion.endX !== undefined
              ? mullion.endX
              : openingWidth;
          x1 = offsetX + headStartX * scale;
          x2 = offsetX + headEndX * scale;
          y1 = y2 = offsetY;
          break;
        case "jamb_left":
          x1 = x2 = offsetX;
          y1 = offsetY;
          y2 = offsetY + scaledHeight;
          break;
        case "jamb_right":
          x1 = x2 = offsetX + scaledWidth;
          y1 = offsetY;
          y2 = offsetY + scaledHeight;
          break;
        default:
          return null;
      }
    }

    const strokeColor = isSelected
      ? "#dc2626"
      : isHovered
      ? "#2563eb"
      : "#374151";
    const strokeWidth = isSelected ? 4 : isHovered ? 3 : mullionWidthPixels;
    const opacity = mullion.isActive ? 1 : 0.4;

    // Fix hover flashing by using a larger invisible hit area
    const hitAreaPadding = 10;

    return (
      <g key={`mullion-${mullion.id}-${index}`} opacity={opacity}>
        {/* Invisible larger hit area to prevent hover flickering */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="transparent"
          strokeWidth={Math.max(16, strokeWidth + hitAreaPadding)}
          className="cursor-pointer"
          onMouseEnter={() => onMullionHover(mullion.id)}
          onMouseLeave={() => onMullionHover(null)}
          onClick={(e) => onMullionClick(mullion, e)}
        />

        {/* Visible mullion line */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={mullion.isActive ? "none" : "4,4"}
          className="pointer-events-none transition-colors"
        />

        {/* Edit indicator */}
        <circle
          cx={(x1 + x2) / 2}
          cy={(y1 + y2) / 2}
          r="8"
          fill={mullion.isActive ? "#3b82f6" : "#9ca3af"}
          fillOpacity="0.8"
          className="pointer-events-none"
        />
        <Edit3
          x={(x1 + x2) / 2 - 4}
          y={(y1 + y2) / 2 - 4}
          width="8"
          height="8"
          className="pointer-events-none fill-white"
        />

        {/* Label */}
        {showMullionLabels && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 15}
            textAnchor="middle"
            fontSize="8"
            fill="#374151"
            className="pointer-events-none select-none"
          >
            {mullion.componentName.substring(0, 6)}
            {mullion.gridSegment !== null && mullion.gridSegment !== undefined
              ? `-${mullion.gridSegment + 1}`
              : ""}
          </text>
        )}
      </g>
    );
  };

  const renderGlassPanel = (panel: GridGlassPanel, index: number) => {
    const x = offsetX + parseFloat(panel.x) * scale;
    const y =
      offsetY +
      scaledHeight -
      parseFloat(panel.y) * scale -
      parseFloat(panel.height) * scale;
    const width = parseFloat(panel.width) * scale;
    const height = parseFloat(panel.height) * scale;

    return (
      <g key={`glass-${panel.id}-${index}`}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={
            panel.isTransom
              ? "rgba(147, 197, 253, 0.3)"
              : "rgba(219, 234, 254, 0.4)"
          }
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="1"
        />

        <circle
          cx={x + width / 2}
          cy={y + height / 2}
          r="3"
          fill="rgba(59, 130, 246, 0.8)"
        />

        {showPanelLabels && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 15}
            textAnchor="middle"
            fontSize="8"
            fill="#374151"
            className="pointer-events-none select-none"
          >
            {panel.isTransom ? "T" : ""}
            {panel.gridRow + 1}-{panel.gridColumn + 1}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="bg-gray-50 rounded-lg border overflow-auto relative">
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="border border-gray-300"
      >
        {/* Opening outline */}
        <rect
          x={offsetX}
          y={offsetY}
          width={scaledWidth}
          height={scaledHeight}
          fill="white"
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Grid reference lines */}
        {Array.from({ length: gridData.gridColumns - 1 }, (_, i) => {
          const x = offsetX + ((i + 1) * scaledWidth) / gridData.gridColumns;
          return (
            <line
              key={`grid-v-${i}`}
              x1={x}
              y1={offsetY}
              x2={x}
              y2={offsetY + scaledHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          );
        })}

        {Array.from({ length: gridData.gridRows - 1 }, (_, i) => {
          const y = offsetY + ((i + 1) * scaledHeight) / gridData.gridRows;
          return (
            <line
              key={`grid-h-${i}`}
              x1={offsetX}
              y1={y}
              x2={offsetX + scaledWidth}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2,2"
              opacity="0.5"
            />
          );
        })}

        {/* Glass panels */}
        {activeGlassPanels.map((panel, index) =>
          renderGlassPanel(panel, index)
        )}

        {/* Mullions */}
        {visibleMullions.map((mullion, index) => renderMullion(mullion, index))}

        {/* Dimensions */}
        <text
          x={offsetX + scaledWidth / 2}
          y={offsetY - 10}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
        >
          {gridData.width}'
        </text>

        <text
          x={offsetX - 15}
          y={offsetY + scaledHeight / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#374151"
          transform={`rotate(-90, ${offsetX - 15}, ${
            offsetY + scaledHeight / 2
          })`}
        >
          {gridData.height}'
        </text>
      </svg>
    </div>
  );
};
