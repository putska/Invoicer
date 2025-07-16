// utils/gridCalculator.ts - Updated utility for calculating grid layouts with segmented horizontals

import {
  GridDimensions,
  CalculatedGridElement,
  CreateGridMullionInput,
  CreateGridGlassPanelInput,
} from "../types";

export class GridCalculator {
  /**
   * Calculate all grid elements for an opening
   */
  static calculateGrid(dimensions: GridDimensions): CalculatedGridElement {
    const {
      openingWidth,
      openingHeight,
      columns,
      rows,
      mullionWidth,
      hasTransom,
      transomHeight = 0,
    } = dimensions;

    const mullionWidthFeet = mullionWidth / 12; // Convert inches to feet
    const effectiveHeight =
      hasTransom && transomHeight > 0
        ? openingHeight - transomHeight
        : openingHeight;

    // Calculate column and row spacing
    const columnWidth = openingWidth / columns;
    const rowHeight = effectiveHeight / rows;

    const result: CalculatedGridElement = {
      mullions: {
        vertical: [],
        horizontal: [],
        perimeter: [],
      },
      glassPanels: [],
    };

    // Vertical mullions (between columns) - these run continuous from top to bottom
    for (let i = 1; i < columns; i++) {
      result.mullions.vertical.push({
        column: i,
        position: i * columnWidth,
        length: effectiveHeight,
      });
    }

    // Calculate vertical positions for horizontal mullions
    const verticalPositions = [0]; // Start with left edge
    for (let i = 1; i < columns; i++) {
      verticalPositions.push(i * columnWidth);
    }
    verticalPositions.push(openingWidth); // End with right edge

    // Horizontal mullions (between rows) - now segmented between verticals
    for (let i = 1; i < rows; i++) {
      const yPosition = i * rowHeight;

      // Create a segment between each pair of vertical positions
      for (let j = 0; j < verticalPositions.length - 1; j++) {
        const startX = verticalPositions[j];
        const endX = verticalPositions[j + 1];
        const segmentLength = endX - startX;

        result.mullions.horizontal.push({
          row: i,
          position: yPosition,
          length: segmentLength,
          startX: startX,
          endX: endX,
          segment: j, // Track which segment this is
        });
      }
    }

    // Perimeter mullions - sill and head are now segmented, jambs remain continuous

    // Sill segments (bottom horizontal members between verticals)
    for (let j = 0; j < verticalPositions.length - 1; j++) {
      const startX = verticalPositions[j];
      const endX = verticalPositions[j + 1];
      const segmentLength = endX - startX;

      result.mullions.perimeter.push({
        type: "sill",
        length: segmentLength,
        startX: startX,
        endX: endX,
        segment: j,
      });
    }

    // Head segments (top horizontal members between verticals)
    for (let j = 0; j < verticalPositions.length - 1; j++) {
      const startX = verticalPositions[j];
      const endX = verticalPositions[j + 1];
      const segmentLength = endX - startX;

      result.mullions.perimeter.push({
        type: "head",
        length: segmentLength,
        startX: startX,
        endX: endX,
        segment: j,
      });
    }

    // Jambs remain continuous
    result.mullions.perimeter.push(
      { type: "jamb_left", length: openingHeight },
      { type: "jamb_right", length: openingHeight }
    );

    // Glass panels remain the same
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col * columnWidth;
        const y = row * rowHeight;

        result.glassPanels.push({
          column: col,
          row: row,
          x: x,
          y: y,
          width: columnWidth,
          height: rowHeight,
          isTransom: false,
        });
      }
    }

    // Add transom panels if needed
    if (hasTransom && transomHeight > 0) {
      for (let col = 0; col < columns; col++) {
        const x = col * columnWidth;

        result.glassPanels.push({
          column: col,
          row: rows, // Transom is above the main grid
          x: x,
          y: effectiveHeight,
          width: columnWidth,
          height: transomHeight,
          isTransom: true,
        });
      }

      // Add transom horizontal mullion segments
      for (let j = 0; j < verticalPositions.length - 1; j++) {
        const startX = verticalPositions[j];
        const endX = verticalPositions[j + 1];
        const segmentLength = endX - startX;

        result.mullions.horizontal.push({
          row: rows,
          position: effectiveHeight,
          length: segmentLength,
          startX: startX,
          endX: endX,
          segment: j,
        });
      }
    }

    return result;
  }

  /**
   * Convert calculated grid to database input format
   */
  static gridToMullionInputs(
    openingId: number,
    calculatedGrid: CalculatedGridElement,
    componentNames: {
      sill: string;
      head: string;
      jambs: string;
      verticals: string;
      horizontals: string;
    }
  ): CreateGridMullionInput[] {
    const inputs: CreateGridMullionInput[] = [];

    // Vertical mullions (unchanged)
    calculatedGrid.mullions.vertical.forEach((mullion) => {
      inputs.push({
        openingId,
        gridType: "vertical",
        gridColumn: mullion.column,
        length: mullion.length,
        componentName: componentNames.verticals,
        defaultPosition: mullion.position,
        customPosition: mullion.position,
        isActive: true,
      });
    });

    // Horizontal mullions (now segmented)
    calculatedGrid.mullions.horizontal.forEach((mullion) => {
      inputs.push({
        openingId,
        gridType: "horizontal",
        gridRow: mullion.row,
        gridSegment: mullion.segment, // New field to track segment
        length: mullion.length,
        componentName: componentNames.horizontals,
        defaultPosition: mullion.position,
        customPosition: mullion.position,
        startX: mullion.startX, // New field for segment start
        endX: mullion.endX, // New field for segment end
        isActive: true,
      });
    });

    // Perimeter mullions (sill and head now segmented)
    calculatedGrid.mullions.perimeter.forEach((mullion) => {
      const componentName =
        mullion.type === "sill"
          ? componentNames.sill
          : mullion.type === "head"
          ? componentNames.head
          : componentNames.jambs;

      inputs.push({
        openingId,
        gridType: mullion.type,
        gridSegment: mullion.segment, // For sill/head segments
        length: mullion.length,
        componentName,
        defaultPosition: 0,
        customPosition: 0,
        startX: mullion.startX, // For sill/head segments
        endX: mullion.endX, // For sill/head segments
        isActive: true,
      });
    });

    return inputs;
  }

  /**
   * Convert calculated grid to glass panel inputs (unchanged)
   */
  static gridToGlassPanelInputs(
    openingId: number,
    calculatedGrid: CalculatedGridElement
  ): CreateGridGlassPanelInput[] {
    return calculatedGrid.glassPanels.map((panel) => ({
      openingId,
      gridColumn: panel.column,
      gridRow: panel.row,
      x: panel.x,
      y: panel.y,
      width: panel.width,
      height: panel.height,
      isTransom: panel.isTransom,
      glassType: panel.isTransom ? "Transom Glass" : "Standard Glass",
      isActive: true,
      unitCost: 0,
    }));
  }

  /**
   * Calculate total mullion length for cost estimation
   * Takes array of objects with length property (string or number)
   */
  static calculateTotalMullionLength(
    mullions: Array<{ isActive: boolean; length: string | number }>
  ): number {
    return mullions
      .filter((m) => m.isActive)
      .reduce((total, mullion) => {
        const length =
          typeof mullion.length === "string"
            ? parseFloat(mullion.length)
            : mullion.length;
        return total + (length || 0);
      }, 0);
  }

  /**
   * Calculate total glass area (unchanged)
   */
  static calculateTotalGlassArea(
    glassPanels: Array<{
      isActive: boolean;
      width: string | number;
      height: string | number;
    }>
  ): number {
    return glassPanels
      .filter((p) => p.isActive)
      .reduce((total, panel) => {
        const width =
          typeof panel.width === "string"
            ? parseFloat(panel.width)
            : panel.width;
        const height =
          typeof panel.height === "string"
            ? parseFloat(panel.height)
            : panel.height;
        return total + (width || 0) * (height || 0);
      }, 0);
  }

  /**
   * Validate grid dimensions (unchanged)
   */
  static validateGridDimensions(dimensions: GridDimensions): string[] {
    const errors: string[] = [];

    if (dimensions.columns < 1 || dimensions.columns > 20) {
      errors.push("Columns must be between 1 and 20");
    }

    if (dimensions.rows < 1 || dimensions.rows > 20) {
      errors.push("Rows must be between 1 and 20");
    }

    if (dimensions.openingWidth <= 0) {
      errors.push("Opening width must be greater than 0");
    }

    if (dimensions.openingHeight <= 0) {
      errors.push("Opening height must be greater than 0");
    }

    if (dimensions.mullionWidth <= 0 || dimensions.mullionWidth > 6) {
      errors.push("Mullion width must be between 0 and 6 inches");
    }

    if (
      dimensions.hasTransom &&
      (!dimensions.transomHeight || dimensions.transomHeight <= 0)
    ) {
      errors.push("Transom height is required when transom is enabled");
    }

    if (
      dimensions.hasTransom &&
      dimensions.transomHeight &&
      dimensions.transomHeight >= dimensions.openingHeight
    ) {
      errors.push(
        "Transom height cannot be greater than or equal to opening height"
      );
    }

    // Check if panels would be too small
    const minPanelSize = 0.5; // 6 inches minimum
    const columnWidth = dimensions.openingWidth / dimensions.columns;
    const rowHeight =
      (dimensions.openingHeight - (dimensions.transomHeight || 0)) /
      dimensions.rows;

    if (columnWidth < minPanelSize) {
      errors.push(
        `Too many columns: each panel would be only ${(
          columnWidth * 12
        ).toFixed(1)}" wide`
      );
    }

    if (rowHeight < minPanelSize) {
      errors.push(
        `Too many rows: each panel would be only ${(rowHeight * 12).toFixed(
          1
        )}" tall`
      );
    }

    return errors;
  }

  /**
   * Get grid statistics
   * Generic function that works with any objects that have the required properties
   */
  static getGridStats(
    mullions: Array<{
      isActive: boolean;
      length: string | number;
      gridType?: string;
    }>,
    glassPanels: Array<{
      isActive: boolean;
      width: string | number;
      height: string | number;
      isTransom?: boolean;
    }>
  ) {
    const activeMullions = mullions.filter((m) => m.isActive);
    const activeGlassPanels = glassPanels.filter((p) => p.isActive);

    return {
      totalMullions: activeMullions.length,
      totalGlassPanels: activeGlassPanels.length,
      totalMullionLength: this.calculateTotalMullionLength(activeMullions),
      totalGlassArea: this.calculateTotalGlassArea(activeGlassPanels),
      mullionsByType: activeMullions.reduce((acc, mullion) => {
        const type = mullion.gridType || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      transomPanels: activeGlassPanels.filter((p) => p.isTransom).length,
      standardPanels: activeGlassPanels.filter((p) => !p.isTransom).length,
    };
  }
}
