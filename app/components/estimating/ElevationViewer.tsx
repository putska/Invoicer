"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ElevationWithOpenings,
  OpeningWithDetails,
  Mullion,
  GlassPanel,
  Door,
} from "../../types";

interface ElevationViewerProps {
  elevation: ElevationWithOpenings;
  onOpeningSelect?: (opening: OpeningWithDetails) => void;
  selectedOpeningId?: number;
  scale?: number;
}

const ElevationViewer: React.FC<ElevationViewerProps> = ({
  elevation,
  onOpeningSelect,
  selectedOpeningId,
  scale = 50, // pixels per foot
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredOpeningId, setHoveredOpeningId] = useState<number | null>(null);

  // Convert string values to numbers for calculations
  const totalWidth = parseFloat(elevation.totalWidth);
  const totalHeight = parseFloat(elevation.totalHeight);
  const floorHeight = parseFloat(elevation.floorHeight);

  const canvasWidth = totalWidth * scale;
  const canvasHeight = (totalHeight + floorHeight) * scale;

  useEffect(() => {
    drawElevation();
  }, [elevation, selectedOpeningId, hoveredOpeningId]);

  const drawElevation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set up coordinate system (flip Y axis so 0,0 is bottom-left)
    ctx.save();
    ctx.translate(0, canvas.height);
    ctx.scale(1, -1);

    // Draw floor line
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorHeight * scale);
    ctx.lineTo(canvasWidth, floorHeight * scale);
    ctx.stroke();

    // Draw elevation outline
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, floorHeight * scale, canvasWidth, totalHeight * scale);

    // Draw openings
    elevation.openings.forEach((opening) => {
      drawOpening(ctx, opening);
    });

    // Draw special conditions
    elevation.specialConditions.forEach((condition) => {
      drawSpecialCondition(ctx, condition);
    });

    ctx.restore();

    // Draw labels (not flipped)
    drawLabels(ctx);
  };

  const drawOpening = (
    ctx: CanvasRenderingContext2D,
    opening: OpeningWithDetails
  ) => {
    const x = parseFloat(opening.startPosition) * scale;
    const y = (floorHeight + parseFloat(opening.sillHeight)) * scale;
    const width = parseFloat(opening.width) * scale;
    const height = parseFloat(opening.height) * scale;

    const isSelected = selectedOpeningId === opening.id;
    const isHovered = hoveredOpeningId === opening.id;

    // Opening background
    ctx.fillStyle = isSelected ? "#e3f2fd" : isHovered ? "#f5f5f5" : "#ffffff";
    ctx.fillRect(x, y, width, height);

    // Opening border
    ctx.strokeStyle = isSelected ? "#2196f3" : isHovered ? "#999" : "#333";
    ctx.lineWidth = isSelected ? 3 : 2;
    ctx.strokeRect(x, y, width, height);

    // Draw mullions
    opening.mullions.forEach((mullion) => {
      drawMullion(ctx, opening, mullion);
    });

    // Draw transom line if present
    if (opening.hasTransom && opening.transomHeight) {
      const transomY =
        y +
        (parseFloat(opening.height) - parseFloat(opening.transomHeight)) *
          scale;
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, transomY);
      ctx.lineTo(x + width, transomY);
      ctx.stroke();
    }

    // Draw doors
    opening.doors.forEach((door) => {
      drawDoor(ctx, opening, door);
    });

    // Draw glass panels (lightly)
    opening.glassPanels.forEach((panel) => {
      drawGlassPanel(ctx, opening, panel);
    });
  };

  const drawMullion = (
    ctx: CanvasRenderingContext2D,
    opening: OpeningWithDetails,
    mullion: Mullion
  ) => {
    const openingX = parseFloat(opening.startPosition) * scale;
    const openingY = (floorHeight + parseFloat(opening.sillHeight)) * scale;
    const openingWidth = parseFloat(opening.width) * scale;
    const openingHeight = parseFloat(opening.height) * scale;

    ctx.strokeStyle = mullion.mullionType === "structural" ? "#333" : "#666";
    ctx.lineWidth = mullion.mullionType === "structural" ? 3 : 2;

    if (mullion.type === "vertical") {
      const x = openingX + parseFloat(mullion.position) * scale;
      ctx.beginPath();
      ctx.moveTo(x, openingY);
      ctx.lineTo(x, openingY + openingHeight);
      ctx.stroke();
    } else {
      const y = openingY + parseFloat(mullion.position) * scale;
      ctx.beginPath();
      ctx.moveTo(openingX, y);
      ctx.lineTo(openingX + openingWidth, y);
      ctx.stroke();
    }
  };

  const drawGlassPanel = (
    ctx: CanvasRenderingContext2D,
    opening: OpeningWithDetails,
    panel: GlassPanel
  ) => {
    const openingX = parseFloat(opening.startPosition) * scale;
    const openingY = (floorHeight + parseFloat(opening.sillHeight)) * scale;

    const x = openingX + parseFloat(panel.x) * scale;
    const y = openingY + parseFloat(panel.y) * scale;
    const width = parseFloat(panel.width) * scale;
    const height = parseFloat(panel.height) * scale;

    // Glass fill
    ctx.fillStyle = panel.isTransom
      ? "rgba(173, 216, 230, 0.3)"
      : "rgba(135, 206, 235, 0.2)";
    ctx.fillRect(x, y, width, height);

    // Glass border
    ctx.strokeStyle = "rgba(100, 149, 237, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);
  };

  const drawDoor = (
    ctx: CanvasRenderingContext2D,
    opening: OpeningWithDetails,
    door: Door
  ) => {
    const openingX = parseFloat(opening.startPosition) * scale;
    const openingY = (floorHeight + parseFloat(opening.sillHeight)) * scale;

    const x = openingX + parseFloat(door.position) * scale;
    const y = openingY;
    const width = parseFloat(door.width) * scale;
    const height = parseFloat(door.height) * scale;

    // Door fill
    ctx.fillStyle = "rgba(139, 69, 19, 0.3)";
    ctx.fillRect(x, y, width, height);

    // Door border
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);

    // Door swing indicator
    if (door.doorType === "single") {
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (door.handingType === "right") {
        ctx.arc(x + width, y, width * 0.8, Math.PI, Math.PI * 1.5);
      } else {
        ctx.arc(x, y, width * 0.8, Math.PI * 1.5, Math.PI * 2);
      }
      ctx.stroke();
    }
  };

  const drawSpecialCondition = (
    ctx: CanvasRenderingContext2D,
    condition: any
  ) => {
    const x = parseFloat(condition.position) * scale;
    const y = floorHeight * scale;

    ctx.strokeStyle = "#ff9800";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + totalHeight * scale);
    ctx.stroke();

    // Add condition type indicator
    ctx.fillStyle = "#ff9800";
    ctx.font = "12px Arial";
    ctx.save();
    ctx.scale(1, -1);
    ctx.fillText(condition.conditionType.toUpperCase(), x + 5, -(y + 10));
    ctx.restore();
  };

  const drawLabels = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#333";
    ctx.font = "12px Arial";

    // Draw opening labels
    elevation.openings.forEach((opening) => {
      const x =
        (parseFloat(opening.startPosition) + parseFloat(opening.width) / 2) *
        scale;
      const y =
        (floorHeight +
          parseFloat(opening.sillHeight) +
          parseFloat(opening.height) / 2) *
        scale;

      ctx.save();
      ctx.translate(x, canvasHeight - y);
      ctx.textAlign = "center";
      ctx.fillText(opening.name, 0, 0);
      ctx.restore();
    });

    // Draw dimension labels
    ctx.fillStyle = "#666";
    ctx.font = "10px Arial";

    // Total width
    ctx.textAlign = "center";
    ctx.fillText(
      `${totalWidth.toFixed(1)}'`,
      canvasWidth / 2,
      canvasHeight - 10
    );

    // Total height
    ctx.save();
    ctx.translate(canvasWidth + 10, canvasHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText(`${totalHeight.toFixed(1)}'`, 0, 0);
    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onOpeningSelect) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = rect.bottom - event.clientY; // Flip Y coordinate

    // Check which opening was clicked
    const clickedOpening = elevation.openings.find((opening) => {
      const openingX = parseFloat(opening.startPosition) * scale;
      const openingY = (floorHeight + parseFloat(opening.sillHeight)) * scale;
      const openingWidth = parseFloat(opening.width) * scale;
      const openingHeight = parseFloat(opening.height) * scale;

      return (
        x >= openingX &&
        x <= openingX + openingWidth &&
        y >= openingY &&
        y <= openingY + openingHeight
      );
    });

    if (clickedOpening) {
      onOpeningSelect(clickedOpening);
    }
  };

  const handleCanvasMouseMove = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = rect.bottom - event.clientY; // Flip Y coordinate

    // Check which opening is being hovered
    const hoveredOpening = elevation.openings.find((opening) => {
      const openingX = parseFloat(opening.startPosition) * scale;
      const openingY = (floorHeight + parseFloat(opening.sillHeight)) * scale;
      const openingWidth = parseFloat(opening.width) * scale;
      const openingHeight = parseFloat(opening.height) * scale;

      return (
        x >= openingX &&
        x <= openingX + openingWidth &&
        y >= openingY &&
        y <= openingY + openingHeight
      );
    });

    setHoveredOpeningId(hoveredOpening ? hoveredOpening.id : null);
  };

  return (
    <div className="elevation-viewer">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{elevation.name}</h3>
        <p className="text-sm text-gray-600">
          {totalWidth}' × {totalHeight}' | {elevation.openings.length} openings
        </p>
      </div>

      <div className="border border-gray-300 rounded-lg overflow-auto bg-white">
        <canvas
          ref={canvasRef}
          width={canvasWidth + 50} // Extra space for labels
          height={canvasHeight + 30} // Extra space for labels
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={() => setHoveredOpeningId(null)}
          className="cursor-pointer"
          style={{
            maxWidth: "100%",
            height: "auto",
            border: "1px solid #e5e5e5",
          }}
        />
      </div>

      {selectedOpeningId && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900">Selected Opening</h4>
          {(() => {
            const selected = elevation.openings.find(
              (o) => o.id === selectedOpeningId
            );
            return selected ? (
              <div className="mt-2 text-sm">
                <p>
                  <strong>Name:</strong> {selected.name}
                </p>
                <p>
                  <strong>Type:</strong>{" "}
                  {selected.openingType.replace("_", " ")}
                </p>
                <p>
                  <strong>Dimensions:</strong>{" "}
                  {parseFloat(selected.width).toFixed(1)}' ×{" "}
                  {parseFloat(selected.height).toFixed(1)}'
                </p>
                <p>
                  <strong>Position:</strong>{" "}
                  {parseFloat(selected.startPosition).toFixed(1)}' from left
                </p>
                <p>
                  <strong>Sill Height:</strong>{" "}
                  {parseFloat(selected.sillHeight).toFixed(1)}'
                </p>
                {selected.hasTransom && selected.transomHeight && (
                  <p>
                    <strong>Transom Height:</strong>{" "}
                    {parseFloat(selected.transomHeight).toFixed(1)}'
                  </p>
                )}
                <p>
                  <strong>Glass Panels:</strong>{" "}
                  {selected.glassPanels?.length || 0}
                </p>
                <p>
                  <strong>Mullions:</strong> {selected.mullions?.length || 0}
                </p>
                <p>
                  <strong>Doors:</strong> {selected.doors?.length || 0}
                </p>
              </div>
            ) : null;
          })()}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>Click on openings to select them. Hover to highlight.</p>
        <p>Scale: {scale} pixels per foot</p>
      </div>
    </div>
  );
};

export default ElevationViewer;
